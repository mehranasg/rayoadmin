// Probe: catalog filters (uncounted, stale, unused, no price, archived), last-count column, clean-up form, price templates. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/catalog';await wait(3500);const sel=[...$$('#pnTab select')].find(s=>[...s.options].some(o=>o.value==='uncounted'));out.flags={};
 for(const v of ['','uncounted','stale','unused','noprice']){sel.value=v;sel.dispatchEvent(new Event('change',{bubbles:true}));await wait(900);const tb=$('#catTable table');out.flags[v||'all']=tb?.tBodies[0]?.rows.length||0}
 out.head=[...($('#catTable table')?.tHead.rows[0].cells||[])].map(c=>c.innerText);sel.value='';sel.dispatchEvent(new Event('change',{bubbles:true}));await wait(600);
 CatalogReal.cleanupForm();await wait(2500);out.cleanup={rows:$$('#pnModal [name=cu]').length,del:$$('#pnModal tbody .badge, #pnModal tbody [class*=badge]').filter(b=>/حذف/.test(b.innerText)).length};const all=$('#cuAll');if(all){all.click();await wait(300);out.cleanup.n=$('#cuN')?.innerText}await shot('catalog-cleanup');await close();
 const ing=(InvControl.state.raw.pricing.ingredients||[]).find(i=>!i.isArchived);CatalogReal.ingredientForm(ing.id);await wait(1000);out.delBtn=!!document.querySelector('#ingDel');document.querySelector('#ingDel')?.click();await wait(1500);out.delModal=document.querySelector('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,260);await shot('catalog-delete');await close();CatalogReal.pricesForm();await wait(1500);out.priceBtns=['#lpTpl','#lpSmp'].map(s=>!!$(s));
 // the template rows (no download in headless; build the same rows the button writes)
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
