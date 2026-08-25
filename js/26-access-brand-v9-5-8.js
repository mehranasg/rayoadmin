(()=>{
'use strict';
/* v9.5.9 hotfix: no global MutationObserver. Brand updates are explicit and bounded. */
const S=x=>String(x??'').trim();
const ORIGINAL_TITLE=document.title;
let publicBrand='';
function stateBrand(){try{return (typeof state!=='undefined'&&state&&S(state?.settings?.restaurantName))||''}catch(_){return ''}}
function brandName(){return stateBrand()||publicBrand||'رایو'}
function applyBrand(){
  const b=brandName();
  document.querySelectorAll('.brand strong').forEach(el=>{if(el.textContent!==b)el.textContent=b});
  document.querySelectorAll('.brand small').forEach(el=>{const v=`مدیریت یکپارچه ${b} — پنل مدیریت`;if(/مدیریت یکپارچه/.test(el.textContent||'')&&el.textContent!==v)el.textContent=v});
  const adminLogin=document.querySelector('#loginScreen .login-card h1');
  if(adminLogin){const v=`پنل مدیریت کافه رستوران ${b}`;if(adminLogin.textContent!==v)adminLogin.textContent=v}
  const staffLogin=document.querySelector('body.staff-public-body .login-card h1');
  if(staffLogin){const v=`پنل پرسنل ${b}`;if(staffLogin.textContent!==v)staffLogin.textContent=v}
  document.querySelectorAll('#loginScreen .login-card small').forEach(el=>{if(/ورود استاتیک|احراز هویت سمت سرور/.test(el.textContent||''))el.remove()});
  if(ORIGINAL_TITLE)document.title=ORIGINAL_TITLE.replace(/رایو/g,b);
}
async function loadPublicBrand(){
  try{
    if(stateBrand()){publicBrand=stateBrand();applyBrand();return}
    if(window.RAYO_API_GATEWAY?.loadOrBootstrap){
      const d=await window.RAYO_API_GATEWAY.loadOrBootstrap('hr');
      publicBrand=S(d?.settings?.restaurantName)||'رایو';
    }
  }catch(_){/* keep default brand */}
  applyBrand();
}
async function saveRestaurantName(){
  if(typeof state==='undefined'||!state)return;
  const v=S(document.getElementById('rayo_restaurant_name_v958')?.value);
  if(!v)return typeof toast==='function'&&toast('نام رستوران را وارد کنید',true);
  state.settings=state.settings||{}; state.settings.restaurantName=v;
  state.meta=state.meta||{}; state.meta.restaurant=`کافه‌رستوران ${v}`;
  if(typeof commit==='function')await commit('ویرایش نام رستوران');
  publicBrand=v;
  applyBrand();
  if(typeof toast==='function')toast('نام رستوران ذخیره شد');
  setTimeout(()=>location.reload(),250);
}
function installSettings(){
  if(typeof views==='undefined'||!views.settings||views.settings.__brand958)return;
  const old=views.settings;
  const w=function(){
    const html=old(); const b=brandName();
    const card=`<div class="card"><div class="section-head"><div><h2>نام رستوران / برند</h2><p class="muted">این نام در عنوان پنل مدیریت، منوی کناری و پنل پرسنل استفاده می‌شود.</p></div><button class="btn btn-primary" onclick="saveRestaurantNameV958()">ذخیره نام</button></div><div class="form-grid"><div class="field"><label>نام رستوران / برند</label><input id="rayo_restaurant_name_v958" value="${typeof esc==='function'?esc(b):b}"></div></div></div>`;
    return html+card;
  };
  w.__brand958=true; views.settings=w;
}
function installPersonnelAccessButton(){/* v10.1: access management is a separate page; do not inject access controls into personnel list. */}
function install(){
  if(typeof views!=='undefined'){installSettings();installPersonnelAccessButton();}
  applyBrand();
  /* Deliberately no MutationObserver here. v9.5.8 observed the entire DOM and could
     repeatedly rescan the dashboard during initial rendering, causing severe CPU/memory use. */
  setTimeout(()=>{installSettings();installPersonnelAccessButton();applyBrand();},350);
}
window.RayoBrand={name:brandName,apply:applyBrand,load:loadPublicBrand};
window.saveRestaurantNameV958=saveRestaurantName;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{install();loadPublicBrand()},{once:true});else{install();loadPublicBrand()}
})();
