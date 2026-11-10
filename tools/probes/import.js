// Probe: Excel import (guide, preview with row errors) and trend charts on ledger, supplier payments, invoices, petty cash.
// The test file is built in the page and fed to the importer; the modal is closed without saving. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(400)};
const feed=async rows=>{const X=await P.loadXLSX(),wb=X.utils.book_new();X.utils.book_append_sheet(wb,X.utils.aoa_to_sheet(rows),'داده');const buf=X.write(wb,{type:'array',bookType:'xlsx'}),f=new File([buf],'t.xlsx'),dt=new DataTransfer();dt.items.add(f);const i=$('#imF');i.files=dt.files;i.dispatchEvent(new Event('change'));await wait(1500);return $('#imP')?.innerText.replace(/\s+/g,' ').slice(0,300)};
const charts=ids=>ids.map(id=>!!document.querySelector('#'+id+' svg'));
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/finance/ledger';await wait(5000);out.ledger={charts:charts(['chLgL','chLgD'])};$('#lgImp')?.click();await wait(1000);out.ledger.guideRows=$$('#pnModal tbody tr').length;
 const accs=[...new Set($$('#pnModal td').map(t=>t.innerText))];out.ledger.preview=await feed([['تاریخ','دسته','شرح','مبلغ (تومان)','حساب','پرداخت‌شده'],['1405/08/10','سایر','پیک','250000','صندوق نقدی','بله'],['1405/08/11','سایر','قبض','۱٬۲۰۰٬۰۰۰','','خیر'],['1499/01/01','','x','-5','حساب ناموجود','']]);await shot('import-ledger');await close();
 location.hash='#/finance/payments';await wait(4000);out.payments={charts:charts(['chPyL','chPyD'])};
 location.hash='#/finance/docs';await wait(4000);out.invoices={charts:charts(['chPiL','chPiD'])};window.FinanceReal?.loadSuppliers?.();await wait(2500);PurchaseEntry.importInvoices();await wait(1200);if($('#imF'))out.invoices.preview=await feed([['تاریخ','تأمین‌کننده','شمارهٔ فاکتور','مبلغ'],['1405/08/10',PurchaseWrite.supplierName((FinanceReal.suppliers()?.suppliers||[]).find(x=>!x.isArchived)),'11','900000'],['1405/08/10','ناموجود','12','5']]);await close();
 location.hash='#/finance/petty';await wait(5000);out.petty={charts:charts(['chPcL','chPcD'])};
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
