# شروع کار روی Rayo Admin

مبنای بررسی: `main` پس از commit `1c31f0f` (2026-10-05)؛ محصول v10.12.1. برنامه MPA با اسکریپت‌های سراسری و patchهای ترتیبی است (HTML/CSS/JavaScript، بدون Build/npm). React و SQL هدف پیشنهادی‌اند. Controller مرجع C# وجود دارد، ولی Backend قابل Build و وضعیت استقرار آن در دسترس نیست.

نسخهٔ HTML این مستندات: `docs/index.html` (از طریق HTTP).

**تنها مبنای توسعه شاخهٔ `main` همین مخزن است.** نسخه‌های قبلی روی سرور (`rayocafe.ir/panel` و `rayocafe.ir/panel4`) در 2026-10-04/05 در `main` ادغام شدند. همهٔ نسخه‌ها از **یک API و یک دادهٔ زنده** (`js/app-config.js` → `https://chat.yekzan.com`) استفاده می‌کنند؛ هر کپی HTML روی دادهٔ واقعی می‌نویسد.

## ترتیب اعتبار و مطالعه

برای **تشخیص وضعیت پیاده‌سازی**: سورس و تست جاری ← آخرین درخواست صریح کاربر ← مراجع جدید. درخواست کاربر جهت تغییر مطلوب را تعیین می‌کند؛ وجود درخواست، اثبات پیاده‌شدن آن نیست. `AGENTS.md` و قواعد حفظ داده همیشه اعمال می‌شوند. تاریخچه فقط در Git است.

1. `git status --short` و `AGENTS.md` را بخوانید؛ تغییرات کاربر را حفظ کنید.
2. [ماتریس قابلیت‌ها](FEATURE_STATUS_MATRIX.md) و فقط سند/بخش مرتبط را انتخاب کنید.
3. HTML صفحه، تمام scriptهای آن (ترتیب در بخش ۷ [مرجع فنی](CURRENT_IMPLEMENTATION.md))، loaderهای پویا و CSS مربوط را بررسی کنید؛ مالک نهایی تابع ممکن است patch متأخر باشد و برخی ماژول‌ها view را **جایگزین** می‌کنند (مثل `10` برای داشبورد).
4. نام فایل، فیلد یا API را حدس نزنید. در ابهام `Unverified` ثبت کنید.

| کار | مطالعهٔ لازم |
|---|---|
| UI، route، startup، داشبورد | [مرجع فنی](CURRENT_IMPLEMENTATION.md)، HTML، `js/00-base.js`، `js/10-rayo-stability-v7.js`، `js/16-mpa-shell.js`، `js/44-phase1-polish-v10-10-1.js` و مالک صفحه |
| تنظیمات و هاب تنظیمات نرم‌افزار | `js/48-software-settings-hub.js`، 16، 44؛ [صفحهٔ تنظیمات و Reset](SETTINGS_SEPARATION_AND_TABLE_RESET.md) |
| داده، Load/Save، Query/Mutate | [مرجع داده](DATA_AND_API_REFERENCE.md)، `js/config.js` و Controller مرجع |
| قلم، رسپی، قیمت | [مشخصات محصول](PROJECT_MASTER_SPEC.md)، فایل‌های 08، 32، 43، 45، 47؛ [افت آماده‌سازی](STANDARD_PREPARATION_LOSS.md) |
| انبار، ورود، شمارش، مصرف | فایل‌های 09، 14، 32، 35، 36، 40، 43، 46؛ [کنترل تک‌انبار](UNIFIED_INVENTORY_CONTROL.md)، [ورود به انبار](INVENTORY_RECEIPT_UI.md)، [برآورد مصرف](OPERATIONAL_CONSUMPTION_FORECAST.md) |
| خرید، تأمین، فاکتور (سریع/تفصیلی)، پرداخت | فایل‌های 04، 42، 43، 46؛ [گردش تأمین](SUPPLIER_WORKFLOWS.md) |
| صندوق و گردش وجوه | فایل‌های 11، 20، 22، 40، 42، `cash-report/js/app.js`؛ [گردش وجوه](CASH_CUSTODY_AND_DESTINATIONS.md) |
| مالی، P&L، پیش‌بینی هزینه | فایل 20 و بخش مالی [مرجع داده](DATA_AND_API_REFERENCE.md) |
| ورود اعداد (ارقام فارسی/سه‌رقمی) | `js/35-operational-closeout-v10-2.js` (`RayoNumberUX`) |
| Import Excel/CSV | `js/18-excel-tools.js` و importer حوزه؛ [قالب‌ها](EXCEL_IMPORT_FORMATS.md) |
| تنظیمات/بکاپ/Reset | فایل‌های 38 و 39؛ [راهنمای Reset و Restore](SETTINGS_SEPARATION_AND_TABLE_RESET.md) |
| معماری، تصمیم‌ها و مهاجرت | [راهنمای چهار مسیر و دفتر تصمیم‌ها](REBUILD_AND_MIGRATION_GUIDE.md)؛ پیشنهاد را با وضع جاری مخلوط نکنید |

## قواعد حساس

- مرجع اقلام `pricing.ingredients` است؛ `suppliers.items` فقط سازگاری قدیمی. `category` و `itemType` مستقل‌اند.
- **تک‌انبار**: `unifiedMode()` همیشه true؛ انبار ۸ تب دارد (موجودی، ورود به انبار، ثبت فروش، ثبت پرتی و ضایعات، انبارگردانی و مغایرت، کنترل روزانه نوشیدنی، نیازمند سفارش، تنظیمات انبار). انتقال داخلی ثبت نمی‌شود. هر قلم از آخرین شمارش کل خودش ادامه می‌دهد مگر سطح کنترل «دقیق» داشته باشد. فاکتور خرید و گزارش صندوق موجودی را تغییر نمی‌دهند.
- شناسه، کد سپیدز و snapshot تاریخی ثابت بمانند. حذف فیزیکی سابقه ممنوع است (ابطال/آرشیو)؛ چند مسیر Legacy هنوز این قاعده را نقض می‌کنند و در مرجع فنی (CUR-03/04) ثبت شده‌اند.
- Load عادی API-only است؛ Seed و DEFAULT_DATA جایگزین دادهٔ زنده نمی‌شوند. Initialize صریح برای ماژول خالی/404، با Reset همهٔ جداول متفاوت است. Gateway ذخیرهٔ ماژولی را که Load زنده‌اش موفق نبوده رد می‌کند.
- نتیجهٔ صفحه‌بندی‌شدهٔ Query سند کامل نیست؛ آن را به Save ندهید. خطای Load/Query را صفر یا Empty موفق فرض نکنید.
- Save معمول پس از Load موفق و initialized بودن ماژول است و GET تأییدی دارد؛ تطابق token به‌تنهایی اثبات حفظ تمام فیلدها نیست. unknown fields باید حفظ شوند.
- تغییر ساختاری/مخرب داده: ابتدا Backup، Preview، نقشهٔ migration و Rollback؛ فقط با عملیات صریح مدیر. هیچ مهاجرتی در Load ننویسید.
- اسکریپت جدید اضافه نکنید مگر اصلاح مالک فعلی ایمن نباشد. RTL، IRANSansX و تم موجود حفظ شوند. با تغییر هر JS/CSS، پارامتر cache ارجاع آن را در همهٔ HTMLها و loaderهای پویا تازه کنید.

## کنترل‌های آغاز و پایان

```powershell
git status --short
Get-ChildItem js -Filter *.js | ForEach-Object { node --check $_.FullName }
node qa_gateway.js
node qa_page_startup.js
node qa_settings_reset.js
node qa_v10_12_1.js
git diff --check
git diff
```

QA هر حوزه و فهرست شکست‌های شناخته‌شده در بخش ۶ [مرجع فنی](CURRENT_IMPLEMENTATION.md) است؛ همه را سبز معرفی نکنید. آزمون مرورگر روی دادهٔ زنده فقط خواندنی است: هر درخواست `/Save` خطا شمرده شود و پنجره‌های `confirm` با «انصراف» بسته شوند.

پیش‌فرض **نخوانید**: Backupها، `seed/source-excel/archive/`، دادهٔ زنده، `temp/` و fixture `RAYO_DATA_MODEL_v10_8_0.json`. [سیاست مستندات](DOCUMENTATION_POLICY.md) مرز اسناد را تعیین می‌کند.
