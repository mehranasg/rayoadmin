// Probe (saves only into the dev server's memory copy): catalog «ادغام اقلام» — select items in the catalog, the merge form
// and its preview, factor input for a different unit, save, then check recipes, archive and on-hand on the reloaded data.
//   node tools/smoke.cjs tools/probes/item-merge.js 400
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const PR=()=>InvControl.state.raw.pricing,ing=id=>PR().ingredients.find(i=>i.id===id),pos=()=>new Map(InvEngine.positions(InvControl.state.M,InvEngine.CAL.today).map(r=>[r.id,r.qty]));
const pick=async(q,ids)=>{const box=$('#pnView [data-fq]');if(box){box.value=q;box.dispatchEvent(new Event('input',{bubbles:true}))}await wait(700);
 for(const id of ids){const s=$(`#catTable [data-sel="${id}"]`);if(s)s.click();else out.missing=(out.missing||[]).concat(id);await wait(150)}};
const merge=async(label,q,ids,{keep,name,fac}={})=>{await pick(q,ids);$('#catBulk [data-bk="merge"]')?.click();await wait(900);const m=$('#pnModal');const r={title:m?.querySelector('h2')?.innerText};
 if(keep){const s=m.querySelector('[name=keep]');s.value=keep;s.dispatchEvent(new Event('change'));await wait(300)}
 if(name){m.querySelector('[name=nn]').value=name}
 if(fac)for(const [id,v] of Object.entries(fac)){const x=m.querySelector(`[data-fac="${id}"]`);r['facInput_'+id]=!!x;if(x){x.value=v;x.dispatchEvent(new Event('change',{bubbles:true}))}await wait(300)}
 r.preview=$('#mgPrev')?.innerText.replace(/\s+/g,' ').slice(0,400);await shot('merge-'+label);
 $('#iwOk')?.click();await wait(400);r.err=$('#iwErr')?.innerText;for(let i=0;i<40&&$('#pnModal.open');i++)await wait(300);await wait(800);r.closed=!$('#pnModal.open');r.toast=$$('.toast').map(t=>t.innerText).pop();out[label]=r};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);await wait(2000);
 const p0=pos();out.before={simit:[p0.get('ING-1062'),p0.get('ING-7142')],parm:[p0.get('ING-1015'),p0.get('ING-1065')],carpet:[p0.get('ING-5041'),p0.get('ING-7162')]};
 location.hash='#/inventory/catalog';await wait(3000);
 await merge('simit','سیمیت',['ING-1062','ING-7142']);
 await merge('parm','پارمسان',['ING-1015','ING-1065'],{keep:'ING-1015',name:'پنیر پارمسان'});
 await merge('carpet','فرش',['ING-5041','ING-7162'],{keep:'ING-5041',name:'شامپو و شوینده فرش',fac:{'ING-7162':'۱'}});
 await wait(1500);const p1=pos();
 out.after={simit:[p1.get('ING-1062'),p1.get('ING-7142')],parm:[p1.get('ING-1015'),p1.get('ING-1065')],carpet:[p1.get('ING-5041'),p1.get('ING-7162')]};
 out.items={'7142':[ing('ING-7142').isArchived,ing('ING-7142').mergedInto],'1065':[ing('ING-1065').isArchived,ing('ING-1065').mergedInto],'1015':ing('ING-1015').name,'5041':ing('ING-5041').name};
 out.recipesOnMerged=PR().recipes.filter(r=>['ING-7142','ING-1065','ING-7162'].includes(r.ingredientId)).length;out.parmRecipes=PR().recipes.filter(r=>r.ingredientId==='ING-1015').length;
 out.mergeMoves=InvControl.state.raw.inventory.inventoryMovements.filter(m=>m.movementType==='ITEM_MERGE').map(m=>m.ingredientId+':'+m.quantity);
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
