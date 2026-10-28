'use strict';
// QA: attendance module phase 3 — manager override layer, month save (snapshot + frozen settings), audit log, attention list, UI wiring.
const fs=require('fs');
const assert=require('assert');
const C=require('./js/50-attendance-core.js');

let passed=0;
function check(name,condition){if(!condition)throw new Error(`FAIL: ${name}`);passed++;console.log(`  ✓ ${name}`)}
const clone=x=>JSON.parse(JSON.stringify(x));
const seed=JSON.parse(fs.readFileSync('seed/attendance-data.seed.json','utf8'));
const parsed=C.parseSheets([{name:'x',rows:C.parseCsv(fs.readFileSync('docs/rayo-attendance-sample.punches.csv','utf8'))}]);
const people=['101','102','103','104','105','106'].map(c=>({id:`EMP-${c}`,attendanceCode:c}));
const base0=C.applyImport(clone(seed),C.planImport({parsed,personnel:people,settings:seed.settings}),{parsed,user:'qa'}).doc;
const AT='2026-10-29T08:00:00.000Z',AT2='2026-10-30T08:00:00.000Z';
const save=(doc,opts)=>C.applyMonthSave(doc,{personnelId:'EMP-101',year:1405,month:8,user:'مدیر',at:AT,...opts});

console.log('پاک‌سازی و امضای override');
check('فیلدهای خالی حذف و نتیجهٔ خالی = null',C.cleanOverride({slots:{},note:' ',deletedPunchIds:[],overtime:{decision:''}})===null&&C.cleanOverride(null)===null);
check('ساعت با ارقام فارسی نرمال و ساعت نامعتبر حذف می‌شود؛ خالی = پاک‌کردن',JSON.stringify(C.cleanOverride({slots:{s4:'bad',s2:'۹:۰۵',s1:''}}))==='{"slots":{"s1":"","s2":"09:05"}}');
const c1=C.cleanOverride({addedPunches:[{id:'M',time:'۱۷:۴۵',type:'out'},{id:'bad',time:'x',type:'in'}],status:'absent',overtime:{decision:'partial',minutes:'۲۰',note:'ok'}});
check('تردد نامعتبر کنار گذاشته و دقیقهٔ جزئی عددی می‌شود',c1.addedPunches.length===1&&c1.addedPunches[0].time==='17:45'&&c1.overtime.minutes===20&&c1.status==='absent');
check('وضعیت «تعیین‌نشده» ذخیره نمی‌شود',C.cleanOverride({status:'undetermined'})===null);
check('امضا مستقل از فیلدهای متا',C.overrideSignature({id:'ATO-1',personnelId:'X',createdAt:'t',status:'off'})===C.overrideSignature({status:'off'})&&C.overrideSignature(null)==='');
const ch=C.overrideChanges({slots:{s2:'12:00'},status:'off'},{slots:{s2:'17:30',s4:''},note:'اصلاح'});
check('تغییرات خوانا برای audit (قدیم → جدید)',JSON.stringify(ch)===JSON.stringify([{field:'slots.s2',old:'12:00',new:'17:30'},{field:'slots.s4',old:null,new:'پاک شد'},{field:'status',old:'off',new:null},{field:'note',old:null,new:'اصلاح'}]));

console.log('ذخیرهٔ ماه: override، audit و snapshot');
let r=save(base0,{drafts:{'1405/08/02':{slots:{s2:'17:30'},note:'خروج را فراموش کرده بود'},'1405/08/05':{status:'absent'}},base:{}});
let doc=r.doc;
check('دو override جدید با شناسه و سازنده',doc.overrides.length===2&&doc.overrides[0].id==='ATO-000001'&&doc.overrides[0].createdBy==='مدیر'&&doc.overrides[1].businessDate==='1405/08/05'&&r.changedDays.join()==='1405/08/02,1405/08/05');
check('ترددهای خام دست نمی‌خورند',JSON.stringify(doc.punches)===JSON.stringify(base0.punches));
check('audit هر روز: چه کسی، چه چیزی، قدیم → جدید، کی',(()=>{const a=doc.auditLog.find(x=>x.kind==='day'&&x.businessDate==='1405/08/02');return a&&a.by==='مدیر'&&a.at===AT&&a.action==='create'&&a.changes.some(c=>c.field==='slots.s2'&&c.old===null&&c.new==='17:30')})());
const snap=doc.monthSaves[0];
check('snapshot کل ماه همراه تنظیمات',doc.monthSaves.length===1&&snap.id==='ATM-00001'&&snap.status==='active'&&snap.days.length===30&&snap.settingsSource==='current'&&JSON.stringify(snap.settings)===JSON.stringify(seed.settings));
const d2=snap.days.find(d=>d.businessDate==='1405/08/02');
check('نتیجهٔ ذخیره‌شده اصلاح مدیر را دارد',d2.slots.s2.time==='17:30'&&d2.slots.s2.source==='manual'&&d2.earlyExit===0&&d2.explanations[0]==='توسط مدیر اصلاح شد: خروج را فراموش کرده بود'&&snap.days.find(d=>d.businessDate==='1405/08/05').status==='absent');
check('audit ذخیرهٔ ماه',doc.auditLog.some(a=>a.kind==='monthSave'&&a.saveId==='ATM-00001'&&a.changedDays.length===2));
check('سند ورودی تغییر نمی‌کند',base0.overrides.length===0&&!base0.monthSaves.length);

console.log('ویرایش دوباره، بازگشت به محاسبه و نسخه‌ها');
const sig02=C.overrideSignature(C.overrideFor(doc.overrides,'EMP-101','1405/08/02'));
r=C.applyMonthSave(doc,{personnelId:'EMP-101',year:1405,month:8,user:'مدیر۲',at:AT2,drafts:{'1405/08/02':{slots:{s2:'17:00'}},'1405/08/05':null},base:{'1405/08/02':sig02,'1405/08/05':C.overrideSignature(C.overrideFor(doc.overrides,'EMP-101','1405/08/05'))}});
const doc2=r.doc;
check('override قبلی آرشیو و نسخهٔ جدید با ارجاع ساخته می‌شود (حذف فیزیکی نداریم)',doc2.overrides.length===3&&doc2.overrides[0].isArchived&&doc2.overrides[0].archivedBy==='مدیر۲'&&doc2.overrides[2].replaces==='ATO-000001'&&doc2.overrides[1].isArchived);
check('بازگشت به محاسبه: روز ۰۸/۰۵ دوباره تعیین‌نشده',C.overrideFor(doc2.overrides,'EMP-101','1405/08/05')===null&&doc2.monthSaves.find(s=>s.status==='active').days.find(d=>d.businessDate==='1405/08/05').status==='undetermined'&&doc2.auditLog.some(a=>a.action==='reset'&&a.businessDate==='1405/08/05'&&a.changes[0].old==='absent'));
check('snapshot قبلی superseded و جدید فعال',doc2.monthSaves.length===2&&doc2.monthSaves[0].status==='superseded'&&doc2.monthSaves[0].supersededBy==='ATM-00002'&&C.activeMonthSave(doc2.monthSaves,'EMP-101',1405,8).id==='ATM-00002');
r=C.applyMonthSave(doc2,{personnelId:'EMP-101',year:1405,month:8,user:'x',at:AT2,drafts:{'1405/08/02':{slots:{s2:'17:00'}}},base:{'1405/08/02':C.overrideSignature(C.overrideFor(doc2.overrides,'EMP-101','1405/08/02'))}});
check('پیش‌نویس بدون تغییر واقعی override یا audit روز نمی‌سازد',r.changedDays.length===0&&r.doc.overrides.length===3);

console.log('تغییر هم‌زمان');
assert.throws(()=>C.applyMonthSave(doc,{personnelId:'EMP-101',year:1405,month:8,drafts:{'1405/08/02':{status:'off'}},base:{'1405/08/02':''}}),/کاربر دیگری/);
check('اگر override روز پس از شروع ویرایش عوض شده باشد ذخیره رد می‌شود',true);
assert.throws(()=>save(base0,{drafts:{'1405/09/01':{status:'off'}}}),/در این ماه نیست/);
check('پیش‌نویس روز خارج از ماه پذیرفته نمی‌شود',true);
assert.throws(()=>save({...base0,settings:{}},{}),/تنظیمات/);
check('بدون تنظیمات معتبر ذخیره نمی‌شود',true);

console.log('تنظیمات ثابت ماه ذخیره‌شده');
const changedSettings=clone(doc.settings);changedSettings.weekly.forEach(w=>{w.morningLateToleranceMin=0});
const doc3={...doc,settings:changedSettings};
check('ماه ذخیره‌شده با تنظیمات زمان ذخیره خوانده می‌شود',C.monthSettings(doc3,'EMP-101',1405,8).weekly[0].morningLateToleranceMin===15&&C.monthSettings(doc3,'EMP-101',1405,8,true).weekly[0].morningLateToleranceMin===0&&C.monthSettings(doc3,'EMP-102',1405,8).weekly[0].morningLateToleranceMin===0);
r=save(doc3,{drafts:{},base:{}});
check('ذخیرهٔ دوباره بدون انتخاب مدیر تنظیمات ثابت را نگه می‌دارد',r.doc.monthSaves.find(s=>s.status==='active').settingsSource==='frozen'&&r.doc.monthSaves.find(s=>s.status==='active').settings.weekly[0].morningLateToleranceMin===15);
r=save(doc3,{drafts:{},base:{},useCurrentSettings:true});
const late04=r.doc.monthSaves.find(s=>s.status==='active').days.find(d=>d.businessDate==='1405/08/04').late;
check('با انتخاب مدیر، محاسبه با تنظیمات فعلی (تأخیر ۰۹:۱۴ دیگر صفر نیست)',r.doc.monthSaves.find(s=>s.status==='active').settingsSource==='current'&&late04===14);

console.log('تغییر پس از ذخیره و موارد نیازمند بررسی');
const live=C.computeMonth({punches:doc.punches,overrides:doc.overrides,settings:C.monthSettings(doc,'EMP-101',1405,8),personnelId:'EMP-101',year:1405,month:8});
check('بلافاصله پس از ذخیره تفاوتی نیست',C.changedSinceSave(C.activeMonthSave(doc.monthSaves,'EMP-101',1405,8),live).length===0);
const late=[...doc.punches,{id:'L1',personnelId:'EMP-101',date:'1405/08/06',time:'09:00:00',type:'in',businessDate:'1405/08/06'}];
const live2=C.computeMonth({punches:late,overrides:doc.overrides,settings:C.monthSettings(doc,'EMP-101',1405,8),personnelId:'EMP-101',year:1405,month:8});
check('ترددِ دیرتر واردشده روز را «تغییر پس از ذخیره» می‌کند',C.changedSinceSave(C.activeMonthSave(doc.monthSaves,'EMP-101',1405,8),live2).join()==='1405/08/06');
const att=C.monthAttention({doc,personnelIds:people.map(p=>p.id),year:1405,month:8,today:'1405/08/07'});
const a105=att.find(x=>x.personnelId==='EMP-105'),a101=att.find(x=>x.personnelId==='EMP-101'),a106=att.find(x=>x.personnelId==='EMP-106');
check('نیاز به بررسی، تکمیل خودکار و اضافه‌کار در انتظار',a105.review.map(d=>d.businessDate).join()==='1405/08/04'&&a105.pendingOvertime.length===2&&att.find(x=>x.personnelId==='EMP-102').autoFill.length===2);
check('تعیین‌نشده فقط تا امروز و پس از تعیین وضعیت حذف می‌شود',a106.undetermined.map(d=>d.businessDate).join()==='1405/08/01,1405/08/04,1405/08/06'&&a101.undetermined.length===0&&!!a101.save&&a106.save===null);
check('امروز به وقت محلی شمسی',/^\d{4}\/\d{2}\/\d{2}$/.test(C.todayJalali())&&C.todayJalali(new Date(2026,9,23))==='1405/08/01');

console.log('سیم‌کشی UI');
const ui=fs.readFileSync('js/51-attendance-admin.js','utf8'),config=fs.readFileSync('js/config.js','utf8'),shell=fs.readFileSync('js/16-mpa-shell.js','utf8'),polish=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
check('monthSaves در Gateway و فایل مقداردهی اولیه',config.includes("'overrides','monthSaves','auditLog'")&&Array.isArray(seed.monthSaves));
check('صفحه‌ها، مسیرها و منو',ui.includes('views.attendanceMonth=monthView')&&ui.includes('views.attendanceAttention=attentionView')&&shell.includes("'attendanceMonth','attendanceAttention'")&&polish.includes('personnel.html?view=attendanceMonth')&&polish.includes('personnel.html?view=attendanceAttention'));
check('ذخیرهٔ ماه فقط از مسیر Load زنده → applyMonthSave → Save تأییدی',/async function saveMonth[\s\S]*?writeAttendance\(doc=>\{res=C\(\)\.applyMonthSave\(doc,/.test(ui)&&(ui.match(/saveModule\(/g)||[]).length===1);
check('اصلاحات تا «ذخیره» فقط پیش‌نویس محلی‌اند و هشدار خروج دارند',/function applyDay\(\)\{[^}]*setDraft\(/.test(ui)&&!/function applyDay[^\n]*writeAttendance/.test(ui)&&ui.includes('dirty()||busy||monthDirty()')&&ui.includes('confirmLeaveMonth()'));

console.log(`PASS ${passed}: attendance month — override cleanup/diff, month save with snapshot and frozen settings, archive instead of delete, audit, conflicts, attention list and UI wiring`);
