// Probe: width and vertical scroll of the edit modals (people, contract, menu item, recipe). Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(400)};
const meas=()=>{const m=$('#pnModal .modal'),b=$('#pnModal .modal-body');return m?{w:Math.round(m.getBoundingClientRect().width),body:b?.scrollHeight,view:b?.clientHeight,cols:(getComputedStyle($('#pnModal .form-grid')||document.body).gridTemplateColumns||'').split(' ').length}:null};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/people/staff';await wait(5000);for(let i=0;i<20&&!window.PeopleReal?.doc?.();i++)await wait(500);const p=(PeopleReal.doc()?.personnel||[]).find(x=>x.status!=='غیرفعال');
 if(p){PeopleHR.personForm(p.id);await wait(1200);out.person=meas();await shot('modal-person');await close();PeopleHR.salaryForm(p.id);await wait(1200);out.salary=meas();await shot('modal-salary');await close()}
 location.hash='#/menu/items';await wait(3500);const mi=(InvControl.state.raw.pricing.menuItems||[]).find(m=>m.status!=='غیرفعال');
 if(mi){CatalogReal.menuForm(mi.id);await wait(1200);out.menuItem=meas();await shot('modal-menu');await close();MenuEntry.recipe(mi.id);await wait(1500);out.recipe=meas();await shot('modal-recipe');await close()}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
