# QA Report — Rayo Admin v10.0.0

## Scope

این QA روی نسخه یکپارچه Inventory / Cost Control / Sepidz Audit انجام شده است. هدف، کنترل Regression در ماژول‌های موجود و تست مستقیم منطق‌های جدید بوده است.

## Static / Structural QA

- JavaScript syntax: **36 / 36 PASS** با `node --check`.
- Seed JSON validation: **11 / 11 PASS**.
- Structural assertions: **90 / 90 PASS**.
- `SplitCost` در Runtime JS: **یافت نشد**.
- عبارت/نمای قدیمی Error Log مبتنی بر «این مرورگر»: **یافت نشد**.
- CSS اصلی: SHA-256 = `24d0591fc19969623f19172b1de09477bc897053cec08312583946297ba7af84` که با CSS اصلی v9.8.1 یکسان است.
- Cache/build marker صفحات v10: **PASS**.

## Inventory Runtime Tests

سناریوی تست Location-based:

- موجودی اولیه انبار اصلی: 100
- انتقال 20 واحد به آشپزخانه
- فروش با رسپی استاندارد
- ضایعات ثبت‌شده

نتیجه:

- Main = 80
- Kitchen = 10
- Recipe Version قبل از تاریخ تغییر = 2 واحد
- Recipe Version بعد از تاریخ تغییر = 3 واحد

وضعیت: **INVENTORY_RUNTIME_PASS**

## COGS / Weighted Average Runtime Test

سناریو:

- Opening: 100 واحد × 10 تومان
- Purchase: 100 واحد × 20 تومان
- Standard sale consumption: 50 واحد
- Actual closing count: 140 واحد

خروجی مورد انتظار و دریافت‌شده:

- Opening Value = 1,000
- Purchases = 2,000
- Weighted Unit Cost = 15
- Standard COGS = 750
- Closing Value = 2,100
- Actual COGS = 900
- Unexplained = 150
- Standard Material Cost = 15%
- Actual Material Cost = 18%
- Count Coverage = 100%

وضعیت: **COGS_RUNTIME_PASS**

## Real Sepidz Excel Parser Tests

تست با فایل‌های واقعی پروژه انجام شده است، نه داده ساختگی Parser.

### Deleted invoice sample

- Event blocks: **48**
- Item rows: **205**
- Parse warnings: **0**
- Event IDs unique: **PASS**
- Item IDs unique: **PASS**

### Edited invoice sample

- Edit event blocks: **31**
- BEFORE rows: **168**
- AFTER rows: **157**
- Total snapshot item rows: **325**
- Derived changes: **57**
  - `ITEM_REMOVED`: 23
  - `ITEM_ADDED`: 12
  - `QTY_DECREASED`: 10
  - `ITEM_REPLACED`: 12 summary candidates
- Parse warnings: **0**
- Event / item / change IDs unique: **PASS**

Exact-header priority نیز تست شد تا `شماره فاکتور` با `شماره فاکتور روز` و `ساعت` با `ساعت ویرایش/حذف` اشتباه نشود.

وضعیت: **SEPIDS_REAL_SAMPLE_PARSE_PASS**

## Staff Panel Runtime Tests

Viewهای زیر با State نمونه Runtime render شدند:

- ضایعات / مصرف مجاز
- انتقال موجودی
- شمارش موجودی Blind

همچنین ثبت مصرف مجاز از پنل پرسنل تست شد و همزمان:

1. `inventoryMovements` به‌روزرسانی شد.
2. `consumptionRecords` برای نمایش/بررسی مدیریتی ایجاد شد.

وضعیت: **STAFF_RUNTIME_PASS**

## Error Log Runtime Test

Race condition بین Capture یک خطای جدید و Load دیرتر JSON سرور تست شد. خطای ثبت‌شده در حین Load بعد از پاسخ API همچنان در Cache و JSON قابل نگهداری است و با پاسخ سرور overwrite نمی‌شود.

وضعیت: **ERRORLOG_RUNTIME_PASS**

## Excel Templates

دو فایل نمونه Sanitized با `artifact_tool` ساخته و دوباره Import/Inspect شدند:

- `templates/sepids_deleted_template.xlsx`
- `templates/sepids_edited_template.xlsx`

Headerها و Markerهای Block در فایل خروجی Verify شدند.

## Regression / Compatibility

- CSS اصلی تغییر نکرده است.
- API runtime همچنان RayoData است.
- داده‌های Legacy inventory به‌صورت destructive حذف نمی‌شوند؛ migration لایه جدید را اضافه می‌کند.
- Purchase invoice → stock receipt → ingredient price history حفظ شده است.
- منوهای Personnel / Training / Checklist / Assets / Suppliers و قابلیت‌های قبلی در ساختار نسخه باقی مانده‌اند.
- Permissionهای جدید Inventory به مدل موجود User Access اضافه شده‌اند و جایگزین Permissionهای قبلی نشده‌اند.

## Known Deployment Dependencies / Limitations

1. Backend باید دو Module زیر را در Allowlist بپذیرد:
   - `errorlog`
   - `sepidsaudit`

2. برای Excel، Loader ابتدا `js/xlsx.full.min.js` را محلی امتحان می‌کند و در صورت نبودن آن از fallback اینترنتی استفاده می‌کند. فایل vendor محلی در Source فعلی موجود نبود و در این بسته اضافه نشده است. برای Import کاملاً مستقل از اینترنت، فایل سازگار باید در همین مسیر روی هاست قرار گیرد.

3. Parser اختصاصی فقط برای دو نمونه واقعی موجود ساخته شده است:
   - Deleted Invoice
   - Edited Invoice

   ساختار گزارش‌های تخفیف، برگشت، تغییر تسویه یا Audit Trail کامل سپیدز تا دریافت نمونه واقعی حدس زده نشده است.

4. Recipe Versioning از v10 به بعد قابل اتکاست. تاریخچه تغییرات رسپی که قبل از v10 هیچ‌جا ثبت نشده، قابل بازسازی خودکار نیست؛ رسپی موجود در Migration به‌عنوان Legacy Snapshot ثبت می‌شود.

5. COGS واقعی زمانی معتبرتر است که Opening/Count ابتدا و Count پایان دوره برای Locationهای فعال پوشش کافی داشته باشد. UI درصد Coverage را نشان می‌دهد.

## Browser / Live API limitation of this QA environment

تست‌های Runtime با VM ایزوله و State/API mock انجام شده‌اند و Parser با Excelهای واقعی پروژه تست شده است. در محیط ساخت امکان اجرای Deploy واقعی روی API تولید و Smoke Test کامل مرورگر روی هاست رایو وجود نداشت. بنابراین بعد از Deploy، Smoke Test واقعی Load/Save برای `inventory`, `pricing`, `personnel`, `errorlog`, `sepidsaudit` باید انجام شود.

## Final Result

**PASS — آماده Deploy کنترل‌شده، با رعایت وابستگی‌های Backend و Bootstrap عملیاتی انبار.**
