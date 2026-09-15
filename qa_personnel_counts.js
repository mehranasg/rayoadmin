'use strict';
const fs=require('fs');
const vm=require('vm');

let passed=0;
function check(name,condition){if(!condition)throw new Error(`FAIL: ${name}`);passed++;console.log(`  ✓ ${name}`)}

const polish=fs.readFileSync('js/44-phase1-polish-v10-10-1.js','utf8');
const css=fs.readFileSync('css/08-phase1-polish-v10-10-1.css','utf8');
const personnel=fs.readFileSync('js/06-rayo-v6-4-1-personnel-bank-visibility-patch.js','utf8');

new vm.Script(polish,{filename:'js/44-phase1-polish-v10-10-1.js'});
check('کارت مستقل تعداد پرسنل ساخته می‌شود',polish.includes("card.id='v10101PersonnelCountCard'")&&polish.includes('تعداد پرسنل'));
check('تعداد کل از داده پرسنل خوانده می‌شود',polish.includes("(state.personnel||[]).length.toLocaleString('fa-IR')"));
check('نتیجه فیلترشده از ردیف‌های قابل مشاهده محاسبه می‌شود',polish.includes("personnelRowId(row)&&!row.hidden")&&polish.includes('v10101PersonnelFilteredCount'));
check('تغییر فیلتر شمارنده را به‌روز می‌کند',/function applyPersonnelFilters\(\)[\s\S]*?updatePersonnelCount\(\)/.test(polish));
check('جست‌وجو همچنان Render مجدد انجام می‌دهد',personnel.includes("rayoLiveFilter(this,ui,'personnelSearch')"));
check('کارت شمارنده استایل مستقل دارد',css.includes('.personnel-count-card-v10101'));
check('جست‌وجو و فیلترها در یک کارت ترکیب می‌شوند',polish.includes("card.id='v10101PersonnelFilters'")&&polish.includes("toolbar.insertAdjacentHTML('beforeend'"));
check('کارت فیلتر و تعداد کنار هم قرار می‌گیرند',polish.includes("layout.className='personnel-list-tools-v10101'")&&css.includes('grid-template-columns:minmax(0,2fr) minmax(300px,1fr)'));
check('کلید تحلیل ظرفیت از کارت فیلتر حذف می‌شود',polish.includes("toolbar.querySelector('button[onclick*=\"staffingCapacity\"]')?.remove()"));
check('فیلتر وضعیت شامل اتمام همکاری است',polish.includes("['فعال','غیرفعال','اتمام همکاری']"));
check('ستون رده آشپزخانه از لیست حذف می‌شود',polish.includes('function removePersonnelKitchenRankColumn()')&&polish.includes("S(th.textContent)==='رده آشپزخانه'"));

console.log(`PASS ${passed}`);
