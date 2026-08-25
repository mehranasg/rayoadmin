(function(){
'use strict';
const A=x=>Array.isArray(x)?x:[];
const S=x=>String(x??'').trim();
const N=x=>{const n=Number(S(x).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[٬,،\s]/g,'').replace(/[^0-9.\-]/g,''));return Number.isFinite(n)?n:0};
const F=x=>N(x).toLocaleString('fa-IR',{maximumFractionDigits:0});
const file=()=>((location.pathname.split('/').pop()||'index.html').toLowerCase());
function ensureInventorySidebar(){
  // Sidebar source is already a single direct inventory link. This removes any stale inventory submenu if an older page fragment rebuilds it.
  document.querySelectorAll('.side-section').forEach(sec=>{const title=S(sec.querySelector('.side-title b')?.textContent);if(title==='انبار و کنترل مصرف'){const a=document.createElement('a');a.className='side-main-link active';a.href='inventory.html';a.innerHTML='<span>📦</span><b>انبار و کنترل مصرف</b>';sec.replaceWith(a)}});
}
function dedupeImportButtons(){
  const root=document.getElementById('view')||document.getElementById('staffView')||document.body;
  const rules=[/ورود فاکتور خرید\s*(?:Excel|اکسل)/i,/ورود فاکتورهای خرید\s*(?:Excel|اکسل)/i,/ورود فروش روزانه\s*(?:Excel|اکسل)/i,/ورود رسپی\s*(?:Excel|اکسل)/i];
  for(const re of rules){const buttons=[...root.querySelectorAll('button,a.btn')].filter(b=>re.test(S(b.textContent)));buttons.slice(1).forEach(b=>b.remove())}
  const ids=['p2InvoiceExcel','p2SalesExcel','p2RecipeExcel'];
  ids.forEach(id=>[...document.querySelectorAll('#'+id)].slice(1).forEach(x=>x.remove()));
}
function ensureResetCard(){return}
function ensureStaffVisibilitySettings(){
  if(file()!=='personnel.html'||new URLSearchParams(location.search).get('view')!=='settings')return;
  const root=document.getElementById('view');if(!root||root.querySelector('.v106-staff-visibility-card'))return;
  let h=null;try{h=typeof state!=='undefined'?state:null}catch(_){}
  if(!h)return;h.settings=h.settings||{};
  root.insertAdjacentHTML('beforeend',`<div class="card v106-staff-visibility-card"><div class="section-head"><div><h2>نمایش اطلاعات در پنل پرسنل</h2><p class="muted">مشخص کنید پرسنل جزئیات جریمه‌های مالی خود را ببینند یا فقط پاداش و تخلف کاری نمایش داده شود.</p></div><button class="btn btn-primary" onclick="RayoV104.saveStaffVisibility()">ذخیره</button></div><label style="display:flex;gap:10px;align-items:center"><input id="v106ShowPenalties" type="checkbox" ${h.settings.showPenaltiesToStaff===false?'':'checked'}> نمایش جریمه‌های مالی و مبلغ جریمه در پنل پرسنل</label></div>`);
}
async function saveStaffVisibility(){
  let h=null;try{h=typeof state!=='undefined'?state:null}catch(_){}
  if(!h)return;h.settings=h.settings||{};h.settings.showPenaltiesToStaff=!!document.getElementById('v106ShowPenalties')?.checked;
  if(typeof commit==='function')await commit('ویرایش تنظیمات نمایش پنل پرسنل');
  else if(window.RAYO_API_GATEWAY?.saveModule)await window.RAYO_API_GATEWAY.saveModule('hr',h);
  if(typeof toast==='function')toast('تنظیمات نمایش پنل پرسنل ذخیره شد');
}

function ensureForecastKpi(){
  if(file()!=='personnel.html'||new URLSearchParams(location.search).get('view')!=='costForecast')return;
  const root=document.getElementById('view');if(!root||/حقوق پرداخت‌شده ماه جاری/.test(root.textContent))return;
  let h=null;try{h=typeof state!=='undefined'?state:null}catch(_){}
  if(!h)return;const pays=A(h.payments).filter(x=>x.status!=='لغوشده'&&!/مساعده/.test(`${x.type||''} ${x.notes||''}`)&&(/حقوق|دستمزد|فیش/i.test(`${x.type||''} ${x.notes||''}`)||x.source==='salary'));
  const month=(window.RayoJalali?.today?.()||'').slice(0,7),sum=r=>r.reduce((a,x)=>a+N(x.amount||x.paidAmount),0);
  const head=root.querySelector('.page-head');head?.insertAdjacentHTML('afterend',`<div class="grid grid-2"><div class="card kpi"><div class="label">حقوق پرداخت‌شده ماه جاری</div><div class="value">${F(sum(pays.filter(x=>S(x.date).slice(0,7)===month)))}</div><div class="sub">تومان</div></div><div class="card kpi"><div class="label">جمع حقوق پرداخت‌شده ثبت‌شده</div><div class="value">${F(sum(pays))}</div><div class="sub">تومان</div></div></div>`);
}
function enforceEndedStatus(){
  try{if(typeof state==='undefined'||!state?.lists)return;state.lists.employmentStatuses=A(state.lists.employmentStatuses);if(!state.lists.employmentStatuses.includes('اتمام همکاری'))state.lists.employmentStatuses.push('اتمام همکاری')}catch(_){}
}
function afterRender(){try{ensureInventorySidebar();dedupeImportButtons();ensureResetCard();ensureStaffVisibilitySettings();ensureForecastKpi();enforceEndedStatus()}catch(e){console.warn('v10.4 final UI guard',e)}}
function install(){document.documentElement.dataset.rayoBuild='10.7.0';afterRender();if(typeof window.renderView==='function'&&!window.renderView.__v104){const old=window.renderView;window.renderView=function(){const r=old.apply(this,arguments);setTimeout(afterRender,0);return r};window.renderView.__v104=true}setTimeout(afterRender,300);setTimeout(afterRender,1000)}
window.RayoV104=Object.assign(window.RayoV104||{},{saveStaffVisibility});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
