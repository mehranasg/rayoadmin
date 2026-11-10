// Probe: unified list grid (paging, columns, sort, totals) on the stock list and the beverage report. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);
 location.hash='#/inventory/stock';await wait(3000);const tb=$('#pnTab table.table');out.stock={grid:tb?.dataset.grid,shown:[...tb.tBodies[0].rows].filter(r=>r.style.display!=='none').length,total:tb.tBodies[0].rows.length,bar:$('#pnTab .grid-tools')?.innerText.replace(/\s+/g,' '),foot:tb.tFoot?.innerText.replace(/\s+/g,' ').slice(0,200)};
 const th=[...tb.tHead.rows[0].cells].find(h=>h.classList.contains('sortable')&&h.classList.contains('num'));if(th){th.click();await wait(300);out.sortFirst=tb.tBodies[0].rows[0].innerText.replace(/\s+/g,' ').slice(0,80)}
 $('[data-gc]').click();await wait(200);const cb=$('.grid-cols input');cb.click();await wait(200);out.hiddenCol=tb.tHead.rows[0].cells[0].style.display;cb.click();
 $('.grid-size').value='0';$('.grid-size').dispatchEvent(new Event('change',{bubbles:true}));await wait(300);out.allShown=[...tb.tBodies[0].rows].filter(r=>r.style.display!=='none').length;await shot('grid-stock');
 location.hash='#/inventory/reports';await wait(3000);const bv=$$('#pnTab a, #pnTab button, #pnTab [data-v]').find(x=>/نوشیدنی/.test(x.innerText));if(bv){bv.click();await wait(3000)}
 const f=$('#bvF');if(f){$('#bvT').value='1405/08/18';$('#bvT').dispatchEvent(new Event('change',{bubbles:true}));await wait(1500);f.value='1405/08/01';f.dispatchEvent(new Event('change',{bubbles:true}));await wait(2500)}
 const cards=$$('#pnTab .card').filter(c=>/ثبت‌های روزانهٔ نوشیدنی|تطبیق با انبارگردانی/.test(c.innerText));out.bev=cards.map(c=>({h:c.querySelector('h2')?.innerText,rows:c.querySelector('tbody')?.rows.length,foot:c.querySelector('tfoot')?.innerText.replace(/\s+/g,' ').slice(0,160)}));out.chart=!!$('#chBevLine canvas, #chBevLine svg');await shot('grid-bev');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
