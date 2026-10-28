'use strict';
// QA: attendance module phase 2 — calculation engine (RayoAttendanceCore.computeDay/computeMonth in js/50).
const fs=require('fs');
const assert=require('assert');
const C=require('./js/50-attendance-core.js');

let passed=0;
function check(name,condition){if(!condition)throw new Error(`FAIL: ${name}`);passed++;console.log(`  ✓ ${name}`)}
const clone=x=>JSON.parse(JSON.stringify(x));
const S0=JSON.parse(fs.readFileSync('seed/attendance-data.seed.json','utf8')).settings;
const with_=(patch)=>Object.assign(clone(S0),patch);
/* Synthetic punches: [time, type, nextCalendarDay?] on business day bd. */
let seq=0;
function P(bd,rows){return rows.map(([time,type,next])=>({id:`T${++seq}`,personnelId:'X',date:next?C.addDays(bd,1):bd,time:time.length===5?time+':00':time,type,businessDate:bd}))}
const day=(bd,rows,settings=S0,override=null)=>C.computeDay({personnelId:'X',businessDate:bd,punches:P(bd,rows),settings,override});
const slotStr=d=>C.SLOT_LABELS&&['s1','s2','s3','s4'].map(k=>d.slots[k]?`${d.slots[k].time??'?'}${{actual:'',merged:'m',worst_case:'w',rest_rule:'r',manual:'x'}[d.slots[k].source]}`:'-').join(' ');
const SAT='1405/08/03'/* یکشنبه */,THU='1405/08/07',FRI='1405/08/01';

console.log('سناریوهای برگهٔ «سناریوهای تست» (fixture)');
const parsed=C.parseSheets([{name:'x',rows:C.parseCsv(fs.readFileSync('docs/rayo-attendance-sample.punches.csv','utf8'))}]);
const people=['101','102','103','104','105','106'].map(c=>({id:`EMP-${c}`,attendanceCode:c}));
const punches=C.applyImport({punches:[],importBatches:[]},C.planImport({parsed,personnel:people,settings:S0}),{parsed}).doc.punches;
const scen=C.parseCsv(fs.readFileSync('docs/rayo-attendance-sample.test-scenarios.csv','utf8')).slice(1).filter(r=>/^\d{4}\//.test(r[0]||''));
/* Expected values per scenario row (business day, code): slots (x = filled with that source), and every figure the sheet's note names. */
const EXPECT={
 '08/01|101':{slots:'08:25 17:35 - -',late:0,ot:5},
 '08/01|102':{slots:'- - 16:28 00:32',nextDay:'s4'},
 '08/01|103':{slots:'08:29 15:00 17:02 00:30',rest:122,restOverrun:2,deficit:2},
 '08/01|104':{slots:'08:30m 17:30 - -',late:0,explain:'merge_same'},
 '08/01|105':{slots:'- - 16:30 00:35m',ot:5,explain:'merge_same'},
 '08/01|106':{slots:'- - - -',status:'undetermined'},
 '08/02|101':{slots:'09:05 12:00w - -',late:0,explain:'fill_exit'},
 '08/02|102':{slots:'- - 21:00w 00:30',explain:'fill_entry'},
 '08/02|103':{slots:'09:00 ?r ?r 00:30',rest:120,restKnown:false,worked:810,restOverrun:0,explain:'fill_rest'},
 '08/02|104':{slots:'09:00 16:00r 18:00 00:30',rest:120,explain:'fill_rest'},
 '08/02|106':{slots:'- - 16:40 00:30',late:10},
 '08/03|101':{slots:'12:00w 17:30 - -',explain:'fill_entry'},
 '08/03|102':{slots:'- - 16:30 21:00w',explain:'fill_exit'},
 '08/03|103':{slots:'09:00 16:00 18:00r 00:30',rest:120,explain:'fill_rest'},
 '08/03|104':{slots:'09:00 15:00 17:00 21:00w',explain:'fill_exit'},
 '08/03|105':{slots:'09:00 17:30m - -',ot:0,explain:'merge_opposite'},
 '08/03|106':{slots:'09:20 17:30 - -',late:20},
 '08/04|101':{slots:'09:14 16:00 - -',late:0,earlyExit:90},
 '08/04|102':{slots:'- - 16:30 01:30',ot:60},
 '08/04|103':{slots:'09:00 15:00 18:00 00:30',rest:180,restOverrun:60},
 '08/04|104':{slots:'- - 16:00 00:30',late:0,ot:0,earlyArrival:30},
 '08/04|105':{review:true},
 '08/05|101':{slots:'- - - -',status:'undetermined'},
 '08/05|102':{slots:'- - 16:30 05:55',nextDay:'s4'},
 '08/05|106':{slots:'09:00 16:00 18:00 00:30',rest:120,restOverrun:0,deficit:0},
 '08/06|104':{slots:'- - 16:30m 00:30',explain:'merge_opposite'},
 '08/06|105':{slots:'09:00 16:00 18:00 00:30',rest:120,restOverrun:0},
 '08/07|101':{slots:'08:30 17:30 - -',late:0,ot:0},
 '08/07|102':{slots:'- - 16:30 01:00',ot:0,earlyExit:0},
 '08/07|105':{slots:'- - 16:30 01:20',ot:20},
 '08/07|106':{slots:'08:50 17:30 - -',late:20}
};
const SHIFT_BY_SHEET={'تک‌شیفت صبح':'morning','تک‌شیفت عصر':'evening','دوشیفت':'double','تعیین‌نشده':'none'};
let rowsChecked=0;
for(const r of scen){
 const bd=r[0].split(' ')[0],key=`${bd.slice(5)}|${r[1]}`,e=EXPECT[key],pid=`EMP-${r[1]}`;
 assert(e,`expectation missing for ${key}`);
 const d=C.computeDay({personnelId:pid,businessDate:bd,punches:C.punchesFor(punches,pid,bd),settings:S0});
 const ctx=`${key} ${r[2]}`;
 if(r[3]==='نیاز به بررسی')assert(d.flags.needsReview&&d.explanations.some(x=>x.kind==='review'),ctx);
 else{assert.equal(d.shift,SHIFT_BY_SHEET[r[3]],ctx);assert(!d.flags.needsReview,ctx)}
 if(e.slots)assert.equal(slotStr(d),e.slots,ctx);
 for(const f of ['late','earlyExit','restOverrun','deficit','worked','earlyArrival','restKnown'])if(e[f]!==undefined)assert.equal(d[f],e[f],`${ctx} ${f}`);
 if(e.rest!==undefined)assert.equal(d.restMinutes,e.rest,`${ctx} rest`);
 if(e.ot!==undefined){assert.equal(d.overtime.pending,e.ot,`${ctx} ot`);assert.equal(d.overtime.approved,0);assert.equal(d.flags.hasPendingOvertime,e.ot>0)}
 if(e.status)assert.equal(d.status,e.status,ctx);else assert.equal(d.status,'present',ctx);
 if(e.nextDay)assert(d.slots[e.nextDay].nextDay,`${ctx} nextDay`);
 if(e.explain)assert(d.explanations.some(x=>x.kind===e.explain),`${ctx} explanation ${e.explain}`);
 if(r[3]!=='نیاز به بررسی')assert.equal(d.flags.hasAutoFill,!!r[4]&&r[4]!=='—',`${ctx} hasAutoFill`);
 rowsChecked++;
}
check(`همهٔ ${rowsChecked} سناریو: نوع شیفت، ساعت‌ها و منبع هر ساعت، تأخیر/تعجیل/استراحت/کسر کار/اضافه‌کار و توضیح`,rowsChecked===scen.length&&rowsChecked===31&&Object.keys(EXPECT).length===31);

console.log('جدول §4.3: تشخیص شیفت و تکمیل');
const T43=[
 [[['09:00','in'],['17:30','out']],'morning','09:00 17:30 - -'],
 [[['16:30','in'],['00:30','out',1]],'evening','- - 16:30 00:30'],
 [[['09:00','in'],['15:00','out'],['17:00','in'],['00:30','out',1]],'double','09:00 15:00 17:00 00:30'],
 [[['09:00','in']],'morning','09:00 12:00w - -'],
 [[['17:30','out']],'morning','12:00w 17:30 - -'],
 [[['16:30','in']],'evening','- - 16:30 21:00w'],
 [[['00:30','out',1]],'evening','- - 21:00w 00:30'],
 [[['09:00','in'],['15:00','out'],['17:00','in']],'double','09:00 15:00 17:00 21:00w'],
 [[['15:00','out'],['17:00','in'],['00:30','out',1]],'double','12:00w 15:00 17:00 00:30'],
 [[['09:00','in'],['17:00','in'],['00:30','out',1]],'double','09:00 15:00r 17:00 00:30'],
 [[['09:00','in'],['15:00','out'],['00:30','out',1]],'double','09:00 15:00 17:00r 00:30'],
 [[['09:00','in'],['00:30','out',1]],'double','09:00 ?r ?r 00:30'],
 [[],'none','- - - -']
];
for(const [rows,shift,slots] of T43){const d=day(SAT,rows);assert.equal(d.shift,shift,slots);assert.equal(slotStr(d),slots,slots);assert.equal(d.flags.hasAutoFill,/[wr]/.test(slots),slots)}
check(`هر ${T43.length} ردیف جدول (شامل بدون تردد)`,T43.length===13&&Object.keys(C.SHIFT_TABLE).length===13);
let d=day(SAT,[['17:30','out']]);
check('ورود جاافتاده: بدبینانه = پایان بازهٔ صبح؛ تأخیر از ساعت حضور الزامی',d.slots.s1.time==='12:00'&&d.late===180&&d.explanations[0].text.includes('دیرترین ساعت ممکن (۱۲:۰۰)')&&d.explanations[0].text.startsWith('ورود صبح ثبت نشده بود'));
d=day(SAT,[['09:00','in']]);
check('خروج جاافتاده: بدبینانه = شروع بازهٔ خروج؛ تعجیل تا پایان شیفت',d.slots.s2.time==='12:00'&&d.earlyExit===330&&d.worked===180&&d.explanations[0].text.includes('زودترین ساعت ممکن (۱۲:۰۰)'));
d=day(SAT,[['12:30','out']]);
check('ورود بدبینانه هرگز دیرتر از خروج نیست',d.slots.s1.time==='12:00'&&d.slots.s2.time==='12:30');
const W2=with_({});W2.windows={morning:{from:'06:00',to:'13:00'},midday:{from:'13:00',to:'21:00'},night:{from:'21:00',to:'06:00'}};W2.weekly.forEach(r=>{r.morningEnd='17:30'});
d=day(SAT,[['12:30','in']],W2);
check('خروج بدبینانه هرگز زودتر از ورود نیست (بازه‌ها از تنظیمات)',d.shift==='morning'&&d.slots.s2.time==='13:00'&&d.slots.s1.time==='12:30');
check('ساعت پرشدهٔ بدبینانه همیشه به ضرر پرسنل است',day(SAT,[['09:00','in']]).worked<day(SAT,[['09:00','in'],['12:01','out']]).worked&&day(SAT,[['17:30','out']]).worked<=day(SAT,[['11:59','in'],['17:30','out']]).worked);

console.log('قانون استراحت دوشیفت: هر دو حالت');
d=day(SAT,[['09:00','in'],['18:00','in'],['00:30','out',1]]);
check('استاندارد: خروج استراحت = برگشت − ۲ ساعت',d.slots.s2.time==='16:00'&&d.slots.s2.source==='rest_rule'&&d.restMinutes===120&&d.restOverrun===0&&d.explanations[0].text==='خروج برای استراحت ثبت نشده بود و بر اساس استراحت استاندارد ۲:۰۰ محاسبه شد.');
d=day(SAT,[['09:00','in'],['16:00','out'],['00:30','out',1]]);
check('استاندارد: برگشت = خروج + ۲ ساعت',d.slots.s3.time==='18:00'&&d.explanations[0].text.startsWith('برگشت از استراحت ثبت نشده بود'));
d=day(SAT,[['09:00','in'],['00:30','out',1]]);
check('استاندارد، هر دو جاافتاده: ساعت استراحت «نامشخص» و ۲ ساعت کسر',d.slots.s2.time===null&&d.slots.s3.time===null&&d.restKnown===false&&d.worked===(24*60+30-9*60)-120&&d.workedMorning===null&&d.required===810&&d.explanations[0].text.includes('نامشخص'));
const WC=with_({restFillMode:'worst_case'});
d=day(SAT,[['09:00','in'],['18:00','in'],['00:30','out',1]],WC);
check('بدبینانه: خروج استراحت = شروع بازهٔ میانه',d.slots.s2.time==='12:00'&&d.restMinutes===360&&d.restOverrun===240&&d.explanations[0].text.includes('بدبینانه‌ترین ساعت ممکن (۱۲:۰۰)'));
d=day(SAT,[['09:00','in'],['16:00','out'],['00:30','out',1]],WC);
check('بدبینانه: برگشت = پایان بازهٔ میانه',d.slots.s3.time==='21:00'&&d.restOverrun===180);
d=day(SAT,[['09:00','in'],['00:30','out',1]],WC);
check('بدبینانه، هر دو جاافتاده: ۱۲:۰۰ و ۲۱:۰۰',d.slots.s2.time==='12:00'&&d.slots.s3.time==='21:00'&&d.restKnown===true&&d.restOverrun===420);
d=day(SAT,[['00:30','out',1]],WC,{slots:{s1:'13:00'}});
check('بدبینانه به ساعت‌های موجود محدود می‌شود (خروج استراحت قبل از ورود نیست)',d.shift==='double'&&d.slots.s2.time==='13:00'&&d.slots.s3.time==='21:00');
d=day(SAT,[['09:00','in'],['14:00','out'],['15:30','in'],['00:30','out',1]]);
check('استراحت کوتاه‌تر از استاندارد چیزی اضافه نمی‌کند',d.restMinutes===90&&d.restOverrun===0&&d.overtime.raw===0&&d.deficit===0);

console.log('تلورانس: هر دو حالت');
check('کامل: داخل تلورانس صفر، بیرون از آن کامل از ساعت الزامی',day(SAT,[['09:15','in'],['17:30','out']]).late===0&&day(SAT,[['09:16','in'],['17:30','out']]).late===16&&day(SAT,[['09:20','in'],['17:30','out']]).late===20);
const EX=with_({toleranceMode:'excess'});
check('مازاد: فقط بخش بیش از تلورانس',day(SAT,[['09:15','in'],['17:30','out']],EX).late===0&&day(SAT,[['09:20','in'],['17:30','out']],EX).late===5&&day(SAT,[['16:40','in'],['00:30','out',1]],EX).late===10);
check('ثانیه حذف می‌شود (۰۹:۱۵:۵۹ داخل تلورانس)',day(SAT,[['09:15:59','in'],['17:30','out']]).late===0);
check('تأخیر از ساعت حضور الزامی، نه بازگشایی (جمعه ۰۸:۳۰)',day(FRI,[['08:50','in'],['17:30','out']]).late===20&&day(SAT,[['08:50','in'],['17:30','out']]).late===0);
d=day(SAT,[['09:00','in'],['15:00','out'],['17:00','in'],['00:30','out',1]].map((r,i)=>i===0?['09:40','in']:r));
check('دوشیفت: تأخیر با ورود صبح، بدون انحراف برای خروج صبح/ورود عصر',d.late===40&&d.earlyExit===0&&d.deficit===40);

console.log('مرز روز کاری و پایان پنجشنبه');
const raw=[{id:'a',personnelId:'X',date:'1405/08/05',time:'16:30:00',type:'in'},{id:'b',personnelId:'X',date:'1405/08/06',time:'05:55:00',type:'out'},{id:'c',personnelId:'X',date:'1405/08/06',time:'06:00:00',type:'in'}].map(p=>({...p,businessDate:C.businessDate(p.date,p.time,S0)}));
const m55=C.computeDay({personnelId:'X',businessDate:'1405/08/05',punches:C.punchesFor(raw,'X','1405/08/05'),settings:S0}),m00=C.computeDay({personnelId:'X',businessDate:'1405/08/06',punches:C.punchesFor(raw,'X','1405/08/06'),settings:S0});
check('۰۵:۵۵ خروج همان روز کاری، ۰۶:۰۰ ورود روز بعد',m55.shift==='evening'&&m55.slots.s4.time==='05:55'&&m55.slots.s4.nextDay&&m55.overtime.pending===325&&m00.shift==='morning'&&m00.slots.s1.time==='06:00');
d=day(THU,[['16:30','in'],['01:00','out',1]]);
const fri=day(FRI,[['16:30','in'],['01:00','out',1]]);
check('پنجشنبه پایان ۰۱:۰۰ بدون اضافه‌کار؛ همان ساعت در جمعه ۳۰ دقیقه اضافه‌کار',d.overtime.raw===0&&d.required===510&&fri.overtime.pending===30&&fri.required===480);
check('صبح پنجشنبه حضور ۰۸:۳۰',day(THU,[['08:46','in'],['17:30','out']]).late===16&&day(THU,[['08:45','in'],['17:30','out']]).late===0);
const S2=clone(S0);S2.weekly[5].eveningEnd='02:00';S2.weekly[5].morningArrival='08:00';
check('برنامه از تنظیمات خوانده می‌شود، نه کد',day(THU,[['16:30','in'],['01:00','out',1]],S2).earlyExit===60&&day(THU,[['08:30','in'],['17:30','out']],S2).late===30);

console.log('ادغام ترددهای پشت سر هم');
d=day(SAT,[['09:00','in'],['09:25','in'],['17:30','out']]);
check('ورودهای هم‌نوع داخل ۳۰ دقیقه: زودترین',d.slots.s1.time==='09:00'&&d.slots.s1.source==='merged'&&d.slots.s1.punchIds.length===2&&d.explanations[0].text==='چند ورود پشت سر هم ثبت شده بود؛ به نفع شما زودترین ورود (۰۹:۰۰) مبنا قرار گرفت.');
d=day(SAT,[['16:30','in'],['00:10','out',1],['00:35','out',1]]);
check('خروج‌های هم‌نوع داخل ۳۰ دقیقه: دیرترین (حتی بعد از نیمه‌شب)',d.slots.s4.time==='00:35'&&d.overtime.pending===5&&d.explanations[0].text.includes('دیرترین خروج (۰۰:۳۵)'));
d=day(SAT,[['09:00','in'],['09:10','in'],['09:35','in'],['17:30','out']]);
check('زنجیرهٔ ورودها با فاصلهٔ کمتر از بازه یکی می‌شود',d.slots.s1.time==='09:00'&&d.slots.s1.punchIds.length===3&&!d.flags.needsReview);
d=day(SAT,[['07:00','in'],['09:00','in'],['17:30','out']]);
check('دو ورود صبح با فاصلهٔ بیش از بازه: زودترین + نیاز به بررسی',d.slots.s1.time==='07:00'&&d.flags.needsReview&&d.explanations.some(x=>x.text==='الگوی ترددها غیرعادی است و توسط مدیر بررسی می‌شود.'));
d=day(SAT,[['16:30','in'],['22:00','out'],['00:30','out',1]]);
check('دو خروج شب با فاصلهٔ زیاد: دیرترین + نیاز به بررسی',d.slots.s4.time==='00:30'&&d.flags.needsReview);
d=day(SAT,[['09:00','in'],['17:00','out'],['17:02','in']]);
check('ورود و خروج متضاد داخل ۳ دقیقه: یک تردد در ساعت زودتر',d.shift==='morning'&&d.slots.s2.time==='17:00'&&d.slots.s2.source==='merged'&&d.explanations[0].text==='یک ورود و خروج در فاصله‌ی کمتر از ۳ دقیقه ثبت شده بود و یک تردد حساب شد.');
d=day(SAT,[['09:00','in'],['17:00','out'],['17:04','in']]);
check('متضاد بیرون از بازه ادغام نمی‌شود',d.shift==='double'&&d.slots.s2.time==='17:00'&&d.slots.s3.time==='17:04');
check('تردد ادغام‌شدهٔ نامشخص با دکمه: S1 و S4 هست ← خروج استراحت',(()=>{const x=day(SAT,[['09:00','in'],['16:00','out'],['16:01','in'],['00:30','out',1]]);return x.slots.s2.time==='16:00'&&x.slots.s3.source==='rest_rule'})());
const NM=with_({sameTypeMergeWindowMin:0});
check('بازهٔ ادغام از تنظیمات (صفر = بدون ادغام)',day(SAT,[['09:00','in'],['09:10','in'],['17:30','out']],NM).flags.needsReview);

console.log('دکمه فقط در بازهٔ میانه تعیین‌کننده است');
check('یک تردد میانه، S1 و S4 هست: «ورود» ← S3، «خروج» ← S2',day(SAT,[['09:00','in'],['18:00','in'],['00:30','out',1]]).slots.s3.source==='actual'&&day(SAT,[['09:00','in'],['16:00','out'],['00:30','out',1]]).slots.s2.source==='actual');
check('بدون S1: «ورود» ← S3، «خروج» ← S2',day(SAT,[['16:30','in']]).shift==='evening'&&day(SAT,[['17:30','out']]).shift==='morning');
check('پنجرهٔ صبح همیشه S1 حتی با دکمهٔ خروج',day(SAT,[['09:00','out'],['17:30','out']]).slots.s1.time==='09:00');
d=day(SAT,[['09:00','in'],['13:00','out'],['14:00','in'],['17:30','out']]);
check('سه تردد میانه: اولی S2، آخری S3، نیاز به بررسی',d.slots.s2.time==='13:00'&&d.slots.s3.time==='17:30'&&d.flags.needsReview);

console.log('کارکرد، ساعت موظف و اضافه‌کار');
d=day(SAT,[['09:00','in'],['15:00','out'],['17:00','in'],['00:45','out',1]]);
check('دوشیفت: کارکرد صبح/عصر/کل و موظف (حضور تا پایان عصر منهای استراحت)',d.workedMorning===360&&d.workedEvening===465&&d.worked===825&&d.required=== (24*60+30-540-120)&&d.overtime.pending===15);
check('زودآمدن پیش‌فرض اضافه‌کار نیست؛ با تنظیم حساب می‌شود',day(SAT,[['08:30','in'],['17:30','out']]).overtime.raw===0&&day(SAT,[['08:30','in'],['17:30','out']],with_({earlyArrivalCountsAsOvertime:true})).overtime.pending===30);
check('بدون نیاز به تأیید: اضافه‌کار مستقیم تأییدشده',(()=>{const x=day(SAT,[['09:00','in'],['18:00','out']],with_({overtimeRequiresApproval:false}));return x.overtime.approved===30&&x.overtime.pending===0&&!x.flags.hasPendingOvertime})());
const otRows=[['09:00','in'],['18:00','out']];
check('تأیید کامل، جزئی و رد اضافه‌کار',day(SAT,otRows,S0,{overtime:{decision:'approve'}}).overtime.approved===30&&day(SAT,otRows,S0,{overtime:{decision:'partial',minutes:'20'}}).overtime.approved===20&&day(SAT,otRows,S0,{overtime:{decision:'partial',minutes:90}}).overtime.approved===30&&day(SAT,otRows,S0,{overtime:{decision:'reject',note:'بدون هماهنگی'}}).overtime.approved===0&&day(SAT,otRows,S0,{overtime:{decision:'reject'}}).overtime.status==='rejected'&&day(SAT,otRows).overtime.status==='pending');

console.log('لایهٔ اصلاح مدیر (override)');
const base=P(SAT,[['09:05','in'],['09:40','in'],['17:30','out']]);
let x=C.computeDay({personnelId:'X',businessDate:SAT,punches:base,settings:S0,override:{deletedPunchIds:[base[0].id],note:'پانچ اشتباه'}});
check('حذف تردد: فقط در محاسبه؛ ترددهای خام دست نمی‌خورند',x.slots.s1.time==='09:40'&&x.late===40&&x.flags.manuallyEdited&&base.length===3&&x.explanations[0].text==='توسط مدیر اصلاح شد: پانچ اشتباه');
x=C.computeDay({personnelId:'X',businessDate:SAT,punches:P(SAT,[['09:00','in']]),settings:S0,override:{addedPunches:[{id:'M1',time:'17:45',type:'out'}]}});
check('افزودن تردد با منبع «اصلاح مدیر»',x.slots.s2.time==='17:45'&&x.slots.s2.source==='manual'&&!x.flags.hasAutoFill&&x.overtime.pending===15);
x=C.computeDay({personnelId:'X',businessDate:SAT,punches:P(SAT,[['09:05','in']]),settings:S0,override:{slots:{s2:'18:00'}}});
check('تغییر ساعت: جای مقدار بدبینانه را می‌گیرد و توضیح خودکار حذف می‌شود',x.slots.s2.time==='18:00'&&x.slots.s2.source==='manual'&&!x.flags.hasAutoFill&&x.explanations.length===1&&x.explanations[0].text==='توسط مدیر اصلاح شد');
x=C.computeDay({personnelId:'X',businessDate:SAT,punches:P(SAT,[['16:30','in']]),settings:S0,override:{slots:{s4:'01:15'}}});
check('ساعت دستی بعد از نیمه‌شب روی روز کاری درست قرار می‌گیرد',x.slots.s4.nextDay&&x.slots.s4.minute===1515&&x.overtime.pending===45);
x=C.computeDay({personnelId:'X',businessDate:SAT,punches:P(SAT,[['09:00','in'],['13:00','out'],['14:00','in'],['17:30','out']]),settings:S0,override:{slots:{s2:'17:30',s3:'',s4:''}}});
check('پاک‌کردن ساعت و رفع «نیاز به بررسی» با اصلاح مدیر',x.shift==='morning'&&!x.flags.needsReview&&x.slots.s3===null);
x=C.computeDay({personnelId:'X',businessDate:SAT,punches:[],settings:S0,override:{status:'leave_sick'}});
check('وضعیت روز بدون تردد',x.status==='leave_sick'&&x.statusLabel==='مرخصی استعلاجی'&&x.flags.manuallyEdited&&day(SAT,[]).statusLabel==='تعیین‌نشده');
const ovs=[{id:'O1',personnelId:'X',businessDate:'1405/08/05',status:'absent'},{id:'O2',personnelId:'Y',businessDate:'1405/08/06',status:'off'}];
const month=C.computeMonth({punches:[...P('1405/08/02',[['09:00','in'],['17:30','out']]),...P('1405/08/30',[['16:30','in'],['00:30','out',1]])],overrides:ovs,settings:S0,personnelId:'X',year:1405,month:8});
check('ماه کامل با روزهای بدون تردد و override همان نفر',month.length===30&&month[0].businessDate==='1405/08/01'&&month[1].shift==='morning'&&month[4].status==='absent'&&month[5].status==='undetermined'&&month[29].shift==='evening'&&month.filter(d=>d.status==='undetermined').length===27);

console.log('خلوص و قطعیت');
const frozen=P(SAT,[['09:00','in'],['09:10','in'],['17:30','out']]),before=JSON.stringify(frozen),setBefore=JSON.stringify(S0),o={slots:{s2:'18:00'},overtime:{decision:'partial',minutes:10}},oBefore=JSON.stringify(o);
const r1=C.computeDay({personnelId:'X',businessDate:SAT,punches:frozen,settings:S0,override:o}),r2=C.computeDay({personnelId:'X',businessDate:SAT,punches:frozen.slice().reverse(),settings:S0,override:o});
check('ورودی‌ها تغییر نمی‌کنند و ترتیب ورودی بی‌اثر است',JSON.stringify(frozen)===before&&JSON.stringify(S0)===setBefore&&JSON.stringify(o)===oBefore&&JSON.stringify(r1)===JSON.stringify(r2));
check('همهٔ مدت‌ها عدد صحیح دقیقه‌اند',['worked','required','late','earlyExit','restOverrun','deficit'].every(k=>Number.isInteger(r1[k]))&&Number.isInteger(r1.overtime.approved));
assert.throws(()=>C.computeDay({personnelId:'X',businessDate:SAT,punches:[],settings:{}}),/تنظیمات/);
check('بدون تنظیمات معتبر محاسبه انجام نمی‌شود (پیش‌فرض پنهان نداریم)',true);
check('نمایش ساعت:دقیقه با ارقام فارسی',C.faHM(122)==='۲:۰۲'&&C.faHM(0)==='۰:۰۰'&&C.faClock(1470)==='۰۰:۳۰'&&C.faClock(null)==='نامشخص');
const src=fs.readFileSync('js/50-attendance-core.js','utf8'),engine=src.slice(src.indexOf('/* ---------- Calculation engine'),src.indexOf('const api=')).replace(/\/\*[\s\S]*?\*\//g,'');
check('موتور محاسبه هیچ ساعت شیفتی را در کد ندارد',!/'(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]'/.test(engine)&&!/\b(540|1020|1050|1470|1500)\b/.test(engine));

console.log(`PASS ${passed}: attendance engine — fixture scenarios, shift table, rest modes, tolerance modes, cutoff, Thursday end, merges, overtime approval and overrides`);
