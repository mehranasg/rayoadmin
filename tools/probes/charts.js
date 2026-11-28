// Probe: are charts drawn? Counts echarts instances on the dashboard and on reports.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={echarts:!!window.echarts,ver:window.echarts?.version};
const cnt=()=>[...document.querySelectorAll('[_echarts_instance_]')].map(e=>e.id+':'+(e.querySelector('svg path')?'drawn':'empty')+':'+e.offsetWidth+'x'+e.offsetHeight);
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 for(const h of ['#/home','#/finance/ledger','#/finance/cash','#/finance/cashbox','#/inventory/beverage','#/inventory/consumption','#/inventory/reports','#/reports/overview','#/reports/owner','#/reports/products','#/reports/salesvol','#/reports/staffcost','#/menu/items']){location.hash=h;await wait(3000);out[h]=cnt();out[h+' boxes']=[...document.querySelectorAll('.chart,[id$="Chart"],[id*="chart"]')].length}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
