/* Rayo Panel prototype — پرسنل و کاربران
   Monthly cycle: تردد → کارکرد تأییدشده → حقوق → سند حقوق → پرداخت (same payment form) */
(function(){
'use strict';
const WD=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];

/* month-by-month file for one person (closed months are fixed snapshots) */
P.staffMonths=sid=>{
  const s=P.staff(sid),r=RT.rng(sid.charCodeAt(1)*97),out=[];
  const startM=s.start.startsWith('1405')?(+s.start.split('/')[1]-1):0;
  for(let m=startM;m<7;m++){
    const hours=Math.round(150+r()*50),gross=s.contract==='ساعتی'?hours*s.rate*(0.93+r()*.06)+3e6:s.rate*(1+r()*.12);
    const ded=gross*(0.08+r()*.06),net=Math.round((gross-ded)/1e4)*1e4;
    const doc=m===6?D.DOCS.find(d=>d.party===sid&&d.title==='حقوق مهر'):null;
    out.push({m,month:D.MONTHS[m],hours,gross:Math.round(gross/1e4)*1e4,ded:Math.round(ded/1e4)*1e4,net:doc?doc.amount:net,paid:doc?doc.paid:net,tips:Math.round((2+r()*3)*1e2)*1e4,leave:Math.round(r()*2)});
  }
  const pr=D.PAYROLL.find(p=>p.sid===sid);
  if(pr){const doc=D.DOCS.find(d=>d.party===sid&&d.type==='payroll'&&d.title==='حقوق آبان');out.push({m:7,month:'آبان',hours:pr.hours,gross:P.gross(pr),ded:P.ded(pr),net:P.net(pr),paid:doc?doc.paid:0,tips:P.tipOf(sid),leave:0,open:true})}
  return out;
};

/* ---------- actions ---------- */
P.actions.request=(sid,type)=>P.form({title:'درخواست پرسنل',ok:'ثبت درخواست',body:`<div class="form-grid">
  ${P.field('پرسنل',`<select class="select" name="sid">${P.opts(D.STAFF.map(s=>[s.id,s.name]),sid||'s5')}</select>`)}
  ${P.field('نوع',`<select class="select" name="type">${P.opts(['مرخصی','مساعده','اصلاح کارکرد','جابه‌جایی شیفت'].map(x=>[x,x]),type||'مرخصی')}</select>`)}
  <div class="full">${P.field('جزئیات','<input class="input" name="detail" placeholder="تاریخ، ساعت یا مبلغ">')}</div></div>`,
  info:'مساعدهٔ تأییدشده یک «سند مساعده» در حساب همان پرسنل است و در حقوق ماه خودکار کسر می‌شود. پرداختش با همان فرم پرداخت مالی است.',
  onOk:f=>{D.REQUESTS.unshift({id:'r'+Date.now(),type:f.type.value,sid:f.sid.value,date:D.TODAY,detail:f.detail.value||'—',status:'pending'});P.toast('درخواست ثبت شد')}});

P.actions.payslip=sid=>{const s=P.staff(sid),r=D.PAYROLL.find(p=>p.sid===sid);
  const L=(a,b)=>`<tr><td>${a}</td><td class="num">${P.t(b)}</td></tr>`;
  P.modal({title:'فیش حقوق آبان ۱۴۰۵ — '+s.name,size:'wide',body:`<div class="grid grid-2">
    <div><h3>کارکرد</h3><dl class="kv mt"><dt>نوع قرارداد</dt><dd>${s.contract}</dd><dt>ساعت کارکرد</dt><dd>${P.fa(r.hours)}</dd><dt>اضافه‌کار</dt><dd>${P.fa(r.ot)} ساعت</dd><dt>نرخ</dt><dd>${P.t(s.rate)} ${s.contract==='ساعتی'?'هر ساعت':'ماهانه'}</dd></dl></div>
    <div><h3>خلاصه</h3><dl class="kv mt"><dt>جمع مزایا</dt><dd>${P.T(P.gross(r))}</dd><dt>جمع کسور</dt><dd>${P.T(P.ded(r))}</dd><dt>خالص پرداختی</dt><dd><b>${P.T(P.net(r))}</b></dd></dl></div></div>
    <div class="grid grid-2"><div class="table-wrap"><table class="table"><thead><tr><th>مزایا</th><th class="num">تومان</th></tr></thead><tbody>${L('حقوق / کارکرد',r.base)}${L('اضافه‌کار',r.otPay)}${L('پاداش',r.bonus)}</tbody></table></div>
    <div class="table-wrap"><table class="table"><thead><tr><th>کسور</th><th class="num">تومان</th></tr></thead><tbody>${L('بیمهٔ سهم کارگر',r.ins)}${L('مالیات',r.tax)}${L('مساعده',r.adv)}${L('جریمه',r.fine)}${L('مصرف پرسنلی',r.meal)}${L('خسارت وسیله',r.damage)}</tbody></table></div></div>
    <div class="sum-box mt"><span>انعام آبان — جدا از حقوق؛ بیمه و مالیات ندارد</span><b>${P.T(P.tipOf(sid))}</b></div>`,
    foot:`<button class="btn btn-ghost" data-close>بستن</button><button class="btn btn-secondary" onclick="P.toast('PDF فیش آماده شد')">${P.ic('printer')}چاپ / PDF</button>`})};

/* ---------- tabs ---------- */
function staffList(r){
  if(r.param)return profile(r.param);
  return`<div class="grid grid-4">
    ${P.kpi({label:'پرسنل فعال',icon:'users',value:P.fa(D.STAFF.length),unit:'نفر',foot:P.fa(D.STAFF.filter(s=>s.contract==='ساعتی').length)+' ساعتی · '+P.fa(D.STAFF.filter(s=>s.contract==='ماهانه').length)+' ماهانه'})}
    ${P.kpi({label:'کارکرد آبان تا امروز',icon:'clock',value:P.t(D.PAYROLL.reduce((s,p)=>s+p.hours,0)),unit:'ساعت'})}
    ${P.kpi({label:'برآورد حقوق آبان',icon:'wallet',value:RT.money(D.PAYROLL.reduce((s,p)=>s+P.gross(p),0)),unit:'تومان',foot:RT.pct(D.PAYROLL.reduce((s,p)=>s+P.gross(p),0)/D.SALES_MONTHS[7].sales*100)+' از فروش تا امروز'})}
    ${P.kpi({label:'درخواست باز',icon:'inbox',value:P.fa(D.REQUESTS.filter(x=>x.status==='pending').length),unit:'مورد',tone:'warning',foot:'<a href="#/people/requests">بررسی</a>'})}
  </div>
  <div class="mt">${P.card({flush:1,body:`<div class="toolbar"><label class="search">${P.ic('search')}<input placeholder="نام پرسنل"></label>${P.chips('sec',[['all','همه'],['سالن','سالن'],['بار','بار'],['آشپزخانه','آشپزخانه']],'all')}</div>
    ${P.table(['پرسنل','بخش','قرارداد',{t:'ساعت آبان',n:1},{t:'خالص تخمینی آبان',n:1},{t:'ماندهٔ حساب',n:1},'بیمه',''],D.STAFF.map(s=>{const p=D.PAYROLL.find(x=>x.sid===s.id),b=P.balance(s.id);return{cls:'click',attr:`onclick="P.go('#/people/staff/${s.id}')"`,c:[
      P.cellMain(s.name,s.role,null,true),s.section,s.contract,P.fa(p.hours),P.t(P.net(p)),`<span class="${b>0?'dir-out':b<0?'dir-in':'muted'}">${b===0?'—':P.t(Math.abs(b))+(b>0?' طلب پرسنل':' بدهی پرسنل')}</span>`,s.insured?P.b('دارد','success',1):P.b('ندارد','neutral',1),P.ic('chevron-left','muted')]}}))}`})}</div>`;
}
let profTab='months';
function profile(sid){
  const s=P.staff(sid),ms=P.staffMonths(sid),b=P.balance(sid),pr=D.PAYROLL.find(p=>p.sid===sid);
  const sumF=f=>ms.reduce((a,x)=>a+x[f],0);
  const tabs=[['months','پروندهٔ ماهانه'],['ledger','حساب مالی'],['work','کارکرد آبان'],['contract','قرارداد و مدارک']];
  let body='';
  if(profTab==='months')body=P.table(['ماه',{t:'ساعت',n:1},{t:'مرخصی (روز)',n:1},{t:'ناخالص',n:1},{t:'کسور',n:1},{t:'خالص',n:1},{t:'انعام (جدا)',n:1},{t:'پرداخت‌شده حقوق',n:1},{t:'مانده',n:1},''],
    ms.map(x=>[`<b>${x.month}</b>`,P.fa(x.hours),P.fa(x.leave),P.t(x.gross),P.t(x.ded),P.t(x.net),P.t(x.tips),P.t(x.paid),`<b class="${x.net-x.paid>0?'dir-out':''}">${P.t(x.net-x.paid)}</b>`,x.open?P.b('در جریان','warning'):P.b('بسته','neutral')]),
    {foot:['جمع ۱۴۰۵',P.t(sumF('hours')),P.fa(sumF('leave')),P.t(sumF('gross')),P.t(sumF('ded')),P.t(sumF('net')),P.t(sumF('tips')),P.t(sumF('paid')),P.t(sumF('net')-sumF('paid')),'']});
  else if(profTab==='ledger'){const docs=D.DOCS.filter(d=>d.party===sid),pays=D.PAYMENTS.filter(p=>p.party===sid);
    body=P.table(['تاریخ','شرح',{t:'به نفع پرسنل',n:1},{t:'به نفع مجموعه',n:1}],[...docs.map(d=>({d:d.date,c:[P.dd(d.date),P.DOCTYPE[d.type][0]+' — '+d.title,d.dir==='out'?P.t(d.amount):'',d.dir==='in'?P.t(d.amount):'']})),...pays.map(p=>({d:p.date,c:[P.dd(p.date),'پرداخت '+P.fa(p.no)+' — '+p.method,'',P.t(p.amount)]}))].sort((a,b)=>a.d.localeCompare(b.d)).map(x=>x.c))+
      `<div class="card-foot">همان دفتری که در «مالی ← طرف حساب‌ها» دیده می‌شود. <a href="#/finance/parties/${sid}">باز کردن در مالی</a></div>`}
  else if(profTab==='work'){const r=RT.rng(7);body=P.table(['روز','ورود','خروج',{t:'ساعت',n:1},'وضعیت'],Array.from({length:10},(_,i)=>{const d=14-i,late=r()<.15,miss=r()<.08;return[P.fa(d)+' آبان',late?'<span class="down">۱۶:۲۲</span>':'۱۵:۵۸',miss?'<span class="down">ثبت نشده</span>':'۲۳:۴۰',miss?'—':P.fa(7.5),miss?P.b('تردد ناقص','danger'):late?P.b('تأخیر ۲۲ دقیقه','warning'):P.b('عادی','success')]}))}
  else body=`<div class="card-body"><dl class="kv"><dt>سمت</dt><dd>${s.role} · ${s.section}</dd><dt>شروع همکاری</dt><dd>${P.d(s.start)}</dd><dt>نوع قرارداد</dt><dd>${s.contract} — ${P.t(s.rate)} تومان ${s.contract==='ساعتی'?'هر ساعت':'ماهانه'}</dd><dt>بیمه</dt><dd>${s.insured?'دارد':'ندارد'}</dd><dt>تلفن</dt><dd>${s.phone}</dd><dt>مدارک</dt><dd>${P.b('کارت ملی','success',1)} ${P.b('کارت بهداشت — ۲ ماه تا انقضا','warning',1)} ${P.b('قرارداد ۱۴۰۵','success',1)}</dd><dt>دسترسی پنل</dt><dd>${D.USERS.find(u=>u.staff===sid)?P.b(D.ROLES.find(x=>x.id===D.USERS.find(u=>u.staff===sid).role).name,'info',1):'ندارد'}</dd></dl></div>`;
  return`<div class="row" style="margin-bottom:var(--s4)"><a class="btn btn-ghost btn-sm" href="#/people/staff">${P.ic('arrow-right')}همهٔ پرسنل</a></div>
  <div class="card hero"><div class="avatar">${P.initials(s.name)}</div><div style="flex:1"><h2>${s.name}</h2><p class="muted">${s.role} · ${s.section} · ${s.contract} · از ${P.d(s.start)}</p></div>
    <div class="actions"><button class="btn btn-secondary btn-sm" onclick="P.actions.payslip('${sid}')">${P.ic('file-text')}فیش آبان</button><button class="btn btn-secondary btn-sm" onclick="P.actions.request('${sid}','مساعده')">${P.ic('hand-coins')}مساعده</button>${b>0&&P.can('finance','full')?`<button class="btn btn-primary btn-sm" onclick="P.pay({party:'${sid}'})">${P.ic('send')}پرداخت</button>`:''}</div></div>
  <div class="grid grid-4 mt">
    ${P.kpi({label:'ساعت آبان',icon:'clock',value:P.fa(pr.hours),unit:'ساعت',foot:P.fa(pr.ot)+' ساعت اضافه‌کار'})}
    ${P.kpi({label:'خالص تخمینی آبان',icon:'wallet',value:RT.money(P.net(pr)),unit:'تومان'})}
    ${P.kpi({label:'دریافتی ۱۴۰۵ تا امروز',icon:'banknote',value:RT.money(sumF('paid')),unit:'تومان'})}
    ${P.kpi({label:'ماندهٔ حساب',icon:'scale',value:RT.money(Math.abs(b)),unit:'تومان',tone:b>0?'warning':'',foot:b>0?'مجموعه بدهکار است':b<0?'پرسنل بدهکار است':'تسویه'})}
  </div>
  <div class="card flush mt"><div class="card-body" style="padding:0 var(--s5)"><div class="tabs" style="margin:0">${tabs.map(([k,l])=>`<button class="tab ${k===profTab?'active':''}" data-pt="${k}">${l}</button>`).join('')}</div></div>${body}</div>`;
}

function attendance(){
  const sh={'صبح':['m','۸–۱۶'],'عصر':['e','۱۶–۲۴'],'کامل':['f','۱۲–۲۴'],'off':['off','—']};
  const plan=D.STAFF.map((s,i)=>WD.map((_,d)=>{if(s.shift==='آخر هفته')return d>=5?'کامل':'off';if((i+d)%6===5)return'off';return s.shift}));
  return`<div class="grid grid-4">
    ${P.kpi({label:'تأخیر این هفته',icon:'alarm-clock',value:P.fa(4),unit:'مورد',tone:'warning'})}
    ${P.kpi({label:'تردد ناقص',icon:'clock',value:P.fa(2),unit:'مورد',tone:'danger',foot:'نیاز به اصلاح قبل از حقوق'})}
    ${P.kpi({label:'پوشش شیفت جمعه',icon:'users',value:'۸۵٪',foot:'۱ باریستا کمتر از نیاز'})}
    ${P.kpi({label:'آخرین ورود تردد',icon:'fingerprint',value:'۱۵ آبان',foot:'از دستگاه حضور و غیاب'})}
  </div>
  <div class="mt">${P.card({title:'برنامهٔ شیفت هفتهٔ ۱۷ تا ۲۳ آبان',flush:1,actions:`<button class="btn btn-secondary btn-sm">${P.ic('copy')}کپی از هفتهٔ قبل</button><button class="btn btn-secondary btn-sm" onclick="P.toast('برنامه برای پرسنل ارسال شد')">${P.ic('send')}انتشار برای پرسنل</button>`,
    body:P.table(['پرسنل',...WD],D.STAFF.map((s,i)=>[P.cellMain(s.name,s.role,null,true),...plan[i].map(x=>`<span class="shift ${sh[x][0]}">${x==='off'?'استراحت':x+' '+sh[x][1]}</span>`)]),{cls:'shift-grid'})})}</div>
  <div class="mt">${P.card({title:'موارد نیازمند اصلاح',flush:1,actions:`<button class="btn btn-secondary btn-sm">${P.ic('upload')}ورود فایل تردد</button>`,
    body:P.table(['پرسنل','تاریخ','مورد',''],[[P.staff('s7').name,'۱۲ آبان','خروج ثبت نشده',`<button class="btn btn-ghost btn-sm" onclick="P.toast('اصلاح شد')">اصلاح</button>`],[P.staff('s4').name,'۱۳ آبان','تأخیر ۲۲ دقیقه',`<button class="btn btn-ghost btn-sm">موجه</button>`],[P.staff('s5').name,'۱۰ آبان','ورود ثبت نشده',`<button class="btn btn-ghost btn-sm">اصلاح</button>`]])})}</div>`;
}

let finalized=false;
function payroll(){
  const rows=D.PAYROLL.map(r=>{const s=P.staff(r.sid),doc=D.DOCS.find(d=>d.party===r.sid&&d.title==='حقوق آبان');return[P.cellMain(s.name,s.contract,null,true),P.fa(r.hours),P.t(r.base+r.otPay),P.t(r.bonus),
    `<span title="بیمه ${P.t(r.ins)} · مالیات ${P.t(r.tax)} · مساعده ${P.t(r.adv)} · جریمه ${P.t(r.fine)} · مصرف ${P.t(r.meal)} · خسارت ${P.t(r.damage)}">${P.t(P.ded(r))}</span>`,
    `<b>${P.t(P.net(r))}</b>`,doc?P.docState(doc):P.b('پیش‌نویس','neutral'),
    `<button class="btn btn-ghost btn-sm" onclick="P.actions.payslip('${r.sid}')">${P.ic('file-text')}</button>${doc&&P.rem(doc)>0&&P.can('finance','full')?`<button class="btn btn-secondary btn-sm" onclick="P.pay({party:'${r.sid}',docs:['${doc.id}'],title:'ثبت پرداخت حقوق — ${s.name}'})">ثبت پرداخت</button>`:''}`]});
  const tot=f=>D.PAYROLL.reduce((s,r)=>s+f(r),0);
  return`${P.card({title:'حقوق آبان ۱۴۰۵',sub:'هر مرحله پیش‌نیاز مرحلهٔ بعد است',body:P.stepper([['ورود تردد','تا ۱۵ آبان','done'],['تأیید کارکرد','۲ مورد اصلاح',finalized?'done':'cur'],['محاسبه','خودکار',finalized?'done':''],['نهایی و سند حقوق','بدهی به پرسنل',finalized?'done':''],['پرداخت','از فرم مشترک',finalized?'cur':'']])})}
  <div class="mt">${P.card({flush:1,title:'جدول حقوق',sub:'مساعده، خسارت وسیله، جریمه و مصرف پرسنلی خودکار از حساب هر نفر کسر شده‌اند',
    actions:`<button class="btn btn-secondary btn-sm" onclick="P.toast('فایل گروهی بانک ساخته شد (نمونه)')">${P.ic('file-spreadsheet')}فایل پرداخت گروهی بانک</button>${!finalized&&P.can('people','full')?`<button class="btn btn-primary btn-sm" onclick="P.finalizePayroll()">${P.ic('lock')}نهایی کردن و ثبت سند حقوق</button>`:''}`,
    body:P.table(['پرسنل',{t:'ساعت',n:1},{t:'کارکرد + اضافه‌کار',n:1},{t:'پاداش',n:1},{t:'کسور',n:1},{t:'خالص',n:1},'وضعیت',''],rows,
      {foot:['جمع',P.t(tot(r=>r.hours)),P.t(tot(r=>r.base+r.otPay)),P.t(tot(r=>r.bonus)),P.t(tot(P.ded)),P.t(tot(P.net)),'','']})})}</div>
  <div class="grid grid-2 mt">
    ${P.note('<b>پرداخت حقوق دیگر جدا نیست.</b> با «نهایی کردن»، برای هر نفر یک سند حقوق (بدهی مجموعه به پرسنل) در دفتر طرف حساب ساخته می‌شود و مساعده و خسارت‌های باز با آن تهاتر می‌شوند. دکمهٔ «پرداخت» همان فرم پرداخت مالی است.','link')}
    ${P.note('هزینهٔ کارفرما (بیمهٔ سهم کارفرما، ذخیرهٔ عیدی و سنوات) در سود و زیان همین ماه دیده می‌شود، حتی اگر پرداختش بعداً باشد.','info')}
  </div>`;
}
P.finalizePayroll=()=>{
  D.PAYROLL.forEach(r=>{if(!D.DOCS.some(d=>d.party===r.sid&&d.title==='حقوق آبان'))D.DOCS.push({id:'pay-'+r.sid,no:'ح-۰۸'+P.fa(r.sid.slice(1).padStart(2,'0')),date:'1405/08/30',due:'1405/09/05',party:r.sid,type:'payroll',title:'حقوق آبان',amount:P.net(r),paid:0,dir:'out',source:'حقوق ماه آبان',status:'final'});
    D.DOCS.filter(d=>d.party===r.sid&&d.dir==='in'&&['advance','damage'].includes(d.type)).forEach(d=>d.paid=d.amount)});
  finalized=true;P.toast('حقوق آبان نهایی شد؛ '+P.fa(D.PAYROLL.length)+' سند حقوق ساخته و مساعده‌ها تهاتر شد');P.render();
};

/* ---------- tips (انعام): three kinds, equal split, separate from payroll ----------
   recorded at shift close → split equally among recipients → cash part already handed out on the spot,
   card/transfer part paid at month end with one «انعام» document per person */
let tipsDone=false;
function tips(){
  const sp=P.tipSplit().filter(x=>x.total>0),sum=(a,k)=>a.reduce((s,x)=>s+x[k],0),T=k=>D.TIP_IN.filter(e=>e.target===k).reduce((s,e)=>s+e.amount,0);
  const doc=sid=>D.DOCS.find(d=>d.party===sid&&d.type==='tip'&&d.title==='انعام آبان'),last=D.TIP_HISTORY[D.TIP_HISTORY.length-1];
  const kinds=[['shift','سالن همان شیفت','users','مساوی بین بچه‌های سالنِ همان شیفت'],['all','برای همه','users-round','مساوی بین همهٔ حاضران همان شیفت، به‌جز پیک'],['person','شخصی','user','کامل به همان نفر (مثلاً پیک)؛ تقسیم نمی‌شود']];
  return`<div class="grid grid-4">
    ${P.kpi({label:'انعام آبان تا امروز',icon:'hand-heart',value:RT.money(P.tipPool()),unit:'تومان',foot:P.fa(D.TIP_IN.length)+' ثبت از بستن صندوق'})}
    ${P.kpi({label:'نقد — سر شیفت تقسیم شد',icon:'banknote',value:RT.money(sum(sp,'spot')),unit:'تومان',foot:'پرداخت‌شده؛ فقط برای پرونده ثبت شده'})}
    ${P.kpi({label:'کارت و انتقال — پایان ماه',icon:'credit-card',value:RT.money(sum(sp,'month')),unit:'تومان',tone:'warning',foot:'با سند انعام هر نفر پرداخت می‌شود'})}
    ${P.kpi({label:'انعام مهر',icon:'history',value:RT.money(last.total),unit:'تومان',foot:'تقسیم و پرداخت شده'})}
  </div>
  <div class="grid grid-3 mt">${kinds.map(([k,t,i,d])=>P.card({body:`<div class="cell-main"><span class="thumb kpi-icon">${P.ic(i)}</span><div><b>${t}</b><small>${d}</small></div></div><div class="sum-box mt"><span>آبان تا امروز</span><b>${P.T(T(k))}</b></div>`})).join('')}</div>
  <div class="mt">${P.card({flush:1,title:'سهم هر نفر — آبان ۱۴۰۵',sub:'تقسیم مساوی بین دریافت‌کنندگان هر ثبت؛ حاضران هر شیفت از برنامهٔ شیفت (در فاز بعد: تردد). گرد به ۱۰ هزار؛ باقی‌مانده به دورهٔ بعد.',
    actions:!tipsDone&&P.can('people','full')?`<button class="btn btn-primary btn-sm" onclick="P.finalizeTips()">${P.ic('lock')}بستن انعام ماه و ثبت سند</button>`:'',
    body:P.table(['پرسنل','بخش',{t:'سالن شیفت',n:1},{t:'برای همه',n:1},{t:'شخصی',n:1},{t:'جمع',n:1},{t:'نقد سر شیفت',n:1},{t:'قابل پرداخت',n:1},'وضعیت',''],sp.map(x=>{const s=P.staff(x.sid),d=doc(x.sid);return[
      P.cellMain(s.name,s.role,null,true),s.section,P.t(x.shift),P.t(x.all),P.t(x.person),`<b>${P.t(x.total)}</b>`,`<span class="muted">${P.t(x.spot)}</span>`,`<b>${P.t(x.month)}</b>`,
      d?P.docState(d):P.b('ماه باز','neutral'),
      d&&P.rem(d)>0&&P.can('finance','full')?`<button class="btn btn-secondary btn-sm" onclick="P.pay({party:'${x.sid}',docs:['${d.id}'],title:'ثبت پرداخت انعام — ${s.name}'})">ثبت پرداخت</button>`:'']}),
      {foot:['جمع','',P.t(sum(sp,'shift')),P.t(sum(sp,'all')),P.t(sum(sp,'person')),P.t(sum(sp,'total')),P.t(sum(sp,'spot')),P.t(sum(sp,'month')),`<small class="muted">باقی‌مانده ${P.t(P.tipSplit().rest)}</small>`,'']})})}</div>
  <div class="grid grid-2 mt">
    ${P.card({title:'آخرین ثبت‌ها',sub:'از فرم «بستن صندوق شیفت»',flush:1,body:P.table(['تاریخ','شیفت','برای','منبع',{t:'مبلغ',n:1},{t:'نفرات',n:1}],D.TIP_IN.slice(-8).reverse().map(e=>[P.dd(e.date),e.shift,
      P.b(e.target==='person'?P.staff(e.sid).name:D.TIP_TARGET[e.target][0],e.target==='all'?'info':'neutral',1),D.TIP_SRC[e.src][0]+(e.spot?' <small class="muted">(سر شیفت)</small>':''),P.t(e.amount),P.fa(P.tipTo(e).length)]))})}
    <div class="stack">
      ${P.note('<b>انعام نه فروش است و نه حقوق.</b> در فروش روز و سود و زیان نمی‌آید و جزء مزد بیمه نیست؛ در فیش و پروندهٔ ماهانه جدا دیده می‌شود. (رفتار بیمه و مالیاتی با حسابدار تأیید شود.)','info')}
      ${P.note('<b>پیک:</b> فقط انعام «شخصی» خودش را می‌گیرد و از انعام «برای همه» سهم ندارد. <b>پارکبان:</b> انعام نقدی‌اش مستقیم به خودش می‌رسد و در هیچ بخش ثبت نمی‌شود.','bike')}
      ${P.note('انعام نقدی سر شیفت بین حاضران تقسیم می‌شود و فقط برای پرونده ثبت می‌شود. انعام کارتخوان و کارت به کارت به حساب بانک می‌رسد و پایان ماه با سند انعام پرداخت می‌شود.','banknote')}
    </div>
  </div>
  <div class="mt">${P.card({title:'دوره‌های قبل',flush:1,body:P.table(['ماه',{t:'جمع انعام',n:1},'وضعیت'],D.TIP_HISTORY.slice().reverse().map(h=>[D.MONTHS[h.m],P.t(h.total),P.b('تقسیم و پرداخت شد','success')]))})}</div>`;
}
P.finalizeTips=()=>{let n=0;
  P.tipSplit().forEach(x=>{if(x.month>0&&!D.DOCS.some(d=>d.party===x.sid&&d.type==='tip'&&d.title==='انعام آبان')){n++;
    D.DOCS.push({id:'tip-'+x.sid,no:'ان-۰۸'+P.fa(String(n).padStart(2,'0')),date:'1405/08/30',due:'1405/08/30',party:x.sid,type:'tip',title:'انعام آبان',amount:x.month,paid:0,dir:'out',source:'انعام کارت و انتقال آبان',status:'final'})}});
  tipsDone=true;P.toast(`انعام آبان بسته شد؛ ${P.fa(n)} سند انعام (بخش کارت و انتقال) ثبت شد`);P.render();
};

function requests(){
  const tone={'مرخصی':'info','مساعده':'warning','اصلاح کارکرد':'accent','جابه‌جایی شیفت':'neutral'};
  return P.card({flush:1,title:'درخواست‌ها',sub:'از پنل پرسنل یا ثبت مدیر',body:P.table(['تاریخ','پرسنل','نوع','جزئیات','وضعیت',''],D.REQUESTS.map(r=>[P.dd(r.date),P.cellMain(P.staff(r.sid).name,P.staff(r.sid).role,null,true),P.b(r.type,tone[r.type]||'neutral',1),r.detail,
    r.status==='pending'?P.b('منتظر تصمیم','warning'):r.status==='approved'?P.b('تأیید شد','success'):P.b('رد شد','danger'),
    r.status==='pending'&&P.can('people','full')?`<button class="btn btn-secondary btn-sm" onclick="P.decide('${r.id}','approved')">تأیید</button> <button class="btn btn-ghost btn-sm" onclick="P.decide('${r.id}','rejected')">رد</button>`:'']))});
}
P.decide=(id,st)=>{const r=D.REQUESTS.find(x=>x.id===id);r.status=st;
  if(st==='approved'&&r.type==='مساعده'){const amt=P.num(r.detail);D.DOCS.push({id:'adv'+id,no:'م-'+P.fa(D.DOCS.length),date:D.TODAY,due:'1405/08/30',party:r.sid,type:'advance',title:'مساعدهٔ آبان',amount:amt,paid:0,dir:'in',source:'درخواست مساعده',status:'final'});P.toast('مساعده تأیید شد؛ برای پرداخت به «مالی» رفت و در حقوق کسر می‌شود')}
  else P.toast(st==='approved'?'تأیید شد':'رد شد');P.render()};

function training(){
  const cl=[['باز کردن کافه','صبح',92,'s6'],['بستن بار و شست‌وشوی دستگاه','شب',78,'s2'],['بهداشت آشپزخانه','روزانه',85,'s3'],['کالیبره کردن آسیاب','هفتگی',100,'s2']];
  return`<div class="grid grid-2">${P.card({title:'چک‌لیست‌های فعال',flush:1,body:P.table(['چک‌لیست','تکرار','انجام این ماه','مسئول'],cl.map(([a,b,c,d])=>[a,b,`<div class="row"><div class="meter ${c>90?'ok':c>80?'warn':'bad'}" style="width:100px"><i style="width:${c}%"></i></div>${P.fa(c)}٪</div>`,P.staff(d).name]))})}
    ${P.card({title:'آموزش‌ها',flush:1,body:P.table(['آموزش','مخاطب','گذرانده'],[['استاندارد عصارهٔ اسپرسو','بار','۳ از ۳'],['پروتکل برخورد با شکایت','سالن','۴ از ۵'],['ایمنی سرخ‌کن و تعویض روغن','آشپزخانه','۲ از ۲']])})}</div>`;
}

function users(){
  const mods=[['home','میز کار'],['finance','مالی'],['inventory','انبار'],['people','پرسنل'],['menu','منو'],['reports','گزارش'],['settings','تنظیمات']];
  const lab={full:'کامل',edit:'ثبت',view:'دیدن',none:'—'};
  return`<div class="grid grid-3">
    <div class="span-2">${P.card({title:'کاربران پنل',flush:1,actions:`<button class="btn btn-primary btn-sm" onclick="P.toast('فرم کاربر جدید (نمونه)')">${P.ic('user-plus')}کاربر جدید</button>`,
      body:P.table(['کاربر','نقش','پرسنل مرتبط','آخرین ورود','وضعیت'],D.USERS.map(u=>[P.cellMain(u.name,'',null,true),P.b(D.ROLES.find(r=>r.id===u.role).name,'info',1),u.staff?`<a href="#/people/staff/${u.staff}">${P.staff(u.staff).name}</a>`:'—',u.last,u.active?P.b('فعال','success'):P.b('غیرفعال','neutral')]))})}</div>
    ${P.card({title:'اصول دسترسی',body:`<ul class="spec-list"><li>هر کاربر <b>یک نقش</b> دارد؛ نقش‌ها از قبل تعریف‌اند و فقط در صورت نیاز ریز می‌شوند.</li><li>کاربری که پرسنل است به پروندهٔ پرسنلی‌اش وصل است؛ نقش «پرسنل» فقط اطلاعات خودش را می‌بیند.</li><li><b>ثبت</b> و <b>تأیید</b> جدا هستند (مثلاً انباردار ضایعات ثبت می‌کند، مدیر تأیید).</li><li>کاربر غیرفعال می‌شود، حذف نمی‌شود؛ سابقهٔ ثبت‌هایش می‌ماند.</li><li>در فاز بعد، کنترل دسترسی در Backend هم اعمال می‌شود (فعلاً فقط در مرورگر).</li></ul>`})}
  </div>
  <div class="mt">${P.card({title:'ماتریس نقش‌ها',sub:'کامل = ثبت و تأیید · ثبت = ثبت بدون تأیید · دیدن = فقط مشاهده',flush:1,
    body:P.table(['نقش',...mods.map(m=>m[1])],D.ROLES.map(r=>[`<b>${r.name}</b><small class="muted" style="display:block">${r.desc}</small>`,...mods.map(([k])=>{const v=D.PERM[r.id][k];return`<span class="p ${v}">${lab[v]}</span>`})]),{cls:'perm'})})}</div>`;
}

function reports(){return`<div class="grid grid-2">${P.card({title:'هزینهٔ پرسنل به نسبت فروش',sub:'۱۴۰۵ — هدف ۲۵ تا ۳۰٪',body:'<div class="chart" id="pplLabor"></div>'})}${P.card({title:'ساعت کارکرد به تفکیک بخش',sub:'آبان تا امروز',body:'<div class="chart" id="pplHours"></div>'})}</div>
  <div class="mt">${P.card({title:'گزارش‌های آماده',body:`<div class="tiles">${['خلاصهٔ حقوق ماه','لیست بیمه','کارکرد ماهانه','پروندهٔ سالانهٔ هر نفر','مرخصی و غیبت','تأخیرها','انعام هر نفر به تفکیک ماه','خروجی AI پرسنل'].map(t=>`<button class="tile" onclick="P.toast('${t}: نمونه')"><span class="kpi-icon">${P.ic('file-spreadsheet')}</span><b>${t}</b><small>Excel · PDF</small></button>`).join('')}</div>`})}</div>`}
function mountReports(){
  const ms=D.SALES_MONTHS.slice(0,7);
  RT.chart('pplLabor',t=>Object.assign(RT.base(t),{xAxis:RT.axis(t,{type:'category',data:ms.map(x=>D.MONTHS[x.m]),inverse:true,splitLine:{show:false}}),yAxis:RT.axis(t,{type:'value',position:'right',min:15,axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>P.fa(v)+'٪'}}),
    tooltip:Object.assign(RT.base(t).tooltip,{formatter:p=>RT.tipRow(p[0].color,p[0].axisValue,RT.pct(p[0].value))}),
    series:[{type:'line',smooth:true,data:ms.map(x=>+(x.labor/x.sales*100).toFixed(1)),areaStyle:{opacity:.12},markArea:{silent:true,itemStyle:{color:t.success,opacity:.08},data:[[{yAxis:25},{yAxis:30}]]}}]}));
  const sec={};D.STAFF.forEach(s=>sec[s.section]=(sec[s.section]||0)+D.PAYROLL.find(p=>p.sid===s.id).hours);
  RT.chart('pplHours',t=>Object.assign(RT.base(t),{tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>RT.tipRow(p.color,p.name,P.fa(p.value)+' ساعت')}),series:[{type:'pie',radius:['50%','78%'],itemStyle:{borderColor:t.surface,borderWidth:2,borderRadius:6},label:{color:t.text2,fontFamily:t.font},data:Object.entries(sec).map(([name,value])=>({name,value}))}]}));
}

/* tip rules: who receives each kind; saving asks the scope (closed months never change) */
function tipRules(){const secs=[...new Set(D.STAFF.map(x=>x.section))],R=D.TIP_RULES;
  return P.card({title:'قاعدهٔ انعام',sub:'همه‌جا تقسیم مساوی؛ فقط مشخص می‌کنید چه کسانی سهم دارند',body:`<div class="stack" style="gap:var(--s4)">
    <div><b style="font-size:13px">«سالن همان شیفت» بین:</b><div class="row mt" style="flex-wrap:wrap">${secs.map(x=>`<label class="check"><input type="checkbox" data-hall="${x}" ${R.hall.includes(x)?'checked':''}>${x}</label>`).join('')}</div></div>
    <div><b style="font-size:13px">«برای همه» بین حاضران همان شیفت، به‌جز:</b><div class="row mt" style="flex-wrap:wrap">${secs.map(x=>`<label class="check"><input type="checkbox" data-ex="${x}" ${R.excludeAll.includes(x)?'checked':''}>${x}</label>`).join('')}</div></div>
    <p class="muted" style="font-size:12px">«سالن» یعنی ویترها و سالن‌کارها (هر کس بخشش در پروندهٔ پرسنلی «سالن» است). «شخصی» همیشه کامل به همان نفر می‌رسد. انعام نقدی پارکبان ثبت نمی‌شود.</p>
    <div><button class="btn btn-secondary btn-sm" onclick="P.saveTipRules(this)">${P.ic('save')}ذخیرهٔ قاعده</button></div></div>`})}
P.saveTipRules=btn=>{const c=btn.closest('.card'),R=D.TIP_RULES,pick=k=>[...c.querySelectorAll('[data-'+k+']')].filter(x=>x.checked).map(x=>x.dataset[k]);
  const hall=pick('hall'),ex=pick('ex'),txt=(h,e)=>'سالن: '+h.join('+')+' · همه به‌جز '+(e.join('+')||'هیچ‌کس');
  P.setChange({area:'پرسنل',name:'قاعدهٔ انعام',from:txt(R.hall,R.excludeAll),to:txt(hall,ex),openNote:'سهم انعام آبان (ماه باز) با قاعدهٔ جدید دوباره حساب شود',
    apply:scope=>{R.hall=hall;R.excludeAll=ex;return scope==='open'?D.TIP_IN.length:0}})};
function settings(){return`<div class="grid grid-2">
  ${P.card({title:'پایهٔ حقوق سال ۱۴۰۵',sub:'هر سال طبق مصوبهٔ شورای عالی کار وارد شود؛ نسخهٔ سال قبل حفظ می‌شود',body:`<div class="form-grid">
    ${P.field('حداقل مزد روزانه',P.money('a','','مصوبهٔ ۱۴۰۵'))}${P.field('حق مسکن (ماهانه)',P.money('b','','مصوبهٔ ۱۴۰۵'))}${P.field('بن خواربار (ماهانه)',P.money('c','','مصوبهٔ ۱۴۰۵'))}${P.field('حق اولاد (هر فرزند)',P.money('d','','مصوبهٔ ۱۴۰۵'))}
    ${P.field('بیمهٔ سهم کارگر','<div class="input-group"><input class="input" value="۷"><span class="suffix">٪</span></div>')}${P.field('بیمهٔ سهم کارفرما (+بیکاری)','<div class="input-group"><input class="input" value="۲۳"><span class="suffix">٪</span></div>')}
    ${P.field('ضریب اضافه‌کار','<div class="input-group"><input class="input" value="۱٫۴"><span class="suffix">برابر</span></div>')}${P.field('پلکان مالیات حقوق','<button class="btn btn-secondary" type="button">تنظیم پلکان‌ها</button>')}</div>`})}
  <div class="stack">
    ${P.card({title:'ذخیره‌های ماهانه',body:`<div class="stack" style="gap:var(--s3)"><label class="check"><input type="checkbox" checked>ذخیرهٔ عیدی و پاداش ماهانه در هزینهٔ ماه</label><label class="check"><input type="checkbox" checked>ذخیرهٔ سنوات ماهانه</label><label class="check"><input type="checkbox" checked>مرخصی استحقاقی ۲٫۵ روز در ماه (۳۰ روز در سال)</label></div>`})}
    ${P.card({title:'شیفت‌ها',flush:1,body:P.table(['شیفت','ساعت'],[['صبح','۸ تا ۱۶'],['عصر','۱۶ تا ۲۴'],['کامل','۱۲ تا ۲۴']])})}
    ${tipRules()}
    ${P.card({title:'جریمه و تشویق',body:`<p class="text-2" style="font-size:12.5px">جدول تخلفات (تأخیر، غیبت، رعایت‌نکردن پروتکل) با مبلغ یا درصد. هر جریمهٔ تأییدشده در حقوق همان ماه کسر می‌شود.</p>`})}
  </div></div>`}

P.mod({id:'people',label:'پرسنل',icon:'users',desc:'پرونده، شیفت، کارکرد، حقوق و کاربران — ماه به ماه',
  badge:()=>D.REQUESTS.filter(r=>r.status==='pending').length,
  tabs:[
    {id:'staff',label:'پرسنل',icon:'users',title:'پرسنل',render:staffList,mount:root=>P.$$('[data-pt]',root).forEach(b=>b.onclick=()=>{profTab=b.dataset.pt;P.render()}),
      actions:()=>`<button class="btn btn-primary" onclick="P.toast('فرم پرسنل جدید (نمونه)')">${P.ic('user-plus')}پرسنل جدید</button>`},
    {id:'attendance',label:'شیفت و حضور',icon:'calendar-days',desc:'برنامهٔ شیفت، تردد و اصلاح کارکرد',render:attendance},
    {id:'payroll',label:'حقوق ماه',icon:'wallet',desc:'از کارکرد تأییدشده تا پرداخت — در یک مسیر',render:payroll},
    {id:'tips',label:'انعام',icon:'hand-heart',desc:'یک صندوق انعام، یک قاعدهٔ تقسیم — جدا از حقوق',render:tips},
    {id:'requests',label:'درخواست‌ها',icon:'inbox',desc:'مرخصی، مساعده، اصلاح کارکرد',render:requests,badge:()=>D.REQUESTS.filter(r=>r.status==='pending').length,actions:()=>`<button class="btn btn-primary" onclick="P.actions.request()">${P.ic('plus')}ثبت درخواست</button>`},
    {id:'training',label:'آموزش و چک‌لیست',icon:'graduation-cap',desc:'چک‌لیست‌های روزانه و آموزش‌ها',render:training},
    {id:'users',label:'کاربران و دسترسی',icon:'shield-check',desc:'چه کسی چه چیزی را می‌بیند و ثبت می‌کند',render:users},
    {id:'reports',label:'گزارش‌ها',icon:'chart-column',desc:'گزارش‌های پرسنلی و حقوق',render:reports,mount:mountReports},
    {id:'settings',label:'تنظیمات',icon:'settings-2',desc:'پایهٔ حقوق، ذخیره‌ها، شیفت‌ها و تخلفات',render:settings}
  ]});
})();
