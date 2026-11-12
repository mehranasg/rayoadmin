// Probe: catalog bulk selection (select rows, select all of the filter, bulk deactivate, bulk delete plan) and the menu-items
// list opening the recipe modal. Saves on the dev server only (in-memory copy).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};const waitClose=async()=>{for(let i=0;i<60&&$('.modal-backdrop.open');i++)await wait(300);await wait(800)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/catalog';await wait(3500);out.bar=$('#catBulk')?.innerText.trim();
 const boxes=$$('#catTable [data-sel]').slice(0,3);for(const b of boxes){$(`#catTable [data-sel="${b.dataset.sel}"]`).click();await wait(150)}out.afterPick=$('#catBulk')?.innerText.replace(/\s+/g,' ');out.selRows=$$('#catTable tr.sel').length;out.modalOpened=!!$('.modal-backdrop.open');await shot('bulk-pick');
 const ids=boxes.map(b=>b.dataset.sel);$('[data-bk=off]').click();await wait(800);out.offModal=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,200);$$('#pnModal .modal-foot button').find(b=>/ذخیره/.test(b.innerText)).click();await waitClose();
 out.after=ids.map(id=>InvControl.state.raw.pricing.ingredients.find(i=>i.id===id)?.status);out.cleared=$$('#catTable tr.sel').length;
 $('[data-bk=all]').click();await wait(800);out.allBar=$('#catBulk')?.innerText.replace(/\s+/g,' ');$('[data-bk=del]').click();await wait(2500);out.delModal=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,220);await shot('bulk-del');$$('#pnModal button').find(b=>/انصراف/.test(b.innerText))?.click();await wait(400);$('[data-bk=none]')?.click();
 location.hash='#/menu/items';await wait(3500);const r=$('#pnTab table tbody tr.click');r?.click();await wait(1500);out.recipeModal=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,120);out.stillOnItems=location.hash;await shot('menu-recipe-modal');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
