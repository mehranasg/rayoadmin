'use strict';
const fs=require('fs');
const vm=require('vm');

let passed=0;
function check(name,condition){if(!condition)throw new Error(`FAIL: ${name}`);passed++;console.log(`  ✓ ${name}`)}

const polish=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
const css=fs.readFileSync('css/08-phase1-polish-v10-10-1.css','utf8');
const personnel=fs.readFileSync('js/06-rayo-v6-4-1-personnel-bank-visibility-patch.js','utf8');
const profile=fs.readFileSync('js/17-v9-3-admin-enhancements.js','utf8');
const reports=fs.readFileSync('js/23-personnel-management-v9-5-3.js','utf8');
const finalReview=fs.readFileSync('js/34-final-operational-review-v10-1.js','utf8');
const base=fs.readFileSync('js/00-base.js','utf8');
const access=fs.readFileSync('js/25-user-management-v9-5-5.js','utf8');
const polishCss=css;

new vm.Script(polish,{filename:'js/44-phase1-polish-v10-10-1.js'});
check('کارت مستقل تعداد پرسنل ساخته می‌شود',polish.includes("card.id='v10101PersonnelCountCard'")&&polish.includes('تعداد پرسنل'));
check('کارت فقط تعداد پرسنل فعال را نشان می‌دهد',polish.includes('<h2>تعداد پرسنل فعال</h2>')&&polish.includes("(state.personnel||[]).filter(p=>S(p.status)==='فعال').length")&&!polish.includes('<div class="label">کل پرسنل</div>'));
check('توضیح زیر عنوان لیست پرسنل حذف شده است',personnel.includes("pageHead('لیست پرسنل','',"));
check('صفحه‌بندی لیست پرسنل پیش‌فرض ۵۰ ردیف است',personnel.includes('<table class="data-table" data-page-size="50">'));
check('تغییر فیلتر شمارنده را به‌روز می‌کند',/function applyPersonnelFilters\(\)[\s\S]*?updatePersonnelCount\(\)/.test(polish));
check('جست‌وجو همچنان Render مجدد انجام می‌دهد',personnel.includes("rayoLiveFilter(this,ui,'personnelSearch')"));
check('کارت شمارنده استایل مستقل دارد',css.includes('.personnel-count-card-v10101'));
check('جست‌وجو و فیلترها در یک کارت ترکیب می‌شوند',polish.includes("card.id='v10101PersonnelFilters'")&&polish.includes("toolbar.insertAdjacentHTML('beforeend'"));
check('کارت فیلتر و تعداد کنار هم قرار می‌گیرند',polish.includes("layout.className='personnel-list-tools-v10101'")&&css.includes('grid-template-columns:minmax(0,2fr) minmax(300px,1fr)'));
check('کلید تحلیل ظرفیت از کارت فیلتر حذف می‌شود',polish.includes("toolbar.querySelector('button[onclick*=\"staffingCapacity\"]')?.remove()"));
check('فیلتر وضعیت شامل اتمام همکاری است',polish.includes("['فعال','غیرفعال','اتمام همکاری']"));
check('ستون رده آشپزخانه از لیست حذف می‌شود',polish.includes('function removePersonnelKitchenRankColumn()')&&polish.includes("S(th.textContent)==='رده آشپزخانه'"));

check('پروفایل بدون انتخاب پرسنل داده‌ای لود نمی‌کند',!profile.includes('profileUI.personnelId=people[0].id')&&profile.includes('<option value="">انتخاب پرسنل</option>')&&profile.includes("if(!p)return head+picker+"));
check('پروفایل دو تب ماهانه و خلاصه بازه‌ای دارد',profile.includes("profileUI.tab='range'")&&finalReview.includes("window.profileUI?.tab!=='range')return base")&&finalReview.includes("window.profileUI?.tab==='range')return base")&&reports.includes("window.profileUI?.tab==='range')return base"));
check('در پروفایل دکمه ثبت تخلف وجود ندارد',!reports.includes('+ ثبت تخلف</button> '));
check('ثبت تخلف فقط برای ماه جاری مجاز است',finalReview.includes('monthKey(date)!==monthKey(today())')&&reports.includes('Math.floor(dcode(date)/100)!==Math.floor(dcode(today())/100)'));
check('شناسه سهم در مودال تسویه انعام نمایش داده نمی‌شود',!finalReview.includes('<th>شناسه سهم</th>')&&!finalReview.includes('${E(s.shareId)}'));
check('گزارش پرسنلی تا انتخاب پرسنل لود نمی‌شود',reports.includes("!reportUI.personnelId?'<div class=\"card empty\">ابتدا پرسنل را انتخاب کنید.</div>'")&&reports.includes("const ALL_PEOPLE='__all__'"));
check('گزارش شیفت فیلتر وضعیت با پیش‌فرض فعال دارد',base.includes("shiftReport:{personnelId:'',from:'',to:'',status:'فعال'}")&&base.includes('<label>وضعیت پرسنل</label>')&&base.includes("status=f.status??'فعال'"));

check('نام پرسنل بدون کد نمایش داده می‌شود (کد فقط برای هم‌نام‌ها)',base.includes('function personDisplayName(p)')&&!base.includes("p.id+' | '+p.name")&&!base.includes('${p.id} | ${p.name}'));
check('مدیریت دسترسی‌ها پیش‌فرض پرسنل فعال است',access.includes("employmentStatus:'فعال'"));
check('فیلد وضعیت همکاری قبل از انتخاب پرسنل در کارت فیلتر تب‌های HR',polish.includes('function personnelScopeField()')&&polish.includes("PERSONNEL_SCOPE_DEFAULTS={tips:'همه'}")&&polish.includes("field.insertAdjacentHTML('beforebegin'")&&polish.includes('personnelScopeField();'));
check('مودال ورود گروهی: فقط پرسنل فعال، راهنمای تاشو و عرض بیشتر',base.includes("payrollFilteredRows().filter(r=>person(r.personnelId)?.status==='فعال')")&&base.includes('id="attEntryHelp" hidden')&&polishCss.includes('.modal:has(#attEntryWide)'));
check('فیش حقوقی پیش‌فرض پرسنلی انتخاب نمی‌کند',base.includes("if(f.personnelId&&!people.some(x=>x.id===f.personnelId))f.personnelId='';")&&base.includes('<select onchange="ui.payslip.personnelId=this.value;renderView()"><option value="">انتخاب کنید</option>'));
check('فیش حقوقی: تعداد شیفت شب × مبلغ هر شیفت = جمع کمک‌هزینه برگشت',base.includes("['کمک‌هزینه برگشت هر شیفت'")&&base.includes("['جمع کمک‌هزینه برگشت'"));
check('مودال انعام: پیش‌فرض فعال، گزینه همه پرسنل، ستون به تفکیک گروه، حفظ شرکت‌کنندگان فعلی',base.includes('id="tip_all_people"')&&base.includes('tip-people-col')&&base.includes("showAll||p.status==='فعال'||existing.has(p.id)"));
check('وضعیت انعام از دفتر تسویه محاسبه می‌شود',base.includes('function tipLiveStatus(g,pid=')&&base.includes('badge(tipLiveStatus(g,ui.tipFilter.personnelId))'));
check('فهرست پرداخت‌ها بدون واحد در خانه‌ها و با توضیح تومان',base.includes('همه مبالغ این فهرست به تومان است.'));

console.log(`PASS ${passed}`);
