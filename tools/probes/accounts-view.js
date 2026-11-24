// Probe: finance → accounts after the owner's account setup (1405/08/29): rows, merged names, POS badge; petty cash cards.
// Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/finance/accounts';await wait(5000);const cs=$$('#pnTab .card');
 out.cards=cs.map(c=>({h:c.querySelector('h2,h3')?.innerText,rows:[...c.querySelectorAll('tbody tr')].map(r=>r.innerText.replace(/\s+/g,' ').slice(0,90))}));
 await shot('accounts-after-setup');cs.at(-1)?.scrollIntoView();await wait(500);await shot('accounts-after-setup-manage');
 location.hash='#/finance/petty';await wait(3000);($$('#pnTab button').find(b=>/کارت‌ها و تسویه/.test(b.innerText)))?.click();await wait(1200);out.petty=$$('#pnTab tbody tr')[0]?.innerText.replace(/\s+/g,' ');await shot('petty-after-setup');
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
