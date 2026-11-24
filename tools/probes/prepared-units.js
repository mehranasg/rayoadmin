// Probe: prepared-item formula units (BL-057) — the dough ball formula offers every unit of each ingredient (روغن پخت و پز:
// عدد / کیلوگرم / گرم after «۱ عدد = ۹۰۰ گرم»), and a gram amount of a bottle item converts (InvEngine.convertQty). Form only.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $$=s=>[...document.querySelectorAll(s)];
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/catalog';await wait(2500);const pr=InvControl.state.raw.pricing,p=pr.preparedItems.find(x=>x.name==='چونه خمیر');out.prep=!!p;
 CatalogReal.preparedForm(p.id);await wait(1200);out.rows=$$('#pnModal .pp-c').map(r=>[r.children[0].value.split(' — ')[0],r.children[2].value,[...r.children[2].options].map(o=>o.value).join('/')]);
 const oil=pr.ingredients.find(i=>i.code==='2025');out.conv=InvEngine.convertQty(oil,10,'گرم','عدد');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
