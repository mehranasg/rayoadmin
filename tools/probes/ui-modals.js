// Probe (read-only): modal sizes and scrolling on desktop (owner's UI report 1405/08/27) — settings base modals, prepared item,
// new supplier, the admin users table; whether the page behind an open modal is locked; the warning when panel.css is missing.
//   node tools/smoke.cjs tools/probes/ui-modals.js 300
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const m=()=>{const md=$('#pnModal .modal'),b=$('#pnModal .modal-body');if(!md||!$('#pnModal').classList.contains('open'))return null;const r=md.getBoundingClientRect();return{title:md.querySelector('h2')?.innerText,w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top),bottom:Math.round(r.bottom),vh:innerHeight,bodyOverflow:getComputedStyle(b).overflowY,bodyScrollH:b.scrollHeight,bodyClientH:b.clientHeight,hScroll:[...md.querySelectorAll('.table-wrap,.modal-body')].some(x=>x.scrollWidth>x.clientWidth+2),pageLocked:getComputedStyle(document.body).overflow==='hidden'||getComputedStyle(document.documentElement).overflow==='hidden',cls:md.className}};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(2000);window.FinanceReal?.loadSuppliers?.();PeopleReal.load();await wait(2500);
 location.hash='#/settings/index';await wait(2500);const cards=$$('#pnView .card button, #pnView .card [role=button], #pnView .card a.st-tile, #pnView .card .bs-item').filter(b=>b.closest('.card')?.innerText.includes('تنظیمات پایه'));out.baseButtons=cards.length;
 for(const [k,b] of cards.slice(0,4).entries()){b.click();await wait(1200);out['base'+k]=m();if(k===0)await shot('ui-base0');P.close();await wait(300)}
 CatalogReal.preparedForm();await wait(1200);out.prepared=m();await shot('ui-prepared');P.close();
 CatalogReal.supplierForm();await wait(1200);out.supplier=m();await shot('ui-supplier');P.close();
 location.hash='#/people/users';await wait(2500);const uc=$$('#pnView .card').find(c=>c.innerText.includes('کاربران پنل مدیریت'));out.users=uc?{hScroll:[...uc.querySelectorAll('.table-wrap')].some(x=>x.scrollWidth>x.clientWidth+2),w:uc.clientWidth}:null;await shot('ui-users');
 out.cssOk=!document.getElementById('pnCssWarn');for(const l of document.querySelectorAll('link[href*="panel.css"]'))l.disabled=true;await wait(300);P.cssCheck();out.cssWarnShown=!!document.getElementById('pnCssWarn');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
