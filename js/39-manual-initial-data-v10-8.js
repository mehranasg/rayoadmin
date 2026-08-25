(()=>{
'use strict';
const S=x=>String(x??'').trim();
const A=x=>Array.isArray(x)?x:[];
const MODULES={
  hr:'پرسنل و حقوق',suppliers:'تأمین‌کنندگان',pricing:'قیمت‌گذاری و رسپی',inventory:'انبار و کنترل مصرف',cashreport:'گزارش صندوق و تحلیل فروش',assets:'اموال و دارایی',finance:'مالی',survey:'نظرسنجی',errorlog:'لاگ خطا',sepidsaudit:'Audit سپیدز'
};
let selected='',preview=null;
function file(){return (location.pathname.split('/').pop()||'').toLowerCase()}
function missingLike(e){const m=S(e?.message||e).toLowerCase();return m.includes('http 404')||m.includes('not found')||m.includes('پیدا نشد')||m.includes('وجود ندارد')||m.includes('پاسخ خالی')}
function onSettings(){
  if(file()!=='personnel.html')return false;
  if(new URLSearchParams(location.search).get('view')==='settings')return true;
  if(document.querySelector('.nav-btn.active[data-view="settings"]'))return true;
  const root=document.getElementById('view'),title=S(document.getElementById('topTitle')?.textContent);
  return !!(root?.querySelector('#set_baseHourlyRate')||title==='تنظیمات و فهرست‌ها');
}
function esc(v){return S(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function countSummary(data){
  if(!data||typeof data!=='object')return [];
  return Object.entries(data).filter(([,v])=>Array.isArray(v)&&v.length).map(([k,v])=>({key:k,count:v.length}));
}
function summaryHtml(data){
  const rows=countSummary(data);
  if(!rows.length)return '<span class="muted">رکورد آرایه‌ای ندارد</span>';
  return rows.map(x=>`<span class="badge" style="margin:2px 0 2px 6px">${esc(x.key)}: ${x.count.toLocaleString('fa-IR')}</span>`).join('');
}
function setMsg(msg,error=false){const el=document.getElementById('rayoInitMsg');if(!el)return;el.className=error?'hint danger':'hint';el.textContent=msg||''}
function downloadJson(name,data){const b=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
async function inspect(){
  selected=S(document.getElementById('rayoInitModule')?.value);preview=null;
  const box=document.getElementById('rayoInitPreview'),btn=document.getElementById('rayoInitializeBtn'),reset=document.getElementById('rayoResetSeedBtn');
  if(!selected){if(box)box.innerHTML='';if(btn)btn.disabled=true;if(reset)reset.disabled=true;return}
  if(box)box.innerHTML='<div class="muted">در حال بررسی داده زنده و فایل اولیه…</div>';
  if(btn)btn.disabled=true;if(reset)reset.disabled=true;
  try{
    const gw=window.RAYO_API_GATEWAY;if(!gw)throw Error('RAYO_API_GATEWAY آماده نیست');
    let live={},status={state:'missing',initialized:false};
    try{live=await gw.loadModule(selected);status=gw.getModuleStatus(selected)}catch(e){if(!missingLike(e))throw e}
    const seedCfg=gw.seedConfig(selected);
    let seed=null,seedError='';
    try{seed=await gw.loadSeedFile(selected,seedCfg?.url)}catch(e){seedError=S(e?.message||e)}
    preview={module:selected,live,status,seed,seedError};
    const initialized=status?.initialized===true;
    if(box)box.innerHTML=`
      <div class="grid grid-2" style="gap:10px">
        <div class="card"><b>وضعیت داده زنده</b><div style="margin-top:8px"><span class="badge ${initialized?'ok':'warn'}">${initialized?'مقداردهی‌شده':'مقداردهی‌نشده'}</span></div><div style="margin-top:8px">${summaryHtml(live)}</div></div>
        <div class="card"><b>فایل اطلاعات اولیه</b><div style="margin-top:8px">${seedError?`<span class="danger">${esc(seedError)}</span>`:summaryHtml(seed)}</div></div>
      </div>
      <div class="hint" style="margin-top:10px">${initialized?'این ماژول قبلاً مقداردهی شده است؛ «بارگذاری اطلاعات اولیه» برای جلوگیری از Overwrite غیرفعال است. اگر عمداً می‌خواهید داده فعلی را با Seed جایگزین کنید فقط از عملیات خطرناک «بازنشانی از اطلاعات اولیه» استفاده کنید.':'این ماژول از دید API مقداردهی اولیه نشده است. پس از تأیید، Seed همین بخش یک‌بار روی سرور ذخیره و سپس با GET مجدد تأیید می‌شود.'}</div>`;
    if(btn)btn.disabled=initialized||!seed||!!seedError;
    if(reset)reset.disabled=!initialized||!seed||!!seedError;
    setMsg('');
  }catch(e){if(box)box.innerHTML='';setMsg(S(e?.message||e),true)}
}
async function initialize(){
  if(!preview||preview.module!==selected)return inspect();
  const gw=window.RAYO_API_GATEWAY,module=preview.module,label=MODULES[module]||module;
  try{
    let status={state:'missing',initialized:false};
    try{await gw.loadModule(module);status=gw.getModuleStatus(module)}catch(e){if(!missingLike(e))throw e}
    if(status?.initialized===true)throw Error(`«${label}» قبلاً مقداردهی شده است؛ بارگذاری اولیه متوقف شد.`);
    const token=prompt(`برای بارگذاری اولیه «${label}» عبارت INITIALIZE را وارد کنید:`);
    if(token!=='INITIALIZE')return;
    const seed=await gw.loadSeedFile(module,gw.seedConfig(module)?.url);
    seed.meta=seed.meta||{};seed.meta.initialized=true;seed.meta.initializedAt=new Date().toISOString();seed.meta.initializationSource='manual-seed';
    setMsg(`در حال بارگذاری اولیه «${label}» روی سرور…`);
    await gw.saveModule(module,seed,{verify:true,allowSeedWrite:true,allowUnconfirmedWrite:true,allowInitialize:true});
    setMsg(`«${label}» با موفقیت مقداردهی اولیه و نسخه سرور تأیید شد.`);
    if(typeof toast==='function')toast(`اطلاعات اولیه «${label}» روی سرور ثبت شد`);
    await inspect();
  }catch(e){setMsg(S(e?.message||e),true);if(typeof toast==='function')toast(S(e?.message||e),true)}
}
async function resetFromSeed(){
  if(!preview||preview.module!==selected)return inspect();
  const gw=window.RAYO_API_GATEWAY,module=preview.module,label=MODULES[module]||module;
  try{
    const live=await gw.loadModule(module),status=gw.getModuleStatus(module);
    if(status?.initialized!==true)throw Error('این ماژول هنوز مقداردهی نشده است؛ از «بارگذاری اطلاعات اولیه» استفاده کنید.');
    if(!confirm(`هشدار جدی: تمام داده فعلی «${label}» با Seed جایگزین می‌شود. قبل از ادامه یک فایل Backup از همین ماژول دانلود خواهد شد. ادامه می‌دهید؟`))return;
    downloadJson(`Rayo_${module}_Before_Reset_${new Date().toISOString().replace(/[:.]/g,'-')}.json`,live);
    const token=prompt('برای تأیید نهایی عبارت RESET FROM SEED را دقیقاً وارد کنید:');
    if(token!=='RESET FROM SEED')return;
    const seed=await gw.loadSeedFile(module,gw.seedConfig(module)?.url);
    seed.meta=seed.meta||{};seed.meta.initialized=true;seed.meta.resetAt=new Date().toISOString();seed.meta.resetSource='manual-seed-reset';
    setMsg(`در حال بازنشانی «${label}»…`);
    await gw.saveModule(module,seed,{verify:true,allowSeedWrite:true,allowUnconfirmedWrite:true,allowInitialize:true});
    setMsg(`«${label}» از روی Seed بازنشانی و نسخه سرور تأیید شد.`);
    if(typeof toast==='function')toast(`«${label}» از روی اطلاعات اولیه بازنشانی شد`);
    await inspect();
  }catch(e){setMsg(S(e?.message||e),true);if(typeof toast==='function')toast(S(e?.message||e),true)}
}
function card(){return `<div class="card rayo-initial-data-card" id="rayo-initial-data">
  <div class="section-head"><div><h2>وضعیت و فایل اطلاعات اولیه</h2><p class="muted">Seed در اجرای عادی برنامه هیچ‌وقت خوانده یا روی سرور نوشته نمی‌شود. ابتدا ماژول را انتخاب و وضعیت داده زنده و فایل اولیه را بررسی کنید.</p></div></div>
  <div class="form-grid" style="margin-top:12px"><div class="field full"><label>بخش موردنظر</label><select id="rayoInitModule" onchange="RayoInitialData.inspect()"><option value="">انتخاب کنید</option>${Object.entries(MODULES).map(([k,l])=>`<option value="${k}">${esc(l)}</option>`).join('')}</select></div></div>
  <div id="rayoInitPreview" style="margin-top:12px"></div>
  <div id="rayoInitMsg" class="hint" style="margin-top:10px"></div>
  <div class="toolbar" style="margin-top:12px"><button class="btn" type="button" onclick="RayoInitialData.inspect()">بررسی وضعیت</button></div>
  <div class="grid grid-2" style="gap:12px;margin-top:14px">
    <div class="card" style="margin:0"><h2>بارگذاری اطلاعات اولیه</h2><p class="muted">فقط برای اولین راه‌اندازی ماژولی که روی سرور مقداردهی نشده است.</p><button id="rayoInitializeBtn" class="btn btn-primary" type="button" disabled onclick="RayoInitialData.initialize()">بارگذاری اطلاعات اولیه روی سرور</button><div class="hint" style="margin-top:10px">نیازمند واردکردن عبارت <b>INITIALIZE</b> و تأیید مجدد داده ذخیره‌شده از API است.</div></div>
    <div class="card danger-zone" style="margin:0"><h2>بازنشانی اطلاعات</h2><p class="muted">عملیات خطرناک برای جایگزینی کامل داده فعلی با Seed همان ماژول.</p><button id="rayoResetSeedBtn" class="btn btn-danger" type="button" disabled onclick="RayoInitialData.resetFromSeed()">بازنشانی از اطلاعات اولیه</button><div class="hint" style="margin-top:10px">قبل از جایگزینی، Backup همان ماژول دانلود می‌شود و عبارت <b>RESET FROM SEED</b> الزامی است.</div></div>
  </div>
  <div class="hint" style="margin-top:12px"><b>قاعده ایمنی:</b> خطای API، قطعی اینترنت یا پاسخ HTTP 500 هیچ‌وقت مجوز خواندن Seed یا نوشتن داده اولیه روی سرور ایجاد نمی‌کند.</div>
</div>`}
function backupCard(){return `<div class="card rayo-live-backup-card" id="rayo-live-backup"><div class="section-head"><div><h2>تهیه بکاپ کامل داده‌های زنده</h2><p class="muted">هر ۱۰ ماژول مستقیماً از RayoData API خوانده و در یک ZIP قرار می‌گیرند. Seed وارد بکاپ نمی‌شود.</p></div><button id="rayoBackupAllBtn" class="btn btn-primary" type="button" onclick="RayoBackup.downloadAll()">تهیه بک آپ کامل</button></div><div class="hint">اگر حتی یک ماژول دریافت نشود، بکاپ ناقص ساخته و دانلود نمی‌شود.</div></div>`}
function dataManagementView(){
  const head=typeof pageHead==='function'?pageHead('مدیریت اطلاعات و بکاپ','بارگذاری اولیه، بازنشانی کنترل‌شده و تهیه نسخه پشتیبان از داده زنده'):'<div class="page-title"><div><h1>مدیریت اطلاعات و بکاپ</h1><p>بارگذاری اولیه، بازنشانی کنترل‌شده و تهیه نسخه پشتیبان از داده زنده</p></div></div>';
  return head+backupCard()+card();
}
function ensure(){
  if(!onSettings())return;
  const root=document.getElementById('view');if(!root)return;
  root.querySelectorAll('.v102-reset-card,.v104-reset-card').forEach(x=>x.remove());
  if(root.querySelector('.rayo-initial-data-card'))return;
  const backup=root.querySelector('.rayo-live-backup-card');if(backup)backup.insertAdjacentHTML('afterend',card());else root.insertAdjacentHTML('beforeend',card());
}
function registerView(){
  try{
    if(typeof views==='undefined'||typeof titles==='undefined')return false;
    titles.dataManagement='مدیریت اطلاعات و بکاپ';
    views.dataManagement=dataManagementView;
    return true;
  }catch(_){return false}
}
function install(){document.documentElement.dataset.rayoBuild='10.9.3';if(!registerView())setTimeout(registerView,120);ensure();if(typeof window.renderView==='function'&&!window.renderView.__initData1081){const old=window.renderView;window.renderView=function(){const r=old.apply(this,arguments);setTimeout(ensure,0);return r};window.renderView.__initData1081=true}setTimeout(()=>{registerView();ensure()},300);setTimeout(()=>{registerView();ensure()},1000)}
window.RayoInitialData={inspect,initialize,resetFromSeed,renderCard:card,renderView:dataManagementView};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
