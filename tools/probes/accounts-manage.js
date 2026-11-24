// Probe: finance → accounts: «مدیریت حساب‌ها» card (every record of the three lists + petty cards), merge two records of
// one account, POS account choice; petty cash → cards: edit the holder name, charge from an account, money back, delete
// button only for an unused card (dev server, in-memory copy, never the real API).
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms)),out={};const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
const ok=async()=>{const b=$$('#pnModal .modal-foot button').find(b=>/روی سرور|یکی کن/.test(b.innerText));b.click();for(let i=0;i<40;i++){await wait(300);if(!$('#pnModal.open'))break}await wait(600);return $('#pnModal.open')?($('#iwErr')?.textContent||'modal still open'):''};
const close=async()=>{const x=$$('#pnModal button').find(b=>/انصراف|بستن/.test(b.innerText));if(x)x.click();await wait(300)};
const pick=(name,re)=>{const s=$(`#pnModal [name=${name}]`),o=[...s.options].find(o=>re.test(o.text));if(o){s.value=o.value;s.dispatchEvent(new Event('change',{bubbles:true}))}return o?.text};
try{if(!/127\.0\.0\.1|localhost/.test(location.host))throw Error('only on the dev server');for(let i=0;i<120&&!(window.InvControl&&InvControl.ready());i++)await wait(500);
 window.confirm=()=>true;window.prompt=()=>'آزمون';
 location.hash='#/finance/accounts';await wait(5000);const FD=()=>ExtrasReal.mods.finance.doc;
 const card=$$('#pnTab .card').find(c=>/مدیریت حساب‌ها/.test(c.innerText));out.manage=!!card;out.manageRows=card?.querySelectorAll('tbody tr').length;out.types=[...new Set([...(card?.querySelectorAll('tbody tr')||[])].map(r=>r.cells[1]?.innerText))];
 out.posOptions=[...($('.ac-pos')?.options||[])].map(o=>o.text);out.buttons=[...(card?.querySelectorAll('.card-head button, button[id^=am]')||[])].map(b=>b.innerText.trim());
 await shot('accounts-manage');
 // merge two unmerged accounts (a cash holder into the cash box), then split them back
 $('#amMerge').click();await wait(800);out.mergeTo=pick('to',/صندوق نقدی/);out.mergeFrom=pick('from',/نقد نزد: سالار/);const fromKey=$('#pnModal [name=from]').value;await wait(300);out.preview=$('#amPrev')?.innerText.slice(0,200);await shot('accounts-merge');out.mergeErr=await ok();
 out.aliases=FD().settings?.accountAliases;await wait(1500);
 const rows=$$('#pnTab .card').find(c=>/^حساب‌ها/.test(c.querySelector('h2,h3')?.innerText||''));out.mainRow=[...(rows?.querySelectorAll('tbody tr')||[])].map(r=>r.cells[0].innerText.replace(/\s+/g,' ')).find(t=>/صندوق نقدی/.test(t));
 out.dupHidden=![...(rows?.querySelectorAll('tbody tr')||[])].some(r=>/^سالار/.test(r.cells[0].innerText.trim())&&/نقد نزد/.test(r.innerText));
 out.pettyRow=[...(rows?.querySelectorAll('tbody tr')||[])].map(r=>r.innerText.replace(/\s+/g,' ')).find(t=>/کارت تنخواه/.test(t));
 // POS account
 const ps=$('.ac-pos');const o=[...ps.options].find(o=>/مهران/.test(o.text))||ps.options[1];ps.value=o.value;ps.dispatchEvent(new Event('change'));await wait(2500);out.pos=FD().settings?.posAccountKey;
 // split back
 const sp=$(`[data-amsplit="${fromKey}"]`);if(sp){window.confirm=()=>true;sp.click();await wait(2500);out.afterSplit=FD().settings?.accountAliases}
 // edit buttons open the owner forms
 const ed=$$('[data-amed]');out.editKinds=[];for(const k of ['account:','cash:','payment:','petty:']){const b=ed.find(x=>x.dataset.amed.startsWith(k));if(!b)continue;b.click();await wait(900);out.editKinds.push(k+' '+($('#pnModal.open .modal-head')?.innerText||$('#pnModal.open')?.innerText||'').split('\n')[0]);await close()}
 // petty cash cards
 location.hash='#/finance/petty';await wait(3500);const chip=$$('#pnTab [data-chip]').find(b=>/کارت‌ها و تسویه/.test(b.innerText))||$$('#pnTab button').find(b=>/کارت‌ها و تسویه/.test(b.innerText));chip?.click();await wait(1200);
 out.cardButtons=$$('#pnTab tbody tr')[0]?.lastElementChild?.innerText.replace(/\s+/g,' ');await shot('petty-cards');
 const pe=$('[data-pced]');if(pe){const id=pe.dataset.pced;pe.click();await wait(900);out.editTitle=$('#pnModal .modal-head')?.innerText.split('\n')[0];out.accChecks=$$('#pnModal [name=acc]').length;
  $('#pnModal [name=pid]').value='';$('#pnModal [name=hname]').value='نام آزمون';const cb=$('#pnModal [name=acc]');if(cb)cb.checked=true;await shot('petty-edit');out.editErr=await ok();
  const c=FD().pettyCash.cards.find(x=>x.id===id);out.edited={name:c.holderName,changes:c.changes?.length,acc:c.accountKeys};
  $(`[data-pct="${id}"]`)?.click();await wait(900);out.topAcc=[...$('#pnModal [name=acc]').options].map(o=>o.text);$('#pnModal [name=amount]').value='1000000';out.topErr=await ok();
  $(`[data-pcr="${id}"]`)?.click();await wait(900);out.retTitle=$('#pnModal .modal-head')?.innerText.split('\n')[0];out.retBal=$('#pcBal')?.innerText;$('#pnModal [name=amount]').value='200000';out.retErr=await ok();
  out.balance=PettyWrite.balance(FD(),id);out.deleteBtn=!!$(`[data-pcdel="${id}"]`);
  const L=FinanceWrite.accountLedger(LedgerReal.ledgerSrc()).find(r=>r.key==='petty:'+id);out.ledgerPetty=L&&{bal:L.balance,moves:L.moves.length}}
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre)})();
