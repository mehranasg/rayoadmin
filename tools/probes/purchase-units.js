// Probe: other purchase units of an item (countingUnits) in the detailed invoice and order rows — choosing the item fills the
// default unit and package size, choosing «پاکتی» fills its own size. Read only (no save).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const close=async()=>{$$('#pnModal .modal-foot button').find(b=>/انصراف|بستن/.test(b.innerText))?.click();await wait(500)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/finance/docs';await wait(3000);FinanceReal.loadSuppliers();for(let i=0;i<20&&!FinanceReal.suppliers();i++)await wait(300);
 // a test item with other units (in memory only)
 const pr=InvControl.state.raw.pricing,i=pr.ingredients.find(x=>x.status!=='غیرفعال'&&x.recipeUnit==='کیلوگرم'&&x.itemType!=='NON_STOCK');i.countingUnits=[{id:'CU-0901',name:'پاکتی',factor:0.05,active:true},{id:'CU-0902',name:'باکس',factor:0.5,active:true}];out.item=i.name;
 const run=async(open,rowSel)=>{open();await wait(1000);const r=$(`#pnModal ${rowSel}`),f=k=>r.querySelector(`[data-f=${k}]`);const lab=`${i.name}${i.code?' — '+i.code:''}`;
  f('item').value=lab;f('item').dispatchEvent(new Event('change',{bubbles:true}));await wait(200);const a={unit:f('unit').value,pack:f('pack').value,options:[...(r.querySelector('[data-f=units]')?.options||[])].map(o=>o.value)};
  f('unit').value='پاکتی';f('unit').dispatchEvent(new Event('change',{bubbles:true}));await wait(200);a.packaged=f('pack').value;await close();return a};
 out.invoice=await run(()=>PurchaseEntry.detailed(),'.pi-row');out.order=await run(()=>PurchaseEntry.order(),'.po-row');
 out.receiptUnits=InvWrite.unitsOf(i).map(u=>u.name+':'+u.factor);out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
