# معماری اپ (`app/`)

اپ یک صفحهٔ ایستاست: `app/index.html` همهٔ فایل‌ها را با ترتیب ثابت بارگذاری می‌کند. build، بسته‌ساز و فریم‌ورک ندارد. کتابخانه‌های بیرونی فقط این‌ها هستند:
- ECharts (نمودار) و Lucide (آیکون) از CDN؛
- XLSX (Excel)، که هنگام نیاز از CDN بارگذاری می‌شود.

## لایه‌ها
```
app/
  index.html            پنل مدیریت (نقطهٔ ورود)
  pos.html waiter.html kds.html staff.html   دموی نرم‌افزارهای داخل مجموعه (دادهٔ نمونه)
  core/                 هسته: قابل استفاده بدون رابط کاربری
    css/theme.css       سیستم طراحی (رنگ‌ها، فاصله‌ها، کارت، جدول، فرم، تب، تم تیره)
    js/app.js           ابزار مشترک رابط (RT: آیکون، نمودار، قالب‌بندی عدد و پول)
    js/*-engine.js, *-core.js   موتور محاسبه (فقط خواندن): انبار، حقوق، حضور و غیاب
    js/*-write.js       منطق ثبت هر ماژول: تابع‌های خالص (doc, ctx, input) → تغییر روی سند + خروجی
  css/panel.css plus.css ops.css   ظاهر پنل، بخش‌های افزوده، دموها
  skins/night.css bazaar.css       پوسته‌های اختیاری (هنگام اجرا بارگذاری می‌شوند)
  js/shell.js           پوستهٔ پنل: مسیر‌یاب، منوی کناری، نوار بالا، ثبت جدید، مودال، جدول، فرم، دسترسی
  js/data.js            دادهٔ نمونهٔ بخش‌های طرح
  js/pages/<بخش>.js     صفحهٔ طرح هر بخش (دادهٔ نمونه)
  js/pages/<بخش>-real.js  همان صفحه روی دادهٔ واقعی؛ render و mount تب طرح را جایگزین می‌کند
  js/ops-data.js pos.js waiter.js kds.js staff.js   دموها
```

## الگوی صفحه
- هر بخش با `P.mod({id,label,icon,tabs:[{id,label,render,mount,actions,liveOnly}]})` ثبت می‌شود. مسیرها `#/<بخش>/<تب>/<پارامتر>` هستند.
- فایل `*-real.js` تب طرح را پیدا و render و mount آن را جایگزین می‌کند. اگر دادهٔ واقعی وصل نباشد، طرح نمونه با یادداشت «دادهٔ نمونه» دیده می‌شود.
- `SAMPLE_TABS` در `shell.js` تب‌هایی است که با دادهٔ زنده پنهان می‌شوند. `P.LEGACY` تب «در پنل فعلی» است با لینک امکاناتی که فقط در `legacy/` مانده‌اند.
- **دسترسی** با `P.can(بخش)` و `P.tabOk(بخش، تب)` بررسی می‌شود. نگاشت بخش و تب به کلیدها در `MOD_KEYS` و `TAB_KEYS` است. ثبت‌ها دوباره با `InvEntry.allowed(کلید)` چک می‌شوند. ورود و نمای نقش در `core/js/admin-access.js` است.
- **ابزار رابط:**
  - `P.card`، `P.table`، `P.kpi`، `P.field`، `P.note`، `P.b` (نشان)، `P.modal`، `P.toast`؛
  - فرم ثبت: `InvEntry.formModal` (که `IE.formModal` هم صدا زده می‌شود)؛
  - ثبت سریع از هر صفحه: `P.openLive({go, ready, open})`.

## دادهٔ واقعی
| ماژول | خواننده | نویسنده |
|---|---|---|
| `inventory`، `pricing`، `cashreport` | `InvControl` (`core/js/inventory-control.js`، با بارگذاری خودکار در `inventory-real.js`) | `inventory-write.js`، `menu-write.js`، `cash-write.js`، `sales-write.js`، `beverage-control.js` |
| `personnel` | `PeopleReal` (`people-real.js`) | `people-write.js`، `payroll-core.js`، `shift-write.js` |
| `attendance` | `attendance-real.js` | `attendance-write.js` (قواعد: `attendance-core.js`) |
| `suppliers` | `FinanceReal` (`finance-real.js`) | `purchase-write.js` |
| `finance`، `assets`، `errorlog` | `ExtrasReal` (`extras-real.js`) | `finance-write.js`، `petty-write.js`، `assets-write.js` |

موتور انبار (`InvEngine.build`، `positions`، `analyze`):
- موجودی هر قلم از آخرین شمارش خودش ساخته می‌شود، به‌علاوهٔ ورود، منهای مصرف رسپیِ فروش، منهای پرتی و مصرف مجاز.
- `recipeAt` رسپی مؤثر هر تاریخ را می‌دهد و سطر قلم آماده را به مواد فرمولش باز می‌کند.
- تبدیل واحد و فرمول در `InvEngine.prepConvert` است.

## پروتکل ذخیره (همهٔ ماژول‌ها)
`InvWrite.edit(io,{action,details,mutate})` (و `InvEntry.run`، `PeopleReal.saveHr` و `IE.run` که از آن استفاده می‌کنند):
1. Load تازه از سرور؛ اگر ناقص یا نامعتبر بود چیزی ذخیره نمی‌شود.
2. `mutate` روی کپی سند اجرا می‌شود. تابع‌های `*-write.js` قاعده‌ها را بررسی می‌کنند و در خطا پیام فارسی می‌دهند.
3. یک ردیف audit در `changeLog` نوشته می‌شود (کاربر، زمان، عمل، جزئیات، نسخهٔ قبلی).
4. برای ماژول انبار، شمارش‌های کل بعد از زودترین تاریخ تغییرکرده دوباره حساب می‌شوند (`recalcCounts`).
5. Save با `serverSaveToken` تازه، بعد بازخوانی و مقایسهٔ کامل محتوا.
6. اگر نتیجه نامعلوم بود، ثبت‌های بعدی تا بارگذاری دوبارهٔ صفحه قفل می‌شوند.

برای صندوق و مالی بعضی رکوردها با `Mutate` و کنترل نسخهٔ رکورد ذخیره می‌شوند.

## آزمون‌ها (`tests/`)
- هر `qa_template_<ماژول>.js` فایل‌های `core/js` را در Node با `eval` بارگذاری می‌کند و تابع‌های ثبت و محاسبه را روی دادهٔ ساختگی می‌آزماید.
- چند آزمون، برابری با کد پنل قدیمی را چک می‌کنند و برای همین از `legacy/js` می‌خوانند؛ مثلاً هش رمز، قواعد حضور و غیاب، پنل پرسنل.
- `tests/fixtures/` فایل‌های نمونهٔ ورود تردد را دارد.

## افزودن امکانات تازه
1. منطق را در `core/js/<ماژول>-write.js` بنویسید: تابع خالص با پیام خطای فارسی.
2. رابط را در `js/pages/<بخش>-real.js` بنویسید و ثبت را با همان پروتکل انجام دهید.
3. آزمون را در `tests/qa_template_<ماژول>.js` اضافه کنید.
4. سند مالک را به‌روز کنید: `STATE.md`، `BUSINESS_RULES.md`، و در صورت نیاز `DATA_MODEL_V10.md` و `DECISIONS.md`.
5. فایل تازه فقط وقتی بسازید که در فایل مالک جا نشود. اگر ساختید، به `index.html` و جدول این سند اضافه‌اش کنید.
