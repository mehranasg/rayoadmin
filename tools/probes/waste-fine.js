// Probe: «ثبت جدید ← صندوق نقدی» opens the cash box expense form; a fine saved from the waste list is linked to that waste
// record (source «waste») and shows in its row. Local dev server only: saves stay in memory.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 P.openLive({go:'#/finance/cashbox',ready:()=>!!window.LedgerReal?.ready?.(),open:()=>LedgerReal.cashOut()});await wait(5000);out.cashModal=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,160);
 const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300);
 location.hash='#/inventory/waste';await wait(3500);const fb=$('[data-wfine]');const key=fb?.dataset.wfine;fb.click();await wait(800);
 const pid=$('#pnModal [name=pid]');if(!pid.value)pid.value=pid.options[1].value;$('#pnModal [name=amount]').value='۵۰٬۰۰۰';
 $$('#pnModal button').find(b=>/ذخیره روی سرور/.test(b.innerText)).click();await wait(5000);
 out.fine=(PeopleReal.doc().penaltiesRewards||[]).filter(r=>r.source==='waste').map(r=>[r.sourceId===key,r.amount,r.type,r.reason]);
 out.fineCell=[...document.querySelectorAll('#pnTab table')].at(-1)?.tBodies[0]?.rows[0]?.cells[9]?.innerText;
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
