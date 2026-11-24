// Probe: BL-080 inventory lists. Visits every inventory tab and reports, per table: horizontal overflow (scroll width vs the
// frame), the headers that got a scale «(میلیارد ریال)» and a sample of their cells (no «میلیارد» left in cells).
// Writes nothing; screenshots of the count tab and the stock tab.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={pages:{}};const $$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);
 const tabs=[...new Set($$('a[href^="#/inventory/"]').map(a=>a.getAttribute('href')))];const list=tabs.length?tabs:['#/inventory/stock','#/inventory/count','#/inventory/beverage','#/inventory/consumption','#/inventory/reports'];
 for(const h of ['#/inventory/stock','#/inventory/count','#/inventory/receipt','#/inventory/waste','#/inventory/beverage','#/inventory/consumption','#/inventory/reports','#/inventory/reorder',...list]){if(out.pages[h])continue;location.hash=h;await wait(2600);
  out.pages[h]=$$('#pnView table.table').map(t=>{const w=t.closest('.table-wrap')||t.parentElement;const sc=[...t.tHead?.rows[0]?.cells||[]].map((c,i)=>[c.innerText.replace(/\s+/g,' ').trim(),i]).filter(([x])=>/(میلیارد|میلیون|هزار) /.test(x));
   return{over:Math.max(0,t.scrollWidth-w.clientWidth),cols:t.tHead?.rows[0]?.cells.length||0,compact:t.classList.contains('inv-compact'),scaled:sc.map(([x,i])=>x+' → '+[...t.tBodies[0].rows].slice(0,2).map(r=>r.cells[i]?.innerText.replace(/\s+/g,' ')).join(' | ')),leftover:[...t.tBodies[0]?.rows||[]].slice(0,30).some(r=>[...r.cells].some(c=>/\d\s*(میلیارد|میلیون)/.test(P.en(c.innerText))))}});
  if(h==='#/inventory/count'||h==='#/inventory/stock')await shot('inv-'+h.split('/')[2])}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
