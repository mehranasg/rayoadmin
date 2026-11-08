/* Rayo Panel prototype — گزارش‌ها (cross-module) + AI export */
(function(){
'use strict';
const ms=()=>D.SALES_MONTHS.filter(x=>!x.partial);
const pct=(a,b)=>a/b*100;

function overview(){
  const m=D.SALES_MONTHS[6],p=D.SALES_MONTHS[5],net=x=>x.sales-x.food-x.labor-x.overhead;
  const k=(l,i,v,pv,fmt,good)=>{const d=(v-pv)/Math.abs(pv)*100;return P.kpi({label:l,icon:i,value:fmt(v),foot:`<span class="delta ${(good?d>=0:d<=0)?'up':'down'}">${P.ic(d>=0?'trending-up':'trending-down')}${RT.n1(Math.abs(d))}٪</span><span>نسبت به شهریور</span>`})};
  return`<div class="grid grid-4">
    ${k('فروش مهر','trending-up',m.sales,p.sales,v=>RT.money(v),true)}
    ${k('سود عملیاتی','piggy-bank',net(m),net(p),v=>RT.money(v),true)}
    ${k('Prime cost','percent',pct(m.food+m.labor,m.sales),pct(p.food+p.labor,p.sales),RT.pct,false)}
    ${k('ضایعات به فروش','trash-2',pct(m.waste,m.sales),pct(p.waste,p.sales),RT.pct,false)}
  </div>
  <div class="grid grid-3 mt">
    <div class="span-2">${P.card({title:'فروش، هزینه و سود ماهانه',sub:'۱۴۰۵ — ماه‌های بسته‌شده',body:'<div class="chart chart-lg" id="rpPnl"></div>'})}</div>
    ${P.card({title:'نسبت‌های کلیدی',sub:'مهر ۱۴۰۵',flush:1,body:P.table(['شاخص',{t:'مقدار',n:1},'هدف'],[
      ['بهای مواد',RT.pct(pct(m.food,m.sales)),'۲۸–۳۵٪'],['هزینهٔ پرسنل',RT.pct(pct(m.labor,m.sales)),'۲۵–۳۰٪'],['Prime cost',RT.pct(pct(m.food+m.labor,m.sales)),'< ۶۵٪'],['سربار',RT.pct(pct(m.overhead,m.sales)),'< ۲۰٪'],['حاشیهٔ سود',RT.pct(pct(net(m),m.sales)),'> ۱۵٪'],['مغایرت انبار',RT.pct(.23),'< ۱٪'],['میانگین فاکتور',P.t(287000),'—']])})}
  </div>
  <div class="mt">${P.note('<b>دو سطح گزارش:</b> هر بخش (مالی، انبار، پرسنل، منو) گزارش‌های تخصصی خودش را در تب «گزارش‌ها» دارد. این صفحه فقط گزارش‌های <b>بین‌بخشی</b> و مدیریتی است که از همان داده‌ها ساخته می‌شوند، نه از ثبت جداگانه.','layers')}</div>`;
}
function mountOverview(){
  const a=ms();
  RT.chart('rpPnl',t=>Object.assign(RT.base(t),{legend:{top:0,right:0,textStyle:{color:t.text2,fontFamily:t.font}},grid:{left:8,right:8,top:36,bottom:4,containLabel:true},
    xAxis:RT.axis(t,{type:'category',data:a.map(x=>D.MONTHS[x.m]),inverse:true,splitLine:{show:false}}),
    yAxis:RT.axis(t,{type:'value',position:'right',axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}}),
    tooltip:Object.assign(RT.base(t).tooltip,{formatter:p=>`<b>${p[0].axisValue}</b>`+p.map(x=>RT.tipRow(x.color,x.seriesName,RT.money(x.value))).join('')}),
    series:[['مواد','food'],['پرسنل','labor'],['سربار','overhead']].map(([n,k])=>({name:n,type:'bar',stack:'c',data:a.map(x=>x[k]),barWidth:'46%'}))
      .concat([{name:'سود',type:'line',smooth:true,data:a.map(x=>x.sales-x.food-x.labor-x.overhead),lineStyle:{width:2.5,color:t.success},itemStyle:{color:t.success}}])}));
}

function monthly(){
  const a=ms();const rows=[['فروش',x=>x.sales],['بهای مواد',x=>x.food],['هزینهٔ پرسنل',x=>x.labor],['سربار',x=>x.overhead],['سود عملیاتی',x=>x.sales-x.food-x.labor-x.overhead],['ضایعات',x=>x.waste]];
  return P.card({flush:1,title:'مقایسهٔ ماه به ماه',sub:'اعداد ماه بسته ثابت‌اند (snapshot)',actions:`<button class="btn btn-secondary btn-sm" onclick="P.toast('Excel آماده شد (نمونه)')">${P.ic('download')}Excel</button><button class="btn btn-secondary btn-sm" onclick="window.print()">${P.ic('printer')}چاپ</button>`,
    body:P.table(['سرفصل',...a.map(x=>({t:D.MONTHS[x.m],n:1})),{t:'جمع',n:1}],rows.map(([l,f])=>[`<b>${l}</b>`,...a.map(x=>RT.money(f(x))),`<b>${RT.money(a.reduce((s,x)=>s+f(x),0))}</b>`]))});
}

function library(){
  const L=[['مالی','landmark','finance/reports',['سود و زیان مدیریتی','سن بدهی‌ها','گردش هر طرف حساب','ترکیب هزینه‌ها','چک‌ها']],
    ['انبار','package','inventory/reports',['گردش کالا','مغایرت دوره‌ای','ضایعات به تفکیک علت','روند قیمت خرید','روغن و اقلام سربار']],
    ['پرسنل','users','people/reports',['خلاصهٔ حقوق ماه','کارکرد ماهانه','پروندهٔ سالانهٔ هر نفر','تأخیر و غیبت','نسبت هزینهٔ پرسنل']],
    ['منو','utensils-crossed','menu/engineering',['مهندسی منو','بهای تمام‌شدهٔ آیتم‌ها','سود هر کانال فروش','تاریخچهٔ قیمت']]].filter(x=>P.can(x[2].split('/')[0]));
  return`<div class="grid grid-2">${L.map(([t,i,h,list])=>P.card({title:t,actions:`<a class="btn btn-ghost btn-sm" href="#/${h}">${P.ic('arrow-left')}رفتن به بخش</a>`,body:`<div class="list">${list.map(x=>`<div class="list-item"><span class="thumb">${P.ic(i)}</span><div class="grow"><b>${x}</b><small>بازهٔ دلخواه · Excel · PDF</small></div><button class="btn btn-ghost btn-sm" onclick="P.toast('${x}: نمونه')">${P.ic('download')}</button></div>`).join('')}</div>`})).join('')}</div>`;
}

/* AI export: one structured bundle, with definitions and data-quality flags */
function aiBundle(sec,fmt){
  const m=D.SALES_MONTHS[6];
  const data={
    meta:{business:'کافه رستوران رایو (نمونه)',period:'1405/07/01..1405/07/30',currency:'IRR_TOMAN',generated:D.TODAY,source:'Rayo Panel',
      quality:{closedMonth:true,estimatedPurchaseLines:1,incompleteRecipes:D.MENU.filter(x=>x.incomplete).map(x=>x.name)},
      definitions:{foodCost:'بهای مواد مصرفی فروش (ناخالص با افت) ÷ فروش خالص',primeCost:'(مواد + پرسنل) ÷ فروش',variance:'مصرف واقعی − مصرف تئوریک از رسپی'}},
  };
  if(sec.includes('pnl'))data.pnl={sales:m.sales,foodCost:m.food,labor:m.labor,overhead:m.overhead,waste:m.waste,operatingProfit:m.sales-m.food-m.labor-m.overhead,history:ms().map(x=>({month:D.MONTHS[x.m],sales:x.sales,food:x.food,labor:x.labor}))};
  if(sec.includes('menu'))data.menu=D.MENU.map(x=>({name:x.name,category:x.cat,price:x.price,unitCost:Math.round(P.recipeCost(x)),foodCostPct:+(P.recipeCost(x)/x.price*100).toFixed(1),qtySold:x.qty,channels:x.ch}));
  if(sec.includes('inv'))data.inventory={variance:D.VARIANCE.map(v=>{const it=P.item(v.item);return{item:it.name,control:it.level,theoretical:v.theo,actual:v.actual,unit:it.unit,valueDiff:Math.round((v.actual-v.theo)*it.price/it.pack)}}),
    waste:D.WASTE.map(w=>({date:w.date,item:w.item,reason:w.reason,value:w.value})),oilLog:D.FRYER};
  if(sec.includes('ppl'))data.people={headcount:D.STAFF.length,payroll:D.PAYROLL.map(r=>({role:P.staff(r.sid).role,contract:P.staff(r.sid).contract,hours:r.hours,gross:P.gross(r),net:P.net(r)}))};
  if(sec.includes('fin'))data.finance={payablesOpen:D.DOCS.filter(d=>d.dir==='out'&&P.rem(d)>0).map(d=>({party:P.party(d.party).name,type:d.type,remaining:P.rem(d),due:d.due}))};
  if(fmt==='json')return JSON.stringify(data,null,2);
  let md=`# گزارش تحلیلی ${data.meta.business}\nدوره: ${data.meta.period} · واحد: تومان · ماه بسته: بله\n\n## تعریف‌ها\n`+Object.entries(data.meta.definitions).map(([k,v])=>`- ${k}: ${v}`).join('\n')+`\n\n## کیفیت داده\n- خطوط خرید برآوردی: ${data.meta.quality.estimatedPurchaseLines}\n- رسپی ناقص: ${data.meta.quality.incompleteRecipes.join('، ')}\n`;
  if(data.pnl)md+=`\n## سود و زیان\n| سرفصل | مبلغ |\n|---|---|\n`+['sales','foodCost','labor','overhead','waste','operatingProfit'].map(k=>`| ${k} | ${data.pnl[k]} |`).join('\n')+'\n';
  if(data.menu)md+=`\n## منو\n| آیتم | قیمت | بها | درصد مواد | فروش |\n|---|---|---|---|---|\n`+data.menu.map(x=>`| ${x.name} | ${x.price} | ${x.unitCost} | ${x.foodCostPct} | ${x.qtySold} |`).join('\n')+'\n';
  if(data.inventory)md+=`\n## مغایرت انبار\n| کالا | کنترل | تئوریک | واقعی | ارزش اختلاف |\n|---|---|---|---|---|\n`+data.inventory.variance.map(x=>`| ${x.item} | ${x.control} | ${x.theoretical} | ${x.actual} | ${x.valueDiff} |`).join('\n')+'\n';
  if(data.people)md+=`\n## پرسنل\nتعداد: ${data.people.headcount}\n`;
  if(data.finance)md+=`\n## بدهی‌های باز\n`+data.finance.payablesOpen.map(x=>`- ${x.party}: ${x.remaining} (سررسید ${x.due})`).join('\n')+'\n';
  md+=`\n## درخواست از تحلیل‌گر\nبر اساس داده‌های بالا: ۱) سه مشکل اصلی سودآوری را با عدد نشان بده ۲) برای منو پیشنهاد قیمت/حذف بده ۳) کالاهایی که مغایرتشان باید بررسی شود را اولویت‌بندی کن ۴) هر جا داده ناقص است، فرض‌هایت را بگو.\n`;
  return md;
}
function ai(){
  const S=[['pnl','سود و زیان و روند'],['menu','منو و بهای تمام‌شده'],['inv','مغایرت، ضایعات و روغن'],['ppl','پرسنل و حقوق (بدون نام)'],['fin','بدهی‌ها و سررسیدها']];
  return`<div class="grid grid-3">
    ${P.card({title:'تنظیم خروجی',body:`<div class="stack" style="gap:var(--s4)">
      ${P.field('دوره',`<select class="select"><option>مهر ۱۴۰۵ (بسته)</option><option>شهریور ۱۴۰۵</option><option>سه ماه اخیر</option><option>بازهٔ دلخواه…</option></select>`)}
      ${P.field('بخش‌ها',S.map(([k,l])=>`<label class="check"><input type="checkbox" data-sec="${k}" checked>${l}</label>`).join(''))}
      ${P.field('قالب',`<div class="segmented" id="aiFmt"><button class="active" data-f="md">متن (Markdown)</button><button data-f="json">JSON</button></div>`,'Markdown برای چت با AI، JSON برای تحلیل خودکار')}
      <label class="check"><input type="checkbox" checked disabled>حذف اطلاعات شخصی (نام، تلفن، شماره کارت)</label>
      <div class="actions"><button class="btn btn-primary" id="aiCopy">${P.ic('copy')}کپی</button><button class="btn btn-secondary" id="aiDl">${P.ic('download')}دانلود فایل</button></div></div>`})}
    <div class="span-2">${P.card({title:'پیش‌نمایش',sub:'تعریف‌ها و کیفیت داده همراه خروجی است تا AI عدد ناقص را قطعی فرض نکند',body:'<div class="pre" id="aiPre"></div>'})}</div>
  </div>`;
}
function mountAi(root){
  const draw=()=>{const sec=P.$$('[data-sec]',root).filter(c=>c.checked).map(c=>c.dataset.sec),f=P.$('#aiFmt .active',root).dataset.f;P.$('#aiPre',root).textContent=aiBundle(sec,f);return f};
  (P.$('#pnTab',root)||root).addEventListener('change',draw);
  P.$('#aiFmt',root).onclick=e=>{const b=e.target.closest('button');if(!b)return;P.$$('#aiFmt button',root).forEach(x=>x.classList.toggle('active',x===b));draw()};
  P.$('#aiCopy',root).onclick=()=>{navigator.clipboard&&navigator.clipboard.writeText(P.$('#aiPre',root).textContent);P.toast('کپی شد — در چت AI بچسبانید')};
  P.$('#aiDl',root).onclick=()=>{const f=draw(),blob=new Blob([P.$('#aiPre',root).textContent],{type:f==='json'?'application/json':'text/markdown'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='rayo-1405-07.'+(f==='json'?'json':'md');a.click();URL.revokeObjectURL(a.href)};
  draw();
}

P.mod({id:'reports',label:'گزارش‌ها',icon:'chart-line',desc:'گزارش مدیریتی بین‌بخشی و خروجی برای تحلیل با AI',
  tabs:[
    {id:'overview',label:'نمای مدیریتی',icon:'gauge',title:'گزارش مدیریتی',render:overview,mount:mountOverview},
    {id:'monthly',label:'ماه به ماه',icon:'calendar-range',desc:'مقایسهٔ سرفصل‌ها در ماه‌های بسته',render:monthly},
    {id:'library',label:'همهٔ گزارش‌ها',icon:'library',desc:'فهرست گزارش‌های تخصصی هر بخش',render:library},
    {id:'ai',label:'خروجی برای AI',icon:'sparkles',desc:'یک بستهٔ کامل، با تعریف‌ها و کیفیت داده، برای تحلیل و پیشنهاد',render:ai,mount:mountAi}
  ]});
})();
