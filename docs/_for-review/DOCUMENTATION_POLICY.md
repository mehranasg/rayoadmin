# سیاست مستندات

## مراجع و مالکیت محتوا

ورودی رسمی [README](../README.md) و شروع AI [AI_START_HERE](AI_START_HERE.md) است. برای خواندن در مرورگر، `docs/index.html` (روی همان سرور HTTP، مثلاً `http://127.0.0.1:8080/docs/index.html`) همهٔ اسناد را از همین فایل‌های `.md` نمایش می‌دهد؛ با افزودن یا حذف سند، فهرست `DOCS` در آن فایل و جدول زیر را با هم به‌روز کنید. مستندات فقط **وضعیت جاری** را توصیف می‌کنند؛ تاریخچهٔ تغییرات فقط در Git است. وضعیت مبنا با commit و تاریخ مشخص می‌شود، نه کپی‌های `final2`، `vNext` یا فایل نسخه‌دار.

| تغییر | سندی که به‌روز می‌شود |
|---|---|
| مسیر شروع/قواعد انتخاب زمینه | AI_START_HERE |
| قابلیت، جریان عملیاتی، شرط پذیرش | [PROJECT_MASTER_SPEC](PROJECT_MASTER_SPEC.md) |
| مالک فایل، loader، ترتیب script، اجرا، بدهی فنی، QA | [CURRENT_IMPLEMENTATION](CURRENT_IMPLEMENTATION.md) |
| JSON، API، فیلد، واحد، migration سازگاری | [DATA_AND_API_REFERENCE](DATA_AND_API_REFERENCE.md) |
| وضعیت و محدودیت قابلیت | [FEATURE_STATUS_MATRIX](FEATURE_STATUS_MATRIX.md) |
| تصمیم مالک/معماری با دلیل، backlog و برنامهٔ مهاجرت | [REBUILD_AND_MIGRATION_GUIDE](REBUILD_AND_MIGRATION_GUIDE.md) (دفتر تصمیم‌ها) |
| قواعد نگهداری | همین سند |

ضمیمه‌های تخصصی (قواعد دقیق یک حوزه): [کنترل تک‌انبار](UNIFIED_INVENTORY_CONTROL.md)، [ورود به انبار](INVENTORY_RECEIPT_UI.md)، [برآورد مصرف](OPERATIONAL_CONSUMPTION_FORECAST.md)، [مدیریت مصرف](CONSUMPTION_MANAGEMENT.md)، [افت آماده‌سازی](STANDARD_PREPARATION_LOSS.md)، [گردش تأمین](SUPPLIER_WORKFLOWS.md)، [صفحهٔ تنظیمات و Reset](SETTINGS_SEPARATION_AND_TABLE_RESET.md)، [گردش وجوه](CASH_CUSTODY_AND_DESTINATIONS.md)، [قالب Excel/CSV](EXCEL_IMPORT_FORMATS.md). [RAYO_ADMIN_MASTER_HANDOFF_v10_12_1](RAYO_ADMIN_MASTER_HANDOFF_v10_12_1.md) فقط اشاره‌گر سازگاری `AGENTS.md` است. محتوا را در چند سند کپی نکنید؛ مرجع اصلی خلاصه و لینک دهد.

منابع ورودی (نه مرجع رفتار): `rayo-ux-product-review-1404.pdf` (بررسی UX)، `Rayo_Soda_Daily_Control.xlsx` (فرم کاغذی نوشیدنی)، `samples/` (fixture ساختگی). `RAYO_DATA_MODEL_v10_8_0.json` در ریشه fixture تست است.

## چه چیزی نوشته نمی‌شود

- گزارش کار یا تحویل («این تغییر…»، فهرست فایل‌های تغییرکرده، آمار PASS/FAIL یک اجرا، «مرورگر در دسترس نبود»). نتیجهٔ کار در پیام commit و گزارش به کاربر می‌آید، نه در `docs/`.
- سند تاریخی، handoff نسخه‌دار یا پرامپت/برنامهٔ اجرانشده. برنامهٔ آینده فقط در راهنمای مهاجرت با برچسب `Planned`.
- مقدار رمز، token، کلید، حساب بانکی، payload شخصی یا Backup زنده.

## اختلاف منابع

برای واقعیت پیاده‌سازی: **سورس/تست جاری، سپس آخرین درخواست صریح کاربر، سپس مراجع**. درخواست کاربر مبنای رفتار مطلوب و مجوز کار است؛ تست یا سورس ممکن است هنوز آن را محقق نکرده باشد. اختلاف را ثبت کنید و برای همسان‌کردن مستندات، برنامه را بی‌درخواست تغییر ندهید.

وضعیت هر قابلیت یکی از `Implemented`، `Partial`، `Planned`، `Deprecated` یا `Unverified` باشد. `Implemented` اثبات استقرار یا صحت دادهٔ زنده نیست؛ شواهد، دامنهٔ آزمون و محدودیت Backend را جدا بنویسید.

## چرخهٔ تغییر

1. قبل از توسعه فقط سند مرتبط، HTML/CSS، تمام patchهای بارشده و تست همان حوزه را بخوانید.
2. تغییر رفتار و قرارداد را در **همان commit** در سند مالک ثبت کنید (رفتار → SPEC/ضمیمه، فایل/QA → CURRENT_IMPLEMENTATION، فیلد → DATA، وضعیت → MATRIX)؛ `Planned` فقط پس از وجود کد و شواهد `Implemented` می‌شود.
3. تصمیم مهم مالک با دلیل، اثر JSON/Backend و rollback در دفتر تصمیم‌های راهنمای مهاجرت ثبت شود. برای هر اصلاح فایل نسخه‌ای تازه نسازید.
4. تغییر صرفاً متنی: لینک‌ها، نمونه‌های JSON و `git diff --check`. تغییر JavaScript: syntax، QA مرتبط، تست صفحه و کنترل عدم Seed/Save در Load.
5. پایان کار: فایل‌های تغییرکرده، نتایج واقعی آزمون، آزمون اجرانشده و اثر داده/Backend به کاربر گزارش شود. ZIP کامل فقط milestone/استقرار یا درخواست صریح.

## حذف سند

اطلاعات معتبر منحصربه‌فرد ابتدا به سند مالک منتقل و لینک‌ها اصلاح شوند؛ سپس فایل حذف شود (قابل بازیابی از Git). قراردادها، migrationها، تست‌ها، Seed، assets و داده صرفاً به‌دلیل نام نسخه‌ای حذف نمی‌شوند. نمونه‌ها ساختگی و برچسب‌دار باشند. مسیر endpoint/فیلد فعلی باید شاهد سورس داشته باشد. نرخ‌های مالی برنامه پارامتر نرم‌افزارند و نباید مقررات مالیاتی جاری معرفی شوند.
