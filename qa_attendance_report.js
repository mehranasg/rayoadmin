'use strict';
// QA: attendance module phase 4 — monthly totals, report from month snapshot, Excel rows, print page and UI wiring.
const fs=require('fs');
const C=require('./js/50-attendance-core.js');

let passed=0;
function check(name,condition){if(!condition)throw new Error(`FAIL: ${name}`);passed++;console.log(`  ✓ ${name}`)}
const clone=x=>JSON.parse(JSON.stringify(x));
const seed=JSON.parse(fs.readFileSync('seed/attendance-data.seed.json','utf8'));
const parsed=C.parseSheets([{name:'x',rows:C.parseCsv(fs.readFileSync('docs/rayo-attendance-sample.punches.csv','utf8'))}]);
const people=['101','102','103','104','105','106'].map(c=>({id:`EMP-${c}`,attendanceCode:c}));
const doc0=C.applyImport(clone(seed),C.planImport({parsed,personnel:people,settings:seed.settings}),{parsed}).doc;
const rep=(doc,pid,today='1405/08/07')=>C.monthReport({doc,personnelId:pid,year:1405,month:8,today});

console.log('جمع ماهانه (fixture)');
let r=rep(doc0,'EMP-101'),t=r.totals;
check('۱۰۱: کارکرد، تأخیر، تعجیل، کسر کار، اضافه‌کار در انتظار',r.source==='live'&&t.late===180&&t.earlyExit===420&&t.deficit===600&&t.pendingOvertime===5&&t.approvedOvertime===0&&t.net===-600&&t.worked===2511&&t.required===3120);
check('۱۰۱: شیفت‌ها و روزها',t.shifts===6&&t.presentDays===6&&t.singleShiftDays===6&&t.doubleShiftDays===0&&t.undetermined===1&&t.autoFilledDays===2&&t.days===30);
t=rep(doc0,'EMP-103').totals;
check('۱۰۳: دوشیفت = ۲ شیفت؛ کسر کار از استراحت طولانی',t.doubleShiftDays===4&&t.singleShiftDays===1&&t.shifts===9&&t.restOverrun===62&&t.deficit===62);
check('تعیین‌نشده فقط تا امروز',rep(doc0,'EMP-106','1405/08/07').totals.undetermined===3&&rep(doc0,'EMP-106','1405/08/30').totals.undetermined===26&&rep(doc0,'EMP-106','').totals.undetermined===26);
check('جمع کل = مجموع روزها',(()=>{const x=rep(doc0,'EMP-105');return x.totals.worked===x.days.reduce((s,d)=>s+d.worked,0)&&x.totals.deficit===x.days.reduce((s,d)=>s+d.deficit,0)})());

console.log('گزارش از snapshot ماه ذخیره‌شده');
const drafts={'1405/08/05':{status:'absent'},'1405/08/08':{status:'off'},'1405/08/09':{status:'leave_entitled'},'1405/08/10':{status:'leave_sick'},'1405/08/01':{overtime:{decision:'partial',minutes:3}},'1405/08/02':{slots:{s2:'17:30'}}};
let doc=C.applyMonthSave(doc0,{personnelId:'EMP-101',year:1405,month:8,drafts,base:{},user:'مدیر',at:'2026-10-29T08:00:00Z'}).doc;
r=rep(doc,'EMP-101','1405/08/30');t=r.totals;
check('گزارش از snapshot و وضعیت‌ها شمرده می‌شوند',r.source==='saved'&&r.save.id==='ATM-00001'&&t.absent===1&&t.off===1&&t.leaveEntitled===1&&t.leaveSick===1&&t.presentDays===6&&t.undetermined===20);
check('اضافه‌کار تأییدشدهٔ جزئی و خالص',t.approvedOvertime===3&&t.pendingOvertime===0&&t.net===3-t.deficit&&t.manuallyEditedDays===5);
check('اصلاح ساعت در جمع اثر دارد (تعجیل ۰۸/۰۲ حذف شد)',t.earlyExit===90&&t.autoFilledDays===1);
const changedRules=clone(doc);changedRules.settings.weekly.forEach(w=>{w.morningLateToleranceMin=0});
check('تغییر تنظیمات بعدی گزارش ماه ذخیره‌شده را عوض نمی‌کند',rep(changedRules,'EMP-101','1405/08/30').totals.late===t.late&&rep(changedRules,'EMP-102','1405/08/30').source==='live');
const lateDoc=clone(doc);lateDoc.punches.push({id:'L',personnelId:'EMP-101',date:'1405/08/11',time:'09:00:00',type:'in',businessDate:'1405/08/11'});
r=rep(lateDoc,'EMP-101','1405/08/30');
check('ترددِ پس از ذخیره: گزارش همان snapshot + اعلام تغییر',r.source==='saved'&&r.totals.presentDays===6&&r.changedSinceSave.join()==='1405/08/11');

console.log('ردیف‌های Excel');
const rows=C.exportDayRows(rep(doc0,'EMP-103').days);
check('سرستون و ۳۰ روز با تعداد ستون یکسان',rows.length===31&&rows.every(x=>x.length===rows[0].length)&&rows[0][0]==='روز کاری'&&rows[0].includes('توضیح'));
check('مقادیر فارسی، منبع ساعت و روز بعد',rows[1][0]==='۱۴۰۵/۰۸/۰۱'&&rows[1][1]==='جمعه'&&rows[1][3]==='دوشیفت'&&rows[1][10]==='۰۰:۳۰ (+۱)'&&rows[2][6]==='نامشخص'&&rows[2][7]==='قانون استراحت'&&rows[2][rows[0].indexOf('توضیح')].includes('نامشخص'));
const tr=C.exportTotalsRows(rep(doc0,'EMP-101').totals);
check('ردیف‌های جمع با برچسب فارسی',tr.length===C.TOTAL_COLUMNS.length&&tr[0][0]==='کارکرد'&&tr.find(x=>x[0]==='تأخیر')[1]==='۳:۰۰'&&tr.find(x=>x[0]==='تعداد شیفت')[1]==='۶');
const sr=C.exportSummaryRows(people.map(p=>rep(doc,p.id)),id=>`نام ${id}`);
check('خلاصهٔ همهٔ پرسنل با وضعیت ذخیره',sr.length===7&&sr[0][1]==='وضعیت ذخیره'&&sr[1][0]==='نام EMP-101'&&sr[1][1]==='ذخیره‌شده'&&sr[2][1]==='ذخیره‌نشده'&&sr.every(x=>x.length===sr[0].length));

console.log('سیم‌کشی UI و صفحهٔ چاپ');
const ui=fs.readFileSync('js/51-attendance-admin.js','utf8'),shell=fs.readFileSync('js/16-mpa-shell.js','utf8'),polish=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
check('صفحهٔ گزارش، مسیر و منو',ui.includes('views.attendanceReport=reportView')&&shell.includes("'attendanceReport'")&&polish.includes('personnel.html?view=attendanceReport'));
check('گزارش فقط از monthReport (snapshot یا پیش‌نمایش برچسب‌دار) و بدون ذخیره',ui.includes('C().monthReport(')&&ui.includes('ذخیره‌نشده (پیش‌نمایش زنده)')&&!/function (reportView|printReport|exportReport|exportSummary)[\s\S]{0,1500}writeAttendance/.test(ui));
check('خروجی Excel از RayoExcel.exportRows برای لیست، گزارش فرد و خلاصه',(ui.match(/RayoExcel\.exportRows\(/g)||[]).length===3);
check('صفحهٔ چاپ RTL با IRANSansX، توضیح روزانه و امضا',/function printReport[\s\S]*dir="rtl"[\s\S]*IRANSansX[\s\S]*dayTable\(r\.days\)[\s\S]*امضای پرسنل/.test(ui)&&/function dayTable[\s\S]*class="exp"/.test(ui));

console.log(`PASS ${passed}: attendance report — totals, saved snapshot vs live preview, statuses, approved overtime/net, Excel rows and print wiring`);
