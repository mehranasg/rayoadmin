// Probe: count report — unit under counted values, owner edit / delete buttons, whole-count edit form prefilled. Writes nothing.
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(400)};
try{for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 location.hash='#/inventory/count';await wait(4000);const h=$('#crHost');out.report=!!h;if(h){out.date=$('#crDate')?.value;out.btns={edit:$$('#crHost [data-cle]').length,del:$$('#crHost [data-cld]').length,whole:!!$('#crHost [data-cre]'),voidAll:!!$('#crHost [data-crv]')};
  const tr=$('#crHost tbody tr');out.firstRow=tr?.innerText.replace(/\s+/g,' ').slice(0,160);await shot('count-report');
  $('#crHost [data-cle]')?.click();await wait(900);out.lineForm=$('#pnModal')?.innerText.replace(/\s+/g,' ').slice(0,200);await close();
  $('#crHost [data-cre]')?.click();await wait(2500);const ins=$$('#pnModal [data-c]'),filled=ins.filter(x=>x.value!=='');out.wholeForm={title:$('#pnModal h2, #pnModal .modal-title')?.innerText,pre:$('#iwPre')?.checked,filled:filled.length,n:$('#iwN')?.innerText,hint:$$('#pnModal .iw-u').slice(0,2).map(x=>x.innerText)};
  if(ins[0]){ins[0].value='3';ins[0].dispatchEvent(new Event('input',{bubbles:true}));await wait(200);out.wholeForm.after=$('#iwN')?.innerText}await shot('count-edit-form');await close()}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
