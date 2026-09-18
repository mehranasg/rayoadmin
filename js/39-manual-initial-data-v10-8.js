(()=>{
'use strict';
const S=x=>String(x??'').trim();
const MODULES={hr:'پرسنل و حقوق',suppliers:'تأمین‌کنندگان',pricing:'کالا، منو و رسپی',inventory:'انبار و کنترل مصرف',cashreport:'صندوق و فروش',assets:'اموال',finance:'مالی',survey:'نظرسنجی',errorlog:'لاگ خطا',sepidsaudit:'ممیزی سپیدز'};
const clone=x=>JSON.parse(JSON.stringify(x));
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
let preview=null,seedPreview=null,rollback=null,busy=false;
const $=id=>document.getElementById(id);
const esc=v=>S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function message(text,error=false){const el=$('rayoDataMsg');if(el){el.className=error?'hint danger-text':'hint';el.textContent=text}}
function controls(){document.querySelectorAll('[data-data-action]').forEach(el=>el.disabled=busy);if($('rayoResetBtn'))$('rayoResetBtn').disabled=busy||preview?.kind!=='reset';if($('rayoRestoreBtn'))$('rayoRestoreBtn').disabled=busy||preview?.kind!=='restore';if($('rayoRollbackBtn'))$('rayoRollbackBtn').disabled=busy||!rollback;if($('rayoInitializeBtn'))$('rayoInitializeBtn').disabled=busy||!seedPreview}
function downloadJson(name,data){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function envelope(modules){return{backupType:'Rayo table reset backup',formatVersion:1,createdAt:new Date().toISOString(),modules:clone(modules)}}
function downloadBackup(modules){downloadJson(`Rayo_Before_Table_Reset_${new Date().toISOString().replace(/[:.]/g,'-')}.json`,envelope(modules))}
// Configuration and lookup definitions retain their IDs. Inventory locations are
// definitions referenced by settings, so clearing them would break those references.
function emptyTables(module,live){
  if(!object(live))throw Error('ساختار داده معتبر نیست');
  const result=clone(live),preserve=new Set(['meta','settings','lists','salaryModel','floorMap']);
  for(const [key,value] of Object.entries(result)){
    if(preserve.has(key)||(module==='inventory'&&key==='locations'))continue;
    if(Array.isArray(value))result[key]=[];
    else if(object(value))result[key]={};
  }
  if(module==='hr'&&object(result.salaryModel?.draft))result.salaryModel.draft={};
  if(module==='cashreport'&&object(live.salesAnalytics))result.salesAnalytics=Object.fromEntries(Object.entries(live.salesAnalytics).map(([k,v])=>[k,Array.isArray(v)?[]:object(v)?{}:typeof v==='number'?0:typeof v==='string'?'':typeof v==='boolean'?false:null]));
  if(module==='sepidsaudit'&&result.settings){if('highRiskMenuItemIds' in result.settings)result.settings.highRiskMenuItemIds=[];if('menuAliases' in result.settings)result.settings.menuAliases={}}
  return result;
}
function counts(data,path=''){
  const rows=[];
  for(const [key,value] of Object.entries(data||{})){
    const name=path?`${path}.${key}`:key;
    if(Array.isArray(value))rows.push({name,count:value.length});
    else if(object(value))rows.push(...counts(value,name));
  }
  return rows;
}
function fingerprint(data){
  function stable(value,path=''){if(Array.isArray(value))return value.map(x=>stable(x,path));if(!object(value))return value;return Object.fromEntries(Object.keys(value).sort().filter(k=>!(path==='meta'&&['serverSaveToken','updatedAt'].includes(k))).map(k=>[k,stable(value[k],path?`${path}.${k}`:k)]))}
  return JSON.stringify(stable(data));
}
async function loadAll(){const out={};for(const module of Object.keys(MODULES)){const data=await window.RAYO_API_GATEWAY.loadModule(module);if(!object(data))throw Error(`داده «${MODULES[module]}» معتبر نیست`);out[module]=clone(data)}return out}
function showPreview(plan){
  const rows=[];
  for(const [module,before] of Object.entries(plan.before)){
    const after=plan.after[module],a=new Map(counts(after).map(x=>[x.name,x.count]));
    for(const row of counts(before)){rows.push(`<tr><td>${esc(MODULES[module])}</td><td dir="ltr">${esc(row.name)}</td><td>${row.count.toLocaleString('fa-IR')}</td><td>${(a.get(row.name)||0).toLocaleString('fa-IR')}</td></tr>`);a.delete(row.name)}
    for(const [name,count] of a)rows.push(`<tr><td>${esc(MODULES[module])}</td><td dir="ltr">${esc(name)}</td><td>۰</td><td>${count.toLocaleString('fa-IR')}</td></tr>`);
  }
  if($('rayoDataPreview'))$('rayoDataPreview').innerHTML=`<div class="hint">${plan.kind==='reset'?'پیش‌نمایش خالی‌کردن جداول':'پیش‌نمایش بازگردانی بکاپ'}؛ این مرحله فقط خواندنی است. ستون «پس از اجرا» فهرست‌های حفظ‌شده را نیز نشان می‌دهد.</div><div class="table-wrap"><table class="data-table" data-pagination="native"><thead><tr><th>بخش</th><th>جدول / فهرست</th><th>اکنون</th><th>پس از اجرا</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>`;
  controls();
}
async function inspect(){
  if(busy)return;busy=true;preview=null;controls();message('در حال خواندن همه بخش‌ها و تهیه پیش‌نمایش…');
  try{const before=await loadAll(),after={};for(const [module,data] of Object.entries(before))after[module]=emptyTables(module,data);preview={kind:'reset',before,after};showPreview(preview);message('پیش‌نمایش آماده است. هیچ داده‌ای تغییر نکرده است.')}
  catch(e){if($('rayoDataPreview'))$('rayoDataPreview').innerHTML='';message(e.message,true)}finally{busy=false;controls()}
}
function validateBackup(data){
  if(data?.backupType!=='Rayo table reset backup'||data.formatVersion!==1||!object(data.modules)||Object.keys(data.modules).length!==Object.keys(MODULES).length)throw Error('فایل باید بکاپ کامل JSON دانلودشده پیش از بازنشانی جداول باشد.');
  for(const module of Object.keys(MODULES)){
    const value=data.modules[module],shape=window.RAYO_API_GATEWAY.emptyModuleShape(module);
    if(!object(value)||!object(value.meta))throw Error(`بکاپ «${MODULES[module]}» ناقص است.`);
    for(const [key,expected] of Object.entries(shape))if(Array.isArray(expected)?!Array.isArray(value[key]):!object(value[key]))throw Error(`ساختار «${MODULES[module]} / ${key}» در بکاپ معتبر نیست.`);
  }
  return clone(data.modules);
}
async function restoreFile(event){
  const file=event.target.files?.[0];event.target.value='';if(!file||busy)return;
  busy=true;preview=null;controls();message('در حال بررسی بکاپ و داده فعلی…');
  try{const after=validateBackup(JSON.parse(await file.text())),before=await loadAll();preview={kind:'restore',before,after};showPreview(preview);message('بکاپ بررسی شد؛ برای اعمال، پیش‌نمایش را بازبینی و بازگردانی را تأیید کنید.')}
  catch(e){message(e.message,true)}finally{busy=false;controls()}
}
async function previewRollback(){
  if(!rollback||busy)return;busy=true;controls();
  try{preview={kind:'restore',before:await loadAll(),after:clone(rollback)};showPreview(preview);message('پیش‌نمایش بازگردانی آخرین عملیات آماده است.')}
  catch(e){message(e.message,true)}finally{busy=false;controls()}
}
async function saveChecked(module,data){
  const expected=fingerprint(data),gw=window.RAYO_API_GATEWAY;
  await gw.saveModule(module,clone(data),{verify:true});
  const checked=await gw.loadModule(module);
  if(fingerprint(checked)!==expected)throw Error(`محتوای ذخیره‌شده «${MODULES[module]}» با پیش‌نمایش مطابقت ندارد.`);
}
function syncHr(data){if(typeof state!=='undefined'&&data.hr){state=typeof migrate==='function'?migrate(clone(data.hr)):clone(data.hr)}}
async function apply(kind){
  if(busy||preview?.kind!==kind)return;
  const plan=preview,token=kind==='reset'?'RESET TABLES':'RESTORE DATA';
  if(!confirm(kind==='reset'?'همه رکوردهای جداول، از جمله پرسنل، کالا، منو، رسپی و سوابق، خالی شوند؟ تنظیمات و فهرست‌های انتخابی حفظ می‌شوند. این عملیات فقط برای راه‌اندازی مستقل رستوران جدید است.':'داده‌های فعلی با اطلاعات بکاپ نمایش‌داده‌شده جایگزین شوند؟'))return;
  busy=true;controls();let attempted=[];
  try{
    // A failed GET or changed source invalidates the entire preview before any write.
    const fresh=await loadAll();for(const module of Object.keys(MODULES))if(fingerprint(fresh[module])!==fingerprint(plan.before[module]))throw Error(`داده «${MODULES[module]}» پس از پیش‌نمایش تغییر کرده؛ دوباره پیش‌نمایش بگیرید.`);
    downloadBackup(fresh);
    if(prompt(`بکاپ دانلود شد. پس از اطمینان از نگهداری فایل، عبارت ${token} را وارد کنید:`)!==token)return;
    const confirmed=await loadAll();for(const module of Object.keys(MODULES))if(fingerprint(confirmed[module])!==fingerprint(fresh[module]))throw Error('داده هنگام تأیید تغییر کرد؛ پیش‌نمایش جدید لازم است.');
    const changed=Object.keys(MODULES).filter(m=>fingerprint(plan.after[m])!==fingerprint(fresh[m]));
    for(const module of changed)if(window.RAYO_API_GATEWAY.getModuleStatus(module)?.initialized!==true)throw Error(`«${MODULES[module]}» مقداردهی نشده است؛ عملیات متوقف شد.`);
    rollback=clone(fresh);preview=null;controls();
    for(const module of changed){message(`در حال ${kind==='reset'?'خالی‌کردن':'بازگردانی'} «${MODULES[module]}»…`);attempted.push(module);await saveChecked(module,plan.after[module])}
    syncHr(plan.after);message('عملیات و بازخوانی همه بخش‌های تغییرکرده تأیید شد. برای ادامه کار صفحه را تازه کنید؛ فایل بکاپ از همین بخش قابل بازگردانی است.');
    if($('rayoDataPreview'))$('rayoDataPreview').innerHTML='';
  }catch(e){
    const failed=[];
    for(const module of attempted.reverse())try{await window.RAYO_API_GATEWAY.loadModule(module);await saveChecked(module,rollback[module])}catch(_){failed.push(MODULES[module])}
    if(attempted.length&&!failed.length)syncHr(rollback);
    preview=null;message(e.message+(attempted.length?(failed.length?` بازگردانی خودکار این بخش‌ها کامل نشد: ${failed.join('، ')}. فایل بکاپ را نگه دارید و از بازگردانی بکاپ استفاده کنید.`:' داده‌های بخش‌های ارسال‌شده به وضعیت قبل برگشتند.'):' هیچ داده‌ای ارسال نشد.'),true);
  }finally{busy=false;controls()}
}
async function loadForInitialize(module){
  const gw=window.RAYO_API_GATEWAY;
  try{const live=await gw.loadModule(module);if(gw.getModuleStatus(module)?.initialized===true||gw.moduleHasBusinessData(module,live))throw Error('این بخش قبلاً مقداردهی شده یا دارای رکورد است؛ بارگذاری اولیه مسدود است.');return false}
  catch(e){if(e.status===404)return true;throw e}
}
async function inspectSeed(){
  if(busy)return;seedPreview=null;controls();const module=S($('rayoInitModule')?.value);if(!MODULES[module])return;
  busy=true;controls();message('در حال بررسی بارگذاری اولیه…');
  try{
    const gw=window.RAYO_API_GATEWAY;await loadForInitialize(module);
    const seed=await gw.loadSeedFile(module,gw.seedConfig(module)?.url);
    seedPreview={module,seed};if($('rayoSeedPreview'))$('rayoSeedPreview').textContent=counts(seed).map(x=>`${x.name}: ${x.count}`).join(' — ');
    message('پیش‌نمایش اطلاعات اولیه آماده است؛ این اطلاعات نمونهٔ رایو هستند. برای رستوران جدید از آن‌ها استفاده نکنید.');
  }catch(e){message(e.message,true)}finally{busy=false;controls()}
}
async function initialize(){
  if(busy||!seedPreview)return;const p=seedPreview;if($('rayoInitModule')?.value!==p.module)return;
  if(prompt(`برای بارگذاری اطلاعات اولیه «${MODULES[p.module]}» عبارت INITIALIZE را وارد کنید:`)!=='INITIALIZE')return;
  busy=true;controls();
  try{const gw=window.RAYO_API_GATEWAY,missing=await loadForInitialize(p.module);const seed=clone(p.seed);seed.meta=seed.meta||{};seed.meta.initialized=true;await gw.saveModule(p.module,seed,{verify:true,allowSeedWrite:true,allowInitialize:true,allowUnconfirmedWrite:missing});seedPreview=null;message('بارگذاری اولیه و بازخوانی سرور تأیید شد.')}
  catch(e){message(e.message,true)}finally{busy=false;controls()}
}
function card(){return `<div class="card rayo-initial-data-card" id="rayo-initial-data">
  <h2>بازنشانی جداول برای رستوران جدید</h2>
  <p>همه رکوردهای پرسنل، کالاها، منو، رسپی‌ها، تأمین‌کنندگان و سوابق عملیاتی در هر ۱۰ بخش خالی می‌شوند. هیچ اطلاعات نمونه‌ای جایگزین آن‌ها نمی‌شود.</p>
  <div class="hint">ساختار داده، تنظیمات، نام رستوران، فهرست‌های انتخابی، مدل حقوق، نقشه و تعریف محل‌های انبار حفظ می‌شوند. نام، حساب‌ها و تنظیمات حفظ‌شده را برای رستوران جدید بازبینی کنید. حساب‌های پرسنلی همراه رکورد پرسنل حذف می‌شوند.</div>
  <p class="danger-text">فقط در نسخهٔ مستقل رستوران جدید اجرا کنید. پیش از اجرا، کار سایر کاربران و صفحه‌های باز را متوقف کنید؛ این عملیات همه بخش‌ها را تغییر می‌دهد.</p>
  <div class="toolbar"><button data-data-action class="btn" onclick="RayoInitialData.inspect()">پیش‌نمایش بازنشانی جداول</button><button id="rayoResetBtn" class="btn btn-danger" disabled onclick="RayoInitialData.resetTables()">خالی‌کردن جداول</button></div>
  <div id="rayoDataPreview"></div><div id="rayoDataMsg" class="hint" role="status" aria-live="polite"></div>
  <h3>بازگردانی بکاپ بازنشانی</h3><p class="muted">فایل JSON که پیش از بازنشانی دانلود شده است را انتخاب کنید. بازگردانی نیز پیش‌نمایش، بکاپ از وضعیت فعلی و تأیید جداگانه دارد.</p>
  <div class="toolbar"><label class="field">فایل بکاپ بازنشانی<input data-data-action type="file" accept=".json,application/json" onchange="RayoInitialData.restoreFile(event)"></label><button id="rayoRollbackBtn" class="btn" disabled onclick="RayoInitialData.previewRollback()">پیش‌نمایش بازگشت آخرین عملیات</button><button id="rayoRestoreBtn" class="btn btn-danger" disabled onclick="RayoInitialData.restore()">بازگردانی بکاپ</button></div>
  <details><summary>بارگذاری اطلاعات اولیهٔ رایو — فقط برای ماژول مقداردهی‌نشده</summary><p>این گزینه داده نمونه وارد می‌کند و از بازنشانی جداول مستقل است.</p><div class="field"><label for="rayoInitModule">بخش موردنظر</label><select data-data-action id="rayoInitModule" onchange="RayoInitialData.inspectSeed()"><option value="">انتخاب کنید</option>${Object.entries(MODULES).map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></div><div id="rayoSeedPreview" dir="ltr"></div><button id="rayoInitializeBtn" class="btn" disabled onclick="RayoInitialData.initialize()">بارگذاری اطلاعات اولیه</button></details>
</div>`}
function backupCard(){return `<div class="card rayo-live-backup-card" id="rayo-live-backup"><div class="section-head"><div><h2>بکاپ کامل داده‌های زنده</h2><p class="muted">همه بخش‌ها از سرور خوانده و در یک فایل ZIP دانلود می‌شوند.</p></div><button id="rayoBackupAllBtn" data-data-action class="btn btn-primary" onclick="RayoBackup.downloadAll()">تهیه بک آپ کامل</button></div></div>`}
function dataManagementView(){const head=typeof pageHead==='function'?pageHead('مدیریت اطلاعات و بکاپ','نسخه پشتیبان، پیش‌نمایش بازنشانی جداول و بازگردانی داده‌ها'):'';setTimeout(()=>{if(preview)showPreview(preview);controls()},0);return head+backupCard()+card()}
function registerView(){if(typeof views==='undefined'||typeof titles==='undefined')return;titles.dataManagement='مدیریت اطلاعات و بکاپ';views.dataManagement=dataManagementView}
window.RayoInitialData={inspect,inspectSeed,initialize,resetTables:()=>apply('reset'),restore:()=>apply('restore'),restoreFile,previewRollback,emptyTables,renderCard:card,renderView:dataManagementView};
registerView();
})();
