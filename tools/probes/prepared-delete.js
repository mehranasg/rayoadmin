// Probe: prepared items list — delete button on each row; delete form says delete / archive / refuse; a new item with no
// reference is deleted and one with history is archived (dev server, in-memory copy, never the real API).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const save=async()=>{$$('#pnModal .modal-foot button').find(b=>/روی سرور/.test(b.innerText)).click();for(let i=0;i<40;i++){await wait(300);if($('#pnModal.open')&&/اقلام آماده‌سازی/.test($('#pnModal').innerText))break}await wait(500)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/catalog';await wait(3500);const raw=()=>InvControl.state.raw;
 CatalogReal.preparedList();await wait(1200);out.rows=raw().pricing.preparedItems?.length||0;out.delBtns=$$('#pnModal [data-ppx]').length;
 out.plans=(raw().pricing.preparedItems||[]).map(p=>MenuWrite.preparedDeletePlan(raw().pricing,raw().inventory,p.id).action);
 // new item with no reference → delete
 const ing=raw().pricing.ingredients.find(i=>i.status!=='غیرفعال'&&i.itemType!=='NON_STOCK'&&i.recipeUnit);
 CatalogReal.preparedForm('');await wait(1000);$('#pnModal [name=name]').value='آزمون حذف';const r0=$('#pnModal .pp-c');r0.children[0].value=ing.name+(ing.code?' — '+ing.code:'');r0.children[0].dispatchEvent(new Event('change',{bubbles:true}));r0.children[1].value='1';await save();
 const nu=raw().pricing.preparedItems.find(p=>p.name==='آزمون حذف');out.created=!!nu;CatalogReal.preparedList();await wait(800);
 $(`#pnModal [data-ppx="${nu.id}"]`).click();await wait(800);out.formText=$('#pnModal').innerText.slice(0,200);await save();
 out.deleted=!raw().pricing.preparedItems.some(p=>p.id===nu.id);out.retired=raw().pricing.settings?.retiredPreparedIds?.includes(nu.id);out.audit=(raw().pricing.changeLog||[]).filter(x=>/PREPARED_ITEM/.test(x.action)).map(x=>[x.action,!!(x.deleted||x.details?.deleted||JSON.stringify(x).includes(nu.id))]);out.listBack=/اقلام آماده‌سازی/.test($('#pnModal').innerText);
 // an item with history (if any) → archive
 const h=(raw().pricing.preparedItems||[]).find(p=>!p.isArchived&&MenuWrite.preparedDeletePlan(raw().pricing,raw().inventory,p.id).action==='archive');
 if(h){$(`#pnModal [data-ppx="${h.id}"]`).click();await wait(800);out.archText=$('#pnModal').innerText.slice(0,160);await save();const a=raw().pricing.preparedItems.find(p=>p.id===h.id);out.archived=!!(a&&a.isArchived);out.hiddenInList=!$(`#pnModal [data-pp="${h.id}"]`);out.archToggle=!!$('#ppArch')}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
