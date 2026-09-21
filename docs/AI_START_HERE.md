# شروع کار روی Rayo Admin

مبنای بررسی: `39f5d1c67a82285a67c70e478b261db31afe4d09` روی `main`، 2026-09-19؛ محصول v10.12.1. برنامه MPA با اسکریپت‌های سراسری و patchهای ترتیبی است. React و SQL هدف پیشنهادی‌اند. Controller مرجع C# وجود دارد، ولی Backend قابل Build و وضعیت استقرار آن در دسترس نیست.

## ترتیب اعتبار و مطالعه

برای **تشخیص وضعیت پیاده‌سازی**: سورس و تست جاری ← آخرین درخواست صریح کاربر ← مراجع جدید ← اسناد تاریخی فقط برای سابقه. درخواست کاربر جهت تغییر مطلوب را تعیین می‌کند؛ وجود درخواست، اثبات پیاده‌شدن آن نیست. `AGENTS.md` و قواعد حفظ داده همیشه اعمال می‌شوند.

1. `git status --short` و `AGENTS.md`های مربوط را بخوانید؛ تغییرات کاربر را حفظ کنید.
2. [ماتریس قابلیت‌ها](FEATURE_STATUS_MATRIX.md) و فقط سند/بخش مرتبط را انتخاب کنید.
3. HTML صفحه، تمام scriptهای آن، loaderهای پویا و CSS مربوط را بررسی کنید؛ مالک نهایی تابع ممکن است patch متأخر باشد.
4. نام فایل، فیلد یا API را حدس نزنید. در ابهام `Unverified` ثبت کنید.

| کار | مطالعهٔ لازم |
|---|---|
| UI، route، startup | [مرجع فنی](CURRENT_IMPLEMENTATION.md)، HTML، `js/16-mpa-shell.js`، `js/44-phase1-polish-v10-10-1.js` و مالک صفحه |
| داده، Load/Save، Query/Mutate | [مرجع داده](DATA_AND_API_REFERENCE.md)، `js/config.js` و Controller مرجع |
| قلم، رسپی، قیمت | [مشخصات محصول](PROJECT_MASTER_SPEC.md)، فایل‌های 08، 32، 43، 45، 47؛ [افت آماده‌سازی](STANDARD_PREPARATION_LOSS.md) |
| انبار، رسید، شمارش، مصرف | فایل‌های 09، 14، 32، 35، 36، 40، 43، 46؛ [کنترل یکپارچه کل](UNIFIED_INVENTORY_CONTROL.md)، ضمیمهٔ [رسید](INVENTORY_RECEIPT_UI.md) یا [برآورد](OPERATIONAL_CONSUMPTION_FORECAST.md) |
| صندوق و گردش وجوه | فایل‌های 11، 20، 22، 40، 42، `cash-report/js/app.js`؛ [گردش وجوه](CASH_CUSTODY_AND_DESTINATIONS.md) |
| تنظیمات/بکاپ/Reset | فایل‌های 38 و 39؛ [راهنمای Reset و Restore](SETTINGS_SEPARATION_AND_TABLE_RESET.md) |
| معماری و مهاجرت | [راهنمای چهار مسیر](REBUILD_AND_MIGRATION_GUIDE.md) و مرجع داده؛ پیشنهاد را با وضع جاری مخلوط نکنید |

## قواعد حساس

- مرجع اقلام `pricing.ingredients` است؛ `suppliers.items` فقط سازگاری قدیمی. `category` و `itemType` مستقل‌اند. انبار ۹ تب دارد.
- شناسه، کد سپیدز و snapshot تاریخی ثابت بمانند. حذف فیزیکی سابقه ممنوع است؛ چند مسیر Legacy هنوز این قاعده را نقض می‌کنند و در مرجع فنی ثبت شده‌اند.
- Load عادی API-only است؛ Seed و DEFAULT_DATA جایگزین دادهٔ زنده نمی‌شوند. Initialize صریح برای ماژول خالی/404، با Reset همهٔ جداول متفاوت است.
- نتیجهٔ صفحه‌بندی‌شدهٔ Query سند کامل نیست؛ آن را به Save ندهید. خطای Load/Query را صفر یا Empty موفق فرض نکنید.
- Save معمول پس از Load موفق و initialized بودن ماژول است و GET تأییدی دارد؛ تطابق token به‌تنهایی اثبات حفظ تمام فیلدها نیست. unknown fields باید حفظ شوند.
- تغییر ساختاری/مخرب داده: ابتدا Backup، Preview، نقشهٔ migration و Rollback. این کار نیازمند عملیات صریح مدیر است؛ هیچ مهاجرتی در Load ننویسید.
- اسکریپت جدید اضافه نکنید مگر اصلاح مالک فعلی ایمن نباشد. RTL، IRANSansX و تم موجود حفظ شوند.

## کنترل‌های آغاز و پایان

```powershell
git status --short
rg --files
node --check js/config.js
node qa_gateway.js
node qa_page_startup.js
node qa_settings_reset.js
node qa_v10_12_1.js
git diff --check
git diff
```

QA تخصصی در [مرجع فنی](CURRENT_IMPLEMENTATION.md) آمده است. برخی QAهای نسخه‌ای روی main شکست شناخته‌شده دارند؛ همه را سبز معرفی نکنید. تست مرورگر باید با دادهٔ ساختگی/محیط آزمون و کنترل Network انجام شود.

پیش‌فرض **نخوانید**: تمام `*_v*.md`، Handoffهای قدیمی، Backupها، `seed/source-excel/archive/`، دادهٔ زنده و `temp/`. تنها با نیاز مشخص مراجعه کنید. [سیاست مستندات](DOCUMENTATION_POLICY.md) مرز اسناد تاریخی و مراجع تخصصی را تعیین می‌کند.
