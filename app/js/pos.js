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
  const req=S().requests.filter(r=>r.status==='pending').length,bills=S().orders.filter(o=>o.status==='bill').length;
  const tab=(v,l,i,c)=>`<button class="${U.view===v||(v==='tables'&&U.view==='menu')?'active':''}" data-v="${v}">${ic(i)}${l}${c?`<span class="count">${fa(c)}</span>`:''}</button>`;
  $('#top').innerHTML=`<div class="ops-brand"><span class="brand-mark">ر</span><div>صندوق رایو<small>شعبهٔ مرکزی · صندوق ۱</small></div></div>
    <div class="segmented">${tab('tables','میزها','layout-grid')}${tab('orders','سفارش‌ها','list',bills)}${tab('requests','درخواست‌ها','bell',req)}${tab('shift','شیفت صندوق','wallet')}${tab('audit','کنترل','shield-alert',audits().filter(a=>a.risk).length)}${tab('prints','چاپ‌ها','printer')}${tab('settings','تنظیمات','settings')}</div>
    <div class="grow"></div>
    <button class="btn btn-ghost btn-sm" data-call title="شبیه‌سازی کالر آیدی">${ic('phone-incoming')}تماس</button>
    <button class="btn btn-secondary btn-sm" data-new="take">${ic('shopping-bag')}بیرون‌بر</button>
    <button class="btn btn-secondary btn-sm" data-new="delivery">${ic('bike')}پیک</button>
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
  const card=x=>{const s=O.tstate(x),o=O.atTable(x.id),r=S().reserved[x.id],rd=o&&O.live(o).filter(i=>i.status==='ready').length;
    return`<button class="tcard st-${s} ${o&&o.id===U.sel?'sel':''}" data-t="${x.id}">
      <span class="tno">${fa(x.no)}</span>
      ${rd?`<span class="flag badge badge-success">${ic('bell-ring')}${fa(rd)} آماده</span>`:s==='bill'?`<span class="flag badge badge-danger">صورتحساب</span>`:''}
      <small>${ic('users')}${o?fa(o.guests)+' از '+fa(x.seats):fa(x.seats)+' نفره'}${o?' · '+ic('timer')+O.dur(o.openedAt):''}</small>
      ${o?`<small>${ic('user')}${O.staff(o.waiter).name}</small>`:r?`<small>${ic('calendar-clock')}${r.name} · ${r.at}</small>`:''}
      <span class="tsum">${o?t(O.total(o)):O.TSTATE[s][0]}</span></button>`};
  return`<div class="between" style="margin-bottom:var(--s3)">
      <div class="segmented">${[['all','همه'],...O.AREAS.map(a=>[a.id,a.name])].map(([k,l])=>`<button class="${U.area===k?'active':''}" data-area="${k}">${l}</button>`).join('')}</div>
      <div class="legend-bar">${Object.entries(O.TSTATE).map(([k,[l]])=>`<span class="st-${k}"><i class="dot"></i>${l} ${fa(cnt[k]||0)}</span>`).join('')}</div></div>
    ${O.AREAS.filter(a=>U.area==='all'||a.id===U.area).map(a=>`<h3 class="section-title" style="margin:var(--s4) 0 var(--s2)">${a.name}</h3>
      <div class="tgrid">${T.filter(x=>x.area===a.id).map(card).join('')}</div>`).join('')}
    <h3 class="section-title" style="margin:var(--s5) 0 var(--s2)">بیرون‌بر، پیک و اسنپ‌فود</h3>
    <div class="tgrid">${off.map(o=>{const L=O.live(o),s=L.some(i=>i.status==='sent')?'cooking':L.length&&L.every(i=>i.status!=='new'&&i.status!=='sent')?'ready':'seated';
      return`<button class="tcard ocard st-${s} ${o.id===U.sel?'sel':''}" data-o="${o.id}"><span class="row"><b>${ic(O.TYPES[o.type][1])}${O.TYPES[o.type][0]}</b><span class="muted">#${fa(o.no)}</span></span>
        <small>${ic('timer')}${O.dur(o.openedAt)}</small>${o.customer?`<small>${ic('user')}${O.cust(o.customer).name}</small>`:''}
        <span class="tsum">${t(O.total(o))}</span></button>`}).join('')||'<p class="muted">سفارشی نیست</p>'}</div>`;
}
function menu(){
  const o=O.order(U.sel);if(!o){U.view='tables';return tables()}
  const cat=U.cat,q=U.q.trim(),list=O.MENU.filter(m=>(!cat||m.cat===cat)&&(!q||m.name.includes(q)));
  const inCart=mid=>o.items.filter(i=>i.mid===mid&&i.status==='new').reduce((a,i)=>a+i.qty,0);
  return`<div class="between" style="margin-bottom:var(--s3)"><div class="row"><button class="btn btn-ghost btn-sm" data-back>${ic('arrow-right')}میزها</button><h2 style="margin:0;font-size:17px">افزودن به ${O.label(o)}</h2></div>
      <div class="search" style="width:260px">${ic('search')}<input class="input" id="mq" placeholder="جستجوی آیتم…" value="${O.esc(U.q)}"></div></div>
    <div class="row" style="flex-wrap:wrap;margin-bottom:var(--s3)"><button class="chip ${!cat?'active':''}" data-cat="">همه</button>${O.CATS.map(c=>`<button class="chip ${cat===c?'active':''}" data-cat="${c}">${c}</button>`).join('')}</div>
    <div class="menu-grid">${list.map(m=>{const n=inCart(m.id);return`<div class="mtile ${O.isOut(m.id)?'out':''}" data-mi="${m.id}" role="button" tabindex="0">
      ${n?`<span class="incart">${fa(n)}</span>`:''}<span class="stn" title="${O.st(m.station).name}">${ic(O.st(m.station).icon)}</span>
      <b>${m.name}</b><span class="muted" style="font-size:11.5px">${O.isOut(m.id)?'ناموجود':m.cat}</span><span class="pr">${t(O.unit(o,m))}${o.priceList&&o.priceList!=='normal'?' <small class="muted" style="text-decoration:line-through">'+t(m.price)+'</small>':''}</span>
      <button class="nt" data-86="${m.id}" title="موجود/ناموجود" style="inset-inline-end:40px;${O.isOut(m.id)?'color:var(--danger)':''}">${ic(O.isOut(m.id)?'circle-off':'ban')}</button>
      ${O.isOut(m.id)?'':`<button class="nt" data-note="${m.id}" title="با توضیح">${ic('message-square-plus')}</button>`}</div>`}).join('')}</div>
    ${O.note('دکمهٔ «⊘» روی هر کارت آیتم را «ناموجود» می‌کند؛ فوراً در سفارش‌گیر و منوی QR هم غیرفعال می‌شود.','circle-off','warning')}
    ${O.note('هر آیتم بر اساس دسته‌اش به ایستگاه خودش می‌رود (آیکون گوشهٔ کارت). تا «ارسال» نزده‌اید، چیزی چاپ نمی‌شود و ویرایش آزاد است.','info')}`;
}
function orders(){
  const open=S().orders,closed=S().closed.slice(0,12);
  const row=o=>`<tr data-o="${o.id}" style="cursor:pointer"><td><b>${O.label(o)}</b></td><td>${O.b(O.TYPES[o.type][0],'neutral')}</td><td>${O.staff(o.waiter).name}</td><td>${o.customer?O.cust(o.customer).name:'—'}</td>
    <td class="num">${o.closedAt?O.clock(o.openedAt)+' – '+O.clock(o.closedAt):O.dur(o.openedAt)}</td><td class="num">${t(O.total(o))}</td>
    <td>${o.status==='bill'?O.b('صورتحساب خواسته','danger'):o.status==='paid'?O.b('تسویه','success'):o.status==='merged'?O.b('ادغام‌شده','neutral'):o.status==='cancel'?O.b('لغو','neutral'):O.b('باز','warning')}</td></tr>`;
  const head='<thead><tr><th>سفارش</th><th>نوع</th><th>ویتر/ثبت</th><th>مشتری</th><th>زمان</th><th>مبلغ</th><th>وضعیت</th></tr></thead>';
  const sales=S().closed.filter(o=>o.status==='paid'),byPay={};sales.forEach(o=>o.payments.forEach(p=>byPay[p.method]=(byPay[p.method]||0)+p.amount));
  return`<div class="grid grid-4">${[['سفارش باز',fa(open.length),'list'],['تسویه‌شده امروز',fa(sales.length),'check-circle'],['فروش تسویه‌شده',t(sales.reduce((a,o)=>a+O.total(o),0)),'wallet'],['باز (مبلغ)',t(open.reduce((a,o)=>a+O.total(o),0)),'hourglass']].map(([l,v,i])=>`<div class="card kpi"><div class="kpi-top"><span class="kpi-label">${l}</span><span class="kpi-icon">${ic(i)}</span></div><div class="kpi-value">${v}</div></div>`).join('')}</div>
    <div class="card mt"><div class="card-head"><h3>سفارش‌های باز</h3></div><div class="table-wrap"><table class="table">${head}<tbody>${open.map(row).join('')}</tbody></table></div></div>
    <div class="card mt"><div class="card-head"><h3>بسته‌شده‌های امروز</h3><span class="muted" style="font-size:12px">${Object.entries(byPay).map(([k,v])=>O.PAY[k][0]+': '+t(v)).join(' · ')||'هنوز تسویه‌ای نیست'}</span></div>
      <div class="table-wrap"><table class="table">${head}<tbody>${closed.map(row).join('')||'<tr><td colspan="7" class="muted">—</td></tr>'}</tbody></table></div></div>
    ${O.note('در نسخهٔ واقعی جمع تسویه‌ها به تفکیک روش پرداخت، خودکار در فرم «بستن صندوق شیفت» پنل می‌نشیند؛ صندوقدار فقط نقد شمرده‌شده را وارد می‌کند.','calculator')}`;
}
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
const ticketHtml=p=>{const st=O.st(p.station);return`<div class="ticket"><h4>${p.kind==='صورتحساب'||p.kind==='رسید'?'رایو کافه':st.name}</h4>
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
    ${i.status==='new'?`<span class="q"><button data-inc="${i.uid}">${ic('plus')}</button><b>${fa(i.qty)}</b><button data-dec="${i.uid}">${ic('minus')}</button></span>`:`<span class="q"><b>${fa(i.qty)}×</b></span>`}
    <span class="nm">${i.name}${i.hold?'<span class="badge badge-info ist">نگه‌داشته</span>':''}${i.mods&&i.mods.length?`<small style="color:var(--info)">+ ${O.modTxt(i)}</small>`:''}${i.status!=='new'?`<span class="badge badge-${ist[i.status][1]} ist">${ist[i.status][0]}</span>`:''}${i.note?`<small>» ${O.esc(i.note)}</small>`:''}${i.status==='void'?`<small style="color:var(--danger)">${O.esc(i.voidReason)}</small>`:''}</span>
    <span class="pr">${t(i.price*i.qty)}${i.status==='new'?`<button data-nt="${i.uid}" title="توضیح">${ic('message-square')}</button><button data-del="${i.uid}" title="حذف">${ic('trash-2')}</button>`:i.status!=='void'?`<button data-void="${i.uid}" title="ابطال">${ic('ban')}</button>`:''}</span></div>`;
  const c=o.customer&&O.cust(o.customer);
  el.innerHTML=`<div class="ohead"><div class="between"><h2>${O.label(o)}</h2>${o.status==='bill'?O.b('صورتحساب خواسته','danger'):O.b(O.TYPES[o.type][0],'neutral')}</div>
      <div class="ometa"><span>${ic('timer')}${O.dur(o.openedAt)}</span>${o.table?`<span>${ic('users')}${fa(o.guests)} نفر</span>`:''}<span>${ic('user')}${O.staff(o.waiter).name}</span><span>#${fa(o.no)}</span></div>
      <button class="btn btn-ghost btn-sm" style="justify-content:flex-start" data-act="cust">${ic(c?'user-check':'user-plus')}${c?`<b>${c.name}</b> · ${fa(c.visits)} بار آمده${c.note?` · <span style="color:var(--warning)">${O.esc(c.note)}</span>`:''}`:'افزودن مشتری'}</button>
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
      ${fresh.some(i=>!i.hold)||!fresh.length?`<button class="btn btn-primary wide" data-act="send" ${fresh.some(i=>!i.hold)?'':'disabled'}>${ic('send')}ارسال ${fresh.some(i=>!i.hold)?'('+fa(fresh.filter(i=>!i.hold).reduce((a,i)=>a+i.qty,0))+')':''}</button>`:`<button class="btn btn-primary wide" data-act="fire">${ic('flame')}اجرا (${fa(fresh.filter(i=>i.hold).reduce((a,i)=>a+i.qty,0))} نگه‌داشته)</button>`}
      ${o.table?`<button class="btn btn-ghost" data-act="move">${ic('arrow-left-right')}تغییر میز</button><button class="btn btn-ghost" data-act="merge">${ic('merge')}ادغام</button>`:''}
      <button class="btn btn-ghost" data-act="items">${ic('split')}انتقال آیتم</button>
      ${o.table?`<button class="btn btn-ghost" data-act="guests">${ic('users')}نفرات</button>`:''}
      <button class="btn btn-ghost" data-act="disc">${ic('percent')}تخفیف</button>
      <button class="btn btn-ghost" data-act="bill">${ic('file-text')}پیش‌فاکتور</button>
      <button class="btn btn-ghost" data-act="cancel">${ic('x-circle')}لغو</button>
      <button class="btn btn-ghost" data-act="log">${ic('history')}سابقه</button>
      <button class="btn btn-secondary wide" data-act="split" ${O.due(o)>0?'':'disabled'}>${ic('divide')}پرداخت جدا</button>
      <button class="btn btn-primary wide" data-act="pay" ${O.due(o)>0&&!fresh.length?'':'disabled'} style="background:var(--success);border-color:var(--success)">${ic('wallet')}تسویه</button>
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
  O.form({title:'سفارش '+O.TYPES[type][0],ok:'ثبت و افزودن آیتم',body:`<div class="field"><label>تلفن مشتری ${type==='take'?'(اختیاری)':''}</label><input class="input" name="ph" placeholder="۰۹۱۲…"></div>
    ${type==='delivery'?`<div class="field"><label>نشانی</label><textarea class="textarea" name="ad" rows="2"></textarea></div><div class="field"><label>پیک</label><select class="select" name="cr"><option value="s9">${O.staff('s9').name}</option><option value="">پیک بیرونی</option></select></div>`:''}`,
    onOk:f=>{const ph=O.en(f.ph.value).replace(/\D/g,''),c=ph&&S().customers.find(x=>x.phone===ph);
      if(type==='delivery'&&!f.ad.value.trim()){O.toast('نشانی لازم است','alert-triangle');return false}
      const o=O.newOrder({type,table:null,guests:0,waiter:ME,customer:c?c.id:null,address:f.ad?f.ad.value.trim():undefined,courier:f.cr?f.cr.value:undefined});
      if(ph&&!c){const nc={id:O.uid('c'),name:'مشتری '+fa(ph.slice(-4)),phone:ph,visits:0,last:'—',spend:0,note:'',tags:['جدید']};S().customers.push(nc);o.customer=nc.id}
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
function voidItem(o,i){
  O.form({title:'ابطال '+i.name,ok:'ابطال',tone:'danger',body:`${i.status==='ready'||i.status==='served'?O.note('این آیتم آماده/سرو شده؛ ابطال آن ضایعه ثبت می‌شود.','alert-triangle','warning'):''}
    ${i.qty>1?`<div class="field"><label>تعداد ابطال</label><input class="input" name="q" value="${fa(i.qty)}"></div>`:''}
    <div class="field"><label>دلیل</label>${O.chips('r',O.VOID_REASONS)}</div>${managerPin()}`,
    onOk:f=>{const r=O.vals(f,'r')[0];if(!r){O.toast('دلیل را انتخاب کنید','alert-triangle');return false}if(!pinOk(f))return false;
      O.voidItem(o,i.uid,f.q?+O.en(f.q.value):i.qty,r,ME);O.toast('ابطال شد؛ برگهٔ ابطال برای '+O.st(i.station).name+' چاپ شد','ban')}});
}
function pickTable(title,filter,onPick,note){
  O.modal({title,size:'modal-lg',body:`${note?O.note(note,'info'):''}<div class="tgrid">${O.TABLES.filter(filter).map(x=>{const s=O.tstate(x);return`<button class="tcard st-${s}" data-pk="${x.id}" style="min-height:80px"><span class="tno">${fa(x.no)}</span><small>${O.AREAS.find(a=>a.id===x.area).name} · ${O.TSTATE[s][0]}</small></button>`}).join('')}</div>`,
    onMount:m=>$$('[data-pk]',m).forEach(b=>b.onclick=()=>{onPick(b.dataset.pk);O.close();O.save()})});
}
function payForm(o,amount,itemUids){
  const due=amount||O.due(o),meth=Object.keys(O.PAY);
  O.form({title:'تسویه — '+O.label(o),ok:'ثبت پرداخت',size:'modal-lg',body:`<div class="sum-box between" style="padding:var(--s3);border-radius:12px;background:var(--surface-3)"><span>مبلغ این پرداخت</span><b class="num" style="font-size:20px">${t(due)} تومان</b></div>
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
      add('card',due);$('#addPl',m).onclick=()=>add('cash',0);m.oninput=calc},
    onOk:f=>{const rows=$$('#pls .row').map(r=>({method:$('select',r).value,amount:+O.en($('.pa',r).value).replace(/\D/g,'')||0})).filter(r=>r.amount>0);
      const sum=rows.reduce((a,r)=>a+r.amount,0);if(sum!==due){O.toast('جمع پرداخت با مبلغ برابر نیست','alert-triangle');return false}
      if(rows.some(r=>r.method==='credit')&&!o.customer){O.toast('برای نسیه، مشتری را مشخص کنید','user-plus');return false}
      rows.forEach(r=>o.payments.push({...r,at:Date.now(),by:ME,items:itemUids||null}));
      if(itemUids)o.items.forEach(i=>{if(itemUids.includes(i.uid))i.paid=true});
      const tip=+O.en(f.tip.value).replace(/\D/g,'')||0;if(tip){o.tips=(o.tips||[]).concat({amount:tip,target:O.vals(f,'tt')[0]||'سالن همان شیفت'})}
      O.log(o,'پرداخت '+rows.map(r=>O.PAY[r.method][0]+' '+t(r.amount)).join(' + ')+(tip?' · انعام '+t(tip):''),ME);
      if(O.due(o)<=0){const lines=O.live(o).map(i=>({name:i.name,qty:i.qty,amount:i.price*i.qty}));
        O.ticket(o,'cashier',lines,'رسید',ME);S().prints[0].foot=`<div class="tl"><b>جمع</b><b>${t(O.total(o))}</b></div>${o.payments.map(p=>`<div class="tl"><span>${O.PAY[p.method][0]}</span><span>${t(p.amount)}</span></div>`).join('')}<div class="tc">${S().settings.billFooter}</div>`;
        O.closeOrder(o,ME);U.sel=null;O.toast('تسویه شد؛ رسید چاپ شد و میز آزاد شد','check-circle')}
      else O.toast('پرداخت ثبت شد؛ مانده '+t(O.due(o)),'wallet')}});
}
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
    o.status='bill';O.ticket(o,'cashier',O.live(o).map(i=>({name:i.name,qty:i.qty,amount:i.price*i.qty})),'صورتحساب',ME);
    S().prints[0].foot=`${o.discount?`<div class="tl"><span>تخفیف</span><span>−${t(O.disc(o))}</span></div>`:''}<div class="tl"><b>قابل پرداخت</b><b>${t(O.due(o))}</b></div><div class="tc">${S().settings.billFooter}</div>`;
    O.log(o,'پیش‌فاکتور چاپ شد',ME);O.save();O.modal({title:'پیش‌فاکتور چاپ شد',body:`<div style="display:grid;place-items:center">${ticketHtml(S().prints[0])}</div>`})},
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
function custForm(o){
  O.form({title:'مشتری',ok:'ثبت',body:`<div class="field"><label>تلفن</label><input class="input" name="ph" id="cph" placeholder="۰۹۱۲…" value="${o.customer?fa(O.cust(o.customer).phone):''}"></div><div id="cres"></div>
    <div class="field"><label>نام (برای مشتری جدید)</label><input class="input" name="nm"></div><div class="field"><label>یادداشت ثابت (حساسیت، ترجیح)</label><input class="input" name="nt"></div>`,
    onMount:m=>{const f=()=>{const ph=O.en($('#cph',m).value).replace(/\D/g,''),c=ph.length>=4&&S().customers.find(x=>x.phone.includes(ph));
      $('#cres',m).innerHTML=c?`<div class="alert alert-success">${ic('user-check')}<div><b>${c.name}</b> · ${fa(c.visits)} بار · آخرین: ${fa(c.last)} · خرید کل ${t(c.spend)}<br>${c.tags.map(x=>O.b(x,'neutral')).join(' ')} ${c.note?`<span style="color:var(--warning)">${O.esc(c.note)}</span>`:''}</div></div>`:ph.length>=4?'<span class="muted">مشتری جدید است</span>':''};$('#cph',m).oninput=f;f()},
    onOk:f=>{const ph=O.en(f.ph.value).replace(/\D/g,'');if(!ph){o.customer=null;return}let c=S().customers.find(x=>x.phone===ph||x.phone.includes(ph));
      if(!c){c={id:O.uid('c'),name:f.nm.value.trim()||'مشتری '+fa(ph.slice(-4)),phone:ph,visits:0,last:'—',spend:0,note:'',tags:['جدید']};S().customers.push(c)}
      if(f.nt.value.trim())c.note=f.nt.value.trim();o.customer=c.id;O.log(o,'مشتری: '+c.name,ME)}});
}

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
    if(o.status==='cancel')A.push({at:o.closedAt,o:L,kind:'لغو',text:'لغو سفارش ارسال‌شده',by:ME,risk:true})});
  S().prints.filter(p=>/تکرار/.test(p.kind)&&/صورتحساب|رسید/.test(p.kind)).forEach(p=>A.push({at:p.at,o:p.label,kind:'چاپ دوباره',text:p.kind,by:p.by,risk:true}));
  return A.sort((a,b)=>b.at-a.at)}
function audit(){const A=audits();
  return`<div class="grid grid-4">${[['ابطال','ban'],['تخفیف','percent'],['تغییر','pencil'],['چاپ دوباره','printer']].map(([k,i])=>`<div class="card kpi"><div class="kpi-top"><span class="kpi-label">${k}</span><span class="kpi-icon">${ic(i)}</span></div><div class="kpi-value">${fa(A.filter(a=>a.kind===k).length)}</div><div class="kpi-foot">${fa(A.filter(a=>a.kind===k&&a.risk).length)} نیازمند بررسی</div></div>`).join('')}</div>
  <div class="card mt"><div class="card-head"><h3>عملیات حساس امروز</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>ساعت</th><th>سفارش</th><th>نوع</th><th>شرح</th><th>کاربر</th><th></th></tr></thead><tbody>
    ${A.map(a=>`<tr><td class="num">${O.clock(a.at)}</td><td>${a.o}</td><td>${a.kind}</td><td>${O.esc(a.text)}</td><td>${O.staff(a.by).name}</td><td>${a.risk?O.b('بررسی','danger'):O.b('عادی','neutral')}</td></tr>`).join('')||'<tr><td colspan="6" class="muted">موردی نیست</td></tr>'}</tbody></table></div>
    <div class="card-body">${O.note('موارد «بررسی»: ابطال آیتمی که آماده شده بود یا بدون درخواست ویتر، تخفیف بیش از ۲۰٪، تغییر بعد از پیش‌فاکتور، چاپ دوبارهٔ صورتحساب، لغو سفارش ارسال‌شده. این گزارش روزانه برای مدیر ارسال می‌شود (در نسخهٔ واقعی).','shield-alert','warning')}</div></div>`}

/* ---------- render & events ---------- */
function render(){
  top();const v={tables,menu,orders,requests,prints,settings,shift,audit}[U.view]||tables;$('#main').innerHTML=v();orderPanel();RT.icons();
  const q=$('#mq');if(q){q.oninput=()=>{U.q=q.value;const p=q.selectionStart;render();const n=$('#mq');n.focus();n.setSelectionRange(p,p)}}
}
document.addEventListener('click',e=>{
  const g=(k)=>e.target.closest('['+k+']'),o=O.order(U.sel);let x;
  if((x=g('data-t'))){const ord=O.atTable(x.dataset.t);if(ord)sel(ord.id);else openTable(x.dataset.t);return}
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
  if((x=g('data-dec'))){const i=it('dec');if(i.qty>1)i.qty--;else o.items=o.items.filter(z=>z!==i);O.save();return}
  if((x=g('data-del'))){o.items=o.items.filter(z=>z.uid!==x.dataset.del);O.save();return}
  if((x=g('data-nt'))){noteFor(o,it('nt'));return}
  if((x=g('data-void'))){voidItem(o,it('void'));return}
});
document.addEventListener('change',e=>{
  const x=e.target;
  if(x.dataset.sw){const[k,id]=x.dataset.sw.split(':');S().stations.find(s=>s.id===id)[k]=x.checked;O.save();O.toast('ذخیره شد')}
  if(x.dataset.route){O.setRoute(x.dataset.route,x.value);O.toast('مسیر «'+x.dataset.route+'» ← '+O.st(x.value).name)}
});
document.addEventListener('click',e=>{if(e.target.id==='saveSet'){const s=S().settings;s.service=+O.en($('#svc').value)||0;s.vat=+O.en($('#vat').value)||0;s.voidNeedsManager=$('#vnm').checked;O.save();O.toast('ذخیره شد')}
  if(e.target.id==='reset'){O.reset();U.sel=null;O.toast('دادهٔ نمونه بازگشت','rotate-ccw')}});
O.on(()=>{if(U.sel&&!O.order(U.sel))U.sel=null;render()});
setInterval(()=>{$('#clk')&&($('#clk').textContent=O.clock(Date.now()));if(U.view==='tables')render()},30000);
U.sel=S().orders[0]&&S().orders[0].id;
render();
})();
