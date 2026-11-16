// Probe: juices after the base-unit label fix — mocktail recipe in سی‌سی, item form (base لیتر, old name kept, rename tool
// hidden when no factor-1 name is left), no «count unit changed» flag on counts saved under the old label. Read only.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 const pr=InvControl.state.raw.pricing,j=pr.ingredients.find(i=>i.code==='4099'),sug=pr.ingredients.find(i=>i.code==='2015');
 const m=pr.menuItems.find(x=>x.status!=='غیرفعال'&&pr.recipes.some(r=>r.menuItemId===x.id&&r.ingredientId===j.id));out.menu=m?.name;
 location.hash='#/menu/items';await wait(2500);MenuEntry.recipe(m.id);await wait(1200);
 out.lines=$$('.mr-row').map(r=>[r.querySelector('[data-f=item]').value.split(' — ')[0],r.querySelector('[data-f=qty]').value,r.querySelector('[data-f=unit]').value]);await shot('juice-recipe');await close();
 // counts saved as «عدد» are the same unit now
 const flagged=[];for(const id of [j.id,sug.id]){const r=InvControl.state.M?.rows?.get?.(id)||InvControl.state.M?.items?.find?.(x=>x.id===id);if(r&&r.flags&&r.flags.has&&r.flags.has('countUnit'))flagged.push(id)}out.countUnitFlags=flagged;
 out.same=[InvEngine.sameUnit(j,'عدد'),InvEngine.sameUnit(sug,'عدد')];
 location.hash='#/inventory/catalog';await wait(2500);CatalogReal.ingredientForm(j.id);await wait(900);
 out.form={base:$('#pnModal .fsec input[disabled]')&&[...$$('#pnModal input[disabled]')].map(x=>x.value).join('/'),old:$$('#pnModal .hint').map(h=>h.innerText).find(t=>/نام قبلی/.test(t)),rename:!!$('#ingRename'),use:$('#pnModal [name=useU]')?.value,cnt:$('#pnModal [name=cntU]')?.value,buy:$('#pnModal [name=pu]')?.value,prev:$('#ingPrev')?.innerText};
 await shot('juice-item');await close();
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
