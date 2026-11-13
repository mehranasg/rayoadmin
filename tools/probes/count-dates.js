// Probe: which dates the count report lists, and how many rows the selected count shows. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/count';await wait(4000);out.report=!!$('#crHost');out.selected=$('#crDate')?.value;out.options=$$('#crDate option').map(o=>o.value);out.rows=$$('#crHost tbody tr').length;
 out.cards=$$('.card-title').map(x=>x.innerText.trim()).slice(0,12);
 out.otherSelects=$$('select').filter(s=>s.id!=='crDate').map(s=>({id:s.id||s.name,n:s.options.length,first:[...s.options].slice(0,5).map(o=>o.text.slice(0,30))}));
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
