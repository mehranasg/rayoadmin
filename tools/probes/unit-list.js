// Probe: shared unit list («واحدها» in the catalog) and other units as «۱ [واحد] = n [واحد]» picked from it.
// Local dev server only: saves stay in memory.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const open=()=>$('#pnModal')?.classList.contains('open');
const save=async()=>{$$('#pnModal button').find(b=>/ذخیره روی سرور/.test(b.innerText)).click();for(let i=0;i<40&&open()&&!$('#iwErr')?.textContent;i++)await wait(250);await wait(400);return $('#iwErr')?.textContent||(open()?'still open':'')};
const pick=(sel,v)=>{sel.value=v;sel.dispatchEvent(new Event('change',{bubbles:true}))};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/catalog';await wait(2500);out.btn=!!$$('button').find(b=>/^واحدها/.test(b.innerText.trim()));
 // 1. add a unit to the list
 CatalogReal.unitsForm();await wait(700);out.chips=$$('#unRows .chip').length;$('#unNew').value='شیرینگ';$('#unAdd').click();await wait(200);out.rmButtons=$$('#unRows [data-unrm]').length;await shot('unit-list');out.e1=await save();out.list=InvControl.state.raw.pricing.lists.units.join('، ');
 // 2. straw: the saved unit shows as «۱ بسته = ۱۰۰ عدد»; retype it, then an error state
 const s=InvControl.state.raw.pricing.ingredients.find(i=>i.code==='6002');CatalogReal.ingredientForm(s.id);await wait(900);
 const r=$('.cu-row');out.shown=[r.querySelector('[data-f=a]').value,r.querySelector('[data-f=q]').value,r.querySelector('[data-f=b]').value,r.querySelector('[data-f=say]').innerText];
 $('#cuAdd').click();await wait(200);const r2=$$('.cu-row').at(-1);pick(r2.querySelector('[data-f=a]'),'شیرینگ');r2.querySelector('[data-f=q]').value='۲';pick(r2.querySelector('[data-f=b]'),'بسته');r2.querySelector('[data-f=q]').dispatchEvent(new Event('input',{bubbles:true}));await wait(200);out.newRow=r2.querySelector('[data-f=say]').innerText;
 const r3=($('#cuAdd').click(),await wait(200),$$('.cu-row').at(-1));pick(r3.querySelector('[data-f=a]'),'بسته');r3.querySelector('[data-f=q]').value='۳';pick(r3.querySelector('[data-f=b]'),'عدد');await wait(200);out.errRow=r3.querySelector('[data-f=say]').innerText;r3.querySelector('[data-cudel]').click();await wait(200);
 out.cntOpts=[...$('#pnModal [name=cntU]').options].map(o=>o.text);$('#cuRows').scrollIntoView({block:'center'});await wait(300);await shot('unit-pair');out.e2=await save();
 const s2=InvControl.state.raw.pricing.ingredients.find(i=>i.code==='6002');out.saved=(s2.countingUnits||[]).map(u=>u.name+'='+u.factor+(u.def?` (۱ ${u.def.a} = ${u.def.q} ${u.def.b})`:''));
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
