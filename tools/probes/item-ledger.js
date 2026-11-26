// Probe: stock tab date picker (on-hand at the end of a count date) and the item ledger («گردش کالا») with the opening
// count edit, which reopens the ledger after the save. Local dev server only: saves stay in memory.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/stock';await wait(3000);
 const sel=$('#rsDate');out.dateOptions=sel?[...sel.options].slice(0,4).map(o=>o.textContent):null;
 const opt=[...sel.options].find(o=>/۱۴۰۵\/۰۹\/۰۱/.test(o.textContent));sel.value=opt.value;sel.dispatchEvent(new Event('change'));await wait(1500);
 out.title=[...$$('#pnTab .card-title, #pnTab h3')].map(x=>x.innerText).find(t=>/موجودی اقلام/.test(t));
 out.cols=[...($('#rsTable table')?.tHead?.rows[0]?.cells||[])].map(c=>c.innerText.trim()).filter(Boolean);
 const q=$('#rsQ');q.value='به لیمو';q.dispatchEvent(new Event('input'));await wait(600);
 const row=$('#rsTable [data-rs]');out.row=row?.innerText.replace(/\s+/g,' ').slice(0,140);row.click();await wait(900);
 out.ledger=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,700);
 const ob=$('#pnModal [data-lg="open"]');out.hasOpenEdit=!!ob;
 if(ob){ob.click();await wait(700);out.form=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,300);
  $('#pnModal [name=qty]').value='0.5';$('#pnModal [name=reason]').value='probe: گرم به جای کیلوگرم';
  $$('#pnModal button').find(b=>/ذخیره روی سرور/.test(b.innerText)).click();await wait(6000);
  out.after=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,500);
  out.toast=$$('.toast').map(t=>t.innerText).join(' | ').slice(0,200)}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
