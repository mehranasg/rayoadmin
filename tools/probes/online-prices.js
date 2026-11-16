// Probe: «قیمت از منوی آنلاین» in Menu → pricing: read the online menu, preview (exact / suggestion / none), save the picked
// rows. Local dev server only: saves stay in memory. The online menu is read from rayocafe.ir; if the browser blocks it
// (CORS from localhost) a small sample built from local items is served through a data: URL instead.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 try{const r=await fetch('https://rayocafe.ir/api/data/DineInItems',{cache:'no-store',credentials:'omit'});out.live=r.ok}catch(e){out.live=false}
 if(!out.live){const items=InvControl.state.raw.pricing.menuItems.filter(m=>m.status!=='غیرفعال').slice(0,6).map((m,i)=>({Id:i,Title:i===5?m.name+' دونفره':m.name,Price:Math.round((m.currentPriceToman||100000)/1000)+(i%2?20:0),CategoryId:1,Enable:true}));
  window.RAYO_TEMPLATE_ONLINE_ITEMS='data:application/json,'+encodeURIComponent(JSON.stringify(items));window.RAYO_TEMPLATE_ONLINE_CATS='data:application/json,[]'}
 location.hash='#/menu/pricing';await wait(3000);const b=$$('button').find(x=>/قیمت از منوی آنلاین/.test(x.innerText));out.btn=!!b;b.click();
 for(let i=0;i<40&&!$('#mrOnRows');i++)await wait(250);await wait(500);
 out.minis=$$('#pnModal .mini').map(x=>x.innerText.replace(/\s+/g,' '));out.count=$('#mrOnN')?.textContent;
 const rows=[...$('#mrOnRows').rows];out.checked=rows.filter(r=>r.querySelector('[data-f=on]').checked).length;
 out.sample=rows.filter(r=>r.style.display!=='none').slice(0,4).map(r=>r.innerText.replace(/\s+/g,' '));
 await shot('online-prices');
 window.confirm=()=>true;const before=out.checked;$$('#pnModal button').find(x=>/ذخیرهٔ قیمت/.test(x.innerText)).click();
 for(let i=0;i<40&&$('#pnModal');i++)await wait(250);await wait(800);
 out.saveErr=$('#iwErr')?.textContent||'';const ph=InvControl.state.raw.pricing.priceHistory||[];out.history=ph.filter(h=>/منوی آنلاین/.test(h.notes||'')).length;out.expected=before;
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
