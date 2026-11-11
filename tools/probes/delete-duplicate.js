// Probe: «حذف قلم» for a duplicate that only appears in the opening count (the second of two items with the same name).
// Saves on the dev server only (in-memory copy, never the real API).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/catalog';await wait(3500);const pr=InvControl.state.raw.pricing,name='تنباکو مسکو',two=pr.ingredients.filter(i=>i.name.trim()===name);out.found=two.map(i=>i.code);const dup=two[1];if(!dup)throw Error('no duplicate in this copy');
 CatalogReal.deleteItem(dup.id);await wait(1500);out.modal=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,330);out.ok=$$('#pnModal .modal-foot button').map(b=>b.innerText.trim());await shot('delete-duplicate');
 $('#pnModal [name=why]').value='قلم تکراری؛ قلم اصلی '+two[0].code;$$('#pnModal .modal-foot button').find(b=>/حذف/.test(b.innerText)).click();for(let i=0;i<60&&$('.modal-backdrop.open');i++)await wait(300);await wait(1200);
 const p2=InvControl.state.raw.pricing,i2=InvControl.state.raw.inventory;out.after={inCatalog:p2.ingredients.some(i=>i.id===dup.id),otherKept:p2.ingredients.some(i=>i.id===two[0].id),openingLines:i2.stocktakes.flatMap(s=>s.lines||[]).filter(l=>l.ingredientId===dup.id).length,revision:i2.stocktakes.some(s=>(s.revisionHistory||[]).some(r=>r.kind==='item-deleted'&&r.removed.some(l=>l.ingredientId===dup.id)))};
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
