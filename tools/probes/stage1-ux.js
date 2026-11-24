// Probe: stage 1 (BL-083, BL-082, BL-076, BL-072, BL-074). Quick menu titles and order; the date picker on a date field
// (yesterday fills the field); the cash box «پرداخت‌کننده» column; the catalog «رسپی» column and its list; the item form:
// rename button always there for the owner, purchase unit = base unit → pack 1 locked, density suggestion and table.
// Nothing is saved (dev server, forms only).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 // quick menu
 $('#quickBtn').click();await wait(300);out.quick=$$('#quickMenu button b').map(b=>b.textContent);out.quickSmall=$$('#quickMenu button small').length;await shot('stage1-quick');document.body.click();
 // catalog: recipe column
 location.hash='#/base/catalog';await wait(3500);const th=$$('#catTable th').map(t=>t.textContent.trim());out.recCol=th.includes('رسپی');
 const rb=$('#catTable [data-recs]');out.recBtn=rb&&rb.textContent;if(rb){rb.click();await wait(600);out.recModal={rows:$$('#pnModal tbody tr').length};await shot('stage1-recipes');P.close&&P.close();await wait(300)}
 // item form: base = purchase unit
 const pr=InvControl.state.raw.pricing,same=pr.ingredients.find(i=>!i.isArchived&&i.recipeUnit===i.purchaseUnit&&Number(i.packageQuantity)!==1)||pr.ingredients.find(i=>!i.isArchived&&i.recipeUnit===i.purchaseUnit);
 CatalogReal.ingredientForm(same.id);await wait(1200);out.same={name:same.name,stored:same.packageQuantity,pack:$('#pnModal [name=pack]').value,ro:$('#pnModal [name=pack]').readOnly,hint:$('#ingPkH').textContent,rename:!!$('#ingRename'),cls:$('#ingRename')?.className};
 $('#ingRename')?.click();await wait(300);out.renameHint=$('#ingRenameHint')?.textContent||'(opened rename form)';
 if(!$('#pnModal [name=dens]')){CatalogReal.ingredientForm(same.id);await wait(1200)}
 const nm=$('#pnModal [name=name]');nm.value='شیر پرچرب';nm.dispatchEvent(new Event('input',{bubbles:true}));const dn=$('#pnModal [name=dens]');dn.value='';dn.dispatchEvent(new Event('input',{bubbles:true}));await wait(300);out.densSug=$('#ingDensSug').textContent;
 $('#ingDensSug [data-densuse]')?.click();await wait(200);out.densAfter=dn.value;$('[data-denstab]').click();await wait(200);out.densTab=$$('#ingDensTab .chip').length;await shot('stage1-item');P.close&&P.close();await wait(300);
 // date picker on the cash box range
 location.hash='#/finance/cashbox';for(let i=0;i<40&&!$('#cbF');i++)await wait(300);const f=$('#cbF');if(f){f.focus();f.dispatchEvent(new FocusEvent('focusin',{bubbles:true}));await wait(300);out.dp={is:P.datePick?.isDateInput(f),focused:document.activeElement===f,open:!!$('.dp-pop'),btns:$$('.dp-pop [data-dpn]').map(b=>b.textContent)};await shot('stage1-date');$('.dp-pop [data-dpn="1"]')?.click();await wait(500);out.dp.after=$('#cbF')?.value;out.dp.yesterday=P.fa(InvEngine.CAL.k(InvEngine.CAL.i(InvEngine.CAL.today)-1))}
 await wait(800);const card=$$('.card').find(c=>/گردش صندوق/.test(c.textContent)&&c.querySelector('th'));out.payerCol=card?[...card.querySelectorAll('th')].map(t=>t.textContent.trim()).includes('پرداخت‌کننده'):null;
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
