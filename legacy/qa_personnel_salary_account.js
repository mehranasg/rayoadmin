const fs=require('fs');
const path=require('path');
const root=__dirname;
const personnelForm=fs.readFileSync(path.join(root,'js/05-rayo-v6-4-personnel-bank-patch.js'),'utf8');
const salaryAccount=fs.readFileSync(path.join(root,'js/06-rayo-v6-4-1-personnel-bank-visibility-patch.js'),'utf8');
const lateEnhancements=fs.readFileSync(path.join(root,'js/17-v9-3-admin-enhancements.js'),'utf8');
const finalRuntime=fs.readFileSync(path.join(root,'js/44-phase1-polish-v10-10-1.js'),'utf8');
const payroll=fs.readFileSync(path.join(root,'js/00-base.js'),'utf8');
const v6Owner=fs.readFileSync(path.join(root,'js/01-v6-overrides.js'),'utf8');
const v63Owner=fs.readFileSync(path.join(root,'js/03-rayo-v6-3-patch.js'),'utf8');
const checks=[];
function ok(label,value){if(!value)throw new Error(`FAIL: ${label}`);checks.push(label)}

const mainFormTemplate=personnelForm.match(/function editPersonnelV64[\s\S]*?async function savePersonnelV64/)?.[0]||'';
ok('فرم اصلی اطلاعات بانکی ندارد',!mainFormTemplate.includes('pv_account_holder')&&!mainFormTemplate.includes('pv_iban'));
ok('فرم اصلی اطلاعات قرارداد حقوق ندارد',!mainFormTemplate.includes('pv_hourly')&&!mainFormTemplate.includes('pv_grade'));
ok('مودال پرسنل هنگام بازشدن به ابتدای محتوا می‌رود',personnelForm.includes("modal.scrollTop=0")&&personnelForm.includes("body.scrollTop=0"));
ok('حساب حقوق مودال مستقل دارد',salaryAccount.includes('function openPersonnelBankV641')&&salaryAccount.includes('function savePersonnelBankV641'));
ok('مودال مستقل با نام پایدار برای لایه‌های بعدی صادر می‌شود',salaryAccount.includes('window.openPersonnelSalaryAccountV641=openPersonnelBankV641'));
ok('لایه نهایی حساب حقوق به نسخه‌های قدیمی وابسته نیست',lateEnhancements.includes('window.openPersonnelBankV641=openBankOnly')&&lateEnhancements.includes('حقوق ثابت ماهانه، مستقل از ساعت'));
ok('لایه نهایی مزایا و اعتبارها را داخل حساب حقوق مدیریت می‌کند',lateEnhancements.includes('salary_account_transport')&&lateEnhancements.includes('salary_account_credit')&&lateEnhancements.includes('salary_account_meal'));
ok('کلیک بیرون مودال در صفحه پرسنل آن را نمی‌بندد',finalRuntime.includes("event.target?.id==='modalBackdrop'")&&finalRuntime.includes('event.stopImmediatePropagation()'));
ok('آخرین لایه اجرایی فرم و حساب حقوق قدیمی را قطع می‌کند',finalRuntime.includes("typeof window.editPersonnelV64==='function'?window.editPersonnelV64:window.editPersonnelCoreV6")&&finalRuntime.includes('window.openPersonnelBankV641=window.openPersonnelSalaryAccountFinalV93'));
ok('فرم پایه V6 مستقل و بدون حساب است',!v6Owner.includes('ماشین‌حساب حقوق فقط ابزار برآورد است')&&v6Owner.includes('در این فرم فقط اطلاعات هویتی و شغلی ثبت می‌شود')&&v6Owner.includes('savePersonnelCoreV6'));
ok('دکمه حساب حقوق V6 فرم پرسنل را باز نمی‌کند',v6Owner.includes(`onclick="openPersonnelBankV641('\${p.id}')">حساب حقوق</button>`));
ok('فرم قدیمی V6.3 نیز دیگر قابل نمایش نیست',!v63Owner.includes('<section class="bank-card-v642"')&&v63Owner.includes('window.editPersonnelCoreV6'));
ok('پیام انتظار فرم جدید حذف شده است',!v6Owner.includes('فرم جدید پرسنل بارگذاری نشده')&&!v63Owner.includes('فرم جدید پرسنل هنوز آماده نیست'));
ok('دو نوع قرارداد ساعتی و ثابت ارائه می‌شود',salaryAccount.includes('value="hourly"')&&salaryAccount.includes('value="fixedMonthly"'));
ok('حقوق ثابت مثبت اعتبارسنجی می‌شود',salaryAccount.includes("type==='fixedMonthly'&&monthlySalary<=0"));
ok('اطلاعات بانکی فقط از فرم حساب حقوق خوانده می‌شود',salaryAccount.includes("$('pb_account_holder')")&&salaryAccount.includes("$('pb_iban')"));
ok('محاسبه زنده حقوق ثابت از ساعت مستقل است',payroll.includes("fixedContract?n(p.salaryContract.monthlySalary):Math.max(0,hours-delayHours)*hourly"));
ok('محاسبه مانده قبلی نیز قرارداد ثابت را پوشش می‌دهد',(payroll.match(/fixedContract\?n\(p\.salaryContract\.monthlySalary\):Math\.max\(0,hours-delayHours\)\*hourly/g)||[]).length>=2);

ok('fixed monthly contract does not require hourly rate',salaryAccount.includes("if(type==='hourly'&&hourlyRate<=0)")&&salaryAccount.includes("p.hourlyRate=type==='hourly'?hourlyRate:n(p.hourlyRate)"));
ok('final salary modal does not require hourly rate for fixed monthly',lateEnhancements.includes("if(type==='hourly'&&hourly<=0)")&&lateEnhancements.includes("hourlyRate:type==='hourly'?hourly:N(p.hourlyRate)"));

console.log(`PASS ${checks.length}`);
checks.forEach(x=>console.log(`  ✓ ${x}`));
