// Probe: BL-011 setup tools card and previews (no save), BL-016 oil cycles card, BL-010 non-recipe column. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(400)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/settings';await wait(2500);out.setup={card:$$('.card').some(c=>/ابزارهای راه‌اندازی/.test(c.innerText)),fresh:!!$('#stFreshGo'),reset:!!$('#stResetGo')};
 const f=$('#stFresh');if(f){f.value=P.fa(InvEngine.CAL.k(InvEngine.CAL.i(InvEngine.CAL.today)-30));$('#stFreshGo').click();await wait(800);out.fresh={title:$('#pnModal h2')?.innerText,rows:$$('#pnModal tbody tr').map(r=>r.innerText.replace(/\s+/g,' ')).slice(0,12)};
  // save must be refused before the backup
  const ok=$$('#pnModal button').find(b=>/اجرا روی سرور/.test(b.innerText));ok?.click();await wait(500);out.fresh.refused=document.body.innerText.includes('اول پشتیبان را دانلود کنید');await shot('setup-fresh');await close()}
 $('#stResetGo')?.click();await wait(600);out.reset=$('#pnModal .note')?.innerText?.slice(0,140);await close();
 // oil cycles
 location.hash='#/inventory/consumption';await wait(3000);const oilBtn=$$('button,a').find(b=>/روغن و اقلام سر میز/.test(b.innerText));if(oilBtn){oilBtn.click();await wait(2500)}
 const oc=$$('.card').find(c=>/دوره‌های تعویض روغن/.test(c.innerText));out.oil={card:!!oc,text:oc?.innerText.replace(/\s+/g,' ').slice(0,300)};await shot('oil-cycles');
 // non-recipe column
 const it=$$('button,a').find(b=>/وضعیت اقلام/.test(b.innerText));if(it){it.click();await wait(2500)}
 const all=$$('input[type=checkbox]').find(x=>/همه/.test(x.closest('label')?.innerText||''));if(all&&!all.checked){all.click();await wait(2000)}
 const th=$$('th').map(t=>t.innerText.replace(/\s+/g,' '));out.nonRecipe={col:th.some(t=>/بی‌رسپی/.test(t)),sample:$$('tbody tr').slice(0,40).map(r=>{const c=[...r.cells];const i=th.findIndex(t=>/بی‌رسپی/.test(t));return i>=0?c[i]?.innerText.trim():null}).filter(x=>x&&x!=='—').slice(0,6)};
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
