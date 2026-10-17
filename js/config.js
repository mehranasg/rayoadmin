(function(){
'use strict';

/*
  Rayo API gateway v10.10.0
  - APIهای معتبر: RayoData/Load، RayoData/Save، RayoData/Query و RayoData/Mutate.
  - تمام درخواست‌ها حتما QueryString با نام module دارند.
  - داده عملیاتی هرگز از فایل JSON روی هاست به عنوان fallback خوانده نمی‌شود.
  - فایل‌های Seed فقط با اقدام صریح مدیر برای مقداردهی اولیه یا Reset استفاده می‌شوند؛ Load عادی هرگز Seed را نمی‌خواند یا روی API نمی‌نویسد.
*/
const ENV=window.RAYO_ENV||{};
const API_ORIGIN=String(ENV.API_ORIGIN||'').replace(/\/$/,'');
if(!API_ORIGIN)throw new Error('RAYO_ENV.API_ORIGIN تعریف نشده است؛ js/app-config.js باید قبل از config.js بارگذاری شود.');
const API_ROOT=`${API_ORIGIN}${ENV.API_PREFIX||'/api/v1.0'}${ENV.API_CONTROLLER||'/RayoData'}`;
const LOAD_URL=`${API_ROOT}/Load`;
const SAVE_URL=`${API_ROOT}/Save`;
const QUERY_URL=`${API_ROOT}/Query`;
const MUTATE_URL=`${API_ROOT}/Mutate`;
const TIMEOUT_MS=Number(ENV.TIMEOUT_MS)||25000;
const BACKEND_MODULES={
  hr:'personnel',
  suppliers:'suppliers',
  pricing:'pricing',
  inventory:'inventory',
  cashreport:'cashreport',
  assets:'assets',
  finance:'finance',
  survey:'survey',
  errorlog:'errorlog',
  sepidsaudit:'sepidsaudit'
};
const SUPPORTED_MODULES=Object.keys(BACKEND_MODULES);
const MODULE_RUNTIME_STATUS=Object.fromEntries(SUPPORTED_MODULES.map(m=>[m,{state:'idle',initialized:null,lastError:'',lastSuccessAt:null,sourceValid:false,readOnly:true}]));
const MODULE_LOAD_PROMISES=new Map();
const QUERY_PROMISES=new Map();
const MODULE_VERSIONS=Object.create(null);
const SEED_OBJECTS=new WeakSet();
window.RAYO_SEED_POLICY='manual-initialize-or-reset-only';
function currentPageFile(){return (location.pathname.split('/').pop()||'index.html').toLowerCase()}
function frontendModuleName(module){
  const name=String(module||'').trim();
  if(SUPPORTED_MODULES.includes(name))return name;
  const found=SUPPORTED_MODULES.find(key=>BACKEND_MODULES[key]===name);
  if(found)return found;
  if(typeof RayoApiError==='function')throw new RayoApiError({code:'invalid_module',message:`نام ماژول نامعتبر است: ${module}`});
  throw new Error(`نام ماژول نامعتبر است: ${module}`);
}
function setModuleStatus(module,state,error=''){
  const key=frontendModuleName(module),s=MODULE_RUNTIME_STATUS[key]||(MODULE_RUNTIME_STATUS[key]={});
  s.state=state;s.lastError=error?String(error?.message||error):'';
  if(state==='ready'){s.lastSuccessAt=new Date().toISOString();s.sourceValid=true;s.readOnly=false}
  else if(state==='error'||state==='conflict'){s.sourceValid=false;s.readOnly=true}
}
const MODULE_ALIASES={
  hr:['hr','humanResources','personnelPayroll','main','initialData','personnel','personel'],
  suppliers:['suppliers','supplier','suppliersModule','supplierModule','supplierData','suppliersData'],
  pricing:['pricing','price','costing','pricingData','costData'],
  inventory:['inventory','warehouse','variance','inventoryData','stockData'],
  cashreport:['cashreport','cashReport','cashReports','dailyCash','dailyCashReport','cashierReport','cashbox'],
  assets:['assets','asset','assetManagement','assetsData','fixedAssets','propertyAssets','amval'],
  finance:['finance','financial','profitLoss','pnl','monthlyFinance','financeData'],
  survey:['survey','surveys','customerSurvey','customerFeedback','feedback','surveyData'],
  errorlog:['errorlog','errorLog','errors','errorLogs','rayoErrorLog'],
  sepidsaudit:['sepidsaudit','sepidsAudit','audit','posAudit','cashAudit','sepidsControl']
};

const MODULE_FIELDS={
  hr:{arrays:['personnel','weeklyPlans','monthlyPlans','shiftRecords','monthlyAdjustments','tipGroups','penaltiesRewards','delays','payments','consumptions','leaves','leaveRequests','payrollClosures','staffingRequirements','holidays','changeLog'],objects:['meta','lists','settings','salaryModel','floorMap']},
  suppliers:{arrays:['suppliers','items','supplierItems','purchaseRequests','changeLog'],objects:['meta','lists']},
  pricing:{arrays:['ingredients','menuItems','recipes','recipeVersions','priceHistory','ingredientPriceHistory','changeLog'],objects:['meta','settings','lists']},
  inventory:{arrays:['trackedIngredients','periods','itemMappings','changeLog','purchaseInvoices','supplierPayments','stockReceipts','wasteRecords','wasteShiftDeclarations','consumptionRecords','salesPeriods','stocktakes','locations','openingBalances','inventoryMovements','periodClosures','operationalUsagePeriods','operationalConsumptionProfiles'],objects:['meta','settings']},
  cashreport:{arrays:['cashiers','transferAccounts','cashRecipients','reports','changeLog'],objects:['meta','settings','salesAnalytics']},
  assets:{arrays:['assets','maintenanceRecords','quantityTransactions','assetIncidents','counts','changeLog'],objects:['meta','settings','lists']},
  finance:{arrays:['entries','monthlyOverrides','changeLog'],objects:['meta','settings']},
  survey:{arrays:['responses','changeLog'],objects:['meta','settings']},
  errorlog:{arrays:['entries'],objects:['meta']},
  sepidsaudit:{arrays:['importBatches','rawBlocks','events','eventItems','changes','alerts','reviews','links'],objects:['meta','settings']}
};

const MODULE_DEFAULTS={
  suppliers:{
    meta:{schemaVersion:'1.0.0',module:'Rayo Suppliers',restaurant:'کافه‌رستوران رایو',currency:'تومان',updatedAt:null},
    lists:{},suppliers:[],items:[],supplierItems:[],purchaseRequests:[],changeLog:[]
  },
  pricing:{
    meta:{schemaVersion:'1.0.0',module:'Rayo Pricing',restaurant:'کافه‌رستوران رایو',currency:'تومان',updatedAt:null},
    settings:{},lists:{},ingredients:[],menuItems:[],recipes:[],recipeVersions:[],priceHistory:[],ingredientPriceHistory:[],changeLog:[]
  },
  inventory:{
    meta:{schemaVersion:'1.0.0',module:'Rayo Inventory',restaurant:'کافه‌رستوران رایو',currency:'تومان',updatedAt:null},
    settings:{mainLocationId:'LOC-MAIN',defaultSalesLocationId:'LOC-KITCHEN',costMethod:'WEIGHTED_AVERAGE',countApprovalRequired:true,varianceAlertPercent:5,varianceAlertValueToman:500000,paymentLocations:[{id:'PAYLOC-001',name:'حساب جاری پارسیان',type:'bank',isActive:true,notes:''},{id:'PAYLOC-002',name:'حساب پارسیان کوتاه‌مدت / تنخواه',type:'bank',isActive:true,notes:''},{id:'PAYLOC-003',name:'صندوق نقدی',type:'cash',isActive:true,notes:''},{id:'PAYLOC-004',name:'تنخواه صندوقدار',type:'petty-cash',isActive:true,notes:''},{id:'PAYLOC-005',name:'کارت/حساب دیگر',type:'other',isActive:true,notes:''}]},trackedIngredients:[],periods:[],itemMappings:[],changeLog:[],purchaseInvoices:[],supplierPayments:[],stockReceipts:[],wasteRecords:[],wasteShiftDeclarations:[],consumptionRecords:[],salesPeriods:[],stocktakes:[],locations:[{id:'LOC-MAIN',code:'MAIN',name:'انبار اصلی',type:'main',section:'انبار',isActive:true,notes:''},{id:'LOC-KITCHEN',code:'KITCHEN',name:'آشپزخانه',type:'section',section:'آشپزخانه',isActive:true,notes:''},{id:'LOC-BAR',code:'BAR',name:'بار',type:'section',section:'بار',isActive:true,notes:''},{id:'LOC-HOOKAH',code:'HOOKAH',name:'قلیان',type:'section',section:'قلیان',isActive:true,notes:''},{id:'LOC-HALL',code:'HALL',name:'سالن / سرویس',type:'section',section:'سالن',isActive:true,notes:''}],openingBalances:[],inventoryMovements:[],periodClosures:[]
  },
  cashreport:{
    meta:{schemaVersion:'1.0.0',module:'Rayo Cash Report',restaurant:'کافه‌رستوران رایو',currency:'ریال',updatedAt:null},
    settings:{inputCurrency:'ریال',displayCurrency:'تومان',discrepancyLimit:1000000,otherTransactionTypeOverrides:{},otherTransactionTypesCustom:[]},salesAnalytics:{daily:[],monthly:[],itemDaily:[]},cashiers:[],transferAccounts:[],cashRecipients:[],reports:[],changeLog:[]
  },
  assets:{
    meta:{schemaVersion:'1.0.0',module:'Rayo Assets',restaurant:'کافه‌رستوران رایو',currency:'تومان',updatedAt:null},
    settings:{maintenanceWarningDays:14,showLowStockOnDashboard:true,showMaintenanceOnDashboard:true,baseExchangeRateToman:190000,currentExchangeRateToman:190000,valuationBaseDate:'1405/05/20',valuationUpdatedAt:'1405/05/20'},lists:{},assets:[],maintenanceRecords:[],quantityTransactions:[],assetIncidents:[],counts:[],changeLog:[]
  },
  finance:{
    meta:{schemaVersion:'1.0.0',module:'Rayo Finance',restaurant:'کافه‌رستوران رایو',currency:'تومان',updatedAt:null},
    settings:{vatPercent:10,performanceTaxPercent:5,expenseCategories:['آب','برق','گاز','اجاره','شهرداری','جریمه','بیمه','پیک و آژانس','تعمیر و نگهداری','مواد مصرفی','خدمات','سایر'],incomeCategories:['سایر درآمد'],calculatorDefaults:{sales:3000000000,purchasePercent:35,payroll:700000000,rent:300000000,management:110000000,utilities:100000000,maintenance:100000000,vatPercent:10,performanceTaxPercent:5}},
    entries:[],monthlyOverrides:[],changeLog:[]
  },
  survey:{
    meta:{schemaVersion:'1.0.0',module:'Rayo Customer Survey',restaurant:'کافه‌رستوران رایو',updatedAt:null},
    settings:{serviceChannels:['سالن','حضوری','بیرون‌بر','اسنپ'],satisfactionLevels:['خیلی راضی','راضی','متوسط','ناراضی','خیلی ناراضی'],satisfactionReasons:['کیفیت غذا','طعم','برخورد پرسنل','سرعت سرویس','فضا و محیط','نظافت','ارزش خرید','سایر'],dissatisfactionReasons:['کیفیت غذا','طعم','تاخیر در سرویس','برخورد پرسنل','اشتباه سفارش','قیمت','نظافت','فضا و محیط','بسته‌بندی','سایر']},
    responses:[],changeLog:[]
  },
  errorlog:{
    meta:{schemaVersion:'1.0.0',module:'Rayo Error Log',restaurant:'کافه‌رستوران رایو',updatedAt:null},entries:[]
  },
  sepidsaudit:{
    meta:{schemaVersion:'1.0.0',module:'Rayo Sepidz Audit',restaurant:'کافه‌رستوران رایو',currency:'تومان',updatedAt:null},
    settings:{sourceCurrency:'ریال',currencyDivisor:10,deletedAmountThresholdToman:5000000,lateDeleteMinutes:20,repeatEditThreshold:2,riskHigh:60,riskCritical:80,highRiskMenuItemIds:[],menuAliases:{}},
    importBatches:[],rawBlocks:[],events:[],eventItems:[],changes:[],alerts:[],reviews:[],links:[]
  }
};

function isObject(x){return !!x&&typeof x==='object'&&!Array.isArray(x)}
function clone(x){return JSON.parse(JSON.stringify(x))}
function unique(arr){return [...new Set((arr||[]).filter(Boolean))]}
function appendQuery(url,key,value){const sep=url.includes('?')?'&':'?';return `${url}${sep}${encodeURIComponent(key)}=${encodeURIComponent(value)}`}
function backendModuleName(module){
  return BACKEND_MODULES[frontendModuleName(module)];
}
function moduleLoadUrl(module){return appendQuery(LOAD_URL,'module',backendModuleName(module))}
function moduleSaveUrl(module){return appendQuery(SAVE_URL,'module',backendModuleName(module))}
function rememberModuleVersion(module,value){
  const version=Number(value);
  if(Number.isFinite(version)&&version>=0)MODULE_VERSIONS[backendModuleName(module)]=version;
  return Number.isFinite(version)&&version>=0?version:null;
}
function moduleVersion(module){
  const value=MODULE_VERSIONS[backendModuleName(module)];
  return Number.isFinite(value)?value:null;
}

class RayoApiError extends Error{
  constructor({status=0,code='api_error',message='خطا در ارتباط با API',response=null,url='',method='',cause=null}={}){
    super(String(message||'خطا در ارتباط با API'));
    this.name=code==='version_conflict'?'RayoVersionConflictError':'RayoApiError';
    this.status=Number(status)||0;this.code=String(code||'api_error');this.response=response;this.url=url;this.method=method;
    if(cause)this.cause=cause;
  }
}
function responseErrorInfo(payload,text=''){
  const x=isObject(payload)?payload:{};
  return{code:String(ciGet(x,'code')??ciGet(x,'errorCode')??ciGet(x,'error')??'api_error'),message:String(ciGet(x,'message')??ciGet(x,'errorMessage')??ciGet(x,'title')??text??'خطا در ارتباط با API')};
}
function stableStringify(value){
  if(Array.isArray(value))return`[${value.map(stableStringify).join(',')}]`;
  if(isObject(value))return`{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
function requestId(){
  if(globalThis.crypto?.randomUUID)return globalThis.crypto.randomUUID();
  if(!globalThis.crypto?.getRandomValues)throw new Error('مرورگر امکان تولید امن requestId را ندارد.');
  const bytes=new Uint8Array(16);globalThis.crypto.getRandomValues(bytes);bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const hex=[...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');
  return`${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

function parseJsonString(value){
  let x=value;
  for(let i=0;i<8&&typeof x==='string';i++){
    const t=x.trim();
    if(!t)return x;
    try{x=JSON.parse(t)}catch(_){return x}
  }
  return x;
}
function ciKey(obj,name){
  if(!isObject(obj))return null;
  const target=String(name).toLowerCase();
  return Object.keys(obj).find(k=>String(k).toLowerCase()===target)||null;
}
function ciGet(obj,name){const k=ciKey(obj,name);return k===null?undefined:obj[k]}
function arrayValue(value){
  let x=parseJsonString(value);
  if(Array.isArray(x))return x;
  if(isObject(x)){
    const values=ciGet(x,'$values')??ciGet(x,'values')??ciGet(x,'items');
    if(Array.isArray(values))return values;
  }
  return null;
}
function objectValue(value){const x=parseJsonString(value);return isObject(x)?x:null}
function moduleNameMatches(value,module){
  const normalized=String(value??'').toLowerCase().replace(/[^a-z]/g,'');
  if(!normalized)return false;
  return (MODULE_ALIASES[module]||[module]).some(a=>{
    const alias=String(a).toLowerCase().replace(/[^a-z]/g,'');
    return alias&&normalized.includes(alias);
  });
}
function recognizedScore(obj,module){
  if(!isObject(obj))return -1;
  const fields=MODULE_FIELDS[module];
  if(!fields)return -1;
  let score=0;
  for(const key of fields.arrays){
    const value=ciGet(obj,key);
    if(value!==undefined)score+=arrayValue(value)!==null?4:1;
  }
  for(const key of fields.objects){
    const value=ciGet(obj,key);
    if(value!==undefined)score+=objectValue(value)!==null?2:1;
  }
  const moduleValue=ciGet(obj,'module')??ciGet(ciGet(obj,'meta'),'module')??ciGet(obj,'moduleName');
  if(moduleNameMatches(moduleValue,module))score+=5;
  return score;
}
function collectCandidates(payload,module){
  const queue=[{value:payload,depth:0}],seen=new Set(),out=[];
  const preferred=['data','result','value','payload','content','json','jsonData','fileData','body','response','model'];
  const aliases=MODULE_ALIASES[module]||[module];
  while(queue.length){
    const {value,depth}=queue.shift();
    if(depth>7)continue;
    let x=parseJsonString(value);
    if(!isObject(x))continue;
    if(seen.has(x))continue;
    seen.add(x);out.push(x);
    const names=[...aliases,...preferred,'modules','moduleData','dataByModule'];
    for(const name of names){
      const child=ciGet(x,name);
      if(child!==undefined&&child!==null)queue.unshift({value:child,depth:depth+1});
    }
    // Some ASP.NET responses use an unknown DTO property. Inspect shallow object/string children too.
    for(const child of Object.values(x)){
      if(isObject(child)||typeof child==='string')queue.push({value:child,depth:depth+1});
    }
  }
  return out;
}
function extractModule(payload,module){
  const candidates=collectCandidates(payload,module);
  if(!candidates.length)return parseJsonString(payload);
  let best=candidates[0],bestScore=recognizedScore(best,module);
  for(const candidate of candidates.slice(1)){
    const score=recognizedScore(candidate,module);
    if(score>bestScore){best=candidate;bestScore=score}
  }
  return best;
}
function emptyModuleShape(module){
  const fields=MODULE_FIELDS[module];
  if(!fields)return {};
  const out={};
  for(const key of fields.arrays)out[key]=[];
  for(const key of fields.objects)out[key]={};
  return out;
}
function rawModuleInitialized(value){
  if(!isObject(value))return false;
  const meta=objectValue(ciGet(value,'meta'));
  if(meta?.initialized===false)return false;
  if(meta?.initialized===true)return true;
  return Object.keys(value).length>0;
}
function canonicalizeObject(source,module){
  const fields=MODULE_FIELDS[module];
  if(!fields)return source;
  if(!isObject(source)||Object.keys(source).length===0)return emptyModuleShape(module);
  const defaults=MODULE_DEFAULTS[module]?clone(MODULE_DEFAULTS[module]):{};
  const result={...defaults,...source};
  for(const key of fields.arrays){
    const value=ciGet(source,key);
    result[key]=arrayValue(value)??arrayValue(defaults[key])??[];
  }
  for(const key of fields.objects){
    const value=objectValue(ciGet(source,key));
    result[key]={...(isObject(defaults[key])?defaults[key]:{}),...(value||{})};
  }
  return result;
}
function looksLikeModule(value,module){
  const x=extractModule(value,module);
  if(!isObject(x))return false;
  if(module==='hr')return recognizedScore(x,module)>=4;
  return recognizedScore(x,module)>=2||Object.keys(x).length===0;
}
function normalizeModule(payload,module){
  const x=extractModule(payload,module);
  if(!isObject(x))throw new Error(`ساختار JSON ماژول ${module} معتبر نیست: پاسخ از نوع شیء نیست`);
  const backendClass=ciGet(x,'ClassName')??ciGet(x,'ExceptionType');
  const backendMessage=ciGet(x,'Message')??ciGet(x,'ExceptionMessage');
  const hasExceptionFields=Object.keys(x).some(k=>['stacktracestring','remotestacktracestring','innerexception','helplink','remoteStackIndex'].map(v=>v.toLowerCase()).includes(String(k).toLowerCase()));
  if(backendClass||hasExceptionFields){
    if(module==='cashreport')throw new Error(`ماژول cashreport در Backend ثبت نشده است${backendMessage?`: ${backendMessage}`:''}`);
    throw new Error(`خطای Backend در ماژول ${module}${backendMessage?`: ${backendMessage}`:''}`);
  }
  const score=recognizedScore(x,module);
  if(module==='hr'){
    if(Object.keys(x).length===0)return x;
    if(score<4)throw new Error(`ساختار JSON ماژول ${module} معتبر نیست`);
    return x;
  }
  // Empty module files are initialized safely. Objects that only contain an error/message are rejected.
  const keys=Object.keys(x);
  const onlyMessage=keys.length>0&&keys.every(k=>['message','error','status','success','code'].includes(k.toLowerCase()));
  if((score<2&&keys.length>0)||onlyMessage){
    const shown=keys.slice(0,8).join('، ')||'بدون کلید';
    throw new Error(`ساختار JSON ماژول ${module} معتبر نیست. کلیدهای دریافتی: ${shown}`);
  }
  return canonicalizeObject(x,module);
}

async function fetchTimeout(url,options={},timeoutMs=TIMEOUT_MS){
  const controller=new AbortController();
  const externalSignal=options.signal;
  const abort=()=>controller.abort(externalSignal?.reason);
  if(externalSignal?.aborted)abort();else externalSignal?.addEventListener?.('abort',abort,{once:true});
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetch(url,{...options,signal:controller.signal,cache:'no-store',credentials:'omit'});
  }catch(error){
    if(error?.name==='AbortError')throw new RayoApiError({status:0,code:externalSignal?.aborted?'request_aborted':'timeout',message:externalSignal?.aborted?'درخواست لغو شد':'مهلت ارتباط با API پایان یافت',url,method:options.method||'GET',cause:error});
    if(String(error?.message||'').toLowerCase().includes('failed to fetch'))throw new RayoApiError({status:0,code:'network_error',message:'CORS یا ارتباط شبکه',url,method:options.method||'GET',cause:error});
    throw error;
  }finally{clearTimeout(timer);externalSignal?.removeEventListener?.('abort',abort)}
}
async function responsePayload(response,url='',method='GET'){
  const text=await response.text();
  const parsed=text.trim()?parseJsonString(text):null;
  if(!response.ok){const info=responseErrorInfo(parsed,text.trim().slice(0,500)),code=response.status===409&&info.code==='api_error'?'version_conflict':info.code;throw new RayoApiError({status:response.status,code,message:info.message||`HTTP ${response.status}`,response:parsed??text,url,method})}
  if(!text.trim())throw new RayoApiError({status:response.status,code:'empty_response',message:'پاسخ خالی',response:null,url,method});
  if(typeof parsed==='string')throw new RayoApiError({status:response.status,code:'invalid_json',message:`پاسخ JSON معتبر نیست: ${parsed.slice(0,160)}`,response:parsed,url,method});
  return parsed;
}
async function loadModule(module){
  const moduleKey=frontendModuleName(module),backend=backendModuleName(moduleKey);
  if(MODULE_LOAD_PROMISES.has(moduleKey))return MODULE_LOAD_PROMISES.get(moduleKey);
  const task=(async()=>{
    setModuleStatus(moduleKey,'loading');
    let lastError=null;
    for(const wait of [0,700]){
      if(wait)await new Promise(r=>setTimeout(r,wait));
      try{
        const url=appendQuery(moduleLoadUrl(moduleKey),'_',Date.now());
        const response=await fetchTimeout(url,{method:'GET',headers:{'Accept':'application/json'}});
        const payload=await responsePayload(response,url,'GET');
        const raw=extractModule(payload,moduleKey);
        const value=normalizeModule(payload,moduleKey);
        setModuleStatus(moduleKey,'ready');
        MODULE_RUNTIME_STATUS[moduleKey].initialized=rawModuleInitialized(raw);
        rememberModuleVersion(backend,ciGet(payload,'version')??ciGet(raw,'version')??ciGet(ciGet(raw,'meta'),'version'));
        return value;
      }catch(error){
        lastError=error;
        const msg=String(error?.message||error||'');
        if(error?.status!==500&&!msg.includes('HTTP 500'))break;
      }
    }
    const wrapped=lastError instanceof RayoApiError?lastError:new RayoApiError({code:'load_failed',message:`ماژول ${backend}: ${String(lastError?.message||lastError||'خطا در دریافت اطلاعات')}`,response:lastError});
    setModuleStatus(moduleKey,'error',wrapped);
    throw wrapped;
  })();
  MODULE_LOAD_PROMISES.set(moduleKey,task);
  try{return await task}finally{MODULE_LOAD_PROMISES.delete(moduleKey)}
}

function rayoSetSaveStatus(kind,text,module=''){
  const el=document.getElementById('saveStatus');
  if(!el||module==='errorlog')return;
  el.classList.remove('save-status-idle','save-status-dirty','save-status-saving','save-status-verifying','save-status-verified','save-status-warning','save-status-error');
  el.classList.add(`save-status-${kind||'idle'}`);
  el.textContent=text||'—';
  el.dataset.saveState=kind||'idle';
}
window.RayoSaveStatus={
  set:rayoSetSaveStatus,
  dirty:(module='')=>rayoSetSaveStatus('dirty','● تغییرات هنوز روی سرور تأیید نشده‌اند',module),
  saving:(module='')=>rayoSetSaveStatus('saving','● در حال ذخیره روی سرور…',module),
  verifying:(module='')=>rayoSetSaveStatus('verifying','● ارسال شد؛ در حال تأیید نسخه سرور…',module),
  verified:(module='')=>rayoSetSaveStatus('verified',`● ذخیره و تأییدشده روی سرور — ${new Date().toLocaleTimeString('fa-IR')}`,module),
  warning:(module='',msg='')=>rayoSetSaveStatus('warning',`● ارسال شد اما تأیید سرور انجام نشد${msg?` — ${msg}`:''}`,module),
  error:(module='',msg='')=>rayoSetSaveStatus('error',`● ذخیره ناموفق${msg?` — ${msg}`:''}`,module)
};

async function postJson(url,data){
  const response=await fetchTimeout(url,{
    method:'POST',
    headers:{'Content-Type':'application/json; charset=utf-8','Accept':'application/json, text/plain, */*'},
    body:JSON.stringify(data)
  });
  const text=await response.text();
  if(!response.ok){const parsed=text.trim()?parseJsonString(text):null,info=responseErrorInfo(parsed,text.trim().slice(0,500));throw new RayoApiError({status:response.status,code:info.code,message:info.message||`HTTP ${response.status}`,response:parsed??text,url,method:'POST'})}
  return text;
}

function responseObject(payload,requiredKey=''){
  const queue=[payload],seen=new Set();
  while(queue.length){const value=parseJsonString(queue.shift());if(!isObject(value)||seen.has(value))continue;seen.add(value);if(!requiredKey||ciGet(value,requiredKey)!==undefined)return value;for(const key of ['data','result','value','payload','response']){const child=ciGet(value,key);if(child!==undefined)queue.push(child)}}
  return isObject(payload)?payload:{};
}
async function queryCollection(options={}){
  if(!isObject(options))throw new RayoApiError({code:'invalid_query',message:'تنظیمات Query باید یک شیء باشد.'});
  const moduleKey=frontendModuleName(options.module),module=backendModuleName(moduleKey),collection=String(options.collection||'').trim();
  if(!collection)throw new RayoApiError({code:'invalid_collection',message:'نام Collection برای Query الزامی است.'});
  const page=Math.max(1,Math.trunc(Number(options.page)||1)),pageSize=Math.min(500,Math.max(1,Math.trunc(Number(options.pageSize)||100)));
  const request={module,collection,filters:isObject(options.filters)?options.filters:{},dateField:String(options.dateField||''),from:String(options.from||''),to:String(options.to||''),sortBy:String(options.sortBy||''),descending:options.descending===true,includeArchived:options.includeArchived===true,page,pageSize};
  const key=stableStringify(request);
  if(QUERY_PROMISES.has(key))return QUERY_PROMISES.get(key);
  const task=(async()=>{try{const response=await fetchTimeout(QUERY_URL,{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','Accept':'application/json'},body:JSON.stringify(request),signal:options.signal});const payload=await responsePayload(response,QUERY_URL,'POST'),result=responseObject(payload,'items'),items=arrayValue(ciGet(result,'items'));if(!items)throw new RayoApiError({status:response.status,code:'invalid_query_response',message:'پاسخ Query فاقد items معتبر است.',response:payload,url:QUERY_URL,method:'POST'});rememberModuleVersion(module,ciGet(result,'version')??ciGet(payload,'version'));setModuleStatus(moduleKey,'ready');return{items,page:Number(ciGet(result,'page'))||page,pageSize:Number(ciGet(result,'pageSize'))||pageSize,total:Number(ciGet(result,'total'))||0,totalPages:Number(ciGet(result,'totalPages'))||0,version:moduleVersion(module),updatedAt:ciGet(result,'updatedAt')??null}}catch(error){setModuleStatus(moduleKey,'error',error);throw error}})();
  QUERY_PROMISES.set(key,task);try{return await task}finally{QUERY_PROMISES.delete(key)}
}
async function mutateRecord(options={}){
  if(!isObject(options))throw new RayoApiError({code:'invalid_mutation',message:'تنظیمات Mutate باید یک شیء باشد.'});
  const moduleKey=frontendModuleName(options.module),module=backendModuleName(moduleKey),collection=String(options.collection||'').trim(),operation=String(options.operation||'').trim();
  if(!collection)throw new RayoApiError({code:'invalid_collection',message:'نام Collection برای Mutate الزامی است.'});
  if(!['insert','update','upsert','archive'].includes(operation))throw new RayoApiError({code:'invalid_operation',message:'عملیات Mutate معتبر نیست.'});
  const expectedVersion=options.expectedVersion===undefined?moduleVersion(module):Number(options.expectedVersion);
  if(!Number.isFinite(expectedVersion)||expectedVersion<0)throw new RayoApiError({code:'version_unavailable',message:`نسخه ماژول ${module} در حافظه موجود نیست؛ ابتدا Query یا Load معتبر انجام دهید.`});
  const request={module,collection,operation,recordId:String(options.recordId||''),idField:String(options.idField||'id'),expectedVersion,requestId:String(options.requestId||requestId()),data:isObject(options.data)?options.data:{}};
  try{const response=await fetchTimeout(MUTATE_URL,{method:'POST',headers:{'Content-Type':'application/json; charset=utf-8','Accept':'application/json'},body:JSON.stringify(request),signal:options.signal});const payload=await responsePayload(response,MUTATE_URL,'POST'),result=responseObject(payload,'version');rememberModuleVersion(module,ciGet(result,'version')??ciGet(payload,'version'));setModuleStatus(moduleKey,'ready');return result}catch(error){if(error instanceof RayoApiError&&error.status===409){error.code='version_conflict';error.name='RayoVersionConflictError';setModuleStatus(moduleKey,'conflict',error)}throw error}
}
function verificationMatches(sent,received){
  const sentToken=sent?.meta?.serverSaveToken;
  const receivedToken=received?.meta?.serverSaveToken;
  if(sentToken)return !!receivedToken&&sentToken===receivedToken;
  const sentTime=sent?.meta?.updatedAt;
  const receivedTime=received?.meta?.updatedAt;
  if(sentTime)return !!receivedTime&&sentTime===receivedTime;
  return false;
}
async function verifySavedModule(module,data){
  let lastError=null;
  for(const wait of [500,1500,3000]){
    if(wait)await new Promise(r=>setTimeout(r,wait));
    try{
      const checked=await loadModule(module);
      if(verificationMatches(data,checked))return{checked,verified:true};
      lastError=new Error('تأیید نسخه سرور هنوز همگام نشده است');
    }catch(error){lastError=error}
  }
  // Verification is mandatory for normal saves; return a warning so saveModule can fail safely.
  try{window.RayoErrorLog?.capture?.(lastError||new Error('تأیید نسخه سرور با تأخیر انجام می‌شود'),{source:'save-verify',module,severity:'warning'})}catch(_){ }
  return{checked:null,verified:false,warning:lastError?.message||'تأیید نسخه سرور با تأخیر انجام می‌شود'};
}
async function saveModule(module,data,{verify=true,allowSeedWrite=false,allowUnconfirmedWrite=false,allowInitialize=false}={}){
  const moduleKey=frontendModuleName(module),backend=backendModuleName(moduleKey);
  if(SEED_OBJECTS.has(data)&&!allowSeedWrite)throw new Error('ذخیره خودکار Seed مسدود شد؛ Seed فقط از مسیر صریح «بارگذاری اولیه» یا «بازنشانی اطلاعات» توسط مدیر مجاز است.');
  const liveConfirmed=MODULE_RUNTIME_STATUS[moduleKey]?.state==='ready';
  const initialized=MODULE_RUNTIME_STATUS[moduleKey]?.initialized===true;
  if(moduleKey!=='errorlog'&&!liveConfirmed&&!allowUnconfirmedWrite)throw new Error(`ذخیره ${backend} مسدود شد: نسخه زنده این ماژول در این نشست از سرور با موفقیت Load نشده است. ابتدا بروزرسانی/Load سرور را انجام دهید.`);
  if(moduleKey!=='errorlog'&&!initialized&&!allowInitialize)throw new Error(`ذخیره ${backend} مسدود شد: این ماژول هنوز مقداردهی اولیه نشده است. از تنظیمات ← «بارگذاری اطلاعات اولیه» استفاده کنید.`);
  if(!isObject(data))throw new Error(`ساختار داده ${backend} برای ذخیره معتبر نیست.`);
  data.meta=isObject(data.meta)?data.meta:{};
  data.meta.serverSaveToken=`${backend.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  data.meta.updatedAt=new Date().toISOString();
  const url=moduleSaveUrl(moduleKey);
  try{
    window.RayoSaveStatus?.saving?.(moduleKey);
    await postJson(url,data);
    if(!verify){
      if(moduleKey!=='errorlog')rayoSetSaveStatus('verified',`● ارسال به سرور انجام شد — ${new Date().toLocaleTimeString('fa-IR')} (بدون بازخوانی تأییدی)`,moduleKey);
      return{ok:true,verified:null,verificationSkipped:true};
    }
    window.RayoSaveStatus?.verifying?.(moduleKey);
    const result=await verifySavedModule(moduleKey,data);
    if(result?.verified){
      window.RayoSaveStatus?.verified?.(moduleKey);
      return{ok:true,verified:true,checked:result.checked};
    }
    const msg=result?.warning||'تأیید نسخه سرور انجام نشد';
    window.RayoSaveStatus?.warning?.(moduleKey,msg);
    const err=new Error(`ارسال انجام شد اما ذخیره روی سرور تأیید نشد. اطلاعات این صفحه را نبندید. ${msg}`);
    try{window.RayoErrorLog?.capture?.(err,{source:'save-verify-required',module:moduleKey,severity:'error'})}catch(_){ }
    throw err;
  }catch(error){
    if(!String(error?.message||'').includes('اطلاعات این صفحه را نبندید'))window.RayoSaveStatus?.error?.(moduleKey,String(error?.message||error||''));
    throw error;
  }
}
function moduleHasBusinessData(module,data){
  if(!isObject(data))return false;
  const fields=MODULE_FIELDS[module];
  if(!fields)return Object.keys(data).length>0;
  return fields.arrays.some(k=>Array.isArray(data[k])&&data[k].length>0);
}
function seedConfig(module){return window.RAYO_CONFIG?.[module]?.seed||null}
async function loadSeedFile(module,url){
  if(!url)throw new Error('فایل Seed تعریف نشده است');
  const response=await fetch(appendQuery(url,'_',Date.now()),{cache:'no-store',headers:{'Accept':'application/json'}});
  const value=normalizeModule(await responsePayload(response),module);
  if(isObject(value))SEED_OBJECTS.add(value);
  return value;
}
function mergeByKey(currentRows,seedRows,keyFn,{seedWins=true}={}){
  const map=new Map();
  for(const row of Array.isArray(currentRows)?currentRows:[]){const k=keyFn(row);if(k)map.set(k,clone(row))}
  for(const row of Array.isArray(seedRows)?seedRows:[]){const k=keyFn(row);if(!k)continue;const old=map.get(k);map.set(k,old?seedWins?{...old,...clone(row)}:{...clone(row),...old}:clone(row))}
  return [...map.values()];
}
function mergePricingSeed(current,seed){
  const out=canonicalizeObject(current,'pricing'),incoming=canonicalizeObject(seed,'pricing');
  const mergeExternal=(currentRows,seedRows,keyFn,externalFields)=>{const map=new Map();for(const row of Array.isArray(currentRows)?currentRows:[]){const k=keyFn(row);if(k)map.set(k,clone(row))}for(const row of Array.isArray(seedRows)?seedRows:[]){const k=keyFn(row);if(!k)continue;const old=map.get(k);if(!old){map.set(k,clone(row));continue}const next={...old};for(const f of externalFields)if(Object.prototype.hasOwnProperty.call(row,f))next[f]=clone(row[f]);next.id=old.id||row.id;map.set(k,next)}return [...map.values()]};
  out.ingredients=mergeExternal(out.ingredients,incoming.ingredients,x=>String(x?.code||x?.id||''),['code','name','category','purchaseUnit','recipeUnit','packageQuantity','lastPurchasePriceToman','status','sepids']);
  out.menuItems=mergeExternal(out.menuItems,incoming.menuItems,x=>String(x?.code||x?.id||''),['code','name','category','currentPriceToman','status','unit','siteStatus','sepids']);
  out.recipes=mergeByKey(out.recipes,incoming.recipes,x=>`${x?.menuItemId||''}|${x?.ingredientId||''}`,{seedWins:incoming.meta?.recipeSeedWins!==false});
  out.ingredientPriceHistory=mergeByKey(out.ingredientPriceHistory,incoming.ingredientPriceHistory,x=>String(x?.id||`${x?.ingredientId||''}|${x?.date||''}|${x?.priceToman||''}`),{seedWins:false});
  out.lists={...out.lists,menuCategories:unique([...(out.lists?.menuCategories||[]),...(incoming.lists?.menuCategories||[])]),ingredientCategories:unique([...(out.lists?.ingredientCategories||[]),...(incoming.lists?.ingredientCategories||[])]),units:unique([...(out.lists?.units||[]),...(incoming.lists?.units||[])]),statuses:unique([...(out.lists?.statuses||[]),...(incoming.lists?.statuses||[])])};
  out.settings={...incoming.settings,...out.settings,categoryTargets:{...(incoming.settings?.categoryTargets||{}),...(out.settings?.categoryTargets||{})}};return out;
}
async function applySeedMigration(module,current,seedCfg){
  // Disabled by data-safety policy. Seed migrations must never run/write during normal application load.
  // Historical function is kept only for compatibility with older code references.
  return current;
}
function bootstrapEligible(error){
  const m=String(error?.message||error||'').toLowerCase();
  return m.includes('http 404')||m.includes('not found')||m.includes('پیدا نشد')||m.includes('وجود ندارد')||m.includes('پاسخ خالی');
}
async function loadOrBootstrap(module){
  // Data-safety rule: normal runtime is API-only. Never bootstrap or migrate from Seed automatically.
  // If the backend returns an empty module, return it as-is and let the user decide; do not write Seed over it.
  return loadModule(module);
}

function cashAmount(value,{blankAsZero=true}={}){
  if(typeof value==='number')return Number.isFinite(value)?{ok:true,value}:{ok:false,value:null,error:'مقدار عددی معتبر نیست'};
  const raw=String(value??'').trim();
  if(!raw)return blankAsZero?{ok:true,value:0,blank:true}:{ok:false,value:null,error:'مقدار خالی است'};
  const normalized=raw.replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g,'.').replace(/[٬,،\s]/g,'');
  if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized))return{ok:false,value:null,error:`مقدار «${raw}» عدد معتبر نیست`};
  const number=Number(normalized);return Number.isFinite(number)?{ok:true,value:number}:{ok:false,value:null,error:`مقدار «${raw}» خارج از محدوده است`};
}
function cashVariance(report={}){
  const fields=['netReceivable','tipDelivery','tipValet','tipHall','cardToCard','cash',...Array.from({length:6},(_,i)=>`pos${i+1}`)],values={},errors=[];
  for(const field of fields){const parsed=cashAmount(report[field]);if(parsed.ok)values[field]=parsed.value;else errors.push({field,message:parsed.error})}
  const adjustments=[];for(const [index,row] of (Array.isArray(report.otherTransactions)?report.otherTransactions:[]).entries()){const parsed=cashAmount(row?.amount);if(!parsed.ok)errors.push({field:`otherTransactions[${index}].amount`,message:parsed.error});else adjustments.push((Number(row?.sign)===-1?-1:1)*parsed.value)}
  if(errors.length)return{valid:false,errors};
  const posTotal=Array.from({length:6},(_,i)=>values[`pos${i+1}`]).reduce((a,b)=>a+b,0),actualReceived=posTotal+values.cardToCard+values.cash,tipsTotal=values.tipDelivery+values.tipValet+values.tipHall;
  const tipsInThisCashbox=report.tipsOutsideCashbox===true?0:tipsTotal,expectedCashbox=values.netReceivable+(report.netReceivableIncludesTips===true?0:tipsInThisCashbox),initialVariance=actualReceived-expectedCashbox,adjustmentsTotal=adjustments.reduce((a,b)=>a+b,0),finalVariance=initialVariance+adjustmentsTotal;
  const stored=Number(report.finalVariance),hasStored=Number.isFinite(stored)&&report.finalVariance!==''&&report.finalVariance!=null;
  return{valid:true,formulaVersion:'cash-variance-v2',currency:'ریال',posTotal,cardToCard:values.cardToCard,cash:values.cash,actualReceived,netReceivable:values.netReceivable,tipsTotal,tipsInThisCashbox,expectedCashbox,initialVariance,adjustmentsTotal,finalVariance,status:initialVariance>0?'اضافه صندوق':initialVariance<0?'کسری صندوق':'تراز',finalStatus:finalVariance>0?'اضافه صندوق':finalVariance<0?'کسری صندوق':'تراز',storedVariance:hasStored?stored:null,historicalDifference:hasStored&&stored!==finalVariance?finalVariance-stored:0};
}
window.RayoCashVariance={parseAmount:cashAmount,calculate:cashVariance,formula:'(جمع کارتخوان‌ها + کارت‌به‌کارت + نقدی) − (خالص دریافتی + انعام داخل همین صندوق)',currency:'ریال'};
// Shared by the admin, cashier and staff forms. Editing an amount must not rename
// historical destinations or reassign the owner of an unchanged account.
window.RayoCashDestinations={snapshots(report,previous,refs){
  const account=(refs.transferAccounts||[]).find(x=>x.id===report.cardToCardAccountId),recipient=(refs.cashRecipients||[]).find(x=>x.id===report.cashRecipientId),sameAccount=previous&&previous.cardToCardAccountId===report.cardToCardAccountId,sameRecipient=previous&&previous.cashRecipientId===report.cashRecipientId;
  const ownerId=sameAccount?(previous.cardToCardOwnerIdSnapshot??account?.ownerRecipientId??''):(account?.ownerRecipientId||'');
  return{cardToCardAccountNameSnapshot:sameAccount?(previous.cardToCardAccountNameSnapshot??account?.name??''):(account?.name||''),cardToCardOwnerIdSnapshot:ownerId,cardToCardOwnerNameSnapshot:sameAccount?(previous.cardToCardOwnerNameSnapshot??(refs.cashRecipients||[]).find(x=>x.id===ownerId)?.name??''):((refs.cashRecipients||[]).find(x=>x.id===ownerId)?.name||''),cashRecipientNameSnapshot:sameRecipient?(previous.cashRecipientNameSnapshot??recipient?.name??''):(recipient?.name||'')};
}};
// Card-to-card and cash deliveries can be split into several lines, each with its own destination
// (cardToCardItems / cashItems). Legacy reports keep one total + one destination; itemsOf() reads
// them as a single line. cardToCard/cash stay the line totals, so the variance formula is unchanged.
(function(){
const A=x=>Array.isArray(x)?x:[],E=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
const KEYS={card:'cardToCardItems',cash:'cashItems'};
function itemsOf(report,kind){
  const r=report||{};if(Array.isArray(r[KEYS[kind]]))return r[KEYS[kind]];
  const raw=kind==='card'?r.cardToCard:r.cash,parsed=cashAmount(raw);if(parsed.ok&&parsed.value===0)return[];
  return kind==='card'?[{id:'legacy',amount:raw,accountId:r.cardToCardAccountId||'',accountNameSnapshot:r.cardToCardAccountNameSnapshot||'',ownerIdSnapshot:r.cardToCardOwnerIdSnapshot,ownerNameSnapshot:r.cardToCardOwnerNameSnapshot||''}]:[{id:'legacy',amount:raw,recipientId:r.cashRecipientId||'',recipientNameSnapshot:r.cashRecipientNameSnapshot||''}];
}
// rows: {card:[{id,amount,destId}],cash:[...]}. Snapshots of an unchanged destination are kept from previous.
function applyItems(previous,refs,rows){
  const accounts=A(refs?.transferAccounts),people=A(refs?.cashRecipients),prevCard=new Map(itemsOf(previous,'card').map(x=>[x.id,x])),prevCash=new Map(itemsOf(previous,'cash').map(x=>[x.id,x]));
  const card=A(rows?.card).map(r=>{const p=prevCard.get(r.id),same=!!p&&(p.accountId||'')===(r.destId||''),acc=accounts.find(x=>x.id===r.destId),ownerId=same?(p.ownerIdSnapshot??acc?.ownerRecipientId??''):(acc?.ownerRecipientId||'');return{id:r.id,amount:r.amount,accountId:r.destId||'',accountNameSnapshot:same?(p.accountNameSnapshot??acc?.name??''):(acc?.name||''),ownerIdSnapshot:ownerId,ownerNameSnapshot:same?(p.ownerNameSnapshot??people.find(x=>x.id===ownerId)?.name??''):(people.find(x=>x.id===ownerId)?.name||'')}});
  const cash=A(rows?.cash).map(r=>{const p=prevCash.get(r.id),same=!!p&&(p.recipientId||'')===(r.destId||''),rec=people.find(x=>x.id===r.destId);return{id:r.id,amount:r.amount,recipientId:r.destId||'',recipientNameSnapshot:same?(p.recipientNameSnapshot??rec?.name??''):(rec?.name||'')}});
  // Legacy single-destination fields are filled only when every line goes to the same destination.
  const uniform=(list,key)=>list.length&&list.every(x=>x[key]===list[0][key])?list[0]:null,c=uniform(card,'accountId'),h=uniform(cash,'recipientId');
  return{cardToCardItems:card,cashItems:cash,cardToCard:card.reduce((a,x)=>a+x.amount,0),cash:cash.reduce((a,x)=>a+x.amount,0),
    cardToCardAccountId:c?.accountId||'',cardToCardAccountNameSnapshot:c?.accountNameSnapshot||'',cardToCardOwnerIdSnapshot:c?.ownerIdSnapshot||'',cardToCardOwnerNameSnapshot:c?.ownerNameSnapshot||'',
    cashRecipientId:h?.recipientId||'',cashRecipientNameSnapshot:h?.recipientNameSnapshot||''};
}
const LABELS={card:{add:'+ افزودن کارت به کارت',dest:'کارت / حساب مقصد'},cash:{add:'+ افزودن تحویل نقد',dest:'تحویل‌گیرنده'}};
let editorRefs={};
const newId=()=>'CI-'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const rowsOf=box=>[...box.querySelectorAll('.rci-row')];
function destOptions(kind,selected){const people=A(editorRefs.cashRecipients),list=A(kind==='card'?editorRefs.transferAccounts:people).filter(x=>(x.status!=='غیرفعال'&&!x.isArchived)||x.id===selected);return '<option value="">انتخاب کنید</option>'+list.map(x=>{const owner=kind==='card'?people.find(p=>p.id===x.ownerRecipientId)?.name:'';return `<option value="${E(x.id)}" ${x.id===selected?'selected':''}>${E(owner?`${x.name} — صاحب: ${owner}`:x.name)}</option>`}).join('')}
function rowHtml(kind,item={}){const dest=(kind==='card'?item.accountId:item.recipientId)||'',amount=cashAmount(item.amount??0);return `<div class="rci-row" data-id="${E(item.id||newId())}"><input class="rci-amount" data-money type="text" inputmode="decimal" autocomplete="off" aria-label="مبلغ (ریال)" value="${E(amount.ok?amount.value:item.amount)}"><select class="rci-dest" aria-label="${LABELS[kind].dest}">${destOptions(kind,dest)}</select><button type="button" class="btn btn-sm btn-danger rci-del" aria-label="حذف ردیف">حذف</button></div>`}
function html(kind,items,refs){if(refs)editorRefs=refs;const rows=A(items).length?A(items):[{}];return `<div class="rci" data-kind="${kind}"><div class="rci-head"><span>مبلغ (ریال)</span><span>${LABELS[kind].dest}</span><span></span></div><div class="rci-rows">${rows.map(x=>rowHtml(kind,x)).join('')}</div><div class="rci-foot"><button type="button" class="btn btn-sm rci-add">${LABELS[kind].add}</button><b class="rci-total"></b></div><div class="rci-sub"></div></div>`}
// Lines with zero amount are ignored; a line with an amount must have a destination.
function read(box){
  const errors=[],missing=[],items=[];let total=0;const kind=box?.dataset?.kind;
  for(const row of rowsOf(box)){const input=row.querySelector('.rci-amount'),dest=row.querySelector('.rci-dest'),parsed=cashAmount(input.value),bad=!parsed.ok||parsed.value<0;input.classList.toggle('input-error',bad);if(bad){errors.push(parsed.ok?'مبلغ منفی مجاز نیست':parsed.error);continue}const lacks=parsed.value>0&&!dest.value;dest.classList.toggle('input-error',lacks);if(lacks&&!missing.length)missing.push(kind==='cash'?'برای هر ردیف وجه نقد، تحویل‌گیرنده را انتخاب کنید':'برای هر ردیف کارت به کارت، کارت/حساب مقصد را انتخاب کنید');if(parsed.value===0)continue;total+=parsed.value;items.push({id:row.dataset.id,amount:parsed.value,destId:dest.value})}
  return{items,errors,missing,total};
}
function refresh(box){
  if(!box)return;const {items,total}=read(box),groups=new Map(),fa=n=>Math.round(n).toLocaleString('fa-IR'),label=id=>[...box.querySelectorAll('.rci-dest')].find(s=>s.value===id)?.selectedOptions[0]?.textContent||'—';
  for(const it of items){const key=it.destId||'',g=groups.get(key)||{label:key?label(key):'بدون مقصد',sum:0};g.sum+=it.amount;groups.set(key,g)}
  box.querySelector('.rci-total').textContent=items.length?`جمع: ${fa(total)} ریال`:'';
  box.querySelector('.rci-sub').innerHTML=items.length>1?[...groups.values()].map(g=>`<span>${E(g.label)}: <b>${fa(g.sum)}</b></span>`).join(''):'';
}
// Re-render destination options (e.g. after a new account is defined) keeping selections; optionally
// put a newly created destination into the last empty select of that kind.
function refreshOptions(root,refs,kind='',newId=''){if(refs)editorRefs=refs;root?.querySelectorAll?.('.rci').forEach(box=>{const selects=[...box.querySelectorAll('.rci-dest')],target=box.dataset.kind===kind&&newId?[...selects].reverse().find(x=>!x.value):null;selects.forEach(el=>{const selected=el===target?newId:el.value;el.innerHTML=destOptions(box.dataset.kind,selected);el.value=selected});refresh(box)})}
const dom=typeof document!=='undefined'&&typeof document.addEventListener==='function'?document:{addEventListener(){}};
const notify=box=>{refresh(box);box.dispatchEvent(new CustomEvent('rayo-cash-items-change',{bubbles:true}))};
dom.addEventListener('click',e=>{
  const box=e.target.closest?.('.rci');if(!box)return;const kind=box.dataset.kind;
  if(e.target.closest('.rci-add')){box.querySelector('.rci-rows').insertAdjacentHTML('beforeend',rowHtml(kind));const rows=rowsOf(box),last=rows[rows.length-1];window.RayoNumberUX?.scan?.(last);/* enhance before focus so the default zero is cleared */last.querySelector('.rci-amount').focus();notify(box)}
  else if(e.target.closest('.rci-del')){const row=e.target.closest('.rci-row');if(rowsOf(box).length>1)row.remove();else{row.querySelector('.rci-amount').value='0';row.querySelector('.rci-dest').value=''}notify(box)}
});
dom.addEventListener('input',e=>{const box=e.target.closest?.('.rci');if(box)notify(box)});
dom.addEventListener('change',e=>{const box=e.target.closest?.('.rci');if(box&&e.target.matches('.rci-dest'))notify(box)});
// Enter in an amount moves to the next line, or adds a new line after the last filled one.
dom.addEventListener('keydown',e=>{
  if(e.key!=='Enter'||!e.target.matches?.('.rci-amount'))return;e.preventDefault();
  const box=e.target.closest('.rci'),rows=rowsOf(box),index=rows.indexOf(e.target.closest('.rci-row'));
  if(index<rows.length-1)rows[index+1].querySelector('.rci-amount').focus();
  else if(cashAmount(e.target.value).value)box.querySelector('.rci-add').click();
});
window.RayoCashDestinations.itemsOf=itemsOf;window.RayoCashDestinations.applyItems=applyItems;
window.RayoCashItemsUI={html,read,refresh,refreshOptions,setRefs(refs){editorRefs=refs||{}}};
})();
// Daily soft-drink control (inventory.beverageDailyControls). One live record per date, one line per beverage
// (ingredientId from pricing.ingredients via settings.beverageControl.itemIds). Shared by the admin desktop table,
// the one-beverage mobile form, reports and the staff panel so every screen uses the same formula and merge rules.
// Blank is "not entered" and never becomes zero; a calculation with a missing input is "not computable".
(()=>{
const S=x=>String(x??'').trim(),A=x=>Array.isArray(x)?x:[],E=x=>S(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const DG=x=>String(x??'').replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const FORMULA='bev-v2',DAY=864e5,UNKNOWN_SAVE=['timeout','network_error','empty_response','invalid_json'];
// Entry order: sales is the last number the user enters (after the night count).
const COUNT_FIELDS=['morningUpper','morningLower','inflow','nonSale','nightUpper','nightLower','sales'],TEXT_FIELDS=['nonSaleReason','varianceNote'],FIELDS=[...COUNT_FIELDS,...TEXT_FIELDS];
const LABELS={morningUpper:'شمارش صبح بالا',morningLower:'شمارش صبح پایین',inflow:'ورودی روز',nonSale:'خروج غیر فروش',sales:'فروش',nightUpper:'مانده شب بالا',nightLower:'مانده شب پایین',nonSaleReason:'علت خروج غیر فروش',varianceNote:'علت مغایرت'};
// People of the day (record.roles): the morning counter takes the fridges over, the night counter makes the final count
// and the storekeeper takes the night count over. The next morning count must equal what the storekeeper took over;
// the difference is the overnight variance and belongs to that storekeeper.
const ROLES=[['morningCounter','شمارنده صبح','تحویل‌گیرنده صبح'],['nightCounter','شمارنده شب','شمارش نهایی شب'],['storekeeper','انباردار','تحویل از شمارنده شب']],ROLE_KEYS=ROLES.map(r=>r[0]);
const EDIT_CONFIRM='قبلاً اطلاعات این نوشیدنی را ثبت کرده‌اید. مطمئن هستید می‌خواهید تغییرش دهید؟';
function parseCount(v){if(v===null||v===undefined)return null;if(typeof v==='number')return Number.isInteger(v)&&v>=0?v:NaN;const s=DG(v).replace(/[٬,،\s]/g,'');if(s==='')return null;return /^\d+$/.test(s)?Number(s):NaN}
const num=v=>typeof v==='number'&&Number.isFinite(v)?v:null;
// A count needs both fridges. A legacy record that only kept a total (morningTotal/nightTotal) keeps it, marked unsplit.
function pair(upper,lower,total){if(upper!==null&&lower!==null)return{total:upper+lower,split:true};if(upper===null&&lower===null&&total!==null)return{total,split:false};return{total:null,split:null}}
// Lines saved before bev-v2 kept morning/evening flows; their sum is the day flow, and all-blank parts stay unknown.
function legacyFlow(l,a,b){const x=num(l[a]),y=num(l[b]);return x===null&&y===null?null:(x||0)+(y||0)}
function values(line){const l=line||{},v2=l.formulaVersion===FORMULA,mu=num(l.morningUpper),ml=num(l.morningLower),nu=num(l.nightUpper),nl=num(l.nightLower),m=pair(mu,ml,num(l.morningTotal)),n=pair(nu,nl,num(l.nightTotal));
 return{morningUpper:mu,morningLower:ml,morning:m.total,morningSplit:m.split,inflow:v2?num(l.inflow):legacyFlow(l,'inMorning','inEvening'),nonSale:v2?num(l.nonSale):legacyFlow(l,'nonSaleMorning','nonSaleEvening'),sales:v2?num(l.sales):legacyFlow(l,'salesMorning','salesEvening'),nightUpper:nu,nightLower:nl,night:n.total,nightSplit:n.split,nonSaleReason:S(l.nonSaleReason),varianceNote:S(l.varianceNote),legacy:!!line&&!v2}}
function formValues(line){const v=values(line),out={};for(const f of FIELDS)out[f]=v[f];return out}
// expected night = (morning + day inflow) − (non-sale + sales); daily = expected − night (positive = shortage);
// overnight = this morning − previous calendar day's night (negative = stock went down overnight).
function metrics(line,prevLine){const v=values(line),prevNight=prevLine?values(prevLine).night:null,missingExpected=[['morning','شمارش صبح'],['inflow','ورودی روز'],['nonSale','خروج غیر فروش'],['sales','فروش']].filter(([k])=>v[k]===null).map(x=>x[1]);
 const expectedNight=missingExpected.length?null:(v.morning+v.inflow)-(v.nonSale+v.sales),daily=expectedNight===null||v.night===null?null:expectedNight-v.night,overnight=v.morning===null||prevNight===null?null:v.morning-prevNight;
 return{...v,prevNight,expectedNight,daily,overnight,complete:daily!==null,missingExpected,missingDaily:[...missingExpected,...(v.night===null?['مانده شب']:[])],missingOvernight:[...(v.morning===null?['شمارش صبح']:[]),...(prevNight===null?['مانده شب روز قبل']:[])]}}
function read(raw){const values={},errors=[],invalid=[];for(const f of COUNT_FIELDS){const v=parseCount(raw?.[f]);if(Number.isNaN(v)){errors.push(`${LABELS[f]} باید عدد صحیح نامنفی باشد`);invalid.push(f);values[f]=null}else values[f]=v}for(const f of TEXT_FIELDS)values[f]=S(raw?.[f]);if(values.nonSale>0&&!values.nonSaleReason){errors.push('برای خروج غیر فروش بیشتر از صفر، علت را بنویسید');invalid.push('nonSaleReason')}return{values,errors,invalid}}
let utcFormat=null;
function persianFormat(timeZone){try{return new Intl.DateTimeFormat('en-u-ca-persian-nu-latn',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'})}catch(_){return null}}
function jalaliOf(date,timeZone='UTC'){const f=timeZone==='UTC'?(utcFormat||(utcFormat=persianFormat('UTC'))):persianFormat(timeZone);if(!f)return '';const p=f.formatToParts(date),g=t=>DG(p.find(x=>x.type===t)?.value||'');return `${g('year')}/${g('month').padStart(2,'0')}/${g('day').padStart(2,'0')}`}
function today(){return jalaliOf(new Date(),'Asia/Tehran')||window.RayoJalali?.today?.()||''}
// Calendar arithmetic through the Persian calendar of Intl: esfand 29/30 and year changes come from the calendar itself.
function utcOf(s){const m=/^(\d{4})\/(\d{2})\/(\d{2})$/.exec(S(s));if(!m)return null;const y=+m[1],mo=+m[2],d=+m[3];if(mo<1||mo>12||d<1||d>(mo<=6?31:30))return null;let t=Date.UTC(y+621,2,20)+Math.round((mo-1)*30.6+d-1)*DAY;for(let i=0;i<12;i++){const j=jalaliOf(new Date(t));if(!j)return null;if(j===s)return t;t+=(j<s?1:-1)*DAY}return null}
function normDate(v){const m=DG(v).trim().replace(/-/g,'/').match(/^(1[34]\d{2})\/(\d{1,2})\/(\d{1,2})$/);if(!m)return '';const s=`${m[1]}/${m[2].padStart(2,'0')}/${m[3].padStart(2,'0')}`;return utcOf(s)===null?'':s}
function addDays(s,n){const t=utcOf(s);if(t===null)return typeof window.addJDays==='function'?window.addJDays(s,n):'';return jalaliOf(new Date(t+n*DAY))}
const live=x=>x&&typeof x==='object'&&x.status!=='void';
function records(doc){return A(doc?.beverageDailyControls).filter(live)}
function recordOf(doc,date){return records(doc).find(x=>x.date===date)||null}
function lineOf(record,itemId){return A(record?.lines).find(l=>l&&l.ingredientId===itemId)||null}
function prevLineOf(doc,date,itemId){const d=addDays(date,-1);return d?lineOf(recordOf(doc,d),itemId):null}
function fingerprint(line){return line?JSON.stringify(line):''}
function person(v){const id=S(v?.personnelId),name=S(v?.name);return id||name?{personnelId:id,name}:null}
function rolesOf(record){const r=record?.roles||{},out={};for(const k of ROLE_KEYS)out[k]=person(r[k]);return out}
// Role keys whose person differs from the record; `roles` undefined means roles are not part of this edit.
function changedRoles(record,roles){if(!roles)return [];const cur=rolesOf(record),key=p=>`${S(p?.personnelId)}|${S(p?.name)}`;return ROLE_KEYS.filter(k=>k in roles&&key(cur[k])!==key(person(roles[k])))}
function rolesMatch(doc,date,roles){return !changedRoles(recordOf(doc,date),roles).length}
function roleText(p){return p?S(p.name)||S(p.personnelId):''}
function changedFields(line,vals){const cur=formValues(line);return FIELDS.filter(f=>(cur[f]??null)!==(vals?.[f]??null))}
function savedMatches(doc,date,itemId,vals){const l=lineOf(recordOf(doc,date),itemId);return !!l&&!changedFields(l,vals).length}
function conflict(current){const e=new Error('اطلاعات این نوشیدنی پس از بارگذاری فرم توسط کاربر دیگری تغییر کرده است.');e.code='bev_conflict';e.current=current;return e}
// Applies one beverage line onto a freshly loaded inventory document. `baseline` is the fingerprint of the line the
// form was loaded with; a different server line is a concurrent edit. The morning/night counter is set only when that
// stage's counts change, so a night entry never renames the morning counter; created/updated keep first and last editor.
function applyEdit(doc,{date,item,values:vals,actor,at,baseline,recordId,roles}){
 if(!doc||typeof doc!=='object'||Array.isArray(doc))throw new Error('سند انبار برای ذخیره معتبر نیست');
 if(!date||!item?.id)throw new Error('تاریخ و نوشیدنی الزامی است');
 doc.beverageDailyControls=A(doc.beverageDailyControls);doc.changeLog=A(doc.changeLog);
 let record=recordOf(doc,date);const old=lineOf(record,item.id);
 if(baseline!==undefined&&baseline!==null&&fingerprint(old)!==baseline)throw conflict(old);
 const changed=changedFields(old,vals),roleKeys=changedRoles(record,roles);if(!changed.length&&!roleKeys.length)return{changed:false,record,line:old,fields:[],roles:[]};
 const who={type:S(actor?.type)||'admin',personnelId:S(actor?.personnelId),name:S(actor?.name),at},existed=!!record;
 if(!record){record={id:recordId||`BEV-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,date,status:'posted',source:who.type==='staff'?'staff':'admin',lines:[],createdAt:at,createdBy:who.name,...(who.personnelId?{createdByPersonnelId:who.personnelId,createdByName:who.name}:{})};doc.beverageDailyControls.push(record)}
 record.lines=A(record.lines);
 if(roleKeys.length){const cur=rolesOf(record);record.roles={...(record.roles||{})};for(const k of roleKeys)record.roles[k]=person(roles[k]);if(existed){record.updatedAt=at;record.updatedBy=who.name}doc.changeLog.push({at,action:'تعیین افراد کنترل روزانه نوشابه',actor:who.name,actorType:who.type,personnelId:who.personnelId,entityId:record.id,date,roles:roleKeys.map(k=>({role:k,from:roleText(cur[k]),to:roleText(roles[k])}))})}
 if(!changed.length)return{changed:true,record,line:old,created:false,fields:[],roles:roleKeys};
 const next={...(old||{}),ingredientId:item.id,itemNameSnapshot:old?.itemNameSnapshot||S(item.name),itemCodeSnapshot:old?(old.itemCodeSnapshot??''):S(item.code),unitSnapshot:old?.unitSnapshot||S(item.recipeUnit||item.unit)||'عدد'};
 for(const f of FIELDS)next[f]=vals[f]??(TEXT_FIELDS.includes(f)?'':null);next.formulaVersion=FORMULA;
 if(changed.some(f=>f==='morningUpper'||f==='morningLower'))next.morningCountedBy=who;
 if(changed.some(f=>f==='nightUpper'||f==='nightLower'))next.nightCountedBy=who;
 if(!old){next.createdAt=at;next.createdBy=who}
 next.updatedAt=at;next.updatedBy=who;
 if(old){record.lines[record.lines.indexOf(old)]=next;record.revisions=[...A(record.revisions),{kind:'line',ingredientId:item.id,line:JSON.parse(JSON.stringify(old)),replacedAt:at,replacedBy:who.name,replacedByPersonnelId:who.personnelId}].slice(-100)}else record.lines.push(next);
 if(existed){record.updatedAt=at;record.updatedBy=who.name}
 doc.changeLog.push({at,action:old?'اصلاح کنترل روزانه نوشابه':'ثبت کنترل روزانه نوشابه',actor:who.name,actorType:who.type,personnelId:who.personnelId,entityId:record.id,ingredientId:item.id,date,fields:changed});
 return{changed:true,record,line:next,created:!old,fields:changed,roles:roleKeys}}
const fa=n=>Number(n).toLocaleString('fa-IR');
// The signed number is a left-to-right isolate so the sign stays next to the digits inside Persian text.
function signed(n){return n===null||n===undefined?'—':`⁦${n>0?'+':n<0?'−':''}${fa(Math.abs(n))}⁩`}
function dailyText(n){return n===null||n===undefined?'قابل محاسبه نیست':n>0?`کسری ${signed(n)}`:n<0?`اضافه ${signed(n)}`:'بدون مغایرت (۰)'}
function overnightText(n){return n===null||n===undefined?'قابل محاسبه نیست':n<0?`کاهش موجودی ${signed(n)}`:n>0?`افزایش موجودی ${signed(n)}`:'بدون تغییر (۰)'}
function atText(iso){if(!iso)return '';try{return new Date(iso).toLocaleString('fa-IR',{timeZone:'Asia/Tehran',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(_){return S(iso).slice(0,16).replace('T',' ')}}
function byText(who,label){return who&&S(who.name)?`${label}: ${S(who.name)}${who.at?` — ${atText(who.at)}`:''}`:''}

// One-beverage-at-a-time form (admin on mobile and in the dashboard modal, staff panel). cfg: items(), load(),
// save(doc)→verified doc|null, actor()→{type,personnelId,name}, toast(msg,isError), optional people()→[{id,name}] (choices
// for the day's roles), onLoaded/onSaved/canEdit(date,existing)/confirm/title/date. Beverages are picked from a vertical
// list that shows each one's state for the date; the day's people are shared by every beverage of that date.
const st={date:'',itemId:'',seq:0,loading:false,saving:false,baseline:null,line:null,existing:false,blocked:'',doc:null,roles:null};
let cfg=null;
const $=id=>document.getElementById(id);
function css(){if(typeof document==='undefined'||!document.head||$('rbcStyle'))return;const s=document.createElement('style');s.id='rbcStyle';s.textContent='.rbc .rbc-sel,.rbc .rbc-fields{border:0;padding:0;margin:0;min-width:0}.rbc .rbc-sel{display:grid;grid-template-columns:1fr;gap:10px}.rbc .rbc-fields{display:grid;gap:10px}.rbc .rbc-fields[disabled]{opacity:.6}.rbc-label{display:block;font-size:13px;font-weight:600;margin-bottom:4px}.rbc-items{display:grid;gap:6px;max-height:46vh;overflow:auto;padding:2px}.rbc-item{display:flex;justify-content:space-between;align-items:center;gap:8px;width:100%;min-height:46px;padding:8px 12px;border:1px solid var(--border,#e4e7ec);border-radius:10px;background:var(--surface,#fff);color:inherit;font:inherit;text-align:right;cursor:pointer}.rbc-item[aria-pressed=true]{border-color:var(--primary,#134e4a);box-shadow:inset 0 0 0 1px var(--primary,#134e4a);font-weight:700}.rbc-item small{color:var(--muted,#667085);font-weight:400;font-size:12px;white-space:nowrap}.rbc-item[data-done=full] small{color:#067647}.rbc-item[data-done=part] small{color:#b54708}.rbc-box{border:1px solid var(--border,#e4e7ec);border-radius:12px;padding:10px 12px}.rbc-box h3{margin:0 0 8px;font-size:14px}.rbc-roles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.rbc-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}.rbc-pair+.rbc-pair{margin-top:10px}.rbc-in{display:flex;flex-direction:column;gap:4px;font-size:13px;font-weight:600;min-width:0}.rbc-in input,.rbc-in textarea,.rbc-in select{width:100%;min-height:42px;font:inherit;box-sizing:border-box}.rbc-in small,.rbc-by{color:var(--muted,#667085);font-weight:400;font-size:12px}.rbc-by{display:block;margin-top:6px}.rbc-calc{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px 10px;background:var(--bg-soft,#f6f7f9);border-radius:10px;padding:9px 12px;font-size:13px}.rbc-calc small{color:var(--muted,#667085)}.rbc-calc output{font-weight:700}.rbc-calc output[data-tone=bad]{color:#b42318}.rbc-calc output[data-tone=good]{color:#067647}.rbc-calc output[data-tone=na]{color:var(--muted,#667085);font-weight:400}.rbc-status{margin:10px 0;font-size:13px;line-height:1.8}.rbc-status[data-tone=error]{color:#b42318}.rbc-status[data-tone=ok]{color:#067647}.rbc-status[data-tone=warn]{color:#b54708}.rbc [aria-invalid=true]{border-color:#b42318!important;outline-color:#b42318}.rbc-save{width:100%;min-height:44px}@media(max-width:620px){.rbc-roles{grid-template-columns:1fr}.rbc-reasons .rbc-pair{grid-template-columns:1fr}}';document.head.appendChild(s)}
const itemOf=id=>A(cfg?.items?.()).find(i=>i.id===id)||null;
const input=(f,label,hint='')=>`<label class="rbc-in">${E(label)}<input id="rbc_${f}" data-rbc-count="${f}" inputmode="numeric" autocomplete="off" aria-label="${E(LABELS[f])}" oninput="RayoBeverageControl.form.recalc()">${hint?`<small>${E(hint)}</small>`:''}</label>`;
// State of one beverage on the form date, from the last loaded document (indicator only; the line is reloaded on pick).
function itemState(id){if(!st.doc)return['',''];const l=lineOf(recordOf(st.doc,st.date),id);if(!l)return['','ثبت نشده'];return metrics(l,prevLineOf(st.doc,st.date,id)).complete?['full','✓ کامل']:['part','ناقص']}
function itemsHtml(){return A(cfg?.items?.()).map(i=>{const [done,text]=itemState(i.id);return `<button type="button" class="rbc-item" data-rbc-item="${E(i.id)}" data-done="${done}" aria-pressed="${i.id===st.itemId}" onclick="RayoBeverageControl.form.setItem(this.dataset.rbcItem)"><span>${E(i.name)}</span><small>${E(text)}</small></button>`}).join('')}
function refreshItems(){const box=$('rbcItem');if(box&&typeof box.innerHTML==='string')box.innerHTML=itemsHtml()}
function people(){return A(cfg?.people?.()).map(p=>({id:S(p?.id),name:S(p?.name)})).filter(p=>p.id)}
function peopleOptions(sel){const list=people();if(sel?.personnelId&&!list.some(p=>p.id===sel.personnelId))list.unshift({id:sel.personnelId,name:sel.name||sel.personnelId});return '<option value="">انتخاب نشده</option>'+list.map(p=>`<option value="${E(p.id)}"${sel?.personnelId===p.id?' selected':''}>${E(p.name)}</option>`).join('')}
function fillRoles(record){st.roles=rolesOf(record);for(const k of ROLE_KEYS){const el=$(`rbc_role_${k}`);if(!el)continue;el.innerHTML=peopleOptions(st.roles[k]);el.value=S(st.roles[k]?.personnelId)}}
// Only the roles the user changed are part of the edit, so an untouched select never overwrites another user's choice.
function readRoles(){const out={},key=p=>`${S(p?.personnelId)}|${S(p?.name)}`;for(const k of ROLE_KEYS){const el=$(`rbc_role_${k}`);if(!el)continue;const id=S(el.value),cur=st.roles?.[k]||null,p=id?(cur?.personnelId===id?cur:{personnelId:id,name:people().find(x=>x.id===id)?.name||id}):null;if(key(p)!==key(cur))out[k]=p}return Object.keys(out).length?out:undefined}
function html(config){cfg=config||{};css();const t=today();st.date=normDate(cfg.date)&&normDate(cfg.date)<=t?normDate(cfg.date):(st.date&&st.date<=t?st.date:t);st.itemId='';st.seq++;st.loading=false;st.baseline=null;st.line=null;st.existing=false;st.blocked='';st.roles=null;const items=A(cfg.items?.()),seq=st.seq;
 // Reads the document once so the list shows each beverage's state for the date; never overwrites a newer load.
 if(items.length)setTimeout(()=>Promise.resolve().then(()=>cfg.load()).then(d=>{if(seq!==st.seq||st.doc)return;st.doc=d;cfg.onLoaded?.(d);refreshItems();fillRoles(recordOf(d,st.date))}).catch(()=>{}),0);
 return `<form class="card rbc" id="rbcForm" novalidate onsubmit="event.preventDefault();RayoBeverageControl.form.save()">${cfg.title?`<div class="section-head"><h2>${E(cfg.title)}</h2></div>`:''}
 <fieldset id="rbcSel" class="rbc-sel"><div class="field"><label for="rbcDate">تاریخ *</label><input id="rbcDate" data-jalali="1" inputmode="numeric" value="${E(st.date)}" onchange="RayoBeverageControl.form.setDate(this.value)"></div><div><span class="rbc-label" id="rbcItemLabel">نوشیدنی *</span><div id="rbcItem" class="rbc-items" role="group" aria-labelledby="rbcItemLabel">${itemsHtml()}</div></div></fieldset>
 <p id="rbcStatus" class="rbc-status" role="status" aria-live="polite">${items.length?'نوشیدنی را انتخاب کنید.':'هنوز نوشیدنی برای کنترل روزانه تعیین نشده است.'}</p>
 <fieldset id="rbcFields" class="rbc-fields" disabled>
 <section class="rbc-box"><h3>افراد این روز</h3><div class="rbc-roles">${ROLES.map(([k,l,h])=>`<label class="rbc-in">${E(l)}<select id="rbc_role_${k}" onchange="RayoBeverageControl.form.recalc()">${peopleOptions(null)}</select><small>${E(h)}</small></label>`).join('')}</div><small class="rbc-by">برای همهٔ نوشیدنی‌های این تاریخ مشترک است. شمارش صبح فردا باید با تحویل انباردار امشب برابر باشد؛ اختلاف، مغایرت شبانه است.</small></section>
 <section class="rbc-box"><h3>شمارش صبح</h3><div class="rbc-pair">${input('morningUpper','بالا')}${input('morningLower','پایین')}</div><small id="rbcMorningBy" class="rbc-by"></small></section>
 <section class="rbc-box"><h3>گردش روز</h3><div class="rbc-pair">${input('inflow','ورودی روز','مجموع شارژ هر دو یخچال')}${input('nonSale','خروج غیر فروش','پرسنلی، مهمان، شکسته…')}</div></section>
 <section class="rbc-box"><h3>مانده شب</h3><div class="rbc-pair">${input('nightUpper','بالا')}${input('nightLower','پایین')}</div><small id="rbcNightBy" class="rbc-by"></small></section>
 <section class="rbc-box"><h3>فروش</h3>${input('sales','فروش روز','از گزارش صندوق؛ آخرین عددی که وارد می‌شود')}</section>
 <section class="rbc-box rbc-reasons"><h3>علت‌ها</h3><div class="rbc-pair"><label class="rbc-in">علت خروج غیر فروش<input id="rbc_nonSaleReason" autocomplete="off" placeholder="پرسنلی، مهمان، شکسته…" oninput="RayoBeverageControl.form.recalc()"></label><label class="rbc-in">علت مغایرت<textarea id="rbc_varianceNote" rows="2" oninput="RayoBeverageControl.form.recalc()"></textarea></label></div></section>
 <div class="rbc-calc"><span>مانده مورد انتظار شب</span><output id="rbcExpected" data-tone="na">—</output></div>
 <div class="rbc-calc"><span>مغایرت روز <small>(مثبت = کسری، منفی = اضافه)</small></span><output id="rbcDaily" data-tone="na">—</output></div>
 <div class="rbc-calc"><span>مغایرت شبانه <small id="rbcPrevNight">(صبح امروز − تحویل انباردار شب قبل)</small></span><output id="rbcOvernight" data-tone="na">—</output></div>
 <button type="submit" class="btn btn-primary rbc-save" id="rbcSave">ذخیره این نوشیدنی</button>
 </fieldset></form>`}
function status(text,tone=''){const s=$('rbcStatus');if(s){s.textContent=text;s.dataset.tone=tone}}
function out(id,text,tone){const o=$(id);if(o){o.textContent=text;o.dataset.tone=tone}}
function fill(line){const v=formValues(line);for(const f of FIELDS){const el=$(`rbc_${f}`);if(el){el.value=v[f]===null||v[f]===undefined?'':String(v[f]);el.removeAttribute('aria-invalid')}}}
function readForm(){const raw={};for(const f of FIELDS)raw[f]=$(`rbc_${f}`)?.value??'';return read(raw)}
function lock(on){const sel=$('rbcSel'),fields=$('rbcFields'),btn=$('rbcSave');if(sel)sel.disabled=on;if(fields)fields.disabled=on||!st.itemId||st.baseline===null||!!st.blocked;if(btn)btn.textContent=on?'در حال ذخیره…':'ذخیره این نوشیدنی'}
function clearForm(){st.seq++;st.loading=false;st.baseline=null;st.line=null;st.existing=false;st.blocked='';fill(null);for(const id of ['rbcExpected','rbcDaily','rbcOvernight'])out(id,'—','na');for(const id of ['rbcMorningBy','rbcNightBy'])if($(id))$(id).textContent='';lock(false)}
function recalc(){if(!st.itemId||st.baseline===null)return;const {values:v,invalid}=readForm();for(const f of FIELDS)$(`rbc_${f}`)?.setAttribute('aria-invalid',invalid.includes(f)?'true':'false');const reason=$('rbc_nonSaleReason');if(reason)reason.required=v.nonSale>0;
 const bad=invalid.some(f=>COUNT_FIELDS.includes(f)),m=metrics({...(st.line||{}),...v,formulaVersion:FORMULA},st.doc?prevLineOf(st.doc,st.date,st.itemId):null);
 if(bad){for(const id of ['rbcExpected','rbcDaily','rbcOvernight'])out(id,'ورودی نامعتبر','bad');return}
 out('rbcExpected',m.expectedNight===null?`قابل محاسبه نیست — ${m.missingExpected.join('، ')} وارد نشده`:fa(m.expectedNight),m.expectedNight===null?'na':'');
 out('rbcDaily',m.daily===null?`قابل محاسبه نیست — ${m.missingDaily.join('، ')} وارد نشده`:dailyText(m.daily),m.daily===null?'na':m.daily>0?'bad':m.daily<0?'good':'');
 out('rbcOvernight',m.overnight===null?`قابل محاسبه نیست — ${m.missingOvernight.join('، ')} ${m.prevNight===null?'ثبت نشده':'وارد نشده'}`:overnightText(m.overnight),m.overnight===null?'na':m.overnight<0?'bad':m.overnight>0?'good':'');
 const pn=$('rbcPrevNight'),keeper=st.doc?roleText(rolesOf(recordOf(st.doc,addDays(st.date,-1))).storekeeper):'';if(pn)pn.textContent=m.prevNight===null?'(صبح امروز − تحویل انباردار شب قبل)':`(تحویل شب قبل: ${fa(m.prevNight)}${keeper?` — انباردار: ${keeper}`:''})`}
async function load(){const seq=++st.seq,date=st.date,itemId=st.itemId,item=itemOf(itemId);st.loading=true;st.baseline=null;st.line=null;st.existing=false;st.blocked='';fill(null);for(const id of ['rbcExpected','rbcDaily','rbcOvernight'])out(id,'—','na');lock(false);status(`در حال بررسی اطلاعات ثبت‌شدهٔ ${item?.name||''} برای ${date}…`);
 try{const doc=await cfg.load();if(seq!==st.seq)return;st.doc=doc;cfg.onLoaded?.(doc);const record=recordOf(doc,date),line=lineOf(record,itemId),v=values(line);st.line=line;st.baseline=fingerprint(line);st.existing=!!line;st.blocked=S(cfg.canEdit?.(date,!!line));fill(line);fillRoles(record);refreshItems();
  const mb=$('rbcMorningBy'),nb=$('rbcNightBy');if(mb)mb.textContent=v.morningSplit===false?`مقدار تاریخی بدون تفکیک بالا/پایین: ${fa(v.morning)}`:byText(line?.morningCountedBy,'ثبت صبح');if(nb)nb.textContent=v.nightSplit===false?`مقدار تاریخی بدون تفکیک بالا/پایین: ${fa(v.night)}`:byText(line?.nightCountedBy,'ثبت شب');
  const edited=line?.updatedBy?.name?` آخرین ویرایش: ${line.updatedBy.name} — ${atText(line.updatedAt)}.`:'';
  status(st.blocked||(line?`برای این تاریخ قبلاً اطلاعات ${item?.name||''} ثبت شده و در فرم بارگذاری شد.${edited}`:`اطلاعات ${item?.name||''} برای ${date} هنوز ثبت نشده است.`),st.blocked?'warn':'');lock(false);recalc();$('rbcFields')?.scrollIntoView?.({block:'start',behavior:'smooth'})}
 catch(e){if(seq!==st.seq)return;st.doc=null;status(`دریافت اطلاعات انجام نشد؛ ثبت ممکن نیست. ${S(e?.message)}`,'error')}
 finally{if(seq===st.seq)st.loading=false}}
function setDate(v){if(st.saving)return;const d=normDate(v),el=$('rbcDate');if(!d||d>today()){if(el)el.value=st.date;return cfg?.toast?.(d?'تاریخ نمی‌تواند بعد از امروز باشد':'تاریخ شمسی معتبر وارد کنید',true)}st.date=d;if(el)el.value=d;refreshItems();if(st.itemId)return load();if(st.doc)fillRoles(recordOf(st.doc,d));clearForm()}
function setItem(id){if(st.saving)return;st.itemId=S(id);refreshItems();if(st.itemId)return load();clearForm();status('نوشیدنی را انتخاب کنید.')}
async function save(){if(st.saving||st.loading)return;if(!st.itemId)return cfg.toast?.('نوشیدنی را انتخاب کنید',true);if(st.baseline===null)return cfg.toast?.('اطلاعات این نوشیدنی هنوز بارگذاری نشده است',true);if(st.blocked)return cfg.toast?.(st.blocked,true);
 const item=itemOf(st.itemId);if(!item)return cfg.toast?.('این نوشیدنی در فهرست کنترل نیست',true);
 const {values:vals,errors}=readForm();if(errors.length){status(errors.join('؛ '),'error');return cfg.toast?.(errors[0],true)}
 const roles=readRoles(),lineChanged=changedFields(st.line,vals).length>0;
 if(!lineChanged&&!roles)return cfg.toast?.(st.existing?'تغییری برای ذخیره وجود ندارد':'حداقل یک مقدار وارد کنید',true);
 const date=st.date,itemId=st.itemId;st.saving=true;lock(true);
 try{if(st.existing&&lineChanged&&!await (cfg.confirm||(m=>window.confirm(m)))(EDIT_CONFIRM))return status('ذخیره لغو شد؛ مقادیر فرم حفظ شده است.','warn');
  status('در حال ذخیره…');const who=await cfg.actor(),doc=await cfg.load(),at=new Date().toISOString(),requestId=window.RAYO_API_GATEWAY?.createRequestId?.()||String(Date.now());
  const r=applyEdit(doc,{date,item,values:vals,actor:who,at,baseline:st.baseline,recordId:`BEV-${requestId}`,roles}),ok=c=>(!lineChanged||savedMatches(c,date,itemId,vals))&&(!roles||rolesMatch(c,date,roles));
  if(r.changed){let checked=null;try{checked=await cfg.save(doc)}catch(e){if(!UNKNOWN_SAVE.includes(S(e?.code)))throw e;checked=await cfg.load().catch(()=>null);if(!checked||!ok(checked))throw e}
   if(!checked)checked=await cfg.load();if(!ok(checked))throw new Error('ذخیره روی سرور تأیید نشد؛ مقادیر فرم حفظ شد. دوباره تلاش کنید.');st.doc=checked;cfg.onSaved?.(checked)}
  cfg.toast?.(`اطلاعات ${item.name} برای ${date} ذخیره شد`);st.itemId='';refreshItems();clearForm();status(`اطلاعات ${item.name} ذخیره شد. نوشیدنی بعدی را انتخاب کنید.`,'ok')}
 catch(e){if(e?.code==='bev_conflict'){st.line=e.current;st.baseline=fingerprint(e.current);st.existing=!!e.current;status('اطلاعات این نوشیدنی پس از بارگذاری فرم توسط کاربر دیگری تغییر کرده است. مقادیر شما حفظ شد؛ برای جایگزینی، دوباره «ذخیره» را بزنید.','error');cfg.toast?.('تغییر هم‌زمان؛ مقادیر فرم حفظ شد',true)}else{status(S(e?.message)||'ذخیره انجام نشد؛ مقادیر فرم حفظ شد.','error');cfg.toast?.(S(e?.message)||'ذخیره انجام نشد؛ مقادیر فرم حفظ شد',true)}}
 finally{st.saving=false;lock(false)}}
window.RayoBeverageControl={FORMULA,COUNT_FIELDS,TEXT_FIELDS,FIELDS,LABELS,ROLES,ROLE_KEYS,EDIT_CONFIRM,parseCount,read,values,formValues,metrics,changedFields,applyEdit,savedMatches,fingerprint,records,recordOf,lineOf,prevLineOf,rolesOf,changedRoles,rolesMatch,roleText,today,normDate,addDays,signed,dailyText,overnightText,atText,byText,
 form:{html,setDate,setItem,recalc,save,state:()=>({...st})}};
})();
// "Other receipts/payments" types for the staff cash form. Same built-in list as CR_TYPES in
// 11-rayo-cash-report-module.js and the same admin-managed settings keys (overrides + custom).
window.RayoCashTypes={
  base:[
    {value:'previousDepositUsed',label:'مصرف بیعانه قبلی برای فروش امروز',sign:1,follow:false},
    {value:'futureDepositReceived',label:'بیعانه دریافت‌شده برای روز آینده',sign:-1,follow:false},
    {value:'customerReceivable',label:'طلب از مشتری / پرداخت‌نشده',sign:1,follow:true},
    {value:'oldReceivableReceived',label:'دریافت طلب مربوط به روزهای قبل',sign:-1,follow:false},
    {value:'refundOrCorrection',label:'برگشت وجه یا اصلاح پرداخت',sign:1,follow:false},
    {value:'otherIncrease',label:'سایر موارد افزاینده مغایرت',sign:1,follow:false},
    {value:'otherDecrease',label:'سایر موارد کاهنده مغایرت',sign:-1,follow:false}
  ],
  effective(settings={},includeInactive=false){
    const overrides=isObject(settings?.otherTransactionTypeOverrides)?settings.otherTransactionTypeOverrides:{},custom=Array.isArray(settings?.otherTransactionTypesCustom)?settings.otherTransactionTypesCustom:[];
    const base=this.base.map(t=>{const o=overrides[t.value]||{};return{value:t.value,label:String(o.label||'').trim()||t.label,sign:o.sign===-1||o.sign===1?o.sign:t.sign,follow:typeof o.follow==='boolean'?o.follow:t.follow,status:o.status==='غیرفعال'?'غیرفعال':'فعال',builtin:true}});
    const all=[...base,...custom.map(t=>({value:t.value,label:String(t.label||'').trim(),sign:Number(t.sign)===-1?-1:1,follow:t.follow===true,status:t.status==='غیرفعال'?'غیرفعال':'فعال',builtin:false}))];
    return includeInactive?all:all.filter(t=>t.status!=='غیرفعال');
  }
};

window.RAYO_API_GATEWAY={
  loadUrl:LOAD_URL,
  saveUrl:SAVE_URL,
  queryUrl:QUERY_URL,
  mutateUrl:MUTATE_URL,
  backendModuleName,
  moduleLoadUrl,
  moduleSaveUrl,
  parseJsonString,
  extractModule,
  normalizeModule,
  loadModule,
  loadOrBootstrap,
  saveModule,
  queryCollection,
  mutateRecord,
  createRequestId:requestId,
  getModuleVersion:moduleVersion,
  moduleVersions:MODULE_VERSIONS,
  ApiError:RayoApiError,
  looksLikeModule,
  canonicalizeObject,
  apiVersion:'10.10.0',
  apiPrefix:String(ENV.API_PREFIX||'/api/v1.0'),
  dataSource:'RayoData API only',
  currentPageFile,
  getModuleStatus:(module)=>clone(MODULE_RUNTIME_STATUS[frontendModuleName(module)]||{state:'unknown',initialized:null,sourceValid:false,readOnly:true}),
  isModuleInitialized:(module)=>MODULE_RUNTIME_STATUS[frontendModuleName(module)]?.initialized===true,
  supportedModules:()=>SUPPORTED_MODULES.slice(),
  seedConfig,
  loadSeedFile,
  moduleHasBusinessData,
  emptyModuleShape,
  seedPolicy:'manual-initialize-or-reset-only'
};
window.RAYO_CONFIG={
  apiOrigin:API_ORIGIN,
  timeoutMs:TIMEOUT_MS,
  verifyAfterSave:true,
  hr:{module:'hr',backendModule:'personnel',loadUrl:moduleLoadUrl('hr'),saveUrl:moduleSaveUrl('hr'),seed:{url:'./seed/personnel-data.seed.json',bootstrapId:'personnel-v9.4-initial'}},
  suppliers:{module:'suppliers',loadUrl:moduleLoadUrl('suppliers'),saveUrl:moduleSaveUrl('suppliers'),seed:{url:'./seed/suppliers-data.seed.json',bootstrapId:'suppliers-v9.4-initial'}},
  pricing:{module:'pricing',loadUrl:moduleLoadUrl('pricing'),saveUrl:moduleSaveUrl('pricing'),seed:{url:'./seed/pricing-data.seed.json',bootstrapId:'pricing-sepids-1405-05-19',migrationId:'pricing-sepids-master-1405-05-19-v2'}},
  inventory:{module:'inventory',loadUrl:moduleLoadUrl('inventory'),saveUrl:moduleSaveUrl('inventory'),seed:{url:'./seed/inventory-data.seed.json',bootstrapId:'inventory-v9.4-initial'}},
  cashreport:{module:'cashreport',loadUrl:moduleLoadUrl('cashreport'),saveUrl:moduleSaveUrl('cashreport'),seed:{url:'./seed/cash-report-data.seed.json',bootstrapId:'cashreport-v9.4-initial'}},
  assets:{module:'assets',loadUrl:moduleLoadUrl('assets'),saveUrl:moduleSaveUrl('assets'),seed:{url:'./seed/assets-data.seed.json',bootstrapId:'assets-v9.4-initial'}},
  finance:{module:'finance',loadUrl:moduleLoadUrl('finance'),saveUrl:moduleSaveUrl('finance'),seed:{url:'./seed/finance-data.seed.json',bootstrapId:'finance-v9.5-initial'}},
  survey:{module:'survey',loadUrl:moduleLoadUrl('survey'),saveUrl:moduleSaveUrl('survey'),seed:{url:'./seed/survey-data.seed.json',bootstrapId:'survey-v9.5-initial'}},
  errorlog:{module:'errorlog',loadUrl:moduleLoadUrl('errorlog'),saveUrl:moduleSaveUrl('errorlog'),seed:{url:'./seed/error-log-data.seed.json',bootstrapId:'errorlog-v9.8-initial'}},
  sepidsaudit:{module:'sepidsaudit',loadUrl:moduleLoadUrl('sepidsaudit'),saveUrl:moduleSaveUrl('sepidsaudit'),seed:{url:'./seed/sepids-audit-data.seed.json',bootstrapId:'sepidsaudit-v10-initial'}}
};
})();
