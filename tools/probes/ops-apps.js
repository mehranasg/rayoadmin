// Probe: in-venue demo apps (pos.html, waiter.html, kds.html, staffdemo.html). Sample data in localStorage only.
// On index.html it opens each app in a full-size iframe, one after another; the same probe runs inside each app
// page, exercises the new features and hands its result to the parent. Writes nothing to the API.
//   node tools/smoke.cjs tools/probes/ops-apps.js
window.__errs=[];window.addEventListener('error',e=>__errs.push(String(e.message)+' @'+(e.filename||'').split('/').pop()+':'+e.lineno));
(async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const page=location.pathname.split('/').pop();
if(page==='index.html'||page===''){const out={};
  const shot=async n=>{window.__shotReq=n;for(let i=0;i<60&&window.__shotDone!==n;i++)await wait(200)};
  try{localStorage.removeItem('rayo_ops_proto');localStorage.removeItem('rayo_kds_user')}catch(e){}
  window.__opsShot=shot;
  for(const p of ['pos.html','waiter.html','kds.html','staffdemo.html']){
    const f=document.createElement('iframe');f.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;border:0;z-index:99999;background:#fff';
    f.src=p;document.body.appendChild(f);window.__opsRes=null;
    for(let i=0;i<150&&!window.__opsRes;i++)await wait(200);out[p]=window.__opsRes||'timeout';f.remove()}
  out.errs=__errs;const pre=document.createElement('pre');pre.id='qa-result';pre.textContent=JSON.stringify(out,null,1);document.body.appendChild(pre);return}

/* ---------- inside an app ---------- */
window.print=()=>{window.__printed=(window.__printed||0)+1};window.confirm=()=>true;
const out={},S=()=>O.S(),shot=n=>parent.__opsShot?parent.__opsShot(n):0;
const click=async(sel,ms=250)=>{const x=typeof sel==='string'?$(sel):sel;if(!x)return false;x.click();await wait(ms);return true};
const okModal=async()=>click('#opModal.open [data-ok]');
const pick0=()=>[...S().orders,...S().closed].length+$$('#main tr.og-row').length;
try{await wait(800);
 if(page==='pos.html'){
  out.flags={follow:!!$('.follow-bar'),long:$$('.tcard.long').length,late:$$('.tcard .badge-danger').length,idle:$$('.tcard .badge-info').length};
  await shot('ops-pos-tables');
  for(const v of ['orders','customers','requests','shift','audit','prints','settings','tables']){await click(`[data-v="${v}"]`,300);out['view_'+v]=$('#main').innerText.length}
  await click('[data-v="orders"]',300);
  const th=$$('#main table')[0].querySelectorAll('thead th'),tr=$$('#main table')[0].querySelector('tbody tr');
  out.ordersAlign={th:th.length,td:tr.cells.length,mismatch:[...th].map((h,j)=>h.classList.contains('num')!==tr.cells[j].classList.contains('num')?j:null).filter(x=>x!=null)};
  out.ordersRows=$$('#main table')[0].tBodies[0].rows.length;
  for(const k of ['counter','delivery','staff']){await click(`[data-oty="${k}"]`,200);out['rows_'+k]=$$('#main table')[0].tBodies[0].rows.length}
  out.courierCard=!!$$('#main h3').find(h=>/پیک‌های امروز/.test(h.innerText));
  await click('[data-oty="all"]',200);await shot('ops-pos-orders');
  /* sort by a header (amount asc, then desc) and group-by */
  const amounts=()=>$$('#main table')[0].querySelectorAll('tbody tr:not(.og-row)').length&&[...$$('#main table')[0].querySelectorAll('tbody tr:not(.og-row)')].map(r=>O.int(r.cells[5].innerText));
  const sorted=(a,d)=>a.every((v,j)=>!j||(d>0?a[j-1]<=v:a[j-1]>=v));
  await click('[data-osort="amount"]',250);const a1=amounts();await click('[data-osort="amount"]',250);const a2=amounts();
  await click('[data-osort="cust"]',250);const names=[...$$('#main table')[0].tBodies[0].rows].map(r=>r.cells[3].innerText.split('\n')[0]);
  out.sort={amountDesc:sorted(a1,-1),amountAsc:sorted(a2,1),custAsc:names.filter(n=>n!=='—').every((n,j,A)=>!j||A[j-1].localeCompare(n,'fa')<=0),arrow:!!$('th.sorted svg,th.sorted [data-lucide]')};
  await click('[data-ogrp="type"]',250);const gr=$$('#main tr.og-row');out.group={rows:gr.length,first:gr[0]&&gr[0].innerText.replace(/\s+/g,' ').trim()};
  await click(gr[0],250);out.group.collapsed=$$('#main tr.og-row').length===gr.length&&$$('#main table')[0].tBodies[0].rows.length<pick0();
  await click('[data-ogrp="status"]',250);out.group.byStatus=$$('#main tr.og-row').map(r=>r.innerText.replace(/\s+/g,' ').trim().slice(0,40));await shot('ops-pos-group');
  await click('[data-ogrp=""]',250);await click('[data-osort="time"]',200);
  /* + on a sent line adds a new item of the same dish */
  const o=S().orders.find(x=>x.table==='t5');await click(`[data-o="${o.id}"]`,300);const n0=o.items.length;
  await click('#order [data-more]',300);out.plusSent=O.order(o.id).items.length===n0+1;await click('#order [data-dec]',200);
  /* bill printing before payment */
  const p0=S().prints.length;await click('#order [data-act="bill"]',400);out.billPrinted=S().prints.length===p0+1&&!!S().prints[0].html&&window.__printed>0;
  out.billHasVenue=/رایو کافه/.test(S().prints[0].html);await click('#opModal.open [data-close]',200);
  /* menu: kitchen queue label */
  await click('#order [data-act="add"]',300);out.queueTiles=$$('.mtile.busy .qwait').map(x=>x.innerText.trim()).slice(0,3);await click('[data-back]',200);
  /* customer lookup & club */
  const tk=S().orders.find(x=>x.type==='take');await click(`[data-o="${tk.id}"]`,300);await click('#order [data-act="club"]',300);out.clubDiscount=O.order(tk.id).discount&&O.order(tk.id).discount.reason;
  /* settle with club credit */
  const due=O.due(O.order(tk.id)),cr=O.cust(tk.customer).credit;
  const r1=O.pay(O.order(tk.id),[{method:'club',amount:cr},{method:'card',amount:due-cr}],'s1');out.payClub={ok:r1.ok,closed:r1.closed,creditLeft:O.cust(tk.customer).credit};
  /* fix after settlement: reopen → void one item → refund */
  await click('[data-v="orders"]',300);const paid=S().closed.find(x=>x.status==='paid'&&x.type==='take');
  await click(`[data-ofix="${paid.id}"]`,300);const m=$('#opModal.open');m.querySelector('input[name="r"]').checked=true;const pin=m.querySelector('[name=pin]');if(pin)pin.value='1234';await okModal();
  const ro=O.order(paid.id);out.reopened=!!(ro&&ro.reopened);
  if(ro){O.voidItem(ro,O.live(ro)[0].uid,1,'اشتباه ثبت','s1');O.save();await wait(300);out.refundDue=O.due(ro);await shot('ops-pos-fix');
    await click('#order [data-act="pay"]',300);await okModal();out.refundClosed=!O.order(paid.id)&&S().closed.includes(ro)&&ro.payments.some(p=>p.refund)}
  out.auditFix=$$('#main').length&&(await click('[data-v="audit"]',300),/اصلاح بعد از تسویه/.test($('#main').innerText));
  /* customers tab, staff order */
  await click('[data-v="customers"]',300);out.custRows=$$('#main tbody tr').length;await click('[data-cty="debt"]',200);out.debtRows=$$('#main tbody tr').length;
  await click('[data-cv="c3"]',300);out.custView=/دفتر بدهی/.test($('#opModal').innerText);await shot('ops-pos-customer');await click('#opModal.open [data-close]',200);
  await click('[data-new="staff"]',300);await okModal();const so=S().orders.find(x=>x.type==='staff');out.staffOrder=!!so&&so.priceList==='staff';
  await click('[data-v="settings"]',300);out.billPreview=!!$('#billPrev .ticket');await shot('ops-pos-settings');
 }
 if(page==='waiter.html'){
  const w=$('#wWho');w.value='s6';w.dispatchEvent(new Event('change'));await wait(200);for(let i=0;i<4;i++)await click('[data-k="1"]',80);await wait(300);
  out.longCards=$$('.wt.long').length;out.flagged=$$('.wt .badge-danger,.wt .badge-info').length;await shot('ops-waiter-tables');
  await click('[data-tab="alerts"]',300);out.followCards=$$('.alert-card').length;out.alertText=$('.w-body').innerText.slice(0,200);await shot('ops-waiter-alerts');
  await click('[data-tab="tables"]',300);await click('[data-t="t21"]',300);
  out.actions=$$('[data-sh]').map(b=>b.dataset.sh);await click('[data-again]',200);out.cartAfterPlus=$('[data-menu]')?.innerText.trim();
  await click('[data-menu]',300);out.waiterQueue=$$('.wm .qwait').map(x=>x.innerText.trim()).slice(0,2);await shot('ops-waiter-menu');await click('[data-back]',200);
  const tbl=S().orders.find(x=>x.table==='t7');await click('[data-back]',200);await click('[data-t="t7"]',300);
  await click('[data-sh="print"]',400);out.waiterBill=!!$('.sheet .ticket');await shot('ops-waiter-bill');await click('.sheet [data-ok]',300);
  await click('.sheet [data-ok]',400);out.waiterSettled=!O.order(tbl.id);
 }
 if(page==='kds.html'){
  const w=$('#kWho');w.value='s3';w.dispatchEvent(new Event('change'));await wait(300);
  out.chef=!!$('.kt-ord');const ks=$$('.kt-ord button[data-mv="up"]:not([disabled])');if(ks[0]){const k=ks[0].dataset.tk,before=$$('.kt').findIndex(c=>c.querySelector(`[data-tk="${k}"]`));ks[0].click();await wait(300);
    const after=$$('.kt').findIndex(c=>c.querySelector(`[data-tk="${k}"]`));out.reordered={before,after,ok:after===before-1}}
  out.queueChips=$$('.k-sum button').map(b=>b.innerText.trim()).slice(0,4);
  await click('.k-sum button',300);await click('#opModal.open [data-amin="20"]',300);out.delays=Object.values(S().delays||{}).map(d=>d.min);
  out.recallHint=/آماده‌شده‌های اخیر/.test($('#main').innerText)||'no recent ready';await shot('ops-kds');
 }
 if(page==='staffdemo.html'){
  await click('[data-who="s3"]',300);out.firstTab=$('.w-nav .active')?.innerText.trim();out.navTabs=$$('.w-nav button').map(b=>b.innerText.trim());
  out.noPayslip=!/فیش|حقوق/.test(document.body.innerText);await shot('ops-staff-ops');
  await click('[data-tab="shift"]',300);out.calDays=$$('.sf-day').length;out.today=!!$('.sf-day.today');await shot('ops-staff-shift');
 }
 out.errs=__errs}catch(e){out.err=String(e.stack||e);out.errs=__errs}
parent.__opsRes=out})();
