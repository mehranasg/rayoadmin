/* =========================================================
   Rayo waiter app prototype — waiter.js (phone)
   Sign in · table map with status and time-at-table · open table · customer lookup ·
   menu with notes → cart → send to stations · "ready" alerts → served ·
   void request (needs cashier) · print bill · settle · discount (per waiter permission) · move table ·
   follow-up alerts (late items, long stays, seated without order) · kitchen queue on the menu.
   ========================================================= */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const S=()=>O.S(),fa=O.fa,ic=O.ic,t=O.t;
let me=null;try{me=sessionStorage.getItem('rayo_waiter')}catch(e){}
const W={tab:'tables',scr:null,oid:null,area:'all',mine:false,cat:null,q:'',cart:[],pick:null,pin:''};
const app=()=>$('#app');

/* ---------- helpers ---------- */
const myOrders=()=>S().orders.filter(o=>o.table&&o.waiter===me);
const readyItems=()=>myOrders().flatMap(o=>O.live(o).filter(i=>i.status==='ready').map(i=>({o,i})));
const cartN=()=>W.cart.reduce((a,c)=>a+c.qty,0);
const can=k=>!!((S().settings.waiterPerms||{})[me]||{})[k];
/* my tables that need a visit: food late, sitting long, or seated without an order */
const follow=()=>myOrders().map(o=>({o,late:O.late(o),long:O.longStay(o),idle:O.noOrderLong(o)})).filter(x=>x.late.length||x.long||x.idle);
const nav=()=>{const r=readyItems().length+follow().length;return`<nav class="w-nav">
  ${[['tables','میزها','layout-grid'],['mine','میزهای من','user'],['alerts','اعلان‌ها','bell']].map(([k,l,i])=>`<button class="${W.tab===k&&!W.scr?'active':''}" data-tab="${k}">${ic(i)}${l}${k==='alerts'&&r?`<span class="count">${fa(r)}</span>`:''}</button>`).join('')}</nav>`};
const topbar=(title,sub,back,right='')=>`<header class="w-top">${back?`<button class="icon-btn" data-back>${ic('arrow-right')}</button>`:`<span class="brand-mark" style="width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--accent);color:#fff;font-weight:800">ر</span>`}
  <div class="grow"><h1>${title}</h1><small>${sub||''}</small></div>${right}</header>`;

/* ---------- sign in ---------- */
function login(){
  return`<div class="login"><div style="text-align:center"><span class="brand-mark" style="width:56px;height:56px;border-radius:16px;display:inline-grid;place-items:center;background:var(--accent);color:#fff;font-weight:800;font-size:24px">ر</span>
    <h2 style="margin:10px 0 2px">سفارش‌گیر رایو</h2><small class="muted">ورود ویتر · نمونهٔ استاتیک</small></div>
    <label class="who-pick"><b>کاربر</b><select id="wWho" aria-label="انتخاب کاربر"><option value="">— انتخاب کنید —</option>${O.WAITERS.map(id=>{const s=O.staff(id);return`<option value="${id}" ${W.pick===id?'selected':''}>${s.name} — ${s.role}</option>`}).join('')}</select></label>
    ${W.pick?`<div class="pin-dots">${[0,1,2,3].map(i=>`<i class="${W.pin.length>i?'on':''}"></i>`).join('')}</div>
    <div class="pin">${[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map(k=>k===''?'<span></span>':`<button data-k="${k}">${typeof k==='number'?fa(k):k}</button>`).join('')}</div>
    <small class="muted" style="text-align:center">رمز چهاررقمی (در نمونه هر رمزی پذیرفته می‌شود)</small>`:''}</div>`;
}

/* ---------- tables ---------- */
function tables(mineOnly){
  const T=O.TABLES.filter(x=>(W.area==='all'||x.area===W.area)&&(!mineOnly||O.atTable(x.id)?.waiter===me));
  const card=x=>{const s=O.tstate(x),o=O.atTable(x.id),rd=o&&O.live(o).some(i=>i.status==='ready'),lt=o&&O.late(o).length,lg=o&&O.longStay(o),idle=o&&O.noOrderLong(o);
    return`<button class="wt st-${s} ${lg?'long':''}" data-t="${x.id}">${rd?`<span class="ready badge badge-success">${ic('bell-ring')}</span>`:lt?`<span class="ready badge badge-danger" title="پیگیری آشپزخانه">${ic('alarm-clock')}</span>`:idle?`<span class="ready badge badge-info" title="بدون سفارش">${ic('hand')}</span>`:o&&o.waiter===me?'<span class="mine"></span>':''}
      <span class="tno">${fa(x.no)}</span>
      <small>${o?`${fa(o.guests)} نفر · <span class="timer">${O.dur(o.openedAt)}</span>`:S().reserved[x.id]?'رزرو '+S().reserved[x.id].at:fa(x.seats)+' نفره'}</small>
      <small style="font-weight:600;color:var(--st)">${lg?'بیش از '+fa(O.set().longStayMin)+' دقیقه':O.TSTATE[s][0].split(' — ')[0]}</small></button>`};
  const cnt=O.TABLES.filter(x=>O.tstate(x)==='free').length;
  return topbar(mineOnly?'میزهای من':'میزها',`${O.staff(me).name} · ${fa(cnt)} میز آزاد`,false,`<button class="icon-btn" data-tab="alerts">${ic('bell')}${readyItems().length?`<span class="count">${fa(readyItems().length)}</span>`:''}</button><button class="icon-btn" data-out title="خروج">${ic('log-out')}</button>`)+
  `<div class="w-body"><div class="cat-strip">${[['all','همه'],...O.AREAS.map(a=>[a.id,a.name])].map(([k,l])=>`<button class="chip ${W.area===k?'active':''}" data-area="${k}">${l}</button>`).join('')}</div>
    ${O.AREAS.filter(a=>W.area==='all'||a.id===W.area).map(a=>{const L=T.filter(x=>x.area===a.id);return L.length?`<div class="w-sec"><span>${a.name}</span></div><div class="w-grid">${L.map(card).join('')}</div>`:''}).join('')||`<p class="muted" style="text-align:center;margin-top:40px">میزی ندارید</p>`}
    <div class="w-sec"><span>راهنما</span></div><div class="chips" style="font-size:11.5px">${Object.entries(O.TSTATE).map(([k,[l]])=>`<span class="row st-${k}" style="gap:4px"><i class="dot"></i>${l}</span>`).join('')}</div>
  </div>`+nav();
}

/* ---------- table detail ---------- */
function detail(){
  const o=O.order(W.oid);if(!o){W.scr=null;return tables()}
  const x=O.table(o.table),c=o.customer&&O.cust(o.customer),L=o.items.filter(i=>i.status!=='new');
  const rounds=[...new Set(L.map(i=>i.round||1))].sort();
  const pst={sent:['آماده‌سازی','warning'],ready:['آماده سرو','success'],served:['سرو شد','neutral'],void:['ابطال','danger']};
  const pend=S().requests.filter(r=>r.order===o.id&&r.status==='pending').map(r=>r.item);
  return topbar('میز '+fa(x.no),`${fa(o.guests)} نفر · ${O.staff(o.waiter).name}`,true,`<div style="text-align:center"><b class="timer" style="font-size:16px">${O.dur(o.openedAt)}</b><small>حضور</small></div>`)+
  `<div class="w-body">
    <button class="w-card" data-sh="cust" style="width:100%;text-align:start;font:inherit;color:inherit;cursor:pointer;display:flex;gap:10px;align-items:center">
      <span class="thumb kpi-icon" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent)">${ic(c?'user-check':'user-plus')}</span>
      <div class="grow">${c?`<b>${c.name}</b><small class="muted" style="display:block">${fa(c.visits)} بار آمده · آخرین ${fa(c.last)}${c.pct?' · '+fa(c.pct)+'٪ باشگاه':''}${c.credit?' · اعتبار '+t(c.credit):''}</small>${c.note?`<small style="display:block;color:var(--warning);font-weight:600">${ic('alert-triangle','')} ${O.esc(c.note)}</small>`:''}`:'<b>افزودن مشتری</b><small class="muted" style="display:block">با شماره تلفن؛ سابقه و حساسیت‌ها را می‌بینید</small>'}</div>${ic('chevron-left')}</button>
    ${o.status==='bill'?`<div class="alert alert-warning mt" style="margin-top:10px">${ic('receipt')}<div>صورتحساب درخواست شده — ${t(O.due(o))} تومان</div></div>`:''}
    ${rounds.map(r=>{const items=L.filter(i=>(i.round||1)===r),sent=items.find(i=>i.sentAt)?.sentAt,wait=items.some(i=>O.late(o).includes(i));
      return`<div class="w-sec"><span>نوبت ${fa(r)}</span><span class="timer" style="${wait?'color:var(--danger)':''}">${sent?O.clock(sent)+' · '+O.dur(sent)+' پیش':''}</span></div><div class="w-card">
      ${items.map(i=>`<div class="w-line ${i.status==='void'?'void':''}" ${i.status!=='void'?`data-it="${i.uid}"`:''}><b>${fa(i.qty)}×</b><div><b>${i.name}</b>${i.mods&&i.mods.length?`<small style="color:var(--info)">+ ${O.modTxt(i)}</small>`:''}${i.note?`<small class="nt">» ${O.esc(i.note)}</small>`:''}${pend.includes(i.uid)?'<small style="color:var(--danger)">درخواست ابطال در انتظار صندوق</small>':''}</div><span class="row" style="gap:4px">${O.b(pst[i.status][0],pst[i.status][1])}${i.status!=='void'?`<button type="button" class="btn btn-ghost btn-sm btn-icon" data-again="${i.uid}" title="یکی دیگر از همین">${ic('plus')}</button>`:''}</span></div>`).join('')}</div>`}).join('')}
    ${o.items.some(i=>i.status==='new'&&i.hold)?`<div class="w-sec"><span>نگه‌داشته تا اعلام</span><button class="btn btn-primary btn-sm" data-fire>${ic('flame')}اجرا</button></div><div class="w-card">${o.items.filter(i=>i.status==='new'&&i.hold).map(i=>`<div class="w-line"><b>${fa(i.qty)}×</b><div><b>${i.name}</b>${i.note?`<small class="nt">» ${O.esc(i.note)}</small>`:''}</div>${O.b('نگه‌داشته','info')}</div>`).join('')}</div>`:''}
    ${!o.items.length?'<p class="muted" style="text-align:center;margin-top:30px">هنوز سفارشی ثبت نشده</p>':''}
    <div class="w-sec"><span>جمع تا این لحظه</span><b>${t(O.total(o))} تومان</b></div>
    <div class="row" style="flex-wrap:wrap;gap:8px;margin-top:8px">
      <button class="btn btn-ghost btn-sm" data-sh="move">${ic('arrow-left-right')}تغییر میز</button>
      <button class="btn btn-ghost btn-sm" data-sh="guests">${ic('users')}نفرات</button>
      ${can('bill')?`<button class="btn btn-ghost btn-sm" data-sh="print">${ic('printer')}چاپ صورتحساب</button>`:`<button class="btn btn-ghost btn-sm" data-sh="bill" ${o.status==='bill'?'disabled':''}>${ic('receipt')}درخواست صورتحساب</button>`}
      ${can('discount')?`<button class="btn btn-ghost btn-sm" data-sh="disc">${ic('percent')}تخفیف</button>`:''}
      ${can('settle')?`<button class="btn btn-secondary btn-sm" data-sh="settle" ${O.due(o)>0?'':'disabled'}>${ic('wallet')}تسویه</button>`:''}</div>
    ${o.discount?`<small class="muted" style="display:block;margin-top:6px">تخفیف: ${O.esc(o.discount.reason)} (−${t(O.disc(o))})</small>`:''}
  </div>
  <div class="w-foot">${O.live(o).some(i=>i.status==='ready')?`<button class="btn btn-secondary" data-served>${ic('check-check')}سرو شد</button>`:''}
    <button class="btn btn-primary" data-menu>${ic('plus')}${W.cart.length?'ادامهٔ سفارش ('+fa(cartN())+')':'افزودن سفارش'}</button></div>`;
}

/* ---------- menu & cart ---------- */
function menu(){
  const o=O.order(W.oid),Q=O.queue(),q=W.q.trim(),list=O.MENU.filter(m=>(!W.cat||m.cat===W.cat)&&(!q||m.name.includes(q)));
  const inCart=mid=>W.cart.filter(c=>c.mid===mid);
  return topbar('سفارش میز '+fa(O.table(o.table).no),'روی نام آیتم بزنید تا توضیح بنویسید',true)+
  `<div class="w-body"><div class="search">${ic('search')}<input class="input" id="wq" placeholder="جستجو…" value="${O.esc(W.q)}"></div>
    <div class="cat-strip" style="margin-top:8px"><button class="chip ${!W.cat?'active':''}" data-cat="">همه</button>${O.CATS.map(c=>`<button class="chip ${W.cat===c?'active':''}" data-cat="${c}">${c}</button>`).join('')}</div>
    <div style="margin-top:8px">${list.map(m=>{const cs=inCart(m.id),n=cs.reduce((a,c)=>a+c.qty,0),notes=cs.map(cTxt).filter(Boolean);
      return`<div class="wm ${O.isOut(m.id)?'out':''}"><div class="nm" ${O.isOut(m.id)?'':`data-nm="${m.id}"`}><b>${m.name}</b><small>${O.isOut(m.id)?'ناموجود':t(O.unit(o,m))+' · '+O.st(m.station).name}</small>${(w=>w.busy&&!O.isOut(m.id)?`<small class="qwait">${ic('hourglass')}${O.waitTxt(w)} — به مشتری بگویید</small>`:'')(O.wait(m.id,Q))}${notes.map(n=>`<small class="nt">» ${O.esc(n)}</small>`).join('')}</div>
        ${O.isOut(m.id)?'':`<div class="stp">${n?`<button data-cm="${m.id}">${ic('minus')}</button><b>${fa(n)}</b>`:''}<button data-cp="${m.id}" style="${n?'':'background:var(--accent);color:#fff;border-color:var(--accent)'}">${ic('plus')}</button></div>`}</div>`}).join('')}</div></div>
  <div class="w-foot"><button class="btn btn-primary" data-review ${W.cart.length?'':'disabled'}>${ic('send')}مرور و ارسال ${W.cart.length?'('+fa(cartN())+' قلم · '+t(W.cart.reduce((a,c)=>a+cPrice(c)*c.qty,0))+')':''}</button></div>`;
}
const addCart=(mid,note='',mods=[],hold=false)=>{const k=JSON.stringify(mods),c=W.cart.find(x=>x.mid===mid&&x.note===note&&JSON.stringify(x.mods)===k&&x.hold===hold);if(c)c.qty++;else W.cart.push({mid,qty:1,note,mods,hold})};
const cPrice=c=>O.unit(O.order(W.oid),O.mi(c.mid))+c.mods.reduce((a,x)=>a+x[1],0);
const cTxt=c=>[c.mods.map(x=>x[0]).join('، '),c.note].filter(Boolean).join(' · ');
const subCart=mid=>{const L=W.cart.filter(x=>x.mid===mid),c=L[L.length-1];if(!c)return;c.qty--;if(!c.qty)W.cart=W.cart.filter(x=>x!==c)};

/* ---------- alerts ---------- */
function alerts(){
  const R=readyItems(),req=S().requests.filter(r=>r.by===me&&r.status!=='pending').slice(0,5),bills=myOrders().filter(o=>o.status==='bill');
  const F=follow();
  return topbar('اعلان‌ها',O.staff(me).name)+`<div class="w-body">
    ${F.length?`<div class="w-sec"><span>سر بزنید</span><span>${fa(F.length)}</span></div>${F.map(({o,late,long,idle})=>`<div class="alert-card" data-t="${o.table}" style="cursor:pointer"><span class="thumb tone-${late.length?'danger':long?'warning':'info'}">${ic(late.length?'alarm-clock':long?'hourglass':'hand')}</span><div><b>میز ${fa(O.table(o.table).no)}</b><small class="muted" style="display:block">${[late.length?'دیر شده: '+late.map(i=>fa(i.qty)+'× '+i.name+' ('+O.dur(i.sentAt)+')').join('، ')+' — از آشپزخانه بپرسید':'',long?O.dur(o.openedAt)+' نشسته‌اند — سر بزنید (صورتحساب؟ سفارش تازه؟)':'',idle?O.dur(o.openedAt)+' نشسته‌اند و هنوز سفارش نداده‌اند':''].filter(Boolean).join(' · ')}</small></div>${ic('chevron-left')}</div>`).join('')}`:''}
    <div class="w-sec"><span>آمادهٔ سرو</span><span>${fa(R.length)}</span></div>
    ${R.map(({o,i})=>`<div class="alert-card"><span class="thumb tone-success">${ic('bell-ring')}</span><div><b>میز ${fa(O.table(o.table).no)} — ${fa(i.qty)}× ${i.name}</b><small class="muted" style="display:block">${O.st(i.station).name} · آماده از ${O.dur(i.readyAt||i.sentAt)} پیش</small></div><button class="btn btn-primary btn-sm" data-srv="${o.id}:${i.uid}">سرو شد</button></div>`).join('')||'<p class="muted">چیزی منتظر سرو نیست</p>'}
    ${bills.length?`<div class="w-sec"><span>صورتحساب خواسته</span></div>${bills.map(o=>`<div class="alert-card"><span class="thumb tone-warning">${ic('receipt')}</span><div><b>میز ${fa(O.table(o.table).no)}</b><small class="muted" style="display:block">منتظر تسویه در صندوق · ${t(O.due(o))}</small></div><span></span></div>`).join('')}`:''}
    ${req.length?`<div class="w-sec"><span>پاسخ صندوق</span></div>${req.map(r=>`<div class="alert-card"><span class="thumb tone-${r.status==='ok'?'success':'danger'}">${ic(r.status==='ok'?'check':'x')}</span><div><b>ابطال ${r.status==='ok'?'تأیید شد':'رد شد'}</b><small class="muted" style="display:block">${O.esc(r.reason)}</small></div><span></span></div>`).join('')}`:''}
  </div>`+nav();
}

/* ---------- bottom sheets ---------- */
function sheet(title,body,foot,onMount){
  const el=document.createElement('div');el.className='sheet-backdrop open';
  el.innerHTML=`<div class="sheet"><div class="sheet-head"><h3>${title}</h3><button class="btn btn-ghost btn-sm btn-icon" data-x>${ic('x')}</button></div><form class="sheet-body" onsubmit="return false">${body}</form>${foot?`<div class="sheet-foot">${foot}</div>`:''}</div>`;
  app().appendChild(el);RT.icons();
  const close=()=>el.remove();el.onclick=e=>{if(e.target===el||e.target.closest('[data-x]'))close()};
  onMount&&onMount(el,close,$('form',el));return close;
}
function openTable(tid){
  const x=O.table(tid),r=S().reserved[tid];let g=r?r.guests:Math.min(2,x.seats);
  sheet('باز کردن میز '+fa(x.no),`${r?O.note(`رزرو: ${r.name} · ${r.at}`,'calendar-clock'):''}
    <div class="between"><b>تعداد نفرات</b><div class="stp"><button type="button" data-g="-1">${ic('minus')}</button><b id="gv">${fa(g)}</b><button type="button" data-g="1">${ic('plus')}</button></div></div>
    <div class="field"><label>تلفن مشتری (اختیاری)</label><input class="input" name="ph" inputmode="tel" placeholder="۰۹۱۲…"></div><div id="cres"></div>`,
    `<button class="btn btn-primary" data-ok>${ic('check')}باز کن و سفارش بگیر</button>`,
    (el,close,f)=>{$$('[data-g]',el).forEach(b=>b.onclick=()=>{g=Math.max(1,g+ +b.dataset.g);$('#gv',el).textContent=fa(g)});
      f.ph.oninput=()=>lookup(f.ph.value,$('#cres',el));
      $('[data-ok]',el).onclick=()=>{const c=findCust(f.ph.value);const o=O.newOrder({table:tid,guests:g,waiter:me,customer:c?c.id:null});O.log(o,'میز باز شد (سفارش‌گیر)',me);
        W.oid=o.id;W.scr='menu';W.cart=[];close();O.save()}});
}
const findCust=ph=>{ph=O.en(ph).replace(/\D/g,'');return ph.length>=4&&S().customers.find(c=>c.phone.includes(ph))};
const lookup=(ph,box)=>{const c=findCust(ph);box.innerHTML=c?`<div class="alert alert-success">${ic('user-check')}<div><b>${c.name}</b> · ${fa(c.visits)} بار · آخرین ${fa(c.last)}${c.note?`<br><b style="color:var(--warning)">${O.esc(c.note)}</b>`:''}</div></div>`:O.en(ph).replace(/\D/g,'').length>=4?'<small class="muted">مشتری جدید؛ نام را در صفحهٔ میز وارد کنید</small>':''};
function noteSheet(mid,cartItem){
  const m=O.mi(mid);
  sheet(m.name,`${(O.MODS[m.station]||[]).map((g,k)=>`<div class="field"><label>${g.g}</label><div class="chips">${g.opts.map(([n,pr],j)=>`<label class="chip-opt"><input type="${g.one?'radio':'checkbox'}" name="md${k}" value="${j}" ${g.one&&!j?'checked':''}><span>${n}${pr?' +'+t(pr):''}</span></label>`).join('')}</div></div>`).join('')}<div class="field"><label>توضیح سریع</label>${O.chips('n',O.NOTES[m.station]||O.NOTES.kitchen,true)}</div>
    <div class="field"><label>توضیح آزاد</label><input class="input" name="free" placeholder="مثلاً: برای کودک، بشقاب جدا"></div>
    <div class="between"><b>تعداد</b><div class="stp"><button type="button" data-q="-1">${ic('minus')}</button><b id="qv">۱</b><button type="button" data-q="1">${ic('plus')}</button></div></div>
    <label class="check"><input type="checkbox" name="hold"><span><b>نگه‌دار تا اعلام</b> <small class="muted" style="display:block">مثلاً غذای اصلی بعد از پیش‌غذا؛ از صفحهٔ میز «اجرا» می‌زنید</small></span></label>`,
    `<button class="btn btn-primary" data-ok>${ic('plus')}افزودن به سفارش</button>`,
    (el,close,f)=>{let q=1;$$('[data-q]',el).forEach(b=>b.onclick=()=>{q=Math.max(1,q+ +b.dataset.q);$('#qv',el).textContent=fa(q)});
      $('[data-ok]',el).onclick=()=>{const n=[...O.vals(f,'n'),f.free.value.trim()].filter(Boolean).join('، ');const md=[];(O.MODS[m.station]||[]).forEach((g,k)=>O.vals(f,'md'+k).forEach(j=>{const[nn,pr]=g.opts[+j];if(pr||!g.one)md.push([nn,pr])}));for(let k=0;k<q;k++)addCart(mid,n,md,f.hold.checked);close();draw()}});
}
function review(){
  const o=O.order(W.oid),tot=W.cart.reduce((a,c)=>a+cPrice(c)*c.qty,0),by={};
  W.cart.forEach(c=>{const s=O.mi(c.mid).station;(by[s]=by[s]||[]).push(c)});
  sheet('ارسال سفارش میز '+fa(O.table(o.table).no),`${Object.entries(by).map(([s,L])=>`<div><div class="w-sec" style="margin-top:0"><span>${ic(O.st(s).icon)} ${O.st(s).name}</span><small class="muted">${O.st(s).kds?'مانیتور + ':''}${S().stations.find(x=>x.id===s).print?O.st(s).printer:''}</small></div>
      <div class="w-card">${L.map(c=>`<div class="w-line"><b>${fa(c.qty)}×</b><div><b>${O.mi(c.mid).name}</b>${cTxt(c)?`<small class="nt">» ${O.esc(cTxt(c))}</small>`:''}<button type="button" class="chip" style="height:24px;margin-top:4px;font-size:11px;${c.hold?'background:var(--info);color:#fff;border-color:var(--info)':''}" data-hd="${W.cart.indexOf(c)}">${c.hold?'نگه‌داشته تا اعلام':'ارسال فوری'}</button></div><button type="button" class="btn btn-ghost btn-sm btn-icon" data-rm="${W.cart.indexOf(c)}">${ic('trash-2')}</button></div>`).join('')}</div></div>`).join('')}
    <div class="between"><span>جمع این نوبت</span><b>${t(tot)} تومان</b></div>`,
    `<button class="btn btn-primary" data-ok>${ic('send')}ارسال به ${Object.keys(by).map(s=>O.st(s).name).join(' و ')}</button>`,
    (el,close)=>{$$('[data-hd]',el).forEach(b=>b.onclick=()=>{const c=W.cart[+b.dataset.hd];c.hold=!c.hold;close();review()});$$('[data-rm]',el).forEach(b=>b.onclick=()=>{W.cart.splice(+b.dataset.rm,1);close();if(W.cart.length)review();else draw()});
      $('[data-ok]',el).onclick=()=>{W.cart.forEach(c=>O.addItem(o,c.mid,c.note,me,c.mods,c.hold,c.qty));const held=W.cart.filter(c=>c.hold).reduce((a,c)=>a+c.qty,0);
        const n=O.send(o,me);if(held)setTimeout(()=>O.toast(fa(held)+' قلم نگه‌داشته شد','pause'),300);W.cart=[];W.scr='detail';close();O.save();O.toast(`${fa(n)} قلم ارسال شد`,'send')}});
}
function itemSheet(o,i){
  if(i.status==='ready'){i.status='served';O.save();O.toast(i.name+' سرو شد');return}
  if(S().requests.some(r=>r.item===i.uid&&r.status==='pending')){O.toast('درخواست ابطال در انتظار صندوق است','hourglass');return}
  sheet('درخواست ابطال: '+i.name,`${O.note('آیتم به '+O.st(i.station).name+' رفته؛ ابطال با تأیید صندوق انجام می‌شود.','shield-check','warning')}
    ${i.qty>1?`<div class="between"><b>تعداد</b><div class="stp"><button type="button" data-q="-1">${ic('minus')}</button><b id="qv">${fa(i.qty)}</b><button type="button" data-q="1">${ic('plus')}</button></div></div>`:''}
    <div class="field"><label>دلیل</label>${O.chips('r',O.VOID_REASONS)}</div>`,
    `<button class="btn btn-danger" data-ok>${ic('send')}ارسال درخواست به صندوق</button>`,
    (el,close,f)=>{let q=i.qty;$$('[data-q]',el).forEach(b=>b.onclick=()=>{q=Math.min(i.qty,Math.max(1,q+ +b.dataset.q));$('#qv',el).textContent=fa(q)});
      $('[data-ok]',el).onclick=()=>{const r=O.vals(f,'r')[0];if(!r){O.toast('دلیل را انتخاب کنید','alert-triangle');return}
        S().requests.unshift({id:O.uid('r'),kind:'void',order:o.id,item:i.uid,qty:q,reason:r,by:me,at:Date.now(),status:'pending'});close();O.save();O.toast('درخواست به صندوق رفت','send')}});
}
const SH={
  cust:o=>{const c=o.customer&&O.cust(o.customer);
    sheet('مشتری',`<div class="field"><label>تلفن</label><input class="input" name="ph" inputmode="tel" value="${c?fa(c.phone):''}"></div><div id="cres"></div>
      <div class="field"><label>نام</label><input class="input" name="nm" value="${c?O.esc(c.name):''}"></div>
      <div class="field"><label>یادداشت ثابت (حساسیت، ترجیح)</label><input class="input" name="nt" value="${c?O.esc(c.note):''}"></div>
      <div class="field"><label>مناسبت (اختیاری)</label>${O.chips('oc',['تولد','سالگرد','جلسهٔ کاری'])}</div>`,
      `<button class="btn btn-primary" data-ok>${ic('check')}ذخیره</button>`,
      (el,close,f)=>{f.ph.oninput=()=>{lookup(f.ph.value,$('#cres',el));const x=findCust(f.ph.value);if(x){f.nm.value=x.name;f.nt.value=x.note}};lookup(f.ph.value,$('#cres',el));
        $('[data-ok]',el).onclick=()=>{const ph=O.en(f.ph.value).replace(/\D/g,'');if(!ph){O.toast('شماره لازم است','alert-triangle');return}
          let x=findCust(ph);if(!x){x={id:O.uid('c'),name:f.nm.value.trim()||'مشتری '+fa(ph.slice(-4)),phone:ph,visits:0,last:'—',spend:0,note:'',tags:['جدید']};S().customers.push(x)}
          else if(f.nm.value.trim())x.name=f.nm.value.trim();x.note=f.nt.value.trim();const oc=O.vals(f,'oc')[0];if(oc)o.occasion=oc;
          o.customer=x.id;O.log(o,'مشتری: '+x.name,me);close();O.save()}})},
  guests:o=>{let g=o.guests;sheet('تعداد نفرات',`<div class="between"><b>نفرات</b><div class="stp"><button type="button" data-g="-1">${ic('minus')}</button><b id="gv">${fa(g)}</b><button type="button" data-g="1">${ic('plus')}</button></div></div>`,
    `<button class="btn btn-primary" data-ok>ذخیره</button>`,(el,close)=>{$$('[data-g]',el).forEach(b=>b.onclick=()=>{g=Math.max(1,g+ +b.dataset.g);$('#gv',el).textContent=fa(g)});$('[data-ok]',el).onclick=()=>{o.guests=g;close();O.save()}})},
  move:o=>sheet('انتقال به میز آزاد',`<div class="w-grid">${O.TABLES.filter(x=>O.tstate(x)==='free').map(x=>`<button type="button" class="wt st-free" data-to="${x.id}"><span class="tno">${fa(x.no)}</span><small>${O.AREAS.find(a=>a.id===x.area).name}</small></button>`).join('')}</div>
    <small class="muted">ادغام دو میز پر فقط از صندوق انجام می‌شود.</small>`,'',(el,close)=>$$('[data-to]',el).forEach(b=>b.onclick=()=>{const from=O.table(o.table).no;o.table=b.dataset.to;O.log(o,`انتقال از میز ${fa(from)} به میز ${fa(O.table(o.table).no)} (سفارش‌گیر)`,me);
      [...new Set(O.live(o).filter(i=>i.status==='sent'||i.status==='ready').map(i=>i.station))].forEach(st=>O.ticket(o,st,[{name:'انتقال میز',qty:1,note:'از میز '+fa(from)+' به میز '+fa(O.table(o.table).no)}],'انتقال',me));close();O.save();O.toast('میز تغییر کرد')})),
  bill:o=>{if(W.cart.length){O.toast('سبد ارسال‌نشده دارید','alert-triangle');return}o.status='bill';O.log(o,'درخواست صورتحساب (سفارش‌گیر)',me);O.save();O.toast('درخواست صورتحساب به صندوق رفت','receipt')},
  /* print the bill on the cashier printer (or the waiter's portable printer) and show it */
  print:o=>{if(W.cart.length||o.items.some(i=>i.status==='new'&&!i.hold)){O.toast('اول سبد را ارسال کنید','alert-triangle');return}
    const again=S().prints.some(p=>p.order===o.id&&p.kind==='پیش‌فاکتور');o.status='bill';const html=O.printBill(o,'پیش‌فاکتور',me,true);if(again)O.flag(o,'چاپ دوبارهٔ صورتحساب');
    O.log(o,'صورتحساب چاپ شد (سفارش‌گیر)',me);O.save();
    sheet('صورتحساب میز '+fa(O.table(o.table).no),`<div style="display:grid;place-items:center">${html}</div><small class="muted">به چاپگر صندوق فرستاده شد.</small>`,can('settle')?`<button class="btn btn-primary" data-ok>${ic('wallet')}تسویه</button>`:'',(el,close)=>{const b=$('[data-ok]',el);b&&(b.onclick=()=>{close();SH.settle(o)})})},
  disc:o=>{const c=o.customer&&O.cust(o.customer);
    sheet('تخفیف',`${c&&c.pct?`<button type="button" class="btn btn-secondary" data-club>${ic('gift')}تخفیف باشگاه ${O.esc(c.name)}: ${fa(c.pct)}٪</button>`:''}
      <div class="field"><label>درصد</label>${O.chips('p',['۵','۱۰','۱۵','۲۰'])}</div><div class="field"><label>دلیل</label>${O.chips('r',['مشتری دائمی','جبران تأخیر','مهمان مدیر'])}</div>
      ${o.discount?`<button type="button" class="btn btn-ghost btn-sm" data-rm>حذف تخفیف فعلی (${O.esc(o.discount.reason)})</button>`:''}<small class="muted">بیش از ۲۰٪ فقط از صندوق؛ همهٔ تخفیف‌ها در «کنترل» صندوق دیده می‌شوند.</small>`,
      `<button class="btn btn-primary" data-ok>${ic('check')}اعمال</button>`,(el,close,f)=>{
        const cl=$('[data-club]',el);cl&&(cl.onclick=()=>{O.applyClub(o,me);close();O.save();O.toast('تخفیف باشگاه اعمال شد','percent')});
        const rm=$('[data-rm]',el);rm&&(rm.onclick=()=>{o.discount=null;O.log(o,'حذف تخفیف',me);close();O.save()});
        $('[data-ok]',el).onclick=()=>{const p=O.int(O.vals(f,'p')[0]||''),r=O.vals(f,'r')[0];if(!p||!r){O.toast('درصد و دلیل را بزنید','alert-triangle');return}
          o.discount={kind:'pct',value:p,reason:r};O.log(o,`تخفیف ${fa(p)}٪ — ${r} (سفارش‌گیر)`,me);close();O.save()}})},
  settle:o=>{if(o.items.some(i=>i.status==='new')){O.toast('آیتم ارسال‌نشده دارد','alert-triangle');return}
    const c=o.customer&&O.cust(o.customer),due=O.due(o),meth=['card','cash','transfer',...(c&&c.credit>0?['club']:[]),...(c?['credit']:[])];
    sheet('تسویه میز '+fa(O.table(o.table).no),`<div class="between"><span>قابل پرداخت</span><b style="font-size:20px">${t(due)} تومان</b></div>
      ${c?`<small class="muted">${O.esc(c.name)}${c.credit?' · اعتبار باشگاه '+t(c.credit):''}${O.debt(c.id)>0?' · بدهی قبلی '+t(O.debt(c.id)):''}</small>`:''}
      <div class="field"><label>روش</label><div class="chips">${meth.map((k,j)=>`<label class="chip-opt"><input type="radio" name="m" value="${k}" ${!j?'checked':''}><span>${O.PAY[k][0]}</span></label>`).join('')}</div></div>
      <div class="field"><label>مبلغ (کمتر = پرداخت بخشی؛ بقیه با روش دیگر)</label><input class="input" name="a" inputmode="numeric" value="${fa(due)}"></div>`,
      `<button class="btn btn-primary" data-ok>${ic('check')}ثبت پرداخت</button>`,(el,close,f)=>{$('[data-ok]',el).onclick=()=>{
        const a=Math.min(O.int(f.a.value),O.due(o)),r=O.pay(o,[{method:O.vals(f,'m')[0],amount:a}],me);if(!r.ok){O.toast(r.msg,'alert-triangle');return}
        close();if(r.closed){W.scr=null;W.oid=null;O.toast('تسویه شد؛ رسید چاپ شد و میز آزاد شد','check-circle')}else O.toast('ثبت شد؛ مانده '+t(O.due(o)),'wallet');O.save()}})}
};

/* ---------- render & events ---------- */
function draw(){
  let h;if(!me)h=login();else if(W.scr==='detail')h=detail();else if(W.scr==='menu')h=menu();else h=W.tab==='alerts'?alerts():tables(W.tab==='mine');
  const keep=$('.sheet-backdrop',app());app().innerHTML=h;if(keep)app().appendChild(keep);RT.icons();
  const who=$('#wWho');if(who)who.onchange=()=>{W.pick=who.value||null;W.pin='';draw()};
  const q=$('#wq');if(q)q.oninput=()=>{W.q=q.value;const p=q.selectionStart;draw();const n=$('#wq');n.focus();n.setSelectionRange(p,p)};
}
app().addEventListener('click',e=>{
  if(e.target.closest('.sheet-backdrop'))return;
  const g=k=>e.target.closest('['+k+']');let x;
  if((x=g('data-who'))){W.pick=x.dataset.who;W.pin='';draw();return}
  if((x=g('data-k'))){const k=x.dataset.k;W.pin=k==='⌫'?W.pin.slice(0,-1):W.pin+k;if(W.pin.length>=4){me=W.pick;try{sessionStorage.setItem('rayo_waiter',me)}catch(e){}W.pin='';O.toast('خوش آمدید، '+O.staff(me).name,'user')}draw();return}
  if((x=g('data-out'))){me=null;W.pick=null;try{sessionStorage.removeItem('rayo_waiter')}catch(e){}draw();return}
  if((x=g('data-tab'))){W.tab=x.dataset.tab;W.scr=null;draw();return}
  if((x=g('data-area'))){W.area=x.dataset.area;draw();return}
  if((x=g('data-back'))){if(W.scr==='menu')W.scr='detail';else{W.scr=null;W.oid=null}draw();return}
  if((x=g('data-t'))){const o=O.atTable(x.dataset.t);if(o){if(W.oid!==o.id)W.cart=[];W.oid=o.id;W.scr='detail';draw()}else openTable(x.dataset.t);return}
  const o=O.order(W.oid);
  if((x=g('data-srv'))){const[oid,uid]=x.dataset.srv.split(':'),ord=O.order(oid),i=ord&&ord.items.find(z=>z.uid===uid);if(i){i.status='served';O.save();O.toast(i.name+' سرو شد')}return}
  if(!o)return;
  if((x=g('data-menu'))){W.scr='menu';draw();return}
  if((x=g('data-fire'))){const n=O.send(o,me,true);O.save();O.toast(fa(n)+' قلم اجرا شد','flame');return}
  if((x=g('data-served'))){O.live(o).forEach(i=>{if(i.status==='ready')i.status='served'});O.save();O.toast('سرو شد');return}
  if((x=g('data-sh'))){SH[x.dataset.sh](o);return}
  if((x=g('data-again'))){const i=o.items.find(z=>z.uid===x.dataset.again);addCart(i.mid,i.note||'',i.mods||[],false);O.toast('یک '+i.name+' به سبد اضافه شد','plus');draw();return}
  if((x=g('data-it'))){itemSheet(o,o.items.find(i=>i.uid===x.dataset.it));return}
  if((x=g('data-cat'))){W.cat=x.dataset.cat||null;draw();return}
  if((x=g('data-cp'))){addCart(x.dataset.cp);draw();return}
  if((x=g('data-cm'))){subCart(x.dataset.cm);draw();return}
  if((x=g('data-nm'))){noteSheet(x.dataset.nm);return}
  if((x=g('data-review'))){review();return}
});
let lastReady=null;
O.on(src=>{const n=me?readyItems().length:0;if(src==='remote'&&lastReady!=null&&n>lastReady){O.toast('آیتم آماده سرو شد','bell-ring');navigator.vibrate&&navigator.vibrate(200)}lastReady=n;draw()});
setInterval(draw,30000);
lastReady=me?readyItems().length:0;
draw();
})();
