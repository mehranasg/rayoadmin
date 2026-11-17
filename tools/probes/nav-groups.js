// Probe (read-only): tab groups and second row (N-10), glossary names (N-11), sidebar order (N-12), hidden sample pages (N-17, N-18),
// no noisy badges (N-13), the new finance summary (N-15) and the inventory dashboard month (N-16). Screenshots in .local-data/shots.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const bar=()=>({top:$$('.page-tabs .tab').map(t=>t.innerText.trim().replace(/\s+/g,' ')),active:$('.page-tabs .tab.active')?.innerText.trim(),sub:$$('.page-subtabs .subtab').map(t=>t.innerText.trim()),h1:$('.page-head h1')?.innerText.trim()});
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(2500);
 out.sidebar=$$('#pnSide .nav-label,#pnSide .nav-link').map(a=>(a.classList.contains('nav-label')?'## ':'')+a.innerText.trim().replace(/\s+/g,' '));
 for(const h of ['#/finance','#/finance/petty','#/finance/docs','#/inventory','#/inventory/beverage','#/people','#/people/payments','#/reports','#/menu']){location.hash=h;await wait(2200);out[h]=bar()}
 location.hash='#/finance/overview';await wait(2500);out.finOverview=$('#pnView').innerText.replace(/\s+/g,' ').slice(0,700);await shot('nav-finance');
 location.hash='#/finance/cashbox';await wait(2500);await shot('nav-finance-sub');
 location.hash='#/inventory/control';await wait(3500);out.invMonth=$('#ivaMonth')?.selectedOptions?.[0]?.textContent;
 location.hash='#/customers';await wait(1500);out.customersRedirect=location.hash+' '+$('.page-head h1')?.innerText;
 location.hash='#/reports/overview';await wait(1500);out.oldReportStillOpens=$('.page-head h1')?.innerText;
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
