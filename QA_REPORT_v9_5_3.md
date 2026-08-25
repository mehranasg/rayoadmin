# QA Report — Rayo Admin v9.5.3

## محدوده QA
تمرکز این نسخه روی حساب کاربری پرسنل، مدیریت پرسنل، گزارشات، تخلفات کاری و KPI مساعده داشبورد بوده است.

## نتیجه

### JavaScript
- همه فایل‌های `js/*.js`: `node --check` = PASS
- تعداد فایل‌های JavaScript تست‌شده: 26

### JSON
- همه Seed JSONها با parser استاندارد Python اعتبارسنجی شدند = PASS
- `personnel-data.seed.json` شامل `workViolations[]` و `lists.violationTypes[]` است.
- `seed/manifest.json` روی Build `9.5.3` قرار گرفت.

### حساب کاربری پرسنل
Contract test مستقل اجرا شد:
- `pv_username` در فرم اصلی = PASS
- `pv_user_password` در فرم اصلی = PASS
- `pv_user_enabled` در فرم اصلی = PASS
- Permission controls = PASS

Persistence test مستقل اجرا شد:
- ایجاد پرسنل جدید با Username = PASS
- ذخیره Password = PASS
- ذخیره Enabled = PASS
- ذخیره Permissionهای `cashReport` و `surveys` = PASS
- مسیر ذخیره مستقیم `savePersonnelV64` تست شد؛ وابسته به Injection فاز دوم نیست.

### گزارشات پرسنل
Contract test مستقل:
- ثبت View `personnelReports` = PASS
- ثبت View `violationSettings` = PASS
- گزارش حقوق دریافتی = PASS
- بخش مقایسه پرسنل سالن = PASS
- بخش ثبت تخلفات کاری = PASS
- KPI مساعده داشبورد = PASS

### منوی سمت راست
Static contract audit:
- گروه «مدیریت پرسنل» = PASS
- زیرمنوهای لیست پرسنل / پروفایل پرسنلی / گزارشات = PASS
- عنوان «مدیریت شیفت پلن» = PASS
- Routeهای `personnelReports` و `violationSettings` در MPA Shell = PASS

### عدم تغییر طراحی
SHA-256 فایل `css/style.css` نسخه ورودی v9.5.2 و خروجی v9.5.3 یکسان است:

`24d0591fc19969623f19172b1de09477bc897053cec08312583946297ba7af84`

نتیجه: CSS اصلی پروژه بدون تغییر = PASS

### API
- هیچ Runtime reference به `SplitCost` در HTML/JS وجود ندارد = PASS
- معماری `RayoData` بدون تغییر باقی مانده است.

## محدودیت Browser QA
Chromium موجود در محیط اجرای QA، Navigation به localhost و file URL را با خطای زیر Block می‌کند:

`net::ERR_BLOCKED_BY_ADMINISTRATOR`

بنابراین Browser Smoke Test واقعی در این محیط قابل انجام نبود. برای جبران، Syntax QA، JSON validation و دو Contract/Persistence Test مستقل Node VM اجرا شد. بعد از Deploy باید Smoke Test مرورگر واقعی انجام شود.

## Smoke Test بعد از Deploy
1. منوی «مدیریت پرسنل» باز شود و دقیقاً سه زیرمنوی موردنظر را نشان دهد.
2. Add Personnel → کارت «حساب کاربری و دسترسی پنل پرسنل» دیده شود.
3. Username/Password وارد، پنل فعال و چند Permission انتخاب و ذخیره شود.
4. صفحه Reload شود؛ Edit همان پرسنل اطلاعات حساب را دوباره نمایش دهد.
5. در لیست پرسنل ستون «حساب کاربری» Username و وضعیت فعال/غیرفعال را نشان دهد.
6. دکمه «حساب کاربری» مستقیماً همان بخش فرم را باز کند.
7. ورود با `staff-login.html` با Credential ذخیره‌شده تست شود.
8. `مدیریت پرسنل > گزارشات` باز شود.
9. بازه تاریخ تغییر داده شود و رتبه حقوق دریافتی کنترل شود.
10. Sort پرسنل سالن بر اساس انعام، جریمه، مرخصی، تخلف و تأخیر تست شود.
11. تخلف جدید ثبت شود و بعد از Reload باقی بماند.
12. تنظیمات تخلفات ذخیره و در فرم ثبت تخلف قابل انتخاب باشد.
13. Dashboard مقدار مساعده ماه جاری را با رکوردهای Payments تطبیق دهد.
14. نمایش موبایل فرم پرسنل و گزارشات بررسی شود.
