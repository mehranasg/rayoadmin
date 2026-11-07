/* Rayo Panel prototype — تنظیمات (hub: only cross-cutting settings; module settings live inside each module) */
(function(){
'use strict';
function general(){return`<div class="grid grid-2">
  ${P.card({title:'اطلاعات مجموعه',body:`<div class="form-grid">${P.field('نام','<input class="input" value="کافه رستوران رایو">')}${P.field('شعبه','<input class="input" value="شعبهٔ مرکزی">')}${P.field('شناسهٔ ملی / اقتصادی','<input class="input" placeholder="اختیاری">')}${P.field('تلفن','<input class="input">')}<div class="full">${P.field('نشانی','<input class="input">')}</div></div>`})}
  ${P.card({title:'دوره و واحد',body:`<div class="form-grid">${P.field('سال مالی','<select class="select"><option>۱۴۰۵ (فروردین تا اسفند)</option></select>')}${P.field('واحد پول','<input class="input" value="تومان" disabled>','تصمیم مالک: همه‌جا تومان. مبالغ ریالی دادهٔ فعلی (مثل صندوق) در زمان انتقال یک بار ÷ ۱۰ می‌شوند.')}${P.field('شروع روز کاری','<input class="input" value="۰۶:۰۰">','فروش بعد از نیمه‌شب تا این ساعت، مال روز قبل است')}${P.field('شیفت‌های صندوق','<input class="input" value="صبح، عصر">')}</div>`})}
</div>`}
function index(){
  const L=[['مالی','landmark','finance/settings','حساب‌های پول، انواع هزینه، قواعد ثبت پرداخت، هزینه‌های تکرارشونده'],
    ['انبار','package','inventory/settings','سطح کنترل کالا، معیار تعویض روغن، برنامهٔ شمارش، علت‌های ضایعات، واحدها'],
    ['پرسنل','users','people/settings','پایهٔ حقوق سالانه، بیمه و مالیات، قاعدهٔ انعام، شیفت‌ها، تخلفات، مرخصی'],
    ['کاربران و دسترسی','shield-check','people/users','کاربران، نقش‌ها و ماتریس دسترسی'],
    ['منو و قیمت','utensils-crossed','menu/settings','درصد هدف بهای مواد، نرخ سربار نمک و ادویه، قواعد کانال‌ها، گرد کردن قیمت']];
  return`${P.note('<b>تصمیم طراحی:</b> تنظیمات هر بخش داخل خود آن بخش است (جایی که کاربر به آن نیاز دارد). این صفحه فقط تنظیمات مشترک را نگه می‌دارد و فهرستی از همهٔ تنظیمات دارد تا چیزی گم نشود.','compass')}
  <div class="grid grid-2 mt">${L.map(([t,i,h,d])=>`<a class="card" href="#/${h}" style="display:block"><div class="card-body"><div class="cell-main"><span class="thumb kpi-icon">${P.ic(i)}</span><div><b>${t}</b><small>${d}</small></div></div></div></a>`).join('')}</div>`;
}
function integrations(){
  const I=[['سپیدز (صندوق فعلی)','monitor','ورود فایل فروش روزانه','success','فعال'],['سفارش‌گیر رایو (سالن و بیرون‌بر)','tablet-smartphone','جایگزین ورود فایل؛ فروش لحظه‌ای','neutral','فاز بعد'],['منوی QR','qr-code','قیمت و موجودی از همین پنل','info','در حال طراحی'],['اسنپ‌فود','bike','دریافت سفارش و تسویه','neutral','فاز بعد'],['دستگاه حضور و غیاب','fingerprint','ورود فایل تردد','success','فعال'],['پیامک','message-square','ارسال فیش و برنامهٔ شیفت','neutral','اختیاری']];
  I.push(['سرور مرکزی رایو','server','همگام‌سازی شعبه با مرکز؛ دیدن گزارش و ثبت از بیرون؛ آمادگی چندشعبه','neutral','فاز بعد']);
  I.push(['سامانهٔ مودیان (صورتحساب الکترونیکی)','file-check','ارسال خودکار صورتحساب فروش به سازمان امور مالیاتی از صندوق؛ شناسهٔ یکتا روی رسید','warning','الزام قانونی — فاز صندوق']);
  I.push(['باشگاه مشتریان و پیامک','gift','امتیاز و کش‌بک، پیامک تولد و «دلمان برایتان تنگ شده»، گروه مشتری با فهرست قیمت','neutral','فاز ۶']);
  I.push(['کالر آیدی و پیجر','phone-incoming','نمایش پروندهٔ مشتری با زنگ تلفن؛ پیجر برای بیرون‌بر','neutral','فاز صندوق']);
  return P.card({flush:1,title:'اتصال‌ها',body:P.table(['سرویس','کاربرد','وضعیت'],I.map(([a,i,b,t,s])=>[P.cellMain(a,'',i),b,P.b(s,t)]))});
}
function data(){return`<div class="grid grid-2">
  ${P.card({title:'پشتیبان‌گیری',body:`<div class="list"><div class="list-item"><span class="thumb tone-success">${P.ic('check')}</span><div class="grow"><b>آخرین بکاپ خودکار</b><small>امروز ۰۲:۰۰ — همهٔ بخش‌ها</small></div></div><div class="list-item"><span class="thumb">${P.ic('archive')}</span><div class="grow"><b>بکاپ پایان ماه مهر</b><small>هنگام بستن ماه</small></div></div></div><div class="actions mt"><button class="btn btn-secondary" onclick="P.toast('بکاپ گرفته شد (نمونه)')">${P.ic('download')}بکاپ الان</button></div>`})}
  ${P.card({title:'عملیات حساس',body:`<div class="alert alert-warning">${P.ic('alert-triangle')}<div><b>فقط مالک، با بکاپ و پیش‌نمایش</b><p>بازگردانی، ادغام و پاک‌سازی هرگز خودکار نیست. قبل از هر عملیات بکاپ، پیش‌نمایش تغییرات و امکان برگشت لازم است.</p></div></div>
    <div class="actions mt"><button class="btn btn-secondary" disabled>بازگردانی از بکاپ</button><button class="btn btn-danger" disabled>پاک‌سازی</button></div>`})}
</div>`}
function log(){
  const L=[['امروز ۱۰:۴۲','زهرا نوری','تأیید درخواست مرخصی','پرسنل'],['امروز ۰۹:۱۵','مالک','تغییر قیمت لاته ۲۲۵ ← ۲۴۵ هزار','منو'],['دیروز ۲۳:۵۰','سارا محمدی','بستن صندوق شیفت عصر','مالی'],['دیروز ۱۸:۰۲','علی رضایی','ثبت ضایعات شیر ۲ لیتر','انبار'],['دیروز ۱۱:۳۰','حسابدار','ابطال پرداخت پر-۰۴۱۰ (ثبت تکراری)','مالی']];
  const S=D.SETTING_LOG.map(x=>[P.dd(x.date),x.by,'تنظیمات: '+x.text+' <small class="muted">('+x.scope+')</small>',x.area]);
  return P.card({flush:1,title:'تاریخچهٔ تغییرات',sub:'هر ثبت، ویرایش و ابطال با کاربر و زمان؛ هیچ سابقه‌ای حذف نمی‌شود',body:P.table(['زمان','کاربر','عملیات','بخش'],S.concat(L).map(x=>[x[0],x[1],x[2],P.b(x[3],'neutral',1)]))});
}
P.mod({id:'settings',label:'تنظیمات',icon:'settings',desc:'تنظیمات مشترک، اتصال‌ها و داده',
  tabs:[{id:'general',label:'عمومی',icon:'building-2',title:'تنظیمات',render:general},{id:'index',label:'همهٔ تنظیمات',icon:'list',desc:'فهرست تنظیمات هر بخش',render:index},
    {id:'integrations',label:'اتصال‌ها',icon:'plug',desc:'سیستم فروش، منوی QR، پلتفرم‌ها و دستگاه‌ها',render:integrations},{id:'data',label:'داده و بکاپ',icon:'database',desc:'پشتیبان‌گیری و عملیات حساس',render:data},{id:'log',label:'تاریخچهٔ تغییرات',icon:'history',desc:'چه کسی، چه زمانی، چه کرد',render:log}]});
})();
