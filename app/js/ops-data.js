/* =========================================================
   Rayo in-venue apps prototype — ops-data.js
   Shared by pos.html (cashier), waiter.html (waiter phone) and kds.html (kitchen monitor).
   Static prototype: state lives in this browser's localStorage ('rayo_ops_proto') and is
   synced live between open tabs (BroadcastChannel), so an order sent from the waiter tab
   appears on the cashier and kitchen tabs. It never touches the live Rayo data or API.
   ========================================================= */
(function(){
'use strict';
const KEY='rayo_ops_proto',VER=5;
const FA='۰۱۲۳۴۵۶۷۸۹';
const O={};
O.fa=s=>String(s).replace(/\d/g,d=>FA[d]);
O.t=v=>RT.n(v);
O.T=v=>RT.n(v)+' <small class="muted">تومان</small>';
O.esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
O.ic=(n,cls='')=>`<i data-lucide="${n}" class="${cls}"></i>`;
O.b=(t,tone='neutral')=>`<span class="badge badge-${tone}">${t}</span>`;
O.now=()=>Date.now();
O.min=ts=>Math.max(0,Math.floor((Date.now()-ts)/60000));
O.dur=ts=>{const m=O.min(ts);return m<60?O.fa(m)+' دقیقه':O.fa(Math.floor(m/60))+':'+O.fa(String(m%60).padStart(2,'0'))+' ساعت'};
O.clock=ts=>new Intl.DateTimeFormat('fa-IR',{hour:'2-digit',minute:'2-digit'}).format(ts);
O.en=s=>String(s).replace(/[۰-۹]/g,d=>FA.indexOf(d));
O.int=s=>+O.en(s).replace(/\D/g,'')||0;
O.uid=p=>p+Math.random().toString(36).slice(2,8);

/* ---------- reference data (in the real system: from the central server) ---------- */
/* sections & printers: every menu category is routed to one station; a station prints on its own printer
   and/or shows on a kitchen monitor (KDS). The cashier printer prints bills and receipts. */
O.STATIONS=[
  {id:'kitchen',name:'آشپزخانه',icon:'chef-hat',printer:'چاپگر آشپزخانه',addr:'192.168.1.31',paper:80,print:true,kds:true,copies:1},
  {id:'bar',name:'بار قهوه',icon:'coffee',printer:'چاپگر بار',addr:'192.168.1.32',paper:80,print:true,kds:false,copies:1},
  {id:'cold',name:'بار سرد و دسر',icon:'cup-soda',printer:'چاپگر بار',addr:'192.168.1.32',paper:80,print:true,kds:false,copies:1},
  {id:'cashier',name:'صندوق',icon:'receipt',printer:'چاپگر صندوق',addr:'USB',paper:80,print:true,kds:false,copies:1,bill:true}
];
O.ROUTE={'قهوه':'bar','نوشیدنی گرم':'bar','نوشیدنی سرد':'cold','نوشیدنی آماده':'cold','دسر':'cold','پیش‌غذا':'kitchen','غذا':'kitchen','صبحانه':'kitchen'};
O.AREAS=[{id:'hall',name:'سالن'},{id:'terrace',name:'تراس'},{id:'vip',name:'اتاق VIP'}];
O.TABLES=[
  ...[1,2,3,4,5,6,7,8,9,10].map(n=>({id:'t'+n,no:n,area:'hall',seats:n<=4?2:n<=8?4:6})),
  ...[11,12,13,14,15,16].map(n=>({id:'t'+n,no:n,area:'terrace',seats:4})),
  {id:'t21',no:21,area:'vip',seats:8},{id:'t22',no:22,area:'vip',seats:10}
];
O.WAITERS=['s6','s7','s8'];          // hall staff who use the waiter app
O.NOTES={kitchen:['تند','بدون پیاز','بدون سس','سس جدا','کم‌نمک','خوب پخته','بدون گلوتن'],
  bar:['کم‌شکر','بدون شکر','شیر گیاهی','شیر کم‌چرب','داغ‌تر','دبل شات','لیوان بزرگ'],
  cold:['بدون یخ','یخ کم','کم‌شیرین','برای بیرون‌بر']};
O.VOID_REASONS=['مشتری منصرف شد','اشتباه ثبت','دیر آماده شد','ایراد کیفیت','تکراری'];
/* order types: dine = at a table; counter = ordered and eaten at the counter (حضوری, no table); take = takeaway;
   delivery = our courier; snapp = SnappFood; staff = a staff member's own order (charged to their personnel account) */
O.TYPES={dine:['سالن','armchair'],counter:['حضوری','store'],take:['بیرون‌بر','shopping-bag'],delivery:['پیک','bike'],snapp:['اسنپ‌فود','smartphone'],staff:['پرسنلی','id-card']};
/* paid modifiers (change price and later the recipe) — separate from free-text notes */
O.MODS={bar:[{g:'اندازه',one:1,opts:[['معمولی',0],['بزرگ',40000]]},{g:'شیر',one:1,opts:[['معمولی',0],['گیاهی',35000],['بدون لاکتوز',25000]]},{g:'افزودنی',opts:[['شات اضافه',45000],['سیروپ',30000]]}],
  cold:[{g:'اندازه',one:1,opts:[['معمولی',0],['بزرگ',50000]]}],
  kitchen:[{g:'افزودنی',opts:[['پنیر اضافه',60000],['سس اضافه',25000],['نان اضافه',30000]]}]};
/* price lists (Sepidz: several prices per item) — applied when an item is added; snapshot on the line */
O.PRICE_LISTS={normal:['عادی',1],staff:['پرسنلی',0.7],org:['سازمانی',0.9]};
/* payment methods. credit = customer owes it (debt ledger); club = paid from the customer's prepaid club credit;
   staff = charged to the staff member's account (only on staff orders, settled with payroll) */
O.PAY={cash:['نقد','banknote'],card:['کارتخوان','credit-card'],transfer:['کارت به کارت','arrow-left-right'],credit:['نسیه (بدهی مشتری)','notebook-pen'],club:['اعتبار باشگاه','gift'],staff:['حساب پرسنل','id-card']};
/* fields that can appear on the printed bill (owner chooses in settings) — modelled on Toast / Square receipt setup */
O.BILL_FIELDS=[['name','نام مجموعه'],['address','نشانی مجموعه'],['phone','تلفن مجموعه'],['date','تاریخ'],['time','ساعت'],['orderNo','شمارهٔ سفارش'],
  ['table','میز و نفرات'],['waiter','نام ویتر / صندوقدار'],['customer','نام مشتری'],['custPhone','تلفن مشتری'],['custAddr','نشانی مشتری (پیک)'],
  ['club','اعتبار و تخفیف باشگاه'],['notes','توضیح آیتم‌ها'],['perGuest','سهم هر نفر'],['wifi','رمز Wi-Fi'],['footer','پیام پایین']];

/* menu: live items from the panel's menu (D.MENU) + a few extra sample items; inactive items are not sold */
const EXTRA=[
  ['x1','اسپرسو','قهوه',150000],['x2','چای ماسالا','نوشیدنی گرم',190000],['x3','لیموناد','نوشیدنی سرد',210000],
  ['x4','آیس لاته','نوشیدنی سرد',265000],['x5','چیزکیک','دسر',240000],['x6','براونی','دسر',180000],
  ['x7','سالاد سزار','پیش‌غذا',380000],['x8','برگر رایو','غذا',560000],['x9','پیتزا مارگاریتا','غذا',590000],
  ['x10','املت','صبحانه',260000],['x11','صبحانه کامل','صبحانه',420000],['x12','نان سیر','پیش‌غذا',170000]
];
O.MENU0=null;O.MENU=[...(window.D?D.MENU.filter(m=>m.active).map(m=>({id:m.id,name:m.name,cat:m.cat,price:m.price})):[]),
  ...EXTRA.map(([id,name,cat,price])=>({id,name,cat,price}))].map(m=>({...m,station:O.ROUTE[m.cat]||'kitchen'}));
O.CATS=[...new Set(O.MENU.map(m=>m.cat))];
O.mi=id=>O.MENU.find(m=>m.id===id)||{name:'؟',price:0,station:'kitchen'};
O.st=id=>O.STATIONS.find(s=>s.id===id)||O.STATIONS[0];
O.staff=id=>(window.D&&D.STAFF.find(s=>s.id===id))||{name:'—',role:''};
O.table=id=>O.TABLES.find(t=>t.id===id);

/* customers (in the real system: one customer file shared by all branches) */
/* club: pct = standing club discount; credit = prepaid club credit (toman). Debt is NOT stored here — it is the sum of S.ledger */
const CUSTOMERS=[
  {id:'c1',name:'آقای کامرانی',phone:'09121234567',visits:23,last:'1405/08/11',spend:14800000,note:'لاته با شیر گیاهی؛ میز کنار پنجره',tags:['دائمی'],pct:10,credit:350000},
  {id:'c2',name:'خانم توکلی',phone:'09351112233',visits:7,last:'1405/08/02',spend:3900000,note:'حساسیت به گردو',tags:['حساسیت'],pct:5,credit:0},
  {id:'c3',name:'شرکت آرین (ناهار)',phone:'02188776655',visits:41,last:'1405/08/14',spend:52600000,note:'فاکتور رسمی می‌خواهد',tags:['سازمانی','نسیه'],pct:0,credit:0},
  {id:'c4',name:'نگار شریفی',phone:'09129998877',visits:3,last:'1405/07/20',spend:1250000,note:'',tags:[],pct:0,credit:0},
  {id:'c5',name:'آقای نادری',phone:'09367776655',visits:12,last:'1405/08/20',spend:6100000,note:'',tags:['بیرون‌بر'],pct:5,credit:120000}
];

/* ---------- sample state (built only when this browser has no prototype state yet) ---------- */
function sample(){
  const n=Date.now(),ago=m=>n-m*60000;let seq=100;
  const it=(mid,qty,st,sentM,extra)=>{const m=O.mi(mid);return{uid:O.uid('i'),mid,name:m.name,price:m.price,qty,station:m.station,
    status:st,note:'',round:1,sentAt:sentM!=null?ago(sentM):null,readyAt:st==='ready'||st==='served'?ago(Math.max(0,(sentM||0)-9)):null,by:'s7',...extra}};
  const ord=(o,items)=>({id:O.uid('o'),no:++seq,type:'dine',guests:2,waiter:'s7',customer:null,status:'open',discount:null,payments:[],log:[],items,...o});
  const orders=[
    ord({table:'t2',guests:2,openedAt:ago(48),waiter:'s7'},[it('m1',2,'served',44),it('x5',1,'served',40),it('m2',1,'sent',6,{round:2,note:'داغ‌تر'})]),
    ord({table:'t5',guests:4,openedAt:ago(26),waiter:'s8',customer:'c2'},[it('m5',2,'sent',21,{note:'بدون گردو — حساسیت'}),it('m6',1,'ready',21),it('m9',4,'served',22),it('x7',1,'sent',21)]),
    ord({table:'t7',guests:3,openedAt:ago(12),waiter:'s6'},[it('m3',2,'ready',9),it('x2',1,'sent',9)]),
    ord({table:'t9',guests:5,openedAt:ago(73),waiter:'s7',status:'bill',customer:'c1'},[it('m1',3,'served',70,{note:'شیر گیاهی'}),it('x8',2,'served',62),it('m6',2,'served',62),it('x3',2,'served',66)]),
    ord({table:'t12',guests:2,openedAt:ago(3),waiter:'s8'},[it('x11',2,'new',null),it('x2',2,'new',null)]),
    ord({table:'t21',guests:8,openedAt:ago(135),waiter:'s6',customer:'c3'},[it('x8',4,'sent',28),it('m7',3,'sent',28),it('x7',2,'ready',28),it('m9',8,'served',30),it('x12',2,'sent',28)]),
    ord({table:'t3',guests:2,openedAt:ago(14),waiter:'s7'},[]),
    ord({type:'take',table:null,guests:0,openedAt:ago(8),waiter:'s1',customer:'c5'},[it('m4',2,'sent',7),it('x6',2,'ready',7)]),
    ord({type:'counter',table:null,guests:0,openedAt:ago(5),waiter:'s1',customer:null},[it('m2',1,'sent',4),it('x10',1,'sent',4)]),
    ord({type:'delivery',table:null,guests:0,openedAt:ago(17),waiter:'s1',customer:'c4',address:'سعادت‌آباد، خیابان سرو، پلاک ۱۲',courier:'s9',dispatch:{status:'prep'}},[it('m5',1,'sent',15),it('m6',1,'sent',15),it('m5',1,'sent',12)])
  ];
  /* a few orders already settled today, so the «سفارش‌های امروز», courier and staff lists are not empty */
  const done=(o,items,method,closedM)=>{const x=ord(o,items);x.status='paid';x.closedAt=ago(closedM);x.closedBy='s1';
    if(x.priceList==='staff')x.items.forEach(i=>i.price=Math.round(i.price*O.PRICE_LISTS.staff[1]/1000)*1000);
    x.payments=[{method,amount:x.items.reduce((a,i)=>a+i.price*i.qty,0),at:ago(closedM),by:'s1'}];return x};
  const closed=[
    done({type:'delivery',openedAt:ago(190),waiter:'s1',customer:'c1',address:'ونک، خیابان ملاصدرا، پلاک ۸',courier:'s9',dispatch:{status:'done',outAt:ago(170),backAt:ago(150)}},[it('x8',2,'served',185),it('m9',2,'served',185)],'cash',150),
    done({type:'delivery',openedAt:ago(120),waiter:'s1',customer:'c5',address:'یوسف‌آباد، کوچهٔ ۱۴، پلاک ۳',courier:'s9',dispatch:{status:'done',outAt:ago(100),backAt:ago(80)}},[it('m5',1,'served',115),it('m6',1,'served',115)],'card',80),
    done({type:'take',openedAt:ago(95),waiter:'s1',customer:'c5'},[it('m1',2,'served',93)],'card',88),
    done({type:'counter',openedAt:ago(70),waiter:'s1'},[it('x10',1,'served',68),it('m2',1,'served',68)],'cash',50),
    done({type:'staff',openedAt:ago(60),waiter:'s1',staffOf:'s4',priceList:'staff'},[it('m7',1,'served',58)],'staff',45),
    done({table:'t4',guests:2,openedAt:ago(150),waiter:'s7',customer:'c3'},[it('x8',2,'served',145),it('x3',2,'served',145)],'credit',40)
  ];
  const debtOrder=closed[5];
  return{ver:VER,seq,orders,closed,requests:[
      {id:O.uid('r'),kind:'void',order:orders[0].id,item:orders[0].items[2].uid,qty:1,reason:'مشتری منصرف شد',by:'s7',at:ago(2),status:'pending'}],
    prints:[],customers:CUSTOMERS.map(c=>({...c})),out:{x9:true},
    /* customer debt ledger: +amount = customer owes (نسیه), −amount = customer paid back. Debt = sum per customer */
    ledger:[{id:O.uid('l'),cust:'c3',amount:4200000,at:ago(60*24*9),note:'ماندهٔ ماه قبل',by:'s1'},
      {id:O.uid('l'),cust:'c3',amount:-2000000,at:ago(60*24*3),note:'واریز کارت به کارت',by:'s1'},
      {id:O.uid('l'),cust:'c3',amount:debtOrder.payments[0].amount,at:debtOrder.closedAt,order:debtOrder.id,note:'نسیهٔ میز ۴',by:'s1'}],
    delays:{},                    // cook announcements: {mid:{min,at,by}} — shown to waiter and cashier for 60 minutes
    kdsPri:{},                    // head chef's manual ticket order on the kitchen monitor: {ticketKey:rank}
    shift:{cashier:'s1',openedAt:n-5*3600000,float:2000000,moves:[{kind:'out',amount:350000,reason:'خرید نان (فوری)',at:n-2*3600000,by:'s1'}],closed:null},
    calls:[{phone:'09121234567'},{phone:'09129998877'},{phone:'09190001122'}],reserved:{t15:{name:'خانم رحیمی',at:'۲۰:۳۰',guests:4}},
    settings:{service:0,vat:0,voidNeedsManager:true,autoPrint:true,billFooter:'از انتخاب شما سپاسگزاریم — رایو کافه',
      longStayMin:120,          // table open longer than this → «بیش از ۲ ساعت» flag for the waiter
      noOrderMin:10,            // seated without a sent order longer than this → flag
      targets:{kitchen:15,bar:5,cold:6},   // minutes; an item still cooking after this → «پیگیری» for the waiter
      batch:3,                  // how many of the same dish the kitchen makes at once (queue estimate)
      venue:{name:'رایو کافه',address:'نشانی مجموعه را در تنظیمات وارد کنید',phone:'۰۲۱-۰۰۰۰۰۰۰۰',wifi:'rayo-guest'},
      bill:{name:1,address:1,phone:1,date:1,time:1,orderNo:1,table:1,waiter:1,customer:1,custPhone:0,custAddr:1,club:1,notes:0,perGuest:0,wifi:0,footer:1},
      /* what each waiter may do from the phone (in the real system: from «کاربران و دسترسی») */
      waiterPerms:{s6:{bill:1,settle:1,discount:1},s7:{bill:1,settle:1,discount:0},s8:{bill:1,settle:0,discount:0}}},
    stations:O.STATIONS.map(s=>({...s}))};
}

/* ---------- store: load / save / live sync ---------- */
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||S.ver!==VER)S=sample();
const applyRoute=()=>O.MENU.forEach(m=>m.station=(S.route&&S.route[m.cat])||O.ROUTE[m.cat]||'kitchen');applyRoute();
O.setRoute=(cat,st)=>{S.route=S.route||{};S.route[cat]=st;applyRoute();O.save()};
O.S=()=>S;
const bc='BroadcastChannel'in window?new BroadcastChannel(KEY):null;
const subs=[];
O.on=fn=>subs.push(fn);
O.save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}bc&&bc.postMessage('x');subs.forEach(f=>f('local'))};
const reload=()=>{try{const x=JSON.parse(localStorage.getItem(KEY));if(x)S=x}catch(e){}applyRoute();subs.forEach(f=>f('remote'))};
bc&&(bc.onmessage=reload);
window.addEventListener('storage',e=>{if(e.key===KEY)reload()});
O.reset=()=>{S=sample();applyRoute();O.save()};
O.stations=()=>S.stations;

/* ---------- business rules (single place) ---------- */
O.isOut=mid=>!!S.out[mid];
O.unit=(o,m)=>Math.round(m.price*(O.PRICE_LISTS[o.priceList||'normal'][1])/1000)*1000;
O.modTxt=i=>(i.mods||[]).map(x=>x[0]).join('، ');
O.order=id=>S.orders.find(o=>o.id===id);
O.atTable=tid=>S.orders.find(o=>o.table===tid&&(o.status==='open'||o.status==='bill'));
O.cust=id=>S.customers.find(c=>c.id===id);
O.live=o=>o.items.filter(i=>i.status!=='void');
O.sub=o=>O.live(o).reduce((a,i)=>a+i.price*i.qty,0);
O.disc=o=>!o.discount?0:o.discount.kind==='pct'?Math.round(O.sub(o)*o.discount.value/100/1000)*1000:Math.min(o.discount.value,O.sub(o));
O.total=o=>{const b=O.sub(o)-O.disc(o),st=S.settings;return b+Math.round(b*(st.service+st.vat)/100/1000)*1000};
O.paid=o=>o.payments.reduce((a,p)=>a+p.amount,0);
O.due=o=>O.total(o)-O.paid(o);
/* table status, derived from its order — never stored separately */
O.TSTATE={free:['آزاد','neutral'],reserved:['رزرو','info'],seated:['نشسته — بدون سفارش','info'],cooking:['در حال آماده‌سازی','warning'],ready:['آماده سرو','success'],eating:['سرو شده','accent'],bill:['صورتحساب خواسته','danger']};
O.tstate=t=>{const o=O.atTable(t.id);if(!o)return S.reserved[t.id]?'reserved':'free';if(o.status==='bill')return'bill';
  const L=O.live(o);if(L.some(i=>i.status==='ready'))return'ready';if(L.some(i=>i.status==='sent'))return'cooking';
  if(L.some(i=>i.status==='served'))return'eating';return'seated'};
O.label=o=>o.table?'میز '+O.fa(O.table(o.table).no):O.TYPES[o.type][0]+' #'+O.fa(o.no);
O.log=(o,text,by)=>o.log.unshift({at:Date.now(),text,by});

/* send new items: one ticket per station → printer and/or kitchen monitor */
O.send=(o,by,fire)=>{const fresh=o.items.filter(i=>i.status==='new'&&(fire||!i.hold));fresh.forEach(i=>{if(i.hold){i.hold=false;i.fired=true}});if(!fresh.length)return 0;
  const round=Math.max(0,...o.items.filter(i=>i.sentAt).map(i=>i.round||1))+1,n=Date.now();
  fresh.forEach(i=>{i.status='sent';i.sentAt=n;i.round=round});
  const by_st={};fresh.forEach(i=>(by_st[i.station]=by_st[i.station]||[]).push(i));
  Object.entries(by_st).forEach(([st,items])=>O.ticket(o,st,items.map(i=>({name:i.name,qty:i.qty,note:[O.modTxt(i),i.note].filter(Boolean).join(' · ')})),fire?'اجرای نگه‌داشته':'سفارش',by));
  O.log(o,`ارسال ${O.fa(fresh.length)} قلم (نوبت ${O.fa(round)})`,by);return fresh.length};
O.ticket=(o,st,lines,kind,by)=>{const s=S.stations.find(x=>x.id===st);
  S.prints.unshift({id:O.uid('p'),at:Date.now(),station:st,printer:s.print?s.printer:'—',kds:s.kds,kind,order:o.id,label:O.label(o),waiter:o.waiter,lines,by})};
/* void a sent item: needs a reason; the station gets a «ابطال» ticket. Unsent items are simply removed. */
O.voidItem=(o,uid,qty,reason,by)=>{const i=o.items.find(x=>x.uid===uid);if(!i)return;
  if(i.status==='new'){o.items=o.items.filter(x=>x!==i);return}
  qty=Math.min(qty||i.qty,i.qty);
  if(qty<i.qty){i.qty-=qty;o.items.push({...i,uid:O.uid('i'),qty,status:'void',voidReason:reason,voidBy:by,voidAt:Date.now()})}
  else Object.assign(i,{status:'void',voidReason:reason,voidBy:by,voidAt:Date.now()});
  O.ticket(o,i.station,[{name:i.name,qty,note:'ابطال: '+reason}],'ابطال',by);
  O.log(o,`ابطال ${O.fa(qty)} × ${i.name} — ${reason}`,by);if(o.status==='bill')O.flag(o,'ابطال بعد از پیش‌فاکتور')};
O.flag=(o,t)=>{(o.flags=o.flags||[]).push({t,at:Date.now()})};
O.closeOrder=(o,by)=>{o.status='paid';o.closedAt=Date.now();o.closedBy=by;S.orders=S.orders.filter(x=>x!==o);S.closed.unshift(o)};
O.newOrder=x=>{S.seq++;const o={id:O.uid('o'),no:S.seq,type:'dine',guests:2,waiter:null,customer:null,status:'open',discount:null,payments:[],log:[],items:[],openedAt:Date.now(),...x};
  if(o.table)delete S.reserved[o.table];S.orders.push(o);return o};
O.addItem=(o,mid,note,by,mods,hold,qty)=>{const m=O.mi(mid);mods=mods||[];const key=JSON.stringify(mods);
  const same=o.items.find(i=>i.mid===mid&&i.status==='new'&&(i.note||'')===(note||'')&&JSON.stringify(i.mods||[])===key&&!!i.hold===!!hold);
  if(o.status==='bill')O.flag(o,'افزودن بعد از پیش‌فاکتور');
  if(same)same.qty+=qty||1;else o.items.push({uid:O.uid('i'),mid,name:m.name,price:O.unit(o,m)+mods.reduce((a,x)=>a+x[1],0),qty:qty||1,station:m.station,status:'new',note:note||'',mods,hold:!!hold,by})};

/* ---------- follow-up rules (waiter / cashier alerts) ---------- */
O.set=()=>S.settings;
O.target=st=>(S.settings.targets||{})[st]||10;
/* items still cooking past their station's target time → the waiter should follow up */
O.late=o=>O.live(o).filter(i=>i.status==='sent'&&i.sentAt&&O.min(i.sentAt)>=O.target(i.station));
/* table open longer than the setting (default 120 min) */
O.longStay=o=>!!o.table&&O.min(o.openedAt)>=(S.settings.longStayMin||120);
/* seated but nothing sent to the kitchen yet */
O.noOrder=o=>!!o.table&&!O.live(o).some(i=>i.status!=='new');
O.noOrderLong=o=>O.noOrder(o)&&O.min(o.openedAt)>=(S.settings.noOrderMin||10);

/* ---------- kitchen queue: how many of each dish are waiting, and the estimated wait for one more ---------- */
O.delay=mid=>{const d=(S.delays||{})[mid];return d&&Date.now()-d.at<3600000?d:null};
O.queue=()=>{const q={};S.orders.forEach(o=>O.live(o).forEach(i=>{if(i.status!=='sent')return;
  const x=q[i.mid]||(q[i.mid]={mid:i.mid,name:i.name,station:i.station,qty:0,oldest:i.sentAt,tables:[]});x.qty+=i.qty;x.oldest=Math.min(x.oldest,i.sentAt);x.tables.push(O.label(o))}));return q};
/* estimate: the kitchen makes `batch` of the same dish at once, each batch takes the station target time.
   A dish with qty in queue ≥ batch means a new one waits for the earlier batches. A cook's announcement overrides upward. */
O.wait=(mid,Q)=>{Q=Q||O.queue();const x=Q[mid],m=O.mi(mid),b=m.batch||S.settings.batch||3,prep=m.prep||O.target(m.station),d=O.delay(mid);
  const qty=x?x.qty:0,est=prep*(Math.floor(qty/b)+1);return{qty,est:Math.max(est,d?d.min:0),busy:qty>=b||!!d,delay:d}};
O.waitTxt=w=>w.busy?`${O.fa(w.qty)} در صف · حدود ${O.fa(w.est)} دقیقه${w.delay?' (اعلام آشپزخانه)':''}`:'';

/* ---------- customers: club, credit, debt ---------- */
O.findPhone=ph=>{ph=O.en(ph||'').replace(/\D/g,'');return ph.length>=4?S.customers.find(c=>c.phone===ph)||S.customers.find(c=>c.phone.endsWith(ph)):null};
O.newCust=(ph,name)=>{const c={id:O.uid('c'),name:name||'مشتری '+O.fa(ph.slice(-4)),phone:ph,visits:0,last:'—',spend:0,note:'',tags:['جدید'],pct:0,credit:0};S.customers.push(c);return c};
O.debt=cid=>(S.ledger||[]).filter(l=>l.cust===cid).reduce((a,l)=>a+l.amount,0);
O.custOrders=cid=>[...S.orders,...S.closed].filter(o=>o.customer===cid);
O.applyClub=(o,by)=>{const c=o.customer&&O.cust(o.customer);if(!c||!c.pct)return false;o.discount={kind:'pct',value:c.pct,reason:'باشگاه مشتریان'};O.log(o,`تخفیف باشگاه ${O.fa(c.pct)}٪`,by);return true};

/* ---------- payment (shared by cashier and waiter) ---------- */
/* rows: [{method,amount}] (amount < 0 = refund). Returns {ok,msg,closed} */
O.pay=(o,rows,by,opt={})=>{rows=rows.filter(r=>r.amount);const c=o.customer&&O.cust(o.customer);
  if(!rows.length)return{ok:false,msg:'مبلغی وارد نشده'};
  if(rows.some(r=>r.method==='credit')&&!c)return{ok:false,msg:'برای نسیه، مشتری را مشخص کنید'};
  if(rows.some(r=>r.method==='staff')&&o.type!=='staff')return{ok:false,msg:'«حساب پرسنل» فقط برای سفارش پرسنلی است'};
  const club=rows.filter(r=>r.method==='club').reduce((a,r)=>a+r.amount,0);
  if(club&&(!c||club>(c.credit||0)))return{ok:false,msg:'اعتبار باشگاه کافی نیست'};
  rows.forEach(r=>o.payments.push({method:r.method,amount:r.amount,at:Date.now(),by,items:opt.items||null,refund:r.amount<0||undefined}));
  if(club)c.credit-=club;
  rows.filter(r=>r.method==='credit').forEach(r=>S.ledger.push({id:O.uid('l'),cust:c.id,amount:r.amount,at:Date.now(),order:o.id,note:(r.amount<0?'برگشت نسیهٔ ':'نسیهٔ ')+O.label(o),by}));
  if(opt.items)o.items.forEach(i=>{if(opt.items.includes(i.uid))i.paid=true});
  O.log(o,(rows.some(r=>r.amount<0)?'بازپرداخت ':'پرداخت ')+rows.map(r=>O.PAY[r.method][0]+' '+O.t(Math.abs(r.amount))).join(' + '),by);
  if(O.due(o)===0&&!o.items.some(i=>i.status==='new')){O.finish(o,by);return{ok:true,closed:true}}
  return{ok:true,closed:false}};
/* close a fully paid order: update the customer file, print the receipt */
O.finish=(o,by)=>{const c=o.customer&&O.cust(o.customer);
  if(c&&!o.reopened){c.visits++;c.spend+=O.total(o);c.last=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(Date.now())}
  O.printBill(o,o.reopened?'اصلاحیه':'رسید',by,true);O.closeOrder(o,by)};

/* ---------- reopen a settled order (customer found a mistake after paying) ---------- */
O.reopen=(o,by,reason)=>{if(o.status!=='paid')return false;S.closed=S.closed.filter(x=>x!==o);
  o.status='open';o.reopened={at:Date.now(),by,reason,before:O.total(o)};o.closedAt=null;S.orders.push(o);
  O.flag(o,'اصلاح بعد از تسویه: '+reason);O.log(o,'بازگشایی بعد از تسویه — '+reason,by);return true};
/* items added to a reopened order were already served: record them without a kitchen ticket */
O.recordServed=(o,by)=>{const L=o.items.filter(i=>i.status==='new');L.forEach(i=>{i.status='served';i.sentAt=Date.now();i.round=99;i.late=true});
  if(L.length)O.log(o,`ثبت ${O.fa(L.length)} قلم سرو‌شده بدون ارسال (اصلاح)`,by);return L.length};

/* ---------- printed bill: fields chosen by the manager (settings.bill) ---------- */
O.billHtml=(o,kind)=>{const st=S.settings,f=st.bill||{},v=st.venue||{},c=o.customer&&O.cust(o.customer),d=new Date(),L=O.live(o);
  const dt=new Intl.DateTimeFormat('fa-IR-u-ca-persian',{year:'numeric',month:'2-digit',day:'2-digit'}).format(d);
  const row=(a,b,bold)=>`<div class="tl">${bold?`<b>${a}</b><b>${b}</b>`:`<span>${a}</span><span>${b}</span>`}</div>`;
  const pre=kind==='پیش‌فاکتور';
  return`<div class="ticket bill">${f.name?`<h4>${O.esc(v.name||'')}</h4>`:''}${f.address&&v.address?`<div class="tc small">${O.esc(v.address)}</div>`:''}${f.phone&&v.phone?`<div class="tc small">تلفن: ${O.esc(v.phone)}</div>`:''}
    <div class="tc kind">${pre?'صورتحساب — پیش از پرداخت':kind}</div><hr>
    ${f.orderNo?row(O.TYPES[o.type][0],'#'+O.fa(o.no)):''}${f.table&&o.table?row('میز '+O.fa(O.table(o.table).no),O.fa(o.guests)+' نفر'):''}
    ${f.date||f.time?row(f.date?dt:'',f.time?O.clock(d):''):''}${f.waiter?row(o.type==='dine'?'ویتر':'صندوقدار',O.staff(o.waiter).name):''}
    ${o.staffOf?row('پرسنل',O.staff(o.staffOf).name):''}
    ${c&&f.customer?row('مشتری',O.esc(c.name)):''}${c&&f.custPhone?row('تلفن',O.fa(c.phone)):''}${f.custAddr&&o.address?`<div class="tn">${O.esc(o.address)}</div>`:''}<hr>
    ${L.map(i=>`<div class="tl"><span>${O.fa(i.qty)} × ${i.name}</span><span>${O.t(i.price*i.qty)}</span></div>${f.notes&&(i.note||(i.mods||[]).length)?`<div class="tn">${O.esc([O.modTxt(i),i.note].filter(Boolean).join(' · '))}</div>`:''}`).join('')}<hr>
    ${row('جمع',O.t(O.sub(o)))}${o.discount?row('تخفیف ('+O.esc(o.discount.reason)+')','−'+O.t(O.disc(o))):''}
    ${st.service+st.vat?row('سرویس و مالیات',O.t(O.total(o)-O.sub(o)+O.disc(o))):''}
    ${O.paid(o)&&pre?row('پرداخت‌شده',O.t(O.paid(o))):''}${row(pre?'قابل پرداخت':'جمع کل',O.t(pre?O.due(o):O.total(o)),true)}
    ${!pre?o.payments.map(p=>row(O.PAY[p.method][0]+(p.refund?' (برگشت)':''),O.t(p.amount))).join(''):''}
    ${o.reopened&&!pre?row('مبلغ قبل از اصلاح',O.t(o.reopened.before)):''}
    ${f.perGuest&&o.guests>1&&pre?row('سهم هر نفر',O.t(Math.ceil(O.due(o)/o.guests/1000)*1000)):''}
    ${f.club&&c&&(c.credit||c.pct)?`<hr><div class="tc small">باشگاه: ${c.pct?O.fa(c.pct)+'٪ تخفیف':''}${c.pct&&c.credit?' · ':''}${c.credit?'اعتبار '+O.t(c.credit):''}</div>`:''}
    ${f.wifi&&v.wifi?`<div class="tc small">Wi-Fi: ${O.esc(v.wifi)}</div>`:''}${f.footer&&st.billFooter?`<hr><div class="tc">${O.esc(st.billFooter)}</div>`:''}</div>`};
/* record the print (print log) and send it to the browser printer */
O.printBill=(o,kind,by,silent)=>{const html=O.billHtml(o,kind);
  S.prints.unshift({id:O.uid('p'),at:Date.now(),station:'cashier',printer:'چاپگر صندوق',kind,order:o.id,label:O.label(o),waiter:o.waiter,lines:[],html,by});
  if(!silent)O.printDoc(html);return html};
O.printDoc=html=>{let a=document.getElementById('printArea');if(!a){a=document.createElement('div');a.id='printArea';document.body.appendChild(a)}
  a.innerHTML=html;try{window.print()}catch(e){}};

/* ---------- shared UI (modal, form, toast) — host: <div class="modal-backdrop" id="opModal"><div class="modal"></div></div> ---------- */
O.modal=({title,body,foot,size='',onMount})=>{
  const host=document.getElementById('opModal'),m=host.querySelector('.modal');m.className='modal '+size;
  m.innerHTML=`<div class="modal-head"><h2>${title}</h2><button class="btn btn-ghost btn-sm btn-icon" data-close aria-label="بستن">${O.ic('x')}</button></div>
    <div class="modal-body">${body}</div><div class="modal-foot">${foot||'<button class="btn btn-ghost" data-close>بستن</button>'}</div>`;
  host.classList.add('open');RT.icons();onMount&&onMount(m);return m};
O.close=()=>document.getElementById('opModal').classList.remove('open');
O.form=({title,body,ok='ثبت',tone='primary',size='',onOk,onMount})=>O.modal({title,size,body:`<form class="stack" style="gap:var(--s4)" onsubmit="return false">${body}</form>`,
  foot:`<button class="btn btn-ghost" data-close>انصراف</button><button class="btn btn-${tone}" data-ok>${O.ic('check')}${ok}</button>`,
  onMount:m=>{m.querySelector('[data-ok]').onclick=()=>{if(onOk(m.querySelector('form'))!==false){O.close();O.save()}};onMount&&onMount(m)}});
O.toast=(m,i)=>RT.toast(m,i);
O.note=(t,i='info',tone='info')=>`<div class="alert alert-${tone}">${O.ic(i)}<div>${t}</div></div>`;
O.chips=(name,list,multi)=>`<div class="chips">${list.map(x=>`<label class="chip-opt"><input type="${multi?'checkbox':'radio'}" name="${name}" value="${O.esc(x)}"><span>${x}</span></label>`).join('')}</div>`;
O.vals=(f,name)=>[...f.querySelectorAll(`[name="${name}"]:checked`)].map(x=>x.value);

window.O=O;
})();
