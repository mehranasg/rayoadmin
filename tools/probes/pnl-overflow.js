// Probe (review only): horizontal overflow of every table in the P&L tabs (finance and reports). Writes nothing.
window.__errs=[];(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={w:innerWidth};const $$=s=>[...document.querySelectorAll(s)];
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);window.ExtrasReal?.load?.('finance');window.PeopleReal?.load?.();
 const tabs=[...new Set($$('a[href^="#/finance/"]').map(a=>a.getAttribute('href')))].filter(h=>/pnl|profit|سود/.test(h));
 for(const h of [...tabs,'#/finance/pnl','#/reports/pnlp']){if(out[h])continue;location.hash=h;await wait(5000);
  out[h]=$$('#pnView table.table').map(t=>{const w=t.closest('.table-wrap')||t.parentElement,c=t.closest('.card');return{card:c?.querySelector('h2,h3')?.innerText?.slice(0,40),cols:t.tHead?.rows[0]?.cells.length,over:Math.max(0,t.scrollWidth-w.clientWidth)}}).filter(x=>x.over>0)}
 out.errs=__errs}catch(e){out.err=String(e.stack||e)}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
