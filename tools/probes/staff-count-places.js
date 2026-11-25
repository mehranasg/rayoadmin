// Probe: the staff app's count form (same InvEntry.count as the panel) has «+ محل», the Excel / print buttons and saves
// one item counted in two places as countParts with the staff member's name. Signs in like staff-app.js (password read from
// the local copy, never printed); the dev server keeps saves in memory only.
//   PAGE=staff.html NOSESSION=1 node tools/smoke.cjs tools/probes/staff-count-places.js 300 390
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const set=(el,v)=>{el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}))};
const load=async m=>InvEngine.unwrap(await (await fetch(InvEngine.API_ROOT+'Load?module='+m+'&_='+Date.now())).json());
try{window.confirm=()=>true;await wait(1500);const hr=await load('personnel'),p=hr.personnel.find(x=>x.status==='فعال'&&x.userAccess?.enabled===true&&x.username&&(x.userAccess?.permissions?.inventoryCount||x.userAccess?.permissions?.inventory||true));
 const f=$('#stLogin');set(f.u,p.username);set(f.p,p.userPassword);f.requestSubmit();await wait(2500);out.signedIn=!!AdminAccess.staff();
 for(let i=0;i<60&&!InvControl.ready();i++)await wait(500);await wait(2000);
 location.hash='#/s/count';await wait(1500);InvEntry.count();await wait(1500);
 out.form={open:!!$('#pnModal #iwList'),xadd:$$('[data-xadd]').length,excel:!!$('#iwXls'),print:!!$('#iwPrint'),upload:!!$('#iwUp')};
 const W=window.InvWrite,it=InvControl.state.raw.pricing.ingredients.find(i=>W.stockItem(i)&&W.unitsOf(i).length>1);
 set($('#iwQ'),it.name);await wait(400);set($(`[data-c="${CSS.escape(it.id)}"]`),'1');$(`[data-xadd="${CSS.escape(it.id)}"]`).click();await wait(300);set($(`[data-xq="${CSS.escape(it.id)}|0"]`),'2');await wait(200);
 out.hint=$(`[data-uu="${CSS.escape(it.id)}"]`)?.innerText;await shot('staff-count-places');
 const save=$$('#pnModal button').find(b=>/ذخیره/.test(b.innerText));save.click();await wait(4000);
 const inv=await load('inventory'),st=inv.stocktakes.filter(s=>s.status==='approved'&&InvEngine.D(s.date)===InvEngine.CAL.today),l=st.flatMap(s=>s.lines).find(x=>x.ingredientId===it.id);
 out.saved=l?{actual:l.actual,parts:(l.countParts||[]).map(x=>x.place+':'+x.quantity+' '+x.unit),by:!!l.countedByName}:null;
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
