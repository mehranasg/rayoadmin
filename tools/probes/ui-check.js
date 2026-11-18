// Probe (read-only): desktop look of the pages in the owner's UI report (1405/08/27) — sidebar foot, list toolbar, recipe
// side list, day calendar, settings, plan tabs, quick-add menu, glued tab labels, users table, wide modals, sort cursor.
//   node tools/smoke.cjs tools/probes/ui-check.js 400
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const css=(el,...k)=>{if(!el)return null;const c=getComputedStyle(el);return Object.fromEntries(k.map(x=>[x,c[x]]))};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(2000);
 location.hash='#/menu/pricing';await wait(2500);out.gridTools=css($('.grid-tools'),'display','flexWrap');out.gridBar=css($('.grid-bar'),'display');out.sideFoot=css($('.sidebar .side-foot, .sidebar-foot, #pnSide > :last-child'),'display','flexDirection');
 out.sortCursor=css($('th.sortable'),'cursor');await shot('ui-pricing');
 location.hash='#/menu/recipes';await wait(2500);out.split=css($('.split'),'display','gridTemplateColumns');out.sideList=css($('.side-list'),'display','flexDirection');out.sideBtn=css($('.side-list button'),'display','width');await shot('ui-recipes');
 location.hash='#/home';await wait(3000);out.daycal=css($('.daycal'),'display','gridTemplateColumns');await shot('ui-home');
 location.hash='#/people/staff';await wait(2500);out.subtabs=$$('.page-tabs .tab, .page-tabs button, .page-tabs a').slice(0,8).map(x=>x.innerText);out.tabsCss=css($('.page-tabs'),'display','gap');await shot('ui-people');
 location.hash='#/settings/index';await wait(2500);await shot('ui-settings');
 location.hash='#/plan';await wait(2500);await shot('ui-plan');
 $$('button').find(b=>/ثبت جدید/.test(b.innerText))?.click();await wait(800);await shot('ui-quick');document.body.click();await wait(300);
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
