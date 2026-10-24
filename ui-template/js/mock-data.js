/* =========================================================
   Rayo UI Template — mock-data.js
   Sample data for the template only. Not connected to the API.
   ========================================================= */
(function(){
'use strict';
const r=RT.rng(1405);
const between=(a,b)=>a+(b-a)*r();
const DAY=864e5;

function days(n){
  const out=[],today=new Date();
  for(let i=n-1;i>=0;i--){
    const d=new Date(today-i*DAY),wd=d.getDay();       // 4 = Thursday, 5 = Friday
    const weekend=wd===4||wd===5?1.35:1;
    const trend=1+(n-i)/n*.12;
    const sales=Math.round(between(38,52)*1e6*weekend*trend);
    const prev=Math.round(between(34,48)*1e6*weekend);
    const orders=Math.round(sales/between(265e3,310e3));
    out.push({date:d,sales,prev,orders,cogs:Math.round(sales*between(.29,.35))});
  }
  return out;
}

const MONTHS=['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

window.MOCK={
  days,
  categories:[
    {name:'قهوه و اسپرسو',value:412e6},
    {name:'نوشیدنی سرد',value:236e6},
    {name:'کیک و دسر',value:168e6},
    {name:'صبحانه',value:121e6},
    {name:'غذای اصلی',value:98e6},
    {name:'سایر',value:41e6}
  ],
  topItems:[
    {name:'لاته',qty:1284,icon:'coffee'},
    {name:'آمریکانو',qty:1102,icon:'coffee'},
    {name:'آیس لاته',qty:876,icon:'cup-soda'},
    {name:'کاپوچینو',qty:742,icon:'coffee'},
    {name:'چیزکیک نیویورکی',qty:518,icon:'cake-slice'},
    {name:'کروسان کره‌ای',qty:467,icon:'croissant'}
  ],
  heat(){
    const wd=['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'];
    const hours=[];for(let h=8;h<=23;h++)hours.push(h);
    const data=[];
    wd.forEach((_,d)=>hours.forEach((h,hi)=>{
      const curve=Math.exp(-Math.pow((h-11)/2.2,2))*.6+Math.exp(-Math.pow((h-20.5)/2.4,2));
      const boost=d>=5?1.45:d===4?1.15:1;
      data.push([hi,d,Math.round((curve*28+between(1,5))*boost)]);
    }));
    return{wd,hours,data};
  },
  cashReports:[
    {date:'۳ آبان',shift:'عصر',cashier:'سارا محمدی',sepidz:58420000,counted:58420000},
    {date:'۳ آبان',shift:'صبح',cashier:'علی رضایی',sepidz:31260000,counted:31110000},
    {date:'۲ آبان',shift:'عصر',cashier:'سارا محمدی',sepidz:64980000,counted:65030000},
    {date:'۲ آبان',shift:'صبح',cashier:'نیما کریمی',sepidz:29870000,counted:29870000},
    {date:'۱ آبان',shift:'عصر',cashier:'علی رضایی',sepidz:71240000,counted:70640000}
  ],
  alerts:[
    {icon:'package-x',tone:'danger',title:'شیر پرچرب زیر نقطهٔ سفارش',meta:'موجودی ۸ لیتر · حداقل ۲۰ لیتر'},
    {icon:'scale',tone:'warning',title:'مغایرت شمارش دانه قهوه',meta:'−۱٫۲ کیلوگرم نسبت به مصرف تئوریک'},
    {icon:'calendar-clock',tone:'info',title:'۲ درخواست مرخصی در انتظار',meta:'شیفت پنجشنبه عصر'},
    {icon:'file-warning',tone:'warning',title:'فاکتور خرید بدون پرداخت',meta:'لبنیات پگاه · سررسید فردا'},
    {icon:'users',tone:'danger',title:'کمبود نیرو در شیفت جمعه',meta:'۱ باریستا کمتر از نیاز'}
  ],
  months:MONTHS,
  pnl:MONTHS.map((m,i)=>{
    const season=1+Math.sin((i-1)/12*Math.PI*2)*.12;
    const revenue=Math.round(between(1.05,1.25)*1e9*season*(1+i*.015));
    const cogs=Math.round(revenue*between(.3,.34));
    const payroll=Math.round(revenue*between(.21,.25));
    const overhead=Math.round(revenue*between(.15,.18));
    return{month:m,revenue,cogs,payroll,overhead,net:revenue-cogs-payroll-overhead};
  }),
  menuEng:[
    {name:'لاته',qty:1284,margin:118e3,cat:'قهوه'},
    {name:'آمریکانو',qty:1102,margin:96e3,cat:'قهوه'},
    {name:'کاپوچینو',qty:742,margin:112e3,cat:'قهوه'},
    {name:'موکا',qty:388,margin:134e3,cat:'قهوه'},
    {name:'اسپرسو تونیک',qty:164,margin:152e3,cat:'قهوه'},
    {name:'آیس لاته',qty:876,margin:126e3,cat:'سرد'},
    {name:'لیموناد',qty:412,margin:88e3,cat:'سرد'},
    {name:'اسموتی توت',qty:205,margin:141e3,cat:'سرد'},
    {name:'چیزکیک',qty:518,margin:162e3,cat:'دسر'},
    {name:'براونی',qty:342,margin:74e3,cat:'دسر'},
    {name:'تیرامیسو',qty:188,margin:171e3,cat:'دسر'},
    {name:'کروسان',qty:467,margin:58e3,cat:'صبحانه'},
    {name:'املت',qty:296,margin:92e3,cat:'صبحانه'},
    {name:'پنکیک',qty:142,margin:66e3,cat:'صبحانه'},
    {name:'پاستا آلفردو',qty:231,margin:184e3,cat:'غذا'},
    {name:'ساندویچ مرغ',qty:174,margin:79e3,cat:'غذا'}
  ],
  suppliers:[
    {name:'لبنیات',children:[{name:'پگاه',value:182e6},{name:'دامداران',value:96e6},{name:'کاله',value:41e6}]},
    {name:'قهوه و چای',children:[{name:'رُست‌هاوس',value:224e6},{name:'چای دوغزال',value:34e6}]},
    {name:'نان و شیرینی',children:[{name:'نان آوا',value:74e6},{name:'شیرینی ناتلی',value:52e6}]},
    {name:'میوه و سبزی',children:[{name:'بازار مرکزی',value:88e6}]},
    {name:'بسته‌بندی',children:[{name:'پک‌سازان',value:39e6},{name:'کاغذ سبز',value:21e6}]},
    {name:'گوشت و مرغ',children:[{name:'زیاران',value:63e6}]}
  ],
  variance:[
    {name:'دانه قهوه',value:-4.8},{name:'شیر پرچرب',value:-3.1},{name:'سیروپ کارامل',value:-2.2},
    {name:'پنیر خامه‌ای',value:-1.4},{name:'لیوان ۱۲ اونس',value:-.9},{name:'شکلات تلخ',value:.6},
    {name:'آرد',value:1.2},{name:'خامه',value:1.9}
  ],
  survey:{
    dims:['کیفیت نوشیدنی','کیفیت غذا','سرعت سرویس','برخورد پرسنل','نظافت','فضا و موسیقی'],
    now:[4.6,4.2,3.7,4.5,4.4,4.7],prev:[4.4,4.1,3.9,4.3,4.2,4.5]
  },
  stock:[
    {code:'SP-1012',name:'دانه قهوه عربیکا',cat:'قهوه',unit:'کیلوگرم',qty:14.5,min:10,max:40,value:72.5e6,count:'۲ آبان',level:'دقیق',icon:'bean'},
    {code:'SP-1048',name:'شیر پرچرب',cat:'لبنیات',unit:'لیتر',qty:8,min:20,max:80,value:3.2e6,count:'۳ آبان',level:'دقیق',icon:'milk'},
    {code:'SP-1051',name:'خامه صبحانه',cat:'لبنیات',unit:'عدد',qty:46,min:24,max:90,value:4.6e6,count:'۳ آبان',level:'عادی',icon:'milk'},
    {code:'SP-2003',name:'سیروپ کارامل',cat:'سیروپ',unit:'بطری',qty:3,min:4,max:12,value:5.4e6,count:'۲۸ مهر',level:'عادی',icon:'droplet'},
    {code:'SP-2007',name:'سیروپ وانیل',cat:'سیروپ',unit:'بطری',qty:7,min:4,max:12,value:12.6e6,count:'۲۸ مهر',level:'عادی',icon:'droplet'},
    {code:'SP-3110',name:'آرد قنادی',cat:'خشکبار',unit:'کیلوگرم',qty:22,min:10,max:50,value:2.6e6,count:'۲۵ مهر',level:'کلی',icon:'wheat'},
    {code:'SP-3204',name:'شکلات تلخ ۷۰٪',cat:'خشکبار',unit:'کیلوگرم',qty:5.2,min:3,max:10,value:15.6e6,count:'۲۵ مهر',level:'عادی',icon:'candy'},
    {code:'SP-4001',name:'لیوان کاغذی ۱۲ اونس',cat:'بسته‌بندی',unit:'عدد',qty:620,min:500,max:3000,value:3.1e6,count:'۲۰ مهر',level:'کلی',icon:'cup-soda'},
    {code:'SP-4015',name:'درب لیوان',cat:'بسته‌بندی',unit:'عدد',qty:340,min:500,max:3000,value:.9e6,count:'۲۰ مهر',level:'کلی',icon:'circle'},
    {code:'SP-5020',name:'پنیر خامه‌ای',cat:'لبنیات',unit:'کیلوگرم',qty:6.4,min:4,max:15,value:9.8e6,count:'۳ آبان',level:'دقیق',icon:'milk'}
  ]
};
})();
