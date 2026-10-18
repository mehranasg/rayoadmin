'use strict';
// Waste form (section → person → item, tableware/equipment from assets, optional fine), beverage control tab,
// corporate-drink pricing exclusion and section-only checklists.
const fs=require('fs');
let passed=0;
function check(name,condition){if(!condition)throw new Error(`FAIL: ${name}`);passed++;console.log(`  ✓ ${name}`)}
const read=f=>fs.readFileSync(f,'utf8');
const core=read('js/32-inventory-cost-control-v10.js'),ops=read('js/46-inventory-operations-v10-12.js'),pricing=read('js/08-rayo-pricing-admin-module.js'),training=read('js/29-training-checklists-v9-7-0.js'),staff=read('js/22-staff-panel.js'),css=read('css/10-inventory-operations-v10-12.css');

check('فرم پرتی: سکشن، فرد مرتبط فقط فعال و بدون کد',core.includes('id="v10EvSection"')&&core.includes('function wastePeopleOptions(')&&core.includes('activePersonnelRows().slice()')&&!/v10EvPerson[\s\S]{0,200}p\.id\} \|/.test(core));
check('فرم پرتی: نام قلم بدون کد و مرتب‌سازی بر اساس سابقه سکشن',core.includes("${sc>0?'★ ':''}${E(x.name)}")&&core.includes('function wasteHistory(type,section)'));
check('فرم پرتی: نوع «ظروف و تجهیزات» از اموال و ثبت رخداد در اموال',core.includes('ظروف و تجهیزات (اموال)')&&core.includes("RAYO_API_GATEWAY.loadModule('assets')")&&core.includes("status:'جدید'")&&core.includes("saveModule('assets',doc)"));
check('فرم پرتی: ارزش برآوردی و پیشنهاد مبلغ جریمه قابل‌تغییر',core.includes('function wasteEstimate(')&&core.includes("fine.dataset.touched!=='1'"));
check('جریمه پرتی: تأییدشده، ماه حقوق از تاریخ اعمال، با منبع',core.includes("type:'جریمه',amount:fine.amount")&&core.includes("status:'تاییدشده'")&&core.includes('year:y,month:m,source:\'waste\''));
check('چک‌باکس جریمه داخل .field نیست (تبدیل خودکار فیلد مبلغ رخ نمی‌دهد)',core.includes('<div class="full waste-fine">'));
check('46 فرم پرتی را بازنویسی نمی‌کند',!ops.includes("picker('v10EvItem'")&&ops.includes('owned by 32::wasteFormHtml'));
check('کنترل روزانه نوشیدنی تب جدای انبار است و لینک قدیمی هدایت می‌شود',ops.includes("['beverage','کنترل روزانه نوشیدنی']")&&ops.includes("if(q==='count'&&params.get('sub')==='beverage')return'beverage'")&&!ops.includes('function bevSubNav('));
check('تاریخ و سه نقش در یک سطر دسکتاپ',ops.includes('form-grid v1012-bev-head')&&css.includes('.v1012-bev-head{grid-template-columns:repeat(4'));
check('علت خروج و علت مغایرت دکمه + دیالوگ',ops.includes('function bevReasonButton(')&&ops.includes("document.createElement('dialog')")&&!ops.includes('v1012-bev-reason-row'));
check('توضیح گزارش مغایرت با آیکون راهنما',ops.includes('RayoInventoryV1012.bevReportHelp()')&&ops.includes('data-bev-help'));
check('تب ماهانه: کارت‌ها و انتخاب ماه در همان نوار؛ بدون کلید «مشاهده»',ops.includes('function bevMonthSelect()')&&!ops.includes("RayoInventoryV1012.bevMonth('${E(r.m)}')\">مشاهده"));
check('انتخاب سریع نوشابه‌ها و آب معدنی در تنظیم اقلام',ops.includes('function bevPickCorporate()'));
check('هم‌ترازی جمع فروش و کلید ثبت',css.includes('.toolbar:has(#opSalesCalculatedTotal)'));
check('نوشیدنی شرکتی: پرچم صریح و نام‌های رایج، بدون پیشنهاد تغییر قیمت',pricing.includes('function pcIsLabelPriced(item)')&&pricing.includes("'کوکاکولا'")&&pricing.includes('labelPriceOnly:!!$(\'pc_m_label_price\')?.checked')&&pricing.includes('const needs=!corporate&&'));
check('چک‌لیست فقط با سکشن (پوزیشن اختیاری) در پنل مدیر و پنل پرسنل',training.includes('section-only checklist')&&!training.includes("حداقل یک پوزیشن (مثلاً باریستا) انتخاب کنید")&&staff.includes('section-only checklist'));
check('انتخاب فرد در چک‌لیست بدون کد',!training.includes("${E(p.id)} | ${E(p.name)} — ${E(p.mainPosition"));

// Corporate pricing exclusion at runtime
const vm=require('vm'),i=pricing.indexOf('const PC_LABEL_PRICE_NAMES'),j=pricing.indexOf('function pcMetrics(item){');
const c={pcText:x=>String(x??'').trim()};vm.createContext(c);vm.runInContext(pricing.slice(i,j),c);
check('نام‌های واقعی (کوکاکولا، کوکا زیرو) مستثنی؛ موهیتو نه؛ پرچم صریح اولویت دارد',c.pcIsLabelPriced({name:'کوکاکولا'})&&c.pcIsLabelPriced({name:'کوکا  زیرو'})&&!c.pcIsLabelPriced({name:'موهیتو'})&&c.pcIsLabelPriced({name:'ماءالشعیر هی دی',labelPriceOnly:true})&&!c.pcIsLabelPriced({name:'کوکاکولا',labelPriceOnly:false}));

console.log(`PASS ${passed}`);
