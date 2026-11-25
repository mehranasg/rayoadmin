// Probe: BL-015 prepared-item form — «تاریخ اثر» field and version list on an existing item; a formula change applied to a
// copy of the data (not saved) gives a version, and the engine deducts the old formula before the date. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/base/catalog';await wait(3000);const raw=InvControl.state.raw,pr=raw.pricing,p=pr.preparedItems.find(x=>x.status!=='غیرفعال'&&x.components?.length>=2);out.item=p?.name;
 CatalogReal.preparedForm(p.id);await wait(1200);out.form={eff:$('#pnModal [name=eff]')?.value,note:!!$('#pnModal [name=vnote]'),section:$$('#pnModal .fsec summary').map(s=>s.innerText.trim()).filter(t=>/نسخه/.test(t)),hint:$('#pnModal .fsec:last-of-type .note')?.innerText?.slice(0,80)};await shot('prep-versions');
 // on a copy: change the first component from 30 days ago and compare deductions of a menu item that uses it
 const cp=JSON.parse(JSON.stringify(pr)),E=InvEngine,MW=MenuWrite,d30=E.CAL.k(E.CAL.i(E.CAL.today)-30),d60=E.CAL.k(E.CAL.i(E.CAL.today)-60);
 const comps=p.components.map((c,k)=>({...c,quantity:k===0?Number(c.quantity)*2:c.quantity}));MW.savePreparedItem(cp,{actor:'probe',at:'x',reqId:'P'},{...p,components:comps,effectiveFrom:d30,versionNote:'probe'});
 out.versions=MW.prepVersions(cp,p.id).map(v=>[v.effectiveFrom,v.version,v.source]);
 const menu=cp.recipes.find(r=>r.preparedItemId===p.id)?.menuItemId;if(menu){const M=E.build({inventory:raw.inventory,pricing:cp,cashreport:{}}),sum=d=>M.recipeAt(menu,d).filter(r=>r.ingredientId===p.components[0].ingredientId).reduce((a,r)=>a+r.quantity,0);out.deduct={menu,before:sum(d60),after:sum(E.CAL.today)}}
 P.close&&P.close();out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
