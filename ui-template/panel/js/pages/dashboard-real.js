/* Rayo Panel prototype — میز کار و گزارش‌های مدیریتی روی دادهٔ واقعی (مرحلهٔ ۱۲: فقط خواندنی)
   Built only from recorded data, each number with its source:
   - sales: cash reports (rial → toman, RayoCashVariance sales formula); without cash reports in a month, the item sales
     of the imported sales files
   - material cost, waste, inventory variance: InvEngine.analyze of the month (the same numbers as «داشبورد کنترل»)
   - purchases and supplier debt: purchase invoices / payments / direct debts (PurchaseWrite.supplierAccount)
   - staff payments: personnel payments and monthly settlements (people-real.js, loaded on demand)
   «میز کار» lists today's tasks from the data: missing sales files, cash reports, beverage control, unpaid invoices,
   failed price updates, items without recipe, negative stock. Nothing is saved here. */
(function(){
'use strict';
const IC=window.InvControl,E=window.InvEngine,PW=window.PurchaseWrite;
const esc=P.esc,fa=P.fa,A=x=>Array.isArray(x)?x:[],Z=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const R=()=>IC.state.raw,M=()=>IC.state.M;
const T=v=>v===null||v===undefined||!Number.isFinite(v)?'—':P.t(Math.round(v));
const pct=v=>v===null||!Number.isFinite(v)?'—':RT.pct(v);
const cashSales=r=>(Z(r.netReceivable)-Z(r.taxAmount)+Z(r.debtorAmount)-Z(r.deliveryFeeAmount)+Z(r.snappAmount))/10;
const reports=()=>A(R().cashreport?.reports).filter(r=>r.status!=='void'&&E.D(r.date));
const monthOf=d=>E.D(d).slice(0,7);
const srcLine=()=>`<div class="row" style="gap:8px;margin-bottom:var(--s3);flex-wrap:wrap">${P.b(IC.source()==='live'?'دادهٔ زنده':'دادهٔ واقعی از فایل',IC.source()==='live'?'success':'info')}<span class="muted" style="font-size:12px">همهٔ اعداد از ثبت‌های واقعی؛ منبع هر عدد زیر آن آمده است</span></div>`;

/* ---------- monthly figures (cached per data version) ---------- */
let cache={key:'',months:null};
function months(){const k=String(R().inventory?.meta?.updatedAt||'')+'|'+String(R().pricing?.meta?.updatedAt||'')+'|'+String(R().cashreport?.meta?.updatedAt||'')+'|'+(window.PeopleReal?.doc?.()?1:0);if(cache.key===k)return cache.months;
 const inv=R().inventory,keys=[...new Set([...E.monthKeys(M()),...reports().map(r=>monthOf(r.date)),...A(inv.purchaseInvoices).map(x=>monthOf(x.date))])].filter(Boolean).sort(),hr=window.PeopleReal?.doc?.();
 const out=keys.map(k=>{const rg=E.monthRange(k),last=E.CAL.i(rg.to)<E.CAL.i(E.CAL.today)?rg.to:E.CAL.today,days=E.CAL.i(last)-E.CAL.i(rg.from)+1,rs=reports().filter(r=>monthOf(r.date)===k),cashDays=new Set(rs.map(r=>E.D(r.date))).size;
  let a=null;try{a=E.analyze(M(),rg.from,rg.to)}catch(_){}
  // sales: cash reports when they cover ≥80٪ of the days, else the item sales files of the month, else partial cash
  const cash=rs.reduce((s,r)=>s+cashSales(r),0),itemSales=a?Z(a.salesAmount):0,src=cashDays>=days*0.8?'cash':itemSales>0?'items':cashDays?'cash':'',sales=src==='cash'?cash:src==='items'?itemSales:0;
  const purchases=A(inv.purchaseInvoices).filter(x=>PW.isFinal(x)&&monthOf(x.date)===k).reduce((s,x)=>s+PW.invoiceTotal(x),0);
  const [y,mo]=k.split('/').map(Number),staff=hr?A(hr.payments).filter(p=>p.salaryYear?Z(p.salaryYear)===y&&Z(p.salaryMonth)===mo:monthOf(p.date)===k).reduce((s,p)=>s+Z(p.amount),0)+A(hr.monthlySettlements).filter(x=>Z(x.year)===y&&Z(x.month)===mo).reduce((s,x)=>s+Z(x.total),0):null;
  const tips=hr?A(hr.tipGroups).filter(g=>monthOf(g.receiveDate)===k).reduce((s,g)=>s+Z(g.totalAmount),0):null;
  return{k,label:E.monthLabel(k),days,cashDays,salesSource:src,sales,itemSales,cash,std:calStd(rg),waste:a?a.calTot.waste+a.calTot.staff:null,receipts:a?a.calTot.receipt:null,variance:a?a.tot.variance:null,coverage:a?a.coverage:0,counted:a?a.counted:0,purchases,staff,tips,
   variance0:a&&a.coverage>0?a.tot.variance:null,open:a?a.tot.open:null,close:a?a.tot.close:null}});
 cache={key:k,months:out};return out}
const SRC={cash:'گزارش صندوق',items:'فایل فروش آیتم‌ها'};
// standard material cost of the sales inside the calendar month: each file's sales spread evenly over its days, recipe
// of each day × cost of that day (same per-day rule as the inventory engine; fryer oil after the oil log is excluded)
function calStd(rg){const m=M(),a0=E.CAL.i(rg.from),b0=E.CAL.i(rg.to);let sum=0,any=false;for(const s of m.sales)for(const l of A(s.lines)){const ld=l.date?E.CAL.i(l.date):null,a=ld??s.a,b=ld??s.b,lo=Math.max(a,a0),hi=Math.min(b,b0);if(hi<lo)continue;const share=Z(l.quantity)/(b-a+1);
  for(let d=lo;d<=hi;d++){const day=E.CAL.k(d);for(const rl of m.recipeAt(l.menuItemId,day)){if(!m.recipeDeducts(rl.ingredientId,day))continue;const g=m.gross(m.ing.get(rl.ingredientId),rl,1),c=m.costAt(rl.ingredientId,day);if(Number.isFinite(g)&&c!==null){sum+=g*share*c;any=true}}}}
 return any?sum:null}
function supplierDebt(){const inv=R().inventory,ids=new Set([...A(inv.purchaseInvoices).map(x=>x.supplierId),...A(inv.supplierPayments).map(x=>x.supplierId),...A(inv.supplierDirectDebts).map(x=>x.supplierId)].filter(Boolean));let debt=0,credit=0;for(const id of ids){const b=PW.supplierAccount(inv,id).balance;if(b>0)debt+=b;else credit-=b}return{debt,credit,n:ids.size}}

/* ---------- today's tasks ---------- */
function tasks(){const inv=R().inventory,out=[],today=E.CAL.today,ti=E.CAL.i(today),yest=E.CAL.k(ti-1),add=(tone,text,href,icon)=>out.push({tone,text,href,icon});
 const lastSale=M().sales.length?Math.max(...M().sales.map(s=>s.b)):null;if(lastSale===null)add('danger','هیچ فایل فروشی وارد نشده است؛ مصرف رسپی از انبار کم نمی‌شود','#/inventory/sales','file-spreadsheet');else if(ti-lastSale>2)add('danger',`فروش از ${fa(E.CAL.k(lastSale+1))} (${fa(ti-lastSale)} روز) وارد نشده است`,'#/inventory/sales','file-spreadsheet');
 const rs=reports();if(rs.length){if(!rs.some(r=>E.D(r.date)===yest))add('warning',`گزارش صندوق دیروز (${fa(yest)}) ثبت نشده است`,'#/finance/cash','receipt');const un=rs.filter(r=>!r.managerReview||r.managerReview==='بررسی نشده').length;if(un)add('info',`${fa(un)} گزارش صندوق بررسی نشده است`,'#/finance/cash','clipboard-check');
  const lim=Z(R().cashreport?.settings?.discrepancyLimit)||1000000,bad=rs.filter(r=>monthOf(r.date)===today.slice(0,7)&&Math.abs(Z(r.finalVariance))>lim).length;if(bad)add('warning',`${fa(bad)} گزارش صندوق این ماه مغایرت بیش از حد مجاز دارد`,'#/finance/cash','scale')}
 const bevIds=A(inv.settings?.beverageControl?.itemIds);if(bevIds.length){const recs=A(inv.beverageDailyControls).filter(r=>r.status!=='void');const lastB=recs.map(r=>E.D(r.date)).sort().at(-1);if(!lastB||lastB<yest)add('warning',`کنترل روزانهٔ نوشیدنی از ${lastB?fa(lastB):'ابتدا'} ثبت نشده است`,'#/inventory/beverage','cup-soda')}
 const pend=A(inv.purchaseInvoices).filter(x=>PW.isFinal(x)&&['failed','pending'].includes(x.pricingSyncStatus)).length;if(pend)add('danger',`قیمت ${fa(pend)} فاکتور خرید در کاتالوگ اعمال نشده است`,'#/finance/docs','badge-alert');
 const open=A(inv.purchaseInvoices).filter(x=>PW.isFinal(x)&&PW.invoiceTotal(x)-PW.invoicePaid(inv,x)>0.5).length;if(open)add('info',`${fa(open)} فاکتور خرید پرداخت‌نشده یا ناقص`,'#/finance/payments','wallet');
 const unap=A(inv.stocktakes).filter(s=>s.status==='submitted').length;if(unap)add('warning',`${fa(unap)} شمارش منتظر تأیید است`,'#/inventory/count','clipboard-list');
 const pos=E.positions(M(),today),neg=pos.filter(r=>r.flags.has('negative')).length;if(neg)add('info',`${fa(neg)} قلم موجودی منفی دارند`,'#/inventory/stock','trending-down');
 const MR=window.MenuReal;if(MR){const act=A(R().pricing.menuItems).filter(m=>m.status!=='غیرفعال'),none=act.filter(m=>MR.metrics(m).state==='none').length,over=act.filter(m=>{const x=MR.metrics(m);return x.complete&&x.ratio>100}).length;if(none)add('warning',`${fa(none)} آیتم فعال منو رسپی ندارد`,'#/menu/items','chef-hat');if(over)add('danger',`${fa(over)} آیتم منو بهای مواد بیش از قیمت دارد (معمولاً خطای مقدار بسته)`,'#/menu/items','alert-triangle')}
 return out}
const TONE={danger:'danger',warning:'warning',info:'info'};

/* ---------- home ---------- */
function homeReal(){const ms=months(),cur=ms.find(m=>m.k===E.CAL.today.slice(0,7)),prev=ms[ms.indexOf(cur)-1],yest=E.CAL.k(E.CAL.i(E.CAL.today)-1),ysales=reports().filter(r=>E.D(r.date)===yest).reduce((s,r)=>s+cashSales(r),0),sd=supplierDebt(),ts=tasks(),lastRep=reports().map(r=>E.D(r.date)).sort().at(-1);
 const pace=cur&&cur.cashDays?cur.sales/cur.cashDays:null;
 return`<div class="page-head"><div><div class="crumbs">${P.ic('layout-dashboard')}میز کار</div><h1>امروز ${fa(E.CAL.today)}</h1><p>کارهای امروز و وضعیت ماه، از روی دادهٔ ثبت‌شده</p></div></div>${srcLine()}
 <div class="grid grid-4">${P.kpi({label:'فروش دیروز',icon:'receipt',value:ysales?RT.money(ysales):'—',unit:ysales?'تومان':'',foot:ysales?'گزارش صندوق':`آخرین گزارش صندوق: ${lastRep?fa(lastRep):'—'}`})}${P.kpi({label:'فروش '+(cur?.label||'ماه جاری'),icon:'trending-up',value:cur?RT.money(cur.sales):'—',unit:'تومان',foot:cur?`${fa(cur.cashDays)} روز گزارش صندوق${pace?` · میانگین روزانه ${RT.money(pace)}`:''}`:''})}${P.kpi({label:'مغایرت صندوق ماه',icon:'scale',value:RT.money(reports().filter(r=>monthOf(r.date)===E.CAL.today.slice(0,7)).reduce((s,r)=>s+Z(r.finalVariance),0)/10),unit:'تومان',foot:'منفی = کسری'})}${P.kpi({label:'بدهی به تأمین‌کنندگان',icon:'wallet',value:sd.n?RT.money(sd.debt):'—',unit:sd.n?'تومان':'',foot:sd.n?`${fa(sd.n)} طرف حساب${sd.credit?` · بستانکار ${RT.money(sd.credit)}`:''}`:'فاکتور خریدی ثبت نشده'})}</div>
 <div class="grid grid-3 mt"><div class="span-2">${P.card({title:'فروش روزانه — ۳۰ روز اخیر',sub:'از گزارش‌های صندوق',body:'<div class="chart" id="hmChart"></div>'})}</div>
 ${P.card({title:`کارهای امروز (${fa(ts.length)})`,flush:1,body:ts.length?`<div class="side-list">${ts.map(t=>`<a href="${t.href}" class="row" style="gap:8px;padding:10px 14px;text-decoration:none;color:inherit;border-bottom:1px solid var(--border)">${P.b(P.ic(t.icon),TONE[t.tone],1)}<span>${esc(t.text)}</span></a>`).join('')}</div>`:`<div style="padding:var(--s5)">${P.note('کار عقب‌افتاده‌ای از روی داده پیدا نشد.','check')}</div>`})}</div>
 <div class="mt">${P.card({title:'خلاصهٔ ماه‌ها',sub:'جزئیات در «گزارش‌ها ← ماه به ماه»',flush:1,body:monthTable(ms.slice(-3),true),actions:'<a class="btn btn-ghost btn-sm" href="#/reports/monthly">همهٔ ماه‌ها</a>'})}</div>
 ${prev&&cur?'':''}`}
function homeMount(){if(!window.PeopleReal?.doc?.()&&!window.PeopleReal?.state?.err)window.PeopleReal?.load?.();const ti=E.CAL.i(E.CAL.today),days=[];for(let i=29;i>=0;i--)days.push(E.CAL.k(ti-i));const by=new Map;for(const r of reports())by.set(E.D(r.date),(by.get(E.D(r.date))||0)+cashSales(r));
 RT.chart('hmChart',t=>Object.assign(RT.base(t),{grid:{left:8,right:8,top:16,bottom:8,containLabel:true},tooltip:Object.assign(RT.base(t).tooltip,{trigger:'axis'}),xAxis:RT.axis(t,{type:'category',data:days.map(d=>fa(d.slice(5)))}),yAxis:RT.axis(t,{type:'value',axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}}),series:[{name:'فروش (تومان)',type:'bar',data:days.map(d=>Math.round(by.get(d)||0)),itemStyle:{color:t.accent,borderRadius:[4,4,0,0]}}]}))}

/* ---------- reports: monthly table and management view ---------- */
function monthTable(ms,compact){return P.table(['ماه',{t:'فروش',n:1},{t:'بهای استاندارد مواد',n:1},{t:'٪ مواد',n:1},{t:'پرتی و مصرف مجاز',n:1},{t:'مغایرت انبار (شمارش به شمارش)',n:1},...(compact?[]:[{t:'ورود به انبار (ارزش)',n:1},{t:'خرید ثبت‌شده',n:1},{t:'پرداخت پرسنل',n:1},{t:'انعام ثبت‌شده',n:1}]),'پوشش داده'],ms.slice().reverse().map(m=>[`<b>${esc(m.label)}</b>`,m.sales?`${T(m.sales)}<small class="muted" style="display:block">${SRC[m.salesSource]||''}${m.salesSource==='cash'?` · ${fa(m.cashDays)} روز`:''}</small>`:'—',T(m.std),m.sales&&m.std?pct(m.std/m.sales*100):'—',T(m.waste),m.coverage>0?`<span class="${m.variance<0?'down':'up'}">${T(m.variance)}</span>`:'<span class="muted">بدون شمارش</span>',...(compact?[]:[T(m.receipts),m.purchases?T(m.purchases):'—',m.staff===null?'…':m.staff?T(m.staff):'—',m.tips===null?'…':m.tips?T(m.tips):'—']),[m.salesSource?'':'فروش ندارد',m.coverage>0?`شمارش ${fa(Math.round(m.coverage*100))}٪`:'',m.salesSource==='cash'&&m.cashDays<m.days?`صندوق ${fa(m.cashDays)}/${fa(m.days)} روز`:''].filter(Boolean).map(x=>P.b(esc(x),'neutral',1)).join(' ')]),{empty:'داده‌ای نیست'})}
function monthlyReal(){if(!window.PeopleReal?.doc?.()&&!window.PeopleReal?.state?.err)window.PeopleReal?.load?.();const ms=months();
 return srcLine()+P.card({title:'ماه به ماه',sub:'فروش از گزارش صندوق (یا فایل فروش آیتم‌ها اگر گزارش صندوق نباشد) · بها، پرتی و مغایرت از تحلیل انبار همان ماه',flush:1,body:monthTable(ms,false)})
 +`<div class="grid grid-2 mt">${P.card({title:'روند فروش و بهای مواد',body:'<div class="chart" id="rpTrend"></div>'})}${P.note('<b>آنچه در این جدول نیست:</b> اجاره، قبوض، حقوق محاسبه‌شده و سایر هزینه‌ها در دادهٔ رایو ثبت نمی‌شوند؛ بنابراین سود و زیان کامل از داده ساخته نمی‌شود. «پرداخت پرسنل» فقط پرداخت‌های ثبت‌شده در پرسنل است. «مغایرت انبار» فقط با شمارش ابتدا و انتهای ماه معنا دارد؛ پوشش شمارش هر ماه در ستون آخر آمده است.','info')}</div>`}
function monthlyMount(){const ms=months();RT.chart('rpTrend',t=>Object.assign(RT.base(t),{grid:{left:8,right:8,top:28,bottom:8,containLabel:true},legend:{top:0,textStyle:{color:t.text2,fontFamily:t.font}},tooltip:Object.assign(RT.base(t).tooltip,{trigger:'axis'}),xAxis:RT.axis(t,{type:'category',data:ms.map(m=>m.label)}),yAxis:RT.axis(t,{type:'value',axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}}),series:[{name:'فروش',type:'bar',data:ms.map(m=>Math.round(m.sales||0)),itemStyle:{color:t.accent}},{name:'بهای استاندارد مواد',type:'bar',data:ms.map(m=>Math.round(m.std||0)),itemStyle:{color:t.warning}},{name:'مغایرت انبار',type:'line',data:ms.map(m=>m.coverage>0?Math.round(m.variance):null),itemStyle:{color:t.danger}}]}))}
function overviewReal(){const ms=months(),done=ms.filter(m=>E.CAL.i(E.monthRange(m.k).to)<E.CAL.i(E.CAL.today)),m=done.at(-1)||ms.at(-1);if(!m)return srcLine()+P.note('داده‌ای برای گزارش نیست.','info');const sd=supplierDebt(),ts=tasks();
 return srcLine()+`<div class="row" style="margin-bottom:var(--s3)"><b>${esc(m.label)}</b><span class="muted" style="margin-inline-start:8px;font-size:12px">آخرین ماه کامل</span></div>
 <div class="grid grid-4">${P.kpi({label:'فروش',icon:'receipt',value:m.sales?RT.money(m.sales):'—',unit:m.sales?'تومان':'',foot:SRC[m.salesSource]||'ثبت نشده'})}${P.kpi({label:'بهای استاندارد مواد فروش',icon:'chef-hat',value:m.std!==null?RT.money(m.std):'—',unit:'تومان',foot:m.sales&&m.std?`${pct(m.std/m.sales*100)} فروش (رسپی × تعداد)`:''})}${P.kpi({label:'مغایرت انبار',icon:'scale',value:m.coverage>0?RT.money(m.variance):'—',unit:m.coverage>0?'تومان':'',tone:m.variance<0?'danger':'',foot:m.coverage>0?`پوشش شمارش ${fa(Math.round(m.coverage*100))}٪ · منفی = کسری`:'شمارش ابتدا/انتهای ماه نیست'})}${P.kpi({label:'پرتی و مصرف مجاز',icon:'trash-2',value:m.waste!==null?RT.money(m.waste):'—',unit:'تومان',foot:m.sales&&m.waste?`${pct(m.waste/m.sales*100)} فروش`:''})}</div>
 <div class="grid grid-2 mt">${P.card({title:'آنچه باید دید',flush:1,body:ts.length?`<div class="side-list">${ts.slice(0,8).map(t=>`<a href="${t.href}" class="row" style="gap:8px;padding:10px 14px;text-decoration:none;color:inherit;border-bottom:1px solid var(--border)">${P.b(P.ic(t.icon),TONE[t.tone],1)}<span>${esc(t.text)}</span></a>`).join('')}</div>`:''})}
 ${P.card({title:'حساب‌ها',body:`<div class="minis"><div class="mini"><small>بدهی به تأمین‌کنندگان</small><b>${sd.n?T(sd.debt):'—'}</b></div><div class="mini"><small>خرید ثبت‌شده ${esc(m.label)}</small><b>${T(m.purchases)}</b></div><div class="mini"><small>پرداخت پرسنل ${esc(m.label)}</small><b>${m.staff===null?'…':T(m.staff)}</b></div><div class="mini"><small>انعام ثبت‌شده</small><b>${m.tips===null?'…':T(m.tips)}</b></div></div><p class="muted" style="font-size:12px;margin-top:var(--s3)">جزئیات: <a href="#/inventory/control">داشبورد کنترل انبار</a> · <a href="#/finance/cash">صندوق</a> · <a href="#/finance/parties">طرف حساب‌ها</a> · <a href="#/reports/monthly">ماه به ماه</a></p>`})}</div>`}

/* ---------- wiring ---------- */
const home=P.mods.home;if(home){const r0=home.render,m0=home.mount;home.render=r=>IC.ready()&&P.role().id!=='staff'?homeReal(r):r0.call(home,r);home.mount=(root,r)=>{if(IC.ready()&&P.role().id!=='staff')homeMount(root,r);else m0&&m0.call(home,root,r)};const b0=home.badge;home.badge=()=>IC.ready()?tasks().filter(t=>t.tone==='danger').length:(b0?b0():0)}
const rep=P.mods.reports;for(const [id,v] of Object.entries({overview:{render:overviewReal},monthly:{render:monthlyReal,mount:monthlyMount}})){const t=rep?.tabs?.find(x=>x.id===id);if(!t)continue;const r0=t.render,m0=t.mount;t.render=r=>IC.ready()?v.render(r):P.note(`این صفحه <b>دادهٔ نمونه</b> است. برای دیدن دادهٔ واقعی، در «انبار ← داشبورد کنترل» به داده وصل شوید. <a href="#/inventory/control">اتصال</a>`,'database')+r0(r);t.mount=(root,r)=>{if(IC.ready()){v.mount&&v.mount(root,r)}else m0&&m0(root,r)}}
window.DashboardReal={months,tasks,supplierDebt};
})();
