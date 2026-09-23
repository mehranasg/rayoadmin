(()=>{'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='settings.html')return;
const S=x=>String(x??'').trim();
const E=x=>S(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const SECTIONS=[
  ['general','عمومی و نمایش پنل'],
  ['payroll','حقوق و دستمزد'],
  ['pricing','قیمت‌گذاری'],
  ['inventory','انبارداری'],
  ['purchase','خرید، تأمین و نگهداری'],
  ['finance','بدهی‌ها، مطالبات و چک‌ها'],
  ['assets','اموال و دارایی‌ها']
];
const SECTION_KEYS=SECTIONS.map(x=>x[0]);
const swUI={section:'',dirty:{},loading:{},ensured:{}};
const RETRY={};

function currentSection(){
  const q=new URLSearchParams(location.search).get('section');
  if(SECTION_KEYS.includes(q))return q;
  return SECTION_KEYS.includes(swUI.section)?swUI.section:'general';
}
function goSection(next){
  if(!SECTION_KEYS.includes(next)||next===currentSection())return;
  if(swUI.dirty[currentSection()]&&!confirm('تغییرات این بخش هنوز ذخیره نشده‌اند. بدون ذخیره به بخش دیگری بروید؟'))return;
  swUI.section=next;
  const u=new URL(location.href);u.searchParams.set('view','softwareSettings');u.searchParams.set('section',next);history.replaceState({},'',u);
  renderView();
}
function markDirty(){swUI.dirty[currentSection()]=true}
function bindDirtyTracking(){
  const host=document.getElementById('swSectionBody');
  if(!host)return;
  host.addEventListener('input',markDirty);
  host.addEventListener('change',markDirty);
}

// A section trusts its own data getter only after it personally awaited its own
// ensure call — Gateway module status alone cannot prove THIS getter is populated,
// since another section can legitimately load the same backend module first
// (e.g. purchase's payment-locations loader also touches the inventory module).
function ensureOnce(tag,sectionKey,fn){
  if(swUI.ensured[tag])return true;
  if(!swUI.loading[tag]){
    swUI.loading[tag]=true;
    Promise.resolve().then(fn).catch(()=>{}).finally(()=>{swUI.loading[tag]=false;swUI.ensured[tag]=true;if(currentSection()===sectionKey)renderView()});
  }
  return false;
}
function resetEnsure(tag){swUI.ensured[tag]=false}
function loadingCard(label){return `<div class="card empty" role="status">در حال بارگذاری ${E(label)}…</div>`}
function errorCard(label,err,key,fn){RETRY[key]=fn;return `<div class="card empty"><h3>بارگذاری ${E(label)} انجام نشد</h3><p>${E(err||'خطای نامشخص')}</p><button class="btn btn-primary" onclick="SoftwareSettingsHub.retry('${key}')">تلاش دوباره</button></div>`}
function retry(key){RETRY[key]?.()}

function nav(){
  const s=currentSection();
  return `<div class="card sw-settings-nav"><div class="field" style="margin:0"><label for="swSectionSelect">بخش تنظیمات</label><select id="swSectionSelect" onchange="SoftwareSettingsHub.goSection(this.value)">${SECTIONS.map(([k,l])=>`<option value="${k}" ${k===s?'selected':''}>${E(l)}</option>`).join('')}</select></div></div>`;
}

// ---- عمومی و نمایش پنل ----
function generalSection(){
  return window.RayoPhase1?.featureSettingsCard?.()||'<div class="card empty">این بخش در دسترس نیست.</div>';
}

// ---- حقوق و دستمزد ----
function payrollSection(){
  const salary=window.views?.salarySettings?window.views.salarySettings():'<div class="card empty">فرم تنظیمات پایه مدل حقوق در دسترس نیست.</div>';
  const note=`<div class="card"><div class="section-head"><h2>پارامترهای محاسباتی حقوق و فهرست‌های عمومی</h2></div><p class="muted">نرخ ساعتی پایه، ضریب اضافه‌کار/تعطیل، کسر تأخیر، فهرست سمت‌ها و سکشن‌ها و تقویم تعطیلات هنوز در یک فرم واحد و به‌هم‌پیوسته با «تنظیمات پنل و امکانات» قرار دارند و بدون جدا کردن اعتبارسنجی آن فرم قابل انتقال امن به اینجا نبودند.</p><a class="btn" href="settings.html?view=settings">باز کردن پارامترهای محاسباتی حقوق</a></div>`;
  return salary+note;
}

// ---- قیمت‌گذاری ----
function pricingSection(){
  if(!ensureOnce('pricing','pricing',()=>window.pcEnsureLoaded?.(true)))return loadingCard('اطلاعات قیمت‌گذاری');
  const st=RAYO_API_GATEWAY.getModuleStatus('pricing');
  if(st.state==='error')return errorCard('قیمت‌گذاری',st.lastError,'pricing',()=>{resetEnsure('pricing');renderView()});
  return window.RayoMenuV1011?.pricingSettings?.()||'<div class="card empty">این بخش در دسترس نیست.</div>';
}

// ---- انبارداری ----
function inventorySection(){
  const note='<div class="hint">این تنظیمات از تب «تنظیمات انبار» در صفحه انبارداری نیز در دسترس است. نقطه سفارش و افت آماده‌سازی هر ماده، فیلدهای همان قلم در کاتالوگ هستند و در <a href="base-data.html">اطلاعات پایه و مدیریت اقلام</a> ویرایش می‌شوند.</div>';
  if(!ensureOnce('inventory','inventory',()=>window.ivEnsureLoaded?.(false,true)))return loadingCard('اطلاعات انبار');
  const st=RAYO_API_GATEWAY.getModuleStatus('inventory');
  if(st.state==='error')return errorCard('انبارداری',st.lastError,'inventory',()=>{resetEnsure('inventory');renderView()});
  return (window.RayoInventoryV1012?.forecastSettingsPanel?.()||'<div class="card empty">این بخش در دسترس نیست.</div>')+note;
}

// ---- خرید، تأمین و نگهداری ----
function purchaseSection(){
  const payment=window.paymentOptionsSettingsSection?.()||'<div class="card empty">این بخش در دسترس نیست.</div>';
  let refLists;
  if(!ensureOnce('suppliers','purchase',()=>window.supEnsureLoaded?.(false,true)))refLists=loadingCard('فهرست‌های تأمین‌کنندگان');
  else{
    const st=RAYO_API_GATEWAY.getModuleStatus('suppliers');
    refLists=st.state==='error'?errorCard('فهرست‌های مرجع تأمین‌کنندگان',st.lastError,'suppliers',()=>{resetEnsure('suppliers');renderView()}):(window.supplierJsonSettings?.()||'');
  }
  const maintNote='<div class="hint">آستانه هشدار سرویس و نگهداری تجهیزات در بخش «اموال و دارایی‌ها» تنظیم می‌شود.</div>';
  return payment+refLists+maintNote;
}

// ---- بدهی‌ها، مطالبات و چک‌ها ----
function financeSection(){
  let body;
  if(!ensureOnce('finance','finance',()=>window.finEnsureLoaded?.()))body=loadingCard('اطلاعات مالی');
  else{
    const st=RAYO_API_GATEWAY.getModuleStatus('finance');
    body=st.state==='error'?errorCard('مالی',st.lastError,'finance',()=>{resetEnsure('finance');renderView()}):(window.finSettingsCard?.()||'')+(window.finCalculatorCard?.()||'');
  }
  let dest;
  if(!ensureOnce('cashreport','finance',()=>window.crSelectTab?.('destinations')))dest=loadingCard('حساب‌ها و اشخاص صندوق');
  else{
    const cst=RAYO_API_GATEWAY.getModuleStatus('cashreport');
    dest=cst.state==='error'?errorCard('حساب‌ها و اشخاص صندوق',cst.lastError,'cashreport',()=>{resetEnsure('cashreport');renderView()}):(window.crDestinations?.()||'');
  }
  const openingNote='<div class="card"><div class="section-head"><h2>افتتاحیه و گردش حساب</h2></div><p class="muted">این بخش با پیش‌نمایش، بکاپ اجباری و تأیید جداگانه همراه است و به‌عنوان ابزار راه‌اندازی اولیه در همان محل باقی می‌ماند، نه یک تنظیم قابل ویرایش مکرر.</p><a class="btn" href="finance.html?view=opening">باز کردن افتتاحیه و گردش حساب</a></div>';
  return body+dest+openingNote;
}

// ---- اموال و دارایی‌ها ----
function assetsSection(){
  if(!ensureOnce('assets','assets',()=>window.amEnsureLoaded?.(true)))return loadingCard('اطلاعات اموال و دارایی‌ها');
  const st=RAYO_API_GATEWAY.getModuleStatus('assets');
  if(st.state==='error')return errorCard('اموال و دارایی‌ها',st.lastError,'assets',()=>{resetEnsure('assets');renderView()});
  return window.amSettingsView?.()||'<div class="card empty">این بخش در دسترس نیست.</div>';
}

const SECTION_RENDER={general:generalSection,payroll:payrollSection,pricing:pricingSection,inventory:inventorySection,purchase:purchaseSection,finance:financeSection,assets:assetsSection};

function renderSoftwareSettings(){
  const s=currentSection();
  swUI.section=s;swUI.dirty[s]=false;
  const head=typeof pageHead==='function'?pageHead('تنظیمات نرم‌افزار','تنظیمات پراکنده پنل در یک محل؛ هر بخش با منبع، مجوز و دکمه ذخیره مستقل خودش کار می‌کند.'):'<h1>تنظیمات نرم‌افزار</h1>';
  const body=(SECTION_RENDER[s]||generalSection)();
  setTimeout(()=>{bindDirtyTracking();window.RayoJalali?.mark?.()},0);
  return head+nav()+`<div id="swSectionBody">${body}</div>`;
}

window.SoftwareSettingsHub={goSection,retry};

function register(){
  if(typeof views==='undefined'||typeof titles==='undefined')return setTimeout(register,80);
  titles.softwareSettings='تنظیمات نرم‌افزار';
  views.softwareSettings=renderSoftwareSettings;
  if(currentView==='softwareSettings'&&typeof renderView==='function')renderView();
}
register();
})();
