// Probe: recipe modal summary (cost, price, food-cost %, gross margin) and recurring monthly expenses: add a fixed and a
// range template in «هزینه‌ها», then see them in the P&L and the forecast. Local dev server only: saves stay in memory.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const saveModal=async()=>{const b=$$('#pnModal button').find(b=>/ذخیره روی سرور/.test(b.innerText));b.click();for(let i=0;i<40&&$('#pnModal');i++)await wait(250);await wait(800);return $('#iwErr')?.textContent||''};
const E_cur=()=>InvEngine.CAL.today.slice(0,7);
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/menu/items';await wait(3000);const it=$('[onclick^="MenuEntry.recipe"]');if(it){it.click();await wait(1200);out.recipeSum=$$('#mrSum .mini').map(x=>[x.className.replace('mini','').trim(),x.innerText.replace(/\s+/g,' ')]);await shot('recipe-sum');await close()}
 location.hash='#/finance/ledger';await wait(4000);out.recCardBefore=$$('#pnTab .card h2, #pnTab .card h3').map(h=>h.innerText).filter(t=>/ثابت/.test(t));
 $('#recNew').click();await wait(700);$('#pnModal [name=title]').value='اجارهٔ مغازه';$('#pnModal [name=cat]').value='اجاره';$('#pnModal [name=amt]').value='۱۵۰٬۰۰۰٬۰۰۰';out.e1=await saveModal();
 $('#recNew').click();await wait(700);$('#pnModal [name=title]').value='قبض برق';$('#pnModal [name=cat]').value='برق';const k=$('#pnModal [name=kind]');k.value='range';k.onchange();$('#pnModal [name=min]').value='۸٬۰۰۰٬۰۰۰';$('#pnModal [name=max]').value='۱۲٬۰۰۰٬۰۰۰';out.e2=await saveModal();
 out.recRows=[...($$('#pnTab table').find(t=>/مبلغ \/ بازه/.test(t.innerText))?.tBodies[0]?.rows||[])].map(r=>r.innerText.replace(/\s+/g,' '));
 location.hash='#/finance/pnl';await wait(3500);const pm=document.querySelector('#plM');if(pm){pm.value=E_cur();pm.dispatchEvent(new Event('change'));await wait(2500)}out.pnlRec=$$('#pnTab .card').find(c=>/هزینه‌های ثابت و تکراری/.test(c.innerText))?.innerText.replace(/\s+/g,' ').slice(0,300);out.pnlRows=$$('#pnTab tbody tr').map(r=>r.innerText.replace(/\s+/g,' ')).filter(t=>/اجاره|برق/.test(t));
 location.hash='#/finance/plan';await wait(3500);out.plan=$$('#pnTab .card').map(c=>c.innerText.replace(/\s+/g,' ').slice(0,260)).filter(t=>/ثابت|سایر هزینه/.test(t));
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
