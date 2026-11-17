// Probe: «اطلاعات پایه» pages at #/base/<key> without the section's tabs; catalog columns «هر واحد خرید» before the units;
// supplier modal lists its purchase invoices; wide supplier form; sale price editable in the menu item form.
// Local dev server only: saves stay in memory.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const open=()=>$('#pnModal')?.classList.contains('open');
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
const page=()=>({tabs:$$('.page-tabs .tab').length,crumb:$('.crumbs')?.innerText.trim(),h1:$('h1')?.innerText.trim(),active:$$('.nav-link.active').map(a=>a.innerText.trim())});
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 out.nav=$$('.nav-base').map(a=>a.getAttribute('href'));
 for(const k of ['catalog','menu','suppliers','assets']){location.hash='#/base/'+k;await wait(2500);out[k]=page()}
 location.hash='#/base/catalog';await wait(2500);out.catHead=$$('#catTable th').map(t=>t.innerText.trim()).slice(1,8);await shot('base-catalog');
 // the same tab inside its section keeps the tabs
 location.hash='#/finance/parties';await wait(2500);out.inFinance=page().tabs;
 // supplier with the most invoices: its modal lists them, a row opens the invoice
 location.hash='#/base/suppliers';await wait(3000);const inv=InvControl.state.raw.inventory,cnt=new Map;for(const x of inv.purchaseInvoices||[])if(x.supplierId)cnt.set(x.supplierId,(cnt.get(x.supplierId)||0)+1);
 const sid=[...cnt.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0];out.supInvoices=cnt.get(sid);const tr=$(`[data-sup="${sid}"]`);if(tr){tr.click();await wait(800);
  out.supModal={wide:$('#pnModal .modal')?.className,w:Math.round($('#pnModal .modal')?.getBoundingClientRect().width||0),h3:$$('#pnModal h3').map(h=>h.innerText.trim()),rows:$$('#pnModal [data-pi]').length};await shot('base-supplier');
  const r=$('#pnModal [data-pi]');if(r){r.click();await wait(800);out.invoiceOpened=$('#pnModal .modal-head, #pnModal h2')?.innerText.trim().slice(0,60)}await close()}
 // wide supplier edit form
 if(sid){CatalogReal.supplierForm(sid);await wait(800);out.supForm=Math.round($('#pnModal .modal')?.getBoundingClientRect().width||0);await close()}
 // menu item form: price editable, saved with a history row
 const pr=()=>InvControl.state.raw.pricing,m=pr().menuItems.find(x=>x.status!=='غیرفعال'&&Number(x.currentPriceToman)>0),h0=(pr().priceHistory||[]).length;
 CatalogReal.menuForm(m.id);await wait(800);const pi=$('#pnModal [name=price]');out.priceField={readOnly:!pi||pi.readOnly||pi.disabled,value:pi?.value};
 pi.value=P.t(Number(m.currentPriceToman)+10000);pi.dispatchEvent(new Event('input',{bubbles:true}));await wait(200);out.priceHint=$('#mnPct')?.innerText;await shot('base-menu-price');
 window.confirm=()=>true;$$('#pnModal button').find(b=>/ذخیره روی سرور/.test(b.innerText)).click();for(let i=0;i<40&&open()&&!$('#iwErr')?.textContent;i++)await wait(250);await wait(500);
 const m2=pr().menuItems.find(x=>x.id===m.id);out.priceSaved={err:$('#iwErr')?.textContent||(open()?'still open':''),from:m.currentPriceToman,to:m2.currentPriceToman,history:(pr().priceHistory||[]).length-h0};
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
