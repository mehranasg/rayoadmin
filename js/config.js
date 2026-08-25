(function(){
'use strict';

/*
  Rayo API gateway v10.10.0
  - تنها API معتبر: RayoData/Load و RayoData/Save.
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
const MODULE_RUNTIME_STATUS=Object.fromEntries(SUPPORTED_MODULES.map(m=>[m,{state:'idle',initialized:null,lastError:'',lastSuccessAt:null}]));
const MODULE_LOAD_PROMISES=new Map();
const SEED_OBJECTS=new WeakSet();
window.RAYO_SEED_POLICY='manual-initialize-or-reset-only';
function currentPageFile(){return (location.pathname.split('/').pop()||'index.html').toLowerCase()}
function setModuleStatus(module,state,error=''){const s=MODULE_RUNTIME_STATUS[module]||(MODULE_RUNTIME_STATUS[module]={});s.state=state;s.lastError=error?String(error?.message||error):'';if(state==='ready')s.lastSuccessAt=new Date().toISOString()}
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
  inventory:{arrays:['trackedIngredients','periods','itemMappings','changeLog','purchaseInvoices','supplierPayments','stockReceipts','wasteRecords','wasteShiftDeclarations','consumptionRecords','salesPeriods','stocktakes','locations','openingBalances','inventoryMovements','periodClosures','operationalUsagePeriods'],objects:['meta','settings']},
  cashreport:{arrays:['cashiers','reports','changeLog'],objects:['meta','settings','salesAnalytics']},
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
    settings:{inputCurrency:'ریال',displayCurrency:'تومان',discrepancyLimit:1000000},salesAnalytics:{daily:[],monthly:[],itemDaily:[]},cashiers:[],reports:[],changeLog:[]
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
  if(!SUPPORTED_MODULES.includes(module))throw new Error(`نام ماژول نامعتبر است: ${module}`);
  return BACKEND_MODULES[module];
}
function moduleLoadUrl(module){return appendQuery(LOAD_URL,'module',backendModuleName(module))}
function moduleSaveUrl(module){return appendQuery(SAVE_URL,'module',backendModuleName(module))}

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
  const timer=setTimeout(()=>controller.abort(),timeoutMs);
  try{
    return await fetch(url,{...options,signal:controller.signal,cache:'no-store',credentials:'omit'});
  }catch(error){
    if(error?.name==='AbortError')throw new Error('Timeout');
    if(String(error?.message||'').toLowerCase().includes('failed to fetch'))throw new Error('CORS یا ارتباط شبکه');
    throw error;
  }finally{clearTimeout(timer)}
}
async function responsePayload(response){
  const text=await response.text();
  if(!response.ok)throw new Error(`HTTP ${response.status}${text.trim()?` — ${text.trim().slice(0,220)}`:''}`);
  if(!text.trim())throw new Error('پاسخ خالی');
  const parsed=parseJsonString(text);
  if(typeof parsed==='string')throw new Error(`پاسخ JSON معتبر نیست: ${parsed.slice(0,160)}`);
  return parsed;
}
async function loadModule(module){
  if(MODULE_LOAD_PROMISES.has(module))return MODULE_LOAD_PROMISES.get(module);
  const task=(async()=>{
    setModuleStatus(module,'loading');
    let lastError=null;
    for(const wait of [0,700]){
      if(wait)await new Promise(r=>setTimeout(r,wait));
      try{
        const url=appendQuery(moduleLoadUrl(module),'_',Date.now());
        const response=await fetchTimeout(url,{method:'GET',headers:{'Accept':'application/json'}});
        const payload=await responsePayload(response);
        const raw=extractModule(payload,module);
        const value=normalizeModule(payload,module);
        setModuleStatus(module,'ready');
        MODULE_RUNTIME_STATUS[module].initialized=rawModuleInitialized(raw);
        return value;
      }catch(error){
        lastError=error;
        const msg=String(error?.message||error||'');
        if(!msg.includes('HTTP 500'))break;
      }
    }
    const backend=backendModuleName(module);
    const wrapped=new Error(`ماژول ${backend}: ${String(lastError?.message||lastError||'خطا در دریافت اطلاعات')}`);
    setModuleStatus(module,'error',wrapped);
    throw wrapped;
  })();
  MODULE_LOAD_PROMISES.set(module,task);
  try{return await task}finally{MODULE_LOAD_PROMISES.delete(module)}
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
  if(!response.ok)throw new Error(`HTTP ${response.status}${text.trim()?` — ${text.trim().slice(0,220)}`:''}`);
  return text;
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
  if(SEED_OBJECTS.has(data)&&!allowSeedWrite)throw new Error('ذخیره خودکار Seed مسدود شد؛ Seed فقط از مسیر صریح «بارگذاری اولیه» یا «بازنشانی اطلاعات» توسط مدیر مجاز است.');
  const liveConfirmed=MODULE_RUNTIME_STATUS[module]?.state==='ready';
  const initialized=MODULE_RUNTIME_STATUS[module]?.initialized===true;
  if(module!=='errorlog'&&!liveConfirmed&&!allowUnconfirmedWrite)throw new Error(`ذخیره ${backendModuleName(module)} مسدود شد: نسخه زنده این ماژول در این نشست از سرور با موفقیت Load نشده است. ابتدا بروزرسانی/Load سرور را انجام دهید.`);
  if(module!=='errorlog'&&!initialized&&!allowInitialize)throw new Error(`ذخیره ${backendModuleName(module)} مسدود شد: این ماژول هنوز مقداردهی اولیه نشده است. از تنظیمات ← «بارگذاری اطلاعات اولیه» استفاده کنید.`);
  if(!isObject(data))throw new Error(`ساختار داده ${backendModuleName(module)} برای ذخیره معتبر نیست.`);
  data.meta=isObject(data.meta)?data.meta:{};
  data.meta.serverSaveToken=`${backendModuleName(module).toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  data.meta.updatedAt=new Date().toISOString();
  const url=moduleSaveUrl(module);
  try{
    window.RayoSaveStatus?.saving?.(module);
    await postJson(url,data);
    if(!verify){
      if(module!=='errorlog')rayoSetSaveStatus('verified',`● ارسال به سرور انجام شد — ${new Date().toLocaleTimeString('fa-IR')} (بدون بازخوانی تأییدی)`,module);
      return{ok:true,verified:null,verificationSkipped:true};
    }
    window.RayoSaveStatus?.verifying?.(module);
    const result=await verifySavedModule(module,data);
    if(result?.verified){
      window.RayoSaveStatus?.verified?.(module);
      return{ok:true,verified:true,checked:result.checked};
    }
    const msg=result?.warning||'تأیید نسخه سرور انجام نشد';
    window.RayoSaveStatus?.warning?.(module,msg);
    const err=new Error(`ارسال انجام شد اما ذخیره روی سرور تأیید نشد. اطلاعات این صفحه را نبندید. ${msg}`);
    try{window.RayoErrorLog?.capture?.(err,{source:'save-verify-required',module,severity:'error'})}catch(_){ }
    throw err;
  }catch(error){
    if(!String(error?.message||'').includes('اطلاعات این صفحه را نبندید'))window.RayoSaveStatus?.error?.(module,String(error?.message||error||''));
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

window.RAYO_API_GATEWAY={
  loadUrl:LOAD_URL,
  saveUrl:SAVE_URL,
  backendModuleName,
  moduleLoadUrl,
  moduleSaveUrl,
  parseJsonString,
  extractModule,
  normalizeModule,
  loadModule,
  loadOrBootstrap,
  saveModule,
  looksLikeModule,
  canonicalizeObject,
  apiVersion:'10.10.0',
  dataSource:'RayoData API only',
  currentPageFile,
  getModuleStatus:(module)=>clone(MODULE_RUNTIME_STATUS[module]||{state:'unknown',initialized:null}),
  isModuleInitialized:(module)=>MODULE_RUNTIME_STATUS[module]?.initialized===true,
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
