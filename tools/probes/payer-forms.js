// Probe: BL-076 «پرداخت‌کننده» in the three cash box forms (expense, staff payment, supplier payment): the field is there
// with name suggestions and the cash box table still has its payer column. Nothing is saved.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(400)};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);window.PeopleReal?.load?.();
 location.hash='#/finance/cashbox';for(let i=0;i<40&&!$('#cbOut');i++)await wait(400);await wait(1500);
 for(const [k,id] of [['expense','#cbOut'],['staff','#cbStaff'],['supplier','#cbSup']]){const b=$(id);if(!b){out[k]='no button';continue}b.click();await wait(1500);
  const f=$('#pnModal [name=payer]');out[k]={field:!!f,options:$$('#pnModal #pnPayers option').length,title:$('#pnModal h2, #pnModal .modal-title')?.innerText?.trim().slice(0,40)};if(k==='staff')await shot('payer-staff');await close()}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
