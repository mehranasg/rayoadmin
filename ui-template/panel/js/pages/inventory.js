/* Rayo Panel prototype — انبار (single warehouse, 10 tabs + catalog) */
(function(){
'use strict';
const LV={'دقیق':['accent','رسپی + شمارش هفتگی'],'عادی':['info','رسپی + شمارش ماهانه'],'کلی':['neutral','سربار؛ بدون رسپی']};
const lvB=l=>P.b(l,LV[l][0],1);
const qtyTxt=(it,q)=>{q=q==null?it.qty:q;if(it.unit==='گرم'&&q>=1000)return RT.n1(q/1000)+' کیلوگرم';if(it.unit==='میلی‌لیتر'&&q>=1000)return RT.n1(q/1000)+' لیتر';return P.t(q)+' '+it.unit};
const val=it=>it.qty*it.price/it.pack;
P.qtyTxt=qtyTxt;

/* theoretical consumption from sales × recipe (gross) */
function theo(){const m={};D.MENU.forEach(x=>x.lines.forEach(([id,q])=>{const it=P.item(id);if(!it)return;m[id]=(m[id]||0)+q/(1-(it.waste||0)/100)*x.qty}));return m}

/* ---------- actions ---------- */
P.actions.receipt=()=>{
  const line=(id,q)=>{const it=P.item(id);return`<tr data-line><td><select class="select" name="it">${P.opts(D.ITEMS.map(i=>[i.id,i.name]),id)}</select></td>
    <td><input class="input sm money" value="${P.fa(q)}"></td><td class="muted" data-unit>${it.pUnit}</td>
    <td><input class="input money" value="${P.t(it.price)}"><div class="muted" style="font-size:11px" data-src>${P.ic('history')} آخرین قیمت · ${P.dd(it.last)}</div></td><td class="num" data-sum></td></tr>`};
  P.modal({title:'دریافت کالا',size:'xwide',body:`
    <div class="form-grid">${P.field('تأمین‌کننده',`<select class="select" name="party">${P.partyOptions('sp1',['supplier'])}</select>`)}${P.field('تاریخ',`<input class="input" value="${P.d(D.TODAY)}">`)}</div>
    <div class="table-wrap"><table class="table" id="rcLines"><thead><tr><th>کالا</th><th>تعداد</th><th>واحد خرید</th><th>قیمت واحد</th><th class="num">جمع</th></tr></thead>
      <tbody>${line('i2',40)}${line('i3',6)}${line('i4',2)}</tbody></table></div>
    <button class="btn btn-ghost btn-sm" type="button" id="rcAdd" style="align-self:flex-start">${P.ic('plus')}ردیف</button>
    <div class="form-grid">
      <div class="drop">${P.ic('camera')}<span>عکس فاکتور یا بارنامه</span></div>
      <div class="stack" style="gap:var(--s3)">
        <label class="check"><input type="checkbox" id="rcEst">فاکتور هنوز نرسیده — قیمت‌ها برآوردی است</label>
        ${P.field('پرداخت',`<div class="segmented" id="rcPay"><button type="button" class="active">نسیه (طبق شرایط)</button><button type="button">پرداخت همین الان</button></div>`)}
      </div></div>
    <div class="sum-box"><span>جمع فاکتور</span><b id="rcSum"></b></div>
    ${P.note('<b>یک ثبت، سه اثر:</b> موجودی کالاها بالا می‌رود · سند خرید در «مالی» و بدهی در حساب تأمین‌کننده ساخته می‌شود · قیمت در تاریخچهٔ قیمت ثبت و رسپی‌ها به‌روز می‌شوند.','sparkles')}`,
    foot:`<button class="btn btn-ghost" data-close>انصراف</button><button class="btn btn-primary" id="rcOk">${P.ic('check')}ثبت دریافت</button>`,
    onMount(m){
      const tb=P.$('#rcLines tbody',m);
      const calc=()=>{let s=0;P.$$('[data-line]',tb).forEach(r=>{const[q,p]=P.$$('input',r).map(i=>P.num(i.value));s+=q*p;P.$('[data-sum]',r).textContent=P.t(q*p)});P.$('#rcSum',m).innerHTML=P.T(s);return s};
      tb.addEventListener('input',calc);
      tb.addEventListener('change',e=>{if(e.target.name!=='it')return;const r=e.target.closest('tr'),it=P.item(e.target.value);P.$('[data-unit]',r).textContent=it.pUnit;P.$$('input',r)[1].value=P.t(it.price);calc()});
      P.$('#rcAdd',m).onclick=()=>{tb.insertAdjacentHTML('beforeend',line('i1',1));RT.icons();calc()};
      const pay=P.$('#rcPay',m);pay.onclick=e=>{const b=e.target.closest('button');if(b)P.$$('button',pay).forEach(x=>x.classList.toggle('active',x===b))};
      calc();
      P.$('#rcOk',m).onclick=()=>{
        const amt=calc(),party=P.$('[name=party]',m).value,est=P.$('#rcEst',m).checked,payNow=P.$('#rcPay .active',m).textContent.includes('همین');
        P.$$('[data-line]',tb).forEach(r=>{const it=P.item(P.$('select',r).value);const[q,p]=P.$$('input',r).map(i=>P.num(i.value));it.qty+=q*it.pack;it.price=p;it.last=D.TODAY});
        const id='d'+Date.now(),no='ر-'+P.fa(241+D.RECEIPTS.length-5);
        D.DOCS.unshift({id,no:'خ-'+P.fa(819+D.RECEIPTS.length-5),date:D.TODAY,due:'1405/08/30',party,type:'purchase',title:'دریافت کالا '+no,amount:amt,paid:0,dir:'out',source:'دریافت کالا '+no,status:est?'estimate':'final'});
        D.RECEIPTS.unshift({no,date:D.TODAY,party,lines:P.$$('[data-line]',tb).length,amount:amt,status:est?'قیمت برآوردی':'قیمت قطعی',doc:id});
        P.close();P.toast('دریافت ثبت شد: موجودی، بدهی و قیمت به‌روز شد');
        if(payNow)setTimeout(()=>P.pay({party,docs:[id]}),250);else P.render();
      };
    }});
};
P.actions.waste=()=>P.form({title:'ثبت ضایعات',size:'wide',ok:'ثبت ضایعات',
  body:`${P.field('چه چیزی؟',`<div class="segmented" id="wsKind"><button type="button" class="active">مادهٔ اولیه</button><button type="button">آیتم منو (غذا/نوشیدنی آماده)</button></div>`)}
  <div class="form-grid">
    ${P.field('کالا / آیتم',`<select class="select" name="it" id="wsIt">${P.opts(D.ITEMS.map(i=>[i.id,i.name]),'i2')}</select>`)}
    ${P.field('مقدار',`<div class="input-group"><input class="input" name="q" value="۱"><span class="suffix" id="wsUnit">لیتر</span></div>`)}
    ${P.field('علت',`<select class="select" name="reason">${P.opts(['تاریخ گذشته','خراب شده','ریختن / حادثه','اشتباه سفارش','برگشت مشتری','آموزش / تست','سایر'].map(x=>[x,x]))}</select>`)}
    ${P.field('مسئول / ثبت‌کننده',`<select class="select" name="by">${P.opts(D.STAFF.map(s=>[s.id,s.name]),'s2')}</select>`)}
  </div><div class="drop">${P.ic('camera')}<span>عکس (برای مبالغ بالا لازم است)</span></div>
  <div class="sum-box"><span>ارزش تقریبی</span><b id="wsVal"></b></div>`,
  info:'ضایعات مواد از موجودی کم می‌شود. برای آیتم منو، مواد رسپی همان روز کم می‌شود. «پرت آماده‌سازی» (مثلاً پوست سیب‌زمینی) ضایعات نیست؛ در درصد افت کالا دیده شده است.',
  onMount:m=>{const k=P.$('#wsKind',m),sel=P.$('#wsIt',m);
    const calc=()=>{const menu=k.querySelector('.active').textContent.includes('منو');const q=P.num(P.$('[name=q]',m).value);let v;
      if(menu){const x=D.MENU.find(i=>i.id===sel.value);v=P.recipeCost(x)*q;P.$('#wsUnit',m).textContent='پرس / عدد'}else{const it=P.item(sel.value);v=it.price*q;P.$('#wsUnit',m).textContent=it.pUnit}P.$('#wsVal',m).innerHTML=P.T(v)};
    k.onclick=e=>{const b=e.target.closest('button');if(!b)return;P.$$('button',k).forEach(x=>x.classList.toggle('active',x===b));sel.innerHTML=b.textContent.includes('منو')?P.opts(D.MENU.map(i=>[i.id,i.name])):P.opts(D.ITEMS.map(i=>[i.id,i.name]));calc()};
    m.addEventListener('input',calc);sel.onchange=calc;calc()},
  onOk:f=>{const menu=P.$('#wsKind .active').textContent.includes('منو');const name=menu?D.MENU.find(i=>i.id===f.it.value).name:P.item(f.it.value).name;
    D.WASTE.unshift({date:D.TODAY,kind:menu?'منو':'مواد',item:name,qty:f.q.value,value:P.num(P.$('#wsVal').textContent),reason:f.reason.value,by:f.by.value,status:'منتظر تأیید'});P.toast('ضایعات ثبت شد؛ منتظر تأیید مدیر')}});

/* ---------- tabs ---------- */
let lvF='all';
function stock(){
  const low=D.ITEMS.filter(i=>i.qty<i.min),total=D.ITEMS.reduce((s,i)=>s+val(i),0);
  const rows=D.ITEMS.filter(i=>lvF==='all'||(lvF==='low'?i.qty<i.min:i.level===lvF));
  return`<div class="grid grid-4">
    ${P.kpi({label:'ارزش موجودی',icon:'coins',value:RT.money(total),unit:'تومان',foot:'به آخرین قیمت خرید'})}
    ${P.kpi({label:'زیر حداقل',icon:'package-x',value:P.fa(low.length),unit:'قلم',tone:'danger',foot:'<a href="#/inventory/reorder">پیشنهاد سفارش</a>'})}
    ${P.kpi({label:'مغایرت شمارش آبان',icon:'scale',value:RT.money(3580000),unit:'تومان',tone:'warning',foot:'کسری نسبت به مصرف تئوریک'})}
    ${P.kpi({label:'ضایعات آبان',icon:'trash-2',value:RT.money(D.WASTE.reduce((s,w)=>s+w.value,0)),unit:'تومان'})}
  </div>
  <div class="mt">${P.card({flush:1,body:`<div class="toolbar"><label class="search">${P.ic('search')}<input placeholder="نام یا کد کالا"></label>
    ${P.chips('lv',[['all','همه',D.ITEMS.length],['low','زیر حداقل',low.length],['دقیق','دقیق'],['عادی','عادی'],['کلی','کلی (سربار)']],lvF)}</div>
    ${P.table(['کالا','دسته','سطح کنترل',{t:'موجودی',n:1},'وضعیت',{t:'ارزش',n:1},'آخرین شمارش'],rows.map(i=>{const pct=Math.min(100,i.qty/i.max*100);return{cls:'click',attr:`onclick="P.itemCard('${i.id}')"`,c:[
      P.cellMain(i.name,'کد '+P.fa(i.code),i.icon),i.cat,lvB(i.level),qtyTxt(i),
      `<div class="meter ${i.qty<i.min?'bad':i.qty<i.min*1.5?'warn':'ok'}" style="width:110px"><i style="width:${pct}%"></i></div>`,P.t(val(i)),P.dd(i.last)]}}))}`})}</div>`;
}
P.itemCard=id=>{const it=P.item(id);const hist=[[it.last,it.price,'دریافت کالا'],['1405/07/20',Math.round(it.price*.94),'فاکتور'],['1405/06/28',Math.round(it.price*.9),'فاکتور']];
  P.modal({title:it.name,size:'wide',body:`<div class="grid grid-2"><dl class="kv"><dt>کد</dt><dd>${P.fa(it.code)}</dd><dt>دسته / نوع</dt><dd>${it.cat} · ${it.type}</dd><dt>واحد خرید</dt><dd>${it.pUnit} = ${P.t(it.pack)} ${it.unit}</dd><dt>افت آماده‌سازی</dt><dd>${P.fa(it.waste)}٪</dd><dt>سطح کنترل</dt><dd>${lvB(it.level)} <small class="muted">${LV[it.level][1]}</small></dd><dt>تأمین‌کننده</dt><dd>${P.party(it.sup).name}</dd></dl>
    <dl class="kv"><dt>موجودی</dt><dd>${qtyTxt(it)}</dd><dt>حداقل / حداکثر</dt><dd>${qtyTxt(it,it.min)} / ${qtyTxt(it,it.max)}</dd><dt>بهای خالص هر ${it.unit}</dt><dd>${P.t(P.unitCost(it))} تومان</dd><dt>در رسپی</dt><dd>${D.MENU.filter(m=>m.lines.some(l=>l[0]===id)).map(m=>m.name).join('، ')||'—'}</dd>${it.note?`<dt>یادداشت</dt><dd>${it.note}</dd>`:''}</dl></div>
    <h3>تاریخچهٔ قیمت</h3>${P.table(['تاریخ',{t:'قیمت هر '+it.pUnit,n:1},'منبع'],hist.map(([d,p,s])=>[P.dd(d),P.t(p),s]))}`})};

function receipt(){
  return P.card({title:'دریافت‌های اخیر',sub:'هر دریافت = یک سند خرید در مالی',flush:1,
    body:P.table(['شماره','تاریخ','تأمین‌کننده',{t:'اقلام',n:1},{t:'مبلغ',n:1},'قیمت','پرداخت',''],D.RECEIPTS.map(r=>{const d=D.DOCS.find(x=>x.id===r.doc);return[`<b>${P.fa(r.no)}</b>`,P.dd(r.date),P.party(r.party).name,P.fa(r.lines),P.t(r.amount),
      r.status==='قیمت قطعی'?P.b('قطعی','success'):P.b('برآوردی','warning'),d?P.docState(d):'',d&&P.rem(d)>0&&P.can('finance','full')?`<button class="btn btn-ghost btn-sm" onclick="P.pay({party:'${r.party}',docs:['${d.id}']})">پرداخت</button>`:'']}))})+
    `<div class="mt">${P.note('<b>قبلاً:</b> ورود به انبار، فاکتور خرید، به‌روزرسانی قیمت و پرداخت چهار ثبت جدا بود. <b>حالا:</b> یک «دریافت کالا»؛ تطبیق فاکتور و پرداخت فقط تکمیلش می‌کنند.','sparkles')}</div>`;
}
function sales(){
  const t=theo();const rows=Object.entries(t).map(([id,q])=>({it:P.item(id),q})).sort((a,b)=>b.q*b.it.price/b.it.pack-a.q*a.it.price/a.it.pack);
  return`<div class="grid grid-3">
    ${P.card({title:'منبع فروش',body:`<div class="list">
      <div class="list-item"><span class="thumb tone-success">${P.ic('check')}</span><div class="grow"><b>سپیدز (فعلی)</b><small>ورود فایل تا ۱۴ آبان</small></div>${P.b('به‌روز','success')}</div>
      <div class="list-item"><span class="thumb">${P.ic('monitor-smartphone')}</span><div class="grow"><b>سفارش‌گیر رایو</b><small>فاز بعد — خودکار و لحظه‌ای</small></div>${P.b('بعداً','neutral')}</div>
      <div class="list-item"><span class="thumb">${P.ic('bike')}</span><div class="grow"><b>اسنپ‌فود و پلتفرم‌ها</b><small>فاز بعد — از API پلتفرم</small></div>${P.b('بعداً','neutral')}</div></div>`,
      foot:`<button class="btn btn-secondary btn-sm">${P.ic('upload')}ورود فایل فروش</button>`})}
    <div class="span-2">${P.card({title:'مصرف تئوریک از فروش',sub:'تعداد فروش × رسپی (ناخالص، با افت آماده‌سازی) — آبان تا امروز',flush:1,
      body:P.table(['کالا',{t:'مصرف تئوریک',n:1},{t:'ارزش',n:1},'سطح کنترل'],rows.map(({it,q})=>[P.cellMain(it.name,'',it.icon),qtyTxt(it,Math.round(q)),P.t(q*it.price/it.pack),lvB(it.level)]))})}</div>
  </div>`;
}
function waste(){
  const total=D.WASTE.reduce((s,w)=>s+w.value,0);
  return`<div class="grid grid-3">
    ${P.kpi({label:'ضایعات آبان',icon:'trash-2',value:RT.money(total),unit:'تومان',foot:RT.pct(total/1380000000*100)+' از فروش'})}
    ${P.kpi({label:'منتظر تأیید',icon:'clock',value:P.fa(D.WASTE.filter(w=>w.status==='منتظر تأیید').length),unit:'مورد',tone:'warning'})}
    ${P.kpi({label:'بیشترین علت',icon:'alert-circle',value:'تاریخ گذشته',foot:'لبنیات'})}
  </div>
  <div class="grid grid-3 mt">
    <div class="span-2">${P.card({flush:1,title:'ثبت‌ها',body:P.table(['تاریخ','نوع','کالا / آیتم','مقدار','علت','ثبت‌کننده',{t:'ارزش',n:1},'وضعیت'],D.WASTE.map(w=>[P.dd(w.date),P.b(w.kind==='منو'?'آیتم منو':'مادهٔ اولیه',w.kind==='منو'?'info':'neutral',1),w.item,P.fa(w.qty),w.reason,P.staff(w.by).name,P.t(w.value),
      w.status==='منتظر تأیید'?`<button class="btn btn-secondary btn-sm" onclick="this.outerHTML='${P.b('تأییدشده','success').replace(/"/g,'&quot;')}';P.toast('تأیید شد')">تأیید</button>`:P.b('تأییدشده','success')]))})}</div>
    ${P.card({title:'سه نوع «پرت» — جدا از هم',body:`<ul class="spec-list"><li><b>پرت آماده‌سازی:</b> مثل پوست سیب‌زمینی؛ درصد ثابت در کالا، خودکار. ثبت روزانه ندارد.</li><li><b>ضایعات مواد:</b> شیر تاریخ‌گذشته، ریختن؛ این‌جا ثبت می‌شود.</li><li><b>ضایعات آیتم منو:</b> غذای برگشتی یا اشتباه؛ مواد رسپی کم می‌شود.</li><li><b>شکستن وسیله</b> ضایعات نیست؛ در «مالی ← دارایی‌ها».</li></ul>`})}
  </div>`;
}
function count(){
  const rows=D.VARIANCE.map(v=>{const it=P.item(v.item),d=v.actual-v.theo,pct=d/v.theo*100;return[P.cellMain(it.name,'',it.icon),lvB(it.level),qtyTxt(it,v.theo),qtyTxt(it,v.actual),
    `<span class="${Math.abs(pct)>5?'down':Math.abs(pct)>2?'':'up'}">${RT.pct(pct)}</span>`,`<b class="${d>0?'down':''}">${P.t(d*it.price/it.pack)}</b>`,Math.abs(pct)>5?P.b('بررسی شود','danger'):Math.abs(pct)>2?P.b('قابل قبول','warning'):P.b('خوب','success')]});
  return`<div class="grid grid-3">
    ${P.card({title:'شمارش‌ها',flush:1,body:P.table(['تاریخ','محدوده',{t:'مغایرت',n:1}],D.COUNTS.map(c=>[P.dd(c.date),`${c.scope}<small class="muted" style="display:block">${P.staff(c.by).name} · ${c.status}</small>`,`<span class="down">${P.t(c.diffValue)}</span>`]))})}
    <div class="span-2">${P.card({title:'مغایرت: مصرف واقعی در برابر تئوریک',sub:'مصرف واقعی = موجودی اول + ورودی − موجودی آخر − ضایعات ثبت‌شده',flush:1,
      body:P.table(['کالا','کنترل',{t:'تئوریک',n:1},{t:'واقعی',n:1},{t:'اختلاف',n:1},{t:'ارزش اختلاف',n:1},''],rows)})}</div>
  </div>
  <div class="mt">${P.note('هر کالا از آخرین شمارش کامل خودش ادامه می‌دهد. کالاهای «دقیق» هفتگی، «عادی» ماهانه و «کلی» فقط در شمارش پایان ماه (برای ارزش موجودی) شمرده می‌شوند.','scale')}</div>`;
}
function startCount(){P.form({title:'شمارش — لبنیات و پروتئین',size:'wide',ok:'ثبت شمارش',body:P.table(['کالا','موجودی سیستم','شمارش شده'],D.ITEMS.filter(i=>i.level==='دقیق').map(i=>[i.name,qtyTxt(i),`<input class="input sm" placeholder="${i.unit}">`])),
  info:'اعداد سیستم را می‌توان برای شمارش «کور» مخفی کرد (تنظیمات انبار).',onOk:()=>P.toast('شمارش ثبت شد؛ مغایرت محاسبه شد')})}
P.startCount=startCount;
function beverage(){
  return P.card({title:'کنترل روزانهٔ نوشیدنی‌های آماده',sub:'۱۴ آبان — اول روز + ورودی − فروش = باید باشد',flush:1,actions:`<button class="btn btn-primary btn-sm" onclick="P.toast('شمارش امروز ثبت شد')">${P.ic('plus')}ثبت امروز</button>`,
    body:P.table(['نوشیدنی',{t:'اول روز',n:1},{t:'ورودی',n:1},{t:'فروش',n:1},{t:'باید باشد',n:1},{t:'شمارش آخر روز',n:1},'اختلاف'],D.BEVERAGE.map(b=>{const e=b.open+b.in-b.sold,d=b.close-e;return[b.name,P.fa(b.open),P.fa(b.in),P.fa(b.sold),P.fa(e),P.fa(b.close),d===0?P.b('درست','success'):P.b((d<0?'کسری ':'اضافه ')+P.fa(Math.abs(d)),d<0?'danger':'warning')]}))});
}
function reorder(){
  const low=D.ITEMS.filter(i=>i.qty<i.min*1.2);const by={};low.forEach(i=>(by[i.sup]=by[i.sup]||[]).push(i));
  return`<div class="grid grid-2">${Object.entries(by).map(([sid,items])=>P.card({title:P.party(sid).name,sub:P.party(sid).terms+' · '+P.party(sid).phone,flush:1,
    actions:`<button class="btn btn-secondary btn-sm" onclick="P.toast('متن سفارش کپی شد — در پیام‌رسان بفرستید')">${P.ic('copy')}کپی متن سفارش</button>`,
    body:P.table(['کالا',{t:'موجودی',n:1},{t:'پیشنهاد سفارش',n:1},{t:'برآورد مبلغ',n:1}],items.map(i=>{const need=Math.ceil((i.max-i.qty)/i.pack);return[i.name,qtyTxt(i),P.fa(need)+' '+i.pUnit,P.t(need*i.price)]}))})).join('')}</div>
  <div class="mt">${P.note('پیشنهاد = رساندن موجودی به حداکثر. بعد از رسیدن بار، همین سفارش با یک کلیک به «دریافت کالا» تبدیل می‌شود.','refresh-cw')}</div>`;
}
/* fryer oil: each full change is judged against the standard that was valid when it was recorded (snapshot) */
function oilCard(theoOil,changes){
  const O=D.OIL,full=D.FRYER.filter(f=>f.reason==='تعویض کامل'),mon=full.filter(f=>f.date>=O.monitor.from),avg=mon.length?Math.round(mon.reduce((s,f)=>s+f.sales,0)/mon.length):0;
  return P.card({title:'روغن سرخ‌کردنی',sub:'گران، اما «در هر پرس» سخت اندازه‌گیری می‌شود — دو معیار کنار هم',cls:'span-2',
    actions:O.monitor.on?P.b('پایش دقیق تا '+P.dd(O.monitor.to),'info'):'',body:`
    <div class="minis"><div class="mini"><small>جذب روغن طبق رسپی (تئوریک)</small><b>${RT.n1(theoOil/1000)} لیتر</b></div><div class="mini"><small>روغن ریخته‌شده در سرخ‌کن (دفتر)</small><b>${RT.n1(changes/1000)} لیتر</b></div><div class="mini"><small>معیار فعلی</small><b>${P.fa(O.std)} پرس</b></div><div class="mini"><small>میانگین دورهٔ پایش</small><b>${P.fa(avg)} پرس</b></div></div>
    <div class="mt">${P.table(['تاریخ','نوع',{t:'لیتر',n:1},{t:'پرس از تعویض قبلی',n:1},{t:'معیار همان زمان',n:1},'نتیجه','رنگ روغن',''],D.FRYER.map(f=>{const isF=f.reason==='تعویض کامل';return[P.dd(f.date),f.reason,P.fa(f.liters),isF?P.fa(f.sales):'—',isF?P.fa(f.std):'—',
      isF?(f.sales>=f.std?P.b('در حد معیار','success'):P.b('زودتر از معیار','warning')):'',f.color||'—',f.locked?`<span title="ماه بسته — تغییر نمی‌کند">${P.ic('lock','muted')}</span>`:'']}))}</div>`,
    foot:`معیار در <a href="#/inventory/settings">تنظیمات انبار</a> تغییر می‌کند. هر تعویض با معیار زمان ثبت خودش سنجیده می‌شود؛ ماه‌های بسته قفل‌اند. <button class="btn btn-ghost btn-sm" onclick="P.toast('تعویض روغن ثبت شد')">${P.ic('plus')}ثبت تعویض</button>`});
}
function consumption(){
  const oil=P.item('i8'),fried=D.MENU.filter(m=>m.lines.some(l=>l[0]==='i8'));
  const theoOil=fried.reduce((s,m)=>s+m.lines.find(l=>l[0]==='i8')[1]*m.qty,0),changes=D.FRYER.reduce((s,f)=>s+f.liters,0)*1000;
  return`<div class="grid grid-3">
    ${['دقیق','عادی','کلی'].map(l=>{const its=D.ITEMS.filter(i=>i.level===l);return P.card({title:`سطح «${l}»`,sub:LV[l][1],body:`<p class="text-2" style="font-size:12.5px">${l==='دقیق'?'گران یا پرمصرف: قهوه، شیر، مرغ، پنیر، نوشابه. رسپی دقیق و شمارش هفتگی؛ مغایرت بالای ۲٪ هشدار.':l==='عادی'?'ارزش متوسط: پاستا، سیب‌زمینی، سیروپ، روغن، بسته‌بندی. رسپی + شمارش ماهانه.':'ارزان یا غیرقابل اندازه‌گیری در هر پرس: نمک، ادویه، شوینده. در خرید هزینه می‌شود؛ در بهای غذا با «سربار ثابت هر پرس» دیده می‌شود.'}</p>
      <div class="mt muted" style="font-size:12px">${its.map(i=>i.name).join('، ')}</div>`})}).join('')}
  </div>
  <div class="grid grid-2 mt">
    ${oilCard(theoOil,changes)}
    ${P.card({title:'نمک، ادویه و شوینده',sub:'ارزان؛ شمارش روزانه نمی‌ارزد',body:`<ul class="spec-list">
      <li>خرید این اقلام <b>مستقیم هزینه</b> می‌شود (سرفصل «مواد سربار»).</li>
      <li>بهای هر پرس غذا یک <b>نرخ ثابت سربار</b> می‌گیرد: خرید ۳ ماه اخیر ÷ پرس‌های غذای همان ۳ ماه. در رسپی چیزی وارد نمی‌شود.</li>
      <li>کنترل: <b>خرید ماه ÷ پرس غذا</b> با نرخ مقایسه می‌شود؛ بیش از ۳۰٪ بالاتر = هشدار. شوینده‌ها سربار عمومی‌اند و به پرس نمی‌خورند.</li></ul>
      <div class="minis mt"><div class="mini"><small>خرید آبان تا امروز</small><b>${RT.money(D.OVERHEAD.current.buys)}</b></div><div class="mini"><small>پرس غذا</small><b>${P.fa(D.OVERHEAD.current.portions)}</b></div><div class="mini"><small>هر پرس</small><b>${P.t(Math.round(D.OVERHEAD.current.buys/D.OVERHEAD.current.portions))} ت</b></div><div class="mini"><small>نرخ فعلی</small><b>${P.t(P.ovhRate())} ت</b></div></div>`})}
  </div>`;
}
function reports(){return`<div class="grid grid-2">${P.card({title:'ارزش اختلاف به تفکیک کالا',sub:'آبان',body:'<div class="chart" id="invVar"></div>'})}${P.card({title:'ارزش موجودی به تفکیک دسته',body:'<div class="chart" id="invCat"></div>'})}</div>
  <div class="mt">${P.card({title:'گزارش‌های آماده',body:`<div class="tiles">${['گردش کالا (مقداری و ریالی)','مغایرت دوره‌ای','ضایعات به تفکیک علت','خرید به تفکیک تأمین‌کننده','روند قیمت خرید','خروجی AI انبار'].map(t=>`<button class="tile" onclick="P.toast('${t}: نمونه')"><span class="kpi-icon">${P.ic('file-spreadsheet')}</span><b>${t}</b><small>Excel · PDF</small></button>`).join('')}</div>`})}</div>`}
function mountReports(){
  const v=D.VARIANCE.map(x=>{const it=P.item(x.item);return{name:it.name,value:Math.round((x.actual-x.theo)*it.price/it.pack)}}).sort((a,b)=>b.value-a.value);
  RT.chart('invVar',t=>Object.assign(RT.base(t),{grid:{left:8,right:8,top:8,bottom:4,containLabel:true},xAxis:RT.axis(t,{type:'value',axisLabel:{color:t.text3,fontFamily:t.font,formatter:x=>RT.short(x)}}),yAxis:RT.axis(t,{type:'category',data:v.map(x=>x.name),inverse:true,position:'right',splitLine:{show:false}}),
    tooltip:Object.assign(RT.base(t).tooltip,{formatter:p=>RT.tipRow(p[0].color,p[0].name,RT.money(p[0].value))}),series:[{type:'bar',data:v.map(x=>({value:x.value,itemStyle:{color:x.value>0?t.danger:t.success,borderRadius:4}})),barWidth:'55%'}]}));
  const c={};D.ITEMS.forEach(i=>c[i.cat]=(c[i.cat]||0)+val(i));
  RT.chart('invCat',t=>Object.assign(RT.base(t),{tooltip:Object.assign(RT.base(t).tooltip,{trigger:'item',formatter:p=>RT.tipRow(p.color,p.name,RT.money(p.value))}),series:[{type:'pie',radius:['50%','78%'],itemStyle:{borderColor:t.surface,borderWidth:2,borderRadius:6},label:{color:t.text2,fontFamily:t.font},data:Object.entries(c).map(([name,value])=>({name,value}))}]}));
}
function settings(){return`<div class="grid grid-2">
  ${P.card({title:'سطح کنترل کالاها',sub:'هر کالا یکی از این سه؛ در کاتالوگ تعیین می‌شود',flush:1,body:P.table(['سطح','رسپی','شمارش','هشدار مغایرت','مثال'],[[lvB('دقیق'),'بله','هفتگی','بالای ۲٪','قهوه، شیر، مرغ'],[lvB('عادی'),'بله','ماهانه','بالای ۵٪','پاستا، روغن، لیوان'],[lvB('کلی'),'سربار ثابت','پایان ماه','روند خرید','نمک، ادویه، شوینده']])})}
  ${P.card({title:'برنامهٔ شمارش',body:`<div class="stack" style="gap:var(--s3)">${P.field('روز شمارش هفتگی',`<select class="select">${P.opts(['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'].map(x=>[x,x]),'پنجشنبه')}</select>`)}<label class="check"><input type="checkbox" checked>شمارش کور (عدد سیستم به شمارنده نشان داده نشود)</label><label class="check"><input type="checkbox" checked>ضایعات بالای ۵۰۰ هزار تومان عکس و تأیید مدیر بخواهد</label></div>`})}
  ${P.card({title:'روغن سرخ‌کن',sub:'حداقل پرس سرخ‌کردنی بین دو تعویض کامل',body:`<div class="form-grid">${P.field('معیار فعلی','<div class="input-group"><input class="input num" id="oilStd" value="'+P.fa(D.OIL.std)+'"><span class="suffix">پرس</span></div>','در دورهٔ پایش، میانگین واقعی را ببینید و بعد معیار را تنظیم کنید')}
    ${P.field('پایش دقیق','<label class="check"><input type="checkbox" '+(D.OIL.monitor.on?'checked':'')+'>فعال تا '+P.dd(D.OIL.monitor.to)+'</label>','در پایش، هر تعویض با رنگ روغن و تعداد پرس ثبت می‌شود')}</div>
    <div class="mt"><button class="btn btn-secondary btn-sm" onclick="P.saveOilStd()">${P.ic('save')}ذخیره</button></div>
    <div class="mt">${P.table(['از تاریخ',{t:'معیار',n:1},'ثبت‌کننده'],D.OIL.log.slice().reverse().map(x=>[P.dd(x.date),P.fa(x.std),x.by]))}</div>`})}
  ${P.card({title:'علت‌های ضایعات',body:`<div class="row" style="flex-wrap:wrap">${['تاریخ گذشته','خراب شده','ریختن / حادثه','اشتباه سفارش','برگشت مشتری','آموزش / تست','سایر'].map(x=>`<span class="chip">${x}</span>`).join('')}<button class="chip">${P.ic('plus')}</button></div>`})}
  ${P.card({title:'واحدها',body:`<p class="text-2" style="font-size:12.5px">واحد خرید (کارتن، گالن) با «ضریب تبدیل» به واحد مصرف (عدد، گرم، میلی‌لیتر) وصل است. جرم و حجم به هم تبدیل نمی‌شوند.</p>`})}
</div>`}
function catalog(){
  return`${P.card({flush:1,body:`<div class="toolbar"><label class="search">${P.ic('search')}<input placeholder="جستجوی کالا"></label><button class="btn btn-secondary btn-sm">${P.ic('upload')}ورود از Excel</button><button class="btn btn-primary btn-sm" onclick="P.toast('فرم کالای جدید (نمونه)')">${P.ic('plus')}کالای جدید</button></div>
    ${P.table(['کد','کالا','دسته','نوع','واحد خرید',{t:'ضریب',n:1},{t:'افت',n:1},{t:'آخرین قیمت',n:1},{t:'بهای خالص واحد',n:1},'کنترل','تأمین‌کننده'],D.ITEMS.map(i=>({cls:'click',attr:`onclick="P.itemCard('${i.id}')"`,c:[P.fa(i.code),`<b>${i.name}</b>`,i.cat,i.type,i.pUnit,P.t(i.pack),P.fa(i.waste)+'٪',P.t(i.price),P.t(P.unitCost(i))+' / '+i.unit,lvB(i.level),P.party(i.sup).name]})))}`})}
  <div class="mt">${P.note('<b>کاتالوگ کالا یک مرجع است</b> و در انبار نگهداری می‌شود. قیمت‌گذاری، رسپی، دریافت کالا و سفارش همه از همین فهرست می‌خوانند. «دسته» (لبنیات، خشکبار) و «نوع» (مادهٔ اولیه، بسته‌بندی، کالای فروشی) مستقل‌اند. کد و شناسهٔ کالا هرگز تغییر نمی‌کند؛ کالای دارای سابقه غیرفعال می‌شود، حذف نمی‌شود.','book-open')}</div>`;
}

P.saveOilStd=()=>{const v=P.num(P.$('#oilStd').value),O=D.OIL;if(!v){P.toast('عدد معتبر وارد کنید','alert-triangle');return}
  P.setChange({area:'انبار',name:'حداقل پرس بین دو تعویض روغن',from:O.std,to:v,openNote:'تعویض‌های آبان (ماه باز) با معیار جدید دوباره سنجیده شوند؛ تعویض‌های مهر قفل‌اند',
    apply:scope=>{O.std=v;O.log.push({date:D.TODAY,std:v,by:P.role().name,scope});let n=0;if(scope==='open')D.FRYER.forEach(f=>{if(!f.locked&&f.reason==='تعویض کامل'){f.std=v;n++}});return n}})};

P.mod({id:'inventory',label:'انبار',icon:'package',desc:'تک‌انبار: موجودی، دریافت، مصرف، ضایعات و مغایرت',
  badge:()=>D.ITEMS.filter(i=>i.qty<i.min).length,
  tabs:[
    {id:'stock',label:'موجودی',icon:'boxes',title:'انبار',render:stock,mount:r=>P.bindChips(r,'lv',k=>{lvF=k;P.render()}),
      actions:()=>`<a class="btn btn-secondary" href="#/inventory/catalog">${P.ic('book-open')}کالاها و مواد</a><button class="btn btn-primary" onclick="P.actions.receipt()">${P.ic('package-plus')}دریافت کالا</button>`},
    {id:'receipt',label:'دریافت کالا',icon:'package-plus',desc:'بار رسید: یک ثبت برای موجودی، بدهی و قیمت',render:receipt,actions:()=>`<button class="btn btn-primary" onclick="P.actions.receipt()">${P.ic('plus')}دریافت کالا</button>`},
    {id:'sales',label:'فروش',icon:'receipt',desc:'فروش و مصرف تئوریک مواد از رسپی',render:sales},
    {id:'waste',label:'ضایعات',icon:'trash-2',desc:'ضایعات مواد اولیه و آیتم‌های منو',render:waste,actions:()=>`<button class="btn btn-primary" onclick="P.actions.waste()">${P.ic('plus')}ثبت ضایعات</button>`},
    {id:'count',label:'شمارش و مغایرت',icon:'scale',desc:'شمارش موجودی و مقایسه با مصرف تئوریک',render:count,actions:()=>`<button class="btn btn-primary" onclick="P.startCount()">${P.ic('clipboard-list')}شروع شمارش</button>`},
    {id:'beverage',label:'کنترل روزانهٔ نوشیدنی',icon:'cup-soda',desc:'نوشیدنی‌های آمادهٔ فروشی — کنترل روزانه',render:beverage},
    {id:'reorder',label:'سفارش مجدد',icon:'refresh-cw',desc:'پیشنهاد خرید بر اساس حداقل و حداکثر',render:reorder,badge:()=>D.ITEMS.filter(i=>i.qty<i.min).length},
    {id:'consumption',label:'مدیریت مصرف',icon:'gauge',desc:'سطح کنترل، روغن، نمک و اقلام سربار — فقط خواندنی',render:consumption},
    {id:'reports',label:'گزارش‌ها',icon:'chart-pie',desc:'گزارش‌های انبار',render:reports,mount:mountReports},
    {id:'settings',label:'تنظیمات',icon:'settings-2',desc:'سطح کنترل، شمارش، علت‌ها و واحدها',render:settings},
    {id:'catalog',label:'کالاها و مواد',icon:'book-open',hidden:true,desc:'مرجع اصلی کالاها — قیمت‌گذاری و رسپی از همین فهرست می‌خوانند',render:catalog}
  ]});
})();
