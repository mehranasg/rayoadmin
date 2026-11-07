/* =========================================================
   Rayo kitchen monitor prototype — kds.js
   One ticket per (order, station, round). Tap an item = ready; «آماده شد» = whole ticket.
   Timer color: green → amber at the station target → red at 1.6× target.
   Voids show crossed out. Ready tickets go to the recall strip; the waiter app is alerted.
   ========================================================= */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const S=()=>O.S(),fa=O.fa,ic=O.ic;
const TARGET={kitchen:15,bar:5,cold:6};          // minutes; in the real system: station setting
let st=(()=>{try{return localStorage.getItem('rayo_kds_station')||'kitchen'}catch(e){return'kitchen'}})();
const seen=new Set();let first=true;

function tickets(){
  const T={};
  S().orders.forEach(o=>o.items.forEach(i=>{if(!i.sentAt||(st!=='all'&&i.station!==st))return;
    const k=o.id+'|'+i.station+'|'+(i.round||1);(T[k]=T[k]||{k,o,station:i.station,round:i.round||1,sentAt:i.sentAt,items:[]}).items.push(i)}));
  return Object.values(T).map(x=>({...x,active:x.items.some(i=>i.status==='sent'),doneAt:Math.max(...x.items.map(i=>i.readyAt||0))}));
}
function top(){
  const L=tickets().filter(x=>x.active),opts=[...S().stations.filter(s=>!s.bill).map(s=>[s.id,s.name+(s.kds?'':' (فقط چاپگر)')]),['all','همه']];
  $('#top').innerHTML=`<div class="ops-brand"><span class="brand-mark">ر</span><div>مانیتور ${st==='all'?'همهٔ ایستگاه‌ها':O.st(st).name}<small>نمونهٔ استاتیک · هم‌زمان با صندوق و سفارش‌گیر</small></div></div>
    <div class="segmented">${opts.map(([k,l])=>`<button class="${st===k?'active':''}" data-st="${k}">${l}</button>`).join('')}</div><div class="grow"></div>
    <span class="badge badge-warning" style="font-size:13px;height:28px">${fa(L.length)} برگه در صف</span>
    <span class="ops-clock" id="clk">${O.clock(Date.now())}</span>`;
}
function draw(){
  top();const all=tickets(),act=all.filter(x=>x.active).sort((a,b)=>a.sentAt-b.sentAt),done=all.filter(x=>!x.active&&x.items.some(i=>i.status==='ready')).sort((a,b)=>b.doneAt-a.doneAt).slice(0,8);
  const sum={};act.forEach(x=>x.items.filter(i=>i.status==='sent').forEach(i=>sum[i.name]=(sum[i.name]||0)+i.qty));
  const card=x=>{const m=O.min(x.sentAt),tg=TARGET[x.station]||10,cls=m>=tg*1.6?'late':m>=tg?'warn':'';const fresh=!first&&!seen.has(x.k);seen.add(x.k);
    const c=x.o.customer&&O.cust(x.o.customer);
    return`<div class="kt ${cls} ${fresh?'fresh':''}"><div class="kt-h"><div><b>${O.label(x.o)}</b><small>${O.TYPES[x.o.type][0]} · ${O.staff(x.o.waiter).name} · نوبت ${fa(x.round)}${st==='all'?' · '+O.st(x.station).name:''}</small></div>
      <div style="text-align:center"><span class="timer">${fa(String(m).padStart(2,'0'))}′</span><small>${O.clock(x.sentAt)}</small></div></div>
      ${c&&c.note&&c.tags.includes('حساسیت')?`<div class="kt-l" style="background:#3d3216;cursor:default">${ic('alert-triangle')}<span style="color:#f2b84b;font-weight:700">${O.esc(c.note)}</span></div>`:''}
      ${x.items.map(i=>`<div class="kt-l ${i.status==='void'?'void':i.status!=='sent'?'done':''}" ${i.status==='sent'||i.status==='ready'?`data-i="${x.o.id}:${i.uid}"`:''}><span class="q">${fa(i.qty)}</span><div><b>${i.name}</b>${i.mods&&i.mods.length?`<span class="nt" style="color:#8ec5ff">+ ${O.modTxt(i)}</span>`:''}${i.note?`<span class="nt">» ${O.esc(i.note)}</span>`:''}${i.fired?'<span class="nt" style="color:#ff9f6b">🔥 اجرای نگه‌داشته</span>':''}${i.status==='void'?`<span class="nt" style="color:#ff8a78">ابطال — ${O.esc(i.voidReason)}</span>`:''}</div></div>`).join('')}
      <div class="kt-f"><button class="btn btn-primary" data-bump="${x.k}" style="background:#2f7d57;border-color:#2f7d57">${ic('check-check')}آماده شد</button></div></div>`};
  $('#main').innerHTML=`${done.length?`<div class="k-done"><span style="color:#948e84;font-size:12.5px;align-self:center">آماده‌شده‌ها (بازگرداندن):</span>${done.map(x=>`<button data-recall="${x.k}">${ic('undo-2')} ${O.label(x.o)} · ${O.clock(x.doneAt)}</button>`).join('')}</div>`:''}
    ${Object.keys(sum).length?`<div class="k-sum">${Object.entries(sum).sort((a,b)=>b[1]-a[1]).map(([n,q])=>`<span><b>${fa(q)}</b> ${n}</span>`).join('')}</div>`:''}
    ${act.length?`<div class="k-grid">${act.map(card).join('')}</div>`:`<div class="k-empty">${ic('chef-hat')}<p>صف خالی است</p></div>`}`;
  first=false;RT.icons();
}
document.addEventListener('click',e=>{const g=k=>e.target.closest('['+k+']');let x;
  if((x=g('data-st'))){st=x.dataset.st;try{localStorage.setItem('rayo_kds_station',st)}catch(e){}draw();return}
  if((x=g('data-i'))){const[oid,uid]=x.dataset.i.split(':'),i=O.order(oid).items.find(z=>z.uid===uid);i.status=i.status==='sent'?'ready':'sent';i.readyAt=i.status==='ready'?Date.now():null;O.save();return}
  if((x=g('data-bump'))){const tk=tickets().find(t=>t.k===x.dataset.bump);tk.items.forEach(i=>{if(i.status==='sent'){i.status='ready';i.readyAt=Date.now()}});O.log(tk.o,`${O.st(tk.station).name}: نوبت ${fa(tk.round)} آماده شد`,'kds');O.save();O.toast(O.label(tk.o)+' آماده شد — به ویتر اطلاع داده شد','bell-ring');return}
  if((x=g('data-recall'))){const tk=tickets().find(t=>t.k===x.dataset.recall);tk.items.forEach(i=>{if(i.status==='ready'){i.status='sent';i.readyAt=null}});O.save();return}
});
O.on(draw);
setInterval(draw,15000);
draw();
})();
