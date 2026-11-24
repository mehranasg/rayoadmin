// Probe: item form unit conversion — honey (base عدد, «۱ عدد = ۹۰۰ گرم»): the pack-size unit list offers گرم and کیلوگرم,
// purchase by کیلوگرم computes the pack size (1000/900 عدد) and locks the field, density brings لیتر, the recipe and count
// unit lists carry every unit, and the summary lists them. Nothing is saved (dev server, form only).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const set=async(sel,val)=>{const e=$('#pnModal '+sel);e.value=val;e.dispatchEvent(new Event('change',{bubbles:true}));await wait(250)};
const opts=sel=>[...$('#pnModal '+sel).options].map(o=>o.value);
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/catalog';await wait(3000);const pr=InvControl.state.raw.pricing,h=pr.ingredients.find(i=>i.code==='2029');out.item=h&&[h.recipeUnit,h.purchaseUnit,h.packageQuantity];
 CatalogReal.ingredientForm(h.id);await wait(1200);
 out.packU=opts('[name=packU]');out.useU=opts('[name=useU]');out.cntU=opts('[name=cntU]');out.summary=$('#cuAuto').innerText;out.rowSay=$$('#pnModal .cu-say').map(x=>x.textContent);
 await set('[name=pu]','کیلوگرم');out.kg={pack:$('#pnModal [name=pack]').value,ro:$('#pnModal [name=pack]').readOnly,packU:opts('[name=packU]'),label:$('#ingPkL').textContent,hint:$('#ingPkH').textContent};
 await set('[name=packU]','گرم');out.kgInGram=$('#pnModal [name=pack]').value;await shot('unit-convert-kg');
 await set('[name=dens]','1.4');out.withDens={packU:opts('[name=packU]'),useU:opts('[name=useU]')};
 await set('[name=pu]','لیتر');out.liter={pack:$('#pnModal [name=pack]').value,ro:$('#pnModal [name=pack]').readOnly,unit:$('#pnModal [name=packU]').value};
 await set('[name=pu]','بسته');out.pack={ro:$('#pnModal [name=pack]').readOnly};
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
