(()=>{'use strict';
if((location.pathname.split('/').pop()||'').toLowerCase()!=='settings.html')return;
const S=x=>String(x??'').trim();
const E=x=>S(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const SECTIONS=[
  ['general','عمومی و نمایش پنل'],
  ['personnel','پرسنل، سکشن‌ها و فهرست‌ها'],
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

// `views` is a top-level binding of 00-base.js, not a window property.
function viewFn(name){return typeof views!=='undefined'&&typeof views[name]==='function'?views[name]:null}

// Cards of «تنظیمات پنل و امکانات» (views.settings) picked by their <h2> title, with their
// original markup and save handlers. saveSettings()/saveLists() read every [id^=set_]/[id^=list_]
// in the document, so each id group must appear in exactly one hub section.
// The payment-locations block inside the lists card is shown in the purchase section instead.
function panelCards(titles){
  const settings=viewFn('settings');
  if(!settings)return '<div class="card empty">فرم تنظیمات پنل در دسترس نیست.</div>';
  // views.settings embeds the payment-locations block, whose first call loads the inventory
  // module and re-renders; wait for that once so typed values are not wiped by a late re-render.
  if(!ensureOnce('panelPayment',currentSection(),()=>window.p2ReloadPaymentLocations?.()))return loadingCard('تنظیمات پنل');
  const tpl=document.createElement('template');tpl.innerHTML=settings();
  const cards=[...tpl.content.querySelectorAll('.card')].filter(c=>!c.parentElement?.closest?.('.card'));
  tpl.content.querySelectorAll('#payment-locations').forEach(x=>x.remove());
  return titles.map(t=>cards.find(c=>S(c.querySelector('h2')?.textContent)===t)?.outerHTML||'').join('');
}

// ---- عمومی و نمایش پنل ----
function generalSection(){
  const features=window.RayoPhase1?.featureSettingsCard?.()||'<div class="card empty">تنظیمات نمایش امکانات پنل در دسترس نیست.</div>';
  return panelCards(['نام رستوران / برند'])+features+(window.RayoV104?.staffVisibilityCard?.()||'');
}

// ---- پرسنل، سکشن‌ها و فهرست‌ها ----
function personnelSection(){
  return panelCards(['فهرست‌های قابل انتخاب','نقشه سکشن‌ها']);
}

// ---- حقوق و دستمزد ----
function payrollSection(){
  const salarySettings=viewFn('salarySettings');
  const salary=salarySettings?salarySettings():'<div class="card empty">فرم تنظیمات پایه مدل حقوق در دسترس نیست.</div>';
  return panelCards(['پارامترهای محاسباتی'])+salary+panelCards(['تنظیمات مرخصی','تقویم تعطیلات رسمی'])+payrollPaymentAccounts();
}
// The «حساب / محل پرداخت» list of the salary-payment form reads two sources; both are managed
// here with their existing editors (also shown in the purchase and finance sections).
function payrollPaymentAccounts(){
  const head='<div class="card"><div class="section-head"><div><h2>حساب‌ها و محل‌های پرداخت حقوق</h2><p class="muted">فهرست «حساب / محل پرداخت» در فرم ثبت پرداخت حقوق از دو منبع زیر ساخته می‌شود: «کارت‌ها و حساب‌های کارت‌به‌کارت» و «محل‌های پرداخت». موارد غیرفعال در فرم نمایش داده نمی‌شوند و سوابق قبلی حفظ می‌شوند.</p></div></div></div>';
  const locations=window.paymentOptionsSettingsSection?`<div class="card">${window.paymentOptionsSettingsSection()}</div>`:'<div class="card empty">تنظیمات محل‌های پرداخت در دسترس نیست.</div>';
  let accounts;
  if(!ensureOnce('cashreport','payroll',()=>window.crSelectTab?.('destinations')))accounts=loadingCard('کارت‌ها و حساب‌ها');
  else{
    const st=RAYO_API_GATEWAY.getModuleStatus('cashreport');
    accounts=st.state==='error'?errorCard('کارت‌ها و حساب‌ها',st.lastError,'cashreport',()=>{resetEnsure('cashreport');renderView()}):(window.crDestinations?.()||'<div class="card empty">مدیریت کارت‌ها و حساب‌ها در دسترس نیست.</div>');
  }
  return head+accounts+locations;
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
  const payment=window.paymentOptionsSettingsSection?`<div class="card">${window.paymentOptionsSettingsSection()}</div>`:'<div class="card empty">تنظیمات محل‌های وجه در دسترس نیست.</div>';
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

const SECTION_RENDER={general:generalSection,personnel:personnelSection,payroll:payrollSection,pricing:pricingSection,inventory:inventorySection,purchase:purchaseSection,finance:financeSection,assets:assetsSection};

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
