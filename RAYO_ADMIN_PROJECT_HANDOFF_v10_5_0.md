> **سند تاریخی — مرجع وضعیت یا الزام فعلی نیست.** در پالایش 2026-09-19 به‌دلیل احتمال جزئیات منحصربه‌فرد حفظ شد؛ فقط برای بررسی سابقه بخوانید. از [شروع AI](docs/AI_START_HERE.md) وارد مراجع جاری شوید. دستورهای این متن دربارهٔ ۱۲ تب، Bootstrap/Reset از Seed، API دو action، master تأمین‌کنندگان و مسیرهای نسخه‌ای، الزام جاری نیستند. طرح SQL نیز پیاده‌سازی نیست. ارجاع‌های قدیمیِ بدنه سابقه‌اند؛ اصل فایل در Backup و Git مبنا بازیابی می‌شود.

# مستند جامع انتقال پروژه پنل مدیریت کافه‌رستوران رایو

**نسخه مبنا:** Rayo Admin v10.5.0  
**تاریخ مستند:** 2026-08-15 / 1405-05-24  
**هدف:** این فایل به‌همراه پوشه سورس باید برای ادامه پروژه در یک چت جدید یا توسط AI/Developer دیگر کافی باشد.  
**اصل مهم:** سورس همین نسخه و این مستند، مرجع ادامه کار هستند. بدون درخواست کاربر، پروژه از صفر بازسازی نشود و قابلیت‌های موجود حذف یا طراحی کلی UI تغییر نکند.

---

## 1. خلاصه پروژه

این پروژه پنل مدیریتی و عملیاتی **کافه‌رستوران رایو در لواسان** است. هدف پنل، مدیریت عملیات روزانه و کنترل مدیریتی رستوران است؛ شامل پرسنل، شیفت، حقوق، انعام، تأمین‌کنندگان، خرید، قیمت‌گذاری و رسپی، انبار و مغایرت، گزارش صندوق، فروش، دارایی‌ها، امور مالی، نظرسنجی و Audit سپیدز.

پروژه در ابتدا از فایل‌های Excel/Google Sheets شروع شده بود، اما پنل فعلی دیگر یک HTML صرفاً متصل به Google Sheets نیست. **معماری فعلی Admin Panel بر پایه HTML/CSS/JavaScript + API ماژولار JSON است.** سند `Rayo_Sheets_HTML_Project_Brief.md` هنوز برای اصول طراحی داده و فرایند مفید است، ولی Source of Truth فنی پنل فعلی همین سورس و API `RayoData` است.

### قواعد ثابت پروژه

- UI فارسی و RTL باقی بماند.
- قابلیت‌های قبلی بدون دلیل حذف نشوند.
- تغییرات ترجیحاً روی معماری موجود انجام شوند، نه بازنویسی کل پروژه.
- برای داده‌های حساس مالی و انبار، حذف فیزیکی تا حد ممکن به `void/archive` تبدیل شود.
- مبلغ داخلی پنل عمدتاً **تومان** است؛ گزارش صندوق در Meta تاریخی ممکن است ورودی ریال داشته باشد و باید تبدیل آن شفاف بماند.
- تاریخ‌های عملیاتی شمسی با فرمت `YYYY/MM/DD` هستند.
- هر ثبت عملیاتی باید تا حد ممکن شناسه ثابت، تاریخ، کاربر ثبت‌کننده و وضعیت داشته باشد.
- پنل باید روی موبایل قابل استفاده باشد.

---

## 2. نسخه فعلی و تغییرات v10.5.0

نسخه جاری **v10.5.0** از v10.4.1 ساخته شده است.

### Bugfixهای این نسخه

1. **رفع `ReferenceError: ingredientUnit is not defined`**
   - فایل: `js/32-inventory-cost-control-v10.js`
   - علت: `wastePane` و بخش‌های دیگر از `ingredientUnit()` استفاده می‌کردند اما این helper داخل همان Scope تعریف نشده بود.
   - اصلاح: helper زیر در Scope اصلی v10 Inventory تعریف شد:
     - اولویت واحد: `recipeUnit -> unit -> stockUnit -> 'واحد'`

2. **رفع فرمت اشتباه تاریخ به‌عنوان مبلغ**
   - فایل: `js/35-operational-closeout-v10-2.js`
   - علت: Money formatter از Label/ID برای تشخیص مبلغ استفاده می‌کند. فیلدی مثل «تاریخ فروش» به دلیل وجود کلمه «فروش» Money Input تشخیص داده می‌شد و تاریخ مثل `1405/05/24` سه‌رقمی/کاماگذاری می‌شد.
   - اصلاح:
     - هر `input[data-jalali="1"]` از Money formatter مستثنی است.
     - Labelهای شامل `تاریخ`، روز، ماه، سال، ساعت و IDهای `date/jalali/fromdate/todate` مبلغ محسوب نمی‌شوند.
     - اگر فیلدی قبلاً اشتباه `data-v102-money="1"` گرفته باشد و دیگر Money Input نباشد، Marker آن پاک می‌شود.

### تغییر فیچر فروش در v10.5.0

3. **فروش اسنپ از تاریخ تا تاریخ**
   - تب: `انبار و کنترل مصرف > فروش روزانه`
   - ثبت دستی فروش اسنپ دارای دو فیلد است:
     - `از تاریخ`
     - `تا تاریخ`
   - اگر ثبت دستی چندروزه باشد، فروش به‌صورت یک Period تجمیعی ذخیره می‌شود و برای زمان اثر بر موجودی، پایان بازه (`to`) مبناست.
   - برای کنترل دقیق روزانه، Import Excel با ستون تاریخ یا ثبت روزبه‌روز ترجیح دارد.

4. **Import Excel فروش اسنپ**
   - از همان قالب فروش روزانه استفاده می‌کند.
   - ستون‌های قابل شناسایی:
     - تاریخ / تاریخ فروش / روز
     - کد آیتم / کد کالا / کد
     - نام آیتم / نام کالا / شرح
     - تعداد فروش / مقدار فروش / تعداد / qty
     - مبلغ فروش / جمع مبلغ / فروش
   - اگر فایل تاریخ داشته باشد، هر روز به‌صورت رکورد مستقل `SNAPP` در `inventory.salesPeriods` ذخیره می‌شود.
   - اگر بازه چندروزه باشد ولی فایل ستون تاریخ معتبر نداشته باشد، Import متوقف می‌شود تا مصرف روزها به‌اشتباه تجمیع نشود.
   - ردیف‌های خارج از بازه انتخابی Ignore می‌شوند.
   - روزهایی که قبلاً رکورد فعال SNAPP دارند، Duplicate محسوب و رد می‌شوند.

5. **نمایش مبلغ محاسباتی هنگام ورود دستی فروش**
   - فروش عادی آیتم‌های منو: کنار هر ردیف، `تعداد × قیمت فعلی منو` نمایش داده می‌شود.
   - فروش اسنپ: کنار هر ردیف مبلغ محاسباتی و پایین فرم جمع کل محاسباتی نمایش داده می‌شود.
   - هدف: کاربر قبل از ثبت بتواند مغایرت تعداد/مبلغ را تشخیص دهد.

---

## 3. ساختار پوشه سورس

در Root نسخه فعلی تقریباً این ساختار وجود دارد:

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

  /css
    style.css

  /js
    app-config.js
    config.js
    00-base.js
    ...
    37-requested-fixes-v10-4.js

  /seed
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

  /templates
    sepids_deleted_template.xlsx
    sepids_edited_template.xlsx
```

در نسخه v10.5.0 تعداد فایل‌های اصلی:

- 15 صفحه HTML
- 40 فایل JavaScript در `/js`
- 11 فایل JSON در `/seed`

---

## 4. API و Backend

### تنظیم API

تنها محل تغییر دامنه API:

`js/app-config.js`

تنظیم جاری:

```text
API_ORIGIN = https://chat.yekzan.com
API_PREFIX = /api/v1.0
API_CONTROLLER = /RayoData
```

### Endpointهای معتبر

```text
GET  {API_ORIGIN}/api/v1.0/RayoData/Load?module=<module>
POST {API_ORIGIN}/api/v1.0/RayoData/Save?module=<module>
```

### ماژول‌های Backend

| کلید Frontend | نام Module در Backend |
|---|---|
| hr | personnel |
| suppliers | suppliers |
| pricing | pricing |
| inventory | inventory |
| cashreport | cashreport |
| assets | assets |
| finance | finance |
| survey | survey |
| errorlog | errorlog |
| sepidsaudit | sepidsaudit |

**هشدار:** `errorlog` و `sepidsaudit` باید در Allowlist/Map Backend وجود داشته باشند؛ در غیر این صورت خطای HTTP 500 دیده می‌شود.

### Source of Truth داده

- داده عملیاتی از API خوانده و روی API ذخیره می‌شود.
- Seed JSON فقط برای Bootstrap/Migration است و نباید به‌عنوان دیتابیس روزمره روی هاست استفاده شود.
- Gateway اصلی در `js/config.js` است.
- Save در عملیات جدید معمولاً همان لحظه در Action مربوط انجام می‌شود؛ کاربر بعد از هر عملیات جدید لازم نیست دوباره دکمه عمومی «ذخیره روی سرور» بزند.

---

## 5. نکته معماری بسیار مهم: Scope متغیرهای هسته

این موضوع در v10.4.1 باعث شد چند نسخه کد 12 تب انبار را داشته باشند ولی Browser هنوز 7 تب قدیمی را نمایش دهد.

در `js/00-base.js`:

```js
let state = ...
const titles = {...}
const views = {...}
```

این‌ها **Global Lexical Bindings** در Classic Script هستند و الزاماً property روی `window` نیستند.

### قانون مهم برای ادامه توسعه

در ماژول‌هایی که روی صفحات اصلی Admin به‌صورت Classic `<script>` Load می‌شوند:

- برای Registry اصلی از `views` و `titles` استفاده شود، نه `window.views`، مگر اینکه صراحتاً Bridge ساخته شده باشد.
- برای State اصلی نیز فرض نکنید `window.state` همیشه همان `state` است.

### چرا مهم است؟

v10.3/v10.4 ابتدا با `window.views` دنبال Registry بودند. شرط نصب Fail می‌شد و `14-ops-integration.js` با UI قدیمی باقی می‌ماند. v10.4.1 این اتصال را اصلاح کرد.

---

## 6. ترتیب مهم فایل‌های Inventory

در `inventory.html` چند نسل ماژول هنوز Load می‌شوند. ترتیب مهم فعلی تقریباً این است:

```text
00-base.js
...
09-rayo-inventory-variance-module.js      <- Legacy inventory model
...
14-ops-integration.js                     <- Base operational inventory UI
15-management-reports.js
...
18-excel-tools.js
19-phase2-admin.js                        <- Excel imports
...
30-operational-polish-v9-8-0.js
32-inventory-cost-control-v10.js          <- Active v10 inventory/cost engine
34-final-operational-review-v10-1.js      <- Workflow/receipts/reports additions
35-operational-closeout-v10-2.js          <- UI cleanup, money formatter, reset, etc.
36-final-inventory-consolidation-v10-3.js <- Final 12-tab inventory view + Snapp
37-requested-fixes-v10-4.js               <- requested cleanup/fixes
```

### توصیه جدی

پروژه Patch-heavy شده است. برای تغییرات بزرگ آینده:

1. ابتدا بررسی شود فیچر در کدام فایل واقعاً Source of Runtime است.
2. Wrapper جدید بدون ضرورت روی `views.inventory` اضافه نشود.
3. ترجیحاً منطق نهایی انبار به‌تدریج در `32` و `36` Consolidate شود.
4. `09` مدل Legacy است؛ قابلیت جدید مهم روی `09` ساخته نشود.

---

## 7. صفحات اصلی Admin

| صفحه | کاربرد |
|---|---|
| `index.html` | Login / Entry ادمین |
| `personnel.html` | مدیریت پرسنل، شیفت، حقوق، پیام‌ها، دسترسی‌ها و... |
| `suppliers.html` | تأمین‌کنندگان، درخواست خرید، فاکتور و پرداخت |
| `pricing.html` | مواد اولیه، منو، رسپی، بهای تمام‌شده، قیمت‌گذاری |
| `inventory.html` | انبار، مصرف، فروش مبنای موجودی، شمارش و مغایرت |
| `cash-report-admin.html` | گزارش صندوق مدیریتی |
| `cash-report.html` | فرم/صفحه گزارش صندوق |
| `sales-analysis.html` | تحلیل Excelهای فروش سپیدز |
| `reports.html` | گزارش‌های مدیریتی/سود و هزینه |
| `finance.html` | مالی و سود/زیان تقریبی |
| `sepids-audit.html` | Audit حذف/ویرایش فیش سپیدز |
| `assets.html` | اموال و دارایی‌ها |
| `survey.html` | نظرسنجی مشتری |
| `staff-login.html` | Login پرسنل |
| `staff-panel.html` | پنل پرسنل |

---

## 8. انبار و کنترل مصرف — معماری عملیاتی فعلی

### 8.1. 12 تب الزامی

صفحه `inventory.html` باید دقیقاً این 12 تب را نمایش دهد:

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

منوی Sidebar برای «انبار و کنترل مصرف» بهتر است یک لینک اصلی باشد و Navigation عملیاتی داخل همین Tabs انجام شود؛ زیرمنوهای قدیمی `فاکتور خرید / پرداخت تأمین‌کننده / فروش سپیدز / انبارگردانی` نباید دوباره برگردند.

### 8.2. Source of Truth Inventory

داده‌های اصلی فعال:

```text
inventory.locations
inventory.openingBalances
inventory.inventoryMovements
inventory.purchaseInvoices
inventory.supplierPayments
inventory.stockReceipts
inventory.wasteRecords
inventory.wasteShiftDeclarations
inventory.consumptionRecords
inventory.salesPeriods
inventory.stocktakes
inventory.trackedIngredients
inventory.periodClosures
inventory.changeLog
```

### 8.3. Locationها

Seed اولیه:

- `LOC-MAIN` — انبار اصلی
- `LOC-KITCHEN` — آشپزخانه
- `LOC-BAR` — بار
- `LOC-HOOKAH` — قلیان
- `LOC-HALL` — سالن / سرویس

### 8.4. «محل‌ها و نگاشت‌ها» چیست؟

دو مفهوم دارد:

1. **Location:** کالا واقعاً کجا نگهداری/مصرف می‌شود.
2. **Menu Mapping:** فروش یک آیتم منو مواد رسپی را از کدام Location کم کند.

مثال:

```text
فاکتور خرید گوشت -> دریافت در LOC-MAIN
انتقال گوشت -> LOC-KITCHEN
فروش استیک -> مصرف رسپی از LOC-KITCHEN
```

فیلد مهم آیتم منو:

`productionLocationId`

اگر Mapping موجود نباشد، `inventory.settings.defaultSalesLocationId` استفاده می‌شود.

---

## 9. Workflow پیشنهادی انبار رایو

### شروع کار برای اولین بار

برای شروع واقعی کنترل انبار از یک تاریخ مشخص:

1. همه مواد مهم/فعال را شمارش واقعی کنید.
2. آخرین قیمت خرید هر ماده را ثبت کنید.
3. شمارش را به‌عنوان **موجودی اولیه / Opening Baseline** ثبت کنید.
4. از روز بعد همه خریدها، دریافت‌ها، انتقال‌ها، فروش، ضایعات و شمارش‌ها را منظم ثبت کنید.

### فاکتور خرید و دریافت کالا دو مرحله جدا هستند

**خرید/حسابداری:**

- فاکتور خرید را در بخش خرید و تأمین ثبت می‌کند.
- پرداخت تأمین‌کننده در بخش تأمین‌کنندگان/خرید است.

**انبار:**

- فاکتور ثبت‌شده Pending Receipt ایجاد می‌کند.
- انباردار دریافت فیزیکی را کنترل می‌کند.
- فقط بعد از تأیید دریافت، موجودی افزایش پیدا می‌کند.

این جداسازی عمدی است تا «فاکتور حسابداری» با «کالای واقعاً تحویل‌شده» یکی فرض نشود.

### پایان هر شیفت / روز

- فروش سپیدز وارد شود.
- فروش اسنپ وارد شود.
- ضایعات/پرتی/مصرف مجاز ثبت شود.
- اقلام حساس شمارش شوند.
- Manager Pending Waste/Countها را بررسی کند.

### هفتگی

- Cycle Count اقلام هفتگی
- بررسی خسارت و مغایرت
- بررسی Waste به تفکیک ماده/پرسنل/سکشن
- بررسی Audit سپیدز

### ماهانه

- شمارش کامل یا گسترده‌تر
- بستن دوره Cost Control
- بررسی Standard COGS / Actual COGS / Waste / Variance
- ثبت Action Plan برای ماه بعد

---

## 10. فروش و اثر روی موجودی

### فروش سپیدز

فروش آیتم منو در `inventory.salesPeriods` نگهداری می‌شود.

مصرف هر ماده:

```text
Quantity Sold × Recipe Quantity
```

Recipe بر اساس نسخه مؤثر در تاریخ فروش انتخاب می‌شود.

### فروش اسنپ

چون فروش اسنپ در ساختار/فایل اصلی فروش سپیدز رایو الزاماً وجود ندارد، Source جدا دارد:

```text
salesSource = 'SNAPP'
source      = 'SNAPP'
```

اما از همان `inventory.salesPeriods` و همان موتور Recipe Consumption استفاده می‌کند. بنابراین در محاسبه موجودی تفاوتی با فروش عادی ندارد؛ فقط Source آن جداست.

### ثبت دستی فروش عادی

فیلدها:

- از تاریخ
- تا تاریخ
- مرجع
- آیتم منو
- تعداد

در v10.5.0 کنار تعداد، **مبلغ کل محاسباتی** از قیمت فعلی منو نمایش داده می‌شود.

### ثبت دستی فروش اسنپ

فیلدها:

- از تاریخ
- تا تاریخ
- آیتم
- تعداد
- مبلغ کل محاسباتی ردیف
- جمع محاسباتی کل فرم

اگر Period چندروزه دستی ثبت شود، Timing مصرف در محاسبه تاریخی بر مبنای `to` است. برای دقت روزانه، Excel دارای تاریخ یا ثبت روزبه‌روز استفاده شود.

### Excel فروش اسنپ

قالب با فروش روزانه مشترک است. Import با تاریخ روزانه رکوردهای جدا ایجاد می‌کند.

---

## 11. رسپی و واحدها

Pricing Seed فعلی تقریباً:

- 536 ماده اولیه
- 379 آیتم منو
- 912 ردیف رسپی
- 531 رکورد `ingredientPriceHistory`

از 269 آیتم منوی فعال، در Seed فعلی حدود 155 آیتم دارای رسپی لینک‌شده هستند. بنابراین قبل از اینکه COGS کل منو 100٪ قابل اتکا تلقی شود، Coverage رسپی آیتم‌های فروش‌پذیر باید بررسی شود.

### واحدها

برای ماده باید تفاوت این موارد روشن باشد:

- `purchaseUnit` / `unit`: واحد خرید
- `packageQuantity`: مقدار داخل واحد خرید
- `recipeUnit`: واحد مصرف رسپی / شمارش

مثال:

```text
فیله گوساله
واحد خرید: کیلوگرم
مقدار بسته: 1
واحد رسپی: گرم یا کیلو (طبق دیتای ماده)
```

در UI رسپی باید واحد ماده کنار مقدار مصرف نمایش داده شود.

### Recipe Versioning

در v10:

`pricing.recipeVersions[]`

برای حفظ تاریخچه رسپی اضافه شده است.

فیلدهای کلیدی:

```text
id
menuItemId
effectiveFrom
createdAt
createdBy
source
lines[]
```

هدف: تغییر رسپی امروز نباید Cost فروش ماه قبل را تغییر دهد.

---

## 12. قیمت مواد و ارزش موجودی

### قیمت

خرید جدید، تاریخچه قیمت ایجاد می‌کند. شمارش Opening Baseline نیز می‌تواند آخرین قیمت خرید را وارد کند.

**نکته تاریخی مهم:** Seed اولیه `ingredientPriceHistory` دارای 531 رکورد است ولی رکوردهای اولیه Date ندارند. قیمت‌های جدید عملیاتی Date دارند. بنابراین تحلیل دقیق Price History قبل از شروع ثبت زنده محدودیت دارد.

### ارزش روز موجودی

تب `ارزش روز موجودی` باید:

- ارزش کل مواد موجود را نشان دهد.
- مواد را از بیشترین ارزش به کمترین مرتب کند.
- Quantity، Unit Cost و Total Value را نمایش دهد.

به‌طور مفهومی:

```text
Current Quantity × Current Valid Unit Cost = Current Inventory Value
```

---

## 13. شمارش موجودی و مغایرت

### شمارش دوره‌ای

هدف: مقایسه Expected با Actual.

هر شمارش باید حداقل شامل:

```text
Date
Location
Ingredient
Expected
Actual
Variance
Unit Cost Snapshot
Variance Value
CountedBy
Status
ApprovedBy/ApprovedAt
```

### Opening Baseline

حالت ویژه شروع کنترل:

- Actual = Opening Quantity
- آخرین قیمت خرید را می‌توان همزمان وارد کرد.
- این شمارش مبنای کنترل بعدی می‌شود.

### فرمول عملیاتی

در سطح مفهومی:

```text
Opening
+ Purchase Receipts
+ Transfers In
- Transfers Out
- Recipe Consumption from Sales
- Registered Waste
- Authorized Consumption
= Expected Closing
```

سپس:

```text
Actual Count - Expected Closing = Variance
```

کسری منفی باید به ارزش ریالی تبدیل شود.

### روند مغایرت

هدف تب `روند مغایرت`:

- دیدن تغییر Variance در زمان
- فیلتر بر اساس ماده و Location
- تشخیص اینکه کنترل بهتر یا بدتر شده است

Dropdown ماده باید مواد واقعی فعال را قابل انتخاب کند، نه فقط «همه مواد».

---

## 14. ضایعات، پرتی و مصرف مجاز

انواع Eventهای جاری:

```text
WASTE
SPILL
EXPIRY
BREAKAGE
MISSING
STAFF_CONSUMPTION
MANAGEMENT_GUEST
TEST_CONSUMPTION
OTHER_AUTHORIZED
```

### ثبت توسط مدیر

مدیر می‌تواند رویداد را مستقیم ثبت کند.

### ثبت توسط پرسنل

در پنل پرسنل، کاربری که Permission مربوط دارد می‌تواند رویداد سکشن خودش را ثبت کند.

**کنترل مهم:** گزارش پرسنل فوراً موجودی را کم نمی‌کند. ابتدا Pending Review است و بعد از تأیید مدیر در Ledger اثر می‌گذارد.

### پایان شیفت

برای جلوگیری از پنهان‌کاری دو حالت باید از «هیچ ثبت نکرده» جدا باشند:

- `HAS_EVENT`
- `NO_EVENT`

یعنی کاربر می‌تواند صراحتاً اعلام کند «این شیفت موردی نداشتیم». عدم ثبت با «بدون مورد» یکسان نیست.

### گزارش‌ها

Dashboard/Reports باید بتواند نشان دهد:

- مبلغ Waste
- Waste / Sales %
- Waste / Standard Material Consumption %
- Waste / Total Material Outflow %
- تعداد Event
- مقدار فیزیکی به تفکیک Unit
- Waste به تفکیک پرسنل
- Unexplained Variance
- Trend چندماهه

کیلو، لیتر و عدد نباید به یک Quantity واحد جمع شوند.

---

## 15. Cost Control و COGS

روش پیشنهادی و تنظیم فعلی:

`WEIGHTED_AVERAGE`

هدف گزارش دوره:

```text
Opening Inventory Value
+ Net Purchases
- Actual Closing Inventory Value
= Actual Material Consumption / Actual COGS basis
```

و مقایسه با:

```text
Standard Recipe Consumption from Sales
+ Registered Waste
+ Authorized Consumption
+ Unexplained Variance
```

### KPIهای مهم

- Standard Material Cost % / Sales
- Actual Material Cost % / Sales
- Waste % / Sales
- Waste % / Material Consumption
- Unexplained Variance % / Sales
- Gross Profit estimate
- Physical Quantity Variance vs Price Effect

---

## 16. خرید و تأمین‌کنندگان

اصول جاری:

- مدیریت تأمین‌کننده در `suppliers.html`
- ثبت فاکتور و پرداخت در جریان خرید/تأمین قرار دارد.
- پرداخت تأمین‌کننده نباید به‌عنوان Tab مستقل انبار برگردد.
- دریافت فیزیکی در Inventory تأیید می‌شود.

Supplier Detail شامل تاریخچه مرتبط با درخواست خرید، فاکتور و پرداخت است.

در صفحه Supplier مراقب Duplicate Tabهای `حساب و سوابق خرید` باشید؛ باید یک‌بار نمایش داده شود.

---

## 17. Audit سپیدز

صفحه:

`sepids-audit.html`

Module:

`sepidsaudit`

### Data Model

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
```

### فایل‌های واقعی بررسی‌شده در توسعه قبلی

#### Deleted report

- Block-based، نه Flat Table ساده
- 48 Event در نمونه واقعی
- 205 Child Item Rows
- 48 شماره فاکتور یکتا
- Markerهای Block داخل محتوا هستند.

#### Edited report

- 31 Edit Event
- 28 Invoice یکتا
- 168 Before Item Rows
- 157 After Item Rows
- Markerها:
  - `قبل از تغییرات`
  - `بعد از تغییرات`

### Change types

```text
ITEM_REMOVED
ITEM_ADDED
QTY_DECREASED
QTY_INCREASED
REPLACED
PRICE_CHANGED
NO_INVENTORY_IMPACT
```

### Rule Engine

Rule Engine فقط Signal تولید می‌کند و نباید فرد را خودکار «متخلف» اعلام کند.

نمونه Rule:

- Delete بعد از Print
- Delete با تأخیر زیاد
- Item production حذف‌شده بدون Waste متناظر
- Edit تکراری
- Item پرریسک
- Pattern غیرعادی کاربر

### Review statuses

```text
new
needs review
explanation requested
explained
justified
operational error
unregistered waste
confirmed misconduct  (فقط تصمیم مدیر)
closed
```

---

## 18. پرسنل و HR

ماژول Backend: `personnel` / Frontend key: `hr`

Arrayهای اصلی:

```text
personnel
weeklyPlans
monthlyPlans
shiftRecords
monthlyAdjustments
tipGroups
penaltiesRewards
delays
payments
consumptions
leaves
leaveRequests
payrollClosures
staffingRequirements
holidays
changeLog
```

Objects اصلی:

```text
meta
lists
settings
salaryModel
floorMap
```

### وضعیت پرسنل

گزینه `اتمام همکاری` در وضعیت‌ها وجود دارد.

در فیلترهای پرسنلی، Default ترجیحاً `فعال` باشد ولی امکان انتخاب همه وضعیت‌ها وجود داشته باشد.

### User Access

Username/Password و Permissionها در **مدیریت دسترسی‌ها** هستند، نه در جدول اصلی لیست پرسنل.

Permissionهای توسعه‌یافته شامل مواردی مثل:

- Cash Report
- Purchase Request
- Purchase Invoice
- Tips
- Survey
- Suppliers View
- Waste registration
- Authorized consumption
- Inventory transfer
- Inventory count (محدود، نه برای همه)

---

## 19. پنل پرسنل

صفحات:

- `staff-login.html`
- `staff-panel.html`

قابلیت‌های مهم فعلی/درخواست‌شده که باید حفظ شوند:

- Dashboard دسترسی‌های مجاز
- دکمه Back داخلی
- شیفت پلن کلی با هفته قبل/بعد
- فیلتر سکشن
- شیفت‌های خود فرد
- پیام روز مدیر
- پیام مخصوص روز/شیفت
- آموزش و پروتکل‌ها
- Checklistها
- مرخصی و درخواست مرخصی
- لیست مرخصی‌های انجام‌شده
- دریافتی‌ها/پرداخت‌ها
- درخواست مساعده و پاسخ آن
- جریمه، پاداش و تخلفات
- مشاهده انعام ماهانه و وضعیت پرداخت
- ثبت/تقسیم انعام برای صندوقدار مجاز
- رزرو و بیعانه برای صندوقدار مجاز
- ثبت ضایعات/مصرف مجاز با Permission
- شمارش موجودی فقط با Permission مستقل
- ثبت Incident اموال

### گزارش صندوق پرسنل

- اگر برای آن روز گزارش ثبت شده باشد، ثبت دوم ممنوع است.
- پیام: قبلاً برای این روز گزارش صندوق ثبت شده؛ برای تغییر با مدیریت هماهنگ شود.
- ثبت گزارش برای تاریخ آینده ممنوع است.

### Screenshot

جلوگیری واقعی از Screenshot در Browser قابل اتکا نیست. اگر نیاز باشد Watermark نام پرسنل/زمان بازدارنده‌تر است، ولی Security واقعی نیست.

---

## 20. حقوق، مزایا و انعام

در Payroll و Training/Checklistها، نیروهای فعال Default هستند؛ فیلتر Status قابل تغییر است.

گزارش‌های Personnel Profile قابلیت بازه‌های:

- یک ماه
- سه ماه
- شش ماه
- یک سال

را دارند/باید حفظ شوند.

### تخلف

تخلف می‌تواند:

- بدون جریمه
- همراه با جریمه

باشد و در پنل فرد قابل مشاهده باشد.

### پیش‌بینی هزینه حقوق

در گزارشات، KPIهای مربوط به:

- حقوق پرداخت‌شده ماه جاری
- جمع حقوق پرداخت‌شده ثبت‌شده
- پیش‌بینی حقوق دوره

وجود دارد/باید حفظ شود.

---

## 21. قیمت‌گذاری و بهای تمام‌شده

صفحه:

`pricing.html`

داده‌های اصلی:

```text
ingredients
menuItems
recipes
recipeVersions
priceHistory
ingredientPriceHistory
changeLog
settings
lists
```

### اقلام شرکتی

آیتم‌های شرکتی مانند:

- کوکا
- فانتا
- اسپرایت
- کوکاکولا زیرو
- آب معدنی

نباید صرفاً به‌علت Cost Target داخلی در «نیازمند تغییر قیمت» ظاهر شوند.

### Importها

- Ingredients Excel
- Menu Excel
- Recipe Excel
- Price Excel

Duplicate Import Buttonها باید کنترل شوند؛ یک Action نباید دو دکمه یکسان در یک صفحه ایجاد کند.

---

## 22. گزارش صندوق

ماژول: `cashreport`

فیلدهای تفکیکی افزوده‌شده:

```text
hallReceiptCount
hallAmount
subscriberReceiptCount
subscriberAmount
snappCount / snappAmount (بسته به فرم موجود)
```

گزارش می‌تواند تعداد فاکتور و مبلغ را جدا تحلیل کند.

Cash Report Seed دارای Meta تاریخی `currency: ریال` است ولی UI مدیریتی بخش‌هایی را به تومان نشان می‌دهد. در هر توسعه جدید واحد ورودی/نمایش باید Explicit باشد.

---

## 23. فروش و Sales Analysis

صفحه مستقل:

`sales-analysis.html`

چهار فرمت اصلی Excel سپیدز که قبلاً برای تحلیل پشتیبانی شده‌اند:

1. فروش به تفکیک تاریخ
2. فروش به تفکیک ماه
3. ریز فروش یک روز
4. گزارش فروش یک کالا به تفکیک تاریخ

تحلیل‌ها شامل Trend تعداد فاکتور، فروش، مقایسه سال‌به‌سال و Trend آیتم است.

**نکته:** `p2ImportSalesExcel` برای Inventory فروش را در سطح Date + MenuItem Aggregate می‌کند و Invoice-level raw data را نگه نمی‌دارد. برای Cross-check کامل Audit سپیدز، در آینده گزارش فروش نهایی در سطح Invoice لازم است.

---

## 24. اموال و دارایی‌ها

صفحه:

`assets.html`

Seed فعلی: حدود 190 نوع Asset.

قیمت‌های اولیه قدیمی در فایل مرجع ریال بودند و Migration به تومان انجام شده است؛ Marker Migration باید مانع تقسیم مجدد بر 10 شود.

Valuation Settings تاریخی:

```text
valuationBaseDate = 1405/05/20
baseExchangeRateToman = 190000
currentExchangeRateToman = 190000  (قابل تغییر)
```

Depreciation نباید قبل از دوره مبنا به‌اشتباه اعمال شود.

پرسنل می‌تواند Incident اموال مثل شکستگی/خرابی/مفقودی را گزارش کند؛ گزارش پرسنل لزوماً به معنی تغییر خودکار Quantity نیست تا مدیر بررسی کند.

---

## 25. Finance / Profit & Loss

صفحه:

`finance.html`

هدف: محاسبه تقریبی سود/زیان ماه با ترکیب:

- فروش
- خریدها
- سایر هزینه‌ها
- حقوق
- آب/برق/گاز/اجاره و...
- سایر درآمدها
- VAT
- مالیات عملکرد

پارامترهای تاریخی پیش‌فرض در Source وجود دارند و باید قابل تنظیم باشند.

---

## 26. Excel Framework

فایل:

`js/18-excel-tools.js`

API مهم:

```text
RayoExcel.loadXLSX()
RayoExcel.readFile()
RayoExcel.readBest()
RayoExcel.bestTable()
RayoExcel.findCol()
RayoExcel.exportRows()
RayoExcel.template()
```

### محدودیت مهم

در بسته فعلی فایل محلی زیر وجود ندارد:

`js/xlsx.full.min.js`

Loader اول آن را جست‌وجو می‌کند و سپس CDN را امتحان می‌کند. بنابراین برای Import Excel کاملاً مستقل از اینترنت بهتر است نسخه سازگار SheetJS `xlsx.full.min.js` به پوشه `/js` اضافه شود.

### Parser Flat vs Block

`RayoExcel.readBest()` برای جدول Flat مناسب است.

گزارش‌های Deleted/Edited سپیدز Block-based هستند و نباید با `readBest()` ساده Parse شوند؛ برای آن‌ها Parser اختصاصی `sepids-audit` استفاده می‌شود.

---

## 27. UI / Mobile / Form Rules

### Money formatting

فایل اصلی Formatting عمومی:

`js/35-operational-closeout-v10-2.js`

قواعد:

- مبلغ هنگام نمایش سه‌رقم سه‌رقم جدا شود.
- قبل از Handlerهای Legacy مقدار Raw در دسترس باشد.
- تاریخ هرگز Money format نشود.
- `data-jalali="1"` همیشه Date است.

### Jalali picker

فایل:

`js/13-jalali-picker.js`

فیلد تاریخ با:

```html
<input data-jalali="1">
```

مشخص می‌شود.

### Modal

طبق درخواست کاربر، Popup با کلیک فضای بیرون نباید بسته شود و فقط با Close/Cancel صریح بسته شود.

در موبایل Modal/Bottom Sheet نباید کل viewport را بدون امکان Scroll مناسب بگیرد.

---

## 28. Error Log

ماژول:

`errorlog`

مسیر جدید Error Log باید Server JSON باشد، نه LocalStorage View قدیمی.

خطاهای Captured معمولاً شامل:

```text
source
message
stack
file
line
column
context
createdAt
```

اگر Error Log خالی است ولی Console خطا دارد، ابتدا بررسی شود:

1. Module backend `errorlog` فعال است؟
2. View قدیمی LocalStorage دوباره Override نشده؟
3. Error قبل از آماده شدن Gateway Capture شده و Migration به Server انجام شده؟

---

## 29. Reset داده آزمایشی

در Settings امکان Reset مستقل Moduleها اضافه شده است تا چند روز تستی پاک شوند بدون اینکه کل سیستم ریست شود.

Reset باید:

- Module-specific باشد.
- حداقل دو مرحله تأیید داشته باشد.
- به‌وضوح نام Module و خطر پاک‌شدن داده را نشان دهد.
- به داده Production بدون تأیید صریح دست نزند.

---

## 30. پیام‌ها و ارتباط با پرسنل

دو نوع پیام مدیریتی وجود دارد/باید حفظ شود:

1. **پیام روز مدیر** — پیام عمومی قابل مشاهده در Dashboard پنل پرسنل.
2. **پیام روز/شیفت در Shift Plan** — پیام خاص برای روز یا شیفت مشخص.

این دو نباید یکی شوند؛ اولی عمومی/روزانه و دومی Operational برای برنامه شیفت است.

---

## 31. Known Technical Debt

مواردی که AI/Developer بعدی باید بداند:

### 31.1. Patch-heavy architecture

نسخه‌های متعدد JS روی Viewهای قدیمی Wrapper می‌گذارند. این کار سرعت توسعه قبلی را بالا برده ولی احتمال Override و Race را زیاد کرده است.

برای توسعه بعدی، قبل از اضافه کردن Patch جدید:

- Source Runtime را پیدا کنید.
- ببینید آخرین Wrapper کدام است.
- در صورت امکان همان فایل نهایی را اصلاح کنید.

### 31.2. دو مدل Inventory تاریخی

- `09-rayo-inventory-variance-module.js` مدل Legacy period-based دارد.
- مدل عملیاتی فعال v10 بر اساس `inventoryMovements`, `stockReceipts`, `wasteRecords`, `salesPeriods`, `stocktakes`, `locations` است.

قابلیت جدید مهم روی مدل Legacy اضافه نشود.

### 31.3. Lexical Globals

`views`, `titles`, `state` در هسته لزوماً `window.*` نیستند. این موضوع قبلاً Root Cause واقعی Regression بوده است.

### 31.4. Historical price/recipe limitations

- قیمت‌های Seed قدیمی Date ندارند.
- Recipe Versioning از زمان اضافه‌شدن v10 قابل اتکاتر است؛ تاریخچه قبل از آن کامل قابل بازسازی نیست.

### 31.5. Recipe coverage

همه آیتم‌های منوی فعال رسپی کامل ندارند. COGS کل فروش فقط به اندازه Coverage رسپی معتبر است.

---

## 32. تست‌های الزامی قبل از هر تحویل جدید

حداقل این تست‌ها انجام شوند:

### Syntax

```bash
node --check js/*.js
```

### JSON

تمام فایل‌های `/seed/*.json` Parse شوند.

### Local references

تمام `src` و `href`های محلی HTML باید موجود باشند.

### Inventory acceptance

- 12 تب دقیق Render شوند.
- Waste tab بدون ReferenceError باز شود.
- Sales tab فروش سپیدز و فروش اسنپ را نشان دهد.
- Snapp ثبت دستی از/تا داشته باشد.
- Snapp Excel Import Function موجود و قابل اجرا باشد.
- Stocktake Opening قیمت آخرین خرید داشته باشد.
- Valuation گزارش ارزش روز داشته باشد.
- Payment Supplier داخل Inventory Tab برنگردد.

### Date/Money

- `تاریخ فروش` نباید comma format شود.
- `مبلغ فروش (تومان)` باید comma format شود.

### Sales amount

- تغییر تعداد فروش باید مبلغ محاسباتی ردیف را Update کند.

### Backend

پس از Deploy، Smoke test واقعی:

- Login
- Load Module
- Save Module
- Reload و Persist

انجام شود.

---

## 33. QA نسخه v10.5.0

در محیط ساخت این نسخه:

- تمام JSها با `node --check` بدون Syntax Error بودند.
- تمام JSONهای Seed معتبر بودند.
- 387 Reference محلی HTML بررسی شد و 0 فایل Missing بود.
- Unit/Contract test اختصاصی v10.5.0: **13/13 PASS**.
- Test Money Formatter:
  - Date field `تاریخ فروش` => `false` برای Money Input
  - `مبلغ فروش (تومان)` => `true`
- Runtime test فروش دستی عادی:
  - 3 عدد × 125,000 تومان => **375,000 تومان** نمایش محاسباتی
- Runtime Snapp Excel test:
  - فایل Mock با دو تاریخ => 2 `SNAPP` period روزانه
  - Quantityها 2 و 3 درست ذخیره شدند.
- Runtime View test:
  - Snapp panel با From/To Render شد.
  - 12 تب Inventory در Final Wrapper Render شدند.

**محدودیت تست:** Chromium Headless در Container برای Full DOM dump به‌دلیل محدودیت محیط/Process lifecycle کامل نشد؛ بنابراین E2E Browser + Backend Production باید بعد از Deploy Smoke Test شود. این محدودیت صریحاً به معنی Fail بودن تست‌های Unit/Runtime بالا نیست.

---

## 34. Deploy صحیح

خروجی باید **Flat ZIP** باشد:

```text
index.html
inventory.html
js/
css/
seed/
...
```

نه:

```text
SomeFolder/index.html
```

اگر ZIP با پوشه مادر Extract شود، ممکن است `index.html` قدیمی Root همچنان اجرا شود.

### بعد از Deploy

1. تمام فایل‌ها Replace شوند.
2. Cache bust Version باید با نسخه جدید یکی باشد (`v=10.5.0`).
3. Hard Refresh انجام شود.
4. Build badge/Meta چک شود.
5. Inventory tab و Save/Reload تست شود.

---

## 35. فایل‌هایی که برای ادامه هر تغییر Inventory ابتدا باید خوانده شوند

به ترتیب اولویت:

1. `js/00-base.js` — Router/Registry/State پایه
2. `js/config.js` — API Gateway و Data schema
3. `js/14-ops-integration.js` — Base inventory operations و فروش دستی
4. `js/32-inventory-cost-control-v10.js` — Ledger/Locations/COGS/Waste/Stocktake
5. `js/34-final-operational-review-v10-1.js` — Workflow/Receipts/Variance reports
6. `js/35-operational-closeout-v10-2.js` — UI post-process, formatter, reset
7. `js/36-final-inventory-consolidation-v10-3.js` — Final 12 tabs + Snapp + Opening baseline
8. `js/37-requested-fixes-v10-4.js` — آخرین cleanup درخواست‌ها
9. `inventory.html` — Load order قطعی

برای Excel:

10. `js/18-excel-tools.js`
11. `js/19-phase2-admin.js`

برای Audit سپیدز:

12. `js/33-sepids-audit-v10.js`

---

## 36. دستورالعمل برای AI/Developer بعدی

اگر این مستند و سورس را دریافت کردی:

1. **از کاربر نخواه دوباره معماری را توضیح دهد.** این سند را مبنا بگیر.
2. ابتدا نسخه موجود را اجرا/Inspect کن؛ صرف وجود متن در Source را معادل Render صحیح فرض نکن.
3. قبل از Patch جدید، آخرین Runtime Owner فیچر را پیدا کن.
4. در Admin classic scripts، Scope `views/state/titles` را با دقت بررسی کن.
5. UI/Design موجود را بدون درخواست تغییر نده.
6. API را فقط از `app-config.js` تنظیم کن.
7. داده عملیاتی را از Seed به‌عنوان fallback دائمی نخوان.
8. تغییرات Inventory را با 12-tab contract تست کن.
9. هر تغییر مالی/انبار را با مثال عددی Runtime تست کن.
10. هر نسخه را Flat package کن و Cache version را به‌روز کن.
11. اگر کاربر فایل Excel واقعی سپیدز فرستاد، Header/Block واقعی آن را Inspect کن و Parser را حدس نزن.
12. برای ویژگی‌هایی که فایل اصلی را روی سرور نگه می‌دارند، بدان که Browser-only کافی نیست و Storage/Backend لازم است.

---

## 37. پاسخ‌های معماری مهم ثبت‌شده در پروژه

### آیا فایل را بدون Backend می‌توان «ارسال» کرد؟

- **انتخاب و پردازش فایل داخل Browser:** بله، بدون Backend جدید.
- **استخراج داده از Excel و ذخیره JSON با API فعلی:** بله.
- **نگهداری خود فایل اصلی روی سرور و دسترسی بعدی از دستگاه دیگر:** خیر؛ Storage/Backend یا سرویس فایل لازم است.

### آیا بعد از هر تغییر باید Save عمومی زده شود؟

در Actionهای جدید خیر؛ دکمه‌های `ثبت/ذخیره/تأیید` همان Module را ذخیره می‌کنند. Save عمومی میراث معماری قدیمی است.

### Screenshot پنل پرسنل؟

Browser نمی‌تواند Screenshot سیستم‌عامل را قابل اتکا ببندد.

---

## 38. داده‌های کسب‌وکار رایو که روی تصمیم‌های مدیریتی اثر دارند

این بخش برای Context AI بعدی است، نه Config فنی:

- رستوران رایو در لواسان فعالیت می‌کند.
- فصل پررونق‌تر معمولاً فروردین تا شهریور و فصل سرد ضعیف‌تر است.
- چالش‌های اصلی اخیر: نیروی انسانی، اقتصاد/تورم، اختلال اینترنت و مسائل مدیریتی.
- هدف اصلی پروژه افزایش فروش از طریق افزایش مراجعه، بازگشت و وفاداری؛ همزمان کاهش پرت، ضایعات، کسری و سوءاستفاده.
- COGS هدف تاریخی مواد اولیه حدود 35٪ فروش بوده است.
- کنترل ضایعات باید طوری طراحی شود که پرسنل از ثبت نترسند ولی پنهان‌کاری یا مصرف بدون ثبت قابل شناسایی باشد.
- Workflow باید برای پرسنل کم‌تجربه در Excel ساده باشد.

---

## 39. هدف نهایی بخش انبار

هدف فقط «عدد موجودی» نیست. سیستم باید بتواند برای هر ماده و هر دوره پاسخ دهد:

```text
چقدر داشتیم؟
چقدر خریدیم؟
چقدر واقعاً تحویل گرفتیم؟
چقدر به هر سکشن منتقل شد؟
طبق فروش باید چقدر مصرف می‌شد؟
چقدر Waste ثبت شد؟
چقدر مصرف مجاز غیر فروش داشتیم؟
چقدر واقعاً شمردیم؟
کسری/اضافه چقدر است؟
ارزش ریالی خسارت چقدر است؟
آیا روند بهتر شده یا بدتر؟
کدام ماده/سکشن/شیفت/پرسنل نیازمند بررسی بیشتر است؟
آیا Delete/Edit فیش سپیدز با این مغایرت ارتباط دارد؟
```

هر توسعه Inventory باید به این هدف نزدیک‌تر شود، نه اینکه فقط فرم جدید اضافه کند.

---

# پایان مستند

**نسخه مرجع ادامه کار:** `Rayo Admin v10.5.0`  
**فایل پیشنهادی برای شروع چت جدید:** همین `RAYO_ADMIN_PROJECT_HANDOFF_v10_5_0.md` + کل Source v10.5.0.
