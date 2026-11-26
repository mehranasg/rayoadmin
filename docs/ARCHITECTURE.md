# معماری اپ (`app/`)

اپ یک صفحهٔ ایستاست: `app/index.html` همهٔ فایل‌ها را با ترتیب ثابت بارگذاری می‌کند. build، بسته‌ساز و فریم‌ورک ندارد. کتابخانه‌های بیرونی فقط این‌ها هستند:
- ECharts (نمودار) و Lucide (آیکون) از CDN؛
- XLSX (Excel)، که هنگام نیاز از CDN بارگذاری می‌شود.

## لایه‌ها
```
app/
  index.html            پنل مدیریت (نقطهٔ ورود)
  staff.html            اپ پرسنل روی دادهٔ زنده (همان اسکریپت‌های index.html + js/staff-real.js)
  pos.html waiter.html kds.html staffdemo.html   دموی نرم‌افزارهای داخل مجموعه (دادهٔ نمونه)
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
  js/staff-real.js      اپ پرسنل: ورود پرسنل، خانه، صفحه‌ها بر اساس دسترسی؛ P.render را جایگزین می‌کند
  js/ops-data.js pos.js waiter.js kds.js staff.js   دموها
```

## الگوی صفحه
- هر بخش با `P.mod({id,label,icon,tabs:[{id,label,render,mount,actions,liveOnly}]})` ثبت می‌شود. مسیرها `#/<بخش>/<تب>/<پارامتر>` هستند. «اطلاعات پایه» مسیر `#/base/<key>` دارد (`BASE_LINKS` در `shell.js`: کلید، بخش، تب، آیکن، عنوان، کلیدهای دسترسی) و همان تب بخش را بدون تب‌های دیگرش رسم می‌کند. در بدنهٔ پنجره (`.modal-body`، ستونی) فرزندها کوچک نمی‌شوند تا جدول‌ها اسکرول جدا نگیرند؛ کل بدنه اسکرول می‌خورد.
- فایل `*-real.js` تب طرح را پیدا و render و mount آن را جایگزین می‌کند. اگر دادهٔ واقعی وصل نباشد، طرح نمونه با یادداشت «دادهٔ نمونه» دیده می‌شود.
- **نوار تب:** `TAB_GROUPS` در `shell.js` تب‌های هر بخش را گروه می‌کند (حداکثر شش گروه، تب‌های گروه باز در ردیف دوم `.page-subtabs`). تب تازه اگر در هیچ گروهی نباشد گروه جدای خودش را می‌گیرد؛ پس تب تازه را در گروه درستش اضافه کنید. `TAB_LABELS` واژه‌نامهٔ نام تب‌ها روی دادهٔ زنده است و بر نام تعریف‌شده در فایل صفحه غلبه می‌کند. نشان قرمز (`badge`) فقط برای کار امروز است.
- **میز کار** (`dashboard-real.js`): کارها از `tasks()`، روزها از `DAY` (هر ردیف به یک ردیف `DAILY` برای فرم و دسترسی وصل است)، اعتماد ماه از `monthTrust`. علامت روز با `InvWrite.saveDayCheck` در `inventory.dayChecks` ذخیره می‌شود (بدون بازمحاسبهٔ شمارش). ثبت روزانهٔ تازه را هم در `DAILY` و هم در `DAY` اضافه کنید.
- **تکمیل رسپی‌ها:** تب `menu/campaign` در `menu-real.js` (`campData`، `copyFromForm`، `directForm`، `approxForm`)؛ منطق مشترک در `menu-write.js` (`similarItems`، `copyLines`، `directCandidates`، `setApproxCost`). فرم رسپی (`MenuEntry.recipe(id,pre)`) با `pre.lines` از پیش پر می‌شود. probe: `tools/probes/recipe-campaign.js`.
- **پروندهٔ ماه هر نفر (حقوق):** `detail(pid,y,m)` در `payroll-real.js` از «حقوق ماه» و «کارکرد ماه» (`data-pmd`) باز می‌شود. فرم‌هایی که از آن باز می‌شوند گزینهٔ `then` (بعد از ذخیره، از راه `then` در `InvEntry.run`) و `back` (دکمهٔ «بازگشت» با `PeopleEntry.addBack`) می‌گیرند: `PeopleEntry.penalty({personnelId,kind,year,month,then,back})`، `PeopleEntry.penaltyStatus(id,{then,back})`، `PayrollReal.pay({…,then,back})`، `PeopleHR.salaryForm(id,{eff,then,back})`. probe: `tools/probes/payroll-penalty-jump.js` (با عرض ۳۹۰).
- **اپ پرسنل:** `staff.html` پیش از اسکریپت‌ها `window.RAYO_STAFF_APP=1` می‌گذارد. ورود با `AdminAccess.verifyStaff/signInStaff` (نقش `staff`؛ کلیدهای دسترسی پرسنل در `STAFF_PERMS` به بخش‌ها نگاشت می‌شوند؛ بیرون از اپ پرسنل این نشست `null` است). `AdminAccess.staff()` شخص را می‌دهد و `InvWrite.edit` و `cash-real` آن را در `ctx.staff` می‌گذارند؛ نویسنده‌ها (`CashWrite.buildReport`، `InvWrite.addEvent`) با آن نام و شناسهٔ شخص را روی رکورد می‌نویسند. فرم‌ها همان فرم‌های پنل‌اند (`CashReal.form`، `InvEntry.event`، `InvEntry.bevCfg({staff})`) و با `AdminAccess.staff()` رفتار پرسنلی می‌گیرند. صفحهٔ تازه: یک ردیف در `PAGES` و یک تابع در `VIEWS` در `staff-real.js`. probe: `PAGE=staff.html NOSESSION=1 node tools/smoke.cjs tools/probes/staff-app.js 300 390`.
- **راهنما:** `app/js/help.js` (`RayoHelp.pages['بخش/تب']`، `glossary`)؛ دکمهٔ «؟» نوار بالا `P.help()` را باز می‌کند. صفحهٔ تازه را در `help.js` هم اضافه کنید.
- **جدول یکپارچه** (`gridify`): هر خانه `data-th` (نام ستون) می‌گیرد تا در موبایل کارت شود (`grid-cards`، با بیش از ۴ ستون `grid-more`)؛ فهرست بیش از ۱۵ ردیف بیرون از پنجره `grid-scroll` می‌گیرد (اسکرول در قاب با سرستون ثابت). یادداشت‌های توضیحی طولانی پنجره‌ها با `foldNotes` (در `P.modal`) یک‌خطی می‌شوند.
- **هشدار موجودی منفی:** `InvEntry.run(btn,{negWarn:true,…})` ثبت را روی کپی دادهٔ انبار اجرا می‌کند (`negativeAfter` در `inventory-real.js`) و پیش از ذخیره هشدار می‌دهد؛ برای ثبت تازه‌ای که از موجودی کم می‌کند همین گزینه را بدهید.
- `SAMPLE_TABS` در `shell.js` تب‌هایی است که با دادهٔ زنده پنهان می‌شوند؛ `LIVE_HIDE` تب‌های کنارگذاشته یا جایگزین‌شده است که پنهان‌اند ولی لینک مستقیمشان باز می‌شود. `P.LEGACY` تب «در پنل فعلی» است با لینک امکاناتی که فقط در `legacy/` مانده‌اند.
- **دسترسی** با `P.can(بخش)` و `P.tabOk(بخش، تب)` بررسی می‌شود. نگاشت بخش و تب به کلیدها در `MOD_KEYS` و `TAB_KEYS` است. ثبت‌ها دوباره با `InvEntry.allowed(کلید)` چک می‌شوند. پیش‌نمایش چاپی (فیش، گزارش نهایی انبارگردانی) با `P.previewDoc(عنوان، css، html)` در `js/shell.js` است. ورود و نمای نقش در `core/js/admin-access.js` است؛ فهرست کلیدها با نام، گروه (بخش پنل) و شرح در `AdminAccess.SECTIONS` است و هر کلید تازه باید هم آنجا و هم در `MOD_KEYS`/`TAB_KEYS` بیاید.
- **ویژگی `hidden`** همیشه پنهان می‌کند (`[hidden]{display:none!important}` در `panel.css`)؛ برای نمایش شرطی به‌جای `style.display` از آن استفاده کنید.
- **ابزار رابط:**
  - `P.card`، `P.table`، `P.kpi`، `P.field`، `P.note`، `P.b` (نشان)، `P.modal`، `P.toast`؛
  - **مبلغ:** `P.mt(تومان)` عدد به واحد مبالغ، `P.mT` با نام واحد، `P.mShort` کوتاه (میلیون)، `P.U()` نام واحد، `P.mul()` ضریب (۱ یا ۱۰). فیلد مبلغ با `P.money(name,تومان)` یا هر input با `data-money` (مقدار اولیه با `P.moneyAttr(تومان)`): به واحد مبالغ نمایش داده و تایپ می‌شود ولی `.value` آن برای کد همیشه تومان است (getter/setter روی `HTMLInputElement.prototype.value` فقط برای `data-money`؛ `P.rawVal(el)` همان متن نمایش). ستون مبلغ در `P.table` با `{t:'مبلغ',m:1}` (عددی + «(ریال)» در سرستون). ستون Excel مبلغ در `P.importer` با `money:1`. در هسته (`core/js`) از `window.P?.mul` استفاده شود تا آزمون‌های Node بی‌پنل کار کنند؛
  - فرم ثبت: `InvEntry.formModal` (که `IE.formModal` هم صدا زده می‌شود)؛
  - ثبت سریع از هر صفحه: `P.openLive({go, ready, open})`.

## دادهٔ واقعی
| ماژول | خواننده | نویسنده |
|---|---|---|
| `inventory`، `pricing`، `cashreport` | `InvControl` (`core/js/inventory-control.js`، با بارگذاری خودکار در `inventory-real.js`) | `inventory-write.js`، `menu-write.js`، `cash-write.js`، `sales-write.js`، `beverage-control.js` |
| `personnel` | `PeopleReal` (`people-real.js`) | `people-write.js`، `payroll-core.js`، `shift-write.js` |
| `attendance` | `attendance-real.js` | `attendance-write.js` (قواعد: `attendance-core.js`) |
| `suppliers` | `FinanceReal` (`finance-real.js`) | `purchase-write.js` |
| اتصال هوش مصنوعی (فقط مرورگر، `localStorage` «rayo.ai») | `core/js/ai-client.js` (`AiClient.invoice`، `chat`، `test`) | — |
| `finance`، `assets`، `errorlog` | `ExtrasReal` (`extras-real.js`) | `finance-write.js`، `petty-write.js`، `assets-write.js` |
| همهٔ ماژول‌ها (فقط خواندن) | گزارش‌های دوره‌ای: `core/js/report-core.js` (جمع دوره، فروش هر ماه، گروه‌های گزارش، حقوق دوره) و `js/pages/reports-real.js` (پنج تب اول «گزارش‌ها») | — |

موتور انبار (`InvEngine.build`، `positions`، `analyze`):
- موجودی هر قلم از آخرین شمارش خودش ساخته می‌شود، به‌علاوهٔ ورود، منهای مصرف رسپیِ فروش، منهای پرتی و مصرف مجاز.
- `recipeAt` رسپی مؤثر هر تاریخ را می‌دهد و سطر قلم آماده را به مواد فرمولش باز می‌کند.
- تبدیل واحد و فرمول در `InvEngine.prepConvert` است.
- واحدهای قلم: همهٔ مقدارهای ذخیره‌شده به واحد پایه (`recipeUnit`) است. `InvWrite.unitsOf` واحدهای ورود هر قلم را با ضریبشان می‌دهد (پایه، خرید، `countingUnits`، گرم/میلی‌لیتر خودکار) و `useUnitOf` / `countUnitOf` / `smallestUnit` واحد شروع رسپی، ضایعات و شمارش را. نام قبلی واحد پایه (`baseUnitRenames`) با `InvEngine.sameUnit` همان واحد است. فهرست نام واحدها: `MenuWrite.unitList` (`lists.units` + واحدهای در حال استفاده).

## پروتکل ذخیره (همهٔ ماژول‌ها)
`InvWrite.edit(io,{action,details,mutate})` (و `InvEntry.run`، `PeopleReal.saveHr` و `IE.run` که از آن استفاده می‌کنند):
1. Load تازه از سرور؛ اگر ناقص یا نامعتبر بود چیزی ذخیره نمی‌شود.
2. `mutate` روی کپی سند اجرا می‌شود. تابع‌های `*-write.js` قاعده‌ها را بررسی می‌کنند و در خطا پیام فارسی می‌دهند.
3. یک ردیف audit در `changeLog` نوشته می‌شود (کاربر، زمان، عمل، جزئیات، نسخهٔ قبلی).
4. برای ماژول انبار، شمارش‌های کل بعد از زودترین تاریخ تغییرکرده دوباره حساب می‌شوند (`recalcCounts`).
5. Save با `serverSaveToken` تازه، بعد بازخوانی و مقایسهٔ کامل محتوا. در مقایسه، صفرهای آخر میلی‌ثانیهٔ زمان‌های ISO نادیده گرفته می‌شوند (سرور `.210Z` را `.21Z` برمی‌گرداند).
6. اگر نتیجه نامعلوم بود، ثبت‌های بعدی تا بارگذاری دوبارهٔ صفحه قفل می‌شوند.

برای صندوق و مالی بعضی رکوردها با `Mutate` و کنترل نسخهٔ رکورد ذخیره می‌شوند.

## آزمون‌ها (`tests/`)
- هر `qa_template_<ماژول>.js` فایل‌های `core/js` را در Node با `eval` بارگذاری می‌کند و تابع‌های ثبت و محاسبه را روی دادهٔ ساختگی می‌آزماید.
- چند آزمون، برابری با کد پنل قدیمی را چک می‌کنند و برای همین از `legacy/js` می‌خوانند؛ مثلاً هش رمز، قواعد حضور و غیاب، پنل پرسنل.
- `tests/fixtures/` فایل‌های نمونهٔ ورود تردد را دارد.

## ابزار آزمون و توسعه (`tools/`، `package.json`)
| دستور | کار |
|---|---|
| `npm run check` | `node --check` همهٔ فایل‌های JavaScript اپ، آزمون‌ها و ابزارها |
| `npm test` | همهٔ `tests/qa_template_*.js` با خلاصهٔ نتیجه |
| `npm run verify` | هر دو |
| `npm run fetch-data` | کپی **فقط‌خواندنی** همهٔ ماژول‌های API زنده در `.local-data/` (در git ثبت نمی‌شود و اطلاعات حساس دارد) |
| `npm run serve` | سرور محلی: مخزن + API شبیه‌سازی‌شده روی کپی محلی (`tools/dev-server.cjs`). هیچ‌وقت به API واقعی وصل نمی‌شود؛ ذخیره‌ها فقط در حافظهٔ همان اجرا می‌مانند. آدرس: `http://127.0.0.1:8790/app/index.html` با ورود خودکار مالک اسکریپت‌های CDN (echarts، xlsx، آیکون) را یک بار می‌گیرد و در `.local-data/cdn/` نگه می‌دارد تا مرورگر آزمون بدون دسترسی Chrome به CDN هم نمودار داشته باشد. |
| `npm run smoke` | سرور + Chrome بدون رابط + `tools/probes/smoke.js`: صفحه‌های اصلی را باز می‌کند و خطاهای JS را گزارش می‌دهد |
| `node tools/smoke.cjs tools/probes/<x>.js [ثانیه] [عرض]` | اجرای probe دلخواه؛ عرض ۳۹۰ = گوشی (`tools/probes/layout.js` چیدمان دسکتاپ و گوشی را می‌سنجد) |
| `node tools/browser-run.cjs <url> [ثانیه] [عرض] [نام عکس]` | اجرای مستقیم Chrome بدون رابط |

**Probe:** فایل JavaScript که سرور در صفحه تزریق می‌کند. کارهایش:
- منتظر دادهٔ زنده می‌ماند (`InvControl.ready()`).
- صفحه‌ها را با `location.hash` باز می‌کند و روی دکمه‌ها کلیک می‌کند.
- با `window.confirm=()=>true` تأییدها را خودکار رد می‌کند.
- نتیجه را به‌صورت JSON در `<pre id="qa-result">` می‌گذارد.
- با `window.__shotReq='name'` عکس در `.local-data/shots/` ذخیره می‌کند.

نمونه: `tools/probes/smoke.js`.

## گزارش‌های دوره‌ای (`reports-real.js`)
- بازه (`ReportsReal.st`: طول ۱، ۳، ۶ یا ۱۲ ماه و ماه پایان) بین پنج تب مشترک است. `ReportCore.span` کلید ماه‌ها را می‌دهد.
- سود و زیان هر ماه همان `LedgerReal.monthPnl` (صفحهٔ «مالی ← سود و زیان») است و `ReportCore.sumPnl` ماه‌ها را جمع می‌کند؛ قاعدهٔ تازه‌ای ندارد.
- فروش آیتم‌ها از `ReportCore.salesMonths` می‌آید: هر فایل فروش روی روزهایش پخش می‌شود و سهم هر ماه تقویمی جدا می‌شود.
- نمودارها با `RT.chart` (ECharts) و رنگ‌های `--c1` تا `--c6` ساخته می‌شوند؛ رنگ هر گروه ثابت است (نه بر اساس رتبه). میله‌های افقی، خط‌های خلاصه و راهنمای دونات HTML ساده‌اند (`.rp-*` در `panel.css`).
- چاپ: `window.print()`؛ نوار انتخاب بازه `no-print` است.

## جدول یکپارچه (`P.grid` در `shell.js`)
مرتب‌سازی: خانه‌ای که ماه شمسی («آذر ۱۴۰۵») یا تاریخ شمسی است به ترتیب تقویم مرتب می‌شود (`P.calKey`)؛ بقیه عددی یا متنی.
گزینه‌های ستون در `P.table`: `n` (عدد)، `m` (مبلغ)، `w` (چندخطی پهن)، `tc` (وسط‌چین)، `nar` (باریک و چندخطی، حداکثر ۱۳۰px)، `noSum`، `noSort`، `hide`.

هر جدول `table.table` داخل صفحه یا مودال، بعد از هر render خودکار این‌ها را می‌گیرد:
- **ابزار جدول:** نمایش ستون‌ها (انتخاب در مرورگر می‌ماند)، خروجی Excel (همهٔ ردیف‌ها و ستون‌های نمایش‌داده)، و اندازهٔ صفحه (۵۰، ۱۰۰، ۲۰۰، همه).
- **مرتب‌سازی:** با کلیک روی سر ستون، به‌صورت عددی، تاریخ یا متن.
- **جمع:** ردیف جمع برای ستون‌های عددی (`n:1`)، مگر `noSum`. عددها از متن خانه خوانده می‌شوند، با ارقام فارسی، جداکننده، علامت منفی و پسوند «میلیون» و «میلیارد».
- **پنهان پیش‌فرض:** ستونی با `hide:1` در `P.table` (یا `data-hide="1"` روی th) تا وقتی کاربر انتخاب ستون‌ها را برای آن فهرست ذخیره نکرده پنهان است.
- **جدول پرستون:** کلاس `table compact` فاصله‌ها و قلم را کوچک می‌کند، سر ستون‌ها دوخطی و ستون اول و آخر چندخطی می‌شوند (گردش مواد).
- **کنار گذاشتن:** جدول دارای ورودی (`input`/`select`) یا با `cls:'no-grid'` کنار گذاشته می‌شود. ردیف خالی (`colspan`) و `tfoot` موجود حفظ می‌شوند.
## فیلد «پرداخت‌کننده» (`P.payerField` در `shell.js`)
فیلد اختیاری هر فرم پرداخت: پیشنهاد نام کاربران مدیریت و پرسنل فعال (datalist)، نام آزاد هم پذیرفته است؛ مقدار در `paidByName` سند. خالی یعنی ثبت‌کننده (`createdBy`). «گردش صندوق» همین را نشان می‌دهد (`FinanceWrite.accountMoves` ← `by`).

## انتخاب تاریخ (`P.datePick` در `shell.js`)هر `input` متنی که مقدار یا `placeholder`ش تاریخ کامل شمسی است (`۱۴۰۵/۰۸/۱۷`، با «از »/«تا » هم) با `focusin` پنجرهٔ `.dp-pop` می‌گیرد: «امروز»، «دیروز»، «پریروز» و فهرست روز/ماه/سال (روزهای هر ماه از `InvEngine.CAL`). انتخاب، `input` و `change` می‌فرستد، پس فیلترها و فرم‌ها کار اضافه نمی‌خواهند. فیلد تازهٔ تاریخ کافی است مقدار یا نمونهٔ تاریخ داشته باشد. `data-nodate` آن را کنار می‌گذارد. فیلد `readonly` و ماه تنها (`۱۴۰۵/۰۸`) پنجره نمی‌گیرند.

## ابزارهای راه‌اندازی، مصرف بی‌رسپی و روغن (BL-011، BL-010، BL-016)
- `InvWrite.startFreshPlan / startFresh / startFreshPrices / rollbackStartFresh / rollbackStartFreshPrices / resetCountsPlan / resetCounts / rollbackResetCounts`: دو ذخیره (انبار، بعد قیمت‌گذاری) با یک `operationId`؛ کارت «ابزارهای راه‌اندازی» در «انبار ← تنظیمات» (`setupCard`، فقط مالک).
- `ConsumptionAlerts.report(P, settings, {levelOf, M})`: با مدل `M` (نقاط شمارش، ورود، ادغام، مصرف، گزارش صندوق) ردیف‌ها `nonRecipe` و `nonRecipeLevel` می‌گیرند.
- `InvEngine.oilCycles(M, {oilId, warn, critical})`: دوره‌های هر سرخ‌کن از رکوردهای `FRYER_OIL_CHANGE`؛ کارت «دوره‌های تعویض روغن» در «مدیریت مصرف ← روغن و اقلام سر میز».

## موجودی در تاریخ و گردش کالا (BL-094)
- `InvEngine.itemLedger(M,id,date)`: دوره‌های بین نقاط شمارش یک قلم تا پایان `date` (`segments`: `start`، `events`، `sales` با `salesBy`، `expected`، `end`، `variance`) و `qty` = همان `positions(M,date)`. آزمون `tests/qa_template_item_ledger.js` برابری این دو را می‌سنجد.
- `InvWrite.editOpeningLine(doc,ctx,{date,itemId,quantity,unit,reason})`: اصلاح یا افزودن یک قلم در شمارش افتتاحیه (شرح در BUSINESS_RULES).
- `inventory-real.js`: `posAt(date)` (حافظه به ازای مدل)، `countPointDates()`، `ledger(id,date)`، `openingEdit(date,id,then)`؛ `countLineEdit`، `countLineRemove` و `countForm({then})` گزینهٔ `then` گرفتند تا گردش بعد از ذخیره دوباره باز شود. probe: `tools/probes/item-ledger.js`.

## نسخهٔ فرمول اقلام آماده (BL-015)
`InvEngine.prepAt(pricing,id,date)` فرمول نافذ یک تاریخ را برمی‌گرداند (قلم با `components`، `countUnit`، `baseOutputQuantity`، `version` و `versionId` همان نسخه). `build()` همین را در `recipeAt(mid,date)` به کار می‌برد (حافظهٔ موقت بر اساس سطرهای رسپی و شناسهٔ نسخه‌ها). `prepConvert(…,{history:true})` برای تاریخ‌های گذشته وضعیت «غیرفعال» را نادیده می‌گیرد. نوشتن: `MenuWrite.recordPrepVersion` (از `savePreparedItem` و `mergeIngredients`)؛ خواندن برای فرم: `MenuWrite.prepVersions`.

## فهرست‌های انبار (`compactInv` در `shell.js`)
در مسیرهای `#/inventory/…` هر جدولی که `P.grid` می‌گیرد کلاس `compact inv-compact` می‌گیرد (فاصلهٔ کم، سرستون دوخطی، `small` سرستون در خط دوم). ستون عددی‌ای که خانه‌هایش «… میلیارد/میلیون/هزار» دارند (`P.mShort`) یک مقیاس می‌گیرد (همان که بیشتر خانه‌ها دارند): خانه‌ها فقط عدد (`٫` و `٬`) و سرستون «(میلیارد ریال)». جمع ستون با همان قالب. برای ستونی که نباید مقیاس بگیرد، مبلغ کامل (`P.mt`) بدهید.

## اندازهٔ مودال
کلیک بیرون پنجره (`.modal-backdrop`) فقط پنجرهٔ بدون فیلد را می‌بندد؛ پنجرهٔ فرم‌دار کلاس `nudge` (تکان) می‌گیرد. کلیک فقط وقتی حساب است که mousedown هم روی پس‌زمینه بوده. Esc وقتی فیلدی تغییر کرده (`data-dirty` روی پس‌زمینه، با هر `P.modal` پاک می‌شود) تأیید می‌خواهد (`core/js/app.js`).

`size:'lg'` (۹۰۰px) و `size:'wide'` (۱۰۰۰px)؛ در دسکتاپ `form-grid` داخل این دو سه‌ستونه است (مگر `grid-template-columns` در خود عنصر). فرم ویرایش تازه را با یکی از این دو بسازید تا اسکرول عمودی کم باشد.

## ورود از Excel و کارت روند (`shell.js`)
- `P.importer({title, file, columns:[{h,key,req,hint,ex,alias}], note, toInput, check, save, can, why})` پنجرهٔ یکسان ورود را می‌سازد: راهنمای ستون‌ها، فایل خالی و نمونه با برگهٔ راهنما (`P.excelBook`)، و پیش‌نمایش با خطای هر ردیف. `check` روی کپی دادهٔ فعلی همان تابع هسته را اجرا می‌کند. `save` ردیف‌های درست را در یک ذخیره ثبت می‌کند. `P.readSheets(file)` برگه‌ها را می‌خواند.
- `P.trendCard(id,{title, months, series:[{name,byMonth}], donut:{title,data}})` کارت نمودار خطی ماهانه و دونات را می‌سازد و بعد از قرار گرفتن در صفحه رسمش می‌کند. `P.lastMonths(n,to)` کلیدهای ماه را می‌دهد.
- در سرور آزمون `window.RAYO_CDN_PROXY` بارگذاری پویای کتابخانه‌ها (xlsx) را از کش `.local-data/cdn/` می‌گذراند. روی سرور واقعی تعریف نشده است.

## افزودن امکانات تازه
1. منطق را در `core/js/<ماژول>-write.js` بنویسید: تابع خالص با پیام خطای فارسی.
2. رابط را در `js/pages/<بخش>-real.js` بنویسید و ثبت را با همان پروتکل انجام دهید.
3. آزمون را در `tests/qa_template_<ماژول>.js` اضافه کنید.
4. سند مالک را به‌روز کنید: `STATE.md`، `BUSINESS_RULES.md`، و در صورت نیاز `DATA_MODEL_V10.md` و `DECISIONS.md`.
5. فایل تازه فقط وقتی بسازید که در فایل مالک جا نشود. اگر ساختید، به `index.html` و جدول این سند اضافه‌اش کنید.
