// Probe: layout fixes — assets cards stacked, item-flow table compact, catalog item modal wide, accounts filter on one line. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
const wide=el=>el?{w:el.scrollWidth,cw:el.clientWidth}:null;
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/finance/assets';await wait(4000);const cs=$$('#pnTab .card').filter(c=>/ارزش به تفکیک دسته|^دارایی‌ها/.test(c.querySelector('h2,h3')?.innerText||''));out.assets=cs.map(c=>({h:c.querySelector('h2,h3').innerText,top:Math.round(c.getBoundingClientRect().top),width:Math.round(c.getBoundingClientRect().width),wrap:wide(c.querySelector('.table-wrap'))}));await shot('ui-assets');
 location.hash='#/finance/accounts';await wait(3500);const f=$('#acF'),t=$('#acT');out.accounts=f&&t?{sameLine:Math.abs(f.getBoundingClientRect().top-t.getBoundingClientRect().top)<4,fTop:Math.round(f.getBoundingClientRect().top)}:null;
 location.hash='#/inventory/reports';await wait(3500);const it=$$('#pnTab a, #pnTab button, #pnTab [data-v]').find(x=>x.dataset&&x.dataset.v==='items'||/^گردش مواد$/.test(x.innerText.trim()));if(it){it.click();await wait(2500)}const tb=$('#itemsTable table');out.items=tb?{compact:tb.classList.contains('compact'),wrap:wide(tb.closest('.table-wrap'))}:null;await shot('ui-items');
 location.hash='#/inventory/catalog';await wait(3500);const r=$('#catTable [data-ing]');if(r){r.click();await wait(1200);const m=$('#pnModal .modal');out.modal={w:Math.round(m?.getBoundingClientRect().width||0),body:wide($('#pnModal .modal-body')),scrollH:$('#pnModal .modal-body')?.scrollHeight,cols:getComputedStyle($('#pnModal .ing-form .form-grid')).gridTemplateColumns.split(' ').length};await shot('ui-catalog-modal');await close()}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
