# مستندات قدیمی — برای بررسی مالک

این فایل‌ها بر اساس نیاز پنل قدیمی و اختصاصی رایو نوشته شده‌اند و دیگر **مرجع نیستند**. آنچه کاربرد عمومی داشت در اسناد تازه آمده است:
- **وضعیت:** `../STATE.md`
- **قواعد:** `../reference/BUSINESS_RULES.md`
- **مدل داده:** `../reference/DATA_MODEL_V10.md`
- **طرح‌ها:** `../design/`
- **تصمیم‌ها:** `../DECISIONS.md`

ستون «پیشنهاد» نظر من است. بعد از بررسی، هر کدام را حذف کنید، یا نسخهٔ تازه بدهید تا در جای درستش بگذارم (`BL-017`).

| فایل | محتوا | پیشنهاد |
|---|---|---|
| `AI_START_HERE.md`، `DOCUMENTATION_POLICY.md`، `RAYO_ADMIN_MASTER_HANDOFF_v10_12_1.md` | راهنمای شروع و سیاست مستندات پنل قدیمی | **حذف** — جایشان `CLAUDE.md` و `docs/README.md` است |
| `CURRENT_IMPLEMENTATION.md`، `FEATURE_STATUS_MATRIX.md` | پیاده‌سازی و ماتریس امکانات پنل قدیمی (فایل به فایل `js/00` تا `js/51`) | **حذف** — جایش `STATE.md` است |
| `APP_MIGRATION_LOG.md` | README قبلی اپ جدید: جدول ۴۱ مرحلهٔ انتقال امکانات و نقشهٔ پنل قدیمی ← جدید | **نگه داشتن تا BL-001**، بعد حذف (قواعدش در `BUSINESS_RULES.md` است) |
| `PROJECT_MASTER_SPEC.md` | مشخصات مرجع محصول نسخهٔ 10 (همهٔ بخش‌ها و قواعد) | **بازنویسی عمومی** در پروژهٔ تازه، کنار `design/DESIGN_SPEC.md`؛ بخش‌های اختصاصی رایو حذف |
| `CONSUMPTION_MANAGEMENT.md`، `STANDARD_PREPARATION_LOSS.md`، `UNIFIED_INVENTORY_CONTROL.md`، `OPERATIONAL_CONSUMPTION_FORECAST.md` | روش‌های کنترل مصرف، افت آماده‌سازی، تک‌انبار، برآورد مصرف | **ادغام** در یک سند عمومی «کنترل انبار و مصرف» در `reference/` (روش‌ها عمومی‌اند) |
| `SUPPLIER_WORKFLOWS.md`، `INVENTORY_RECEIPT_UI.md` | گردش تأمین، فاکتور، پرداخت، ورود به انبار | **ادغام** در سند عمومی «خرید و تأمین» |
| `CASH_CUSTODY_AND_DESTINATIONS.md` | حساب‌ها و وجوه نزد اشخاص در گزارش صندوق | **ادغام** در سند عمومی «صندوق و حساب‌ها» |
| `SETTINGS_SEPARATION_AND_TABLE_RESET.md` | تنظیمات و بازنشانی جداول پنل قدیمی | **حذف** بعد از BL-011 |
| `attendance-module-prompt.md` | شرح کار ساخت ماژول حضور و غیاب | **ادغام** قواعدش در سند عمومی «حضور و غیاب» (قواعد فعلی در `BUSINESS_RULES.md`) |
| `index.html` | صفحهٔ فهرست مستندات قدیمی | **حذف** |
| `Rayo_Soda_Daily_Control.xlsx` | فرم کاغذی کنترل روزانهٔ نوشابه | **حذف** (فرم در اپ هست) مگر برای چاپ لازم باشد |
| `rayo-ux-product-review-1404.pdf` | بازبینی تجربهٔ کاربری ۱۴۰۴ | **نگه داشتن** به‌عنوان سابقهٔ طراحی (می‌تواند به `design/` برود) |
| `samples/sepids-audit-data.json` | نمونهٔ دادهٔ ممیزی سپیدز | **حذف** (اختصاصی رایو) |
