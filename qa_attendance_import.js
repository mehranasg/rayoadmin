'use strict';
// QA: attendance module phase 1 — data model, rules settings and punch importer (js/50 core, js/51 admin wiring).
const fs=require('fs');
const assert=require('assert');
const C=require('./js/50-attendance-core.js');

let passed=0;
function check(name,condition){if(!condition)throw new Error(`FAIL: ${name}`);passed++;console.log(`  ✓ ${name}`)}
const clone=x=>JSON.parse(JSON.stringify(x));
const seed=JSON.parse(fs.readFileSync('seed/attendance-data.seed.json','utf8'));
const S0=seed.settings;
const fixture=name=>fs.readFileSync(`docs/rayo-attendance-sample.${name}.csv`,'utf8');

console.log('تقویم شمسی و روز هفته');
check('شمسی ↔ میلادی',C.j2g(1405,1,1).join('-')==='2026-3-21'&&C.j2g(1405,8,1).join('-')==='2026-10-23'&&C.g2j(2026,10,23).join('/')==='1405/8/1');
check('رفت‌وبرگشت همهٔ روزهای ۱۴۰۰ تا ۱۴۱۰',(()=>{for(let y=1400;y<=1410;y++)for(let m=1;m<=12;m++)for(let d=1;d<=C.monthLength(y,m);d++){const g=C.j2g(y,m,d),j=C.g2j(...g);if(j[0]!==y||j[1]!==m||j[2]!==d)return false}return true})());
check('سال کبیسه: ۱۴۰۳/۱۲/۳۰ معتبر، ۱۴۰۴/۱۲/۳۰ نامعتبر',C.validJalali(1403,12,30)&&!C.validJalali(1404,12,30)&&C.monthLength(1404,12)===29);
check('جمع و تفریق روز از مرز ماه و سال',C.addDays('1405/06/31',1)==='1405/07/01'&&C.addDays('1405/01/01',-1)==='1404/12/29'&&C.addDays('1405/08/02',-1)==='1405/08/01');
check('روز هفتهٔ شمسی (۰ = شنبه)',C.weekdayIndex('1405/08/01')===6&&C.weekdayName('1405/08/01')==='جمعه'&&C.weekdayName('1405/08/02')==='شنبه'&&C.weekdayIndex('1405/08/07')===5);
check('روزهای ماه',C.monthDays(1405,8).length===30&&C.monthDays(1405,1).length===31&&C.monthDays(1405,8)[0]==='1405/08/01');
check('زمان تهران با منطقهٔ زمانی ثابت +03:30',C.isoTimestamp('1405/08/02','00:32:22')==='2026-10-24T00:32:22+03:30'&&C.tehranOffset('1400/03/01')==='+04:30');

console.log('خواندن مقدار سلول');
check('ساعت متنی با ثانیه، بدون ثانیه و ارقام فارسی/عربی',C.parseClock('08:25:12')==='08:25:12'&&C.parseClock('۰۸:۲۵')==='08:25:00'&&C.parseClock('٠٩:٠٥:٠٣')==='09:05:03'&&C.parseClock('8:5')==='08:05:00');
check('ساعت Excel (کسر روز و سلول قالب‌دار)',C.parseClock(0.5)==='12:00:00'&&C.parseClock({__serial:46318.354224537})==='08:30:05'&&C.parseClock(new Date(2026,0,1,17,2,30))==='17:02:30');
check('ساعت نامعتبر',C.parseClock('25:00')===''&&C.parseClock('ساعت')===''&&C.parseClock('—')===''&&C.parseClock(1.5)==='');
check('تاریخ شمسی متنی با ارقام فارسی و تک‌رقمی',C.parseDate('1405/08/01')==='1405/08/01'&&C.parseDate('۱۴۰۵/۸/۱')==='1405/08/01'&&C.parseDate('1405-08-01')==='1405/08/01');
check('تاریخ با نام ماه (خروجی فعلی دستگاه)',C.parseDate('۵ آبان ۱۴۰۵')==='1405/08/05'&&C.parseDate('12 اسفند 1404')==='1404/12/12');
check('تاریخ Excel و میلادی به شمسی',C.parseDate({__serial:46318})==='1405/08/01'&&C.parseDate(46318)==='1405/08/01'&&C.parseDate('2026-10-23')==='1405/08/01');
check('تاریخ نامعتبر رد می‌شود',C.parseDate('1405/13/01')===''&&C.parseDate('1404/12/30')===''&&C.parseDate('2026-02-30')===''&&C.parseDate('abc')==='');
check('نوع تردد',C.parseType('ورود')==='in'&&C.parseType(' خروج ')==='out'&&C.parseType('IN')==='in'&&C.parseType('ورود؟')==='');
check('کد پرسنلی عددی/فارسی',C.parseCode(101)==='101'&&C.parseCode('۱۰۱')==='101'&&C.parseCode('101.0')==='101'&&C.parseCode('  ')==='');

console.log('تنظیمات');
check('تنظیمات پیش‌فرض فایل مقداردهی اولیه معتبر است',C.validateSettings(S0).length===0);
check('برنامهٔ پیش‌فرض: پنجشنبه حضور ۰۸:۳۰ و پایان ۰۱:۰۰، شنبه حضور ۰۹:۰۰',C.scheduleFor('1405/08/07',S0).morningArrival==='08:30'&&C.scheduleFor('1405/08/07',S0).eveningEnd==='01:00'&&C.scheduleFor('1405/08/02',S0).morningArrival==='09:00'&&C.scheduleFor('1405/08/01',S0).morningArrival==='08:30');
let bad=clone(S0);bad.windows.midday.to='20:00';
check('شکاف بین بازه‌ها گزارش می‌شود',C.validateSettings(bad).some(e=>e.includes('پوشش')));
bad=clone(S0);bad.windows.morning.to='13:00';
check('هم‌پوشانی بازه‌ها گزارش می‌شود',C.validateSettings(bad).some(e=>e.includes('هم‌پوشانی')));
bad=clone(S0);bad.businessDayCutoff='05:00';
check('مرز روز کاری باید پایان بازهٔ شب باشد',C.validateSettings(bad).some(e=>e.includes('مرز روز کاری')));
bad=clone(S0);bad.weekly[5].eveningEnd='20:30';bad.weekly[0].morningArrival='13:00';
check('ساعت هر روز باید داخل بازهٔ درست باشد',C.validateSettings(bad).filter(e=>e.includes('باید داخل')).length===2&&C.validateSettings(bad).some(e=>e.startsWith('پنجشنبه — پایان شیفت عصر')));
bad=clone(S0);bad.weekly.pop();bad.weekly[0].morningLateToleranceMin='۱۵';bad.toleranceMode='x';bad.standardRestMin=-1;
const badErrs=C.validateSettings(bad);
check('روز ناقص، تلورانس غیرعددی، حالت نامعتبر',badErrs.some(e=>e.includes('یک ردیف برای هر روز'))&&badErrs.some(e=>e.includes('تلورانس تأخیر صبح'))&&badErrs.some(e=>e.includes('نحوه‌ی محاسبه‌ی تأخیر'))&&badErrs.some(e=>e.includes('استراحت استاندارد')));
check('تنظیمات خالی معتبر نیست (پیش‌فرض خودکار نداریم)',C.validateSettings({}).length>5&&C.validateSettings(null).length===1);

console.log('روز کاری');
check('مرز ۰۶:۰۰: ساعت ۰۵:۵۵ روز قبل، ۰۶:۰۰ همان روز',C.businessDate('1405/08/06','05:55:02',S0)==='1405/08/05'&&C.businessDate('1405/08/06','06:00:00',S0)==='1405/08/06');
check('خروج ۰۰:۳۲ تاریخ ۰۸/۰۲ جزو روز کاری ۰۸/۰۱',C.businessDate('1405/08/02','00:32:22',S0)==='1405/08/01');
check('مرز روز کاری از تنظیمات خوانده می‌شود',C.businessDate('1405/08/06','05:30:00',{...S0,businessDayCutoff:'05:00'})==='1405/08/06');
check('خروج ۰۱:۰۰ بامداد جمعه، روز کاری پنجشنبه با برنامهٔ پنجشنبه',C.businessDate('1405/08/08','01:00:14',S0)==='1405/08/07'&&C.scheduleFor(C.businessDate('1405/08/08','01:00:14',S0),S0).eveningEnd==='01:00');

console.log('ورود فایل: قالب رایو (fixture)');
const parsed=C.parseSheets([{name:'ترددها',rows:C.parseCsv(fixture('punches'))}]);
check('قالب و تعداد ردیف‌ها',parsed.adapter==='rayo-punch-v1'&&parsed.rowsRead===77&&parsed.candidates.length===77&&parsed.rejected.length===0&&parsed.headerRow===1);
check('ردیف اول درست خوانده شد',(()=>{const c=parsed.candidates[0];return c.row===2&&c.code==='101'&&c.name==='علی رضایی'&&c.date==='1405/08/01'&&c.time==='08:25:12'&&c.type==='in'&&c.method==='چهره'&&c.deviceCode==='DEV-01'})());
check('برگه‌های راهنما با سرستون دیگر انتخاب نمی‌شوند',C.parseSheets([{name:'راهنمای فرمت',rows:C.parseCsv(fixture('format-guide'))},{name:'ترددها',rows:C.parseCsv(fixture('punches'))}]).sheetName==='ترددها');
const csvRows=C.parseCsv(fixture('punches')),order=[6,3,0,5,2,4,1],shuffled=csvRows.map(r=>order.map(i=>r[i]));
const p2=C.parseSheets([{name:'x',rows:shuffled}]);
check('ستون‌ها با متن سرستون پیدا می‌شوند، نه جایگاه',p2.candidates.length===77&&JSON.stringify(p2.candidates[5])===JSON.stringify(parsed.candidates[5]));
const messy=[['کد پرسنلی','نام و نام خانوادگی','تاریخ','ساعت','نوع تردد','روش ثبت'],['','','','','',''],['','گزارش تردد کل','','','',''],['101','علی','1405/08/01','08:00','ورود','چهره'],['102','سارا','1405/13/01','08:00','ورود','چهره'],['103','رضا','1405/08/01','28:00','خروج','چهره'],['104','نیما','1405/08/01','08:00','ورود؟',''],['105','','1405/08/01','08:00','خروج','دستی'],['','','','جمع','','']];
const pm=C.parseSheets([{name:'x',rows:messy}]);
check('ردیف خالی و بدون کد نادیده گرفته می‌شود',pm.ignored.empty===1&&pm.ignored.noCode===2&&pm.candidates.length===1);
check('ردیف نامعتبر با شمارهٔ ردیف و علت رد می‌شود',pm.rejected.length===4&&pm.rejected[0].row===5&&pm.rejected[0].reason.includes('تاریخ')&&pm.rejected[1].reason.includes('ساعت')&&pm.rejected[2].reason.includes('نوع تردد')&&pm.rejected[2].reason.includes('روش ثبت')&&pm.rejected[3].reason.includes('نام'));
assert.throws(()=>C.parseSheets([{name:'x',rows:[['کد پرسنلی','نام و نام خانوادگی','تاریخ','ساعت']]}]),/نوع تردد/);
check('ستون الزامی ناموجود خطای روشن می‌دهد',true);
assert.throws(()=>C.parseSheets([{name:'x',rows:[['a','b']]}]),/شناخته نشد/);
check('فایل بی‌ربط رد می‌شود',true);
/* Excel cells: date and time stored as real date/time values, codes as numbers. */
function fakeXLSX(){const col=c=>String.fromCharCode(65+c);return{utils:{decode_range:ref=>{const [a,b]=ref.split(':'),p=s=>({c:s.charCodeAt(0)-65,r:+s.slice(1)-1});return{s:p(a),e:p(b)}},encode_cell:({r,c})=>`${col(c)}${r+1}`},SSF:{is_date:z=>/[ymdhs]/i.test(z)&&!/^General$/i.test(z)}}}
const ws={'!ref':'A1:F2',A1:{t:'s',v:'کد پرسنلی'},B1:{t:'s',v:'نام و نام خانوادگی'},C1:{t:'s',v:'تاریخ'},D1:{t:'s',v:'ساعت'},E1:{t:'s',v:'نوع تردد'},F1:{t:'s',v:'روش ثبت'},A2:{t:'n',v:101},B2:{t:'s',v:'علی'},C2:{t:'n',v:46318,z:'yyyy-mm-dd'},D2:{t:'n',v:0.354224537,z:'hh:mm:ss'},E2:{t:'s',v:'ورود'},F2:{t:'s',v:'چهره'}};
const px=C.parseSheets([{name:'x',rows:C.sheetRows(fakeXLSX(),ws)}]);
check('سلول تاریخ/ساعت واقعی Excel',px.candidates.length===1&&px.candidates[0].code==='101'&&px.candidates[0].date==='1405/08/01'&&px.candidates[0].time==='08:30:05');

console.log('ورود فایل: خروجی فعلی دستگاه (آداپتور دوم)');
const vendor=[['گزارش کارکرد'],['کارمند','تاریخ','ورود','خروج','کارکرد','ثبت'],['علی رضایی (101)','۵ آبان ۱۴۰۵','08:25','17:35','9:10','چهره'],['101','۶ آبان ۱۴۰۵','16:30','00:32','8:02','چهره'],['101','۷ آبان ۱۴۰۵','—','00:30','—','دستی'],['101','۸ آبان ۱۴۰۵','—','—','—',''],['جمع','','','','17:12','']];
const pv=C.parseSheets([{name:'x',rows:vendor}]);
check('تشخیص آداپتور و جدا کردن جفت به دو تردد',pv.adapter==='vendor-paired-v1'&&pv.candidates.length===5&&pv.candidates[0].code==='101'&&pv.candidates[0].name==='علی رضایی'&&pv.candidates[0].type==='in'&&pv.candidates[1].type==='out');
check('خروج زودتر از ورود = روز تقویمی بعد',pv.candidates[3].date==='1405/08/07'&&pv.candidates[3].time==='00:32:00'&&C.businessDate(pv.candidates[3].date,pv.candidates[3].time,S0)==='1405/08/06');
check('«—» خالی، ردیف جمع و ردیف بدون ساعت نادیده',pv.candidates[4].type==='out'&&pv.candidates[4].date==='1405/08/07'&&pv.ignored.total===1&&pv.ignored.noPunch===1);
check('نام بدون کد کلید موقت می‌گیرد تا مدیر نگاشت کند',C.splitEmployee('مریم حسینی').code==='name:مریم حسینی'&&C.splitEmployee('105 - مریم').code==='105');

console.log('کد ناشناخته، تکراری و ورود دوباره');
const people=[{id:'EMP-0001',name:'علی رضایی',attendanceCode:'101'},{id:'EMP-0002',name:'سارا محمدی',attendanceCode:'102'},{id:'EMP-0003',name:'رضا کریمی',attendanceCode:'103'},{id:'EMP-0004',name:'نیما احمدی',attendanceCode:'104'},{id:'EMP-0005',name:'مریم حسینی'},{id:'EMP-0006',name:'امیر'}];
const unknown=C.unknownCodes(parsed.candidates,people,{106:'EMP-0006'});
check('کدهای ناشناخته با تعداد و پیشنهاد (نام یکسان / نگاشت قدیمی)',unknown.length===2&&unknown[0].code==='105'&&unknown[0].suggestion==='EMP-0005'&&unknown[1].code==='106'&&unknown[1].suggestion==='EMP-0006'&&unknown[0].rows===16&&unknown[1].rows===10);
let plan=C.planImport({parsed,existingPunches:[],personnel:people,mapping:{},settings:S0});
check('بدون نگاشت، ترددهای کد ناشناخته وارد نمی‌شوند',plan.fresh.length===77-unknown.reduce((s,u)=>s+u.rows,0)&&plan.unmapped.length===unknown.reduce((s,u)=>s+u.rows,0));
const mapped=people.map(p=>p.id==='EMP-0005'?{...p,attendanceCode:'105'}:p.id==='EMP-0006'?{...p,attendanceCode:'106'}:p);
plan=C.planImport({parsed,existingPunches:[],personnel:mapped,settings:S0});
check('همه نگاشت شدند: ۷۷ تردد جدید و بازهٔ تاریخ',plan.fresh.length===77&&plan.duplicates.length===0&&plan.dateRange.from==='1405/08/01'&&plan.dateRange.to==='1405/08/08'&&plan.businessRange.to==='1405/08/07');
const doc0={...clone(seed),overrides:[{id:'OVR-1',personnelId:'EMP-0001',businessDate:'1405/08/01',note:'manual'}],punches:[]};
const r1=C.applyImport(doc0,plan,{parsed,fileName:'a.xlsx',user:'qa',at:'2026-10-28T10:00:00Z'});
check('ثبت ترددها با شناسه، زمان مستقل از روز کاری و دستهٔ ورود',r1.doc.punches.length===77&&r1.doc.punches[0].id==='ATP-0000001'&&r1.doc.punches[0].ts==='2026-10-23T08:25:12+03:30'&&r1.batchId==='ATB-00001'&&r1.doc.importBatches[0].newCount===77);
check('سند ورودی تغییر نمی‌کند و اصلاحات مدیر دست نمی‌خورد',doc0.punches.length===0&&JSON.stringify(r1.doc.overrides)===JSON.stringify(doc0.overrides));
const again=C.planImport({parsed,existingPunches:r1.doc.punches,personnel:mapped,settings:S0});
check('ورود دوبارهٔ همان فایل هیچ تردد تکراری نمی‌سازد',again.fresh.length===0&&again.duplicates.length===77);
const overlapRows=[csvRows[0],...csvRows.slice(60),['101','علی رضایی','1405/08/08','08:30:00','ورود','چهره',''],['101','علی رضایی','1405/08/08','08:30:00','ورود','چهره','']];
const pOverlap=C.parseSheets([{name:'x',rows:overlapRows}]);
const r2plan=C.planImport({parsed:pOverlap,existingPunches:r1.doc.punches,personnel:mapped,settings:S0});
check('فایل هم‌پوشان: فقط ترددهای تازه، تکرار داخل خود فایل هم یکی می‌شود',r2plan.fresh.length===1&&r2plan.duplicates.length===19&&r2plan.affectedDays.length===1&&r2plan.affectedDays[0].businessDate==='1405/08/08');
const r2=C.applyImport(r1.doc,r2plan,{parsed:pOverlap,fileName:'b.csv',user:'qa'});
check('ترددهای قبلی بدون تغییر می‌مانند و شناسه ادامه پیدا می‌کند',JSON.stringify(r2.doc.punches.slice(0,77))===JSON.stringify(r1.doc.punches)&&r2.doc.punches[77].id==='ATP-0000078'&&r2.batchId==='ATB-00002');

console.log('سناریوهای تست (گروه‌بندی روز کاری)');
const scen=C.parseCsv(fixture('test-scenarios')).slice(1).filter(r=>/^\d{4}\/\d{2}\/\d{2}/.test(r[0]||''));
const idOf=Object.fromEntries(mapped.map(p=>[p.attendanceCode,p.id]));
let okRows=0;
for(const row of scen){const [date,day]=row[0].split(' '),list=C.punchesFor(r1.doc.punches,idOf[row[1]],date),none=row[2]==='بدون تردد';assert.equal(C.weekdayName(date),day,`weekday ${row[0]}`);assert(none?list.length===0:list.length>0,`${row[0]} ${row[1]} ${row[2]}`);okRows++}
check(`روز هفته و وجود تردد برای هر ${scen.length} سناریو`,okRows===scen.length&&scen.length===31);
check('۱۰۲ روز ۰۸/۰۵: خروج ۰۵:۵۵ بامداد ۰۸/۰۶ داخل همان روز کاری',C.punchesFor(r1.doc.punches,'EMP-0002','1405/08/05').map(p=>p.time).join()==='16:30:19,05:55:02');
check('۱۰۵ روز ۰۸/۰۱: دو خروج بعد از نیمه‌شب جزو روز ۰۸/۰۱',C.punchesFor(r1.doc.punches,'EMP-0005','1405/08/01').length===3);
check('۱۰۵ پنجشنبه ۰۸/۰۷: خروج ۰۱:۲۰ جمعه',C.punchesFor(r1.doc.punches,'EMP-0005','1405/08/07').slice(-1)[0].time==='01:20:48');
check('۱۰۵ روز ۰۸/۰۴: سه پانچ میانه',C.punchesFor(r1.doc.punches,'EMP-0005','1405/08/04').length===4);

console.log('سیم‌کشی ماژول و ایمنی داده');
const config=fs.readFileSync('js/config.js','utf8'),admin=fs.readFileSync('js/51-attendance-admin.js','utf8'),page=fs.readFileSync('personnel.html','utf8'),shell=fs.readFileSync('js/16-mpa-shell.js','utf8'),polish=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8'),backup=fs.readFileSync('js/38-data-safety-backup-v10-7.js','utf8'),init=fs.readFileSync('js/39-manual-initial-data-v10-8.js','utf8'),cs=fs.readFileSync('backend-prefrence/RayoDataController.optimized.cs','utf8');
check('ماژول attendance در Gateway و Controller مرجع',/attendance:'attendance'/.test(config)&&config.includes("attendance:{arrays:['punches','importBatches','overrides','monthSaves','auditLog','changeLog'],objects:['meta','settings']}")&&cs.includes('["attendance"] = "attendance-data.json"'));
check('قانون شیفت در MODULE_DEFAULTS نیست (فقط فایل مقداردهی اولیه)',/attendance:\{\s*meta:[^\n]*\n\s*settings:\{\},punches:\[\]/.test(config.replace(/\r/g,''))&&!/morningArrival|businessDayCutoff/.test(config));
check('مقداردهی اولیه فقط از مسیر صریح مدیر؛ بازنشانی جداول ۱۰ بخش قبلی را نگه می‌دارد',init.includes("const INIT_MODULES={...MODULES,attendance:'حضور و غیاب'}")&&init.includes('Object.entries(INIT_MODULES)')&&!/const MODULES=\{[^}]*attendance/.test(init));
check('بکاپ کامل فقط وقتی attendance هنوز روی سرور ساخته نشده آن را رد می‌کند',backup.includes("OPTIONAL_BACKUP=new Set(['attendance'])")&&backup.includes('notCreatedModules:skipped'));
check('صفحهٔ پرسنل، مسیرها و منو',page.includes('js/50-attendance-core.js?v=')&&page.indexOf('50-attendance-core.js')<page.indexOf('51-attendance-admin.js')&&shell.includes("'attendanceImport','attendanceSettings'")&&polish.includes("personnel.html?view=attendanceImport")&&polish.includes("personnel.html?view=attendanceSettings"));
check('هر ذخیره: Load زنده، بررسی مقداردهی، Save با تأیید سرور',/async function writeAttendance[\s\S]*?loadModule\('attendance'\)[\s\S]*?initialized!==true[\s\S]*?saveModule\('attendance',next\)/.test(admin)&&(admin.match(/saveModule\(/g)||[]).length===1);
check('UI هیچ Seed یا پیش‌فرضی نمی‌نویسد',!/seed|MODULE_DEFAULTS|loadSeedFile|allowInitialize|allowSeedWrite/i.test(admin));
check('ورود: برنامه روی سند زندهٔ سرور دوباره ساخته می‌شود',/writeAttendance\(doc=>\{const pl=C\(\)\.planImport\(\{parsed,existingPunches:doc\.punches/.test(admin));
check('تنظیمات: تغییر هم‌زمان کاربر دیگر رد و در auditLog ثبت می‌شود',admin.includes('JSON.stringify(doc.settings||{})!==draftBase')&&admin.includes("kind:'settings',changes"));
check('کد ناشناخته بدون تصمیم صریح مدیر ثبت نمی‌شود',admin.includes('برای کد ${F(u.code)} تصمیم گرفته نشده است')&&admin.includes("if(!ok){state.personnel=hrBackup;throw"));

console.log(`PASS ${passed}: attendance calendar, settings validation, punch import adapters, business day, dedup/re-import, fixture scenarios and module wiring`);
