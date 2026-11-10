// Probe: «فروشندهٔ متفرقه» — supplier search box, quick invoice and payment to a seller who is not a defined supplier.
// Saves on the dev server only (in-memory copy, never the real API).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const set=(n,v)=>{const x=$(`#pnModal [name=${n}]`);x.value=v;x.dispatchEvent(new Event('input',{bubbles:true}));x.dispatchEvent(new Event('change',{bubbles:true}))};
const okBtn=()=>$$('#pnModal .modal-foot button').find(b=>/ذخیره/.test(b.innerText));const waitClose=async()=>{for(let i=0;i<40&&$('.modal-backdrop.open');i++)await wait(300);await wait(600)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/finance/docs';await wait(3000);FinanceReal.loadSuppliers();for(let i=0;i<20&&!FinanceReal.suppliers();i++)await wait(300);
 PurchaseEntry.quick();await wait(1000);out.search=!!$('#pnModal .pn-sfilter');const f=$('#pnModal .pn-sfilter');if(f){f.value='متفرقه';f.dispatchEvent(new Event('input'));await wait(200);out.searchPicked=$('#pnModal [name=sup]').value}
 set('sup','MISC');await wait(200);out.vendorShown=!$('#pnModal [data-misc]').hidden;await shot('misc-invoice');
 set('vendor','میوه‌فروشی سر کوچه');set('no','M-1');set('amount','450000');set('settle','paid');await wait(200);set('loc',$('#pnModal [name=loc]').options[1].value);set('ref','R-77');
 okBtn().click();await wait(1500);out.quickErr=($('#iwErr')?.innerText||'')+' | '+[...document.querySelectorAll('.toast')].map(t=>t.innerText).join(' ');await waitClose();const inv=InvControl.state.raw.inventory,x=inv.purchaseInvoices.find(i=>i.invoiceNumber==='M-1'||i.number==='M-1'),p=inv.supplierPayments.find(q=>q.invoiceId===x?.id);
 out.invoice=x&&{supplierId:x.supplierId,name:x.supplierNameSnapshot,total:x.totalToman};out.quickPay=p&&{name:p.supplierNameSnapshot,amount:p.amount};
 location.hash='#/finance/payments';await wait(2500);PurchaseEntry.payment();await wait(1000);set('sup','MISC');await wait(200);set('vendor','نانوایی محل');set('amount','120000');set('loc',$('#pnModal [name=loc]').options[1].value);set('ref','R-78');okBtn().click();await waitClose();
 const p2=InvControl.state.raw.inventory.supplierPayments.find(q=>q.reference==='R-78');out.payment=p2&&{supplierId:p2.supplierId,name:p2.supplierNameSnapshot};out.listed=$('#pyTable')?.innerText.includes('نانوایی محل');
 PurchaseEntry.payment();await wait(800);set('sup','MISC');await wait(200);set('amount','1000');set('loc',$('#pnModal [name=loc]').options[1].value);set('ref','R-79');okBtn().click();await wait(1500);out.noNameError=$('#iwErr')?.innerText||document.querySelector('.toast')?.innerText;
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
