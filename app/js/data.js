/* =========================================================
   Rayo Panel prototype — data.js
   Sample data only (Toman). Not connected to the API or live JSON.
   Dates are Jalali strings YYYY/MM/DD. Today = 1405/08/15.
   ========================================================= */
(function(){
'use strict';

const TODAY='1405/08/15';
const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

/* ---------- Roles & permissions ----------
   level per module: full (ثبت + تأیید) | edit (ثبت) | view (فقط دیدن) | none */
const ROLES=[
  {id:'owner',name:'مالک',desc:'دسترسی کامل، تأیید نهایی و بستن ماه',icon:'crown'},
  {id:'manager',name:'مدیر داخلی',desc:'عملیات روزانه، پرسنل و تأیید ثبت‌ها',icon:'briefcase'},
  {id:'accountant',name:'حسابدار',desc:'فاکتور، پرداخت، صندوق و بستن ماه',icon:'calculator'},
  {id:'storekeeper',name:'انباردار',desc:'دریافت کالا، شمارش، ضایعات',icon:'package'},
  {id:'cashier',name:'صندوقدار',desc:'گزارش صندوق و ثبت هزینهٔ تنخواه',icon:'banknote'},
  {id:'staff',name:'پرسنل',desc:'کارکرد، فیش و درخواست‌های خودم',icon:'user'}
];
const PERM={
  owner:      {home:'full',finance:'full',inventory:'full',people:'full',menu:'full',customers:'full',reports:'full',settings:'full',plan:'view'},
  manager:    {home:'full',finance:'view',inventory:'full',people:'full',menu:'full',customers:'full',reports:'view',settings:'none',plan:'view'},
  accountant: {home:'full',finance:'full',inventory:'view',people:'edit',menu:'view',customers:'view',reports:'view',settings:'none',plan:'none'},
  storekeeper:{home:'full',finance:'none',inventory:'edit',people:'none',menu:'view',customers:'none',reports:'none',settings:'none',plan:'none'},
  cashier:    {home:'full',finance:'edit',inventory:'none',people:'none',menu:'none',customers:'edit',reports:'none',settings:'none',plan:'none'},
  staff:      {home:'full',finance:'none',inventory:'none',people:'none',menu:'none',customers:'none',reports:'none',settings:'none',plan:'none'}
};
/* tabs hidden per role (anything not listed is visible when the module is visible) */
const TAB_ALLOW={
  cashier:{finance:['cash','docs','petty']},
  storekeeper:{inventory:['stock','receipt','waste','count','beverage','reorder','catalog']},
  accountant:{people:['payroll','tips','staff','reports']}
};

/* ---------- Staff ---------- */
const STAFF=[
  {id:'s1',name:'سارا محمدی',role:'صندوقدار',section:'سالن',contract:'ساعتی',rate:95000,start:'1403/02/10',phone:'۰۹۱۲۰۰۰۰۰۰۱',insured:true,shift:'عصر'},
  {id:'s2',name:'علی رضایی',role:'باریستای ارشد',section:'بار',contract:'ماهانه',rate:34000000,start:'1401/09/01',phone:'۰۹۱۲۰۰۰۰۰۰۲',insured:true,shift:'صبح'},
  {id:'s3',name:'نیما کریمی',role:'سرآشپز',section:'آشپزخانه',contract:'ماهانه',rate:42000000,start:'1400/05/15',phone:'۰۹۱۲۰۰۰۰۰۰۳',insured:true,shift:'عصر'},
  {id:'s4',name:'مریم احمدی',role:'باریستا',section:'بار',contract:'ساعتی',rate:90000,start:'1404/01/20',phone:'۰۹۱۲۰۰۰۰۰۰۴',insured:true,shift:'عصر'},
  {id:'s5',name:'رضا حسینی',role:'کمک آشپز',section:'آشپزخانه',contract:'ساعتی',rate:85000,start:'1404/06/01',phone:'۰۹۱۲۰۰۰۰۰۰۵',insured:false,shift:'صبح'},
  {id:'s6',name:'زهرا نوری',role:'سرپرست سالن',section:'سالن',contract:'ماهانه',rate:30000000,start:'1402/03/12',phone:'۰۹۱۲۰۰۰۰۰۰۶',insured:true,shift:'صبح'},
  {id:'s7',name:'حمید صادقی',role:'گارسون',section:'سالن',contract:'ساعتی',rate:80000,start:'1404/11/05',phone:'۰۹۱۲۰۰۰۰۰۰۷',insured:false,shift:'عصر'},
  {id:'s9',name:'مجید طاهری',role:'پیک',section:'پیک',contract:'ساعتی',rate:75000,start:'1405/03/10',phone:'۰۹۱۲۰۰۰۰۰۰۹',insured:false,shift:'عصر'},
  {id:'s8',name:'الهام رستمی',role:'گارسون (پاره‌وقت)',section:'سالن',contract:'ساعتی',rate:80000,start:'1405/04/01',phone:'۰۹۱۲۰۰۰۰۰۰۸',insured:false,shift:'آخر هفته'}
];

/* payroll of current month (آبان) — draft; deductions are positive numbers */
const PAYROLL=[
  {sid:'s1',hours:176,ot:12,base:16720000,otPay:1710000,bonus:0,ins:1340000,tax:0,adv:0,fine:0,meal:420000,damage:0,paid:0},
  {sid:'s2',hours:192,ot:8,base:34000000,otPay:2180000,bonus:2000000,ins:2380000,tax:610000,adv:5000000,fine:0,meal:380000,damage:0,paid:0},
  {sid:'s3',hours:200,ot:16,base:42000000,otPay:4580000,bonus:3000000,ins:2940000,tax:1450000,adv:0,fine:0,meal:0,damage:0,paid:0},
  {sid:'s4',hours:164,ot:4,base:14760000,otPay:540000,bonus:0,ins:1180000,tax:0,adv:3000000,fine:300000,meal:350000,damage:0,paid:0},
  {sid:'s5',hours:181,ot:10,base:15385000,otPay:1280000,bonus:0,ins:0,tax:0,adv:0,fine:0,meal:300000,damage:0,paid:0},
  {sid:'s6',hours:188,ot:6,base:30000000,otPay:1440000,bonus:1500000,ins:2100000,tax:380000,adv:0,fine:0,meal:250000,damage:0,paid:0},
  {sid:'s7',hours:150,ot:0,base:12000000,otPay:0,bonus:0,ins:0,tax:0,adv:0,fine:500000,meal:280000,damage:0,paid:0},
  {sid:'s8',hours:64,ot:0,base:5120000,otPay:0,bonus:0,ins:0,tax:0,adv:0,fine:0,meal:120000,damage:0,paid:0},
  {sid:'s9',hours:118,ot:0,base:8850000,otPay:0,bonus:0,ins:0,tax:0,adv:0,fine:0,meal:150000,damage:0,paid:0}
];

/* ---------- Parties (one ledger for everyone) ---------- */
const PARTIES=[
  {id:'sp1',kind:'supplier',name:'لبنیات پگاه',cat:'لبنیات',phone:'۰۲۱-۰۰۰۰۰۰۱',terms:'۱۵ روزه'},
  {id:'sp2',kind:'supplier',name:'رُست‌هاوس',cat:'قهوه',phone:'۰۲۱-۰۰۰۰۰۰۲',terms:'۳۰ روزه'},
  {id:'sp3',kind:'supplier',name:'نان آوا',cat:'نان و شیرینی',phone:'۰۲۱-۰۰۰۰۰۰۳',terms:'نقدی'},
  {id:'sp4',kind:'supplier',name:'بازار مرکزی (میوه و سبزی)',cat:'میوه و سبزی',phone:'۰۹۱۲۰۰۰۰۱۰۰',terms:'۷ روزه'},
  {id:'sp5',kind:'supplier',name:'پک‌سازان',cat:'بسته‌بندی',phone:'۰۲۱-۰۰۰۰۰۰۵',terms:'۳۰ روزه'},
  {id:'sp6',kind:'supplier',name:'پروتئین زیاران',cat:'گوشت و مرغ',phone:'۰۲۱-۰۰۰۰۰۰۶',terms:'۱۰ روزه'},
  {id:'sp7',kind:'supplier',name:'پخش روغن و خشکبار نوین',cat:'خشکبار',phone:'۰۲۱-۰۰۰۰۰۰۷',terms:'۱۵ روزه'},
  {id:'o1',kind:'other',name:'موجر (اجارهٔ ملک)',cat:'اجاره',phone:'—',terms:'ماهانه'},
  {id:'o2',kind:'other',name:'قبوض (برق، گاز، آب)',cat:'خدمات عمومی',phone:'—',terms:'—'},
  {id:'o3',kind:'platform',name:'اسنپ‌فود',cat:'پلتفرم فروش',phone:'—',terms:'تسویهٔ هفتگی'},
  {id:'o4',kind:'other',name:'تعمیرات فنی صدرا',cat:'تعمیر و نگهداری',phone:'۰۹۱۲۰۰۰۰۲۰۰',terms:'نقدی'}
].concat(STAFF.map(s=>({id:s.id,kind:'staff',name:s.name,cat:s.role,phone:s.phone,terms:'ماهانه'})));

/* ---------- Money accounts ---------- */
const ACCOUNTS=[
  {id:'a1',name:'صندوق نقدی',kind:'نقد',holder:'صندوقدار شیفت',balance:14200000,icon:'wallet'},
  {id:'a2',name:'بانک ملت — حساب جاری',kind:'بانک',holder:'مالک',balance:286400000,icon:'landmark'},
  {id:'a3',name:'کارتخوان سامان',kind:'بانک',holder:'مالک',balance:41800000,icon:'credit-card'},
  {id:'a4',name:'تنخواه آشپزخانه',kind:'تنخواه',holder:'نیما کریمی',balance:3500000,icon:'hand-coins'}
];

/* ---------- Documents (anything that creates a payable or receivable) ----------
   dir: 'out' = we owe them (payable) | 'in' = they owe us (receivable) */
const DOCS=[
  {id:'d1',no:'خ-۰۸۱۲',date:'1405/08/02',due:'1405/08/17',party:'sp1',type:'purchase',title:'شیر، خامه، پنیر خامه‌ای',amount:18400000,paid:0,dir:'out',source:'دریافت کالا ر-۲۳۱',status:'final'},
  {id:'d2',no:'خ-۰۸۱۳',date:'1405/07/20',due:'1405/08/19',party:'sp2',type:'purchase',title:'دانه قهوه عربیکا ۱۰ کیلو',amount:42000000,paid:20000000,dir:'out',source:'دریافت کالا ر-۲۲۴',status:'final'},
  {id:'d3',no:'خ-۰۸۱۴',date:'1405/08/10',due:'1405/08/10',party:'sp3',type:'purchase',title:'نان و کروسان',amount:6300000,paid:6300000,dir:'out',source:'دریافت کالا ر-۲۳۸',status:'final'},
  {id:'d4',no:'خ-۰۸۱۵',date:'1405/08/08',due:'1405/08/15',party:'sp4',type:'purchase',title:'میوه و سبزی هفتگی',amount:9850000,paid:0,dir:'out',source:'دریافت کالا ر-۲۳۵',status:'estimate'},
  {id:'d5',no:'خ-۰۸۱۶',date:'1405/08/01',due:'1405/08/30',party:'sp5',type:'purchase',title:'لیوان و درب ۱۲ اونس',amount:12600000,paid:0,dir:'out',source:'دریافت کالا ر-۲۲۹',status:'final'},
  {id:'d6',no:'خ-۰۸۱۷',date:'1405/08/05',due:'1405/08/15',party:'sp6',type:'purchase',title:'سینه مرغ و گوشت',amount:15200000,paid:5000000,dir:'out',source:'دریافت کالا ر-۲۳۳',status:'final'},
  {id:'d7',no:'خ-۰۸۱۸',date:'1405/08/11',due:'1405/08/26',party:'sp7',type:'purchase',title:'روغن سرخ‌کردنی ۴ گالن، نمک، ادویه',amount:11450000,paid:0,dir:'out',source:'دریافت کالا ر-۲۴۰',status:'final'},
  {id:'d8',no:'ه-۰۸۰۱',date:'1405/08/01',due:'1405/08/05',party:'o1',type:'expense',title:'اجارهٔ آبان',amount:120000000,paid:120000000,dir:'out',source:'هزینهٔ تکرارشونده',status:'final',expCat:'اجاره'},
  {id:'d9',no:'ه-۰۸۰۲',date:'1405/08/09',due:'1405/08/19',party:'o2',type:'expense',title:'قبض برق مهر',amount:8400000,paid:0,dir:'out',source:'ثبت دستی',status:'final',expCat:'انرژی',month:'مهر'},
  {id:'d10',no:'ه-۰۸۰۳',date:'1405/08/12',due:'1405/08/12',party:'o4',type:'expense',title:'تعمیر آسیاب قهوه',amount:2800000,paid:2800000,dir:'out',source:'رویداد دارایی د-۰۳',status:'final',expCat:'تعمیر و نگهداری'},
  {id:'d11',no:'ح-۰۷۰۱',date:'1405/07/30',due:'1405/08/05',party:'s2',type:'payroll',title:'حقوق مهر',amount:36400000,paid:30000000,dir:'out',source:'حقوق ماه مهر',status:'final'},
  {id:'d12',no:'ح-۰۷۰۲',date:'1405/07/30',due:'1405/08/05',party:'s4',type:'payroll',title:'حقوق مهر',amount:19800000,paid:19800000,dir:'out',source:'حقوق ماه مهر',status:'final'},
  {id:'d13',no:'ح-۰۷۰۳',date:'1405/07/30',due:'1405/08/05',party:'s7',type:'payroll',title:'حقوق مهر',amount:14900000,paid:10000000,dir:'out',source:'حقوق ماه مهر',status:'final'},
  {id:'d14',no:'م-۰۸۰۱',date:'1405/08/06',due:'1405/08/30',party:'s4',type:'advance',title:'مساعدهٔ آبان',amount:3000000,paid:0,dir:'in',source:'درخواست مساعده',status:'final'},
  {id:'d15',no:'م-۰۸۰۲',date:'1405/08/03',due:'1405/08/30',party:'s2',type:'advance',title:'مساعدهٔ آبان',amount:5000000,paid:0,dir:'in',source:'درخواست مساعده',status:'final'},
  {id:'d17',no:'پ-۰۸۰۲',date:'1405/08/14',due:'1405/08/18',party:'o3',type:'sale',title:'تسویهٔ هفتهٔ دوم آبان',amount:27400000,paid:0,dir:'in',source:'فروش پلتفرم',status:'final'}
];

const PAYMENTS=[
  {id:'p1',no:'پر-۰۴۱۲',date:'1405/08/05',party:'o1',account:'a2',method:'انتقال بانکی',amount:120000000,alloc:[['d8',120000000]],dir:'out',by:'مالک'},
  {id:'p2',no:'پر-۰۴۱۳',date:'1405/08/05',party:'s2',account:'a2',method:'انتقال بانکی',amount:30000000,alloc:[['d11',30000000]],dir:'out',by:'حسابدار'},
  {id:'p3',no:'پر-۰۴۱۴',date:'1405/08/05',party:'s4',account:'a2',method:'انتقال بانکی',amount:19800000,alloc:[['d12',19800000]],dir:'out',by:'حسابدار'},
  {id:'p4',no:'پر-۰۴۱۵',date:'1405/08/06',party:'s7',account:'a1',method:'نقد',amount:10000000,alloc:[['d13',10000000]],dir:'out',by:'حسابدار'},
  {id:'p5',no:'پر-۰۴۱۶',date:'1405/08/08',party:'sp2',account:'a2',method:'چک',amount:20000000,alloc:[['d2',20000000]],dir:'out',by:'مالک',cheque:{no:'۸۸۱۲۴۵',due:'1405/08/25',status:'pending'}},
  {id:'p6',no:'پر-۰۴۱۷',date:'1405/08/09',party:'sp6',account:'a3',method:'کارت به کارت',amount:5000000,alloc:[['d6',5000000]],dir:'out',by:'حسابدار'},
  {id:'p7',no:'پر-۰۴۱۸',date:'1405/08/10',party:'sp3',account:'a1',method:'نقد',amount:6300000,alloc:[['d3',6300000]],dir:'out',by:'صندوقدار'},
  {id:'p8',no:'پر-۰۴۱۹',date:'1405/08/12',party:'o4',account:'a4',method:'نقد',amount:2800000,alloc:[['d10',2800000]],dir:'out',by:'نیما کریمی'}
];

const CHEQUES=[
  {no:'۸۸۱۲۴۵',party:'sp2',amount:20000000,issue:'1405/08/08',due:'1405/08/25',bank:'ملت',status:'pending'},
  {no:'۸۸۱۲۳۹',party:'sp5',amount:14000000,issue:'1405/07/12',due:'1405/08/12',bank:'ملت',status:'cleared'},
  {no:'۸۸۱۲۴۶',party:'o1',amount:120000000,issue:'1405/08/05',due:'1405/09/05',bank:'ملت',status:'pending'}
];

/* daily cash close (POS total vs counted) */
const CASH_DAYS=[
  {date:'1405/08/14',shift:'عصر',cashier:'s1',pos:71240000,cash:9850000,card:52100000,transfer:8690000,expense:0},
  {date:'1405/08/14',shift:'صبح',cashier:'s6',pos:31260000,cash:4200000,card:24300000,transfer:2610000,expense:150000},
  {date:'1405/08/13',shift:'عصر',cashier:'s1',pos:64980000,cash:8100000,card:49950000,transfer:6980000,expense:0},
  {date:'1405/08/13',shift:'صبح',cashier:'s6',pos:29870000,cash:3870000,card:22800000,transfer:3200000,expense:0},
  {date:'1405/08/12',shift:'عصر',cashier:'s4',pos:58420000,cash:7400000,card:44600000,transfer:6020000,expense:0},
  {date:'1405/08/12',shift:'صبح',cashier:'s6',pos:30110000,cash:3500000,card:23900000,transfer:2110000,expense:600000}
];

/* ---------- Catalog (master items) ----------
   level: دقیق (recipe + frequent count) | عادی (recipe + monthly count) | کلی (overhead, no recipe) */
const ITEMS=[
  {id:'i1',code:'1012',name:'دانه قهوه عربیکا',cat:'قهوه',type:'مادهٔ اولیه',unit:'گرم',pUnit:'کیلوگرم',pack:1000,waste:0,price:3800000,level:'دقیق',sup:'sp2',qty:14500,min:10000,max:40000,last:'1405/08/12',icon:'bean'},
  {id:'i2',code:'1048',name:'شیر پرچرب',cat:'لبنیات',type:'مادهٔ اولیه',unit:'میلی‌لیتر',pUnit:'لیتر',pack:1000,waste:2,price:62000,level:'دقیق',sup:'sp1',qty:8000,min:20000,max:80000,last:'1405/08/14',icon:'milk'},
  {id:'i3',code:'1051',name:'خامهٔ پرچرب',cat:'لبنیات',type:'مادهٔ اولیه',unit:'میلی‌لیتر',pUnit:'لیتر',pack:1000,waste:0,price:240000,level:'دقیق',sup:'sp1',qty:6000,min:4000,max:15000,last:'1405/08/14',icon:'milk'},
  {id:'i4',code:'5020',name:'پنیر پارمزان',cat:'لبنیات',type:'مادهٔ اولیه',unit:'گرم',pUnit:'کیلوگرم',pack:1000,waste:5,price:2900000,level:'دقیق',sup:'sp1',qty:1800,min:1000,max:4000,last:'1405/08/14',icon:'milk'},
  {id:'i5',code:'6001',name:'سینه مرغ',cat:'گوشت و مرغ',type:'مادهٔ اولیه',unit:'گرم',pUnit:'کیلوگرم',pack:1000,waste:12,price:420000,level:'دقیق',sup:'sp6',qty:9200,min:6000,max:20000,last:'1405/08/14',icon:'drumstick'},
  {id:'i6',code:'3301',name:'پاستا فتوچینی',cat:'خشکبار',type:'مادهٔ اولیه',unit:'گرم',pUnit:'بسته ۵۰۰ گرمی',pack:500,waste:0,price:145000,level:'عادی',sup:'sp7',qty:7500,min:3000,max:15000,last:'1405/07/30',icon:'wheat'},
  {id:'i7',code:'7004',name:'سیب‌زمینی',cat:'میوه و سبزی',type:'مادهٔ اولیه',unit:'گرم',pUnit:'کیلوگرم',pack:1000,waste:20,price:38000,level:'عادی',sup:'sp4',qty:24000,min:15000,max:50000,last:'1405/08/08',icon:'carrot'},
  {id:'i8',code:'3410',name:'روغن سرخ‌کردنی',cat:'خشکبار',type:'مادهٔ اولیه',unit:'میلی‌لیتر',pUnit:'گالن ۱۶ لیتری',pack:16000,waste:0,price:2350000,level:'عادی',sup:'sp7',qty:38000,min:16000,max:64000,last:'1405/08/01',icon:'droplets',note:'جذب روغن در رسپی + دفتر تعویض روغن سرخ‌کن'},
  {id:'i9',code:'3501',name:'نمک',cat:'خشکبار',type:'مادهٔ اولیه',unit:'گرم',pUnit:'کیسه ۱ کیلویی',pack:1000,waste:0,price:28000,level:'کلی',sup:'sp7',qty:6000,min:2000,max:10000,last:'1405/07/30',icon:'sparkle',note:'سربار: هنگام خرید هزینه می‌شود'},
  {id:'i10',code:'3502',name:'ادویه‌جات میکس',cat:'خشکبار',type:'مادهٔ اولیه',unit:'گرم',pUnit:'بسته ۲۵۰ گرمی',pack:250,waste:0,price:310000,level:'کلی',sup:'sp7',qty:900,min:500,max:2000,last:'1405/07/30',icon:'sparkle'},
  {id:'i11',code:'2003',name:'سیروپ کارامل',cat:'سیروپ',type:'مادهٔ اولیه',unit:'میلی‌لیتر',pUnit:'بطری ۷۵۰',pack:750,waste:0,price:1650000,level:'عادی',sup:'sp7',qty:2250,min:3000,max:9000,last:'1405/07/28',icon:'droplet'},
  {id:'i12',code:'4001',name:'لیوان کاغذی ۱۲ اونس',cat:'بسته‌بندی',type:'بسته‌بندی',unit:'عدد',pUnit:'کارتن ۱۰۰۰',pack:1000,waste:0,price:5200000,level:'عادی',sup:'sp5',qty:620,min:500,max:3000,last:'1405/07/20',icon:'cup-soda'},
  {id:'i13',code:'4015',name:'درب لیوان',cat:'بسته‌بندی',type:'بسته‌بندی',unit:'عدد',pUnit:'کارتن ۱۰۰۰',pack:1000,waste:0,price:2600000,level:'عادی',sup:'sp5',qty:340,min:500,max:3000,last:'1405/07/20',icon:'circle'},
  {id:'i14',code:'8801',name:'مایع ظرفشویی',cat:'شوینده',type:'مصرفی غیرغذایی',unit:'میلی‌لیتر',pUnit:'گالن ۴ لیتری',pack:4000,waste:0,price:420000,level:'کلی',sup:'sp7',qty:8000,min:4000,max:16000,last:'1405/07/30',icon:'spray-can'},
  {id:'i15',code:'9101',name:'نوشابه قوطی',cat:'نوشیدنی آماده',type:'کالای فروشی',unit:'عدد',pUnit:'شل ۲۴ عددی',pack:24,waste:0,price:1440000,level:'دقیق',sup:'sp7',qty:58,min:48,max:144,last:'1405/08/14',icon:'cup-soda'},
  {id:'i16',code:'3204',name:'شکلات تلخ ۷۰٪',cat:'خشکبار',type:'مادهٔ اولیه',unit:'گرم',pUnit:'کیلوگرم',pack:1000,waste:0,price:3100000,level:'عادی',sup:'sp7',qty:5200,min:3000,max:10000,last:'1405/07/30',icon:'candy'}
];

/* ---------- Menu & recipes ---------- */
const CHANNELS=[
  {id:'dine',name:'سالن',icon:'armchair',markup:0,commission:0,pack:0},
  {id:'take',name:'بیرون‌بر',icon:'shopping-bag',markup:0,commission:0,pack:1},
  {id:'snapp',name:'اسنپ‌فود',icon:'bike',markup:15,commission:22,pack:1},
  {id:'qr',name:'منوی QR',icon:'qr-code',markup:0,commission:0,pack:0}
];
/* recipe line: [itemId, qty]; pack: packaging lines for takeaway. Salt/spice overhead comes from OVERHEAD (one rate per food portion), not from each recipe */
const MENU=[
  {id:'m1',name:'لاته',cat:'قهوه',price:245000,qty:1284,active:true,ch:['dine','take','snapp','qr'],lines:[['i1',18],['i2',220]],packLines:[['i12',1],['i13',1]]},
  {id:'m2',name:'آمریکانو',cat:'قهوه',price:185000,qty:1102,active:true,ch:['dine','take','snapp','qr'],lines:[['i1',18]],packLines:[['i12',1],['i13',1]]},
  {id:'m3',name:'کاپوچینو',cat:'قهوه',price:235000,qty:742,active:true,ch:['dine','take','snapp','qr'],lines:[['i1',18],['i2',160]],packLines:[['i12',1],['i13',1]]},
  {id:'m4',name:'کارامل ماکیاتو',cat:'قهوه',price:275000,qty:388,active:true,ch:['dine','take','snapp','qr'],lines:[['i1',18],['i2',200],['i11',15]],packLines:[['i12',1],['i13',1]]},
  {id:'m5',name:'پاستا آلفردو',cat:'غذا',price:520000,qty:231,active:true,ch:['dine','take','snapp','qr'],lines:[['i6',120],['i3',100],['i5',130],['i4',20],['i8',15]],packLines:[]},
  {id:'m6',name:'سیب‌زمینی سرخ‌کرده',cat:'پیش‌غذا',price:210000,qty:640,active:true,ch:['dine','take','snapp','qr'],lines:[['i7',250],['i8',25]],packLines:[]},
  {id:'m7',name:'ساندویچ مرغ گریل',cat:'غذا',price:395000,qty:174,active:true,ch:['dine','take','snapp','qr'],lines:[['i5',150],['i8',10]],packLines:[],incomplete:'نان در رسپی نیست'},
  {id:'m8',name:'هات چاکلت',cat:'نوشیدنی گرم',price:260000,qty:296,active:true,ch:['dine','take','qr'],lines:[['i16',25],['i2',200]],packLines:[['i12',1],['i13',1]]},
  {id:'m9',name:'نوشابه قوطی',cat:'نوشیدنی آماده',price:95000,qty:540,active:true,ch:['dine','take','snapp','qr'],lines:[['i15',1]],packLines:[]},
  {id:'m10',name:'اسپرسو تونیک',cat:'قهوه',price:260000,qty:164,active:false,ch:['dine','qr'],lines:[['i1',18]],packLines:[],incomplete:'تونیک در کاتالوگ نیست'}
];

const PRICE_LOG=[
  {date:'1405/08/01',item:'m1',from:225000,to:245000,by:'مالک',reason:'افزایش قیمت قهوه'},
  {date:'1405/08/01',item:'m3',from:215000,to:235000,by:'مالک',reason:'افزایش قیمت قهوه'},
  {date:'1405/07/15',item:'m5',from:480000,to:520000,by:'مالک',reason:'افزایش قیمت مرغ و خامه'},
  {date:'1405/07/01',item:'m6',from:190000,to:210000,by:'مدیر داخلی',reason:'روغن'}
];

/* ---------- Inventory events ---------- */
const RECEIPTS=[
  {no:'ر-۲۴۰',date:'1405/08/11',party:'sp7',lines:3,amount:11450000,status:'قیمت قطعی',doc:'d7'},
  {no:'ر-۲۳۸',date:'1405/08/10',party:'sp3',lines:2,amount:6300000,status:'قیمت قطعی',doc:'d3'},
  {no:'ر-۲۳۵',date:'1405/08/08',party:'sp4',lines:6,amount:9850000,status:'قیمت برآوردی',doc:'d4'},
  {no:'ر-۲۳۳',date:'1405/08/05',party:'sp6',lines:2,amount:15200000,status:'قیمت قطعی',doc:'d6'},
  {no:'ر-۲۳۱',date:'1405/08/02',party:'sp1',lines:3,amount:18400000,status:'قیمت قطعی',doc:'d1'}
];
const WASTE=[
  {date:'1405/08/14',kind:'مواد',item:'شیر پرچرب',qty:'۲ لیتر',value:124000,reason:'تاریخ گذشته',by:'s4',status:'تأییدشده'},
  {date:'1405/08/13',kind:'منو',item:'پاستا آلفردو',qty:'۱ پرس',value:186000,reason:'برگشت مشتری (شور)',by:'s3',status:'منتظر تأیید'},
  {date:'1405/08/12',kind:'مواد',item:'سیب‌زمینی',qty:'۳ کیلو',value:114000,reason:'خراب شده',by:'s5',status:'تأییدشده'},
  {date:'1405/08/11',kind:'منو',item:'لاته',qty:'۲ عدد',value:166000,reason:'اشتباه سفارش',by:'s2',status:'تأییدشده'},
  {date:'1405/08/09',kind:'مواد',item:'خامهٔ پرچرب',qty:'۰٫۵ لیتر',value:120000,reason:'ریختن / حادثه',by:'s3',status:'تأییدشده'}
];
const COUNTS=[
  {date:'1405/08/14',scope:'لبنیات و پروتئین (دقیق)',items:6,diffValue:-1480000,status:'ثبت‌شده',by:'s2'},
  {date:'1405/08/12',scope:'قهوه (دقیق)',items:1,diffValue:-2100000,status:'ثبت‌شده',by:'s2'},
  {date:'1405/07/30',scope:'شمارش کامل پایان مهر',items:16,diffValue:-6240000,status:'بسته‌شده',by:'s6'}
];
const VARIANCE=[
  {item:'i1',theo:51200,actual:53800},{item:'i2',theo:412000,actual:425500},{item:'i5',theo:58400,actual:61100},
  {item:'i3',theo:41000,actual:40200},{item:'i8',theo:28500,actual:36400},{item:'i7',theo:178000,actual:183500},{item:'i11',theo:9700,actual:9900}
];
const FRYER=[
  {date:'1405/08/14',fryer:'سرخ‌کن ۱',liters:16,reason:'تعویض کامل',by:'s3',sales:212,std:200,color:'روشن'},
  {date:'1405/08/10',fryer:'سرخ‌کن ۱',liters:16,reason:'تعویض کامل',by:'s3',sales:236,std:200,color:'متوسط'},
  {date:'1405/08/07',fryer:'سرخ‌کن ۱',liters:4,reason:'سرریز (افزودن)',by:'s5',sales:0,std:200},
  {date:'1405/08/05',fryer:'سرخ‌کن ۱',liters:16,reason:'تعویض کامل',by:'s3',sales:228,std:200,color:'تیره'},
  {date:'1405/07/28',fryer:'سرخ‌کن ۱',liters:16,reason:'تعویض کامل',by:'s3',sales:181,std:200,color:'تیره',locked:true},
  {date:'1405/07/12',fryer:'سرخ‌کن ۱',liters:16,reason:'تعویض کامل',by:'s3',sales:243,std:220,color:'تیره',locked:true}
];
const BEVERAGE=[
  {name:'نوشابه قوطی',open:62,in:48,sold:49,close:58},
  {name:'آب معدنی',open:80,in:0,sold:31,close:47},
  {name:'دوغ',open:24,in:24,sold:20,close:27},
  {name:'ماءالشعیر',open:30,in:0,sold:12,close:18}
];

/* ---------- Assets ---------- */
const ASSETS=[
  {id:'as1',code:'د-۰۰۱',name:'دستگاه اسپرسو ۲ گروپ',kind:'شماره‌دار',qty:1,loc:'بار',cost:780000000,date:'1402/03/01',life:10,status:'سالم'},
  {id:'as2',code:'د-۰۰۲',name:'آسیاب قهوهٔ برقی',kind:'شماره‌دار',qty:2,loc:'بار',cost:96000000,date:'1402/03/01',life:7,status:'تعمیر شده'},
  {id:'as3',code:'د-۰۱۰',name:'یخچال ایستادهٔ دو در',kind:'شماره‌دار',qty:1,loc:'آشپزخانه',cost:145000000,date:'1401/11/20',life:10,status:'سالم'},
  {id:'as4',code:'د-۰۱۲',name:'سرخ‌کن صنعتی',kind:'شماره‌دار',qty:1,loc:'آشپزخانه',cost:62000000,date:'1403/05/10',life:7,status:'سالم'},
  {id:'as5',code:'ت-۰۳۱',name:'فنجان سرامیکی',kind:'تعدادی',qty:118,loc:'بار',cost:42480000,date:'1404/01/10',life:3,status:'۲ عدد شکسته'},
  {id:'as6',code:'ت-۰۳۴',name:'لیوان شیشه‌ای',kind:'تعدادی',qty:76,loc:'بار',cost:15200000,date:'1404/01/10',life:3,status:'سالم'},
  {id:'as7',code:'ت-۰۴۰',name:'صندلی سالن',kind:'تعدادی',qty:40,loc:'سالن',cost:168000000,date:'1401/11/20',life:8,status:'سالم'}
];
const ASSET_EVENTS=[
  {no:'د-۰۵',date:'1405/08/13',asset:'as5',kind:'شکستگی',qty:2,cost:1200000,by:'s7',resp:'staff',share:1200000,status:'منتظر تأیید',note:'هنگام جمع‌کردن میز ۶'},
  {no:'د-۰۴',date:'1405/08/12',asset:'as2',kind:'تعمیر',qty:1,cost:2800000,by:'s2',resp:'company',status:'تأییدشده',note:'تعویض تیغهٔ آسیاب'},
  {no:'د-۰۳',date:'1405/07/22',asset:'as1',kind:'سرویس دوره‌ای',qty:1,cost:4500000,by:'s2',resp:'company',status:'تأییدشده',note:'واشر و فیلتر'},
  {no:'د-۰۲',date:'1405/07/10',asset:'as6',kind:'مفقودی',qty:3,cost:600000,by:'s6',resp:'company',status:'تأییدشده',note:'شمارش ماهانه'}
];

/* ---------- Requests (people) ---------- */
const REQUESTS=[
  {id:'r1',type:'مرخصی',sid:'s4',date:'1405/08/14',detail:'پنجشنبه ۲۲ آبان — روزانه',status:'pending'},
  {id:'r2',type:'مساعده',sid:'s5',date:'1405/08/14',detail:'۲٬۰۰۰٬۰۰۰ تومان',status:'pending'},
  {id:'r3',type:'اصلاح کارکرد',sid:'s7',date:'1405/08/13',detail:'خروج ثبت نشده — ۱۲ آبان ساعت ۲۳:۱۰',status:'pending'},
  {id:'r4',type:'مرخصی',sid:'s1',date:'1405/08/10',detail:'۱۸ آبان — ساعتی (۳ ساعت)',status:'approved'},
  {id:'r5',type:'مساعده',sid:'s2',date:'1405/08/03',detail:'۵٬۰۰۰٬۰۰۰ تومان',status:'approved'}
];

const USERS=[
  {name:'مهران (مالک)',role:'owner',staff:null,last:'امروز ۰۹:۱۲',active:true},
  {name:'زهرا نوری',role:'manager',staff:'s6',last:'امروز ۱۰:۴۰',active:true},
  {name:'حسابدار بیرونی',role:'accountant',staff:null,last:'دیروز',active:true},
  {name:'علی رضایی',role:'storekeeper',staff:'s2',last:'امروز ۰۸:۰۵',active:true},
  {name:'سارا محمدی',role:'cashier',staff:'s1',last:'دیروز ۲۳:۴۸',active:true},
  {name:'حمید صادقی',role:'staff',staff:'s7',last:'۳ روز پیش',active:true},
  {name:'کاربر قدیمی صندوق',role:'cashier',staff:null,last:'۴ ماه پیش',active:false}
];


/* ---------- Tips (انعام) — separate from payroll ----------
   Every tip has a target:
     shift  = for the hall crew of that shift → split equally among them
     all    = "for everyone" → split equally among everyone present in that shift, except the courier
     person = for one person (e.g. courier) → no split
   Cash tips are split on the spot (spot:true = already paid in cash, recorded for the monthly file).
   Card / transfer tips reach the bank and are paid with the month-end tip document.
   Valet's cash tips are personal and never recorded. */
const TIP_RULES={hall:['سالن'],excludeAll:['پیک'],allScope:'حاضران همان شیفت',round:10000};
const TIP_SRC={card:['کارتخوان','credit-card'],cash:['نقد','banknote'],transfer:['کارت به کارت','arrow-left-right']};
const TIP_TARGET={shift:['سالن همان شیفت','users'],all:['برای همه','users-round'],person:['شخصی','user']};
const TIP_IN=[];
for(let d=1;d<=14;d++)['صبح','عصر'].forEach((sh,k)=>{
  const date='1405/08/'+String(d).padStart(2,'0'),w=k?1.6:1,x=Math.abs(Math.sin(d*7.3+k*3.1)),by=k?'s1':'s6',r=v=>Math.round(v/10000)*10000;
  TIP_IN.push({date,shift:sh,src:'card',target:'shift',amount:r((420000+x*520000)*w),spot:false,by});
  TIP_IN.push({date,shift:sh,src:'cash',target:'shift',amount:r((180000+(1-x)*300000)*w),spot:true,by});
  if(d%3===0)TIP_IN.push({date,shift:sh,src:'card',target:'all',amount:r(600000+x*900000),spot:false,by});
  if(k&&d%2===0)TIP_IN.push({date,shift:sh,src:d%4?'card':'transfer',target:'person',sid:'s9',amount:r(80000+x*120000),spot:false,by});
});
/* past months: distributed and paid (snapshot) */
const TIP_HISTORY=[{m:4,total:61200000},{m:5,total:66800000},{m:6,total:69500000}];

/* ---------- Fryer oil standard ----------
   std = minimum fried portions between two full oil changes. Each change keeps the std that was valid when it was recorded;
   closed months are locked. Changing std asks whether open-period records are re-evaluated. */
const OIL={std:200,monitor:{on:true,from:'1405/08/01',to:'1405/08/30'},
  log:[{date:'1405/06/01',std:220,by:'مالک',scope:'future'},{date:'1405/07/15',std:200,by:'مالک',scope:'future'}]};

/* settings changes (who, when, from → to, scope) */
const SETTING_LOG=[{date:'1405/07/15',by:'مالک',area:'انبار',text:'حداقل پرس بین دو تعویض روغن ۲۲۰ ← ۲۰۰',scope:'فقط از همان روز'}];

/* ---------- Salt & spice overhead (اقلام «کلی» غذایی) ----------
   One fixed amount per food portion = purchases of the last 3 months ÷ food portions sold in the same months.
   Reviewed every 3 months; no counting, no per-recipe entry. Expensive spices (e.g. saffron) are NOT here: level «عادی» + recipe line. */
const OVERHEAD={window:'مرداد تا مهر ۱۴۰۵',cats:['غذا','پیش‌غذا'],roundTo:500,portions:3135,
  buys:[['نمک','i9',420000],['ادویه‌جات میکس','i10',7440000],['سایر چاشنی (فلفل، پاپریکا، آویشن)',null,2600000]],
  current:{label:'آبان تا امروز',buys:1750000,portions:520},
  history:[{m:4,buys:3310000,portions:1020},{m:5,buys:3620000,portions:1080},{m:6,buys:3530000,portions:1035}]};

/* ---------- Bank statement lines (for matching recorded payments) ----------
   Payments happen outside the panel (bank app, cash); the panel only records them. Unmatched lines = payments not yet recorded. */
const BANK_LINES=[
  {date:'1405/08/05',desc:'انتقال پایا — اجاره',amount:120000000,dir:'out',ref:'۱۴۰۵۰۸۰۵۱۱۲',match:'p1'},
  {date:'1405/08/05',desc:'انتقال — علی رضایی',amount:30000000,dir:'out',ref:'۱۴۰۵۰۸۰۵۲۰۳',match:'p2'},
  {date:'1405/08/05',desc:'انتقال — مریم احمدی',amount:19800000,dir:'out',ref:'۱۴۰۵۰۸۰۵۲۰۴',match:'p3'},
  {date:'1405/08/11',desc:'کارت به کارت — بازار مرکزی',amount:4600000,dir:'out',ref:'۷۷۴۱۲۰',match:null,guess:'sp4'},
  {date:'1405/08/13',desc:'انتقال ساتنا — لبنیات پگاه',amount:18500000,dir:'out',ref:'۱۴۰۵۰۸۱۳۰۰۹',match:null,guess:'sp1'},
  {date:'1405/08/14',desc:'تسویهٔ هفتگی اسنپ‌فود',amount:38750000,dir:'in',ref:'SNP-۰۸۱۴',match:null,guess:'o3'}
];

/* monthly sales history for 1405 (toman) */
const SALES_MONTHS=[
  {m:0,sales:2310000000,food:742000000,labor:568000000,overhead:398000000,waste:21000000},
  {m:1,sales:2480000000,food:806000000,labor:575000000,overhead:401000000,waste:24500000},
  {m:2,sales:2395000000,food:790000000,labor:582000000,overhead:405000000,waste:27800000},
  {m:3,sales:2210000000,food:735000000,labor:579000000,overhead:410000000,waste:22600000},
  {m:4,sales:2150000000,food:731000000,labor:588000000,overhead:412000000,waste:25900000},
  {m:5,sales:2540000000,food:838000000,labor:596000000,overhead:415000000,waste:29400000},
  {m:6,sales:2690000000,food:877000000,labor:612000000,overhead:420000000,waste:31200000},
  {m:7,sales:1380000000,food:452000000,labor:318000000,overhead:214000000,waste:14100000,partial:true}
];

window.D={TODAY,MONTHS,ROLES,PERM,TAB_ALLOW,STAFF,PAYROLL,PARTIES,ACCOUNTS,DOCS,PAYMENTS,CHEQUES,CASH_DAYS,
  ITEMS,CHANNELS,MENU,PRICE_LOG,RECEIPTS,WASTE,COUNTS,VARIANCE,FRYER,BEVERAGE,ASSETS,ASSET_EVENTS,REQUESTS,USERS,SALES_MONTHS,
  TIP_RULES,TIP_SRC,TIP_TARGET,TIP_IN,TIP_HISTORY,OIL,SETTING_LOG,OVERHEAD,BANK_LINES};
})();
