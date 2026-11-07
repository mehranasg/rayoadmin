/* Rayo Panel prototype — میز کار (role-based home) */
(function(){
'use strict';
const weekEnd='1405/08/22';

/* deterministic daily sales for charts */
P.dailySales=(n=30)=>{const r=RT.rng(1405);const out=[];for(let i=n-1;i>=0;i--){const day=15-i;const wd=((day+2)%7+7)%7;const w=wd===5||wd===6?1.35:1;
  out.push({label:day>0?P.fa(day)+' آبان':P.fa(30+day)+' مهر',sales:Math.round((78+r()*24)*1e6*w),prev:Math.round((72+r()*22)*1e6*w)})}return out};

function tasks(){
  const T=[];const role=P.role().id;
  const overdue=D.DOCS.filter(d=>d.dir==='out'&&P.rem(d)>0&&d.due<=D.TODAY);
  if(P.can('finance','full')&&overdue.length)T.push(['danger','file-warning',`${P.fa(overdue.length)} بدهی سررسید شده یا امروز`,overdue.map(d=>P.party(d.party).name).slice(0,3).join('، ')+' — اگر پرداخت شده، ثبت کنید','ثبت پرداخت',"P.pay()"]);
  const low=D.ITEMS.filter(i=>i.qty<i.min);
  if(P.can('inventory','edit')&&low.length)T.push(['warning','package-x',`${P.fa(low.length)} کالا زیر حداقل موجودی`,low.map(i=>i.name).slice(0,3).join('، '),'لیست سفارش',"P.go('#/inventory/reorder')"]);
  const est=D.RECEIPTS.filter(r=>r.status==='قیمت برآوردی');
  if(P.can('finance','edit')&&est.length)T.push(['info','file-check',`${P.fa(est.length)} دریافت کالا منتظر تطبیق فاکتور`,'قیمت برآوردی؛ با رسیدن فاکتور قطعی شود','تطبیق',"P.go('#/finance/docs')"]);
  if(P.can('finance','edit'))T.push(['warning','banknote','گزارش صندوق شیفت صبح امروز ثبت نشده','۱۵ آبان · شیفت صبح','بستن صندوق',"P.actions.cashClose()"]);
  const reqs=D.REQUESTS.filter(r=>r.status==='pending');
  if(P.can('people','full')&&reqs.length)T.push(['info','calendar-clock',`${P.fa(reqs.length)} درخواست پرسنل منتظر تصمیم`,reqs.map(r=>r.type).join('، '),'بررسی',"P.go('#/people/requests')"]);
  const wq=D.WASTE.filter(w=>w.status==='منتظر تأیید'),aq=D.ASSET_EVENTS.filter(a=>a.status==='منتظر تأیید');
  if(P.can('inventory','full')&&wq.length)T.push(['warning','trash-2',`${P.fa(wq.length)} ضایعات منتظر تأیید`,wq.map(w=>w.item).join('، '),'تأیید',"P.go('#/inventory/waste')"]);
  if(P.can('finance','full')&&aq.length)T.push(['danger','hammer',`${P.fa(aq.length)} خرابی وسیله منتظر تأیید`,'شکستن ۲ فنجان — حمید صادقی','بررسی',"P.go('#/finance/assets')"]);
  if(P.can('inventory','edit'))T.push(['info','scale','شمارش هفتگی لبنیات و پروتئین امروز است','۶ قلم با کنترل «دقیق»','شروع شمارش',"P.go('#/inventory/count')"]);
  const unb=D.BANK_LINES.filter(b=>!b.match);if(P.can('finance','full')&&unb.length)T.push(['warning','landmark',`${P.fa(unb.length)} ردیف گردش بانک هنوز ثبت نشده`,'پرداخت یا دریافتی که انجام شده ولی در پنل نیامده','بررسی',"P.go('#/finance/payments')"]);
  if(role==='owner'||role==='accountant')T.push(['neutral','lock','بستن ماه مهر: ۱ مورد باقی مانده','تطبیق فاکتور برق','ادامه',"P.go('#/finance/close')"]);
  return T;
}

function staffHome(){
  const sid='s7',s=P.staff(sid),pr=D.PAYROLL.find(p=>p.sid===sid),bal=P.balance(sid);
  const months=P.staffMonths?P.staffMonths(sid).slice(-4):[];
  return`<div class="card hero"><div class="avatar">${P.initials(s.name)}</div><div><h1>سلام ${s.name.split(' ')[0]} عزیز</h1><p class="muted">${s.role} · شیفت ${s.shift}</p></div></div>
  <div class="grid grid-4 mt">
    ${P.kpi({label:'کارکرد آبان تا امروز',icon:'clock',value:P.fa(pr.hours),unit:'ساعت'})}
    ${P.kpi({label:'سهم انعام آبان تا امروز',icon:'hand-heart',value:RT.money(P.tipOf(sid)),unit:'تومان',foot:'جدا از حقوق · شیفت بعدی پنجشنبه ۱۶ تا ۲۴'})}
    ${P.kpi({label:'خالص تخمینی آبان',icon:'wallet',value:RT.money(P.net(pr)),unit:'تومان',foot:'پس از کسر خسارت و مصرف پرسنلی'})}
    ${P.kpi({label:'ماندهٔ حساب من',icon:'scale',value:RT.money(Math.abs(bal)),unit:'تومان',foot:bal>0?'طلب شما از مجموعه':'بدهی شما'})}
  </div>
  <div class="grid grid-3 mt">
    <div class="span-2">${P.card({title:'پروندهٔ ماهانهٔ من',sub:'کارکرد، دریافتی و مانده — ماه به ماه',flush:1,body:P.table(['ماه',{t:'ساعت',n:1},{t:'خالص حقوق',n:1},{t:'انعام',n:1},{t:'پرداخت‌شده',n:1},{t:'مانده',n:1},''],
      months.map(r=>[r.month,P.fa(r.hours),P.t(r.net),P.t(r.tips),P.t(r.paid),P.t(r.net-r.paid),r.open?P.b('در جریان','warning'):P.b('بسته','neutral')]))})}</div>
    ${P.card({title:'درخواست جدید',body:`<div class="tiles">
      <button class="tile" onclick="P.actions.request('s7','مرخصی')"><span class="kpi-icon">${P.ic('calendar-plus')}</span><b>مرخصی</b></button>
      <button class="tile" onclick="P.actions.request('s7','مساعده')"><span class="kpi-icon">${P.ic('hand-coins')}</span><b>مساعده</b></button>
      <button class="tile" onclick="P.actions.request('s7','اصلاح کارکرد')"><span class="kpi-icon">${P.ic('clock')}</span><b>اصلاح کارکرد</b></button>
      <button class="tile" onclick="P.actions.payslip('s7')"><span class="kpi-icon">${P.ic('file-text')}</span><b>فیش آبان</b></button></div>`})}
  </div>
  <div class="mt">${P.note('<b>این نمای «پرسنل» است.</b> هر کارمند فقط اطلاعات خودش را می‌بیند؛ همان داده‌ای که مدیر در «پرسنل ← پرونده» می‌بیند.','user')}</div>`;
}

P.mod({id:'home',label:'میز کار',icon:'layout-dashboard',
  badge:()=>tasks().filter(t=>t[0]==='danger').length,
  render(){
    if(P.role().id==='staff')return staffHome();
    const yesterday=D.CASH_DAYS.filter(c=>c.date==='1405/08/14').reduce((s,c)=>s+c.pos,0);
    const dueWeek=D.DOCS.filter(d=>d.dir==='out'&&P.rem(d)>0&&d.due<=weekEnd).reduce((s,d)=>s+P.rem(d),0);
    const low=D.ITEMS.filter(i=>i.qty<i.min).length;
    const m=D.SALES_MONTHS[6];
    const T=tasks();
    const q=[['receipt','package-plus','دریافت کالا','inventory','edit'],['pay','send','ثبت پرداخت','finance','full'],['expense','receipt','ثبت هزینه','finance','edit'],['cashClose','banknote','بستن صندوق','finance','edit'],['waste','trash-2','ضایعات','inventory','edit'],['assetEvent','hammer','خرابی وسیله','finance','edit'],['request','calendar-plus','مرخصی / مساعده','people','edit']].filter(x=>P.can(x[3],x[4]));
    return`
    <div class="page-head"><div><h1>میز کار — ${P.role().name}</h1><p>کارهای امروز و وضعیت کلی در یک نگاه. هر چیزی که نیاز به اقدام دارد این‌جاست.</p></div>
      <div class="actions"><button class="btn btn-secondary" onclick="P.go('#/reports')">${P.ic('chart-line')}گزارش مدیریتی</button></div></div>
    <div class="grid grid-4">
      ${P.kpi({label:'فروش دیروز',icon:'trending-up',value:RT.money(yesterday),unit:'تومان',foot:`${RT.delta(6.4)}<span>نسبت به پنجشنبهٔ قبل</span>`})}
      ${P.kpi({label:'فروش آبان تا امروز',icon:'calendar-range',value:RT.money(D.SALES_MONTHS[7].sales),unit:'تومان',foot:`${RT.delta(3.1)}<span>نسبت به ۱۵ روز اول مهر</span>`})}
      ${P.kpi({label:'بدهی سررسید تا ۲۲ آبان',icon:'file-warning',value:RT.money(dueWeek),unit:'تومان',tone:'warning',foot:'<a class="muted" href="#/finance/docs">مشاهدهٔ فاکتورها</a>'})}
      ${P.kpi({label:'کالای زیر حداقل',icon:'package-x',value:P.fa(low),unit:'قلم',tone:low?'danger':'',foot:'<a class="muted" href="#/inventory/reorder">پیشنهاد سفارش</a>'})}
    </div>
    <div class="grid grid-3 mt">
      <div class="span-2">${P.card({title:'کارهای امروز',sub:'به ترتیب اهمیت؛ با انجام هر کار از فهرست خارج می‌شود',actions:P.b(P.fa(T.length)+' مورد','accent',1),
        body:`<div>${T.map(([tone,icon,t,s,btn,act])=>`<div class="task"><span class="thumb tone-${tone}">${P.ic(icon)}</span><div><b>${t}</b><small>${s}</small></div><button class="btn btn-secondary btn-sm" onclick="${act}">${btn}</button></div>`).join('')}</div>`})}</div>
      ${P.card({title:'چه کاری می‌خواهید انجام دهید؟',sub:'ثبت‌های پرتکرار — همیشه از دکمهٔ «ثبت جدید» هم در دسترس‌اند',body:`<div class="tiles">${q.map(([k,i,t])=>`<button class="tile" onclick="${k==='pay'?'P.pay()':`P.actions.${k}()`}"><span class="kpi-icon">${P.ic(i)}</span><b>${t}</b></button>`).join('')}</div>`})}
    </div>
    <div class="grid grid-3 mt">
      <div class="span-2">${P.card({title:'فروش روزانه',sub:'۳۰ روز اخیر در مقایسه با دورهٔ قبل',actions:'<div class="legend"><span><i style="background:var(--c1)"></i>دورهٔ جاری</span><span><i class="dash"></i>دورهٔ قبل</span></div>',body:'<div class="chart" id="hmTrend" style="height:260px"></div>'})}</div>
      ${P.card({title:'سلامت ماه گذشته (مهر)',sub:'نسبت به فروش — معیار رایج رستوران‌ها',body:`<div class="stack" style="gap:var(--s3)">${[
        ['بهای مواد (Food cost)',m.food/m.sales*100,35,'۲۸ تا ۳۵٪'],['هزینهٔ پرسنل',m.labor/m.sales*100,30,'۲۵ تا ۳۰٪'],['Prime cost (مواد + پرسنل)',(m.food+m.labor)/m.sales*100,65,'زیر ۶۵٪'],['ضایعات',m.waste/m.sales*100,2,'زیر ۲٪']]
        .map(([l,v,lim,t])=>`<div><div class="row between"><span>${l}</span><b class="num">${RT.pct(v)}</b></div><div class="meter ${v>lim?'bad':v>lim*.9?'warn':'ok'}"><i style="width:${Math.min(100,v/lim*80)}%"></i></div><small class="muted">هدف: ${t}</small></div>`).join('')}</div>`})}
    </div>`;
  },
  mount(){
    const s=P.dailySales();
    RT.chart('hmTrend',t=>Object.assign(RT.base(t),{
      xAxis:RT.axis(t,{type:'category',data:s.map(x=>x.label),inverse:true,boundaryGap:false,splitLine:{show:false},axisLabel:{color:t.text3,fontFamily:t.font,fontSize:11,interval:4}}),
      yAxis:RT.axis(t,{type:'value',position:'right',axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}}),
      tooltip:Object.assign(RT.base(t).tooltip,{formatter:p=>`<b>${p[0].axisValue}</b>`+p.map(x=>RT.tipRow(x.color,x.seriesName,RT.money(x.value))).join('')}),
      series:[{name:'دورهٔ جاری',type:'line',smooth:true,symbol:'none',data:s.map(x=>x.sales),lineStyle:{width:2.5},areaStyle:{opacity:.12}},
              {name:'دورهٔ قبل',type:'line',smooth:true,symbol:'none',data:s.map(x=>x.prev),lineStyle:{type:'dashed',width:1.5,color:t.text3},itemStyle:{color:t.text3}}]
    }));
  }
});
})();
