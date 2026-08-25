# مستند جامع انتقال پروژه پنل مدیریت کافه‌رستوران رایو

**نسخه مرجع قطعی:** Rayo Admin v10.8.0  
**تاریخ:** 2026-08-16  
**هدف:** این فایل به‌همراه ZIP سورس v10.8.0 باید برای ادامه پروژه در یک چت جدید، AI دیگر یا توسعه‌دهنده دیگر کافی باشد.  
**Source of Truth فنی:** سورس همین نسخه، `js/config.js`، `js/14-ops-integration.js` و این مستند.

---

## 1. زمینه پروژه

این پروژه پنل مدیریتی و عملیاتی **کافه‌رستوران رایو در لواسان** است. هدف پنل کنترل عملیات واقعی رستوران، کاهش خطای انسانی و مغایرت، مدیریت پرسنل و شیفت، خرید و تأمین، بهای تمام‌شده، انبار، صندوق، فروش، دارایی، مالی، نظرسنجی و ممیزی سپیدز است.

سند `Rayo_Sheets_HTML_Project_Brief.md` مرجع اصول طراحی داده و فرایند است؛ اما پنل فعلی دیگر صرفاً HTML متصل به Google Sheets نیست. معماری جاری:

```text
HTML + CSS + Classic JavaScript
        ↓
RayoData HTTP API
        ↓
10 JSON modules on backend
```

### قواعد ثابت پروژه

- UI فارسی و RTL باقی بماند.
- تغییرات جدید نباید قابلیت‌های موجود را بدون درخواست صریح حذف کنند.
- از بازسازی کامل پروژه بدون ضرورت پرهیز شود؛ پروژه Patch-heavy است و Regression خطر اصلی است.
- مبالغ عملیاتی عمدتاً **تومان** هستند.
- تاریخ عملیاتی عمدتاً شمسی `YYYY/MM/DD` است.
- داده عملیاتی باید از API لود شود و روی API ذخیره شود؛ LocalStorage/Seed منبع داده زنده نیستند.
- برای Saveهای مهم، موفقیت POST به‌تنهایی کافی نیست؛ بازخوانی تأییدی سرور لازم است.
- داده‌های انبار، مالی و پرسنل نباید با داده نمونه/Seed به‌صورت خودکار جایگزین شوند.

---

## 2. نسخه فعلی: v10.8.0

v10.8.0 بر مبنای v10.7.0 ساخته شده و تغییر اصلی آن **حذف کامل Bootstrap/Seed خودکار از Runtime عادی** است.

### سیاست جدید Seed

سه مسیر کاملاً جدا هستند:

```text
Load عادی:
Server API → Browser

Save عادی:
User change → Server API → Verify GET

Seed:
Settings → انتخاب صریح Module → Preview → INITIALIZE/RESET → Server
```

در Load عادی، Seed حتی خوانده نمی‌شود.

### وضعیت Initialized

Gateway برای هر Module وضعیت Runtime نگه می‌دارد:

```text
state: idle / loading / ready / error
initialized: true / false / null
```

- پاسخ خالی `{}` → `initialized=false`
- پاسخ واقعی دارای ساختار → `initialized=true`
- Save عادی روی Module با `initialized=false` مسدود است.
- اولین Write فقط از ابزار «بارگذاری اطلاعات اولیه» با `allowInitialize=true` مجاز است.
- HTTP 500 هیچ‌وقت مجوز Initialize یا Save Default/Seed ایجاد نمی‌کند.

### ابزار جدید تنظیمات: بارگذاری اطلاعات اولیه

صفحه:

```text
personnel.html?view=settings
```

فایل:

```text
js/39-manual-initial-data-v10-8.js
```

روند:

1. مدیر Module را انتخاب می‌کند.
2. Live API خوانده می‌شود.
3. وضعیت `مقداردهی‌شده / مقداردهی‌نشده` نمایش داده می‌شود.
4. Seed همان Module فقط در این لحظه و به درخواست مدیر خوانده می‌شود.
5. خلاصه تعداد رکوردهای Live و Seed نمایش داده می‌شود.
6. اگر Live قبلاً Initialized باشد، دکمه «بارگذاری اطلاعات اولیه» قفل است.
7. اگر Uninitialized باشد، مدیر باید عبارت `INITIALIZE` را وارد کند.
8. Seed با `meta.initialized=true` ذخیره می‌شود.
9. Save با GET مجدد تأیید می‌شود.

### Reset از Seed

Reset عملیات جدا و خطرناک است:

- فقط برای Module Initialized فعال است.
- قبل از Reset، JSON داده زنده همان Module دانلود می‌شود.
- مدیر باید عبارت `RESET FROM SEED` وارد کند.
- سپس Seed روی Module جایگزین می‌شود و GET تأییدی انجام می‌شود.

Resetهای Legacy نسخه‌های قبل در UI غیرفعال شده‌اند. دسترسی Seed در JavaScript فقط در دو فایل وجود دارد:

```text
js/config.js
js/39-manual-initial-data-v10-8.js
```

---

## 3. ایمنی داده — بسیار مهم

این بخش باید در تمام نسخه‌های بعدی حفظ شود.

### مشکل تاریخی

در نسخه‌های قدیمی چند مسیر می‌توانستند در شرایط پاسخ خالی/خطای Load باعث نوشته‌شدن Seed یا Default روی Backend شوند:

- `loadOrBootstrap()`
- Seed migration خودکار Pricing/Assets
- Auto-saveهای install-time
- Migration/ensureهای Inventory

این موضوع چند بار باعث شد کاربر اطلاعات واقعی پرسنل یا تنظیمات را ببیند و بعداً دوباره داده مشابه Seed ظاهر شود.

### قانون v10.8.0

**Seed هرگز در Load عادی یا Migration عادی نباید خوانده یا Save شود.**

`loadOrBootstrap(module)` اکنون عملاً فقط:

```js
return loadModule(module);
```

است.

`saveModule()` علاوه بر Load موفق، برای Moduleهای عادی نیاز دارد:

```text
initialized === true
```

مگر در مسیر صریح Initialize/Reset.

### Empty Runtime Schema

برای جلوگیری از Crash ممکن است UI در حافظه Array/Object خالی بسازد. این داده **منبع اولیه عملیاتی نیست** و قبل از Initialize قابل Save عادی نیست.

در HR بعضی Defaultهای محاسباتی/لیست برای سازگاری UI در `migrate()` وجود دارند؛ اما اگر API ماژول HR را Uninitialized گزارش کند، `__RAYO_HR_SERVER_CONFIRMED__` false است و Save عادی قفل می‌شود. این Defaultها نباید با Seed اشتباه گرفته شوند.

---

## 4. Backup

فایل:

```text
js/38-data-safety-backup-v10-7.js
```

تنظیمات → «تهیه بک آپ کامل» تمام Moduleهای Live را مستقیماً از API می‌خواند و ZIP می‌سازد.

قواعد:

- Seed وارد Backup نمی‌شود.
- اگر حتی یک Module Load نشود، ZIP ناقص تولید نمی‌شود.
- Backup شامل `manifest.json` و فایل JSON هر Module است.

این Backup فقط داده API را ذخیره می‌کند؛ فایل‌های سورس Frontend جداگانه در ZIP نسخه پروژه هستند.

---

## 5. API و Backend

تنها محل تنظیم دامنه:

```text
js/app-config.js
```

تنظیم جاری:

```text
API_ORIGIN     https://chat.yekzan.com
API_PREFIX     /api/v1.0
API_CONTROLLER /RayoData
BUILD          10.8.0
```

Endpointها:

```text
GET  https://chat.yekzan.com/api/v1.0/RayoData/Load?module=<module>
POST https://chat.yekzan.com/api/v1.0/RayoData/Save?module=<module>
```

### Module map

| Frontend | Backend module |
|---|---|
| `hr` | `personnel` |
| `suppliers` | `suppliers` |
| `pricing` | `pricing` |
| `inventory` | `inventory` |
| `cashreport` | `cashreport` |
| `assets` | `assets` |
| `finance` | `finance` |
| `survey` | `survey` |
| `errorlog` | `errorlog` |
| `sepidsaudit` | `sepidsaudit` |

**Module جدیدی برای v10.8 لازم نیست.**

### HTTP 500

`HTTP 500 — {"Message":"An error has occurred."}` خطای Backend است. Frontend روی 500 یک Retry محدود دارد ولی 500 را با Seed یا Default پنهان نمی‌کند. در Network باید `module=` درخواست خراب مشخص شود.

---

## 6. Save Status و Verification

Gateway در `js/config.js` وضعیت Save را مدیریت می‌کند:

```text
تغییرات تأیید نشده
→ در حال ذخیره روی سرور
→ ارسال شد؛ در حال تأیید نسخه سرور
→ ذخیره و تأییدشده روی سرور
```

اگر POST موفق باشد ولی GET بعدی `serverSaveToken` یا `updatedAt` جدید را برنگرداند:

```text
ارسال شد اما تأیید سرور انجام نشد
```

نمایش می‌شود و Save به‌عنوان موفق قطعی برنمی‌گردد.

این رفتار برای جلوگیری از «موفقیت ظاهری Save» باید حفظ شود.

---

## 7. ساختار سورس

نسخه v10.8.0 شامل تقریباً:

- 15 صفحه HTML
- 42 فایل JavaScript
- 11 فایل JSON در `/seed`

ساختار:

```text
/
  index.html
  personnel.html
  suppliers.html
  pricing.html
  inventory.html
  cash-report.html
  cash-report-admin.html
  finance.html
  reports.html
  sales-analysis.html
  sepids-audit.html
  assets.html
  survey.html
  staff-login.html
  staff-panel.html

  /css/style.css

  /js/
    app-config.js
    config.js
    00-base.js
    ...
    38-data-safety-backup-v10-7.js
    39-manual-initial-data-v10-8.js

  /seed/
    personnel-data.seed.json
    suppliers-data.seed.json
    pricing-data.seed.json
    inventory-data.seed.json
    cash-report-data.seed.json
    assets-data.seed.json
    finance-data.seed.json
    survey-data.seed.json
    error-log-data.seed.json
    sepids-audit-data.seed.json
    manifest.json

  /templates/
    sepids_deleted_template.xlsx
    sepids_edited_template.xlsx
```

Seed باید روی هاست باقی بماند چون ابزار Initialize/Reset دستی به آن نیاز دارد، اما Runtime عادی به آن دست نمی‌زند.

---

## 8. نکته معماری Classic Script / Lexical Scope

در `00-base.js` Registryهایی مانند:

```js
const views = {...}
const titles = {...}
```

Global lexical binding هستند و الزاماً `window.views` نیستند.

این موضوع قبلاً باعث شد فایل 12 تب انبار روی Runtime نصب نشود.

### قانون

در Classic Scriptهای پنل:

- اگر Registry هسته `views` است، از identifier واقعی `views` استفاده شود؛ `window.views` را بدون Bridge فرض نکنید.
- قبل از افزودن Wrapper جدید مشخص شود Source of Truth واقعی کدام فایل است.

---

## 9. انبار و کنترل مصرف — قانون غیرقابل Regression

این مورد درخواست ثابت کاربر است و باید در تمام نسخه‌های بعدی حفظ شود.

### Sidebar

«انبار و کنترل مصرف» **نباید زیرمنو داشته باشد**. فقط یک لینک مستقیم:

```text
inventory.html
```

### دقیقاً 12 تب

Source of Truth اکنون خود `js/14-ops-integration.js` است، نه Patch نهایی.

1. راهنما و ورک‌فلو
2. موجودی و سفارش
3. ارزش روز موجودی
4. دریافت کالا
5. فروش روزانه
6. محل‌ها و نگاشت‌ها
7. انتقال کالا
8. پرتی و ضایعات
9. شمارش دوره‌ای
10. بهای مواد و بستن دوره
11. روند مغایرت
12. گزارش خسارت و مغایرت

وجود هر نسخه 7 تب قدیمی یا زیرمنوی فاکتور/پرداخت/فروش سپیدز Regression محسوب می‌شود.

### داده‌های Inventory

Top-level مهم:

```text
trackedIngredients
periods
itemMappings
purchaseInvoices
supplierPayments
stockReceipts
wasteRecords
wasteShiftDeclarations
consumptionRecords
salesPeriods
stocktakes
locations
openingBalances
inventoryMovements
periodClosures
changeLog
settings
```

### Workflow استاندارد

```text
فاکتور خرید
→ تأیید دریافت فیزیکی
→ ورود به Location
→ انتقال به سکشن
→ فروش سپیدز/اسنپ
→ کسر مصرف رسپی
→ ثبت ضایعات/مصرف مجاز
→ شمارش واقعی
→ مغایرت
→ بستن دوره/COGS
```

### فروش اسنپ

در تب فروش روزانه:

- From / To
- ورود دستی
- مبلغ هر ردیف = تعداد × قیمت فعلی منو
- جمع کل محاسباتی
- Excel Import
- اگر Excel چند روز دارد، هر روز به رکورد SNAPP مستقل تبدیل می‌شود.

---

## 10. Pricing / مواد اولیه / رسپی

Module: `pricing`

Top-level:

```text
ingredients
menuItems
recipes
recipeVersions
priceHistory
ingredientPriceHistory
settings
lists
changeLog
```

### مواد اولیه

فیلدهای اصلی فعلی:

```text
id
code
name
category
purchaseUnit
recipeUnit
packageQuantity
lastPurchasePriceToman
wastePercent
lastPurchaseDate
status
notes
sepids
```

گروه ماده اولیه در افزودن و ویرایش قابل تغییر است. UI علاوه بر لیست Live، گروه‌های استاندارد رایو را برای جلوگیری از Select تک‌گزینه‌ای نگه می‌دارد.

### packageQuantity

معنی عملیاتی: مقدار پایه داخل بسته خرید به واحد رسپی/انبار قبل از افت. مثال: خرید یک کیلو و رسپی گرم → 1000.

### wastePercent

افت طبیعی و پیش‌بینی‌شده ماده برای محاسبه قیمت قابل مصرف است؛ رکورد Waste واقعی انبار ایجاد نمی‌کند.

```text
usable quantity = packageQuantity × (1 - wastePercent)
```

اگر وزن خالص بعد از افت را مستقیماً در packageQuantity وارد کنید، wastePercent باید صفر باشد تا افت دوبار اعمال نشود.

### نسخه‌های تاریخ‌دار رسپی

Tab مستقل داخل همان Navigation قیمت‌گذاری است و نباید بقیه Tabها را مخفی کند.

برای نسخه‌های قدیمی بدون تاریخ واقعی، UI:

```text
نسخه پایه (تاریخ اولیه نامشخص)
```

نمایش می‌دهد؛ `0000/00/00` نباید نمایش داده شود.

---

## 11. پرسنل و HR

Module Backend: `personnel` / Frontend key: `hr`

داده‌های اصلی:

```text
personnel
weeklyPlans
monthlyPlans
shiftRecords
staffingRequirements
holidays
payrollClosures
tipGroups
penaltiesRewards
workViolations
delays
payments
consumptions
leaves
leaveRequests
advanceRequests
protocols
checklistTemplates
checklistRecords
reservations
dailyMessages
changeLog
```

برخی آرایه‌های جدید در `MODULE_FIELDS` اولیه قدیمی ذکر نشده‌اند ولی چون Source object حفظ می‌شود در JSON Live باقی می‌مانند. هنگام مهاجرت SQL از Data Model v10.8 استفاده شود.

### مدیریت دسترسی

اطلاعات کاربری فعلاً داخل رکورد Personnel نگهداری می‌شود:

```text
username
userPassword
userAccess.enabled
userAccess.permissions
```

Admin می‌تواند رمز کاربران را با آیکون چشم مشاهده کند. در لیست پرسنل «دسترسی‌های اضافه» نمایش داده نمی‌شود؛ مدیریت جزئی Permission داخل پنجره مدیریت دسترسی است.

**Technical debt امنیتی:** `userPassword` فعلاً plaintext است. در SQL/Backend واقعی باید Hash شود و Frontend هرگز Password موجود را دریافت نکند.

### Login

Login ادمین و پرسنل برای نمایش/عدم نمایش رمز از آیکون چشم داخل Input استفاده می‌کنند.

Admin auth فعلی Legacy و Frontend-centric است؛ برای Production واقعی باید به Backend Auth منتقل شود.

---

## 12. پنل پرسنل

صفحه:

```text
staff-panel.html
```

فایل اصلی:

```text
js/22-staff-panel.js
```

موارد مهم فعلی:

- Toolbar بالا Fixed است.
- شیفت پلن کلی: هفته جاری واقعی، هفته قبل/بعد، برگشت به هفته جاری، نمایش بازه شروع تا پایان صحیح.
- شیفت‌های من: این هفته / این ماه.
- انعام‌های من: خلاصه ثبت‌شده / تسویه‌شده / در انتظار.
- مرخصی: فرم جدید Collapsed؛ فقط با کلیک باز می‌شود.
- دریافتی و مساعده: ماه جاری/ماه قبل.
- جریمه/پاداش/تخلف: امکان مخفی‌کردن جریمه مالی از تنظیمات مدیریت.
- شکستگی/آسیب: Picker فشرده دارایی شمارشی.
- Checklist فقط برای **امروز** قابل ثبت/ویرایش است؛ گذشته Read-only و آینده غیرقابل ثبت.
- کلید برگشت رنگ متمایز دارد.

---

## 13. Suppliers / Procurement

Module: `suppliers`

Top-level:

```text
suppliers
items
supplierItems
purchaseRequests
changeLog
lists
meta
```

فاکتور خرید و پرداخت تأمین‌کننده در عملیات Procurement/Suppliers قرار می‌گیرند؛ Navigation قدیمی آنها نباید به Sidebar انبار برگردد.

---

## 14. Cash Report و Sales Analytics

Module: `cashreport`

Top-level:

```text
cashiers
reports
salesAnalytics
changeLog
settings
```

`cashreport.salesAnalytics` شامل:

```text
daily
monthly
itemDaily
```

اطلاعات Excel تحلیل فروش پس از Import با Save تأییدشونده روی همین Module ذخیره می‌شود؛ JSON/Module جدید Backend لازم نیست.

در تحلیل فروش:

```text
میانگین رقم هر فاکتور (حدودی)
```

به پایین تا نزدیک‌ترین 10,000 تومان Round می‌شود:

```text
2,654,234 → 2,650,000
```

---

## 15. Assets

Module: `assets`

Top-level:

```text
assets
maintenanceRecords
quantityTransactions
assetIncidents
counts
settings
lists
changeLog
```

ارزش‌گذاری دارایی براساس قیمت مبنا، نرخ ارز و استهلاک وجود دارد. دارایی‌ها می‌توانند numbered/countable باشند.

---

## 16. Finance

Module: `finance`

Top-level:

```text
entries
monthlyOverrides
settings
changeLog
```

پارامترهای فعلی شامل VAT، مالیات عملکرد، دسته‌های هزینه/درآمد و Calculator Defaults هستند. گزارش تقریبی سود می‌تواند خرید، حقوق، اجاره، مدیریت، قبوض و سایر هزینه‌ها را ترکیب کند.

---

## 17. Survey

Module: `survey`

Top-level:

```text
responses
settings
changeLog
```

Channelها و رضایت/علت‌ها از settings خوانده می‌شوند.

---

## 18. Error Log

Module: `errorlog`

برای ثبت خطاهای Frontend و Context استفاده می‌شود. خطاهای Backend 500 باید از Network/Server Log نیز بررسی شوند؛ ErrorLog جایگزین لاگ Backend نیست.

---

## 19. Sepidz Audit

Module: `sepidsaudit`

Top-level:

```text
importBatches
rawBlocks
events
eventItems
changes
alerts
reviews
links
settings
meta
```

برای Import و تحلیل حذف/ویرایش فیش‌های سپیدز و Risk Flag استفاده می‌شود.

---

## 20. Excel Import

فایل عمومی:

```text
js/18-excel-tools.js
```

Importها باید Header-based باشند و فقط به شماره ثابت ستون وابسته نشوند. فایل‌های فروش/اسنپ، Pricing، Suppliers و Audit از این Framework یا Wrapperهای آن استفاده می‌کنند.

در Import داده‌های حساس، بعد از Load شدن فایل و تأیید کاربر، Save روی API انجام شود و اگر Persist لازم است `verify:true` باشد.

---

## 21. Money و Jalali

مشکل تاریخی: Formatter مبلغ فیلدهایی مثل «تاریخ فروش» را به دلیل کلمه فروش، Money Input تشخیص می‌داد و تاریخ را سه‌رقم سه‌رقم جدا می‌کرد.

قانون:

- `data-jalali`
- classهای Jalali
- date / fromDate / toDate / day / month / year / time

نباید Money formatter شوند.

Jalali helper اصلی:

```text
js/13-jalali-picker.js
```

برای محاسبه هفته، از مبدل معتبر همین هسته استفاده شود؛ تبدیل قدیمی که 1405 را اشتباه Gregorian می‌کرد دوباره استفاده نشود.

---

## 22. ترتیب Script و Patch-heavy architecture

پروژه چند نسل Patch دارد. مهم‌ترین ترتیب ذهنی:

```text
app-config.js
config.js                    ← API/Data gateway
00-base.js                   ← HR core + views lexical registry
...
14-ops-integration.js        ← Core 12-tab inventory navigation
...
22-staff-panel.js            ← staff UI
23-personnel-management...
25-user-management...
...
32-inventory-cost-control... ← advanced inventory/cost logic
34-final-operational-review...
35-operational-closeout...
36-final-inventory-consolidation...
37-requested-fixes...
38-data-safety-backup...     ← live backup
39-manual-initial-data...    ← only manual Seed UI
```

### قانون تغییر آینده

قبل از Patch جدید:

1. Runtime Source واقعی را پیدا کنید.
2. اگر قابلیت در Core قابل اصلاح است، Wrapper جدید نسازید.
3. Regression test روی Navigation/Save/Data source انجام دهید.
4. Seed policy را تغییر ندهید.

---

## 23. Deployment

ZIP نسخه Flat است؛ فایل‌های HTML در Root قرار دارند.

Deploy توصیه‌شده:

1. از پوشه فعلی هاست Backup بگیرید.
2. فایل‌های نسخه جدید را جایگزین کنید.
3. **Seedها را هم Upload کنید** چون Initialize دستی به آنها نیاز دارد؛ اما وجود Seed به معنی استفاده Runtime نیست.
4. Hard refresh انجام دهید.
5. Network را برای `RayoData/Load` و `Save` بررسی کنید.
6. در Settings وضعیت Initialize ماژول‌ها را بررسی کنید.
7. هیچ Module Initialized را با «بارگذاری اولیه» نباید بتوان Overwrite کرد.

---

## 24. Regression Checklist اجباری

بعد از هر نسخه حداقل این موارد تست شوند:

### Data safety

- Load عادی هیچ Request به `/seed/` نمی‌زند.
- API `{}` → initialized=false.
- Save عادی Module uninitialized → Block.
- Manual Initialize فقط با `INITIALIZE`.
- Module initialized → دکمه Initial Load غیر فعال.
- Reset → Backup + `RESET FROM SEED`.
- HTTP 500 → هیچ Seed/Default Write انجام نشود.

### Inventory

- Sidebar بدون زیرمنو.
- دقیقاً 12 تب.
- `pricing=null` باعث Crash `ingredients` نشود.

### Save

- POST موفق ولی Verify ناموفق → Success قطعی نمایش داده نشود.

### Staff

- Login/permissions.
- Week range شروع/پایان درست.
- Checklist گذشته/آینده غیرقابل ثبت.

### Pricing

- افزودن/ویرایش Ingredient Category.
- Recipe versions همه Tabها را حفظ کند.

---

## 25. QA v10.8.0

در Build محلی:

- 42/42 JavaScript syntax PASS
- 11/11 Seed JSON parse PASS
- 389 local HTML references / 0 missing
- 13/13 Data-safety static contracts PASS
- Runtime test:
  - Empty API → initialized=false PASS
  - Normal save before initialize blocked PASS
  - Seed fetched only after explicit call PASS
  - Manual initialize POST allowed PASS
  - Existing live module initialized=true PASS
  - Normal save on initialized live module PASS
- Inventory 12-tab regression PASS
- Inventory direct sidebar regression PASS

Full live Backend behavior باید بعد از Deploy با API واقعی تأیید شود؛ محیط Build به Backend Production دسترسی قابل اتکا برای Write ندارد.

---

## 26. فایل‌های Data Model برای SQL Server

همراه v10.8 دو فایل ساخته شده‌اند:

```text
RAYO_DATA_MODEL_SQL_MIGRATION_v10_8_0.md
RAYO_DATA_MODEL_v10_8_0.json
```

فایل Markdown توضیح معماری رابطه‌ای، ERD، ترتیب Migration و جدول‌ها را دارد.

فایل JSON ماشین‌خوان شامل:

- 10 Module
- 83 جدول پیشنهادی
- ستون‌ها و SQL type پیشنهادی
- مسیر فعلی JSON
- PK پیشنهادی
- روابط اصلی FK
- مشخص‌کردن observed/proposed fields

برای ساخت DDL نهایی، اول چند نمونه Live از آرایه‌هایی که Seed آنها خالی است Export شود؛ مخصوصاً `cashreport.reports`, `finance.entries`, `survey.responses`, `payrollClosures.rows`.

---

## 27. Technical Debtهای شناخته‌شده

1. پروژه تعداد زیادی Patch تاریخی دارد؛ Consolidation تدریجی توصیه می‌شود.
2. Admin auth و Staff password هنوز معماری Production-grade ندارند.
3. `userPassword` plaintext در JSON فعلی است؛ در SQL باید حذف و Hash شود.
4. برخی HR structures مثل `weeklyPlans.cells` / `monthlyPlans.cells` Object-map هستند؛ در DB باید Normalize شوند.
5. بعضی Module schemas در Seed رکورد نمونه ندارند؛ قبل از SQL DDL نهایی Live export لازم است.
6. Jalali string برای UI خوب است اما SQL Query/Index بهتر است Gregorian date موازی داشته باشد.
7. Backend فعلی فایل/ماژول JSON است؛ برای Concurrency واقعی SQL نیاز به RowVersion/Transaction/Optimistic concurrency دارد.

---

## 28. دستور به AI/Developer بعدی

اگر این مستند و سورس به AI دیگری داده شد، باید این قواعد را رعایت کند:

1. v10.8.0 را Baseline بداند.
2. بدون درخواست، UI/Featureهای دیگر را بازطراحی نکند.
3. قبل از تغییر، Source واقعی Runtime را پیدا کند.
4. Seed هرگز در Runtime عادی خوانده/نوشته نشود.
5. Save روی Module uninitialized را دور نزند.
6. Inventory همیشه direct-link + 12 tabs باقی بماند.
7. خطای HTTP 500 را Backend issue بداند و با Seed fallback پنهان نکند.
8. برای تغییر Data Schema، `RAYO_DATA_MODEL_v10_8_0.json` را هم به‌روزرسانی کند.
9. برای تغییرات مهم، Changelog + QA Report تولید کند.
10. قبل از تحویل ZIP، JS syntax، JSON parse، local refs و regression contracts را اجرا کند.

---

## 29. فایل‌های اصلی که برای ادامه پروژه باید ارسال شوند

حداقل:

```text
Rayo_Admin_v10_8_0_Manual_Seed_SQL_Blueprint_FLAT.zip
RAYO_ADMIN_PROJECT_HANDOFF_v10_8_0.md
RAYO_DATA_MODEL_SQL_MIGRATION_v10_8_0.md
RAYO_DATA_MODEL_v10_8_0.json
QA_REPORT_v10_8_0.md
CHANGELOG_v10_8_0.md
```

با این مجموعه، ادامه پروژه نباید به تاریخچه این Chat وابسته باشد.
