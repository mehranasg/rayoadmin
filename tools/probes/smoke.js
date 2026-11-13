// Smoke probe: opens the main pages on the local data copy and reports JS errors and what each page shows.
// Run with the dev server: `npm run smoke` (see package.json). Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={pages:{}};const $$=s=>[...document.querySelectorAll(s)];
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);out.live=InvControl.ready();window.PeopleReal?.load?.();
 for(const h of ['#/home','#/finance/cash','#/finance/ledger','#/finance/cashbox','#/finance/meals','#/finance/accounts','#/finance/parties','#/inventory/stock','#/inventory/count','#/inventory/beverage','#/inventory/consumption','#/inventory/catalog','#/inventory/reports','#/people/staff','#/people/payroll','#/menu/items','#/reports/owner','#/reports/pnlp','#/reports/salesvol','#/reports/products','#/reports/staffcost','#/reports/overview','#/settings/general','#/settings/data']){location.hash=h;await wait(2200);out.pages[h]={cards:$$('#pnView .card').length,tables:$$('#pnView table').length}}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
