// Probe: catalog standard structure (preview, filter, change a row, apply) and «گروه‌ها و نوع‌ها». Saves on the dev server only.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};const waitClose=async()=>{for(let i=0;i<60&&$('.modal-backdrop.open');i++)await wait(300);await wait(800)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/catalog';await wait(3500);out.note=!!$$('#pnTab button').find(b=>/ساختار استاندارد/.test(b.innerText));
 CatalogReal.structureForm();await wait(2500);out.count=$('#csN')?.innerText;out.rows=$$('#csT tbody tr').length;await shot('cat-structure');
 const o=$('#csO');o.value='unsure';o.dispatchEvent(new Event('change'));await wait(500);out.unsure=$$('#csT tbody tr').map(r=>r.cells[0].innerText.split('\n')[0]);
 const s=$('#csT [data-g]');if(s){s.value='مواد بار و قهوه';s.dispatchEvent(new Event('change',{bubbles:true}))}
 window.confirm=()=>true;$$('#pnModal .modal-foot button').find(b=>/اعمال/.test(b.innerText)).click();await waitClose();
 const pr=InvControl.state.raw.pricing,t={};for(const i of pr.ingredients)t[i.itemType]=(t[i.itemType]||0)+1;out.after={version:pr.lists.catalogStructureVersion,groups:pr.lists.ingredientCategories.length,types:t,label:MenuWrite.typeLabels(pr).OPERATIONAL_CONSUMABLE,noteGone:!$$('#pnTab button').find(b=>/ساختار استاندارد/.test(b.innerText))};
 CatalogReal.groupsForm();await wait(1200);out.groupForm={rows:$$('#pnModal .grp-row').length,typeSel:$$('#pnModal [data-f=type]').filter(x=>x.value).length,labels:$$('#pnModal [data-tl]').map(x=>x.value)};await shot('cat-groups-types');$$('#pnModal button').find(b=>/انصراف/.test(b.innerText))?.click();await wait(500);
 CatalogReal.ingredientForm();await wait(1000);const cs=$('#pnModal [name=cat]');cs.value='شوینده و بهداشتی';cs.dispatchEvent(new Event('change',{bubbles:true}));await wait(200);out.newItemType=$('#pnModal [name=type]').value;
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
