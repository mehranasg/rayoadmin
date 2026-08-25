# QA Report — Rayo Admin v9.5.2 Phase 2

## هدف
بازبینی کامل درخواست‌های فاز دوم روی سورس واقعی v9.5.0 و اصلاح ایرادهای Runtime بدون تغییر طراحی، گرافیک، ناوبری یا ساختار کلی صفحات.

## نتیجه کلی
وضعیت: **PASS با یک محدودیت محیط تست**

- همه فایل‌های JavaScript از نظر Syntax بررسی شدند: PASS.
- همه JSONها معتبرند: PASS.
- قرارداد Runtime API روی `RayoData` و ۸ ماژول بررسی شد: PASS.
- هیچ استفاده Runtime از `SplitCost/Load` یا `SplitCost/Save` پیدا نشد: PASS.
- HTML/CSS/ساختار ظاهری بازطراحی نشد. تغییر HTML فقط Version/Cache Bust است: PASS.
- تست کامل Browser روی API واقعی در محیط ساخت به دلیل محدودیت Navigation/Browser محیط امکان‌پذیر نبود؛ Smoke Test روی هاست پس از Deploy لازم است.

## یافته اصلی — حساب کاربری پرسنل

### مشکل
فاز دوم فیلدهای `pv_username`, `pv_user_password`, `pv_user_enabled` و Permissionها را Inject می‌کرد، اما دکمه ذخیره فرم واقعی پرسنل از Patch بانکی V6.4 همچنان `savePersonnelV64()` را صدا می‌زد. Phase 2 مسیر دیگری را Wrap کرده بود؛ بنابراین ذخیره حساب کاربری قابل اتکا نبود و بسته به Overrideهای Runtime می‌توانست اصلاً در مسیر واقعی فرم قرار نگیرد.

### اصلاح
- آخرین `editPersonnel` و Saver واقعی Runtime مبنا قرار گرفت.
- همان دکمه ذخیره موجود فرم به Saver فاز دوم Rebind شد؛ دکمه/ظاهر جدیدی ساخته نشد.
- بعد از ذخیره فیلدهای پایه، همان رکورد پرسنل شناسایی و این فیلدها Persist می‌شوند:
  - `username`
  - `userPassword`
  - `userAccess.enabled`
  - `userAccess.permissions.cashReport`
  - `userAccess.permissions.purchaseRequests`
  - `userAccess.permissions.purchaseInvoices`
  - `userAccess.permissions.tips`
  - `userAccess.permissions.surveys`
- Username تکراری رد می‌شود.
- اگر پنل فعال باشد، Username و Password الزامی‌اند.
- اطلاعات بانکی و سایر فیلدهای قبلی فرم دست‌نخورده‌اند.

## تطبیق درخواست‌های فاز دوم

| درخواست | وضعیت | نتیجه بررسی |
|---|---|---|
| Import Excel/CSV برای داده‌های پرتکرار | PASS | پرسنل، تأمین‌کنندگان، آیتم منو، مواد اولیه/قیمت، رسپی، فروش، ضایعات، فاکتور خرید و اموال موجود است. |
| Import فروش روزانه برای مغایرت | PASS + FIX | موجود بود؛ Import مجدد همان فایل اکنون جایگزین می‌شود و فروش دوبرابر نمی‌شود. |
| Import پرتی و ضایعات | PASS + FIX | موجود بود؛ Import مجدد همان فایل اکنون جایگزین می‌شود و ضایعات دوبرابر نمی‌شود. |
| P&L ماهانه | PASS | فروش از صندوق، خرید از فاکتور، حقوق/پاداش از Personnel؛ Override دستی و سایر درآمد/هزینه موجود است. |
| VAT 10% و مالیات عملکرد 5% | PASS | پارامتریک و در Settings قابل تغییر است. |
| هزینه‌های جاری دسته‌بندی‌شده | PASS | Categories قابل مدیریت و Entry درآمد/هزینه قابل ثبت/ویرایش است. |
| محاسبه‌گر سود و سربه‌سر | PASS + FIX | موجود است؛ لینک مستقیم تب‌های Finance نیز اصلاح شد. |
| نام کاربری و رمز عبور پرسنل | PASS + FIX اصلی | مسیر واقعی فرم و ذخیره اصلاح شد. |
| پنل پرسنل — شیفت کلی/شخصی | PASS | موجود است. |
| درخواست مرخصی و نتیجه مدیر | PASS | ثبت، تأیید/رد، توضیح مدیر و انتقال درخواست تأییدشده به Leave Records موجود است. |
| دسترسی ویژه گزارش صندوق | PASS | Permission + فرم Staff Panel موجود است. |
| دسترسی ویژه سفارش خرید | PASS | ثبت توسط پرسنل و مشاهده/بررسی توسط مدیر موجود است. |
| دسترسی ویژه فاکتور خرید | PASS | ثبت + Stock Receipt + Ingredient Price History موجود است. |
| دسترسی ویژه انعام | PASS | موجود است. |
| دسترسی ویژه نظرسنجی | PASS | موجود است. |
| نظرسنجی + علت رضایت/نارضایتی | PASS | علت‌ها در Settings مدیریت می‌شوند. |
| نمودار/روند تعداد و درصد رضایت | PASS | روند ماهانه و درصد راضی/ناراضی موجود است. |
| بیشترین علت‌ها | PASS | Top Reasons موجود است. |
| خروجی شماره تلفن مشتریان | PASS | خروجی `rayo-customer-phones.xlsx` موجود است. |

## اصلاح تکمیلی Purchase Invoice / Payment

مطابق درخواست بعدی پروژه، مدل فعلی پرداخت توسعه داده شد و سیستم موازی ساخته نشد.

### Settings
`inventory.settings.paymentLocations` با ID پایدار اضافه/استاندارد شد. محل‌های پیش‌فرض:

1. حساب جاری پارسیان
2. حساب پارسیان کوتاه‌مدت / تنخواه
3. صندوق نقدی
4. تنخواه صندوقدار
5. کارت/حساب دیگر

مدیریت این لیست در همان صفحه موجود «تنظیمات و فهرست‌ها» انجام می‌شود؛ ناوبری جدید اضافه نشده است.

### Invoice Admin
- وضعیت تسویه: `تسویه‌نشده / تسویه جزئی / تسویه‌شده`
- مبلغ پرداخت‌شده
- روش پرداخت
- محل پرداخت
- برای مبلغ پرداختی مثبت، محل پرداخت الزامی است.
- پرداخت مستقل تأمین‌کننده نیز محل پرداخت می‌گیرد.
- وضعیت Invoice بعد از پرداخت لینک‌شده بروزرسانی می‌شود.
- مسیر `Invoice → Stock Receipt → Ingredient Price History` حفظ شده است.

### Staff Panel Invoice
همین Ruleهای وضعیت تسویه و محل پرداخت در ثبت فاکتور توسط کاربر دارای Permission اعمال می‌شود.

### Excel Invoice Import
ستون‌های زیر پشتیبانی می‌شوند:
- `وضعیت تسویه`
- `محل پرداخت`

فاکتور دارای پرداخت فقط با Location معتبر Import می‌شود. فاکتور با وضعیت/محل پرداخت نامعتبر Import نمی‌شود و تعداد آن در نتیجه Import اعلام می‌شود.

## اصلاح Import تکراری فروش/ضایعات

برای فایل‌های فروش و ضایعات `sourceImportKey` بر مبنای Fingerprint فایل ذخیره می‌شود. Import مجدد همان فایل بدون تغییر، داده قبلی همان Import را جایگزین می‌کند. این اصلاح برای جلوگیری از دوبرابر شدن مصرف محاسباتی و مغایرت انبار انجام شد.

## اصلاح همگام‌سازی Version / Seed

- Build: `9.5.2`
- Cache Query همه صفحات: `?v=9.5.2`
- `seed/manifest.json`: Build 9.5.2 و هر ۸ ماژول `personnel/suppliers/pricing/inventory/cashreport/assets/finance/survey`
- Payment Locations به Seed/Default Inventory اضافه شد.

## تست‌های انجام‌شده

- JavaScript syntax: **25/25 PASS**
- JSON parse: **9/9 PASS**
- Static feature contracts: **20/20 PASS**
- HTML structure comparison با نسخه اصلی، پس از حذف فقط Version Stringها: **PASS**
- CSS تغییر نکرده است.
- Runtime Endpoint Audit: **PASS**
- No SplitCost Runtime: **PASS**

## محدودیت شناخته‌شده Excel Offline

فایل `js/xlsx.full.min.js` در سورس ورودی وجود نداشت. Importer ابتدا همین فایل Local را جست‌وجو می‌کند و در نبود آن از CDN استفاده می‌کند. بنابراین:

- CSV بدون این وابستگی قابل استفاده است.
- XLSX در صورت دسترسی به CDN کار می‌کند.
- برای کار مطمئن در شرایط اختلال اینترنت ایران، باید فایل رسمی SheetJS/XLSX با نام `js/xlsx.full.min.js` روی هاست قرار گیرد.

این فایل در خروجی حاضر ساخته یا جایگزین نشده چون سورس رسمی آن در بسته ورودی موجود نبود و محیط ساخت نیز اینترنت خارجی قابل اتکا نداشت.

## Smoke Test الزامی بعد از Deploy

1. Add Personnel → نمایش Username/Password/Enabled/Permissions.
2. Save → Reload → Edit همان پرسنل و کنترل Persist.
3. Duplicate Username باید رد شود.
4. Staff Login با Credential ثبت‌شده.
5. Leave request → Admin approve/reject → Staff result.
6. Import مواد اولیه.
7. Import یک فایل فروش و Import دوباره همان فایل؛ تعداد نباید دوبرابر شود.
8. Import یک فایل Waste و Import دوباره همان فایل؛ تعداد نباید دوبرابر شود.
9. Invoice unpaid / partial / paid و Rule محل پرداخت.
10. Payment جداگانه تأمین‌کننده و Update وضعیت Invoice.
11. Invoice Excel با Location معتبر و نامعتبر.
12. کنترل Stock Receipt و Latest Ingredient Price بعد از Invoice.
13. Finance: sales/purchases/payroll/bonus + manual override + entries.
14. Survey: ثبت، Review، Reasons، Report، Phone export.
15. تست Responsive موبایل فرم‌های پرسنل، فاکتور و Staff Panel.

## فایل‌های اصلی تغییرکرده

- `js/19-phase2-admin.js`
- `js/14-ops-integration.js`
- `js/22-staff-panel.js`
- `js/20-finance-module.js`
- `js/09-rayo-inventory-variance-module.js`
- `js/config.js`
- `js/app-config.js`
- `seed/inventory-data.seed.json`
- `seed/manifest.json`
- `EXCEL_IMPORT_FORMATS.md`
- `PHASE_2_README.md`
- HTMLها فقط برای Build/Cache version تغییر کرده‌اند.

## Regression Guard

- طراحی کلاسیک: حفظ شد.
- CSS: بدون تغییر.
- Sidebar / Navigation structure: بدون تغییر.
- Jalali: حفظ شد.
- API architecture: حفظ شد.
- Banking fields personnel: حفظ شد.
- Invoice Inventory/Price side effects: حفظ شد.
