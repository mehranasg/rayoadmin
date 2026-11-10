// Probe: real catalog clean-up save of two items on the dev server (in-memory copy, never the real API): zero count lines
// removed from inventory first, then the items removed from pricing; checks both documents after the save.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/catalog';await wait(3500);CatalogReal.cleanupForm();await wait(2500);
 const boxes=$$('#pnModal [name=cu]'),inv0=InvControl.state.raw.inventory,pr0=InvControl.state.raw.pricing,pick=[];
 for(const b of boxes){const z=MenuWrite.ingredientRefs(pr0,inv0,b.value).zeroCounts;if(z&&!pick.some(p=>p.z))pick.push({id:b.value,z});else if(!z&&!pick.some(p=>!p.z))pick.push({id:b.value,z});if(pick.length===2)break}
 for(const p of pick)$(`#pnModal [name=cu][value="${p.id}"]`).click();out.picked=pick;
 const ok=$$('#pnModal .modal-foot button').find(b=>/اجرا/.test(b.innerText));ok.click();for(let i=0;i<40&&$('#pnModal.open, .modal-backdrop.open');i++)await wait(300);await wait(800);
 const inv=InvControl.state.raw.inventory,pr=InvControl.state.raw.pricing;
 out.after=pick.map(p=>({id:p.id,inCatalog:pr.ingredients.some(i=>i.id===p.id),countLines:inv.stocktakes.flatMap(s=>s.lines||[]).filter(l=>l.ingredientId===p.id).length,revisions:inv.stocktakes.filter(s=>(s.revisionHistory||[]).some(r=>r.kind==='item-deleted'&&r.removed.some(l=>l.ingredientId===p.id))).length}));
 out.audit=[inv.changeLog?.at(-1)?.action,pr.changeLog?.at(-1)?.action];const oh=new Map(InvEngine.positions(InvControl.state.M,InvEngine.CAL.today).map(r=>[r.id,r.qty]));out.plans=pick.map(p=>{const x=MenuWrite.cleanupPlan(pr,inv,p.id,{onHand:oh});return{a:x.action,onHand:x.refs.onHand,h:x.refs.history,arch:pr.ingredients.find(i=>i.id===p.id)?.isArchived}});out.lastPr=(pr.changeLog||[]).slice(-3).map(x=>x.action);out.retired=pr.settings?.retiredIngredientCodes?.length;
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
