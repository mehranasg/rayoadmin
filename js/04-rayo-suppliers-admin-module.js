
(function(){
'use strict';
const SUPPLIERS_APP_CONFIG={
  storageMode:'api',
  storageKey:'rayo_suppliers_v1',
  seedUrl:window.RAYO_CONFIG?.suppliers?.seed?.url||'',
  api:{loadUrl:window.RAYO_CONFIG?.suppliers?.loadUrl||'',saveUrl:window.RAYO_CONFIG?.suppliers?.saveUrl||''}
};
const SUPPLIER_EMPTY_DATA={
  meta:{schemaVersion:'1.0.0',module:'Rayo Suppliers',restaurant:'کافه‌رستوران رایو',updatedAt:null,currency:'تومان'},
  lists:{supplierGroups:[],itemGroups:[],invoiceTypes:['رسمی','غیررسمی','هر دو','نامشخص'],orderMethods:[],settlementMethods:[],statuses:['فعال','غیرفعال','در حال بررسی'],yesNo:['بله','خیر'],communicationChannels:[],units:[],usageLocations:[],ratings:[1,2,3,4,5],orderOwners:[],weekDays:['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه']},
  suppliers:[],items:[],supplierItems:[],purchaseRequests:[],changeLog:[]
};
let supplierState=null,supplierLoaded=false,supplierLoading=false,supplierFileHandle=null;
const supplierUI={tab:'suppliers',search:'',group:'',status:'',activityType:'',itemSearch:'',itemGroup:'',relationSupplier:'',relationItem:''};

function supClone(x){return JSON.parse(JSON.stringify(x))}
function supArr(x){return Array.isArray(x)?x:[]}
function supUnique(a){return [...new Set(supArr(a).map(x=>String(x??'').trim()).filter(Boolean))]}
function supDays(v){return Array.isArray(v)?v.map(x=>String(x??'').trim()).filter(Boolean):String(v??'').split(/[،,|\n]+/).map(x=>x.trim()).filter(Boolean)}
function supMigrate(raw){
  const d=raw&&typeof raw==='object'?raw:{};
  const x={...supClone(SUPPLIER_EMPTY_DATA),...d};
  x.meta={...SUPPLIER_EMPTY_DATA.meta,...(d.meta||{})};
  x.lists={...SUPPLIER_EMPTY_DATA.lists,...(d.lists||{})};
  Object.keys(x.lists).forEach(k=>x.lists[k]=supArr(x.lists[k]));
  x.suppliers=supArr(d.suppliers).map((r,i)=>({...r,id:r.id||r.code||`SUP-${String(i+1).padStart(4,'0')}`,orderDays:supDays(r.orderDays),deliveryDays:supDays(r.deliveryDays)}));
  x.items=supArr(d.items).map((r,i)=>({...r,id:r.id||r.code||`ITM-${String(i+1).padStart(4,'0')}`}));
  x.supplierItems=supArr(d.supplierItems).map((r,i)=>({...r,id:r.id||`REL-${String(i+1).padStart(4,'0')}`}));
  x.purchaseRequests=supArr(d.purchaseRequests);
  x.changeLog=supArr(d.changeLog);
  return x;
}
function supNormalizePayload(payload){
  let x=payload;
  for(let i=0;i<5;i++){
    if(typeof x==='string'){
      const t=x.trim();
      if(!t)break;
      try{x=JSON.parse(t);continue}catch(_){break}
    }
    if(x&&typeof x==='object'){
      const wrapped=x.data??x.result??x.value??x.payload??x.content;
      if(wrapped!==undefined&&wrapped!==x){x=wrapped;continue}
    }
    break;
  }
  if(Array.isArray(x?.suppliers)&&Array.isArray(x?.items)&&Array.isArray(x?.supplierItems))return x;
  if(window.RAYO_API_GATEWAY?.extractModule)x=window.RAYO_API_GATEWAY.extractModule(x,'suppliers');
  if(!x||typeof x!=='object'||Array.isArray(x)||!Array.isArray(x.suppliers)||!Array.isArray(x.items)||!Array.isArray(x.supplierItems))throw Error('ساختار JSON تأمین‌کنندگان معتبر نیست');
  return x;
}
async function supReadJsonResponse(response,label){
  const contentType=(response.headers.get('content-type')||'').toLowerCase();
  const body=await response.text();
  if(!response.ok)throw Error(`${label} (HTTP ${response.status})`);
  if(!body.trim())throw Error(`${label}: پاسخ خالی است`);
  try{return supNormalizePayload(JSON.parse(body))}
  catch(e){
    if(contentType.includes('text/html')||/^\s*</.test(body))throw Error(`${label}: به‌جای JSON صفحه HTML دریافت شد`);
    throw Error(`${label}: ${e.message||'پاسخ نامعتبر'}`);
  }
}
const SupplierStorageAdapter={
  async load(){const x=await window.RAYO_API_GATEWAY.loadOrBootstrap('suppliers');SUPPLIERS_APP_CONFIG.lastLoadSource='api';return supNormalizePayload(x)},
  async save(data){data.meta=data.meta||{};const saveToken=`SUP-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;data.meta.serverSaveToken=saveToken;data.meta.updatedAt=new Date().toISOString();await window.RAYO_API_GATEWAY.saveModule('suppliers',data,{verify:window.RAYO_CONFIG?.verifyAfterSave!==false});return{ok:true}}
};
async function supEnsureLoaded(forceFile=false,silent=false){
  if(supplierLoading){while(supplierLoading)await new Promise(r=>setTimeout(r,30));return supplierState}
  if(supplierLoaded&&!forceFile)return supplierState;
  supplierLoading=true;
  try{supplierState=supMigrate(await SupplierStorageAdapter.load());supplierLoaded=true;if(currentView==='suppliers')renderView();return supplierState}
  catch(e){supplierState=supMigrate(SUPPLIER_EMPTY_DATA);supplierLoaded=true;if(!silent)toast(e.message||'خطا در بارگذاری تأمین‌کنندگان',true);if(currentView==='suppliers')renderView();return supplierState}
  finally{supplierLoading=false}
}

async function supRefreshData(){try{supplierState=supMigrate(await SupplierStorageAdapter.load());supplierLoaded=true;renderView();toast('اطلاعات تأمین‌کنندگان بروزرسانی شد')}catch(e){toast(e.message||'بروزرسانی تأمین‌کنندگان انجام نشد',true)}}
async function supSaveData(manual=false,reason='ذخیره اطلاعات تأمین‌کنندگان'){
  if(!supplierState)return;
  supplierState.meta.updatedAt=new Date().toISOString();
  supplierState.changeLog.unshift({id:supUid('SLOG',supplierState.changeLog),at:new Date().toISOString(),action:reason});
  supplierState.changeLog=supplierState.changeLog.slice(0,300);
  await SupplierStorageAdapter.save(supplierState);
  if(manual)toast('اطلاعات تأمین‌کنندگان روی سرور ذخیره شد');
}
async function supCommit(reason){try{await supSaveData(false,reason);closeModal();renderView();toast(reason+' با موفقیت ذخیره شد');return true}catch(e){toast(e.message||'ذخیره اطلاعات تأمین‌کنندگان انجام نشد',true);return false}}
function supUid(prefix,arr){let max=0;supArr(arr).forEach(x=>{const m=String(x.id||'').match(/(\d+)$/);if(m)max=Math.max(max,+m[1])});return `${prefix}-${String(max+1).padStart(4,'0')}`}
function supNextCode(prefix,arr,key='code'){let max=0;supArr(arr).forEach(x=>{const m=String(x[key]||'').match(/(\d+)$/);if(m)max=Math.max(max,+m[1])});return `${prefix}-${String(max+1).padStart(3,'0')}`}
function supText(v){return String(v??'').trim()}
function supMoney(v){const num=Number(String(v??'').replace(/[^\d.-]/g,''));return Number.isFinite(num)&&num?`${num.toLocaleString('fa-IR')} تومان`:'—'}
function supDisplayName(s){return s.company||s.contactName||s.code||'بدون نام'}
function supActivity(s){return ['goods','service','both'].includes(s?.activityType)?s.activityType:'goods'}
function supActivityLabel(s){return({goods:'تأمین کالا',service:'خدمات‌دهنده',both:'کالا و خدمات'})[supActivity(s)]}
function supSupplierByCode(code){return supplierState?.suppliers.find(x=>x.code===code)}
function supItemByCode(code){return supplierState?.items.find(x=>x.code===code)}
function supRelationCountForSupplier(code){return supplierState.supplierItems.filter(x=>x.supplierCode===code).length}
function supRelationCountForItem(code){return supplierState.supplierItems.filter(x=>x.itemCode===code).length}
function supListOptions(key){
  const options=supArr(supplierState?.lists?.[key]);
  return key==='orderMethods'?supUnique([...options,'اس ام اس']):options;
}
function supSelectObjects(arr,labelFn,valueKey='code'){return supArr(arr).map(x=>({value:x[valueKey],label:labelFn(x)}))}

function supTabs(){
  const tabs=[['suppliers','تأمین‌کنندگان',supplierState.suppliers.length],['relations','اقلام هر تأمین‌کننده',supplierState.supplierItems.length],['json','تنظیمات','']];
  return `<div class="supplier-module-tabs">${tabs.map(([k,l,c])=>`<button class="tab-pill ${supplierUI.tab===k?'active':''}" onclick="supplierUI.tab='${k}';renderView()">${l}${c!==''?` (${c})`:''}</button>`).join('')}</div>`;
}
function viewsSuppliers(){
  if(!supplierLoaded){setTimeout(()=>supEnsureLoaded(false),0);return pageHead('تأمین‌کنندگان','')+'<div class="card empty">در حال بارگذاری…</div>'}
  const active=supplierState.suppliers.filter(x=>x.status==='فعال').length;
  const actions=`<button class="btn" onclick="supRefreshData()">↻ بروزرسانی</button> <button class="btn btn-primary" onclick="supSaveData(true)">ذخیره روی سرور</button>`;
  return pageHead('مدیریت تأمین‌کنندگان','تعریف، جست‌وجو و مدیریت اطلاعات تأمین‌کنندگان',actions)+
    (supplierUI.tab==='suppliers'?'':`<div class="grid grid-4"><div class="card kpi supplier-kpi"><div class="label">کل تأمین‌کنندگان</div><div class="value">${supplierState.suppliers.length}</div></div><div class="card kpi supplier-kpi"><div class="label">تأمین‌کننده فعال</div><div class="value">${active}</div></div><div class="card kpi supplier-kpi"><div class="label">اقلام ثبت‌شده</div><div class="value">${supplierState.items.length}</div></div><div class="card kpi supplier-kpi"><div class="label">ارتباط‌ها</div><div class="value">${supplierState.supplierItems.length}</div></div></div>`)+
    supTabs()+
    (supplierUI.tab==='suppliers'?suppliersAdminList():supplierUI.tab==='relations'?supplierRelationsList():supplierJsonSettings());
}
function suppliersAdminList(){
  const q=supplierUI.search.toLowerCase(),rows=supplierState.suppliers.filter(s=>{
    const hay=[s.code,s.company,s.contactName,s.phone,s.mobile,s.mainGroup,s.purchaseItemsSummary].join(' ').toLowerCase();
    return(!q||hay.includes(q))&&(!supplierUI.group||s.mainGroup===supplierUI.group)&&(!supplierUI.status||s.status===supplierUI.status)&&(!supplierUI.activityType||supActivity(s)===supplierUI.activityType)
  });
  return `<div class="card"><div class="section-head"><div><h2>فهرست طرف‌های تجاری</h2></div><div class="supplier-list-actions"><button class="btn btn-primary" onclick="editSupplierAdmin()">+ افزودن طرف تجاری</button></div></div><div class="toolbar"><div class="field"><label>جست‌وجو</label><input value="${esc(supplierUI.search)}" data-live-filter="supplierUI.search" oninput="rayoLiveFilter(this,supplierUI,'search')" placeholder="نام، شرکت، کد یا تلفن"></div><div class="field"><label>نوع فعالیت</label><select onchange="supplierUI.activityType=this.value;renderView()"><option value="">همه</option><option value="goods" ${supplierUI.activityType==='goods'?'selected':''}>تأمین کالا</option><option value="service" ${supplierUI.activityType==='service'?'selected':''}>خدمات‌دهنده</option><option value="both" ${supplierUI.activityType==='both'?'selected':''}>کالا و خدمات</option></select></div><div class="field"><label>گروه</label><select onchange="supplierUI.group=this.value;renderView()"><option value="">همه گروه‌ها</option>${supListOptions('supplierGroups').map(x=>`<option ${supplierUI.group===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div><div class="field"><label>وضعیت</label><select onchange="supplierUI.status=this.value;renderView()"><option value="">همه وضعیت‌ها</option>${supListOptions('statuses').map(x=>`<option ${supplierUI.status===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>کد</th><th>نام/شرکت</th><th>نوع فعالیت</th><th>تخصص/گروه</th><th>تماس</th><th>تسویه</th><th>اقلام مرتبط</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(s=>`<tr><td>${esc(s.code||'—')}</td><td class="supplier-name-cell"><b>${esc(supDisplayName(s))}</b><small>${s.company&&s.contactName?`رابط: ${esc(s.contactName)}`:''}</small></td><td>${esc(supActivityLabel(s))}<br><small>${esc(s.partyKind==='person'?'شخص حقیقی':'شرکت/فروشگاه')}</small></td><td>${esc(s.serviceSpecialty||s.mainGroup||'—')}</td><td>${esc(s.mobile||s.phone||'—')}</td><td>${esc(s.settlementMethod||'—')}</td><td>${supActivity(s)==='service'?'لازم نیست':supRelationCountForSupplier(s.code)}</td><td>${badge(s.status||'نامشخص')}</td><td class="supplier-actions"><button class="btn btn-sm" onclick="editSupplierAdmin('${s.id}')">ویرایش</button>${supActivity(s)!=='service'?`<button class="btn btn-sm" onclick="supplierUI.tab='relations';supplierUI.relationSupplier='${esc(s.code)}';renderView()">اقلام</button>`:''}<a class="btn btn-sm" href="suppliers.html?tab=payment&supplier=${encodeURIComponent(s.id)}">پرداخت</a><button class="btn btn-danger btn-sm" onclick="deleteSupplierAdmin('${s.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan="9" class="empty">طرف تجاری ثبت نشده است.</td></tr>'}</tbody></table></div></div>`;
}
function supplierItemsList(){
  const q=supplierUI.itemSearch.toLowerCase(),rows=supplierState.items.filter(x=>{
    const hay=[x.code,x.name,x.mainGroup,x.subGroup,x.specification,x.usageLocation].join(' ').toLowerCase();
    return(!q||hay.includes(q))&&(!supplierUI.itemGroup||x.mainGroup===supplierUI.itemGroup)
  });
  return `<div class="card"><div class="section-head"><div><h2>فهرست اقلام</h2><p class="muted">اقلام خرید و مصرف.</p></div><button class="btn btn-primary" onclick="editSupplierItem()">+ افزودن قلم</button></div><div class="toolbar"><div class="field"><label>جست‌وجو</label><input value="${esc(supplierUI.itemSearch)}" data-live-filter="supplierUI.itemSearch" oninput="rayoLiveFilter(this,supplierUI,'itemSearch')" placeholder="نام، کد، گروه یا محل مصرف"></div><div class="field"><label>گروه قلم</label><select onchange="supplierUI.itemGroup=this.value;renderView()"><option value="">همه گروه‌ها</option>${supListOptions('itemGroups').map(x=>`<option ${supplierUI.itemGroup===x?'selected':''}>${esc(x)}</option>`).join('')}</select></div></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>کد</th><th>نام قلم</th><th>گروه / زیرگروه</th><th>واحد خرید</th><th>نقطه سفارش</th><th>محل مصرف</th><th>تأمین‌کننده مرتبط</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.code)}</td><td><b>${esc(x.name)}</b><br><small class="muted">${esc(x.specification||'')}</small></td><td>${esc([x.mainGroup,x.subGroup].filter(Boolean).join(' / ')||'—')}</td><td>${esc(x.purchaseUnit||'—')}</td><td>${x.reorderPoint!==''?esc(String(x.reorderPoint)):'—'}</td><td>${esc(x.usageLocation||'—')}</td><td>${supRelationCountForItem(x.code)}</td><td>${badge(x.status||'نامشخص')}</td><td class="supplier-actions"><button class="btn btn-sm" onclick="editSupplierItem('${x.id}')">ویرایش</button><button class="btn btn-sm" onclick="supplierUI.tab='relations';supplierUI.relationItem='${esc(x.code)}';renderView()">تأمین‌کنندگان</button><button class="btn btn-danger btn-sm" onclick="deleteSupplierItem('${x.id}')">حذف</button></td></tr>`).join('')||'<tr><td colspan="9" class="empty">قلمی ثبت نشده است.</td></tr>'}</tbody></table></div></div>`;
}
function supplierRelationsList(){
  const rows=supplierState.supplierItems.filter(r=>(!supplierUI.relationSupplier||r.supplierCode===supplierUI.relationSupplier)&&(!supplierUI.relationItem||r.itemCode===supplierUI.relationItem));
  return `<div class="card"><div class="section-head"><div><h2>ارتباط تأمین‌کننده و اقلام</h2><p class="muted">ارتباط قلم و تأمین‌کننده.</p></div><button class="btn btn-primary" onclick="editSupplierRelation()">+ افزودن ارتباط</button></div><div class="toolbar"><div class="field"><label>تأمین‌کننده</label><select onchange="supplierUI.relationSupplier=this.value;renderView()"><option value="">همه تأمین‌کنندگان</option>${supplierState.suppliers.map(s=>`<option value="${esc(s.code)}" ${supplierUI.relationSupplier===s.code?'selected':''}>${esc(s.code+' | '+supDisplayName(s))}</option>`).join('')}</select></div><div class="field"><label>قلم</label><select onchange="supplierUI.relationItem=this.value;renderView()"><option value="">همه اقلام</option>${supplierState.items.map(i=>`<option value="${esc(i.code)}" ${supplierUI.relationItem===i.code?'selected':''}>${esc(i.code+' | '+i.name)}</option>`).join('')}</select></div><button class="btn" onclick="supplierUI.relationSupplier='';supplierUI.relationItem='';renderView()">حذف فیلتر</button></div></div><div class="card"><div class="table-wrap"><table class="data-table"><thead><tr><th>تأمین‌کننده</th><th>قلم</th><th>مشخصات تأمین‌شده</th><th>آخرین قیمت</th><th>آخرین خرید</th><th>زمان تحویل</th><th>اصلی؟</th><th>وضعیت</th><th></th></tr></thead><tbody>${rows.map(r=>{const s=supSupplierByCode(r.supplierCode),i=supItemByCode(r.itemCode);return `<tr><td>${esc(s?`${s.code} | ${supDisplayName(s)}`:r.supplierCode)}</td><td>${esc(i?`${i.code} | ${i.name}`:r.itemCode)}</td><td>${esc(r.suppliedSpecification||'—')}</td><td>${supMoney(r.lastPurchasePriceToman)}</td><td>${esc(r.lastPurchaseDate||'—')}</td><td>${esc(r.deliveryTime||'—')}</td><td>${badge(r.isPrimary||'خیر')}</td><td>${badge(r.status||'نامشخص')}</td><td class="supplier-actions"><button class="btn btn-sm" onclick="editSupplierRelation('${r.id}')">ویرایش</button><button class="btn btn-danger btn-sm" onclick="deleteSupplierRelation('${r.id}')">حذف</button></td></tr>`}).join('')||'<tr><td colspan="9" class="empty">ارتباطی ثبت نشده است.</td></tr>'}</tbody></table></div></div>`;
}
function supplierJsonSettings(){
  return `<div class="card"><div class="section-head"><h2>ذخیره‌سازی</h2><button class="btn btn-primary" onclick="supSaveData(true)">ذخیره روی سرور</button></div><div class="supplier-json-status">JSON مستقل تأمین‌کنندگان</div></div><div class="card"><h2>فهرست‌های مرجع</h2><div class="grid grid-3"><div><b>گروه تأمین‌کننده</b><p class="muted">${supListOptions('supplierGroups').map(esc).join('، ')||'—'}</p></div><div><b>نوع فاکتور</b><p class="muted">${supListOptions('invoiceTypes').map(esc).join('، ')||'—'}</p></div><div><b>روش سفارش</b><p class="muted">${supListOptions('orderMethods').map(esc).join('، ')||'—'}</p></div></div></div>`;
}

function editSupplierAdmin(id){
  const current=id?supplierState.suppliers.find(x=>x.id===id):null;
  const initial=current||{code:supNextCode('SUP',supplierState.suppliers),status:'فعال',activityType:'goods',partyKind:'company',invoiceType:'نامشخص',hasTelegram:'خیر',hasWhatsapp:'خیر',hasBale:'خیر',hasPhoneCall:'بله'};
  openForm(id?'ویرایش طرف تجاری':'افزودن طرف تجاری',[
    {name:'code',label:'کد تأمین‌کننده'},{name:'status',label:'وضعیت',type:'select',options:supListOptions('statuses')},{name:'mainGroup',label:'گروه اصلی',type:'select',options:supListOptions('supplierGroups')},
    {name:'activityType',label:'نوع فعالیت',type:'select',options:[{value:'goods',label:'تأمین کالا'},{value:'service',label:'خدمات‌دهنده'},{value:'both',label:'کالا و خدمات'}]},{name:'partyKind',label:'ماهیت طرف',type:'select',options:[{value:'company',label:'شرکت / فروشگاه'},{value:'person',label:'شخص حقیقی'}]},
    {name:'company',label:'نام شرکت / فروشگاه'},{name:'contactName',label:'نام رابط'},{name:'mobile',label:'موبایل'},{name:'phone',label:'تلفن'},
    {name:'serviceSpecialty',label:'تخصص / نوع خدمت'},{name:'serviceDescription',label:'شرح خدمات',type:'textarea',full:true},
    {name:'invoiceType',label:'نوع فاکتور',type:'select',options:supListOptions('invoiceTypes')},{name:'orderMethod',label:'نحوه سفارش‌گذاری',type:'select',options:supListOptions('orderMethods')},{name:'orderOwner',label:'مسئول سفارش',type:'select',options:supListOptions('orderOwners')},
    {name:'orderDays',label:'روزهای سفارش‌گیری (با ویرگول جدا کنید)'},{name:'deliveryDays',label:'روزهای ارسال/تحویل (با ویرگول جدا کنید)'},{name:'deliveryTime',label:'بازه یا زمان معمول تحویل'},
    {name:'settlementMethod',label:'نحوه تسویه',type:'select',options:supListOptions('settlementMethods')},{name:'settlementDays',label:'مهلت تسویه (روز)',type:'number'},{name:'minimumOrderToman',label:'حداقل سفارش (تومان)',type:'number'},
    {name:'preferredChannel',label:'ارتباط ترجیحی',type:'select',options:supListOptions('communicationChannels')},{name:'hasTelegram',label:'تلگرام',type:'select',options:supListOptions('yesNo')},{name:'hasWhatsapp',label:'واتس‌اپ',type:'select',options:supListOptions('yesNo')},{name:'hasBale',label:'بله',type:'select',options:supListOptions('yesNo')},{name:'hasPhoneCall',label:'تماس تلفنی',type:'select',options:supListOptions('yesNo')},
    {name:'email',label:'ایمیل'},{name:'communicationAddress',label:'شناسه / آدرس ارتباطی'},{name:'bestCallTime',label:'زمان مناسب تماس'},
    {name:'bankName',label:'نام بانک'},{name:'accountNumber',label:'شماره حساب'},{name:'cardNumber',label:'شماره کارت'},{name:'iban',label:'شماره شبا'},
    {name:'deliveryTerms',label:'شرایط ارسال'},{name:'deliveryArea',label:'محدوده ارسال'},{name:'qualityRating',label:'امتیاز کیفیت',type:'select',options:supListOptions('ratings')},{name:'priceRating',label:'امتیاز قیمت',type:'select',options:supListOptions('ratings')},{name:'punctualityRating',label:'امتیاز خوش‌قولی',type:'select',options:supListOptions('ratings')},
    {name:'purchaseGroupsSummary',label:'گروه‌های خرید (خلاصه)',full:true},{name:'purchaseItemsSummary',label:'آیتم‌های خرید (خلاصه)',type:'textarea',full:true},{name:'notes',label:'توضیحات',type:'textarea',full:true},{name:'lastReviewDate',label:'تاریخ آخرین بازبینی'}
  ],initial,async o=>{
    if(!o.company&&!o.contactName)throw Error('نام شرکت یا نام رابط الزامی است');
    o.orderDays=supDays(o.orderDays);o.deliveryDays=supDays(o.deliveryDays);
    o.code=supText(o.code)||supNextCode('SUP',supplierState.suppliers);
    const duplicate=supplierState.suppliers.find(x=>x.code===o.code&&x.id!==id);if(duplicate)throw Error('کد تأمین‌کننده تکراری است');
    if(current){
      const old=current.code;Object.assign(current,o);
      if(old!==o.code){supplierState.supplierItems.forEach(r=>{if(r.supplierCode===old)r.supplierCode=o.code});supplierState.items.forEach(i=>{if(i.preferredSupplierCode===old)i.preferredSupplierCode=o.code;if(i.alternateSupplierCode===old)i.alternateSupplierCode=o.code})}
    }else supplierState.suppliers.push({id:supUid('SUP',supplierState.suppliers),...o});
    await supCommit(id?'ویرایش تأمین‌کننده':'افزودن تأمین‌کننده');
  });
}
function editSupplierItem(id){
  const current=id?supplierState.items.find(x=>x.id===id):null;
  const initial=current||{code:supNextCode('ITM',supplierState.items),status:'فعال',conversionFactor:1};
  openForm(id?'ویرایش قلم':'افزودن قلم',[
    {name:'code',label:'کد قلم'},{name:'name',label:'نام قلم'},{name:'mainGroup',label:'گروه اصلی',type:'select',options:supListOptions('itemGroups')},{name:'subGroup',label:'زیرگروه'},
    {name:'specification',label:'مشخصات / برند / سایز',full:true},{name:'purchaseUnit',label:'واحد خرید',type:'select',options:supListOptions('units')},{name:'consumptionUnit',label:'واحد مصرف',type:'select',options:supListOptions('units')},{name:'conversionFactor',label:'ضریب تبدیل',type:'number'},
    {name:'reorderPoint',label:'نقطه سفارش',type:'number'},{name:'targetStock',label:'موجودی هدف',type:'number'},{name:'usageLocation',label:'محل مصرف',type:'select',options:supListOptions('usageLocations')},{name:'orderOwner',label:'مسئول/بخش سفارش‌گذار',type:'select',options:supListOptions('orderOwners')},{name:'status',label:'وضعیت',type:'select',options:supListOptions('statuses')},
    {name:'preferredSupplierCode',label:'تأمین‌کننده ترجیحی',type:'select',options:supSelectObjects(supplierState.suppliers,s=>`${s.code} | ${supDisplayName(s)}`)},{name:'alternateSupplierCode',label:'تأمین‌کننده جایگزین',type:'select',options:supSelectObjects(supplierState.suppliers,s=>`${s.code} | ${supDisplayName(s)}`)},{name:'notes',label:'توضیحات',type:'textarea',full:true}
  ],initial,async o=>{
    if(!o.name)throw Error('نام قلم الزامی است');o.code=supText(o.code)||supNextCode('ITM',supplierState.items);
    const duplicate=supplierState.items.find(x=>x.code===o.code&&x.id!==id);if(duplicate)throw Error('کد قلم تکراری است');
    if(current){const old=current.code;Object.assign(current,o);if(old!==o.code)supplierState.supplierItems.forEach(r=>{if(r.itemCode===old)r.itemCode=o.code})}
    else supplierState.items.push({id:supUid('ITM',supplierState.items),...o});
    await supCommit(id?'ویرایش قلم':'افزودن قلم');
  });
}
function editSupplierRelation(id){
  const current=id?supplierState.supplierItems.find(x=>x.id===id):null;
  const initial=current||{supplierCode:supplierUI.relationSupplier||'',itemCode:supplierUI.relationItem||'',isPrimary:'خیر',status:'فعال'};
  openForm(id?'ویرایش ارتباط':'افزودن ارتباط',[
    {name:'supplierCode',label:'تأمین‌کننده',type:'select',options:supSelectObjects(supplierState.suppliers.filter(s=>supActivity(s)!=='service'),s=>`${s.code} | ${supDisplayName(s)}`)},
    {name:'itemCode',label:'قلم',type:'select',options:supSelectObjects(supplierState.items,i=>`${i.code} | ${i.name}`)},
    {name:'suppliedSpecification',label:'برند / مشخصات تأمین‌شده',full:true},{name:'lastPurchasePriceToman',label:'آخرین قیمت خرید (تومان)',type:'number'},{name:'lastPurchaseDate',label:'تاریخ آخرین خرید'},
    {name:'minimumOrder',label:'حداقل سفارش'},{name:'deliveryTime',label:'زمان تحویل'},{name:'specialTerms',label:'شرایط ویژه',type:'textarea',full:true},{name:'isPrimary',label:'تأمین‌کننده اصلی؟',type:'select',options:supListOptions('yesNo')},{name:'status',label:'وضعیت',type:'select',options:supListOptions('statuses')},{name:'notes',label:'توضیحات',type:'textarea',full:true}
  ],initial,async o=>{
    if(!o.supplierCode||!o.itemCode)throw Error('تأمین‌کننده و قلم الزامی است');
    const duplicate=supplierState.supplierItems.find(x=>x.supplierCode===o.supplierCode&&x.itemCode===o.itemCode&&x.id!==id);if(duplicate)throw Error('این ارتباط قبلاً ثبت شده است');
    if(current)Object.assign(current,o);else supplierState.supplierItems.push({id:supUid('REL',supplierState.supplierItems),...o});
    if(o.isPrimary==='بله'){const item=supItemByCode(o.itemCode);if(item)item.preferredSupplierCode=o.supplierCode}
    await supCommit(id?'ویرایش ارتباط تأمین‌کننده و قلم':'افزودن ارتباط تأمین‌کننده و قلم');
  });
}
async function deleteSupplierAdmin(id){const s=supplierState.suppliers.find(x=>x.id===id);if(!s||!confirm(`طرف تجاری «${supDisplayName(s)}» غیرفعال و آرشیو شود؟ سوابق و ارتباط‌ها حفظ می‌شوند.`))return;Object.assign(s,{status:'غیرفعال',isArchived:true,archivedAt:new Date().toISOString(),archivedReason:'آرشیو با اقدام مدیر'});await supCommit('آرشیو طرف تجاری')}
async function deleteSupplierItem(id){const i=supplierState.items.find(x=>x.id===id);if(!i||!confirm(`قلم «${i.name}» و ارتباط‌هایش حذف شود؟`))return;supplierState.items=supplierState.items.filter(x=>x.id!==id);supplierState.supplierItems=supplierState.supplierItems.filter(x=>x.itemCode!==i.code);await supCommit('حذف قلم')}
async function deleteSupplierRelation(id){if(!confirm('این ارتباط حذف شود؟'))return;supplierState.supplierItems=supplierState.supplierItems.filter(x=>x.id!==id);await supCommit('حذف ارتباط تأمین‌کننده و قلم')}

function supExportJson(){
  supplierState.meta.updatedAt=new Date().toISOString();
  const blob=new Blob([JSON.stringify(supplierState,null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='suppliers-data.json';a.click();URL.revokeObjectURL(a.href);
}
async function supSaveJsonToDisk(){
  try{
    supplierState.meta.updatedAt=new Date().toISOString();
    if('showSaveFilePicker' in window){
      if(!supplierFileHandle)supplierFileHandle=await window.showSaveFilePicker({suggestedName:'suppliers-data.json',types:[{description:'JSON',accept:{'application/json':['.json']}}]});
      const w=await supplierFileHandle.createWritable();await w.write(JSON.stringify(supplierState,null,2));await w.close();await SupplierStorageAdapter.save(supplierState);toast('فایل suppliers-data.json ذخیره شد');
    }else{supExportJson();toast('مرورگر نوشتن مستقیم فایل را پشتیبانی نمی‌کند؛ JSON دانلود شد')}
  }catch(e){if(e?.name!=='AbortError')toast('ذخیره فایل تأمین‌کنندگان انجام نشد',true)}
}
function supImportJson(e){
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=async()=>{try{supplierState=supMigrate(JSON.parse(r.result));supplierLoaded=true;await SupplierStorageAdapter.save(supplierState);renderView();toast('JSON تأمین‌کنندگان وارد شد')}catch(err){toast('فایل JSON تأمین‌کنندگان معتبر نیست',true)}};
  r.readAsText(f);e.target.value='';
}
function installSupplierAdminModule(){
  if(typeof views==='undefined'||typeof titles==='undefined'||document.querySelector('[data-view="suppliers"]'))return;
  titles.suppliers='تأمین‌کنندگان';views.suppliers=viewsSuppliers;
  const sidebar=document.querySelector('.sidebar'),groups=[...sidebar.querySelectorAll('.nav-group')],ref=groups.find(x=>x.textContent.includes('گزارش و تنظیمات'));
  const group=document.createElement('div');group.className='nav-group';group.textContent='خرید و تأمین';
  const btn=document.createElement('button');btn.className='nav-btn';btn.dataset.view='suppliers';btn.innerHTML='🚚 <span>تأمین‌کنندگان</span>';btn.onclick=()=>goView('suppliers');
  sidebar.insertBefore(group,ref||null);sidebar.insertBefore(btn,ref||null);
  window.getSupplierState=()=>supplierState;window.supplierUI=supplierUI;window.supEnsureLoaded=supEnsureLoaded;window.supRefreshData=supRefreshData;window.supSaveData=supSaveData;window.supSaveJsonToDisk=supSaveJsonToDisk;window.supExportJson=supExportJson;window.supImportJson=supImportJson;
  window.editSupplierAdmin=editSupplierAdmin;window.editSupplierItem=editSupplierItem;window.editSupplierRelation=editSupplierRelation;
  window.deleteSupplierAdmin=deleteSupplierAdmin;window.deleteSupplierItem=deleteSupplierItem;window.deleteSupplierRelation=deleteSupplierRelation;
}
(function waitSupplierModule(){if(typeof views!=='undefined'&&typeof titles!=='undefined'&&document.querySelector('.sidebar'))installSupplierAdminModule();else setTimeout(waitSupplierModule,60)})();
})();
