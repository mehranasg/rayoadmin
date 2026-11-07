/* Rayo Panel prototype — مالی
   One ledger: every payable/receivable is a document; every payment pays documents. */
(function(){
'use strict';
const openOut=()=>D.DOCS.filter(d=>d.dir==='out'&&P.rem(d)>0);
const openIn=()=>D.DOCS.filter(d=>d.dir==='in'&&P.rem(d)>0);
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);

/* ---------- shared actions ---------- */
P.actions.expense=()=>P.form({title:'ثبت هزینه',size:'wide',ok:'ثبت هزینه',
  body:`<div class="form-grid">
    ${P.field('نوع هزینه',`<select class="select" name="cat">${P.opts(['اجاره','انرژی (برق، گاز، آب)','تعمیر و نگهداری','خرید جزئی / تنخواه','تبلیغات','حمل و پیک','کارمزد بانک و پلتفرم','سایر'].map(x=>[x,x]))}</select>`)}
    ${P.field('طرف حساب',`<select class="select" name="party">${P.partyOptions('o2',['other','supplier','platform'])}</select>`,'اگر در فهرست نیست، از «طرف حساب‌ها» اضافه کنید')}
    ${P.field('مبلغ',P.money('amount'))}
    ${P.field('مربوط به ماه',`<select class="select">${P.opts([['آبان','آبان ۱۴۰۵'],['مهر','مهر ۱۴۰۵'],['split','تقسیم بین چند ماه…']],'آبان')}</select>`,'هزینه در سود و زیان همان ماه می‌نشیند (تعهدی)')}
    ${P.field('سررسید پرداخت',`<input class="input" value="${P.d('1405/08/20')}">`)}
    ${P.field('وضعیت پرداخت',`<div class="segmented" id="exPaid"><button type="button" class="active">پرداخت نشده (بدهی)</button><button type="button">همین الان پرداخت شد</button></div>`)}
    <div class="full">${P.field('شرح','<input class="input" name="title" placeholder="مثلاً قبض گاز آبان">')}</div>
    <div class="full drop">${P.ic('camera')}<span>عکس قبض یا فاکتور</span></div></div>`,
  info:'با ثبت، یک «سند هزینه» ساخته می‌شود و در دفتر همان طرف حساب می‌نشیند. اگر «پرداخت شد» را بزنید، پرداخت هم در همان لحظه ثبت می‌شود — جای دیگری لازم نیست.',
  onMount:m=>{const s=P.$('#exPaid',m);s.onclick=e=>{const b=e.target.closest('button');if(!b)return;P.$$('button',s).forEach(x=>x.classList.toggle('active',x===b))}},
  onOk:f=>{const amt=P.num(f.amount.value);if(!amt){P.toast('مبلغ را وارد کنید','alert-triangle');return false}
    const paid=P.$('#exPaid .active').textContent.includes('همین');
    D.DOCS.unshift({id:'d'+Date.now(),no:'ه-'+P.fa(D.DOCS.length+1),date:D.TODAY,due:'1405/08/20',party:f.party.value,type:'expense',title:f.title.value||f.cat.value,amount:amt,paid:paid?amt:0,dir:'out',source:'ثبت دستی',status:'final',expCat:f.cat.value});
    P.toast('هزینه ثبت شد'+(paid?' و پرداخت شد':' — در فهرست بدهی‌ها'))}});

P.actions.cashClose=()=>P.form({title:'بستن صندوق شیفت',size:'wide',ok:'ثبت گزارش صندوق',
  body:`<div class="form-grid">
    ${P.field('تاریخ و شیفت',`<div class="row"><input class="input" value="${P.d(D.TODAY)}"><select class="select" style="width:140px"><option>صبح</option><option>عصر</option></select></div>`)}
    ${P.field('صندوقدار',`<select class="select">${P.opts(D.STAFF.map(s=>[s.id,s.name]),'s1')}</select>`)}
    ${P.field('فروش طبق سیستم فروش',P.money('pos',32400000),'فعلاً از سپیدز؛ در فاز سفارش‌گیر، خودکار')}
    ${P.field('کارتخوان',P.money('card'))}
    ${P.field('نقد شمارش‌شده',P.money('cash'))}
    ${P.field('کارت به کارت / انتقال',P.money('tr'))}
    ${P.field('هزینه از صندوق (تنخواه)',P.money('exp'),'هر هزینه، یک سند هزینه با رسید')}
    <div class="full"><b style="font-size:13px">${P.ic('hand-heart')} انعام این شیفت</b> <small class="muted">— جدا از فروش. نقد همین الان بین حاضران تقسیم می‌شود؛ کارت و انتقال پایان ماه. انعام نقدی پارکبان ثبت نمی‌شود.</small></div>
    <div class="full table-wrap"><table class="table"><thead><tr><th>برای</th><th class="num">کارتخوان</th><th class="num">نقد (سر شیفت تقسیم)</th><th class="num">کارت به کارت</th></tr></thead><tbody>
      ${[['shift','سالن همین شیفت'],['all','برای همه (به‌جز پیک)']].map(([k,t])=>`<tr><td>${t}</td>${['card','cash','transfer'].map(c=>`<td><input class="input money num sm" name="t_${k}_${c}" placeholder="۰"></td>`).join('')}</tr>`).join('')}
      <tr><td><div class="row">شخصی برای <select class="select sm" name="t_sid" style="width:130px">${P.opts(D.STAFF.map(s=>[s.id,s.name]),'s9')}</select></div></td>${['card','cash','transfer'].map(c=>`<td><input class="input money num sm" name="t_person_${c}" placeholder="۰"></td>`).join('')}</tr>
    </tbody></table></div>
    ${P.field('تحویل نقد به',`<select class="select">${P.opts([['a1','صندوق نقدی (می‌ماند)'],['owner','تحویل به مالک'],['bank','واریز به بانک']])}</select>`)}
    </div><div class="sum-box"><span>اختلاف (کسری/اضافه)</span><b id="ccDiff">—</b></div>`,
  onMount:m=>{const calc=()=>{const v=n=>P.num(P.$(`[name=${n}]`,m).value);const tp=c=>['shift','all','person'].reduce((a,k)=>a+v('t_'+k+'_'+c),0);const d=(v('card')-tp('card'))+v('cash')+(v('tr')-tp('transfer'))+v('exp')-v('pos');
    P.$('#ccDiff',m).innerHTML=`<span class="${d<0?'down':d>0?'up':''}">${d<0?'کسری ':d>0?'اضافه ':''}${P.t(Math.abs(d))}</span> <small class="muted">تومان</small>`};m.addEventListener('input',calc);calc()},
  onOk:f=>{const v=n=>P.num(f[n].value);['shift','all','person'].forEach(k=>['card','cash','transfer'].forEach(c=>{const a=v('t_'+k+'_'+c);if(a>0)D.TIP_IN.push({date:D.TODAY,shift:'عصر',src:c,target:k,sid:k==='person'?f.t_sid.value:undefined,amount:a,spot:c==='cash',by:'s1'})}));
    P.toast('گزارش صندوق ثبت شد؛ فروش روز، انعام و ماندهٔ حساب‌ها به‌روز شد')}});

P.actions.assetEvent=(assetId)=>P.form({title:'ثبت خرابی، شکستگی یا تعمیر وسیله',size:'wide',ok:'ثبت و ارسال برای تأیید',
  body:`<div class="form-grid">
    ${P.field('وسیله',`<select class="select" name="asset">${P.opts(D.ASSETS.map(a=>[a.id,a.name+' ('+P.fa(a.code)+')']),assetId||'as5')}</select>`)}
    ${P.field('اتفاق',`<select class="select" name="kind">${P.opts(['شکستگی','خرابی','مفقودی','تعمیر','سرویس دوره‌ای'].map(x=>[x,x]))}</select>`)}
    ${P.field('تعداد',`<input class="input" name="qty" value="۱">`)}
    ${P.field('هزینه / ارزش',P.money('cost'),'برای شکستگی: ارزش روز وسیله؛ برای تعمیر: مبلغ فاکتور تعمیر')}
    ${P.field('مقصر / گزارش‌دهنده',`<select class="select" name="by">${P.opts(D.STAFF.map(s=>[s.id,s.name]),'s7')}</select>`)}
    <div class="full">${P.respPick('staff')}</div>
    <div class="full">${P.field('توضیح','<input class="input" name="note" placeholder="کجا و چطور؟">')}</div>
    <div class="full drop">${P.ic('camera')}<span>عکس وسیله</span></div></div>`,
  info:'بعد از تأیید مدیر: تعداد/ارزش دارایی کم می‌شود. مدیر هنگام تأیید تعیین می‌کند هزینه کامل با مجموعه است، کامل با پرسنل یا سهمی از آن؛ سهم پرسنل یک سند خسارت در حساب همان نفر می‌شود و در حقوق ماه کسر می‌شود. تعمیر، سند هزینه برای تعمیرکار می‌سازد.',
  onMount:P.respBind,
  onOk:f=>{D.ASSET_EVENTS.unshift({no:'د-'+P.fa(D.ASSET_EVENTS.length+2),date:D.TODAY,asset:f.asset.value,kind:f.kind.value,qty:P.num(f.qty.value)||1,cost:P.num(f.cost.value),by:f.by.value,...P.respRead(f,P.num(f.cost.value)),status:'منتظر تأیید',note:f.note.value});P.toast('ثبت شد و برای تأیید مدیر فرستاده شد')}});

P.partyNew=()=>P.form({title:'طرف حساب جدید',ok:'افزودن',body:`<div class="form-grid">
  ${P.field('نوع',`<select class="select" name="kind">${P.opts([['supplier','تأمین‌کننده'],['other','سایر (موجر، تعمیرکار، …)'],['platform','پلتفرم فروش']])}</select>`,'پرسنل از بخش پرسنل اضافه می‌شوند و خودکار این‌جا هستند')}
  ${P.field('نام','<input class="input" name="name">')}
  ${P.field('دسته',`<input class="input" placeholder="مثلاً لبنیات">`)}${P.field('شرایط پرداخت','<input class="input" placeholder="مثلاً ۱۵ روزه">')}
  ${P.field('تلفن','<input class="input">')}${P.field('شماره کارت / شبا','<input class="input" dir="ltr">')}</div>`,
  onOk:f=>{if(!f.name.value){P.toast('نام لازم است','alert-triangle');return false}D.PARTIES.push({id:'x'+Date.now(),kind:f.kind.value,name:f.name.value,cat:'—',phone:'—',terms:'—'});P.toast('طرف حساب اضافه شد')}});

/* ---------- tab renderers ---------- */
function overview(){
  const cash=sum(D.ACCOUNTS.filter(a=>a.kind!=='امانی'),a=>a.balance),sup=sum(openOut().filter(d=>d.type==='purchase'),P.rem),pay=sum(openOut().filter(d=>d.type==='payroll'),P.rem),
    other=sum(openOut().filter(d=>!['purchase','payroll'].includes(d.type)),P.rem),recv=sum(openIn(),P.rem),chq=sum(D.CHEQUES.filter(c=>c.status==='pending'),c=>c.amount);
  const upcoming=openOut().sort((a,b)=>a.due.localeCompare(b.due)).slice(0,6);
  return`<div class="grid grid-4">
    ${P.kpi({label:'موجودی نقد و بانک',icon:'landmark',value:RT.money(cash),unit:'تومان',foot:P.fa(D.ACCOUNTS.filter(a=>a.kind!=='امانی').length)+' حساب · بدون صندوق انعام (امانی)'})}
    ${P.kpi({label:'بدهی به تأمین‌کنندگان',icon:'truck',value:RT.money(sup),unit:'تومان',tone:'warning',foot:'<a href="#/finance/parties">طرف حساب‌ها</a>'})}
    ${P.kpi({label:'حقوق پرداخت‌نشده',icon:'wallet',value:RT.money(pay),unit:'تومان',foot:'مانده‌های ماه قبل'})}
    ${P.kpi({label:'طلب‌ها',icon:'hand-coins',value:RT.money(recv),unit:'تومان',tone:'success',foot:'اسنپ‌فود، مساعده، خسارت'})}
  </div>
  <div class="grid grid-3 mt">
    <div class="span-2">${P.card({title:'سررسیدهای پیش رو',sub:'همهٔ بدهی‌ها — خرید، حقوق، هزینه — در یک فهرست',flush:1,actions:`<button class="btn btn-primary btn-sm" onclick="P.pay()">${P.ic('send')}ثبت پرداخت</button>`,
      body:P.table(['طرف حساب','نوع','سررسید',{t:'مانده',n:1},'وضعیت',''],upcoming.map(d=>[P.cellMain(P.party(d.party).name,d.title),P.b(P.DOCTYPE[d.type][0],'neutral',1),P.dd(d.due),P.t(P.rem(d)),P.docState(d),
        `<button class="btn btn-ghost btn-sm" onclick="P.pay({party:'${d.party}',docs:['${d.id}']})">ثبت پرداخت</button>`]))})}</div>
    ${P.card({title:'حساب‌ها',sub:'ماندهٔ امروز',body:`<div class="list">${D.ACCOUNTS.map(a=>`<div class="list-item"><span class="thumb">${P.ic(a.icon)}</span><div class="grow"><b>${a.name}</b><small>${a.kind==='امانی'?'امانی پرسنل — جزء موجودی ما نیست':a.kind+' · '+a.holder}</small></div><b class="num">${P.t(a.balance)}</b></div>`).join('')}</div>`,
      foot:`چک‌های در جریان: <b>${P.t(chq)}</b> تومان · سایر بدهی‌ها: <b>${P.t(other)}</b> تومان`})}
  </div>
  <div class="grid grid-2 mt">
    ${P.card({title:'ورود و خروج پول',sub:'هفته‌های اخیر (نمونه)',body:'<div class="chart chart-sm" id="fnFlow"></div>'})}
    ${P.card({title:'منطق یکپارچه',body:`<div class="flow">
      <div class="flow-step"><b>سند</b><small>فاکتور خرید، هزینه، حقوق ماه، مساعده، خسارت</small></div><div class="flow-arrow">${P.ic('arrow-left')}</div>
      <div class="flow-step main"><b>دفتر طرف حساب</b><small>تأمین‌کننده، پرسنل، موجر، پلتفرم</small></div><div class="flow-arrow">${P.ic('arrow-left')}</div>
      <div class="flow-step"><b>پرداخت / دریافت</b><small>یک فرم، از هر جای پنل؛ به یک یا چند سند تخصیص</small></div></div>
      <div class="mt">${P.note('پرداخت حقوق از «پرسنل»، پرداخت فاکتور از «انبار ← دریافت کالا» و پرداخت هزینه از «مالی»، همه همین یک فرم و همین یک دفتر هستند. هیچ پرداختی دو بار ثبت نمی‌شود.','link')}</div>`})}
  </div>`;
}
function mountOverview(){
  const w=['هفتهٔ ۱ مهر','هفتهٔ ۲ مهر','هفتهٔ ۳ مهر','هفتهٔ ۴ مهر','هفتهٔ ۱ آبان','هفتهٔ ۲ آبان'];
  RT.chart('fnFlow',t=>Object.assign(RT.base(t),{
    legend:{top:0,right:0,textStyle:{color:t.text2,fontFamily:t.font}},
    xAxis:RT.axis(t,{type:'category',data:w,inverse:true,splitLine:{show:false}}),
    yAxis:RT.axis(t,{type:'value',position:'right',axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}}),
    tooltip:Object.assign(RT.base(t).tooltip,{formatter:p=>`<b>${p[0].axisValue}</b>`+p.map(x=>RT.tipRow(x.color,x.seriesName,RT.money(x.value))).join('')}),
    series:[{name:'ورودی',type:'bar',barGap:'10%',data:[612,655,598,701,640,688].map(v=>v*1e6),itemStyle:{color:t.success,borderRadius:[6,6,0,0]}},
            {name:'خروجی',type:'bar',data:[540,702,488,690,612,431].map(v=>v*1e6),itemStyle:{color:t.danger,borderRadius:[6,6,0,0]}}]}));
}

let docFilter='all';
function docsTab(){
  const types=[['all','همه',D.DOCS.length],['open','باز',D.DOCS.filter(d=>P.rem(d)>0).length],...Object.entries(P.DOCTYPE).map(([k,[l]])=>[k,l,D.DOCS.filter(d=>d.type===k).length])];
  const rows=D.DOCS.filter(d=>docFilter==='all'||(docFilter==='open'?P.rem(d)>0:d.type===docFilter));
  return`${P.card({flush:1,body:`<div class="toolbar">${P.chips('docs',types,docFilter)}</div>
    ${P.table(['شماره','تاریخ','طرف حساب','نوع','شرح',{t:'مبلغ',n:1},{t:'مانده',n:1},'وضعیت','منبع',''],rows.map(d=>[
      `<b>${P.fa(d.no)}</b>`,P.dd(d.date),`<a href="#/finance/parties/${d.party}">${P.party(d.party).name}</a>`,
      `${P.b(P.DOCTYPE[d.type][0],d.dir==='in'?'success':'neutral',1)}`,d.title+(d.status==='estimate'?' '+P.b('برآوردی','warning'):''),
      P.t(d.amount),`<span class="${d.dir==='in'?'dir-in':''}">${P.t(P.rem(d))}</span>`,P.docState(d),`<small class="muted">${d.source}</small>`,
      P.rem(d)>0?`<button class="btn btn-ghost btn-sm" onclick="P.pay({party:'${d.party}',dir:'${d.dir}',docs:['${d.id}']})">${d.dir==='out'?'ثبت پرداخت':'ثبت دریافت'}</button>`:'']),
      {foot:['جمع','','','','',P.t(sum(rows,d=>d.amount)),P.t(sum(rows,P.rem)),'','','']})}`})}
    <div class="mt">${P.note('<b>فاکتور خرید را جدا وارد نمی‌کنید.</b> «دریافت کالا» در انبار خودش سند خرید را می‌سازد؛ این‌جا فقط تطبیق قیمت با فاکتور کاغذی انجام می‌شود (برآوردی ← قطعی). ابطال سند به‌جای حذف: سابقه می‌ماند.','file-check')}</div>`;
}

/* payments happen outside the panel → the bank statement shows what has not been recorded yet */
function bankMatch(){
  const L=D.BANK_LINES,un=L.filter(b=>!b.match);
  return`<div class="mt">${P.card({title:'تطبیق با گردش بانک',sub:'فایل گردش حساب را وارد کنید؛ هر ردیف بانک باید یک پرداخت یا دریافت ثبت‌شده داشته باشد',flush:1,
    actions:`${un.length?P.b(P.fa(un.length)+' ردیف ثبت نشده','warning'):P.b('همه ثبت شده','success')} <button class="btn btn-secondary btn-sm" onclick="P.toast('فایل گردش بانک خوانده شد (نمونه)')">${P.ic('upload')}ورود گردش بانک</button>`,
    body:P.table(['تاریخ','شرح بانک','مرجع',{t:'مبلغ',n:1},'وضعیت',''],L.map(b=>{const p=b.match&&D.PAYMENTS.find(x=>x.id===b.match);return[
      P.dd(b.date),b.desc,`<small class="muted">${b.ref}</small>`,`<span class="${b.dir==='out'?'dir-out':'dir-in'}">${b.dir==='out'?'−':'+'}${P.t(b.amount)}</span>`,
      p?P.b('ثبت شده — '+P.fa(p.no),'success'):P.b('ثبت نشده','warning'),
      p?'':`<button class="btn btn-secondary btn-sm" onclick="P.pay({party:'${b.guess}',dir:'${b.dir}',date:'${b.date}',amount:${b.amount},ref:'${b.ref}',method:'انتقال بانکی'})">${b.dir==='out'?'ثبت پرداخت':'ثبت دریافت'}</button>`]}))})}</div>`;
}
function paymentsTab(){
  return P.card({flush:1,body:`<div class="toolbar"><label class="search">${P.ic('search')}<input placeholder="جستجو در پرداخت‌ها"></label>${P.chips('pm',[['all','همه'],['out','پرداخت'],['in','دریافت'],['chq','چک']],'all')}</div>
    ${P.table(['شماره','تاریخ پرداخت','طرف حساب','روش','حساب','مرجع','بابت',{t:'مبلغ',n:1},'ثبت‌کننده'],D.PAYMENTS.map(p=>[
      `<b>${P.fa(p.no)}</b>`,P.dd(p.date)+(p.rec&&p.rec!==p.date?`<small class="muted" style="display:block">ثبت: ${P.dd(p.rec)}</small>`:''),`<a href="#/finance/parties/${p.party}">${P.party(p.party).name}</a>`,
      p.method+(p.cheque?' '+P.b(p.cheque.status==='pending'?'در جریان':'وصول','warning'):''),P.acc(p.account).name,`<small class="muted">${p.ref?P.fa(p.ref):(D.BANK_LINES.find(b=>b.match===p.id)||{}).ref||'—'}</small>`,
      `<small class="muted">${p.alloc.map(([id])=>{const d=D.DOCS.find(x=>x.id===id);return d?P.fa(d.no)+' '+d.title:''}).join('، ')||'علی‌الحساب'}</small>`,
      `<span class="${p.dir==='out'?'dir-out':'dir-in'}">${p.dir==='out'?'−':'+'}${P.t(p.amount)}</span>`,p.by]))}`})+
    bankMatch()+
    `<div class="mt">${P.card({title:'چک‌ها',flush:1,body:P.table(['شماره','در وجه','صدور','سررسید',{t:'مبلغ',n:1},'وضعیت',''],D.CHEQUES.map(c=>[P.fa(c.no),P.party(c.party).name,P.dd(c.issue),P.dd(c.due),P.t(c.amount),
      c.status==='pending'?P.b('در جریان','warning'):P.b('پاس شد','success'),c.status==='pending'?`<button class="btn btn-ghost btn-sm" onclick="P.toast('چک پاس شد؛ تسویه قطعی شد')">ثبت پاس شدن</button>`:'']))})}</div>`;
}

let partyKind='all';
function partiesTab(r){
  if(r.param)return partyLedger(r.param);
  const kinds=[['all','همه'],['supplier','تأمین‌کنندگان'],['staff','پرسنل'],['platform','پلتفرم'],['other','سایر']];
  const rows=D.PARTIES.filter(p=>partyKind==='all'||p.kind===partyKind).map(p=>({p,b:P.balance(p.id),n:D.DOCS.filter(d=>d.party===p.id&&P.rem(d)>0).length}));
  return P.card({flush:1,body:`<div class="toolbar">${P.chips('pk',kinds,partyKind)}<div class="topbar-spacer"></div><span class="muted" style="font-size:12px">مثبت = ما بدهکاریم · منفی = طلب ما</span></div>
    ${P.table(['طرف حساب','نوع','دسته / سمت','شرایط',{t:'اسناد باز',n:1},{t:'مانده',n:1},''],rows.map(({p,b,n})=>({cls:'click',attr:`onclick="P.go('#/finance/parties/${p.id}')"`,c:[
      P.cellMain(p.name,p.phone,null,true),P.b(P.KIND[p.kind],p.kind==='staff'?'info':p.kind==='supplier'?'accent':'neutral',1),p.cat,p.terms,P.fa(n),
      `<b class="${b>0?'dir-out':b<0?'dir-in':'muted'}">${b===0?'—':P.t(Math.abs(b))+(b>0?' بدهی':' طلب')}</b>`,P.ic('chevron-left','muted')]})))}`});
}
function partyLedger(id){
  const p=P.party(id);
  const ev=[];D.DOCS.filter(d=>d.party===id).forEach(d=>ev.push({date:d.date,t:`${P.DOCTYPE[d.type][0]} ${P.fa(d.no)} — ${d.title}`,cr:d.dir==='out'?d.amount:0,dr:d.dir==='in'?d.amount:0}));
  D.PAYMENTS.filter(x=>x.party===id).forEach(x=>ev.push({date:x.date,t:`${x.dir==='out'?'پرداخت':'دریافت'} ${P.fa(x.no)} — ${x.method}`,dr:x.dir==='out'?x.amount:0,cr:x.dir==='in'?x.amount:0}));
  ev.sort((a,b)=>a.date.localeCompare(b.date));let run=0;
  const rows=ev.map(e=>{run+=e.cr-e.dr;return[P.dd(e.date),e.t,e.cr?P.t(e.cr):'',e.dr?P.t(e.dr):'',`<b>${P.t(Math.abs(run))}</b> <small class="muted">${run>0?'بس':run<0?'بد':''}</small>`]});
  const b=P.balance(id);
  return`<div class="row" style="margin-bottom:var(--s4)"><a class="btn btn-ghost btn-sm" href="#/finance/parties">${P.ic('arrow-right')}همهٔ طرف حساب‌ها</a></div>
  <div class="grid grid-3">
    ${P.card({body:`<div class="cell-main"><div class="avatar" style="width:48px;height:48px">${P.initials(p.name)}</div><div><h2>${p.name}</h2><small>${P.KIND[p.kind]} · ${p.cat}</small></div></div>
      <dl class="kv mt"><dt>تلفن</dt><dd>${p.phone}</dd><dt>شرایط پرداخت</dt><dd>${p.terms}</dd><dt>مانده</dt><dd><b class="${b>0?'dir-out':'dir-in'}">${P.t(Math.abs(b))} تومان ${b>0?'(بدهی ما)':b<0?'(طلب ما)':''}</b></dd></dl>
      <div class="actions mt">${b>0?`<button class="btn btn-primary btn-sm" onclick="P.pay({party:'${id}'})">${P.ic('send')}پرداخت</button>`:''}${b<0?`<button class="btn btn-primary btn-sm" onclick="P.pay({party:'${id}',dir:'in'})">${P.ic('download')}دریافت</button>`:''}
      ${p.kind==='staff'?`<a class="btn btn-secondary btn-sm" href="#/people/staff/${id}">${P.ic('user')}پروندهٔ پرسنلی</a>`:''}<button class="btn btn-secondary btn-sm" onclick="P.toast('صورت‌حساب PDF آماده شد (نمونه)')">${P.ic('printer')}صورت‌حساب</button></div>`})}
    <div class="span-2">${P.card({title:'صورت‌حساب (گردش)',sub:'بستانکار = سندی که ما بدهکارش شدیم · بدهکار = پرداخت ما',flush:1,
      body:P.table(['تاریخ','شرح',{t:'بستانکار',n:1},{t:'بدهکار',n:1},{t:'مانده',n:1}],rows,{empty:'گردشی ثبت نشده'})})}</div>
  </div>`;
}

function cashTab(){
  const tipOf=c=>D.TIP_IN.filter(x=>x.date===c.date&&x.shift===c.shift).reduce((a,x)=>a+x.amount,0);
  const rows=D.CASH_DAYS.map(c=>{const counted=c.cash+c.card+c.transfer+c.expense,diff=counted-c.pos;return[P.dd(c.date),c.shift,P.staff(c.cashier).name,P.t(c.pos),P.t(c.card),P.t(c.cash),P.t(c.transfer),P.t(c.expense),`<span class="muted">${P.t(tipOf(c))}</span>`,
    diff===0?P.b('بدون اختلاف','success'):`<span class="${diff<0?'down':'up'}">${diff<0?'−':'+'}${P.t(Math.abs(diff))}</span>`]});
  return`<div class="grid grid-4">${D.ACCOUNTS.filter(a=>a.kind!=='امانی').map(a=>P.kpi({label:a.name,icon:a.icon,value:RT.money(a.balance),unit:'تومان',foot:a.holder})).join('')}</div>
  <div class="mt">${P.card({title:'گزارش‌های صندوق',sub:'فروش سیستم در برابر شمارش صندوقدار',flush:1,actions:`<button class="btn btn-primary btn-sm" onclick="P.actions.cashClose()">${P.ic('plus')}بستن صندوق شیفت</button>`,
    body:P.table(['تاریخ','شیفت','صندوقدار',{t:'فروش سیستم',n:1},{t:'کارتخوان',n:1},{t:'نقد',n:1},{t:'انتقال',n:1},{t:'هزینه از صندوق',n:1},{t:'انعام (جدا)',n:1},'اختلاف'],rows)})}</div>
  <div class="mt">${P.note('<b>صندوق، بخشی از مالی است.</b> فروش روز از همین‌جا وارد دفتر فروش می‌شود و انبار (مصرف تئوریک) و گزارش‌ها از همین عدد می‌خوانند. در فاز سفارش‌گیر، «فروش سیستم» خودکار پر می‌شود و فروش اسنپ‌فود به‌عنوان طلب از پلتفرم ثبت می‌شود.','banknote')}</div>`;
}

function assetsTab(){
  const val=a=>{const[y]=a.date.split('/');const age=1405-(+y);return Math.max(0,a.cost*(1-age/a.life))};
  return`<div class="grid grid-4">
    ${P.kpi({label:'ارزش دفتری دارایی‌ها',icon:'tag',value:RT.money(D.ASSETS.reduce((s,a)=>s+val(a),0)),unit:'تومان',foot:'بهای خرید منهای استهلاک خط مستقیم'})}
    ${P.kpi({label:'اقلام شماره‌دار',icon:'hash',value:P.fa(D.ASSETS.filter(a=>a.kind==='شماره‌دار').length),unit:'قلم'})}
    ${P.kpi({label:'خسارت امسال',icon:'hammer',value:RT.money(D.ASSET_EVENTS.reduce((s,e)=>s+e.cost,0)),unit:'تومان',tone:'warning'})}
    ${P.kpi({label:'منتظر تأیید',icon:'clock',value:P.fa(D.ASSET_EVENTS.filter(e=>e.status==='منتظر تأیید').length),unit:'رویداد',tone:'danger'})}
  </div>
  <div class="grid grid-3 mt">
    <div class="span-2">${P.card({title:'رویدادها: خرابی، شکستگی، تعمیر',flush:1,actions:`<button class="btn btn-primary btn-sm" onclick="P.actions.assetEvent()">${P.ic('plus')}ثبت رویداد</button>`,
      body:P.table(['شماره','تاریخ','وسیله','اتفاق',{t:'تعداد',n:1},{t:'هزینه',n:1},'هزینه با','وضعیت',''],D.ASSET_EVENTS.map((e,i)=>{const a=D.ASSETS.find(x=>x.id===e.asset);return[P.fa(e.no),P.dd(e.date),P.cellMain(a.name,e.note),e.kind,P.fa(e.qty),P.t(e.cost),
        P.respBadge(e),
        e.status==='منتظر تأیید'?P.b('منتظر تأیید','warning'):P.b('تأییدشده','success'),
        e.status==='منتظر تأیید'&&P.can('finance','full')?`<button class="btn btn-secondary btn-sm" onclick="P.approveAsset(${i})">تأیید</button>`:'']}))})}</div>
    ${P.card({title:'چرا این‌جا؟',body:`<ul class="spec-list"><li><b>دارایی</b> (دستگاه، فنجان، صندلی) کالای مصرفی انبار نیست؛ ارزش دارد و مستهلک می‌شود، پس در مالی است.</li><li><b>ضایعات مواد</b> (شیر خراب، غذای برگشتی) در انبار می‌ماند.</li><li>شکستگی با مقصر ← سند خسارت در حساب پرسنل ← کسر خودکار در حقوق.</li><li>تعمیر ← سند هزینه برای تعمیرکار ← همان فرم پرداخت.</li></ul>`})}
  </div>
  <div class="mt">${P.card({title:'فهرست دارایی‌ها',flush:1,actions:`<button class="btn btn-secondary btn-sm">${P.ic('plus')}دارایی جدید</button><button class="btn btn-secondary btn-sm">${P.ic('scan-line')}شمارش اموال</button>`,
    body:P.table(['کد','نام','نوع','محل',{t:'تعداد',n:1},{t:'بهای خرید',n:1},{t:'ارزش دفتری',n:1},'وضعیت',''],D.ASSETS.map(a=>[P.fa(a.code),`<b>${a.name}</b>`,a.kind,a.loc,P.fa(a.qty),P.t(a.cost),P.t(val(a)),a.status==='سالم'?P.b('سالم','success'):P.b(a.status,'warning'),
      `<button class="btn btn-ghost btn-sm" onclick="P.actions.assetEvent('${a.id}')">${P.ic('hammer')}</button>`]))})}</div>`;
}
/* damage responsibility is a choice: all on the company, all on the staff member, or a staff share (percent or amount) */
P.respPick=(resp='staff',share='',cost=0)=>`<div class="field"><label>هزینه با چه کسی؟</label><div class="segmented" data-resp>${[['company','کامل با مجموعه'],['staff','کامل با پرسنل'],['share','سهمی با پرسنل']].map(([k,t])=>`<button type="button" data-r="${k}" class="${k===resp?'active':''}">${t}</button>`).join('')}</div>
  <div class="row mt" data-share ${resp==='share'?'':'hidden'}><div class="input-group" style="max-width:150px"><input class="input num" name="sharePct" placeholder="مثلاً ۵۰" value="${resp==='share'&&cost?P.fa(Math.round(share/cost*100)):''}"><span class="suffix">٪</span></div><span class="muted">یا</span><div class="input-group" style="max-width:200px"><input class="input money num" name="shareAmt" placeholder="مبلغ" value="${resp==='share'&&share?P.t(share):''}"><span class="suffix">تومان</span></div></div>
  <small class="muted">سهم پرسنل پس از تأیید، سند خسارت در حساب همان نفر می‌شود و در حقوق ماه کسر می‌شود.</small></div>`;
P.respBind=m=>m.addEventListener('click',e=>{const b=e.target.closest('[data-resp] button');if(!b)return;const g=b.parentNode;g.querySelectorAll('button').forEach(x=>x.classList.toggle('active',x===b));g.parentNode.querySelector('[data-share]').hidden=b.dataset.r!=='share'});
P.respRead=(f,cost)=>{const r=f.querySelector('[data-resp] .active').dataset.r;if(r!=='share')return{resp:r,share:r==='staff'?cost:0};
  const amt=P.num(f.shareAmt.value),pct=P.num(f.sharePct.value);return{resp:'share',share:Math.min(cost,amt||Math.round(cost*pct/100/10000)*10000)}};
P.respBadge=e=>e.resp==='company'?P.b('مجموعه','neutral',1):e.resp==='staff'?P.b('کامل با '+P.staff(e.by).name,'warning',1):P.b('سهم '+P.staff(e.by).name+': '+P.t(e.share),'warning',1);
P.approveAsset=i=>{const e=D.ASSET_EVENTS[i],a=D.ASSETS.find(x=>x.id===e.asset);
  P.form({title:'تأیید رویداد '+P.fa(e.no)+' — '+e.kind+' '+a.name,ok:'تأیید',size:'wide',
    body:`<div class="sum-box"><span>${P.staff(e.by).name} · ${e.note}</span><b>${P.T(e.cost)}</b></div><div class="mt">${P.respPick(e.resp==='half'?'share':e.resp,e.resp==='half'?e.cost/2:e.share,e.cost)}</div>`,
    info:'پیشنهاد ثبت‌کننده انتخاب شده است؛ تصمیم نهایی با شماست.',
    onMount:P.respBind,
    onOk:f=>{Object.assign(e,P.respRead(f,e.cost));e.status='تأییدشده';
      if(e.share>0){const pr=D.PAYROLL.find(p=>p.sid===e.by);if(pr&&!D.DOCS.some(d=>d.party===e.by&&d.title==='حقوق آبان'))pr.damage+=e.share;if(!D.DOCS.some(d=>d.source.includes(e.no)))D.DOCS.push({id:'d'+Date.now(),no:'خس-'+P.fa(D.DOCS.length),date:D.TODAY,due:'1405/08/30',party:e.by,type:'damage',title:e.kind+' '+a.name+(e.resp==='share'?' (سهم پرسنل)':''),amount:e.share,paid:0,dir:'in',source:'رویداد دارایی '+e.no,status:'final'});
        P.toast('تأیید شد؛ '+P.t(e.share)+' تومان سند خسارت در حساب '+P.staff(e.by).name+(e.cost>e.share?' و باقی هزینهٔ مجموعه':''))}else P.toast('تأیید شد؛ هزینه با مجموعه')}});
};

function closeTab(){
  const steps=[['فروش و صندوق','همهٔ ۳۰ شیفت','done'],['تطبیق فاکتورها','۱ مورد باقی','cur'],['شمارش پایان ماه','انجام شد','done'],['حقوق ماه','نهایی و ثبت','done'],['استهلاک و هزینه‌های ثابت','خودکار','done'],['قفل و snapshot','',''] ];
  const checks=[['success','همهٔ گزارش‌های صندوق مهر ثبت شده‌اند','۳۰ از ۳۰ شیفت'],['success','شمارش کامل پایان مهر ثبت و تأیید شده','۱۶ قلم · مغایرت −۶٫۲ میلیون'],['success','حقوق مهر نهایی شده و سند حقوق ساخته شده','۸ نفر'],['warning','۱ دریافت کالا با قیمت برآوردی','بازار مرکزی — منتظر فاکتور'],['success','هزینه‌های تکرارشونده (اجاره، استهلاک) ثبت شده‌اند',''],['info','۱ هزینهٔ برق مهر بعد از ماه ثبت شده','به ماه مهر نسبت داده می‌شود (تعهدی)']];
  return`${P.card({title:'بستن ماه مهر ۱۴۰۵',sub:'بعد از بستن، اعداد این ماه ثابت می‌شوند؛ اصلاح بعدی فقط با سند اصلاحی در ماه باز انجام می‌شود',body:P.stepper(steps)})}
  <div class="grid grid-2 mt">
    ${P.card({title:'چک‌لیست',body:`<div>${checks.map(([t,a,b])=>`<div class="task"><span class="thumb tone-${t}">${P.ic(t==='success'?'check':t==='warning'?'alert-triangle':'info')}</span><div><b>${a}</b><small>${b}</small></div><span></span></div>`).join('')}</div>`})}
    ${P.card({title:'نتیجهٔ پیش‌نمایش',body:`<dl class="kv"><dt>فروش خالص</dt><dd>${P.T(2690000000)}</dd><dt>بهای مواد</dt><dd>${P.T(877000000)}</dd><dt>هزینهٔ پرسنل</dt><dd>${P.T(612000000)}</dd><dt>سربار</dt><dd>${P.T(420000000)}</dd><dt>سود عملیاتی</dt><dd><b class="up">${P.T(781000000)}</b></dd></dl>
      <div class="actions mt"><button class="btn btn-secondary" onclick="P.toast('بکاپ ماه مهر گرفته شد')">${P.ic('archive')}بکاپ</button><button class="btn btn-primary" disabled title="۱ مورد باقی مانده">${P.ic('lock')}بستن ماه</button></div>`})}
  </div>`;
}

function reportsTab(){
  const ms=D.SALES_MONTHS.slice(0,7);
  const aging=[['جاری (سررسید نشده)',openOut().filter(d=>d.due>D.TODAY)],['۰ تا ۷ روز گذشته',openOut().filter(d=>d.due<=D.TODAY&&d.due>='1405/08/08')],['بیش از ۷ روز',openOut().filter(d=>d.due<'1405/08/08')]];
  return`<div class="grid grid-2">
    ${P.card({title:'سود و زیان مدیریتی ماهانه',sub:'۱۴۰۵',flush:1,actions:`<button class="btn btn-secondary btn-sm" onclick="P.toast('Excel آماده شد (نمونه)')">${P.ic('download')}Excel</button>`,
      body:P.table(['ماه',{t:'فروش',n:1},{t:'مواد',n:1},{t:'پرسنل',n:1},{t:'سربار',n:1},{t:'سود',n:1},{t:'حاشیه',n:1}],ms.map(x=>{const n=x.sales-x.food-x.labor-x.overhead;return[D.MONTHS[x.m],RT.money(x.sales),RT.money(x.food),RT.money(x.labor),RT.money(x.overhead),`<b class="${n>0?'up':'down'}">${RT.money(n)}</b>`,RT.pct(n/x.sales*100)]}))})}
    <div class="stack">
      ${P.card({title:'سن بدهی‌ها',sub:'Aging پرداختنی‌ها',flush:1,body:P.table(['بازه',{t:'تعداد',n:1},{t:'مبلغ',n:1}],aging.map(([l,a])=>[l,P.fa(a.length),P.t(sum(a,P.rem))]))})}
      ${P.card({title:'هزینه به تفکیک نوع',sub:'آبان تا امروز',body:'<div class="chart chart-sm" id="fnExp"></div>'})}
    </div></div>`;
}
function mountReports(){
  RT.chart('fnExp',t=>Object.assign(RT.base(t),{tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>RT.tipRow(p.color,p.name,RT.money(p.value))}),
    series:[{type:'pie',radius:['52%','78%'],itemStyle:{borderColor:t.surface,borderWidth:2,borderRadius:6},label:{color:t.text2,fontFamily:t.font,formatter:'{b}'},
      data:[['خرید مواد',113800000],['حقوق',71100000],['اجاره',120000000],['انرژی',8400000],['تعمیر',2800000]].map(([name,value])=>({name,value}))}]}));
}

function settingsTab(){
  return`<div class="grid grid-2">
    ${P.card({title:'حساب‌های پول',sub:'صندوق، بانک، کارتخوان، تنخواه',flush:1,actions:`<button class="btn btn-secondary btn-sm">${P.ic('plus')}حساب</button>`,body:P.table(['نام','نوع','مسئول',''],D.ACCOUNTS.map(a=>[a.name,a.kind,a.holder,P.b('فعال','success')]))})}
    ${P.card({title:'انواع هزینه',sub:'نگاشت به سرفصل سود و زیان',flush:1,body:P.table(['نوع هزینه','سرفصل'],[['اجاره','سربار ثابت'],['انرژی','سربار'],['تعمیر و نگهداری','سربار'],['حمل و پیک','هزینهٔ فروش'],['کارمزد پلتفرم','هزینهٔ فروش'],['خرید جزئی','بهای مواد / سربار']])})}
    ${P.card({title:'قواعد ثبت پرداخت',sub:'پرداخت بیرون از پنل انجام می‌شود؛ این‌جا فقط ثبت می‌شود',body:`<div class="stack" style="gap:var(--s3)"><label class="check"><input type="checkbox" checked>شمارهٔ پیگیری برای پرداخت غیرنقدی اجباری</label><label class="check"><input type="checkbox" checked>هشدار پرداخت تکراری (همان طرف حساب و همان مبلغ در ۷ روز)</label><label class="check"><input type="checkbox" checked>یادآوری هفتگی: برداشت‌های بانک بدون ثبت</label>${P.field('سقف هزینه از صندوق در هر شیفت',P.money('lim2',2000000))}<label class="check"><input type="checkbox" checked>ثبت سند بعد از بستن ماه فقط با سند اصلاحی</label></div>`})}
    ${P.card({title:'هزینه‌های تکرارشونده',flush:1,body:P.table(['عنوان','طرف حساب',{t:'مبلغ',n:1},'هر'],[['اجاره','موجر',P.t(120000000),'ماه'],['استهلاک دارایی‌ها','—',P.t(14800000),'ماه (خودکار)'],['اینترنت','سایر',P.t(1900000),'ماه']])})}
  </div>`;
}

P.mod({id:'finance',label:'مالی',icon:'landmark',desc:'بدهی، طلب، پرداخت، صندوق و دارایی‌ها — همه در یک دفتر',
  badge:()=>D.DOCS.filter(d=>d.dir==='out'&&P.rem(d)>0&&d.due<D.TODAY).length,
  tabs:[
    {id:'overview',label:'خلاصه',icon:'layout-grid',title:'مالی',render:overview,mount:mountOverview,
      actions:()=>`<button class="btn btn-secondary" onclick="P.actions.expense()">${P.ic('receipt')}ثبت هزینه</button><button class="btn btn-primary" onclick="P.pay()">${P.ic('send')}ثبت پرداخت</button>`},
    {id:'docs',label:'فاکتورها و بدهی‌ها',icon:'files',desc:'هر چیزی که بدهی یا طلب می‌سازد: خرید، هزینه، حقوق، مساعده، خسارت',render:docsTab,
      mount:root=>P.bindChips(root,'docs',k=>{docFilter=k;P.render()}),actions:()=>`<button class="btn btn-primary" onclick="P.actions.expense()">${P.ic('plus')}ثبت هزینه</button>`},
    {id:'payments',label:'پرداخت و دریافت',icon:'arrow-left-right',desc:'ثبت پرداخت‌هایی که بیرون از پنل انجام شده و تطبیق با گردش بانک',render:paymentsTab,
      actions:()=>`<button class="btn btn-secondary" onclick="P.pay({dir:'in'})">${P.ic('download')}ثبت دریافت</button><button class="btn btn-primary" onclick="P.pay()">${P.ic('send')}ثبت پرداخت</button>`},
    {id:'parties',label:'طرف حساب‌ها',icon:'contact',desc:'تأمین‌کنندگان، پرسنل، موجر و پلتفرم‌ها در یک دفتر',render:partiesTab,
      mount:root=>P.bindChips(root,'pk',k=>{partyKind=k;P.render()}),actions:()=>`<button class="btn btn-primary" onclick="P.partyNew()">${P.ic('plus')}طرف حساب جدید</button>`},
    {id:'cash',label:'صندوق و بانک',icon:'banknote',desc:'بستن صندوق هر شیفت و ماندهٔ حساب‌ها',render:cashTab},
    {id:'assets',label:'دارایی‌ها',icon:'tag',desc:'اموال، استهلاک و رویدادهای خرابی، شکستگی و تعمیر',render:assetsTab},
    {id:'close',label:'بستن ماه',icon:'lock',desc:'یک بار در ماه: کنترل، قفل و ثبت عکس ماه',render:closeTab},
    {id:'reports',label:'گزارش مالی',icon:'chart-column',desc:'سود و زیان، سن بدهی و ترکیب هزینه‌ها',render:reportsTab,mount:mountReports},
    {id:'settings',label:'تنظیمات مالی',icon:'settings-2',desc:'حساب‌ها، انواع هزینه و قواعد ثبت پرداخت',render:settingsTab}
  ]});
})();
