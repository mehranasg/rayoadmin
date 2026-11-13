/* =========================================================
   Rayo cashier app prototype — pos.js
   Table map · order ticket · menu · send to stations · edit / void · move / merge / split ·
   discount · customer · bill · settle (mixed payment + card tip) · requests from waiters ·
   print log · printers & routing.
   ========================================================= */
(function(){
'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const ME='s1';                                   // cashier on shift (prototype)
const U={view:'tables',area:'all',sel:null,cat:null,q:'',pf:'all'};
const S=()=>O.S();
const fa=O.fa,ic=O.ic,t=O.t;

/* ---------- top bar ---------- */
function top(){
  const req=S().requests.filter(r=>r.status==='pending').length,follow=S().orders.filter(o=>O.late(o).length||O.longStay(o)||O.noOrderLong(o)).length;
  const tab=(v,l,i,c)=>`<button class="${U.view===v||(v==='tables'&&U.view==='menu')?'active':''}" data-v="${v}">${ic(i)}${l}${c?`<span class="count">${fa(c)}</span>`:''}</button>`;
  $('#top').innerHTML=`<div class="ops-brand"><span class="brand-mark">ر</span><div>صندوق رایو<small>شعبهٔ مرکزی · صندوق ۱</small></div></div>
    <div class="segmented">${tab('tables','میزها','layout-grid',follow)}${tab('orders','سفارش‌ها','list')}${tab('customers','مشتریان','contact')}${tab('requests','درخواست‌ها','bell',req)}${tab('shift','شیفت','wallet')}${tab('audit','کنترل','shield-alert',audits().filter(a=>a.risk).length)}${tab('prints','چاپ‌ها','printer')}${tab('settings','تنظیمات','settings')}</div>
    <div class="grow"></div>
    <button class="btn btn-ghost btn-sm" data-call title="شبیه‌سازی کالر آیدی">${ic('phone-incoming')}تماس</button>
    <button class="btn btn-secondary btn-sm" data-new="counter" title="سفارش حضوری: مشتری پشت پیشخوان سفارش می‌دهد و همان‌جا می‌خورد یا منتظر می‌ماند">${ic('store')}حضوری</button>
    <button class="btn btn-secondary btn-sm" data-new="take">${ic('shopping-bag')}بیرون‌بر</button>
    <button class="btn btn-secondary btn-sm" data-new="delivery">${ic('bike')}پیک</button>
    <button class="btn btn-ghost btn-sm" data-new="staff" title="سفارش پرسنل به حساب خودش">${ic('id-card')}پرسنلی</button>
    <a class="btn btn-ghost btn-sm" href="waiter.html" target="_blank">${ic('smartphone')}سفارش‌گیر</a>
    <a class="btn btn-ghost btn-sm" href="kds.html" target="_blank">${ic('monitor')}مانیتور آشپزخانه</a>
        <span class="who"><span class="av">${O.staff(ME).name[0]}</span>${O.staff(ME).name}</span>
    <span class="ops-clock" id="clk">${O.clock(Date.now())}</span>`;
  $$('[data-v]',$('#top')).forEach(b=>b.onclick=()=>{U.view=b.dataset.v;render()});
  $$('[data-new]',$('#top')).forEach(b=>b.onclick=()=>openOff(b.dataset.new));
}

/* ---------- main views ---------- */
function tables(){
  const T=O.TABLES.filter(x=>U.area==='all'||x.area===U.area),cnt={};O.TABLES.forEach(x=>{const s=O.tstate(x);cnt[s]=(cnt[s]||0)+1});
  const off=S().orders.filter(o=>!o.table);
  const open=S().orders.filter(o=>o.table),nLong=open.filter(O.longStay).length,nLate=open.filter(o=>O.late(o).length).length,nIdle=open.filter(O.noOrderLong).length;
  const card=x=>{const s=O.tstate(x),o=O.atTable(x.id),r=S().reserved[x.id],rd=o&&O.live(o).filter(i=>i.status==='ready').length,lt=o&&O.late(o).length;
    return`<button class="tcard st-${s} ${o&&o.id===U.sel?'sel':''} ${o&&O.longStay(o)?'long':''}" data-t="${x.id}">
      <span class="tno">${fa(x.no)}</span>
      ${rd?`<span class="flag badge badge-success">${ic('bell-ring')}${fa(rd)} آماده</span>`:s==='bill'?`<span class="flag badge badge-danger">صورتحساب</span>`:lt?`<span class="flag badge badge-danger" title="از زمان هدف آشپزخانه گذشته">${ic('alarm-clock')}پیگیری</span>`:o&&O.noOrderLong(o)?`<span class="flag badge badge-info">${ic('hand')}بدون سفارش</span>`:''}
      <small>${ic('users')}${o?fa(o.guests)+' از '+fa(x.seats):fa(x.seats)+' نفره'}${o?' · '+ic('timer')+O.dur(o.openedAt):''}</small>
      ${o?`<small>${ic('user')}${O.staff(o.waiter).name}</small>`:r?`<small>${ic('calendar-clock')}${r.name} · ${r.at}</small>`:''}
      ${o&&O.longStay(o)?`<small class="long-tag">${ic('hourglass')}بیش از ${fa(Math.round(O.set().longStayMin/60*10)/10)} ساعت</small>`:''}
      <span class="tsum">${o?(O.noOrder(o)?'منتظر سفارش':t(O.total(o))):O.TSTATE[s][0]}</span></button>`};
  return`<div class="between" style="margin-bottom:var(--s3);flex-wrap:wrap">
      <div class="segmented">${[['all','همه'],...O.AREAS.map(a=>[a.id,a.name])].map(([k,l])=>`<button class="${U.area===k?'active':''}" data-area="${k}">${l}</button>`).join('')}</div>
      <div class="legend-bar">${Object.entries(O.TSTATE).map(([k,[l]])=>`<span class="st-${k}"><i class="dot"></i>${l} ${fa(cnt[k]||0)}</span>`).join('')}</div></div>
    ${nLong||nLate||nIdle?`<div class="follow-bar">${ic('bell-ring')}<b>پیگیری ویتر:</b>
      ${nLate?`<span class="badge badge-danger">${fa(nLate)} میز با سفارش دیرشده</span>`:''}${nLong?`<span class="badge badge-warning">${fa(nLong)} میز بیش از ${fa(O.set().longStayMin)} دقیقه</span>`:''}${nIdle?`<span class="badge badge-info">${fa(nIdle)} میز نشسته بدون سفارش</span>`:''}
      <small class="muted">زمان‌ها در «تنظیمات ← زمان‌ها و هشدارها»</small></div>`:''}
    ${O.AREAS.filter(a=>U.area==='all'||a.id===U.area).map(a=>`<h3 class="section-title" style="margin:var(--s4) 0 var(--s2)">${a.name}</h3>
      <div class="tgrid">${T.filter(x=>x.area===a.id).map(card).join('')}</div>`).join('')}
    <h3 class="section-title" style="margin:var(--s5) 0 var(--s2)">حضوری، بیرون‌بر، پیک، اسنپ‌فود و پرسنلی</h3>
    <div class="tgrid">${off.map(o=>{const L=O.live(o),s=L.some(i=>i.status==='sent')?'cooking':L.length&&L.every(i=>i.status!=='new'&&i.status!=='sent')?'ready':'seated',lt=O.late(o).length;
      return`<button class="tcard ocard st-${s} ${o.id===U.sel?'sel':''}" data-o="${o.id}"><span class="row"><b>${ic(O.TYPES[o.type][1])}${O.TYPES[o.type][0]}</b><span class="muted">#${fa(o.no)}</span></span>
        ${lt?`<span class="flag badge badge-danger">${ic('alarm-clock')}پیگیری</span>`:''}
        <small>${ic('timer')}${O.dur(o.openedAt)}</small>${o.customer?`<small>${ic('user')}${O.cust(o.customer).name}</small>`:o.staffOf?`<small>${ic('id-card')}${O.staff(o.staffOf).name}</small>`:''}
        ${o.reopened?`<small style="color:var(--danger)">${ic('rotate-ccw')}اصلاح بعد از تسویه</small>`:''}
        <span class="tsum">${t(O.total(o))}</span></button>`}).join('')||'<p class="muted">سفارشی نیست</p>'}</div>`;
}
function menu(){
  const o=O.order(U.sel);if(!o){U.view='tables';return tables()}
  const cat=U.cat,q=U.q.trim(),list=O.MENU.filter(m=>(!cat||m.cat===cat)&&(!q||m.name.includes(q)));
  const inCart=mid=>o.items.filter(i=>i.mid===mid&&i.status==='new').reduce((a,i)=>a+i.qty,0),Q=O.queue();
  return`<div class="between" style="margin-bottom:var(--s3)"><div class="row"><button class="btn btn-ghost btn-sm" data-back>${ic('arrow-right')}میزها</button><h2 style="margin:0;font-size:17px">افزودن به ${O.label(o)}</h2></div>
      <div class="search" style="width:260px">${ic('search')}<input class="input" id="mq" placeholder="جستجوی آیتم…" value="${O.esc(U.q)}"></div></div>
    <div class="row" style="flex-wrap:wrap;margin-bottom:var(--s3)"><button class="chip ${!cat?'active':''}" data-cat="">همه</button>${O.CATS.map(c=>`<button class="chip ${cat===c?'active':''}" data-cat="${c}">${c}</button>`).join('')}</div>
    <div class="menu-grid">${list.map(m=>{const n=inCart(m.id),w=O.wait(m.id,Q);return`<div class="mtile ${O.isOut(m.id)?'out':''} ${w.busy?'busy':''}" data-mi="${m.id}" role="button" tabindex="0">
      ${n?`<span class="incart">${fa(n)}</span>`:''}<span class="stn" title="${O.st(m.station).name}">${ic(O.st(m.station).icon)}</span>
      <b>${m.name}</b>${w.busy?`<span class="qwait">${ic('hourglass')}${O.waitTxt(w)}</span>`:''}<span class="muted" style="font-size:11.5px">${O.isOut(m.id)?'ناموجود':m.cat}</span><span class="pr">${t(O.unit(o,m))}${o.priceList&&o.priceList!=='normal'?' <small class="muted" style="text-decoration:line-through">'+t(m.price)+'</small>':''}</span>
      <button class="nt" data-86="${m.id}" title="موجود/ناموجود" style="inset-inline-end:40px;${O.isOut(m.id)?'color:var(--danger)':''}">${ic(O.isOut(m.id)?'circle-off':'ban')}</button>
      ${O.isOut(m.id)?'':`<button class="nt" data-note="${m.id}" title="با توضیح">${ic('message-square-plus')}</button>`}</div>`}).join('')}</div>
    ${O.note('برچسب «در صف» یعنی آشپزخانه از این آیتم چند تا در دست دارد و آیتم تازه حدوداً چقدر طول می‌کشد. پیش از ثبت به مشتری بگویید؛ شاید آیتم دیگری انتخاب کند.','hourglass','warning')}
    ${O.note('دکمهٔ «⊘» روی هر کارت آیتم را «ناموجود» می‌کند؛ فوراً در سفارش‌گیر و منوی QR هم غیرفعال می‌شود.','circle-off','warning')}
    ${O.note('هر آیتم بر اساس دسته‌اش به ایستگاه خودش می‌رود (آیکون گوشهٔ کارت). تا «ارسال» نزده‌اید، چیزی چاپ نمی‌شود و ویرایش آزاد است.','info')}`;
}
/* status of an order for lists (open orders get the follow-up states) */
/* status of an order as [label, tone] — used for the badge, sorting and grouping */
function ostatKey(o){
  if(o.status==='paid')return[o.reopened?'تسویه (اصلاح‌شده)':'تسویه','success'];if(o.status==='merged')return['ادغام‌شده','neutral'];if(o.status==='cancel')return['لغو','neutral'];
  if(o.reopened)return['اصلاح بعد از تسویه','danger'];if(o.status==='bill')return['صورتحساب خواسته','danger'];
  if(O.noOrder(o))return['بدون سفارش','info'];if(O.late(o).length)return['پیگیری','danger'];
  if(o.dispatch&&o.dispatch.status==='out')return['نزد پیک','warning'];return['باز','warning']}
function ostat(o){const[l,tone]=ostatKey(o);
  return l==='پیگیری'?`<span title="${O.late(o).map(i=>i.name).join('، ')} — از زمان هدف گذشته">${O.b(l,tone)}</span>`:O.b(l,tone)}
const payTxt=o=>{const by={};o.payments.forEach(p=>by[p.method]=(by[p.method]||0)+p.amount);return Object.entries(by).map(([k,v])=>O.PAY[k][0]+(Object.keys(by).length>1?' '+t(v):'')).join('، ')||'—'};
const custName=o=>{const c=o.customer&&O.cust(o.customer);return c?c.name:o.staffOf?O.staff(o.staffOf).name:''};
/* orders list: sortable columns (click a header; again = reverse) and group-by */
const OCOLS=[['label','سفارش',o=>O.label(o)],['type','نوع',o=>O.TYPES[o.type][0]],['waiter','ویتر / ثبت',o=>O.staff(o.waiter).name],['cust','مشتری و تلفن',custName],
  ['time','ساعت',o=>o.openedAt,1],['amount','مبلغ',o=>O.total(o),1],['pay','پرداخت',payTxt],['status','وضعیت',o=>ostatKey(o)[0]]];
const OGROUPS=[['','بدون گروه'],['type','نوع'],['status','وضعیت'],['waiter','ویتر / ثبت'],['cust','مشتری'],['pay','روش پرداخت'],['hour','ساعت']];
const ogKey=(o,g)=>g==='hour'?fa(String(new Date(o.openedAt).getHours()).padStart(2,'0'))+':۰۰ تا '+fa(String((new Date(o.openedAt).getHours()+1)%24).padStart(2,'0'))+':۰۰':g==='cust'?(custName(o)||'بدون مشتری'):OCOLS.find(c=>c[0]===g)[2](o);
const ocmp=(a,b)=>typeof a==='number'&&typeof b==='number'?a-b:String(a).localeCompare(String(b),'fa',{numeric:true});
function orders(){
  const all=[...S().orders,...S().closed],ty=U.otype||'all',sx=U.ostat||'all',so=U.osort||{k:'time',dir:-1},grp=U.ogroup||'';
  const col=OCOLS.find(c=>c[0]===so.k)||OCOLS[4];
  const pick=all.filter(o=>(ty==='all'||o.type===ty)&&(sx==='all'||(sx==='open'?S().orders.includes(o):sx==='paid'?o.status==='paid':o.status==='cancel'||o.status==='merged')))
    .sort((a,b)=>ocmp(col[2](a),col[2](b))*so.dir||(b.openedAt-a.openedAt));
  const sales=S().closed.filter(o=>o.status==='paid'),byPay={};sales.forEach(o=>o.payments.forEach(p=>byPay[p.method]=(byPay[p.method]||0)+p.amount));
  /* number columns: th and td both carry .num so the title sits right above the value */
  const head=`<thead><tr>${OCOLS.map(([k,l,,n])=>`<th class="${n?'num':''} sortable ${so.k===k?'sorted':''}" data-osort="${k}" title="مرتب‌سازی">${l}${so.k===k?ic(so.dir>0?'arrow-up':'arrow-down','ti'):''}</th>`).join('')}<th></th></tr></thead>`;
  const row=o=>{const c=o.customer&&O.cust(o.customer),isOpen=S().orders.includes(o);
    return`<tr><td><b>${O.label(o)}</b></td><td>${ic(O.TYPES[o.type][1],'ti')}${O.TYPES[o.type][0]}</td><td>${O.staff(o.waiter).name}</td>
    <td>${c?`${O.esc(c.name)}<small class="muted num" style="display:block">${fa(c.phone)}</small>`:o.staffOf?O.staff(o.staffOf).name+' <small class="muted">(پرسنل)</small>':'—'}</td>
    <td class="num">${O.clock(o.openedAt)}${o.closedAt?' – '+O.clock(o.closedAt):`<small class="muted" style="display:block">${O.dur(o.openedAt)}</small>`}</td><td class="num">${t(O.total(o))}</td>
    <td>${payTxt(o)}</td><td>${ostat(o)}</td>
    <td class="row-act">${isOpen?`<button class="btn btn-ghost btn-sm btn-icon" data-o="${o.id}" title="باز کردن در صندوق">${ic('square-arrow-out-up-left')}</button>`:`<button class="btn btn-ghost btn-sm btn-icon" data-ov="${o.id}" title="جزئیات و سابقه">${ic('eye')}</button>`}
      <button class="btn btn-ghost btn-sm btn-icon" data-op="${o.id}" title="چاپ صورتحساب">${ic('printer')}</button>
      ${o.status==='paid'?`<button class="btn btn-ghost btn-sm btn-icon" data-ofix="${o.id}" title="اصلاح بعد از تسویه (حذف یا افزودن آیتم)">${ic('pencil')}</button>`:''}</td></tr>`};
  const cnt=k=>all.filter(o=>o.type===k).length;
  /* courier: who took which orders today */
  const dl=all.filter(o=>o.type==='delivery'),cour={};dl.forEach(o=>{const k=o.courier||'';(cour[k]=cour[k]||[]).push(o)});
  const stf=all.filter(o=>o.type==='staff'&&o.status!=='cancel'),stBy={};stf.forEach(o=>{(stBy[o.staffOf]=stBy[o.staffOf]||[]).push(o)});
  return`<div class="grid grid-4">${[['سفارش باز',fa(S().orders.length),'list'],['تسویه‌شده امروز',fa(sales.length),'check-circle'],['فروش تسویه‌شده',t(sales.reduce((a,o)=>a+O.total(o),0)),'wallet'],['باز (مبلغ)',t(S().orders.reduce((a,o)=>a+O.total(o),0)),'hourglass']].map(([l,v,i])=>`<div class="card kpi"><div class="kpi-top"><span class="kpi-label">${l}</span><span class="kpi-icon">${ic(i)}</span></div><div class="kpi-value">${v}</div></div>`).join('')}</div>
    <div class="card mt"><div class="card-head" style="flex-wrap:wrap;gap:8px"><h3>سفارش‌های امروز</h3>
      <div class="row" style="flex-wrap:wrap">${[['all','همه',all.length],...Object.keys(O.TYPES).map(k=>[k,O.TYPES[k][0],cnt(k)])].map(([k,l,n])=>`<button class="chip ${ty===k?'active':''}" data-oty="${k}">${l} <span class="count">${fa(n)}</span></button>`).join('')}</div>
      <div class="segmented">${[['all','همه'],['open','باز'],['paid','تسویه‌شده'],['void','لغو / ادغام']].map(([k,l])=>`<button class="${sx===k?'active':''}" data-ost="${k}">${l}</button>`).join('')}</div></div>
      <div class="row og-bar"><span class="muted">${ic('group')}گروه‌بندی:</span>${OGROUPS.map(([k,l])=>`<button class="chip ${grp===k?'active':''}" data-ogrp="${k}">${l}</button>`).join('')}
        ${grp?`<button class="btn btn-ghost btn-sm" data-ocolall>${ic('chevrons-down-up')}${(U.ocol||[]).length?'باز کردن همه':'بستن همه'}</button>`:''}</div>
      <div class="table-wrap"><table class="table">${head}<tbody>${!pick.length?'<tr><td colspan="9" class="muted">سفارشی با این فیلتر نیست</td></tr>'
        :!grp?pick.map(row).join('')
        :(()=>{const G=new Map();pick.forEach(o=>{const k=String(ogKey(o,grp));G.has(k)||G.set(k,[]);G.get(k).push(o)});U.ogKeys=[...G.keys()];
          return[...G].map(([k,L])=>{const shut=(U.ocol||[]).includes(k);return`<tr class="og-row" data-ocol="${O.esc(k)}"><td colspan="5">${ic(shut?'chevron-left':'chevron-down','ti')}<b>${O.esc(k)}</b> <span class="muted">· ${fa(L.length)} سفارش</span></td><td class="num"><b>${t(L.reduce((a,o)=>a+O.total(o),0))}</b></td><td colspan="3"></td></tr>${shut?'':L.map(row).join('')}`}).join('')})()}</tbody></table></div>
      <div class="card-body muted" style="font-size:12px">${Object.entries(byPay).map(([k,v])=>O.PAY[k][0]+': '+t(v)).join(' · ')||'هنوز تسویه‌ای نیست'}</div></div>
    <div class="grid grid-2 mt">
      <div class="card"><div class="card-head"><h3>${ic('bike')} پیک‌های امروز</h3></div><div class="card-body stack">${Object.entries(cour).map(([k,L])=>`<div><div class="between"><b>${k?O.staff(k).name:'پیک بیرونی'}</b><span>${fa(L.length)} سفارش · ${t(L.reduce((a,o)=>a+O.total(o),0))}</span></div>
        <div class="mini-list">${L.map(o=>{const c=o.customer&&O.cust(o.customer),d=o.dispatch||{};return`<div><span>${c?O.esc(c.name):'—'} <small class="muted">${c?fa(c.phone):''}</small></span><small class="muted">${O.esc(o.address||'')}</small><span>${d.status==='done'?O.b('تحویل '+(d.backAt?O.clock(d.backAt):''),'success'):d.status==='out'?O.b('در راه از '+O.clock(d.outAt),'warning'):O.b('آماده‌سازی','neutral')}</span></div>`}).join('')}</div></div>`).join('')||'<p class="muted">امروز سفارش پیک نبوده</p>'}</div></div>
      <div class="card"><div class="card-head"><h3>${ic('id-card')} سفارش‌های پرسنل (به حساب پرسنل)</h3></div><div class="card-body stack">${Object.entries(stBy).map(([k,L])=>`<div class="between"><span><b>${O.staff(k).name}</b> <small class="muted">${fa(L.length)} سفارش</small></span><b class="num">${t(L.reduce((a,o)=>a+O.total(o),0))}</b></div>`).join('')||'<p class="muted">—</p>'}
        ${O.note('این مبلغ‌ها جزو فروش به مشتری نیستند؛ در حساب هر نفر جمع می‌شوند و ماهانه با حقوق یا جداگانه تسویه می‌شوند.','id-card')}</div></div></div>
    ${O.note('اصلاح بعد از تسویه: سفارش دوباره باز می‌شود؛ آیتم را ابطال یا اضافه کنید، مابه‌التفاوت را بگیرید یا برگردانید. ثبت اصلی می‌ماند و «اصلاحیه» چاپ می‌شود. در «کنترل» دیده می‌شود.','rotate-ccw','warning')}`;
}
/* view a closed order: bill preview + history */
function orderView(o){O.modal({title:O.label(o)+' — #'+fa(o.no),size:'modal-lg',body:`<div class="grid grid-2"><div style="display:grid;place-items:start center">${O.billHtml(o,o.status==='paid'?'رسید':'پیش‌فاکتور')}</div>
  <div class="list">${o.log.map(l=>`<div class="list-item"><div class="grow"><b style="font-size:13px">${O.esc(l.text)}</b><small class="muted" style="display:block">${O.staff(l.by).name} · ${O.clock(l.at)}</small></div></div>`).join('')||'<p class="muted">—</p>'}</div></div>`,
  foot:`<button class="btn btn-ghost" data-close>بستن</button><button class="btn btn-secondary" data-op="${o.id}">${ic('printer')}چاپ</button>${o.status==='paid'?`<button class="btn btn-primary" data-ofix="${o.id}">${ic('pencil')}اصلاح بعد از تسویه</button>`:''}`})}
function fixOrder(o){O.form({title:'اصلاح بعد از تسویه — '+O.label(o),ok:'باز کردن برای اصلاح',tone:'danger',body:`${O.note('سفارش دوباره باز می‌شود. آیتم اشتباه را «ابطال» کنید یا آیتم جاافتاده را اضافه و «ثبت سرو‌شده» بزنید؛ سپس مابه‌التفاوت را بگیرید یا برگردانید.','rotate-ccw','warning')}
  <div class="field"><label>دلیل</label>${O.chips('r',['آیتم حذف‌شده در فیش مانده بود','آیتم سرو‌شده در فیش نبود','قیمت یا تخفیف اشتباه','روش پرداخت اشتباه'])}</div>${managerPin()}`,
  onOk:f=>{const r=O.vals(f,'r')[0];if(!r){O.toast('دلیل را انتخاب کنید','alert-triangle');return false}if(!pinOk(f))return false;O.reopen(o,ME,r);U.sel=o.id;U.view='tables';O.toast('سفارش برای اصلاح باز شد','rotate-ccw')}})}
function requests(){
  const R=S().requests;
  const one=r=>{const o=O.order(r.order)||S().closed.find(x=>x.id===r.order),i=o&&o.items.find(x=>x.uid===r.item);
    return`<div class="req"><span class="thumb tone-danger">${ic('ban')}</span><div><b>درخواست ابطال: ${fa(r.qty)} × ${i?i.name:'؟'} — ${o?O.label(o):''}</b>
      <small class="muted" style="display:block">${O.staff(r.by).name} · ${O.clock(r.at)} · دلیل: ${r.reason} ${i&&i.status==='ready'?'· <b style="color:var(--danger)">آماده شده بود</b>':''}</small></div>
      ${r.status==='pending'?`<div class="row"><button class="btn btn-ghost btn-sm" data-rej="${r.id}">رد</button><button class="btn btn-danger btn-sm" data-rok="${r.id}">${ic('check')}تأیید ابطال</button></div>`:O.b(r.status==='ok'?'تأیید شد':'رد شد',r.status==='ok'?'success':'neutral')}</div>`};
  const bills=S().orders.filter(o=>o.status==='bill');
  return`<div class="grid grid-2"><div class="stack"><h3 class="section-title">ابطال آیتم‌های ارسال‌شده</h3>${R.map(one).join('')||'<p class="muted">درخواستی نیست</p>'}
      ${O.note('ویتر آیتم ارسال‌نشده را خودش حذف می‌کند. آیتمی که به آشپزخانه/بار رفته فقط با تأیید صندوق یا مدیر ابطال می‌شود و برگهٔ «ابطال» برای همان ایستگاه چاپ می‌شود.','shield-check')}</div>
    <div class="stack"><h3 class="section-title">صورتحساب خواسته‌شده</h3>${bills.map(o=>`<div class="req"><span class="thumb tone-warning">${ic('receipt')}</span><div><b>${O.label(o)} — ${t(O.due(o))} تومان</b><small class="muted" style="display:block">${O.staff(o.waiter).name} · ${O.dur(o.openedAt)} حضور</small></div><button class="btn btn-primary btn-sm" data-o="${o.id}">باز کردن</button></div>`).join('')||'<p class="muted">—</p>'}</div></div>`;
}
const ticketHtml=p=>{if(p.html)return p.html;const st=O.st(p.station);return`<div class="ticket"><h4>${p.kind==='صورتحساب'||p.kind==='رسید'?'رایو کافه':st.name}</h4>
  <div class="tc">${p.kind==='ابطال'?'<div class="void">*** ابطال ***</div>':p.kind}</div><hr>
  <div class="tl"><b>${p.label}</b><span>${O.clock(p.at)}</span></div><div class="tl"><span>${O.staff(p.waiter).name}</span><span>${p.printer}</span></div><hr>
  ${p.lines.map(l=>`<div class="tl"><span>${fa(l.qty)} × ${l.name}</span>${l.amount!=null?`<span>${t(l.amount)}</span>`:''}</div>${l.note?`<div class="tn">» ${O.esc(l.note)}</div>`:''}`).join('')}
  ${p.foot?`<hr>${p.foot}`:''}</div>`};
function prints(){
  const L=S().prints.filter(p=>U.pf==='all'||p.station===U.pf).slice(0,24);
  return`<div class="between" style="margin-bottom:var(--s3)"><div class="row" style="flex-wrap:wrap">${[['all','همه'],...S().stations.map(s=>[s.id,s.name])].map(([k,l])=>`<button class="chip ${U.pf===k?'active':''}" data-pf="${k}">${l}</button>`).join('')}</div>
    <span class="muted" style="font-size:12.5px">${fa(S().prints.length)} برگه در این نوبت</span></div>
    <div class="tickets">${L.map(p=>`<div class="stack" style="gap:6px">${ticketHtml(p)}<div class="row"><small class="muted">${p.kds?'+ مانیتور آشپزخانه':''}</small><button class="btn btn-ghost btn-sm" data-rp="${p.id}">${ic('printer')}چاپ دوباره</button></div></div>`).join('')||'<p class="muted">هنوز چیزی چاپ نشده؛ از سفارش‌گیر یا صندوق «ارسال» بزنید.</p>'}</div>`;
}
function settings(){
  const st=S().stations,sv=S().settings;
  return`<div class="grid grid-2">
    <div class="card"><div class="card-head"><h3>ایستگاه‌ها و چاپگرها</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>ایستگاه</th><th>چاپگر</th><th>نشانی</th><th>چاپ</th><th>مانیتور</th><th></th></tr></thead><tbody>
      ${st.map(s=>`<tr><td><b>${s.name}</b></td><td>${s.printer}</td><td class="num">${s.addr}</td>
        <td><label class="switch"><input type="checkbox" data-sw="print:${s.id}" ${s.print?'checked':''}><span></span></label></td>
        <td>${s.bill?'—':`<label class="switch"><input type="checkbox" data-sw="kds:${s.id}" ${s.kds?'checked':''}><span></span></label>`}</td>
        <td><button class="btn btn-ghost btn-sm" data-test="${s.id}">چاپ آزمایشی</button></td></tr>`).join('')}</tbody></table></div>
      <div class="card-body">${O.note('هر ایستگاه می‌تواند چاپگر خودش را داشته باشد، مانیتور داشته باشد، یا هر دو. اگر چاپگری قطع باشد، برگه در صف می‌ماند و صندوق هشدار می‌گیرد (در نسخهٔ واقعی).','printer')}</div></div>
    <div class="card"><div class="card-head"><h3>مسیر هر دسته</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>دستهٔ منو</th><th>ایستگاه</th></tr></thead><tbody>
      ${O.CATS.map(c=>`<tr><td>${c}</td><td><select class="select" data-route="${c}">${st.filter(s=>!s.bill).map(s=>`<option value="${s.id}" ${O.MENU.find(m=>m.cat===c).station===s.id?'selected':''}>${s.name}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div></div>
    <div class="card"><div class="card-head"><h3>صورتحساب و کنترل</h3></div><div class="card-body stack">
      <div class="field"><label>حق سرویس (٪)</label><input class="input" id="svc" value="${fa(sv.service)}"></div>
      <div class="field"><label>مالیات بر ارزش افزوده (٪)</label><input class="input" id="vat" value="${fa(sv.vat)}"><span class="hint">صفر یعنی قیمت‌های منو با مالیات‌اند.</span></div>
      <label class="check"><input type="checkbox" id="vnm" ${sv.voidNeedsManager?'checked':''}><span>ابطال آیتم ارسال‌شده رمز مدیر بخواهد</span></label>
      <button class="btn btn-primary" id="saveSet">${ic('check')}ذخیره</button></div></div>
    <div class="card"><div class="card-head"><h3>زمان‌ها و هشدارها</h3></div><div class="card-body stack">
      <div class="field"><label>میز بیش از این مدت → «ویتر سر بزند» (دقیقه)</label><input class="input" id="sLong" value="${fa(sv.longStayMin)}"><span class="hint">پیش‌فرض ۱۲۰ دقیقه (۲ ساعت)</span></div>
      <div class="field"><label>نشسته بدون سفارش بیش از (دقیقه)</label><input class="input" id="sIdle" value="${fa(sv.noOrderMin)}"></div>
      <div class="form-row3">${['kitchen','bar','cold'].map(k=>`<div class="field"><label>زمان هدف ${O.st(k).name}</label><input class="input" data-tg="${k}" value="${fa(sv.targets[k])}"></div>`).join('')}</div>
      <span class="hint">آیتمی که بیش از زمان هدف ایستگاهش آماده نشود، برای ویتر و صندوق «پیگیری» می‌شود؛ مانیتور آشپزخانه هم با همین زمان زرد و قرمز می‌شود.</span>
      <div class="field"><label>تعداد هم‌زمان پخت یک غذا (برای تخمین صف)</label><input class="input" id="sBatch" value="${fa(sv.batch)}"></div>
      <button class="btn btn-primary" id="saveTimes">${ic('check')}ذخیره</button></div></div>
    <div class="card"><div class="card-head"><h3>دسترسی ویترها در سفارش‌گیر</h3></div><div class="table-wrap"><table class="table no-grid"><thead><tr><th>ویتر</th><th>چاپ صورتحساب</th><th>تسویه</th><th>تخفیف</th></tr></thead><tbody>
      ${O.WAITERS.map(id=>{const p=sv.waiterPerms[id]||{};return`<tr><td>${O.staff(id).name}</td>${['bill','settle','discount'].map(k=>`<td><label class="switch"><input type="checkbox" data-wp="${id}:${k}" ${p[k]?'checked':''}><span></span></label></td>`).join('')}</tr>`}).join('')}</tbody></table></div>
      <div class="card-body">${O.note('در نسخهٔ واقعی این دسترسی‌ها در «پرسنل ← کاربران و دسترسی» تعریف می‌شوند. ابطال آیتم ارسال‌شده همیشه با تأیید صندوق است.','shield-check')}</div></div>
    <div class="card" style="grid-column:1/-1"><div class="card-head"><h3>صورتحساب چاپی</h3><span class="muted" style="font-size:12px">آنچه روی برگهٔ مشتری می‌آید</span></div><div class="card-body bill-set">
      <div class="stack"><div class="form-row2"><div class="field"><label>نام مجموعه</label><input class="input" data-vn="name" value="${O.esc(sv.venue.name)}"></div><div class="field"><label>تلفن</label><input class="input" data-vn="phone" value="${O.esc(sv.venue.phone)}"></div></div>
        <div class="field"><label>نشانی</label><input class="input" data-vn="address" value="${O.esc(sv.venue.address)}"></div>
        <div class="form-row2"><div class="field"><label>رمز Wi-Fi</label><input class="input" data-vn="wifi" value="${O.esc(sv.venue.wifi||'')}"></div><div class="field"><label>پیام پایین</label><input class="input" id="bFoot" value="${O.esc(sv.billFooter)}"></div></div>
        <div class="field"><label>روی صورتحساب نشان بده</label><div class="chips">${O.BILL_FIELDS.map(([k,l])=>`<label class="chip-opt"><input type="checkbox" data-bf="${k}" ${sv.bill[k]?'checked':''}><span>${l}</span></label>`).join('')}</div></div>
        <button class="btn btn-primary" id="saveBill" style="align-self:flex-start">${ic('check')}ذخیرهٔ صورتحساب</button></div>
      <div><small class="muted">پیش‌نمایش (با سفارش نمونه)</small><div id="billPrev">${(()=>{const o=S().orders.find(x=>O.live(x).length&&x.customer)||S().closed[0];return o?O.billHtml(o,'پیش‌فاکتور'):''})()}</div></div></div></div>
    <div class="card"><div class="card-head"><h3>دادهٔ نمونه</h3></div><div class="card-body stack">
      <p class="muted" style="margin:0">این نمونه فقط در همین مرورگر کار می‌کند و با دادهٔ واقعی رایو ارتباطی ندارد. صندوق، سفارش‌گیر و مانیتور آشپزخانه را در چند زبانه باز کنید تا هم‌زمانی را ببینید.</p>
      <button class="btn btn-secondary" id="reset">${ic('rotate-ccw')}بازگرداندن دادهٔ نمونه</button></div></div></div>`;
}

/* ---------- order panel ---------- */
function orderPanel(){
  const o=O.order(U.sel),el=$('#order');
  if(!o){el.innerHTML=`<div class="oempty"><div>${ic('mouse-pointer-click')}<p>یک میز یا سفارش را انتخاب کنید<br><small>میز آزاد ← سفارش جدید</small></p></div></div>`;return}
  const L=o.items,fresh=L.filter(i=>i.status==='new'),rounds=[...new Set(L.filter(i=>i.status!=='new').map(i=>i.round||1))].sort();
  const ist={sent:['در حال آماده‌سازی','warning'],ready:['آماده','success'],served:['سرو شد','neutral'],void:['ابطال','danger']};
  const line=i=>`<div class="oline ${i.status==='void'?'void':''}">
    ${i.status==='new'?`<span class="q"><button data-inc="${i.uid}">${ic('plus')}</button><b>${fa(i.qty)}</b><button data-dec="${i.uid}">${ic('minus')}</button></span>`
      :i.status==='void'?`<span class="q"><b>${fa(i.qty)}×</b></span>`
      :`<span class="q sent" title="+ یکی دیگر از همین (با همان توضیح) · − ابطال یکی"><button data-more="${i.uid}">${ic('plus')}</button><b>${fa(i.qty)}</b><button data-less="${i.uid}">${ic('minus')}</button></span>`}
    <span class="nm">${i.name}${i.hold?'<span class="badge badge-info ist">نگه‌داشته</span>':''}${i.mods&&i.mods.length?`<small style="color:var(--info)">+ ${O.modTxt(i)}</small>`:''}${i.status!=='new'?`<span class="badge badge-${ist[i.status][1]} ist">${ist[i.status][0]}</span>`:''}${i.note?`<small>» ${O.esc(i.note)}</small>`:''}${i.status==='void'?`<small style="color:var(--danger)">${O.esc(i.voidReason)}</small>`:''}</span>
    <span class="pr">${t(i.price*i.qty)}${i.status==='new'?`<button data-nt="${i.uid}" title="توضیح">${ic('message-square')}</button><button data-del="${i.uid}" title="حذف">${ic('trash-2')}</button>`:i.status!=='void'?`<button data-void="${i.uid}" title="ابطال">${ic('ban')}</button>`:''}</span></div>`;
  const c=o.customer&&O.cust(o.customer);
  el.innerHTML=`<div class="ohead"><div class="between"><h2>${O.label(o)}</h2>${o.status==='bill'?O.b('صورتحساب خواسته','danger'):O.b(O.TYPES[o.type][0],'neutral')}</div>
      <div class="ometa"><span>${ic('timer')}${O.dur(o.openedAt)}</span>${o.table?`<span>${ic('users')}${fa(o.guests)} نفر</span>`:''}<span>${ic('user')}${O.staff(o.waiter).name}</span><span>#${fa(o.no)}</span></div>
      ${o.reopened?`<div class="alert alert-danger" style="padding:8px 10px">${ic('rotate-ccw')}<div><b>اصلاح بعد از تسویه</b>${O.esc(o.reopened.reason)} · مبلغ قبلی ${t(o.reopened.before)}</div></div>`:''}
      ${o.type==='staff'?`<small>${ic('id-card')} سفارش پرسنلی: <b>${O.staff(o.staffOf).name}</b> — به حساب پرسنل</small>`:`<button class="btn btn-ghost btn-sm" style="justify-content:flex-start;height:auto;min-height:32px;white-space:normal;text-align:start" data-act="cust">${ic(c?'user-check':'user-plus')}${c?`<span><b>${c.name}</b> · ${fa(c.phone)} · ${fa(c.visits)} بار${c.note?` · <span style="color:var(--warning)">${O.esc(c.note)}</span>`:''}</span>`:'شمارهٔ مشتری (باشگاه)'}</button>`}
      ${c&&(c.pct||c.credit||O.debt(c.id))?`<div class="row club-row">${c.pct?`<span class="badge badge-accent">${ic('percent')}${fa(c.pct)}٪ باشگاه</span>${o.discount?'':`<button class="btn btn-secondary btn-sm" data-act="club">اعمال تخفیف</button>`}`:''}${c.credit?`<span class="badge badge-success">${ic('gift')}اعتبار ${t(c.credit)}</span>`:''}${O.debt(c.id)>0?`<span class="badge badge-danger">${ic('notebook-pen')}بدهی ${t(O.debt(c.id))}</span>`:''}</div>`:''}
      ${o.address?`<small class="muted">${ic('map-pin')} ${O.esc(o.address)}</small>`:''}
      ${o.type==='delivery'?dispatchBar(o):''}
      <div class="row" style="font-size:12px"><span class="muted">فهرست قیمت:</span>${Object.entries(O.PRICE_LISTS).map(([k,[l]])=>`<button class="chip ${(o.priceList||'normal')===k?'active':''}" style="height:26px" data-pl="${k}">${l}</button>`).join('')}</div>
      ${(o.flags||[]).length?`<small style="color:var(--danger)">${ic('shield-alert')} ${o.flags.map(x=>x.t).join(' · ')}</small>`:''}</div>
    <div class="olist">${!L.length?'<p class="muted" style="text-align:center;margin-top:var(--s6)">سفارش خالی است. «افزودن» را بزنید.</p>':''}
      ${rounds.map(r=>`<div class="ogroup">نوبت ${fa(r)} · ${O.clock(L.find(i=>(i.round||1)===r&&i.sentAt)?.sentAt||o.openedAt)}</div>${L.filter(i=>i.status!=='new'&&(i.round||1)===r).map(line).join('')}`).join('')}
      ${fresh.length?`<div class="ogroup" style="color:var(--accent)">جدید — هنوز ارسال نشده${fresh.some(i=>i.hold)&&fresh.some(i=>!i.hold)?' · نگه‌داشته‌ها با «ارسال» نمی‌روند':''}</div>${fresh.map(line).join('')}`:''}</div>
    <div class="otot"><div class="between"><span>جمع</span><span class="num">${t(O.sub(o))}</span></div>
      ${o.discount?`<div class="between" style="color:var(--success)"><span>تخفیف (${O.esc(o.discount.reason)})</span><span class="num">−${t(O.disc(o))}</span></div>`:''}
      ${S().settings.service+S().settings.vat?`<div class="between"><span>سرویس و مالیات</span><span class="num">${t(O.total(o)-O.sub(o)+O.disc(o))}</span></div>`:''}
      ${O.paid(o)?`<div class="between"><span>پرداخت‌شده</span><span class="num">${t(O.paid(o))}</span></div>`:''}
      <div class="between big"><span>${O.paid(o)?'مانده':'قابل پرداخت'}</span><span class="num">${t(O.due(o))}</span></div></div>
    <div class="oact">
      <button class="btn btn-secondary wide" data-act="add">${ic('plus')}افزودن</button>
      ${o.reopened&&fresh.length?`<button class="btn btn-primary wide" data-act="served">${ic('check-check')}ثبت سرو‌شده (${fa(fresh.reduce((a,i)=>a+i.qty,0))})</button>`
      :fresh.some(i=>!i.hold)||!fresh.length?`<button class="btn btn-primary wide" data-act="send" ${fresh.some(i=>!i.hold)?'':'disabled'}>${ic('send')}ارسال ${fresh.some(i=>!i.hold)?'('+fa(fresh.filter(i=>!i.hold).reduce((a,i)=>a+i.qty,0))+')':''}</button>`:`<button class="btn btn-primary wide" data-act="fire">${ic('flame')}اجرا (${fa(fresh.filter(i=>i.hold).reduce((a,i)=>a+i.qty,0))} نگه‌داشته)</button>`}
      ${o.table?`<button class="btn btn-ghost" data-act="move">${ic('arrow-left-right')}تغییر میز</button><button class="btn btn-ghost" data-act="merge">${ic('merge')}ادغام</button>`:''}
      <button class="btn btn-ghost" data-act="items">${ic('split')}انتقال آیتم</button>
      ${o.table?`<button class="btn btn-ghost" data-act="guests">${ic('users')}نفرات</button>`:''}
      <button class="btn btn-ghost" data-act="disc">${ic('percent')}تخفیف</button>
      <button class="btn btn-ghost" data-act="bill" title="صورتحساب را پیش از پرداخت چاپ کنید و به مشتری بدهید">${ic('printer')}چاپ صورتحساب</button>
      ${o.reopened?'':`<button class="btn btn-ghost" data-act="cancel">${ic('x-circle')}لغو</button>`}
      <button class="btn btn-ghost" data-act="log">${ic('history')}سابقه</button>
      <button class="btn btn-secondary wide" data-act="split" ${O.due(o)>0?'':'disabled'}>${ic('divide')}پرداخت جدا</button>
      ${O.due(o)<0?`<button class="btn btn-danger wide" data-act="pay" ${fresh.length?'disabled':''}>${ic('undo-2')}بازپرداخت ${t(-O.due(o))}</button>`
      :o.reopened&&O.due(o)===0?`<button class="btn btn-primary wide" data-act="refix" ${fresh.length?'disabled':''}>${ic('check')}بستن اصلاحیه</button>`
      :`<button class="btn btn-primary wide" data-act="pay" ${O.due(o)>0&&!fresh.length?'':'disabled'} style="background:var(--success);border-color:var(--success)">${ic('wallet')}تسویه</button>`}
    </div>`;
}

/* ---------- actions ---------- */
const sel=id=>{U.sel=id;render()};
function openTable(tid){
  const x=O.table(tid),r=S().reserved[tid];
  O.form({title:'باز کردن میز '+fa(x.no),ok:'باز کن و سفارش بگیر',body:`${r?O.note(`رزرو: ${r.name} · ${r.at} · ${fa(r.guests)} نفر`,'calendar-clock'):''}
    <div class="field"><label>تعداد نفرات</label><input class="input" name="g" value="${fa(r?r.guests:Math.min(2,x.seats))}"></div>
    <div class="field"><label>ویتر</label><select class="select" name="w">${O.WAITERS.map(id=>`<option value="${id}">${O.staff(id).name}</option>`).join('')}</select></div>`,
    onOk:f=>{const o=O.newOrder({table:tid,guests:+O.en(f.g.value)||1,waiter:f.w.value});O.log(o,'میز باز شد',ME);U.sel=o.id;U.view='menu'}});
}
function openOff(type){
  if(type==='staff'){
    O.form({title:'سفارش پرسنلی',ok:'ثبت و افزودن آیتم',body:`<div class="field"><label>برای</label><select class="select" name="sf">${D.STAFF.map(s=>`<option value="${s.id}">${s.name} — ${s.role}</option>`).join('')}</select></div>
      ${O.note('قیمت «پرسنلی» اعمال می‌شود و مبلغ به حساب همین نفر می‌رود (نه فروش مشترکین). در «سفارش‌های امروز» و گزارش جدا دیده می‌شود.','id-card')}`,
      onOk:f=>{const o=O.newOrder({type:'staff',table:null,guests:0,waiter:ME,staffOf:f.sf.value,priceList:'staff'});O.log(o,'سفارش پرسنلی: '+O.staff(f.sf.value).name,ME);U.sel=o.id;U.view='menu'}});return}
  O.form({title:'سفارش '+O.TYPES[type][0],ok:'ثبت و افزودن آیتم',body:`<div class="field"><label>تلفن مشتری ${type==='delivery'?'':'(اختیاری)'}</label><input class="input" name="ph" id="oph" placeholder="۰۹۱۲…" inputmode="tel"></div><div id="ocres"></div>
    <div class="field"><label>نام (برای مشتری جدید)</label><input class="input" name="nm"></div>
    ${type==='delivery'?`<div class="field"><label>نشانی</label><textarea class="textarea" name="ad" rows="2"></textarea></div><div class="field"><label>پیک</label><select class="select" name="cr"><option value="s9">${O.staff('s9').name}</option><option value="">پیک بیرونی</option></select></div>`:''}`,
    onMount:m=>{const f=$('form',m),u=()=>{custBox(f.ph.value,$('#ocres',m));const c=O.findPhone(f.ph.value);if(c&&type==='delivery'&&!f.ad.value){const a=O.custOrders(c.id).map(o=>o.address).filter(Boolean)[0];if(a)f.ad.value=a}};f.ph.oninput=u},
    onOk:f=>{const ph=O.en(f.ph.value).replace(/\D/g,'');let c=O.findPhone(ph);
      if(type==='delivery'&&!f.ad.value.trim()){O.toast('نشانی لازم است','alert-triangle');return false}
      if(ph&&!c)c=O.newCust(ph,f.nm.value.trim());
      const o=O.newOrder({type,table:null,guests:0,waiter:ME,customer:c?c.id:null,address:f.ad?f.ad.value.trim():undefined,courier:f.cr?f.cr.value:undefined,dispatch:type==='delivery'?{status:'prep'}:undefined});
      U.sel=o.id;U.view='menu'}});
}
function modsHtml(st,cur){return(O.MODS[st]||[]).map((g,k)=>`<div class="field"><label>${g.g}${g.one?'':' (چندتایی)'}</label><div class="chips">${g.opts.map(([n,pr],j)=>`<label class="chip-opt"><input type="${g.one?'radio':'checkbox'}" name="md${k}" value="${j}" ${(cur||[]).some(x=>x[0]===n)||(g.one&&!j&&!(cur||[]).some(x=>g.opts.some(z=>z[0]===x[0])))?'checked':''}><span>${n}${pr?' +'+t(pr):''}</span></label>`).join('')}</div></div>`).join('')}
function readMods(f,st){const out=[];(O.MODS[st]||[]).forEach((g,k)=>O.vals(f,'md'+k).forEach(j=>{const[n,pr]=g.opts[+j];if(pr||!g.one)out.push([n,pr])}));return out}
function noteFor(o,item,mid){
  const m=item?O.mi(item.mid):O.mi(mid);
  O.form({title:(item?'ویرایش ':'افزودن ')+m.name,ok:item?'ذخیره':'افزودن',body:`${modsHtml(m.station,item&&item.mods)}<div class="field"><label>توضیح سریع</label>${O.chips('n',O.NOTES[m.station]||O.NOTES.kitchen,true)}</div>
    <div class="field"><label>توضیح آزاد</label><input class="input" name="free" value="${item?O.esc(item.note):''}" placeholder="مثلاً: بشقاب جدا برای کودک"></div>
    ${item?'':'<label class="check"><input type="checkbox" name="hold"><span><b>نگه‌دار تا اعلام</b> <small class="muted">(مثلاً غذای اصلی بعد از پیش‌غذا؛ با «اجرا» ارسال می‌شود)</small></span></label>'}`,
    onOk:f=>{const n=[...O.vals(f,'n'),f.free.value.trim()].filter(Boolean).join('، '),md=readMods(f,m.station);
      if(item){const base=O.unit(o,m);item.note=n;item.mods=md;item.price=base+md.reduce((a,x)=>a+x[1],0)}else O.addItem(o,mid,n,ME,md,f.hold.checked)}});
}
function managerPin(){return S().settings.voidNeedsManager?`<div class="field"><label>رمز مدیر</label><input class="input" name="pin" type="password" inputmode="numeric" placeholder="••••"><span class="hint">در نمونه هر چهار رقم پذیرفته می‌شود.</span></div>`:''}
const pinOk=f=>!S().settings.voidNeedsManager||(O.en(f.pin.value).length>=4||(O.toast('رمز مدیر لازم است','lock'),false));
function voidItem(o,i,q0){
  O.form({title:'ابطال '+i.name,ok:'ابطال',tone:'danger',body:`${i.status==='ready'||i.status==='served'?O.note(o.reopened?'آیتم در فیش بوده ولی مشتری نگرفته: ابطال آن مبلغ را کم می‌کند و ضایعه ثبت نمی‌شود.':'این آیتم آماده/سرو شده؛ ابطال آن ضایعه ثبت می‌شود.','alert-triangle','warning'):''}
    ${i.qty>1?`<div class="field"><label>تعداد ابطال</label><input class="input" name="q" value="${fa(q0||i.qty)}"></div>`:''}
    <div class="field"><label>دلیل</label>${O.chips('r',O.VOID_REASONS)}</div>${managerPin()}`,
    onOk:f=>{const r=O.vals(f,'r')[0];if(!r){O.toast('دلیل را انتخاب کنید','alert-triangle');return false}if(!pinOk(f))return false;
      O.voidItem(o,i.uid,f.q?+O.en(f.q.value):i.qty,r,ME);O.toast('ابطال شد؛ برگهٔ ابطال برای '+O.st(i.station).name+' چاپ شد','ban')}});
}
function pickTable(title,filter,onPick,note){
  O.modal({title,size:'modal-lg',body:`${note?O.note(note,'info'):''}<div class="tgrid">${O.TABLES.filter(filter).map(x=>{const s=O.tstate(x);return`<button class="tcard st-${s}" data-pk="${x.id}" style="min-height:80px"><span class="tno">${fa(x.no)}</span><small>${O.AREAS.find(a=>a.id===x.area).name} · ${O.TSTATE[s][0]}</small></button>`}).join('')}</div>`,
    onMount:m=>$$('[data-pk]',m).forEach(b=>b.onclick=()=>{onPick(b.dataset.pk);O.close();O.save()})});
}
/* methods offered for this order: «حساب پرسنل» only on staff orders; «اعتبار باشگاه» only when the customer has credit; refunds only to money methods */
const methodsFor=(o,refund)=>{const c=o.customer&&O.cust(o.customer);
  if(o.type==='staff'&&!refund)return['staff','cash','card','transfer'];
  return Object.keys(O.PAY).filter(k=>k!=='staff'&&(k!=='club'||(c&&c.credit>0&&!refund))&&(k!=='credit'||c))};
function payForm(o,amount,itemUids){
  if(O.due(o)<0)return refundForm(o);
  const due=amount||O.due(o),meth=methodsFor(o),c=o.customer&&O.cust(o.customer);
  O.form({title:'تسویه — '+O.label(o),ok:'ثبت پرداخت',size:'modal-lg',body:`<div class="sum-box between" style="padding:var(--s3);border-radius:12px;background:var(--surface-3)"><span>مبلغ این پرداخت</span><b class="num" style="font-size:20px">${t(due)} تومان</b></div>
    ${c?`<div class="row" style="flex-wrap:wrap;font-size:12.5px">${ic('user-check')}<b>${O.esc(c.name)}</b>${c.credit?O.b('اعتبار باشگاه '+t(c.credit),'success'):''}${O.debt(c.id)>0?O.b('بدهی قبلی '+t(O.debt(c.id)),'danger'):''}${c.pct&&!o.discount?`<button type="button" class="btn btn-ghost btn-sm" data-clubnow>اعمال تخفیف باشگاه ${fa(c.pct)}٪</button>`:''}</div>`:''}
    <div id="pls" class="stack" style="gap:8px"></div>
    <button type="button" class="btn btn-ghost btn-sm" id="addPl" style="align-self:flex-start">${ic('plus')}روش دیگر (پرداخت ترکیبی)</button>
    <div class="between"><span>مانده</span><b id="rest" class="num">${t(due)}</b></div>
    <details><summary style="cursor:pointer;font-weight:600">${ic('hand-heart')} انعام روی کارت / انتقال</summary><div class="stack mt" style="gap:8px">
      <div class="field"><label>مبلغ انعام (جدا از صورتحساب)</label><input class="input" name="tip" placeholder="۰"></div>
      <div class="field"><label>برای</label>${O.chips('tt',['سالن همان شیفت','برای همه','شخصی'])}</div>
      <span class="hint muted">به سامانهٔ انعام پنل می‌رود (پرسنل ← انعام). انعام نقدی را این‌جا نزنید.</span></div></details>`,
    onMount:m=>{const box=$('#pls',m);
      const add=(k,v)=>{const d=document.createElement('div');d.className='row';d.innerHTML=`<select class="select" style="width:170px">${meth.map(x=>`<option value="${x}" ${x===k?'selected':''}>${O.PAY[x][0]}</option>`).join('')}</select><input class="input pa" value="${fa(v)}" style="flex:1"><input class="input pg" placeholder="دریافتی نقد" style="width:140px;${k==='cash'?'':'display:none'}"><small class="ch muted" style="width:110px"></small>`;
        box.appendChild(d);const s=$('select',d);s.onchange=()=>{$('.pg',d).style.display=s.value==='cash'?'':'none'};d.oninput=calc;calc()};
      const calc=()=>{let sum=0;$$('#pls .row',m).forEach(r=>{const a=+O.en($('.pa',r).value).replace(/\D/g,'')||0;sum+=a;const g=+O.en($('.pg',r).value).replace(/\D/g,'')||0;$('.ch',r).textContent=g>a?'باقی: '+t(g-a):''});
        $('#rest',m).textContent=t(due-sum);$('#rest',m).style.color=due-sum?'var(--danger)':'var(--success)'};
      add(meth[0]==='staff'?'staff':'card',due);$('#addPl',m).onclick=()=>add('cash',0);m.oninput=calc;
      const cb=$('[data-clubnow]',m);cb&&(cb.onclick=()=>{O.applyClub(o,ME);O.close();O.save();payForm(o)})},
    onOk:f=>{const rows=$$('#pls .row').map(r=>({method:$('select',r).value,amount:+O.en($('.pa',r).value).replace(/\D/g,'')||0})).filter(r=>r.amount>0);
      const sum=rows.reduce((a,r)=>a+r.amount,0);if(sum!==due){O.toast('جمع پرداخت با مبلغ برابر نیست','alert-triangle');return false}
      const tip=+O.en(f.tip.value).replace(/\D/g,'')||0;if(tip){o.tips=(o.tips||[]).concat({amount:tip,target:O.vals(f,'tt')[0]||'سالن همان شیفت'})}
      const r=O.pay(o,rows,ME,{items:itemUids});if(!r.ok){O.toast(r.msg,'alert-triangle');return false}
      if(r.closed){U.sel=null;O.toast('تسویه شد؛ رسید چاپ شد'+(o.table?' و میز آزاد شد':''),'check-circle')}
      else O.toast('پرداخت ثبت شد؛ مانده '+t(O.due(o)),'wallet')}});
}
/* reopened order whose total went down: give the difference back */
function refundForm(o){const back=-O.due(o),meth=methodsFor(o,true).filter(k=>k!=='club');
  O.form({title:'بازپرداخت — '+O.label(o),ok:'ثبت بازپرداخت',tone:'danger',body:`<div class="between"><span>مبلغ قبلی</span><b class="num">${t(o.reopened?o.reopened.before:O.paid(o))}</b></div><div class="between"><span>مبلغ جدید</span><b class="num">${t(O.total(o))}</b></div>
    <div class="between big"><span>قابل برگشت</span><b class="num" style="color:var(--danger)">${t(back)}</b></div>
    <div class="field"><label>برگشت با</label><select class="select" name="m">${meth.map(k=>`<option value="${k}" ${o.payments.some(p=>p.method===k)?'selected':''}>${O.PAY[k][0]}</option>`).join('')}</select><span class="hint">«نسیه» یعنی از بدهی مشتری کم شود.</span></div>`,
    onOk:f=>{const r=O.pay(o,[{method:f.m.value,amount:-back}],ME);if(!r.ok){O.toast(r.msg,'alert-triangle');return false}U.sel=null;O.toast('بازپرداخت ثبت شد؛ اصلاحیه چاپ شد','undo-2')}})}
const ACT={
  add:o=>{U.view='menu';render()},
  fire:o=>{const n=O.send(o,ME,true);O.save();O.toast(`${fa(n)} قلم نگه‌داشته اجرا شد`,'flame')},
  send:o=>{const n=O.send(o,ME);O.save();O.toast(`${fa(n)} قلم ارسال شد؛ برگه برای هر ایستگاه چاپ شد`,'send')},
  move:o=>pickTable('تغییر میز '+O.label(o),x=>x.id!==o.table,tid=>{const other=O.atTable(tid);
    if(other){mergeInto(other,o);return}const from=O.table(o.table).no;o.table=tid;O.log(o,`انتقال از میز ${fa(from)} به میز ${fa(O.table(tid).no)}`,ME);
    [...new Set(O.live(o).filter(i=>i.status==='sent'||i.status==='ready').map(i=>i.station))].forEach(st=>O.ticket(o,st,[{name:'انتقال میز',qty:1,note:'از میز '+fa(from)+' به میز '+fa(O.table(tid).no)}],'انتقال',ME));O.toast('میز تغییر کرد')},'میز پر را انتخاب کنید تا دو سفارش ادغام شوند.'),
  merge:o=>pickTable('ادغام با '+O.label(o),x=>x.id!==o.table&&!!O.atTable(x.id),tid=>mergeInto(o,O.atTable(tid)),'سفارش میز انتخابی به این سفارش اضافه می‌شود و میز آن آزاد می‌شود.'),
  items:o=>{const L=O.live(o).filter(i=>!i.paid);
    O.modal({title:'انتقال آیتم از '+O.label(o),body:`<div class="stack" style="gap:6px">${L.map(i=>`<label class="check"><input type="checkbox" value="${i.uid}"><span>${fa(i.qty)} × ${i.name}</span></label>`).join('')}</div><p class="muted" style="margin:0">بعد از انتخاب، میز مقصد را بزنید (آزاد یا پر).</p>`,
      foot:`<button class="btn btn-ghost" data-close>انصراف</button><button class="btn btn-primary" id="goT">انتخاب میز مقصد</button>`,
      onMount:m=>$('#goT',m).onclick=()=>{const ids=$$('input:checked',m).map(x=>x.value);if(!ids.length){O.toast('آیتمی انتخاب نشده','alert-triangle');return}
        pickTable('میز مقصد',x=>x.id!==o.table,tid=>{const to=O.atTable(tid)||O.newOrder({table:tid,guests:1,waiter:o.waiter});
          const mv=o.items.filter(i=>ids.includes(i.uid));o.items=o.items.filter(i=>!ids.includes(i.uid));to.items.push(...mv);
          O.log(o,`انتقال ${fa(mv.length)} آیتم به ${O.label(to)}`,ME);O.log(to,`دریافت ${fa(mv.length)} آیتم از ${O.label(o)}`,ME);O.toast('آیتم‌ها منتقل شدند')})}})},
  guests:o=>O.form({title:'تعداد نفرات',body:`<input class="input" name="g" value="${fa(o.guests)}">`,onOk:f=>{o.guests=+O.en(f.g.value)||o.guests}}),
  disc:o=>O.form({title:'تخفیف — '+O.label(o),ok:'اعمال',body:`<div class="row">${O.chips('k',['درصد','مبلغ'])}<input class="input" name="v" placeholder="مقدار" style="flex:1"></div>
    <div class="field"><label>دلیل (الزامی)</label>${O.chips('r',['مشتری دائمی','جبران تأخیر','پرسنل','مهمان مدیر','کد تخفیف'])}</div>
    ${O.note('تخفیف بیش از ۲۰٪ تأیید مدیر می‌خواهد و در گزارش «تخفیف‌ها» دیده می‌شود.','shield-check')}${o.discount?'<button type="button" class="btn btn-ghost btn-sm" data-rm style="align-self:flex-start">حذف تخفیف فعلی</button>':''}`,
    onMount:m=>{const r=$('[data-rm]',m);r&&(r.onclick=()=>{o.discount=null;O.close();O.save()})},
    onOk:f=>{const k=O.vals(f,'k')[0],v=+O.en(f.v.value).replace(/\D/g,''),r=O.vals(f,'r')[0];if(!k||!v||!r){O.toast('نوع، مقدار و دلیل را بزنید','alert-triangle');return false}
      o.discount={kind:k==='درصد'?'pct':'amt',value:v,reason:r};O.log(o,`تخفیف ${k==='درصد'?fa(v)+'٪':t(v)} — ${r}`,ME)}}),
  bill:o=>{if(o.items.some(i=>i.status==='new')){O.toast('اول آیتم‌های جدید را ارسال یا حذف کنید','alert-triangle');return}
    const again=S().prints.some(p=>p.order===o.id&&p.kind==='پیش‌فاکتور');if(!o.reopened)o.status='bill';
    O.printBill(o,'پیش‌فاکتور',ME);if(again)O.flag(o,'چاپ دوبارهٔ صورتحساب');
    O.log(o,'صورتحساب چاپ شد'+(again?' (دوباره)':''),ME);O.save();O.modal({title:'صورتحساب چاپ شد',body:`<div style="display:grid;place-items:center">${S().prints[0].html}</div>`,foot:`<button class="btn btn-ghost" data-close>بستن</button><button class="btn btn-primary" data-act="pay" onclick="document.getElementById('opModal').classList.remove('open')">${ic('wallet')}تسویه</button>`})},
  club:o=>{O.applyClub(o,ME);O.save();O.toast('تخفیف باشگاه اعمال شد','percent')},
  served:o=>{const n=O.recordServed(o,ME);O.save();O.toast(fa(n)+' قلم بدون ارسال به آشپزخانه ثبت شد','check-check')},
  refix:o=>{O.finish(o,ME);U.sel=null;O.save();O.toast('اصلاحیه بسته شد','check')},
  cancel:o=>{const sent=O.live(o).some(i=>i.status!=='new');
    O.form({title:'لغو '+O.label(o),ok:'لغو سفارش',tone:'danger',body:sent?`${O.note('این سفارش آیتم ارسال‌شده دارد؛ همه ابطال و برگهٔ ابطال برای ایستگاه‌ها چاپ می‌شود.','alert-triangle','warning')}<div class="field"><label>دلیل</label>${O.chips('r',O.VOID_REASONS)}</div>${managerPin()}`:'<p style="margin:0">سفارش هنوز ارسال نشده و بدون اثر حذف می‌شود.</p>',
      onOk:f=>{if(sent){const r=O.vals(f,'r')[0];if(!r){O.toast('دلیل را انتخاب کنید','alert-triangle');return false}if(!pinOk(f))return false;O.live(o).forEach(i=>O.voidItem(o,i.uid,i.qty,r,ME))}
        o.status='cancel';o.closedAt=Date.now();S().orders=S().orders.filter(x=>x!==o);if(sent)S().closed.unshift(o);U.sel=null;O.toast('سفارش لغو شد')}})},
  log:o=>O.modal({title:'سابقهٔ '+O.label(o),body:`<div class="list">${o.log.map(l=>`<div class="list-item"><div class="grow"><b style="font-size:13px">${O.esc(l.text)}</b><small class="muted" style="display:block">${O.staff(l.by).name} · ${O.clock(l.at)}</small></div></div>`).join('')||'<p class="muted">—</p>'}</div>
    ${O.note('هیچ ثبتی پاک نمی‌شود؛ ابطال، انتقال و تخفیف با نام و ساعت می‌ماند.','shield-check')}`}),
  cust:o=>custForm(o),
  split:o=>{const L=O.live(o).filter(i=>!i.paid);
    O.modal({title:'پرداخت جدا — '+O.label(o),body:`<div class="segmented" id="sm"><button class="active" data-m="i">بر اساس آیتم</button><button data-m="e">مساوی بین نفرات</button></div>
      <div id="smI" class="stack" style="gap:6px">${L.map(i=>`<label class="check"><input type="checkbox" value="${i.uid}" data-a="${i.price*i.qty}"><span>${fa(i.qty)} × ${i.name} — ${t(i.price*i.qty)}</span></label>`).join('')}</div>
      <div id="smE" style="display:none" class="row"><span>تعداد نفرات</span><input class="input" id="sn" value="${fa(o.guests||2)}" style="width:80px"><b id="se" class="num"></b></div>
      <div class="between"><span>این پرداخت</span><b id="sv" class="num">۰</b></div>`,
      foot:`<button class="btn btn-ghost" data-close>انصراف</button><button class="btn btn-primary" id="sgo">پرداخت این سهم</button>`,
      onMount:m=>{let mode='i';const amt=()=>mode==='i'?$$('#smI input:checked',m).reduce((a,x)=>a+ +x.dataset.a,0):Math.ceil(O.due(o)/(+O.en($('#sn',m).value)||1)/1000)*1000;
        const upd=()=>{$('#sv',m).textContent=t(Math.min(amt(),O.due(o)));$('#se',m).textContent='هر نفر '+t(Math.ceil(O.due(o)/(+O.en($('#sn',m).value)||1)/1000)*1000)};
        $$('#sm button',m).forEach(b=>b.onclick=()=>{mode=b.dataset.m;$$('#sm button',m).forEach(x=>x.classList.toggle('active',x===b));$('#smI',m).style.display=mode==='i'?'':'none';$('#smE',m).style.display=mode==='e'?'':'none';upd()});
        m.oninput=upd;m.onchange=upd;upd();
        $('#sgo',m).onclick=()=>{const a=Math.min(amt(),O.due(o));if(!a){O.toast('سهمی انتخاب نشده','alert-triangle');return}O.close();payForm(o,a,mode==='i'?$$('#smI input:checked',m).map(x=>x.value):null)}}})},
  pay:o=>payForm(o)
};
function mergeInto(to,from){to.items.push(...from.items);to.guests+=from.guests;from.items=[];from.status='merged';from.closedAt=Date.now();
  S().orders=S().orders.filter(x=>x!==from);S().closed.unshift(from);O.log(to,`ادغام ${O.label(from)} در این سفارش`,ME);U.sel=to.id;O.toast('دو سفارش ادغام شدند')}
/* customer card from a phone number: existing → club %, credit, debt, history; new → will be added to the club */
function custBox(ph,box){const c=O.findPhone(ph),n=O.en(ph||'').replace(/\D/g,'').length;
  box.innerHTML=c?`<div class="alert alert-success">${ic('user-check')}<div><b>${O.esc(c.name)}</b> · ${fa(c.visits)} بار · آخرین ${fa(c.last)} · خرید کل ${t(c.spend)}
    <div class="row" style="flex-wrap:wrap;margin-top:4px">${c.pct?O.b(fa(c.pct)+'٪ تخفیف باشگاه','accent'):''}${c.credit?O.b('اعتبار '+t(c.credit),'success'):''}${O.debt(c.id)>0?O.b('بدهی '+t(O.debt(c.id)),'danger'):''}${c.tags.map(x=>O.b(x,'neutral')).join('')}</div>
    ${c.note?`<span style="color:var(--warning)">${O.esc(c.note)}</span>`:''}</div></div>`:n>=10?`<div class="alert alert-info">${ic('user-plus')}<div>مشتری جدید — با ثبت، عضو باشگاه می‌شود.</div></div>`:n>=4?'<span class="muted">شماره را کامل کنید</span>':''}
function custForm(o){const c0=o.customer&&O.cust(o.customer);
  O.form({title:'مشتری و باشگاه',ok:'ثبت',body:`<div class="field"><label>تلفن</label><input class="input" name="ph" id="cph" inputmode="tel" placeholder="۰۹۱۲…" value="${c0?fa(c0.phone):''}"></div><div id="cres"></div>
    <div class="field"><label>نام</label><input class="input" name="nm" value="${c0?O.esc(c0.name):''}"></div><div class="field"><label>یادداشت ثابت (حساسیت، ترجیح)</label><input class="input" name="nt" value="${c0?O.esc(c0.note):''}"></div>
    <label class="check"><input type="checkbox" name="club" ${o.discount?'disabled':''}><span>تخفیف باشگاه این مشتری روی همین سفارش اعمال شود <small class="muted">(اگر مشتری بخواهد؛ اعتبار باشگاه هنگام تسویه انتخاب می‌شود)</small></span></label>`,
    onMount:m=>{const f=$('form',m),u=()=>{custBox(f.ph.value,$('#cres',m));const c=O.findPhone(f.ph.value);if(c){f.nm.value=c.name;f.nt.value=c.note}};f.ph.oninput=u;custBox(f.ph.value,$('#cres',m))},
    onOk:f=>{const ph=O.en(f.ph.value).replace(/\D/g,'');if(!ph){o.customer=null;return}
      if(ph.length<10&&!O.findPhone(ph)){O.toast('شمارهٔ کامل لازم است','alert-triangle');return false}
      let c=O.findPhone(ph);if(!c)c=O.newCust(ph,f.nm.value.trim());else if(f.nm.value.trim())c.name=f.nm.value.trim();
      c.note=f.nt.value.trim();o.customer=c.id;O.log(o,'مشتری: '+c.name,ME);if(f.club.checked&&!O.applyClub(o,ME))O.toast('این مشتری تخفیف باشگاه ندارد','info')}});
}
function custNew(){O.form({title:'مشتری جدید (باشگاه)',body:`<div class="field"><label>تلفن</label><input class="input" name="ph" inputmode="tel"></div><div id="nres"></div><div class="field"><label>نام</label><input class="input" name="nm"></div><div class="field"><label>درصد تخفیف باشگاه</label><input class="input" name="p" value="۰"></div>`,
  onMount:m=>{const f=$('form',m);f.ph.oninput=()=>custBox(f.ph.value,$('#nres',m))},
  onOk:f=>{const ph=O.en(f.ph.value).replace(/\D/g,'');if(ph.length<10){O.toast('شمارهٔ کامل لازم است','alert-triangle');return false}if(O.findPhone(ph)&&O.findPhone(ph).phone===ph){O.toast('این شماره قبلاً ثبت شده','alert-triangle');return false}
    const c=O.newCust(ph,f.nm.value.trim());c.pct=Math.min(100,O.int(f.p.value));O.toast('عضو باشگاه شد','user-check')}})}
/* customers tab: who ordered today and how (dine / counter / takeaway / delivery), club, credit, debt */
function customers(){
  const q=(U.cq||'').trim(),C=S().customers.filter(c=>!q||c.name.includes(q)||c.phone.includes(O.en(q)));
  const by=c=>{const n={};O.custOrders(c.id).forEach(o=>n[o.type]=(n[o.type]||0)+1);return n};
  const fil=U.cty||'all',rows=C.map(c=>({c,n:by(c)})).filter(x=>fil==='all'||(fil==='debt'?O.debt(x.c.id)>0:x.n[fil]));
  return`<div class="between" style="margin-bottom:var(--s3);flex-wrap:wrap"><div class="row" style="flex-wrap:wrap">${[['all','همه'],['dine','سالن'],['counter','حضوری'],['take','بیرون‌بر'],['delivery','پیک'],['debt','بدهکار']].map(([k,l])=>`<button class="chip ${fil===k?'active':''}" data-cty="${k}">${l}</button>`).join('')}</div>
    <div class="row"><div class="search" style="width:240px">${ic('search')}<input class="input" id="cq" placeholder="نام یا شماره…" value="${O.esc(U.cq||'')}"></div><button class="btn btn-primary btn-sm" data-cnew>${ic('user-plus')}مشتری جدید</button></div></div>
  <div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>مشتری</th><th class="num">تلفن</th><th>امروز (نوع سفارش)</th><th class="num">دفعات</th><th class="num">خرید کل</th><th class="num">تخفیف</th><th class="num">اعتبار</th><th class="num">بدهی</th><th></th></tr></thead><tbody>
    ${rows.map(({c,n})=>`<tr><td><b>${O.esc(c.name)}</b> ${c.tags.map(x=>O.b(x,'neutral')).join(' ')}</td><td class="num">${fa(c.phone)}</td>
      <td>${Object.entries(n).map(([k,v])=>`<span class="badge badge-neutral">${ic(O.TYPES[k][1],'ti')}${O.TYPES[k][0]} ${fa(v)}</span>`).join(' ')||'<span class="muted">—</span>'}</td>
      <td class="num">${fa(c.visits)}</td><td class="num">${t(c.spend)}</td><td class="num">${c.pct?fa(c.pct)+'٪':'—'}</td><td class="num">${c.credit?t(c.credit):'—'}</td>
      <td class="num" style="${O.debt(c.id)>0?'color:var(--danger);font-weight:700':''}">${O.debt(c.id)?t(O.debt(c.id)):'—'}</td>
      <td class="row-act"><button class="btn btn-ghost btn-sm" data-cv="${c.id}">${ic('folder-open')}پرونده</button></td></tr>`).join('')||'<tr><td colspan="9" class="muted">—</td></tr>'}</tbody></table></div></div>
  ${O.note('نوع هر سفارش (سالن، حضوری، بیرون‌بر، پیک) روی خود سفارش ثبت می‌شود، پس یک مشتری می‌تواند هم حضوری باشد هم بیرون‌بر و گزارش هر نوع جداست. بدهی از دفتر نسیه حساب می‌شود و پاک نمی‌شود.','info')}`}
function custView(c){const L=O.custOrders(c.id).sort((a,b)=>b.openedAt-a.openedAt),led=(S().ledger||[]).filter(l=>l.cust===c.id).sort((a,b)=>b.at-a.at);
  O.modal({title:'پروندهٔ '+O.esc(c.name),size:'modal-lg',body:`<div class="grid grid-4">${[['تلفن',fa(c.phone)],['تخفیف باشگاه',c.pct?fa(c.pct)+'٪':'—'],['اعتبار',t(c.credit||0)],['بدهی',t(O.debt(c.id))]].map(([a,b])=>`<div class="card kpi"><div class="kpi-label">${a}</div><div class="kpi-value" style="font-size:18px">${b}</div></div>`).join('')}</div>
    <h3 class="section-title">سفارش‌ها</h3><div class="table-wrap"><table class="table no-grid"><thead><tr><th>سفارش</th><th>نوع</th><th class="num">ساعت</th><th class="num">مبلغ</th><th>پرداخت</th><th>وضعیت</th></tr></thead><tbody>${L.map(o=>`<tr><td>${O.label(o)}</td><td>${O.TYPES[o.type][0]}</td><td class="num">${O.clock(o.openedAt)}</td><td class="num">${t(O.total(o))}</td><td>${payTxt(o)}</td><td>${ostat(o)}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">امروز سفارشی نداشته</td></tr>'}</tbody></table></div>
    <h3 class="section-title">دفتر بدهی (نسیه)</h3><div class="table-wrap"><table class="table no-grid"><thead><tr><th>تاریخ / ساعت</th><th>شرح</th><th class="num">مبلغ</th></tr></thead><tbody>${led.map(l=>`<tr><td class="num">${new Intl.DateTimeFormat('fa-IR-u-ca-persian',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).format(l.at)}</td><td>${O.esc(l.note)}</td><td class="num" style="color:var(--${l.amount>0?'danger':'success'})">${l.amount>0?'+':'−'}${t(Math.abs(l.amount))}</td></tr>`).join('')||'<tr><td colspan="3" class="muted">—</td></tr>'}</tbody></table></div>`,
    foot:`<button class="btn btn-ghost" data-close>بستن</button><button class="btn btn-secondary" data-cedit="${c.id}">${ic('pencil')}باشگاه و اعتبار</button>${O.debt(c.id)>0?`<button class="btn btn-primary" data-cpay="${c.id}">${ic('hand-coins')}دریافت بدهی</button>`:''}`})}
function custEdit(c){O.form({title:'باشگاه — '+O.esc(c.name),body:`<div class="field"><label>نام</label><input class="input" name="nm" value="${O.esc(c.name)}"></div>
  <div class="field"><label>درصد تخفیف باشگاه</label><input class="input" name="p" value="${fa(c.pct||0)}"></div>
  <div class="field"><label>افزودن به اعتبار (شارژ)</label><input class="input" name="cr" placeholder="۰"><span class="hint">اعتبار فعلی ${t(c.credit||0)}؛ مبلغ شارژ باید جدا دریافت شود.</span></div>${managerPin()}`,
  onOk:f=>{if(!pinOk(f))return false;c.name=f.nm.value.trim()||c.name;c.pct=Math.min(100,O.int(f.p.value));const a=O.int(f.cr.value);if(a)c.credit=(c.credit||0)+a;O.toast('ذخیره شد')}})}
function custPay(c){const d=O.debt(c.id);O.form({title:'دریافت بدهی — '+O.esc(c.name),body:`<div class="between"><span>بدهی فعلی</span><b class="num">${t(d)}</b></div>
  <div class="field"><label>مبلغ دریافتی</label><input class="input" name="a" value="${fa(d)}"></div><div class="field"><label>روش</label><select class="select" name="m">${['cash','card','transfer'].map(k=>`<option value="${k}">${O.PAY[k][0]}</option>`).join('')}</select></div>`,
  onOk:f=>{const a=Math.min(d,O.int(f.a.value));if(!a){O.toast('مبلغ را وارد کنید','alert-triangle');return false}
    S().ledger.push({id:O.uid('l'),cust:c.id,amount:-a,at:Date.now(),note:'دریافت بدهی — '+O.PAY[f.m.value][0],by:ME,method:f.m.value});
    if(f.m.value==='cash')S().shift.moves.push({kind:'in',amount:a,reason:'دریافت بدهی '+c.name,at:Date.now(),by:ME});O.toast('دریافت ثبت شد','check-circle')}})}

/* ---------- delivery dispatch (courier out/back, cash with courier) ---------- */
const DSP=[['prep','آماده‌سازی'],['out','ارسال شد'],['done','تحویل و تسویه']];
function dispatchBar(o){const d=o.dispatch||(o.dispatch={status:'prep'}),k=DSP.findIndex(x=>x[0]===d.status);
  return`<div class="row" style="flex-wrap:wrap;font-size:12px">${ic('bike')}<b>${O.staff(o.courier).name||'پیک بیرونی'}</b>${DSP.map(([s,l],j)=>`<span class="badge badge-${j<k?'success':j===k?'warning':'neutral'}">${l}${s==='out'&&d.outAt?' '+O.clock(d.outAt):''}${s==='done'&&d.backAt?' '+O.clock(d.backAt):''}</span>`).join('')}
    ${d.status==='prep'?`<button class="btn btn-secondary btn-sm" data-disp="${o.id}:out">خروج پیک</button>`:d.status==='out'?`<button class="btn btn-secondary btn-sm" data-disp="${o.id}:done">بازگشت پیک</button>`:''}
    ${d.status==='out'&&O.due(o)>0?`<small style="color:var(--warning)">${t(O.due(o))} نقد نزد پیک</small>`:''}</div>`}
function dispatch(o,st){const d=o.dispatch;
  if(st==='out'){if(o.items.some(i=>i.status==='new'||i.status==='sent')&&!confirm('همهٔ آیتم‌ها آماده نشده‌اند. پیک خارج شود؟'))return;d.status='out';d.outAt=Date.now();O.log(o,'خروج پیک '+O.staff(o.courier).name,ME);O.save();O.toast('پیک خارج شد؛ ساعت ثبت شد','bike');return}
  d.status='done';d.backAt=Date.now();O.log(o,`بازگشت پیک (${O.dur(d.outAt)})`,ME);O.save();
  if(O.due(o)>0)payForm(o)}

/* ---------- caller ID (simulated): incoming number → customer file → order ---------- */
let callN=0;
function callerId(){
  const call=S().calls[callN++%S().calls.length],c=S().customers.find(x=>x.phone===call.phone);
  const past=[...S().closed,...S().orders].filter(o=>o.customer&&c&&o.customer===c.id),addr=past.map(o=>o.address).filter(Boolean)[0];
  O.modal({title:ic('phone-incoming')+' تماس ورودی — '+fa(call.phone),body:c?`<div class="alert alert-success">${ic('user-check')}<div><b>${c.name}</b> · ${fa(c.visits)} بار · آخرین ${fa(c.last)} · خرید کل ${t(c.spend)}<br>${c.tags.map(x=>O.b(x,'neutral')).join(' ')} ${c.note?`<span style="color:var(--warning)">${O.esc(c.note)}</span>`:''}</div></div>
      ${addr?`<p style="margin:0">${ic('map-pin')} آخرین نشانی: ${O.esc(addr)}</p>`:''}`:`<p class="muted" style="margin:0">شمارهٔ ناشناس؛ با ثبت سفارش، پروندهٔ مشتری ساخته می‌شود.</p>`,
    foot:`<button class="btn btn-ghost" data-close>بستن</button><button class="btn btn-secondary" id="ciT">${ic('shopping-bag')}بیرون‌بر</button><button class="btn btn-primary" id="ciD">${ic('bike')}سفارش پیک</button>`,
    onMount:m=>{const go=type=>{O.close();let cu=c;if(!cu){cu={id:O.uid('c'),name:'مشتری '+fa(call.phone.slice(-4)),phone:call.phone,visits:0,last:'—',spend:0,note:'',tags:['جدید']};S().customers.push(cu)}
        const o=O.newOrder({type,table:null,guests:0,waiter:ME,customer:cu.id,address:type==='delivery'?(addr||'—'):undefined,courier:type==='delivery'?'s9':undefined,dispatch:type==='delivery'?{status:'prep'}:undefined});
        O.log(o,'از تماس '+fa(call.phone),ME);U.sel=o.id;U.view='menu';O.save()};
      $('#ciT',m).onclick=()=>go('take');$('#ciD',m).onclick=()=>go('delivery')}});
}

/* ---------- cashier shift: opening float, cash in/out, X (live) and Z (close) ---------- */
function shiftNums(){const sh=S().shift,by={},from=sh.openedAt;
  [...S().closed,...S().orders].forEach(o=>o.payments.forEach(p=>{if(p.at>=from)by[p.method]=(by[p.method]||0)+p.amount}));
  const tips=S().closed.filter(o=>o.closedAt>=from).reduce((a,o)=>a+(o.tips||[]).reduce((b,x)=>b+x.amount,0),0);
  const inn=sh.moves.filter(m=>m.kind==='in').reduce((a,m)=>a+m.amount,0),out=sh.moves.filter(m=>m.kind==='out').reduce((a,m)=>a+m.amount,0);
  const courier=S().orders.filter(o=>o.dispatch&&o.dispatch.status==='out').reduce((a,o)=>a+O.due(o),0);
  return{by,tips,inn,out,courier,expected:sh.float+(by.cash||0)+inn-out,sales:Object.values(by).reduce((a,v)=>a+v,0)}}
function shift(){const sh=S().shift,n=shiftNums(),k=(l,v,i,tone)=>`<div class="card kpi"><div class="kpi-top"><span class="kpi-label">${l}</span><span class="kpi-icon ${tone?'tone-'+tone:''}">${ic(i)}</span></div><div class="kpi-value">${v}</div></div>`;
  return`<div class="between" style="margin-bottom:var(--s3)"><div><h2 style="margin:0;font-size:17px">شیفت صندوق — ${O.staff(sh.cashier).name}</h2><small class="muted">باز از ${O.clock(sh.openedAt)} · ${O.dur(sh.openedAt)}${sh.closed?' · بسته شد '+O.clock(sh.closed.at):''}</small></div>
    <div class="row"><button class="btn btn-secondary btn-sm" data-mv="in">${ic('plus')}ورود وجه</button><button class="btn btn-secondary btn-sm" data-mv="out">${ic('minus')}برداشت / پرداخت از صندوق</button><button class="btn btn-primary btn-sm" data-z ${sh.closed?'disabled':''}>${ic('lock')}بستن شیفت (گزارش Z)</button></div></div>
  <div class="grid grid-4">${k('فروش این شیفت',t(n.sales),'trending-up')}${k('نقد مورد انتظار در کشو',t(n.expected),'banknote','warning')}${k('نقد نزد پیک',t(n.courier),'bike')}${k('انعام کارتی (جدا)',t(n.tips),'hand-heart')}</div>
  <div class="grid grid-2 mt"><div class="card"><div class="card-head"><h3>به تفکیک روش (گزارش X — لحظه‌ای)</h3></div><div class="table-wrap"><table class="table"><tbody>
    <tr><td>موجودی اول شیفت</td><td class="num">${t(sh.float)}</td></tr>${Object.keys(O.PAY).map(m=>`<tr><td>${O.PAY[m][0]}</td><td class="num">${t(n.by[m]||0)}</td></tr>`).join('')}
    <tr><td>ورود وجه</td><td class="num">${t(n.inn)}</td></tr><tr><td>برداشت / پرداخت از صندوق</td><td class="num">−${t(n.out)}</td></tr><tr><td><b>نقد مورد انتظار</b></td><td class="num"><b>${t(n.expected)}</b></td></tr></tbody></table></div></div>
    <div class="card"><div class="card-head"><h3>ورود و خروج وجه</h3></div><div class="table-wrap"><table class="table"><tbody>${sh.moves.map(m=>`<tr><td>${O.clock(m.at)}</td><td>${m.kind==='in'?O.b('ورود','success'):O.b('خروج','warning')}</td><td>${O.esc(m.reason)}</td><td class="num">${t(m.amount)}</td></tr>`).join('')||'<tr><td class="muted">—</td></tr>'}</tbody></table></div>
    <div class="card-body">${O.note('هر صندوقدار شیفت خودش را باز و بسته می‌کند (تسویهٔ مستقل). عدد Z در نسخهٔ واقعی مستقیم در «بستن صندوق شیفت» پنل می‌نشیند و پرداخت از صندوق به‌عنوان هزینه ثبت می‌شود.','calculator')}</div></div></div>`}
function shiftMove(kind){O.form({title:kind==='in'?'ورود وجه به صندوق':'برداشت / پرداخت از صندوق',body:`<div class="field"><label>مبلغ</label><input class="input" name="a"></div><div class="field"><label>شرح (الزامی)</label>${O.chips('r',kind==='in'?['افزودن خرد','برگشت تنخواه']:['خرید فوری','پرداخت به تأمین‌کننده','واریز به بانک','تنخواه'])}<input class="input mt" name="d" placeholder="توضیح"></div>`,
  onOk:f=>{const a=O.int(f.a.value),r=[O.vals(f,'r')[0],f.d.value.trim()].filter(Boolean).join(' — ');if(!a||!r){O.toast('مبلغ و شرح لازم است','alert-triangle');return false}S().shift.moves.push({kind,amount:a,reason:r,at:Date.now(),by:ME})}})}
function zReport(){const n=shiftNums();O.form({title:'بستن شیفت و گزارش Z',ok:'بستن شیفت',body:`<div class="between"><span>نقد مورد انتظار</span><b class="num">${t(n.expected)}</b></div><div class="field"><label>نقد شمرده‌شده</label><input class="input" name="c" id="zc"></div><div class="between"><span>اختلاف</span><b id="zd" class="num">—</b></div>
  ${S().orders.length?O.note(fa(S().orders.length)+' سفارش هنوز باز است؛ به شیفت بعد منتقل می‌شود.','alert-triangle','warning'):''}`,
  onMount:m=>{$('#zc',m).oninput=()=>{const d=O.int($('#zc',m).value)-n.expected;$('#zd',m).textContent=(d>0?'+':'')+t(d);$('#zd',m).style.color=d?'var(--danger)':'var(--success)'}},
  onOk:f=>{const c=O.int(f.c.value);S().shift.closed={at:Date.now(),counted:c,diff:c-n.expected};
    S().prints.unshift({id:O.uid('p'),at:Date.now(),station:'cashier',printer:'چاپگر صندوق',kind:'گزارش Z',label:'شیفت '+O.staff(ME).name,waiter:ME,lines:Object.entries(n.by).map(([k,v])=>({name:O.PAY[k][0],qty:1,amount:v})),foot:`<div class="tl"><span>مورد انتظار</span><span>${t(n.expected)}</span></div><div class="tl"><span>شمرده‌شده</span><span>${t(c)}</span></div><div class="tl"><b>اختلاف</b><b>${t(c-n.expected)}</b></div>`});
    O.toast('شیفت بسته شد؛ گزارش Z چاپ شد','lock')}})}

/* ---------- sensitive operations (anti-theft control) ---------- */
function audits(){const A=[],all=[...S().orders,...S().closed];
  all.forEach(o=>{const L=O.label(o);
    o.items.filter(i=>i.status==='void').forEach(i=>A.push({at:i.voidAt||o.openedAt,o:L,kind:'ابطال',text:`${fa(i.qty)}× ${i.name} — ${i.voidReason}`,by:i.voidBy,risk:!!i.readyAt||!S().requests.some(r=>r.item===i.uid)}));
    if(o.discount)A.push({at:o.openedAt,o:L,kind:'تخفیف',text:`${o.discount.kind==='pct'?fa(o.discount.value)+'٪':t(o.discount.value)} — ${o.discount.reason}`,by:ME,risk:o.discount.kind==='pct'?o.discount.value>20:O.disc(o)>O.sub(o)*.2});
    (o.flags||[]).forEach(f=>A.push({at:f.at,o:L,kind:'تغییر',text:f.t,by:ME,risk:!/^قیمت/.test(f.t)}));
    if(o.status==='cancel')A.push({at:o.closedAt,o:L,kind:'لغو',text:'لغو سفارش ارسال‌شده',by:ME,risk:true});
    if(o.reopened)A.push({at:o.reopened.at,o:L,kind:'اصلاح بعد از تسویه',text:`${o.reopened.reason} · ${t(o.reopened.before)} ← ${t(O.total(o))}`,by:o.reopened.by,risk:true})});
  S().prints.filter(p=>/تکرار/.test(p.kind)&&/صورتحساب|رسید/.test(p.kind)).forEach(p=>A.push({at:p.at,o:p.label,kind:'چاپ دوباره',text:p.kind,by:p.by,risk:true}));
  return A.sort((a,b)=>b.at-a.at)}
function audit(){const A=audits();
  return`<div class="grid grid-4">${[['ابطال','ban'],['تخفیف','percent'],['تغییر','pencil'],['اصلاح بعد از تسویه','rotate-ccw']].map(([k,i])=>`<div class="card kpi"><div class="kpi-top"><span class="kpi-label">${k}</span><span class="kpi-icon">${ic(i)}</span></div><div class="kpi-value">${fa(A.filter(a=>a.kind===k).length)}</div><div class="kpi-foot">${fa(A.filter(a=>a.kind===k&&a.risk).length)} نیازمند بررسی</div></div>`).join('')}</div>
  <div class="card mt"><div class="card-head"><h3>عملیات حساس امروز</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>ساعت</th><th>سفارش</th><th>نوع</th><th>شرح</th><th>کاربر</th><th></th></tr></thead><tbody>
    ${A.map(a=>`<tr><td class="num">${O.clock(a.at)}</td><td>${a.o}</td><td>${a.kind}</td><td>${O.esc(a.text)}</td><td>${O.staff(a.by).name}</td><td>${a.risk?O.b('بررسی','danger'):O.b('عادی','neutral')}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">موردی نیست</td></tr>'}</tbody></table></div>
    <div class="card-body">${O.note('موارد «بررسی»: ابطال آیتمی که آماده شده بود یا بدون درخواست ویتر، تخفیف بیش از ۲۰٪، تغییر بعد از پیش‌فاکتور، چاپ دوبارهٔ صورتحساب، لغو سفارش ارسال‌شده. این گزارش روزانه برای مدیر ارسال می‌شود (در نسخهٔ واقعی).','shield-alert','warning')}</div></div>`}

/* ---------- render & events ---------- */
function render(){
  top();const v={tables,menu,orders,customers,requests,prints,settings,shift,audit}[U.view]||tables;$('#main').innerHTML=v();orderPanel();RT.icons();
  const q=$('#mq');if(q){q.oninput=()=>{U.q=q.value;const p=q.selectionStart;render();const n=$('#mq');n.focus();n.setSelectionRange(p,p)}}
  const cq=$('#cq');if(cq){cq.oninput=()=>{U.cq=cq.value;const p=cq.selectionStart;render();const n=$('#cq');n.focus();n.setSelectionRange(p,p)}}
}
document.addEventListener('click',e=>{
  const g=(k)=>e.target.closest('['+k+']'),o=O.order(U.sel);let x;
  if((x=g('data-t'))){const ord=O.atTable(x.dataset.t);if(ord)sel(ord.id);else openTable(x.dataset.t);return}
  const find=id=>O.order(id)||S().closed.find(z=>z.id===id);
  if((x=g('data-ofix'))){O.close();fixOrder(find(x.dataset.ofix));return}
  if((x=g('data-op'))){const ord=find(x.dataset.op);O.printBill(ord,ord.status==='paid'?'رسید (تکرار)':'پیش‌فاکتور',ME);if(ord.status==='paid')O.flag(ord,'چاپ دوبارهٔ رسید');O.save();O.toast('به چاپگر صندوق رفت','printer');return}
  if((x=g('data-ov'))){orderView(find(x.dataset.ov));return}
  if((x=g('data-oty'))){U.otype=x.dataset.oty;render();return}
  if((x=g('data-osort'))){const k=x.dataset.osort,s=U.osort||{k:'time',dir:-1};U.osort={k,dir:s.k===k?-s.dir:(k==='time'||k==='amount'?-1:1)};render();return}
  if((x=g('data-ogrp'))){U.ogroup=x.dataset.ogrp;U.ocol=[];render();return}
  if((x=g('data-ocolall'))){U.ocol=(U.ocol||[]).length?[]:[...(U.ogKeys||[])];render();return}
  if((x=g('data-ocol'))){const k=x.dataset.ocol,c=U.ocol||(U.ocol=[]);U.ocol=c.includes(k)?c.filter(z=>z!==k):[...c,k];render();return}
  if((x=g('data-ost'))){U.ostat=x.dataset.ost;render();return}
  if((x=g('data-cty'))){U.cty=x.dataset.cty;render();return}
  if((x=g('data-cv'))){custView(O.cust(x.dataset.cv));return}
  if((x=g('data-cedit'))){O.close();custEdit(O.cust(x.dataset.cedit));return}
  if((x=g('data-cpay'))){O.close();custPay(O.cust(x.dataset.cpay));return}
  if((x=g('data-cnew'))){custNew();return}
  if((x=g('data-o'))){const id=x.dataset.o;if(O.order(id)){U.view='tables';sel(id)}else{const c=S().closed.find(z=>z.id===id);c&&ACT.log(c)}return}
  if((x=g('data-area'))){U.area=x.dataset.area;render();return}
  if((x=g('data-86'))){e.stopPropagation();const id=x.dataset['86'];if(S().out[id])delete S().out[id];else S().out[id]=true;O.save();O.toast(O.mi(id).name+(S().out[id]?' ناموجود شد':' دوباره موجود شد'),'circle-off');return}
  if((x=g('data-call'))){callerId();return}
  if((x=g('data-disp'))){const[oid,st]=x.dataset.disp.split(':');dispatch(O.order(oid),st);return}
  if((x=g('data-mv'))){shiftMove(x.dataset.mv);return}
  if((x=g('data-z'))){zReport();return}
  if((x=g('data-back'))){U.view='tables';render();return}
  if((x=g('data-cat'))){U.cat=x.dataset.cat||null;render();return}
  if((x=g('data-note'))){e.stopPropagation();noteFor(o,null,x.dataset.note);return}
  if((x=g('data-mi'))&&!x.classList.contains('out')&&!e.target.closest('[data-86]')){O.addItem(o,x.dataset.mi,'',ME);O.save();return}
  if((x=g('data-pf'))){U.pf=x.dataset.pf;render();return}
  if((x=g('data-rp'))){const p=S().prints.find(z=>z.id===x.dataset.rp);S().prints.unshift({...p,id:O.uid('p'),at:Date.now(),kind:p.kind+' (تکرار)'});O.save();O.toast('دوباره چاپ شد','printer');return}
  if((x=g('data-test'))){const s=O.st(x.dataset.test);S().prints.unshift({id:O.uid('p'),at:Date.now(),station:s.id,printer:s.printer,kind:'چاپ آزمایشی',label:s.name,waiter:ME,lines:[{name:'آزمایش چاپگر',qty:1,note:s.addr}]});O.save();O.toast('برگهٔ آزمایشی به '+s.printer+' رفت','printer');return}
  if((x=g('data-rok'))){const r=S().requests.find(z=>z.id===x.dataset.rok),ord=O.order(r.order);if(ord)O.voidItem(ord,r.item,r.qty,r.reason,ME);r.status='ok';r.doneBy=ME;O.save();O.toast('ابطال تأیید شد','ban');return}
  if((x=g('data-rej'))){const r=S().requests.find(z=>z.id===x.dataset.rej);r.status='no';r.doneBy=ME;O.save();return}
  if(!o)return;
  if((x=g('data-act'))){ACT[x.dataset.act](o);return}
  const it=k=>o.items.find(i=>i.uid===x.dataset[k]);
  if((x=g('data-pl'))){const k=x.dataset.pl;o.priceList=k;o.items.forEach(i=>{if(i.status!=='void'&&!i.paid){const m=O.mi(i.mid);i.price=O.unit(o,m)+(i.mods||[]).reduce((a,z)=>a+z[1],0)}});O.log(o,'فهرست قیمت: '+O.PRICE_LISTS[k][0],ME);if(k!=='normal')O.flag(o,'قیمت '+O.PRICE_LISTS[k][0]);O.save();return}
  if((x=g('data-inc'))){it('inc').qty++;O.save();return}
  if((x=g('data-more'))){const i=it('more');O.addItem(o,i.mid,i.note,ME,i.mods||[]);O.save();O.toast('یک '+i.name+' اضافه شد؛ «ارسال» را بزنید','plus');return}
  if((x=g('data-less'))){const i=it('less');voidItem(o,i,1);return}
  if((x=g('data-dec'))){const i=it('dec');if(i.qty>1)i.qty--;else o.items=o.items.filter(z=>z!==i);O.save();return}
  if((x=g('data-del'))){o.items=o.items.filter(z=>z.uid!==x.dataset.del);O.save();return}
  if((x=g('data-nt'))){noteFor(o,it('nt'));return}
  if((x=g('data-void'))){voidItem(o,it('void'));return}
});
document.addEventListener('change',e=>{
  const x=e.target;
  if(x.dataset.wp){const[id,k]=x.dataset.wp.split(':'),p=S().settings.waiterPerms;(p[id]=p[id]||{})[k]=x.checked?1:0;O.save();O.toast('دسترسی ذخیره شد');return}
  if(x.dataset.bf!=null&&$('#billPrev')){/* live preview before saving */const s=S().settings,keep=s.bill;s.bill={};$$('[data-bf]').forEach(z=>s.bill[z.dataset.bf]=z.checked?1:0);const o=S().orders.find(z=>O.live(z).length&&z.customer)||S().closed[0];if(o)$('#billPrev').innerHTML=O.billHtml(o,'پیش‌فاکتور');s.bill=keep;return}
  if(x.dataset.sw){const[k,id]=x.dataset.sw.split(':');S().stations.find(s=>s.id===id)[k]=x.checked;O.save();O.toast('ذخیره شد')}
  if(x.dataset.route){O.setRoute(x.dataset.route,x.value);O.toast('مسیر «'+x.dataset.route+'» ← '+O.st(x.value).name)}
});
document.addEventListener('click',e=>{
  if(e.target.closest('#saveTimes')){const s=S().settings;s.longStayMin=O.int($('#sLong').value)||120;s.noOrderMin=O.int($('#sIdle').value)||10;s.batch=O.int($('#sBatch').value)||3;
    $$('[data-tg]').forEach(x=>s.targets[x.dataset.tg]=O.int(x.value)||s.targets[x.dataset.tg]);O.save();O.toast('ذخیره شد');return}
  if(e.target.closest('#saveBill')){const s=S().settings;$$('[data-vn]').forEach(x=>s.venue[x.dataset.vn]=x.value.trim());$$('[data-bf]').forEach(x=>s.bill[x.dataset.bf]=x.checked?1:0);s.billFooter=$('#bFoot').value.trim();O.save();O.toast('صورتحساب ذخیره شد','printer');return}
  if(e.target.id==='saveSet'){const s=S().settings;s.service=+O.en($('#svc').value)||0;s.vat=+O.en($('#vat').value)||0;s.voidNeedsManager=$('#vnm').checked;O.save();O.toast('ذخیره شد')}
  if(e.target.id==='reset'){O.reset();U.sel=null;O.toast('دادهٔ نمونه بازگشت','rotate-ccw')}});
O.on(()=>{if(U.sel&&!O.order(U.sel))U.sel=null;render()});
setInterval(()=>{$('#clk')&&($('#clk').textContent=O.clock(Date.now()));if(U.view==='tables')render()},30000);
U.sel=S().orders[0]&&S().orders[0].id;
render();
})();
