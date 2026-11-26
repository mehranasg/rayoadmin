// Probe (BL-085): «فروش و صندوق به تفکیک ماه» newest first; a click on «ماه» sorts by the calendar. Writes nothing.
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $$=s=>[...document.querySelectorAll(s)];
try{for(let i=0;i<120&&!InvControl.ready();i++)await wait(500);location.hash='#/finance';await wait(3500);
 const c=$$('.card').find(x=>/فروش و صندوق به تفکیک ماه/.test(x.querySelector('h2,h3')?.innerText||''));const col=()=>[...c.querySelectorAll('tbody tr')].map(r=>r.cells[0].innerText.trim());
 out.initial=col();const th=c.querySelector('thead th');th.click();await wait(300);out.asc=col();th.click();await wait(300);out.desc=col();out.keys=out.asc.map(P.calKey)}catch(e){out.err=String(e.stack||e)}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
