/* =========================================================
   Rayo kitchen monitor prototype — kds.js
   One ticket per (order, station, round). Tap an item = that item ready (cook out of order: the pizza can go
   before the queued pastas); «آماده شد» = whole ticket. Timer color: green → amber at the station target
   (cashier settings) → red at 1.6× target. Voids show crossed out.
   Head chef (signed in as سرآشپز) can reorder tickets. The queue strip shows how many of each dish are waiting;
   tapping a dish announces its wait time to the waiter and cashier («اعلام به سالن»).
   Ready tickets go to the «آماده‌شده‌ها» strip, where a mistaken «آماده شد» can be undone.
   ========================================================= */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const S=()=>O.S(),fa=O.fa,ic=O.ic;
let st=(()=>{try{return localStorage.getItem('rayo_kds_station')||'kitchen'}catch(e){return'kitchen'}})();
let who=(()=>{try{return localStorage.getItem('rayo_kds_user')||''}catch(e){return''}})();
const seen=new Set();let first=true;
const COOKS=()=>((window.D&&D.STAFF)||[]).filter(s=>s.section==='آشپزخانه'||s.section==='بار');
const isChef=()=>{const s=COOKS().find(x=>x.id===who);return!!s&&/سرآشپز|ارشد/.test(s.role)};

function tickets(){
  const T={};
  S().orders.forEach(o=>o.items.forEach(i=>{if(!i.sentAt||i.round===99||(st!=='all'&&i.station!==st))return;
    const k=o.id+'|'+i.station+'|'+(i.round||1);(T[k]=T[k]||{k,o,station:i.station,round:i.round||1,sentAt:i.sentAt,items:[]}).items.push(i)}));
  return Object.values(T).map(x=>({...x,active:x.items.some(i=>i.status==='sent'),doneAt:Math.max(...x.items.map(i=>i.readyAt||0))}));
}
/* queue order: tickets the head chef placed come first in his order; the rest follow by time sent */
const rank=x=>{const p=(S().kdsPri||{})[x.k];return p!=null?[0,p]:[1,x.sentAt]};
const sortAct=L=>L.sort((a,b)=>{const ra=rank(a),rb=rank(b);return ra[0]-rb[0]||ra[1]-rb[1]});
function move(k,how){const L=sortAct(tickets().filter(x=>x.active)),j=L.findIndex(x=>x.k===k);if(j<0)return;const [x]=L.splice(j,1);
  L.splice(how==='top'?0:how==='up'?Math.max(0,j-1):Math.min(L.length,j+1),0,x);S().kdsPri={};L.forEach((t,n)=>S().kdsPri[t.k]=n);
  O.log(x.o,`ترتیب آشپزخانه: ${how==='top'?'اول صف':how==='up'?'یکی بالاتر':'یکی پایین‌تر'}`,who||'kds');O.save()}

function top(){
  const L=tickets().filter(x=>x.active),opts=[...S().stations.filter(s=>!s.bill).map(s=>[s.id,s.name+(s.kds?'':' (فقط چاپگر)')]),['all','همه']];
  const me=COOKS().find(x=>x.id===who);
  $('#top').innerHTML=`<div class="ops-brand"><span class="brand-mark">ر</span><div>مانیتور ${st==='all'?'همهٔ ایستگاه‌ها':O.st(st).name}<small>نمونهٔ استاتیک · هم‌زمان با صندوق و سفارش‌گیر</small></div></div>
    <div class="segmented">${opts.map(([k,l])=>`<button class="${st===k?'active':''}" data-st="${k}">${l}</button>`).join('')}</div><div class="grow"></div>
    <label class="k-who">${ic('user')}<select id="kWho" aria-label="کاربر"><option value="">ورود: —</option>${COOKS().map(s=>`<option value="${s.id}" ${who===s.id?'selected':''}>${s.name} — ${s.role}</option>`).join('')}</select></label>
    ${isChef()?`<span class="badge badge-warning" title="سرآشپز می‌تواند ترتیب برگه‌ها را عوض کند">${ic('chef-hat')}سرآشپز</span>`:me?'':''}
    <span class="badge badge-warning" style="font-size:13px;height:28px">${fa(L.length)} برگه در صف</span>
    <span class="ops-clock" id="clk">${O.clock(Date.now())}</span>`;
}
function draw(){
  top();const all=tickets(),act=sortAct(all.filter(x=>x.active)),done=all.filter(x=>!x.active&&x.items.some(i=>i.status==='ready')).sort((a,b)=>b.doneAt-a.doneAt).slice(0,8);
  const Q=O.queue(),qs=Object.values(Q).filter(x=>st==='all'||x.station===st).sort((a,b)=>b.qty-a.qty),chef=isChef();
  const card=(x,n)=>{const m=O.min(x.sentAt),tg=O.target(x.station),cls=m>=tg*1.6?'late':m>=tg?'warn':'';const fresh=!first&&!seen.has(x.k);seen.add(x.k);
    const c=x.o.customer&&O.cust(x.o.customer);
    return`<div class="kt ${cls} ${fresh?'fresh':''}"><div class="kt-h"><div><b>${O.label(x.o)}</b><small>${O.TYPES[x.o.type][0]} · ${O.staff(x.o.waiter).name} · نوبت ${fa(x.round)}${st==='all'?' · '+O.st(x.station).name:''}</small></div>
      <div style="text-align:center"><span class="timer">${fa(String(m).padStart(2,'0'))}′</span><small>${O.clock(x.sentAt)}</small></div></div>
      ${chef?`<div class="kt-ord"><span>#${fa(n+1)} در صف</span><button data-mv="top" data-tk="${x.k}" title="اول صف" ${n?'':'disabled'}>${ic('chevrons-up')}</button><button data-mv="up" data-tk="${x.k}" title="بالاتر" ${n?'':'disabled'}>${ic('chevron-up')}</button><button data-mv="down" data-tk="${x.k}" title="پایین‌تر" ${n<act.length-1?'':'disabled'}>${ic('chevron-down')}</button></div>`:''}
      ${c&&c.note&&c.tags.includes('حساسیت')?`<div class="kt-l" style="background:#3d3216;cursor:default">${ic('alert-triangle')}<span style="color:#f2b84b;font-weight:700">${O.esc(c.note)}</span></div>`:''}
      ${x.items.map(i=>`<div class="kt-l ${i.status==='void'?'void':i.status!=='sent'?'done':''}" ${i.status==='sent'||i.status==='ready'?`data-i="${x.o.id}:${i.uid}"`:''}><span class="q">${fa(i.qty)}</span><div><b>${i.name}</b>${i.mods&&i.mods.length?`<span class="nt" style="color:#8ec5ff">+ ${O.modTxt(i)}</span>`:''}${i.note?`<span class="nt">» ${O.esc(i.note)}</span>`:''}${i.fired?'<span class="nt" style="color:#ff9f6b">🔥 اجرای نگه‌داشته</span>':''}${i.status==='void'?`<span class="nt" style="color:#ff8a78">ابطال — ${O.esc(i.voidReason)}</span>`:''}</div></div>`).join('')}
      <div class="kt-f"><button class="btn btn-primary" data-bump="${x.k}" style="background:#2f7d57;border-color:#2f7d57">${ic('check-check')}آماده شد</button></div></div>`};
  $('#main').innerHTML=`${qs.length?`<div class="k-sum"><span class="k-lbl">${ic('layers')}صف هر غذا (برای اعلام زمان به سالن بزنید):</span>${qs.map(q=>{const w=O.wait(q.mid,Q),d=w.delay;return`<button data-dl="${q.mid}" class="${w.busy?'busy':''}" title="${q.tables.join('، ')}"><b>${fa(q.qty)}</b> ${q.name}${w.busy?` <small>~${fa(w.est)}′</small>`:''}${d?` <small class="ann">${ic('megaphone')}اعلام‌شده</small>`:''}</button>`}).join('')}</div>`:''}
    ${act.length?`<div class="k-grid">${act.map(card).join('')}</div>`:`<div class="k-empty">${ic('chef-hat')}<p>صف خالی است</p></div>`}
    ${done.length?`<div class="k-done"><span class="k-lbl">${ic('undo-2')}آماده‌شده‌های اخیر — اگر «آماده شد» را اشتباهی زده‌اید، روی برگه بزنید تا به صف برگردد:</span>${done.map(x=>`<button data-recall="${x.k}">${O.label(x.o)} · ${O.st(x.station).name} · ${O.clock(x.doneAt)}</button>`).join('')}</div>`:''}
    <p class="k-hint">${ic('info')} هر سطر را جدا لمس کنید تا همان آیتم آماده شود؛ لازم نیست منتظر بمانید تا صف یک غذا خالی شود (مثلاً پیتزای یک میز پیش از پاستاهای قبلی).${chef?'':' تغییر ترتیب برگه‌ها فقط با ورود سرآشپز.'}</p>`;
  first=false;RT.icons();
  const w=$('#kWho');w&&(w.onchange=()=>{who=w.value;try{localStorage.setItem('rayo_kds_user',who)}catch(e){}draw()});
}
/* cook announces a wait for one dish → waiter and cashier see it on that menu item for 60 minutes */
function announce(mid){const m=O.mi(mid),w=O.wait(mid),d=O.delay(mid);
  O.modal({title:'اعلام زمان به سالن — '+m.name,body:`<p style="margin:0">${fa(w.qty)} عدد در صف · تخمین برای سفارش تازه: حدود ${fa(w.est)} دقیقه</p>
    <div class="chips">${[10,15,20,30,45,60].map(n=>`<button class="chip ${d&&d.min===n?'active':''}" data-amin="${n}">${fa(n)} دقیقه</button>`).join('')}</div>
    <small class="muted">ویتر و صندوق این زمان را کنار همین آیتم در منو می‌بینند و پیش از ثبت به مشتری می‌گویند. بعد از ۶۰ دقیقه خودکار پاک می‌شود.</small>`,
    foot:`<button class="btn btn-ghost" data-close>بستن</button>${d?'<button class="btn btn-secondary" data-amin="0">پاک کردن اعلام</button>':''}`,
    onMount:mm=>$$('[data-amin]',mm).forEach(b=>b.onclick=()=>{const n=+b.dataset.amin;S().delays=S().delays||{};if(n)S().delays[mid]={min:n,at:Date.now(),by:who||'kds'};else delete S().delays[mid];O.close();O.save();O.toast(n?m.name+': '+fa(n)+' دقیقه به سالن اعلام شد':'اعلام پاک شد','megaphone')})})}
document.addEventListener('click',e=>{const g=k=>e.target.closest('['+k+']');let x;
  if((x=g('data-st'))){st=x.dataset.st;try{localStorage.setItem('rayo_kds_station',st)}catch(e){}draw();return}
  if((x=g('data-mv'))){if(!isChef())return;move(x.dataset.tk,x.dataset.mv);return}
  if((x=g('data-dl'))){announce(x.dataset.dl);return}
  if((x=g('data-i'))){const[oid,uid]=x.dataset.i.split(':'),i=O.order(oid).items.find(z=>z.uid===uid);i.status=i.status==='sent'?'ready':'sent';i.readyAt=i.status==='ready'?Date.now():null;O.save();return}
  if((x=g('data-bump'))){const tk=tickets().find(t=>t.k===x.dataset.bump);tk.items.forEach(i=>{if(i.status==='sent'){i.status='ready';i.readyAt=Date.now()}});if(S().kdsPri)delete S().kdsPri[tk.k];O.log(tk.o,`${O.st(tk.station).name}: نوبت ${fa(tk.round)} آماده شد`,'kds');O.save();O.toast(O.label(tk.o)+' آماده شد — به ویتر اطلاع داده شد','bell-ring');return}
  if((x=g('data-recall'))){const tk=tickets().find(t=>t.k===x.dataset.recall);tk.items.forEach(i=>{if(i.status==='ready'){i.status='sent';i.readyAt=null}});O.save();O.toast('به صف برگشت','undo-2');return}
});
O.on(draw);
setInterval(draw,15000);
draw();
})();
