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
  return{k,label:E.monthLabel(k),days,cashDays,salesSource:src,sales,itemSales,cash,std:calStd(rg),waste:a?a.calTot.waste+a.calTot.staff:null,wasteOnly:a?a.calTot.waste:null,staffUse:a?a.calTot.staff:null,receipts:a?a.calTot.receipt:null,variance:a?a.tot.variance:null,coverage:a?a.coverage:0,counted:a?a.counted:0,noRecipeAmt:a?A(a.issues).filter(i=>i.type==='noRecipe').reduce((t,i)=>t+Z(i.amount),0):0,purchases,staff,tips,
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
 /* overdue: unpaid invoice past «date + supplier settlement days» (APP_REVIEW P-11) */{const sd=window.FinanceReal?.suppliers?.();if(sd){const od=A(inv.purchaseInvoices).filter(x=>{if(!PW.isFinal(x)||PW.invoiceTotal(x)-PW.invoicePaid(inv,x)<=0.5)return false;const d=PW.dueDate(x,sd);return d&&d<today}),amt=od.reduce((t,x)=>t+PW.invoiceTotal(x)-PW.invoicePaid(inv,x),0);if(od.length)add('warning',`${fa(od.length)} فاکتور خرید از سررسید گذشته است (${RT.money(amt)} تومان)`,'#/finance/payments','alarm-clock')}}
 const open=A(inv.purchaseInvoices).filter(x=>PW.isFinal(x)&&PW.invoiceTotal(x)-PW.invoicePaid(inv,x)>0.5).length;if(open)add('info',`${fa(open)} فاکتور خرید پرداخت‌نشده یا ناقص`,'#/finance/payments','wallet');
 const unap=A(inv.stocktakes).filter(s=>s.status==='submitted').length;if(unap)add('warning',`${fa(unap)} شمارش منتظر تأیید است`,'#/inventory/count','clipboard-list');
 const pos=E.positions(M(),today),neg=pos.filter(r=>r.flags.has('negative')).length;if(neg)add('info',`${fa(neg)} قلم موجودی منفی دارند`,'#/inventory/stock','trending-down');
 const MR=window.MenuReal;if(MR){const act=A(R().pricing.menuItems).filter(m=>m.status!=='غیرفعال'),none=act.filter(m=>MR.metrics(m).state==='none').length,over=act.filter(m=>{const x=MR.metrics(m);return x.complete&&x.ratio>100}).length;if(none)add('warning',`${fa(none)} آیتم فعال منو رسپی ندارد`,'#/menu/items','chef-hat');if(over)add('danger',`${fa(over)} آیتم منو بهای مواد بیش از قیمت دارد (معمولاً خطای مقدار بسته)`,'#/menu/items','alert-triangle')}
 return out}
const TONE={danger:'danger',warning:'warning',info:'info'};

/* ---------- home ---------- */
/* ---------- daily work: what has to be entered every day, its state for yesterday and today, one click to enter ----------
   need = it must exist every working day (red when missing for yesterday); the others show what was entered */
const DAILY=[
 {k:'cash',t:'گزارش صندوق',icon:'banknote',need:true,mod:'finance',key:'cash',go:'#/finance/cash',ready:()=>!!window.CashReal,open:d=>CashReal.form('',d),n:d=>reports().filter(r=>E.D(r.date)===d).length},
 {k:'sales',t:'فروش روز (فایل آیتم‌ها)',icon:'file-spreadsheet',need:true,mod:'inventory',key:'inventory',go:'#/inventory/sales',n:d=>{const i=E.CAL.i(d);return M().sales.filter(s=>s.a<=i&&s.b>=i).length}},
 {k:'bev',t:'شمارش نوشیدنی',icon:'cup-soda',need:true,mod:'inventory',key:'inventory',go:'#/inventory/beverage',n:d=>A(R().inventory.beverageDailyControls).filter(r=>r.status!=='void'&&E.D(r.date)===d).length},
 {k:'tips',t:'انعام روز',icon:'hand-coins',mod:'people',key:'payroll',go:'#/people/tips',ready:()=>!!window.PeopleReal?.doc?.(),open:()=>PeopleEntry.tip(),n:d=>{const h=window.PeopleReal?.doc?.();return h?A(h.tipGroups).filter(g=>!/ابطال|void/.test(g.status||'')&&E.D(g.receiveDate)===d).length:null}},
 {k:'inv',t:'فاکتور خرید',icon:'file-plus-2',mod:'finance',key:'purchase',go:'#/finance/docs',ready:()=>!!window.FinanceReal?.suppliers?.(),open:()=>PurchaseEntry.detailed(),n:d=>A(R().inventory.purchaseInvoices).filter(x=>x.status!=='void'&&E.D(x.date||x.invoiceDate)===d).length},
 {k:'rec',t:'ورود کالا بدون فاکتور',icon:'package-plus',mod:'inventory',key:'inventory',go:'#/inventory/receipt',open:()=>InvEntry.receipt(),n:d=>A(R().inventory.stockReceipts).filter(x=>x.status!=='void'&&E.D(x.date)===d).length},
 {k:'waste',t:'ضایعات و مصرف پرسنل',icon:'trash-2',mod:'inventory',key:'inventory',go:'#/inventory/waste',open:()=>InvEntry.event(),n:d=>[...A(R().inventory.wasteRecords),...A(R().inventory.consumptionRecords)].filter(x=>x.status!=='void'&&E.D(x.date)===d).length},
 {k:'petty',t:'تنخواه',icon:'credit-card',mod:'finance',key:['petty','financeLedger'],go:'#/finance/petty',ready:()=>!!window.ExtrasReal?.mods?.finance?.doc&&!!window.PettyEntry,open:()=>PettyEntry.expense(),n:d=>{const f=window.ExtrasReal?.mods?.finance;if(!f?.doc)return f?.err?0:null;return A(f.doc.pettyCash?.expenses).filter(x=>x.status!=='void'&&E.D(x.date)===d).length}},
 {k:'pay',t:'پرداخت به پرسنل (مساعده، حقوق)',icon:'wallet',mod:'people',key:'payroll',go:'#/people/payments',ready:()=>!!window.PeopleReal?.doc?.()&&!!window.PayrollReal,open:()=>PayrollReal.pay(),n:d=>{const h=window.PeopleReal?.doc?.();return h?A(h.payments).filter(p=>!/ابطال|void|لغو/.test(p.status||'')&&E.D(p.date)===d).length:null}},
 {k:'spay',t:'پرداخت به تأمین‌کننده',icon:'send',mod:'finance',key:'purchase',go:'#/finance/payments',ready:()=>!!window.FinanceReal?.suppliers?.(),open:()=>PurchaseEntry.payment({}),n:d=>A(R().inventory.supplierPayments).filter(p=>p.status!=='void'&&E.D(p.date)===d).length},
 {k:'pen',t:'جریمه، پاداش و کسر',icon:'gavel',mod:'people',key:'payroll',go:'#/people/payroll',ready:()=>!!window.PeopleReal?.doc?.(),open:()=>PeopleEntry.penalty(),n:d=>{const h=window.PeopleReal?.doc?.();return h?A(h.penaltiesRewards).filter(p=>!/لغو|رد|ابطال/.test(p.status||'')&&E.D(p.date)===d).length:null}},
 {k:'vio',t:'تخلف پرسنل',icon:'alert-octagon',mod:'people',key:'personnel',go:'#/people/violations',ready:()=>!!window.PeopleReal?.doc?.()&&!!window.PeopleHR,open:()=>PeopleHR.violationForm(),n:d=>{const h=window.PeopleReal?.doc?.();return h?A(h.workViolations).filter(v=>v.status!=='ابطال‌شده'&&E.D(v.date)===d).length:null}}];
const dailyOk=x=>P.can(x.mod)&&(P.owner()||[].concat(x.key).some(k=>window.AdminAccess?.has?.(k)));
/* ---------- home (APP_REVIEW P-07, P-28, P-04, P-03, P-05) ----------
   «امروز باید»: at most five tasks of today that this user can do (the rest behind «همه»), from tasks() and the days left
   incomplete. «سلامت کسب‌وکار» (owner / «dashboard» access): four numbers, each with a trust colour and why. «روزهای ماه»:
   a calendar of the month; a day is complete when it has every daily entry (cash report, Sepidz and Snapp sales files,
   beverage count, waste, purchase invoices) or the missing ones are marked «نداشتیم» (or the café was closed) —
   inventory.dayChecks, InvWrite.saveDayCheck. «کارنامهٔ ماه»: for each month which link of the chain is complete.
   «گزارش شب»: five lines for the owner, to copy or share. Each user sees only the tasks, days and shortcuts of the
   sections they can open, so every role gets its own home page. */
/* the sales and month summary needs access «dashboard» (خلاصهٔ میز کار); without it the home page shows only the user's tasks and days */
const homeFull=()=>P.owner()||!!window.AdminAccess?.has?.('dashboard');
const WD=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
const wdOf=d=>(E.CAL.i(d)+1)%7;                       // CAL day 0 = 2020-03-01, a Sunday → Saturday-first index
const hrefOk=h=>{const [,mod,tab]=String(h).replace(/^#\/?/,'#/').split('/');return P.can(mod)&&(!tab||P.tabOk(mod,tab))};
const myTasks=()=>tasks().filter(t=>hrefOk(t.href));
const roleTitle=()=>{if(homeFull())return'میز کار مدیر';const h=k=>!!window.AdminAccess?.has?.(k);return h('cash')?'میز کار صندوق و شیفت':h('inventory')?'میز کار انبار':h('purchase')||h('financeLedger')?'میز کار مالی':h('payroll')||h('personnel')?'میز کار پرسنل':'میز کار'};
const cover=(src,d)=>{const i=E.CAL.i(d);return M().sales.some(s=>s.src===src&&s.a<=i&&s.b>=i)};
const daily=k=>DAILY.find(x=>x.k===k);
/* the daily entries of a day; d = the DAILY row that opens its form and decides access */
const DAY=[
 {k:'cash',t:'گزارش صندوق',d:'cash',has:d=>reports().some(r=>E.D(r.date)===d)},
 {k:'sepidz',t:'فروش سپیدز (فایل)',d:'sales',none:1,has:d=>cover('SEPIDZ',d)},
 {k:'snapp',t:'فروش اسنپ (فایل)',d:'sales',none:1,has:d=>cover('SNAPP',d)},
 {k:'bev',t:'شمارش نوشیدنی',d:'bev',none:1,when:()=>A(R().inventory.settings?.beverageControl?.itemIds).length>0,has:d=>A(R().inventory.beverageDailyControls).some(r=>r.status!=='void'&&E.D(r.date)===d)},
 {k:'waste',t:'ضایعات و مصرف پرسنل',d:'waste',none:1,has:d=>[...A(R().inventory.wasteRecords),...A(R().inventory.consumptionRecords)].some(x=>x.status!=='void'&&E.D(x.date)===d)},
 {k:'inv',t:'فاکتور خرید',d:'inv',none:1,has:d=>A(R().inventory.purchaseInvoices).some(x=>x.status!=='void'&&E.D(x.date||x.invoiceDate)===d)}];
const dayKeys=()=>DAY.filter(x=>(!x.when||x.when())&&dailyOk(daily(x.d)));
const checks=()=>new Map(A(R().inventory.dayChecks).map(x=>[x.date,x]));
const dataStart=()=>{const ds=[...reports().map(r=>E.D(r.date)),...M().sales.map(s=>E.CAL.k(s.a))].filter(Boolean).sort();return ds[0]||E.CAL.today};
function dayStatus(d,ch=checks(),keys=dayKeys()){const c=ch.get(d),items=keys.map(x=>({x,st:x.has(d)?'ok':c?.closed?'closed':A(c?.none).includes(x.k)?'none':'miss'}));return{d,c,closed:!!c?.closed,items,miss:items.filter(i=>i.st==='miss')}}
const yesterday=()=>E.CAL.k(E.CAL.i(E.CAL.today)-1);

/* ---------- trust of a number: g complete · y estimate · r data missing ---------- */
const worst=(...ls)=>ls.includes('r')?'r':ls.includes('y')?'y':'g';
function monthTrust(m){const rg=E.monthRange(m.k),last=Math.min(E.CAL.i(rg.to),E.CAL.i(yesterday())),first=E.CAL.i(rg.from),n=Math.max(0,last-first+1),cnt=f=>{let c=0;for(let i=first;i<=last;i++)if(f(E.CAL.k(i)))c++;return c};
 const cash=cnt(d=>reports().some(r=>E.D(r.date)===d)),sep=cnt(d=>cover('SEPIDZ',d)),snp=cnt(d=>cover('SNAPP',d)),rate=(v,lo=0.8)=>!n?'g':v>=n?'g':v>=n*lo?'y':'r';
 const recipe=m.itemSales>0?1-(m.noRecipeAmt||0)/m.itemSales:null,inv=R().inventory,inM=d=>{const x=E.D(d);return x>=rg.from&&x<=rg.to};
 const counts=[...new Set(A(inv.stocktakes).filter(s=>s.status==='approved'&&inM(s.date)).map(s=>E.D(s.date)))].sort(),endOk=counts.some(d=>E.CAL.i(rg.to)-E.CAL.i(d)<=2),done=E.CAL.i(rg.to)<E.CAL.i(E.CAL.today);
 const invs=A(inv.purchaseInvoices).filter(x=>x.status!=='void'&&inM(x.date||x.invoiceDate)).length,closed=A(inv.periodClosures).some(c=>c.status==='closed'&&E.D(c.to)>=rg.to);
 const L={cash:{v:`${fa(cash)} از ${fa(n)} روز`,t:rate(cash)},sep:{v:`${fa(sep)} از ${fa(n)} روز`,t:rate(sep)},snp:{v:`${fa(snp)} از ${fa(n)} روز`,t:snp?rate(snp,0.5):'y'},
  recipe:{v:recipe===null?'—':pct(recipe*100)+' فروش',t:recipe===null?'r':recipe>=0.95?'g':recipe>=0.8?'y':'r'},inv:{v:`${fa(invs)} فاکتور`,t:invs?'g':'r'},
  count:{v:counts.length?`${fa(counts.length)} روز${endOk?' · پایان ماه':''}`:'ندارد',t:endOk?'g':counts.length?'y':done?'r':'y'},close:{v:closed?'بسته شد':done?'باز':'ماه جاری',t:closed?'g':'y'}};
 const why=[cash<n&&`${fa(n-cash)} روز بی‌گزارش صندوق`,sep<n&&`فروش سپیدز ${fa(n-sep)} روز وارد نشده`,recipe!==null&&recipe<0.95&&`${pct((1-recipe)*100)} فروش بی‌رسپی`,!endOk&&(done?'شمارش پایان ماه ندارد':'شمارش پایان ماه هنوز نیست')].filter(Boolean);
 return{L,n,mat:worst(L.sep.t,L.recipe.t),variance:worst(L.count.t,L.sep.t,L.recipe.t),sales:L.cash.t,why}}
const TRUST={g:['قابل اعتماد','success'],y:['تخمینی','warning'],r:['داده کم است','danger']};
const trust=(t,why)=>`<span class="trust trust-${t}" title="${esc(why||'')}">${P.b(TRUST[t][0],TRUST[t][1],1)}</span>`;

/* ---------- month report card ---------- */
function monthCard(ms){const cols=[['cash','گزارش صندوق'],['sep','فروش سپیدز'],['snp','فروش اسنپ'],['recipe','رسپی'],['inv','فاکتور خرید'],['count','شمارش'],['close','بستن ماه']];
 return P.table(['ماه',...cols.map(c=>c[1]),'٪ بهای مواد'],ms.slice().reverse().map(m=>{const tr=monthTrust(m);return[`<b>${esc(m.label)}</b>`,...cols.map(([k])=>`<span class="trust-cell trust-${tr.L[k].t}">${tr.L[k].v}</span>`),m.sales&&m.std?`${pct(m.std/m.sales*100)} ${trust(tr.mat,tr.why.join('؛ '))}`:'—']}),{cls:'no-grid'})}

/* ---------- calendar ---------- */
let calMonth='';
function calendar(){const k=calMonth||E.CAL.today.slice(0,7),rg=E.monthRange(k),a=E.CAL.i(rg.from),b=E.CAL.i(rg.to),t=E.CAL.i(E.CAL.today),st=E.CAL.i(dataStart()),ch=checks(),keys=dayKeys();if(!keys.length)return'';
 const ms=[...new Set([...months().map(m=>m.k),E.CAL.today.slice(0,7)])].filter(x=>E.CAL.i(E.monthRange(x).to)>=st).sort();let full=0,part=0,cells='';
 for(let i=0;i<wdOf(rg.from);i++)cells+='<span class="dc dc-pad"></span>';
 for(let i=a;i<=b;i++){const d=E.CAL.k(i),day=+d.slice(8);if(i>t||i<st){cells+=`<span class="dc dc-off"><b>${fa(day)}</b></span>`;continue}
  const s=dayStatus(d,ch,keys),n=s.miss.length,cls=s.closed?'closed':!n?'ok':i===t?'today':s.miss.some(m=>m.x.k==='cash')||n>=3?'bad':'part';if(i<t){if(n)part++;else full++}
  cells+=`<button type="button" class="dc dc-${cls}" data-day="${d}" title="${esc(s.closed?'تعطیل':n?'کم دارد: '+s.miss.map(m=>m.x.t).join('، '):'کامل')}"><b>${fa(day)}</b><small>${s.closed?'تعطیل':n?fa(n)+' کم':'✓'}</small></button>`}
 return P.card({title:'روزهای ماه',sub:`هر روز وقتی کامل است که ${keys.map(x=>x.t).join('، ')} را داشته باشد یا «نداشتیم» زده شود. روی هر روز بزنید.`,
  actions:`<select class="select" id="hmCalM" style="width:auto">${ms.slice().reverse().map(x=>`<option value="${x}" ${x===k?'selected':''}>${E.monthLabel(x)}</option>`).join('')}</select>`,
  body:`<div class="row" style="gap:8px;flex-wrap:wrap;margin-bottom:var(--s3)">${P.b(`${fa(full)} روز کامل`,'success',1)}${part?P.b(`${fa(part)} روز ناقص`,'danger',1):''}</div><div class="daycal">${WD.map(w=>`<span class="dc-h">${w.replace('‌شنبه','ش').slice(0,2)}</span>`).join('')}${cells}</div>`})}
function dayModal(d){const s=dayStatus(d),c=s.c,mark=new Set(A(c?.none)),may=k=>dailyOk(daily(DAY.find(x=>x.k===k).d));
 const row=({x,st})=>{const dl=daily(x.d);return`<div class="list-item"><div class="grow"><b>${x.t}</b></div>${st==='ok'?P.b('ثبت شده','success',1):st==='closed'?P.b('تعطیل','neutral',1):`${x.none?`<label class="row" style="gap:4px;font-size:12.5px"><input type="checkbox" data-none="${x.k}" ${st==='none'?'checked':''}>نداشتیم</label>`:''}${st==='miss'?P.b('ثبت نشده','danger',1):''}<button class="btn btn-sm btn-primary" type="button" data-open="${x.d}">${P.ic('plus')}ثبت</button>`}</div>`};
 P.modal({title:`${WD[wdOf(d)]} ${fa(d)}`,size:'md',body:`<div class="list">${s.items.map(row).join('')}</div>
   <label class="row mt" style="gap:6px"><input type="checkbox" id="dcClosed" ${s.closed?'checked':''}>مجموعه این روز تعطیل بود</label>
   <div class="field mt"><label>توضیح (اختیاری)</label><input class="input" id="dcNote" value="${esc(c?.note||'')}"></div>
   ${P.note('«نداشتیم» و «تعطیل» فقط روز را کامل نشان می‌دهند و هیچ عددی را تغییر نمی‌دهند. «ثبت» فرم همان کار را باز می‌کند؛ تاریخ را در فرم روی همین روز بگذارید.','info')}<div id="iwErr" class="neg" style="font-size:13px"></div>`,
  foot:`<button class="btn btn-ghost" data-close>بستن</button><button class="btn btn-primary" id="dcSave">${P.ic('check')}ذخیرهٔ وضعیت روز</button>`,
  onMount:m=>{m.addEventListener('click',e=>{const b=e.target.closest('[data-open]');if(!b)return;const x=daily(b.dataset.open);P.close();P.openLive({go:x.go,ready:x.ready,open:x.open?()=>x.open(d):null})});
   P.$('#dcSave',m).onclick=e=>{const none=P.$$('[data-none]',m).filter(i=>i.checked&&may(i.dataset.none)).map(i=>i.dataset.none);
    window.InvEntry.run(e.currentTarget,{action:'DAY_CHECK_SAVED',details:{date:d},ioOpts:{recalc:false},mutate:(doc,cx)=>window.InvWrite.saveDayCheck(doc,cx,{date:d,closed:P.$('#dcClosed',m).checked,none,note:P.$('#dcNote',m).value}),done:()=>`وضعیت ${fa(d)} ذخیره شد`})}}})}

/* ---------- nightly report for the owner ---------- */
function nightText(d){const sum=rs=>rs.reduce((s,r)=>s+cashSales(r),0),rs=reports().filter(r=>E.D(r.date)===d),sale=sum(rs),w=WD[wdOf(d)];
 const prev=[1,2,3,4].map(n=>sum(reports().filter(r=>E.D(r.date)===E.CAL.k(E.CAL.i(d)-7*n)))).filter(v=>v>0),avg=prev.length?prev.reduce((a,b)=>a+b,0)/prev.length:null;
 const vr=rs.reduce((s,r)=>s+Z(r.finalVariance),0)/10;let waste=null;try{const a=E.analyze(M(),d,d);waste=a.calTot.waste+a.calTot.staff}catch(_){}
 const st=dayStatus(d,checks(),DAY.filter(x=>!x.when||x.when())),al=tasks().find(t=>t.tone==='danger')||tasks().find(t=>t.tone==='warning');const tm=v=>P.t(Math.round(v))+' تومان';
 return[`گزارش شب رایو — ${w} ${d}`,
  `۱. فروش: ${rs.length?tm(sale)+(avg?` (${sale>=avg?'+':'−'}${P.fa(Math.abs(Math.round((sale/avg-1)*100)))}٪ نسبت به میانگین ${P.fa(prev.length)} ${w} قبل)`:''):'گزارش صندوق ثبت نشده'}`,
  `۲. مغایرت صندوق: ${rs.length?(Math.abs(vr)<1?'ندارد':(vr<0?'کسری ':'اضافه ')+tm(Math.abs(vr))):'—'}`,
  `۳. ضایعات و مصرف پرسنل: ${waste===null?'—':waste?tm(waste):'ثبت نشده'}`,
  `۴. ثبت‌های روز: ${st.closed?'تعطیل':st.miss.length?'کم دارد — '+st.miss.map(m=>m.x.t).join('، '):'کامل'}`,
  `۵. هشدار: ${al?al.text:'هشدار مهمی نیست'}`].map(P.fa).join('\n')}
function nightModal(){const t=E.CAL.today,y=yesterday(),d0=reports().some(r=>E.D(r.date)===t)?t:y;
 P.modal({title:'گزارش شب',size:'md',body:`<div class="row" style="gap:8px;margin-bottom:var(--s3)"><label>روز</label><select class="select" id="ntDay" style="width:auto">${[t,y,E.CAL.k(E.CAL.i(t)-2)].map(d=>`<option value="${d}" ${d===d0?'selected':''}>${WD[wdOf(d)]} ${fa(d)}</option>`).join('')}</select></div><pre id="ntText" class="night-text"></pre>${P.note('پیامک و پیام‌رسان در این فاز وصل نیست؛ متن را کپی کنید یا با «هم‌رسانی» برای خودتان بفرستید.','info')}`,
  foot:`<button class="btn btn-ghost" data-close>بستن</button><button class="btn" id="ntShare">${P.ic('share-2')}هم‌رسانی</button><button class="btn btn-primary" id="ntCopy">${P.ic('copy')}کپی متن</button>`,
  onMount:m=>{const sel=P.$('#ntDay',m),pre=P.$('#ntText',m),draw=()=>{pre.textContent=nightText(sel.value)};sel.onchange=draw;draw();
   P.$('#ntCopy',m).onclick=async()=>{try{await navigator.clipboard.writeText(pre.textContent);P.toast('متن کپی شد','check')}catch(_){const r=document.createRange();r.selectNodeContents(pre);getSelection().removeAllRanges();getSelection().addRange(r);P.toast('متن انتخاب شد؛ Ctrl+C بزنید','copy')}};
   const sh=P.$('#ntShare',m);if(!navigator.share)sh.hidden=true;else sh.onclick=()=>navigator.share({text:pre.textContent}).catch(()=>{})}})}

/* ---------- the page ---------- */
let showAll=false;
function homeReal(){if(!window.PeopleReal?.doc?.()&&!window.PeopleReal?.state?.err)window.PeopleReal?.load?.();if(!window.FinanceReal?.suppliers?.()&&!window.FinanceReal?.supState?.err)window.FinanceReal?.loadSuppliers?.();if(dailyOk(daily('petty'))&&!window.ExtrasReal?.mods?.finance?.doc&&!window.ExtrasReal?.mods?.finance?.err)window.ExtrasReal?.loadModule?.('finance');
 const full=homeFull(),y=yesterday(),ys=dayStatus(y),ym=k=>ys.miss.some(m=>m.x.k===k),ts=myTasks().filter(t=>!(ym('cash')&&/گزارش صندوق دیروز/.test(t.text))&&!(ym('bev')&&/کنترل روزانهٔ نوشیدنی از/.test(t.text)));
 if(ys.miss.length&&!ys.closed)ts.unshift({tone:'danger',text:`دیروز (${fa(y)}) کامل نیست: ${ys.miss.map(m=>m.x.t).join('، ')}`,href:'#/home',icon:'calendar-x',day:y});
 const order={danger:0,warning:1,info:2};ts.sort((a,b)=>order[a.tone]-order[b.tone]);const shown=showAll?ts:ts.slice(0,5);
 const taskRow=t=>`<a href="${t.href}" ${t.day?`data-day="${t.day}"`:''} class="row hm-task">${P.b(P.ic(t.icon),TONE[t.tone],1)}<span>${esc(t.text)}</span></a>`;
 const todo=P.card({title:'امروز باید',sub:ts.length?`${fa(ts.length)} کار`:'',flush:1,actions:ts.length>5?`<button class="btn btn-ghost btn-sm" id="hmAll">${showAll?'فقط ۵ کار مهم':'همه ('+fa(ts.length)+')'}</button>`:'',body:ts.length?`<div class="side-list">${shown.map(taskRow).join('')}</div>`:`<div style="padding:var(--s4)">${P.note('کار عقب‌افتاده‌ای پیدا نشد.','check')}</div>`});
 const sc=DAILY.filter(dailyOk),today=E.CAL.today;
 const shortcuts=sc.length?P.card({title:'ثبت سریع',sub:'وضعیت امروز کنار هر کار',body:`<div class="hm-short">${sc.map(x=>{const n=x.n(today);return`<button class="btn btn-sm ${n?'':'btn-ghost'} hm-sc" data-daily="${x.k}">${P.ic(x.icon)}${x.t}${n?` <span class="badge badge-success plain">${fa(n)}</span>`:''}</button>`}).join('')}</div>`}):'';
 let health='',card='';
 if(full){const ms=months(),cur=ms.find(m=>m.k===today.slice(0,7)),sd=supplierDebt(),inv=R().inventory;
  if(cur){const tr=monthTrust(cur),noPay=!A(inv.supplierPayments).some(p=>p.status!=='void')&&A(inv.purchaseInvoices).some(PW.isFinal);
   health=`<div class="grid grid-4">${P.kpi({label:'فروش '+cur.label,icon:'trending-up',value:cur.sales?RT.money(cur.sales):'—',unit:cur.sales?'تومان':'',foot:`${trust(tr.sales,tr.L.cash.v+' گزارش صندوق')} ${tr.L.cash.v}`})}
    ${P.kpi({label:'٪ بهای مواد',icon:'chef-hat',value:cur.sales&&cur.std?pct(cur.std/cur.sales*100):'—',foot:`${trust(tr.mat,tr.why.join('؛ '))} ${esc([tr.L.sep.t!=='g'&&'سپیدز '+tr.L.sep.v,tr.L.recipe.t!=='g'&&'رسپی '+tr.L.recipe.v].filter(Boolean).join(' · ')||'فروش و رسپی کامل')}`})}
    ${P.kpi({label:'مغایرت انبار',icon:'scale',value:cur.coverage>0&&cur.variance!==null&&tr.variance!=='r'?RT.money(cur.variance):'—',unit:'تومان',tone:cur.variance<0?'danger':'',foot:`${trust(tr.variance,tr.why.join('؛ '))} شمارش: ${tr.L.count.v}`})}
    ${P.kpi({label:'بدهی به تأمین‌کنندگان',icon:'wallet',value:sd.n?RT.money(sd.debt):'—',unit:sd.n?'تومان':'',foot:`${trust(noPay?'r':'g',noPay?'هیچ پرداختی به تأمین‌کننده ثبت نشده؛ بدهی واقعی کمتر است':'')} ${noPay?'پرداختی ثبت نشده':`${fa(sd.n)} طرف حساب`}`})}</div>`}
  card=P.card({title:'کارنامهٔ ماه‌ها',sub:'کدام حلقهٔ زنجیرهٔ داده در هر ماه کامل است؛ تا همه سبز نشده‌اند، درصد بهای مواد و مغایرت تخمینی‌اند',flush:1,actions:'<a class="btn btn-ghost btn-sm" href="#/reports/monthly">ماه به ماه</a>',body:monthCard(months().slice(-3))})}
 return`<div id="hmRoot"><div class="page-head"><div><div class="crumbs">${P.ic('layout-dashboard')}${roleTitle()}</div><h1>${WD[wdOf(today)]} ${fa(today)}</h1><p>${full?'کارهای امروز، سلامت کسب‌وکار و کامل بودن روزها':'کارهای امروز و روزهای ناقص بخش‌های شما'}</p></div><div class="actions">${full?`<button class="btn" id="hmNight">${P.ic('moon')}گزارش شب</button>`:''}</div></div>
 ${srcLine()}${health}<div class="grid grid-2 mt">${todo}${calendar()}</div>${shortcuts?`<div class="mt">${shortcuts}</div>`:''}${card?`<div class="mt">${card}</div>`:''}</div>`}
function homeMount(){const v=document.getElementById('hmRoot');if(!v)return;const all=P.$('#hmAll',v);if(all)all.onclick=()=>{showAll=!showAll;P.render()};
 const nb=P.$('#hmNight',v);if(nb)nb.onclick=nightModal;const cm=P.$('#hmCalM',v);if(cm)cm.onchange=()=>{calMonth=cm.value;P.render()};
 v.onclick=e=>{const day=e.target.closest('[data-day]');if(day){e.preventDefault();dayModal(day.dataset.day);return}
  const b=e.target.closest('[data-daily]');if(b){const x=daily(b.dataset.daily);P.openLive({go:x.go,ready:x.ready,open:x.open?()=>x.open(E.CAL.today):null})}}}

/* ---------- reports: monthly table and management view ---------- */
function monthTable(ms,compact){return P.table(['ماه',{t:'فروش',n:1},{t:'بهای استاندارد مواد',n:1},{t:'٪ مواد',n:1},{t:'پرتی و مصرف مجاز',n:1},{t:'مغایرت انبار (شمارش به شمارش)',n:1},...(compact?[]:[{t:'ورود به انبار (ارزش)',n:1},{t:'خرید ثبت‌شده',n:1},{t:'پرداخت پرسنل',n:1},{t:'انعام ثبت‌شده',n:1}]),'پوشش داده'],ms.slice().reverse().map(m=>[`<b>${esc(m.label)}</b>`,m.sales?`${T(m.sales)}<small class="muted" style="display:block">${SRC[m.salesSource]||''}${m.salesSource==='cash'?` · ${fa(m.cashDays)} روز`:''}</small>`:'—',T(m.std),m.sales&&m.std?pct(m.std/m.sales*100):'—',T(m.waste),m.coverage>0?`<span class="${m.variance<0?'down':'up'}">${T(m.variance)}</span>`:'<span class="muted">بدون شمارش</span>',...(compact?[]:[T(m.receipts),m.purchases?T(m.purchases):'—',m.staff===null?'…':m.staff?T(m.staff):'—',m.tips===null?'…':m.tips?T(m.tips):'—']),[m.salesSource?'':'فروش ندارد',m.coverage>0?`شمارش ${fa(Math.round(m.coverage*100))}٪`:'',m.salesSource==='cash'&&m.cashDays<m.days?`صندوق ${fa(m.cashDays)}/${fa(m.days)} روز`:''].filter(Boolean).map(x=>P.b(esc(x),'neutral',1)).join(' ')]),{empty:'داده‌ای نیست'})}
function monthlyReal(){if(!window.PeopleReal?.doc?.()&&!window.PeopleReal?.state?.err)window.PeopleReal?.load?.();const ms=months();
 return srcLine()+P.card({title:'کارنامهٔ ماه‌ها',sub:'کدام حلقهٔ زنجیرهٔ داده در هر ماه کامل است (APP_REVIEW P-03)',flush:1,body:monthCard(ms)})+'<div class="mt"></div>'+P.card({title:'ماه به ماه',sub:'فروش از گزارش صندوق (یا فایل فروش آیتم‌ها اگر گزارش صندوق نباشد) · بها، پرتی و مغایرت از تحلیل انبار همان ماه',flush:1,body:monthTable(ms,false)})
 +`<div class="grid grid-2 mt">${P.card({title:'روند فروش و بهای مواد',body:'<div class="chart" id="rpTrend"></div>'})}${P.note('<b>آنچه در این جدول نیست:</b> اجاره، قبوض، حقوق محاسبه‌شده و سایر هزینه‌ها در دادهٔ رایو ثبت نمی‌شوند؛ بنابراین سود و زیان کامل از داده ساخته نمی‌شود. «پرداخت پرسنل» فقط پرداخت‌های ثبت‌شده در پرسنل است. «مغایرت انبار» فقط با شمارش ابتدا و انتهای ماه معنا دارد؛ پوشش شمارش هر ماه در ستون آخر آمده است.','info')}</div>`}
function monthlyMount(){const ms=months();RT.chart('rpTrend',t=>Object.assign(RT.base(t),{grid:{left:8,right:8,top:28,bottom:8,containLabel:true},legend:{top:0,textStyle:{color:t.text2,fontFamily:t.font}},tooltip:Object.assign(RT.base(t).tooltip,{trigger:'axis'}),xAxis:RT.axis(t,{type:'category',data:ms.map(m=>m.label)}),yAxis:RT.axis(t,{type:'value',axisLabel:{color:t.text3,fontFamily:t.font,formatter:v=>RT.short(v)}}),series:[{name:'فروش',type:'bar',data:ms.map(m=>Math.round(m.sales||0)),itemStyle:{color:t.accent}},{name:'بهای استاندارد مواد',type:'bar',data:ms.map(m=>Math.round(m.std||0)),itemStyle:{color:t.warning}},{name:'مغایرت انبار',type:'line',data:ms.map(m=>m.coverage>0?Math.round(m.variance):null),itemStyle:{color:t.danger}}]}))}
function overviewReal(){const ms=months(),done=ms.filter(m=>E.CAL.i(E.monthRange(m.k).to)<E.CAL.i(E.CAL.today)),m=done.at(-1)||ms.at(-1);if(!m)return srcLine()+P.note('داده‌ای برای گزارش نیست.','info');const sd=supplierDebt(),ts=tasks();
 return srcLine()+`<div class="row" style="margin-bottom:var(--s3)"><b>${esc(m.label)}</b><span class="muted" style="margin-inline-start:8px;font-size:12px">آخرین ماه کامل</span></div>
 <div class="grid grid-4">${P.kpi({label:'فروش',icon:'receipt',value:m.sales?RT.money(m.sales):'—',unit:m.sales?'تومان':'',foot:SRC[m.salesSource]||'ثبت نشده'})}${P.kpi({label:'بهای استاندارد مواد فروش',icon:'chef-hat',value:m.std!==null?RT.money(m.std):'—',unit:'تومان',foot:m.sales&&m.std?`${pct(m.std/m.sales*100)} فروش (رسپی × تعداد)`:''})}${P.kpi({label:'مغایرت انبار',icon:'scale',value:m.coverage>0?RT.money(m.variance):'—',unit:m.coverage>0?'تومان':'',tone:m.variance<0?'danger':'',foot:m.coverage>0?`پوشش شمارش ${fa(Math.round(m.coverage*100))}٪ · منفی = کسری`:'شمارش ابتدا/انتهای ماه نیست'})}${P.kpi({label:'پرتی و مصرف مجاز',icon:'trash-2',value:m.waste!==null?RT.money(m.waste):'—',unit:'تومان',foot:m.sales&&m.waste?`${pct(m.waste/m.sales*100)} فروش`:''})}</div>
 <div class="grid grid-2 mt">${P.card({title:'آنچه باید دید',flush:1,body:ts.length?`<div class="side-list">${ts.slice(0,8).map(t=>`<a href="${t.href}" class="row" style="gap:8px;padding:10px 14px;text-decoration:none;color:inherit;border-bottom:1px solid var(--border)">${P.b(P.ic(t.icon),TONE[t.tone],1)}<span>${esc(t.text)}</span></a>`).join('')}</div>`:''})}
 ${(()=>{/* top purchases of the month (js/15 «بیشترین خرید دوره»): final invoice lines by item */const r=E.monthRange(m.k),by=new Map,dead=['void','draft','pending','rejected','cancelled','لغوشده'];
  for(const inv of A(IC.state.raw?.inventory?.purchaseInvoices)){const d=E.D(inv.date||inv.invoiceDate);if(!d||d<r.from||d>r.to||dead.includes(inv.status)||inv.isArchived)continue;for(const l of A(inv.lines)){const k=l.ingredientId||l.itemName,v=Number(l.lineTotalToman)||(Number(l.purchaseQuantity||l.quantity)||0)*(Number(l.unitPrice)||0);if(!k||!v)continue;const o=by.get(k)||{name:l.itemName||IC.state.M?.ing?.get(l.ingredientId)?.name||k,v:0,q:0,u:l.purchaseUnit||l.unit||''};o.v+=v;o.q+=Number(l.purchaseQuantity||l.quantity)||0;by.set(k,o)}}
  const top=[...by.values()].sort((a,b)=>b.v-a.v).slice(0,10);return P.card({title:`بیشترین خرید ${esc(m.label)}`,sub:'از ردیف فاکتورهای خرید نهایی',flush:1,body:top.length?P.table(['قلم',{t:'مقدار',n:1},{t:'مبلغ',n:1}],top.map(o=>[esc(o.name),`${fa(Math.round(o.q*100)/100)} ${esc(o.u)}`,T(o.v)])):P.note('در این ماه فاکتور خرید با جزئیات ثبت نشده است.','info')})})()}</div><div class="grid grid-2 mt">
 ${P.card({title:'حساب‌ها',body:`<div class="minis"><div class="mini"><small>بدهی به تأمین‌کنندگان</small><b>${sd.n?T(sd.debt):'—'}</b></div><div class="mini"><small>خرید ثبت‌شده ${esc(m.label)}</small><b>${T(m.purchases)}</b></div><div class="mini"><small>پرداخت پرسنل ${esc(m.label)}</small><b>${m.staff===null?'…':T(m.staff)}</b></div><div class="mini"><small>انعام ثبت‌شده</small><b>${m.tips===null?'…':T(m.tips)}</b></div></div><p class="muted" style="font-size:12px;margin-top:var(--s3)">جزئیات: <a href="#/inventory/control">داشبورد کنترل انبار</a> · <a href="#/finance/cash">صندوق</a> · <a href="#/finance/parties">طرف حساب‌ها</a> · <a href="#/reports/monthly">ماه به ماه</a></p>`})}</div>`}

/* ---------- wiring ---------- */
const home=P.mods.home;if(home){const r0=home.render,m0=home.mount;home.render=r=>IC.ready()&&P.role().id!=='staff'?homeReal(r):r0.call(home,r);home.mount=(root,r)=>{if(IC.ready()&&P.role().id!=="staff"){homeMount(root,r)}else m0&&m0.call(home,root,r)};const b0=home.badge;home.badge=()=>IC.ready()?!homeFull()?0:tasks().filter(t=>t.tone==='danger').length:(b0?b0():0)}
const rep=P.mods.reports;for(const [id,v] of Object.entries({overview:{render:overviewReal},monthly:{render:monthlyReal,mount:monthlyMount}})){const t=rep?.tabs?.find(x=>x.id===id);if(!t)continue;const r0=t.render,m0=t.mount;t.render=r=>IC.ready()?v.render(r):P.note(`این صفحه <b>دادهٔ نمونه</b> است. برای دیدن دادهٔ واقعی، در «انبار ← داشبورد کنترل» به داده وصل شوید. <a href="#/inventory/control">اتصال</a>`,'database')+r0(r);t.mount=(root,r)=>{if(IC.ready()){v.mount&&v.mount(root,r)}else m0&&m0(root,r)}}
window.DashboardReal={months,tasks,supplierDebt,monthTrust,dayStatus,nightText,trust};
})();
