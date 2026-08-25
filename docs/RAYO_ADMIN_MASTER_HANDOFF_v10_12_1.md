# سند جامع تحویل و ادامه توسعه Rayo Admin

**نسخه مبنا:** `v10.12.1`  
**تاریخ تدوین:** ۱۴۰۵/۰۶/۰۱ (2026-08-23)  
**وضعیت:** سند مرجع مستقل برای انتقال پروژه به چت، AI یا تیم توسعه دیگر  
**زبان و جهت رابط:** فارسی، راست‌به‌چپ  

> این سند باید قبل از هر تغییر خوانده شود. «وضعیت فعلی» را از «طرح پیشنهادی React/SQL» جدا می‌کند. هیچ بخش پیشنهادی به معنی پیاده‌سازی فعلی نیست.

## 1. خلاصه اجرایی

Rayo Admin پنل عملیاتی کافه‌رستوران رایو در لواسان است. پروژه از Excel/Google Sheets آغاز شد و اکنون یک برنامه چندصفحه‌ای HTML/CSS/JavaScript بدون Build Tool است که داده هر حوزه را به‌صورت یک سند JSON کامل از API می‌خواند و ذخیره می‌کند. نسخه عملیاتی مرجع `v10.12.1` است.

اهداف اصلی:

- مدیریت صندوق، فروش و ممیزی سپیدز؛
- پرسنل، شیفت، حقوق، انعام، دسترسی، آموزش و چک‌لیست؛
- یک کاتالوگ مرکزی برای مواد اولیه، مصرفی‌ها، بسته‌بندی، کالای عمومی/قطعه و خدمات؛
- مدیریت منو، رسپی و نسخه‌های تاریخ‌دار رسپی؛
- قیمت‌گذاری و پایش Food Cost؛
- انبار چندمحلی، ورود/خروج، فروش، ضایعات، انبارگردانی و مغایرت؛
- تأمین‌کنندگان، اقلام قابل تأمین، خرید، پرداخت و بدهی؛
- اموال، تعمیرات، شکستگی و حوادث؛
- گزارش‌های مدیریتی، مالی و نظرسنجی.

اصول غیرقابل نقض فعلی:

1. داده زنده فقط از API خوانده می‌شود؛ Seed در Load عادی ممنوع است.
2. Seed/Merge/Reset فقط با اقدام صریح مدیر، پیش‌نمایش و Backup انجام می‌شود.
3. شناسه‌ها و کدهای سپیدز تغییر نمی‌کنند.
4. رکورد دارای سابقه حذف فیزیکی نمی‌شود؛ غیرفعال/آرشیو می‌شود.
5. `pricing.ingredients` در مدل JSON فعلی مرجع مرکزی تمام اقلام است، با وجود نام تاریخی `ingredients`.
6. گروه قلم (`category`) و نوع رفتاری (`itemType`) مستقل‌اند.
7. شمارش تأییدشده موجودی Baseline دوره بعد است؛ مغایرت دوره‌های گذشته نباید روی دوره بعد انباشته شود.
8. رسپی و تراکنش تاریخی باید با Snapshot/Version قابل بازسازی باشند.

## 2. دارایی‌های مرجع و ترتیب اعتبار

در صورت تعارض منابع، این ترتیب معتبر است:

1. سورس اجرایی `Rayo Admin v10.12.1`؛
2. JSON زنده API و Backup همان محیط؛
3. این سند؛
4. QA و Handoff نسخه‌های v10.12.x؛
5. مستندات قدیمی؛
6. فایل‌های Excel اولیه.

فایل‌های مبنا:

| منبع | نقش | نکته |
|---|---|---|
| `Rayo_Admin_v10_12_1_Base_Data_Inventory_Fix_FLAT.zip` | بسته اجرایی مرجع | قبل از تغییر Extract و QA شود |
| `MenuCost_with_suggestions.xlsx` | منشأ قیمت/منو | ۱۵۵ ردیف، ۱۱ ستون؛ داده تاریخی |
| `rayo_suppliers.xlsx` | منشأ تأمین‌کنندگان و اقلام | شیت‌های تأمین‌کنندگان، فهرست اقلام و نگاشت |
| `شیفت_پلن.xlsx` | منشأ برنامه شیفت | الگوی پایه، هفته، پرسنل، مرخصی |
| `RayoDailyCashReport.xlsx` | منشأ صندوق/نظرسنجی | الگوی ماه، داشبورد، گزارش روزانه |
| `Rayo Statement_Template.xlsx` | منشأ مالی تاریخی | بانک، صندوق، تنخواه، شرکا و گزارش‌ها؛ Runtime نیست |

Excelها نباید مستقیماً منبع حقیقت Runtime شوند. Import باید به Staging، اعتبارسنجی و سپس Commit شود.

## 3. معماری فعلی (As-Is)

### 3.1 فناوری و ساختار فایل

- MPA: چند صفحه HTML مستقل.
- CSS مشترک `css/style.css` و Patchهای نسخه‌ای `css/04...` تا `css/10...`.
- JavaScript سراسری و Patchمحور: `js/00-base.js` تا `js/47-base-data-v10-12-1.js`.
- بدون npm، bundler، TypeScript یا framework.
- state در متغیرهای global و توابع سراسری؛ ترتیب `<script>`ها بخشی از رفتار برنامه است.
- فایل‌های Seed در `seed/*.seed.json` فقط برای مقداردهی/Reset صریح.
- QAهای Node در ریشه، از جمله `qa_v10_12_1.js`.

این ساختار برای ادامه Patchهای کوچک قابل استفاده است، اما برای توسعه بلندمدت شکننده است: Override چندنسخه‌ای، coupling زیاد، DOM مستقیم، نام‌های تکراری و نبود مرزبندی component/module.

### 3.2 API فعلی

تنها Gateway معتبر:

```text
GET  https://chat.yekzan.com/api/v1.0/RayoData/Load?module=<module>
POST https://chat.yekzan.com/api/v1.0/RayoData/Save?module=<module>
```

تنظیم دامنه فقط در `js/app-config.js`:

```js
window.RAYO_ENV = {
  API_ORIGIN: 'https://chat.yekzan.com',
  API_PREFIX: '/api/v1.0',
  API_CONTROLLER: '/RayoData',
  TIMEOUT_MS: 25000
};
```

نگاشت ماژول‌ها:

| کلید Frontend | module در Backend | حوزه |
|---|---|---|
| `hr` | `personnel` | پرسنل، شیفت و حقوق |
| `suppliers` | `suppliers` | تأمین و درخواست خرید |
| `pricing` | `pricing` | کاتالوگ، منو، رسپی، قیمت |
| `inventory` | `inventory` | انبار و کنترل مصرف |
| `cashreport` | `cashreport` | صندوق و تحلیل فروش |
| `assets` | `assets` | اموال و حوادث |
| `finance` | `finance` | مالی و P&L |
| `survey` | `survey` | نظرسنجی |
| `errorlog` | `errorlog` | خطاهای Client |
| `sepidsaudit` | `sepidsaudit` | ممیزی سپیدز |

هر Save کل سند ماژول را می‌فرستد، نه یک رکورد. Gateway پاسخ‌های چندلایه یا JSON-stringشده ASP.NET را Normalize می‌کند. Save دارای token، سپس GET تأییدی است.

### 3.3 قواعد ایمنی داده

`window.RAYO_SEED_POLICY = 'manual-initialize-or-reset-only'`.

- Save فقط وقتی مجاز است که همان ماژول در همان Session با موفقیت Load شده و initialized باشد.
- استثنا: Initialize/Reset صریح و `errorlog`.
- Load عادی نه Seed می‌خواند، نه Merge می‌کند، نه داده روی Server می‌نویسد.
- هر عملیات مهاجرت باید Backup قابل دانلود، Preview، شمارش رکورد و Rollback داشته باشد.
- در خطای API، state خوش‌بینانه UI باید برگردد.

محدودیت مهم: Whole-document Save در دو کاربر هم‌زمان خطر Lost Update دارد. تا زمان SQL باید editهای هم‌زمان محدود، `updatedAt` کنترل، و قبل از عملیات مهم Backup گرفته شود.

## 4. ساختار ناوبری و صفحات فعلی

منوی اصلی پویا در `js/44-phase1-polish-v10-10-1.js` ساخته می‌شود:

| ترتیب | عنوان | مسیر/ساختار |
|---:|---|---|
| 1 | گزارش صندوق | `cash-report-admin.html` |
| 2 | فروش | `sales-analysis.html`؛ تب‌های داخلی باید کنترل صندوق/ممیزی را پوشش دهند |
| 3 | مدیریت پرسنل | گروه لینک‌های `personnel.html?view=...` |
| 4 | حقوق و دستمزد | گروه لینک‌های `personnel.html?view=...` |
| 5 | مدیریت منو | `menu-management.html` |
| 6 | قیمت‌گذاری | `pricing.html` |
| 7 | انبارداری | `inventory.html` |
| 8 | خرید و تأمین | `suppliers.html` |
| 9 | آموزش‌ها و چک‌لیست‌ها | views پرسنل |
| 10 | گزارشات | `reports.html` و گزارش‌های مالی/نظرسنجی |
| 11 | اموال و دارایی | `assets.html` |
| 12 | تنظیمات | اطلاعات پایه، Backup، نمایش امکانات، تخلفات و Error Log |

تنظیم Feature Visibility فقط نمایش را مخفی می‌کند و داده را حذف نمی‌کند. این قابلیت امنیت نیست؛ کنترل دسترسی باید جداگانه Server-side باشد.

### 4.1 صفحات مستقل کلیدی

| صفحه | مسئولیت |
|---|---|
| `base-data.html` | تعریف، ویرایش و Import کاتالوگ مشترک اقلام |
| `menu-management.html` | آیتم‌های منو، دسته‌ها، رسپی و نسخه رسپی |
| `pricing.html` | خلاصه، نیازمند تغییر، تاریخچه قیمت، تنظیمات قیمت‌گذاری |
| `inventory.html` | عملیات و گزارش انبار |
| `suppliers.html` | تأمین‌کننده، اقلام، سوابق خرید، پرداخت و حساب |
| `cash-report.html` | ثبت عمومی/صندوقدار |
| `cash-report-admin.html` | مدیریت، تأیید و حذف تأییدشده گزارش صندوق |
| `sales-analysis.html` | فروش و تحلیل |
| `sepids-audit.html` | Import و ممیزی حذف/ویرایش سپیدز |
| `personnel.html` | views پرسنل، حقوق، شیفت، دسترسی، آموزش و تنظیمات |
| `reports.html` | ارزش موجودی و خسارت/مغایرت/ضایعات |
| `assets.html` | اموال، تعمیر و Incident |
| `finance.html` | سود و زیان و هزینه‌ها |
| `survey.html` | نظرسنجی و پیگیری |
| `staff-login.html`, `staff-panel.html` | ورود و پنل پرسنلی |

## 5. طراحی گرافیکی و Design System فعلی

### 5.1 هویت بصری

- فونت: `IRANSansX` با fallback `Vazirmatn`, `Vazir`, `Tahoma`, `Arial`.
- پس‌زمینه: `#f4f6f8`.
- کارت: سفید `#ffffff`، Border `#dfe5ec`، Radius `14px`، Shadow نرم.
- متن: سرمه‌ای تیره `#172033`؛ متن کم‌اهمیت `#667085`.
- Primary: سبز تیره `#134e4a`؛ Primary action `#0f766e`.
- Accent: طلایی `#f59e0b`.
- Success `#067647`، Danger `#b42318`.
- Sidebar: `#102a2a`، عرض Desktop برابر 260px، sticky و تمام ارتفاع.
- Topbar: sticky با پس‌زمینه نیمه‌شفاف و blur.
- Card: padding 16px و فاصله 16px؛ Modal حداکثر 880px و 92vh.
- کنترل‌ها: ارتفاع حداقل 38px، Radius 9px، Focus outline سبز.
- جدول‌ها: Header sticky، زمینه `#eef4f4`، حداقل عرض و Scroll افقی.

### 5.2 وضعیت‌ها

| وضعیت | رنگ |
|---|---|
| موفق/کامل | سبز روشن، متن سبز |
| هشدار/مازاد | زرد/طلایی |
| خطا/کمبود | قرمز روشن |
| تعطیل رسمی | قرمز |
| شب تعطیل | نارنجی |
| نامشخص | خاکستری |

قیمت تمام‌شده: زیر ۲۰٪ آبی، ۲۰ تا کمتر از ۳۰٪ سبز، ۳۰ تا ۴۰٪ نارنجی، بالای ۴۰٪ قرمز؛ Thresholdها باید تنظیم‌پذیر باشند و رنگ تنها حامل معنا نباشد.

### 5.3 Responsive و دسترس‌پذیری

- زیر 680px، Sidebar به Bottom Navigation 64px تبدیل می‌شود.
- Gridها تک‌ستونه، Modal تمام‌صفحه و جدول‌ها Scroll می‌شوند.
- RTL باید روی `html/body` حفظ شود؛ اعداد، کد، IBAN و مبلغ در سلول `.num` با LTR نمایش داده شوند.
- هر Input باید Label، Focus visible، Error text و Keyboard path داشته باشد.
- Checkbox و متن با `display:flex; align-items:center` تراز شوند.
- Password eye باید داخل shell با padding مناسب باشد؛ دکمه متنی تکراری نمایش رمز ممنوع.
- در نسخه React، contrast حداقل WCAG AA و تست axe اجباری شود.

## 6. کاتالوگ مرکزی اقلام

### 6.1 تصمیم دامنه

در JSON فعلی `pricing.ingredients[]` مرجع اصلی تمام اقلام است. نام `ingredients` تاریخی است و به معنی «فقط ماده اولیه» نیست. `suppliers.items[]` Mirror/Archive سازگاری است و نباید دوباره Master شود.

تفکیک دو محور:

- `category`: گروه گزارش/خرید مانند تره‌بار، پروتئین، شوینده؛
- `itemType`: رفتار سیستم در رسپی/انبار/تأمین.

این دو مستقل‌اند. مثال «تره‌بار + کالای عمومی/قطعه» ممکن ولی غیرمعمول است؛ UI می‌تواند هشدار دهد اما نباید بدون قانون کسب‌وکار قطعی مسدود کند.

| itemType | عنوان | رسپی | انبار | تأمین | مثال |
|---|---|---:|---:|---:|---|
| `MENU_INGREDIENT` | ماده اولیه منو | بله | بله | بله | گوشت، پنیر |
| `MENU_CONSUMABLE` | ملزومات مستقیم منو | بله | بله | بله | سینگل پیتزا |
| `OPERATIONAL_CONSUMABLE` | مصرفی عملیاتی | خیر | بله | بله | دستمال، شوینده |
| `GENERAL_INVENTORY` | کالای عمومی/قطعه | خیر | بله | بله | لامپ، قطعه، لیوان کم‌ارزش |
| `NON_STOCK` | خدمت/هزینه غیرموجودی | خیر | خیر | بله | سرویس یا حمل |

فیلدهای کلیدی قلم: `id`, `code`, `name`, `category`, `purchaseUnit`, `recipeUnit`, `packageQuantity`, `lastPurchasePriceToman`, `wastePercent`, `lastPurchaseDate`, `status`, `notes`, `sepids`, `itemType`, `recipeCapable`, `inventoryTracked`, `procurementEnabled`.

قواعد:

- `id` FK اصلی؛ `code` و نام در رکورد تاریخی Snapshot شوند.
- فقط `recipeCapable=true` در انتخاب ماده رسپی نمایش داده شود.
- فقط `inventoryTracked=true` وارد دفتر موجودی و انبارگردانی شود.
- فقط `procurementEnabled=true` در خرید/تأمین نمایش داده شود.
- دارایی بادوام و شماره‌دار در Assets است؛ لیوان/پلیت کم‌ارزش با شکستگی پرتکرار بهتر است `GENERAL_INVENTORY` و Movement نوع `BREAKAGE` باشد. تجهیز با عمر و سرویس، Asset است.
- حذف قلم مرتبط با Recipe، SupplierItem، Movement، Invoice یا Stocktake ممنوع؛ فقط inactive/archive.

Seed فعلی: ۶۱۵ قلم، ۳۷۹ آیتم منو، ۹۱۲ خط رسپی و ۵۳۱ رکورد تاریخچه قیمت ماده.

## 7. مدیریت منو و رسپی

`menu-management.html` دارای تب‌های آیتم منو، دسته‌بندی، رسپی و نسخه‌های تاریخ‌دار است.

قواعد:

- آیتم منو: `id`, `code`, `name`, `category`, `currentPriceToman`, target cost, manual cost, status, last price date, unit, Sepidz metadata.
- دسته‌بندی منو در `pricing.lists.menuCategories` فعلی است؛ در SQL جدول مستقل شود.
- آیتم دارای فروش حذف نمی‌شود؛ inactive می‌شود.
- انتخاب پیش‌فرض فقط آیتم فعال.
- Recipe line: `menuItemId`, `ingredientId`, `quantity`, `notes`.
- افزودن ماده زیر آیتم و Modal دارای Search؛ فقط قلم recipe-capable.
- RecipeVersion باید `effectiveFrom`، خطوط Snapshot و audit داشته باشد. نسخه موثر فروش، آخرین نسخه با `effectiveFrom <= saleDate` است.
- تغییر رسپی گذشته نباید بهای استاندارد فروش تاریخی را بازنویسی کند.

## 8. قیمت‌گذاری

صفحه `pricing.html` فقط چهار تب دارد:

1. خلاصه؛
2. نیازمند تغییر؛
3. تاریخچه قیمت؛
4. تنظیمات مرتبط با قیمت‌گذاری.

کاتالوگ، آیتم منو و رسپی نباید دوباره در این صفحه مدیریت شوند. محاسبات مهم:

- Recipe Cost = مجموع `quantity × effective ingredient unit cost` با Waste استاندارد؛
- Cost % = Cost / Selling Price × 100؛
- هدف دسته، قیمت پیشنهادی، قیمت دستی و تاریخ اجرا؛
- تاریخچه قیمت فروش و خرید باید append-only باشد.

واحد پول داخلی هدف: تومان. ورودی ریال باید در Import با divisor صریح تبدیل و مقدار خام نیز برای audit نگهداری شود.

## 9. انبارداری و کنترل مصرف

### 9.1 ساختار فعلی v10.12.1

نسخه فعلی ۹ تب عملیاتی دارد:

1. موجودی؛ 2. ورود به انبار؛ 3. خروج از انبار؛ 4. ثبت فروش؛ 5. ثبت پرتی و ضایعاتی؛ 6. انبارگردانی؛ 7. مغایرت و گردش؛ 8. نیاز به سفارش؛ 9. تنظیمات.

نمای موجودی باید دو حالت داشته باشد:

- جمع کل قلم در همه محل‌ها؛
- تفکیک یک محل انتخابی.

Search نباید با هر keypress کل view را Render و Focus را حذف کند. Location dropdown از `inventory.locations` Normalizeشده و فقط فعال‌ها را می‌گیرد. نسخه چاپ A4 فقط نام، موجودی و واحد؛ Drill-down یک قلم، مقدار هر محل را نشان می‌دهد.

### 9.2 تعارض ۹ تب و ۱۲ تب

در نسخه‌های قدیمی یک الزام سخت «دقیقاً ۱۲ تب انبار» ثبت شده بود: موجودی و سفارش، شروع عملیات، فاکتورها، پرداخت تأمین‌کننده، انتقال، مصرف و موجودی، ثبت فروش، پرتی، مغایرت و گردش، تنظیمات انبار، بستن دوره، محل‌ها و نگاشت‌ها. درخواست‌های جدید بعضی از این مسئولیت‌ها را به خرید/تأمین، گزارشات یا تنظیمات منتقل کرده‌اند و v10.12.1 عملاً ۹ تب دارد.

**تصمیم پیشنهادی:** ۹ تب فعلی مبنای UX باشد؛ «پرداخت و فاکتور خرید» در خرید و تأمین، «گزارش خسارت» در گزارشات، و «محل/نگاشت» در تنظیمات انبار بماند. قبل از تغییر بعدی مالک محصول باید این تصمیم را تأیید کند. AI بعدی نباید خودسرانه ۱۲ تب را برگرداند یا ۹ تب را قطعی تاریخی معرفی کند.

### 9.3 دفتر موجودی و فرمول‌ها

منابع فعلی: `locations`, `openingBalances`, `inventoryMovements`, `purchaseInvoices`, `stockReceipts`, `wasteRecords`, `consumptionRecords`, `salesPeriods`, `stocktakes`, `periodClosures`.

Movementها: `PURCHASE_RECEIPT`, `TRANSFER`, `RETURN_TO_WAREHOUSE`, `WASTE`, `SPILL`, `EXPIRY`, `BREAKAGE`, `MISSING`, `STAFF_CONSUMPTION`, `MANAGEMENT_GUEST`, `TEST_CONSUMPTION`, `OTHER_AUTHORIZED`, `ADJUSTMENT`.

فروش از `salesPeriods + recipeVersions + productionLocationId` مصرف استاندارد می‌سازد و نباید Movement تکراری تولید کند.

```text
ExpectedStock = Baseline + Inbound - Outbound - StandardSalesConsumption
Variance      = ActualCount - ExpectedStock
ActualCOGS    = OpeningValue + Purchases - ClosingValue
Unexplained   = ActualCOGS - StandardSalesCOGS - RegisteredWaste - AuthorizedConsumption
```

Cost Method فعلی: weighted average. ارزش روز جداگانه می‌تواند با آخرین قیمت خرید گزارش شود. هر دو باید هم‌زمان قابل مشاهده باشند و با هم اشتباه نشوند.

### 9.4 انبارگردانی و بستن دوره

- کاربر تاریخ/زمان Baseline، محل و موجودی واقعی هر قلم را ثبت می‌کند.
- شمارش Draft قابل ویرایش؛ Approved قفل می‌شود.
- Approved count نقطه شروع دوره بعد است.
- Adjustment برای audit ثبت می‌شود، نه برای دوباره شمردن مغایرت.
- دوره‌ها قابل مقایسه‌اند: درصد و مبلغ مغایرت، Waste، Breakage و روند کاهش.
- گزارش اثر پرتی و مغایرت بر Food Cost باید Standard Cost، Waste impact و Variance impact را جدا کند.

## 10. خرید و تأمین

صفحه خرید و تأمین باید با Tab داخلی و بدون زیرمنوی Sidebar باشد. مسئولیت‌ها:

- لیست و جزئیات کامل تأمین‌کننده، حساب/بانک و راه برگشت داخلی؛
- اقلام اصلی و تأمین‌کننده جایگزین؛
- آخرین Quote/خرید هر تأمین‌کننده برای هر قلم؛
- مسئول سفارش، روز/مهلت سفارش، Lead time و موعد تحویل؛
- تشخیص سفارش ثبت‌نشده و میز سفارش‌گذاری؛
- سوابق خرید، پرداخت‌ها، بدهی و مرتب‌سازی بدهکاران؛
- ثبت و پیگیری Purchase Request/Order تا تحویل.

مرزبندی جدید: خرید و تأمین مالک رابطه تجاری و مالی تأمین‌کننده است؛ انبار مالک Receipt و موجودی است. یک خرید می‌تواند از تأمین‌کننده متفرقه باشد. Receipt باید بتواند به Purchase Order/Invoice لینک اختیاری داشته باشد، اما ثبت ورود انبار نباید وابسته اجباری به مالی باشد.

`suppliers.items` legacy mirror است. FK اصلی `supplierItems[].ingredientId` به کاتالوگ. Snapshot نام/کد/قیمت برای تاریخ نگهداری شود.

## 11. سایر ماژول‌ها

### 11.1 پرسنل، شیفت و حقوق

شامل `personnel`, weekly/monthly plans, shift records, staffing requirements, holidays, payroll closures, salary model, adjustments, tips, penalties/rewards, delays, payments, consumptions, leaves, violations, protocols و checklists.

- Section و Position دارای ماتریس معتبرند؛ dropdownها placeholder و required.
- ثبت تکی «ذخیره و ادامه» و ثبت گروهی نیروی موردنیاز.
- رکورد ناسازگار قدیمی حذف نمی‌شود و نیازمند اصلاح علامت می‌خورد.
- اطلاعات بانکی در جزئیات پرسنل/تأمین‌کننده قابل مشاهده با permission مناسب.
- رمز ساده فعلی به SQL منتقل نشود.

### 11.2 صندوق و فروش

- گزارش روزانه، صندوق‌ها، مغایرت و تأیید مدیر.
- حذف گزارش فقط با permission مدیر، دلیل، Soft Delete و audit.
- Cash report meta فعلی currency ریال دارد ولی display تومان؛ در SQL یک Currency واحد + raw import amount لازم است.
- فروش سپیدز و ممیزی حذف/ویرایش با Import Batch، Event، Change، Alert و Review.

### 11.3 اموال

- دارایی شماره‌دار/تعدادی، تعمیر، تراکنش تعداد، شمارش و Incident.
- Asset با Inventory Item یکی نیست، اما می‌تواند `catalogItemId` اختیاری برای خرید داشته باشد.
- شکستگی لیوان کم‌ارزش در inventory breakage؛ شکست/خرابی تجهیز بادوام در AssetIncident.

### 11.4 مالی، نظرسنجی، گزارش و خطا

- Finance: entries، overrides ماهانه، پارامتر مالی و P&L.
- Survey: response و follow-up؛ داده شخصی محدود و Mask شود.
- Reports: projection خواندنی از ماژول‌ها؛ منبع حقیقت جدید ایجاد نکند.
- ErrorLog: خطای Client با scrub داده حساس، retention و rate limit.

## 12. قرارداد JSON فعلی

کلیدهای Top-level مورد پذیرش Gateway:

| module | Objectها | Arrayها |
|---|---|---|
| personnel | `meta, settings, lists, salaryModel, floorMap` | `personnel, weeklyPlans, monthlyPlans, shiftRecords, monthlyAdjustments, tipGroups, penaltiesRewards, delays, payments, consumptions, leaves, leaveRequests, payrollClosures, staffingRequirements, holidays, changeLog` و داده‌های آموزش/تخلف |
| suppliers | `meta, lists` | `suppliers, items, supplierItems, purchaseRequests, changeLog` |
| pricing | `meta, settings, lists` | `ingredients, menuItems, recipes, recipeVersions, priceHistory, ingredientPriceHistory, changeLog` |
| inventory | `meta, settings` | `trackedIngredients, periods, itemMappings, purchaseInvoices, supplierPayments, stockReceipts, wasteRecords, wasteShiftDeclarations, consumptionRecords, salesPeriods, stocktakes, locations, openingBalances, inventoryMovements, periodClosures, operationalUsagePeriods, changeLog` |
| cashreport | `meta, settings, salesAnalytics` | `cashiers, reports, changeLog` |
| assets | `meta, settings, lists` | `assets, maintenanceRecords, quantityTransactions, assetIncidents, counts, changeLog` |
| finance | `meta, settings` | `entries, monthlyOverrides, changeLog` |
| survey | `meta, settings` | `responses, changeLog` |
| errorlog | `meta` | `entries` |
| sepidsaudit | `meta, settings` | `importBatches, rawBlocks, events, eventItems, changes, alerts, reviews, links` |

Backend strict DTO باید همه این کلیدها و فیلدهای توسعه‌یافته را بپذیرد. Unknown field نباید بی‌صدا حذف شود؛ یا JSON document ذخیره شود یا API نسخه‌دار validation error برگرداند.

## 13. مشکلات و بدهی فنی شناخته‌شده

| ریسک | شدت | اقدام |
|---|---|---|
| ۴۸ فایل JS ترتیبی و Override | زیاد | توقف Patch جدید؛ مهاجرت component/module |
| Whole-document Save | بحرانی در چندکاربر | version/ETag فوری؛ SQL transaction |
| Auth و password سمت Client/متن ساده | بحرانی | Server auth، hash، HttpOnly cookie/JWT |
| Permission صرفاً UI | بحرانی | Policy server-side |
| JSON schema ضمنی | زیاد | JSON Schema/Zod + API version |
| واحد پول ریال/تومان مختلط | زیاد | canonical Toman + raw import |
| تاریخ شمسی string | متوسط | Gregorian canonical + Jalali display/original |
| Legacy mirrorها | متوسط | read-only/archive و migration mapping |
| ۹ در برابر ۱۲ تب انبار | محصولی | Product decision ثبت‌شده |
| DOM rerender و Focus loss | متوسط | React controlled state/memoization |
| محاسبات پراکنده Client | زیاد | Domain service تست‌شده در Backend |
| نبود transaction/idempotency | زیاد | DB transaction + idempotency key |
| گزارش‌ها از stateهای مختلف | زیاد | read model/materialized view |

## 14. معماری هدف React + SQL (To-Be)

### 14.1 پیشنهاد فناوری

- Frontend: React + TypeScript + Vite، React Router، TanStack Query، React Hook Form، Zod، date library با Jalali display، Vitest و Playwright.
- UI: Design tokens مشترک، component library داخلی RTL؛ از انتقال CSS patch-by-patch خودداری شود.
- Backend: Modular Monolith؛ اگر Backend فعلی .NET است ASP.NET Core Web API + EF Core انتخاب کم‌ریسک است.
- Database: SQL Server برای سازگاری .NET/زیرساخت؛ مدل منطقی با PostgreSQL نیز قابل اجراست.
- Auth: ASP.NET Identity/OpenID Connect، Cookie امن HttpOnly برای پنل؛ MFA برای مدیر.
- Observability: structured logs، correlation ID، audit trail، health checks و backup monitoring.

ساختار پیشنهادی Repository:

```text
apps/web/src/{app,routes,features,entities,shared}
services/api/{Modules,Infrastructure,Contracts,Migrations}
packages/design-system
packages/domain-contracts
tests/{unit,integration,e2e,migration}
docs/{adr,data-dictionary,runbooks}
```

هر feature دارای `api`, `model`, `ui`, `validation`, `tests` باشد. routeها Lazy-load و permission-aware، ولی authorization قطعی در API.

### 14.2 اصول SQL

- PK داخلی `bigint identity` یا UUID؛ `LegacyId nvarchar(50)` با Unique برای حفظ شناسه فعلی.
- `OrganizationId` و `BranchId` از ابتدا در جداول عملیاتی، حتی اگر فعلاً یک شعبه است.
- مبلغ `bigint` تومان؛ quantity و unit conversion `decimal(19,6)`.
- زمان `datetimeoffset UTC`، شعبه timezone `Asia/Tehran`؛ تاریخ کسب‌وکار `date` میلادی و Jalali فقط نمایش/Original Import.
- همه Masterها: `IsActive`, `IsArchived`, `RowVersion`, audit columns.
- تراکنش‌ها Soft Delete یا reversal؛ حذف فیزیکی ممنوع.
- Unique codeها scope شعبه/سازمان؛ Index روی date, status, FKها و search normalized name/code.
- Ledger موجودی immutable؛ balance یک projection قابل بازسازی است.
- RecipeVersion/StocktakeApproval/PeriodClosure immutable.

## 15. مدل رابطه‌ای پیشنهادی

ستون‌های مشترک Masterها: `Id bigint PK`, `LegacyId nvarchar(50) UNIQUE`, `OrganizationId`, `BranchId`, `CreatedAt datetimeoffset`, `CreatedByUserId`, `UpdatedAt`, `UpdatedByUserId`, `IsActive bit`, `IsArchived bit`, `RowVersion rowversion`.

### 15.1 هویت و سازمان

| جدول | ستون‌های خاص و رابطه |
|---|---|
| `Organizations` | Name, LegalName, CurrencyCode=`IRT` |
| `Branches` | OrganizationId FK, Name, TimeZoneId, Address |
| `Users` | Username normalized unique, PasswordHash, PersonnelId nullable, Status, LastLoginAt |
| `Roles` | Code unique, Name |
| `Permissions` | Code unique، Module، Action |
| `UserRoles` | UserId+RoleId unique |
| `RolePermissions` | RoleId+PermissionId+IsAllowed |
| `AuditLogs` | Actor, module, entity, entityId, action, before/after JSON, IP, correlationId, occurredAt |

### 15.2 پرسنل و عملیات نیروی انسانی

| جدول | ستون‌های خاص و رابطه |
|---|---|
| `Personnel` | Name, phone, section/position FKs, employment fields, credits, notes |
| `PersonnelBankAccounts` | PersonnelId, bank, holder, account, card, IBAN, IsPrimary؛ encrypted/masked |
| `Sections`, `Positions` | code/name/active |
| `SectionPositions` | SectionId+PositionId unique؛ نگاشت معتبر |
| `ShiftDefinitions` | Code, Name, StartTime, EndTime |
| `StaffingRequirements` | Weekday, ShiftId, SectionId, PositionId, RequiredCount, EffectiveFrom/To |
| `WeeklyPlans`, `WeeklyPlanAssignments` | WeekStart و assignment پرسنل/روز/شیفت/موقعیت |
| `MonthlyPlans`, `MonthlyPlanAssignments` | ماه و assignment روزانه |
| `ShiftRecords` | BusinessDate, PersonnelId, actual/scheduled hours, status |
| `Holidays` | BusinessDate unique, type, title |
| `LeaveRequests` | PersonnelId, from/to, type, status, approver |
| `PayrollPeriods` | year/month, status, closedAt |
| `PayrollAdjustments`, `PayrollPayments` | PersonnelId, period, type, amount, status |
| `TipGroups`, `TipParticipants` | period/date, amount, shares |
| `Violations`, `Protocols`, `ChecklistTemplates`, `ChecklistItems`, `ChecklistRuns`, `ChecklistResults` | normalized child records |

### 15.3 کاتالوگ، منو و قیمت

| جدول | ستون‌های خاص و رابطه |
|---|---|
| `Units` | Code, Name, Dimension |
| `UnitConversions` | FromUnitId, ToUnitId, Factor, ItemId nullable |
| `CatalogCategories` | ParentId nullable, Code, Name |
| `CatalogItems` | LegacyId, SepidzCode nullable unique, Code, Name, CategoryId, ItemType, PurchaseUnitId, RecipeUnitId, PackageQuantity, RecipeCapable, InventoryTracked, ProcurementEnabled, WastePercent |
| `ItemPriceHistory` | ItemId, EffectiveAt, PriceToman, SupplierId nullable, Source, RawAmount/RawCurrency |
| `MenuCategories` | Code, Name, SortOrder, IsActive |
| `MenuItems` | LegacyId, SepidzCode, Code, Name, MenuCategoryId, CurrentPriceToman, TargetCostPercent, Status |
| `MenuPriceHistory` | MenuItemId, old/new price, effectiveAt, reason, approvedBy |
| `RecipeVersions` | MenuItemId, VersionNo, EffectiveFrom, EffectiveTo nullable, Status, ApprovedBy, immutable hash |
| `RecipeLines` | RecipeVersionId, CatalogItemId, Quantity, UnitId, WastePercentSnapshot, ItemName/CodeSnapshot |

Constraints: `RecipeLines.CatalogItemId` فقط به قلم recipe-capable؛ enforce در service و trigger/check کمکی. یک نسخه Published موثر در هر تاریخ؛ overlap ممنوع.

### 15.4 تأمین و خرید

| جدول | ستون‌های خاص و رابطه |
|---|---|
| `Suppliers` | Code, Name, group, contacts, tax data, order method, settlement, status |
| `SupplierBankAccounts` | SupplierId, bank/card/account/IBAN, IsPrimary, encrypted |
| `SupplierItems` | SupplierId, CatalogItemId, SupplierItemCode, IsPrimary, priority, min order, lead time, order schedule |
| `SupplierQuotes` | SupplierItemId, QuotedAt, UnitPriceToman, ValidUntil, Source |
| `PurchaseRequests` | RequestNo, requestedBy/section, neededBy, status |
| `PurchaseRequestLines` | RequestId, ItemId, qty/unit, preferredSupplierId, status |
| `PurchaseOrders` | OrderNo, SupplierId nullable (متفرقه مجاز), OrderDate, ExpectedAt, status, owner |
| `PurchaseOrderLines` | OrderId, ItemId, qty, unit, unitPrice, tax/discount, snapshots |
| `PurchaseInvoices` | InvoiceNo, SupplierId nullable, date, totals, status |
| `PurchaseInvoiceLines` | InvoiceId, ItemId, qty/unit, price, ReceiptLineId nullable |
| `SupplierPayments` | SupplierId, InvoiceId nullable, amount, date, payment location, reference, status |

Debt = approved invoices/debits - approved payments/credits. گزارش بدهی از Ledger حساب تأمین‌کننده ساخته شود، نه عدد editable.

### 15.5 انبار

| جدول | ستون‌های خاص و رابطه |
|---|---|
| `InventoryLocations` | BranchId, Code, Name, Type, SectionId nullable |
| `InventoryTransactions` | TransactionNo, Type, BusinessDate, source/target location, reference type/id, status, postedAt, reversalOfId |
| `InventoryTransactionLines` | TransactionId, ItemId, QuantityBaseUnit, UnitCostToman, Lot/expiry nullable, snapshots |
| `GoodsReceipts` | ReceiptNo, date, LocationId, SupplierId nullable, PO/Invoice nullable, status |
| `GoodsReceiptLines` | ReceiptId, ItemId, qty/unit, unitCost, lot/expiry |
| `WasteEvents` | date, LocationId, ReasonType, ShiftId nullable, approvedBy |
| `WasteLines` | WasteEventId, ItemId, qty, unitCostSnapshot, reason, photo nullable |
| `SalesImports` | Source, period, batch hash unique, status |
| `SalesLines` | ImportId, MenuItemId, qty, price, productionLocationId, recipeVersionId |
| `Stocktakes` | CountNo, CountedAt, LocationId, status, approvedAt/by |
| `StocktakeLines` | StocktakeId, ItemId, ExpectedQtySnapshot, ActualQty, VarianceQty, UnitCostSnapshot |
| `InventoryPeriods` | From/To, status, opening/closing stocktake IDs |
| `InventoryBalances` | ItemId+LocationId unique, Quantity, AvgCost, LastTxnId; projection only |
| `ReorderPolicies` | ItemId+LocationId, ReorderPoint, TargetStock, LeadTime, preferred supplier |

Posting هر Receipt/Issue/Transfer/Waste در یک DB transaction انجام شود. Transfer دو اثر متوازن دارد. IdempotencyKey از ثبت تکراری جلوگیری کند. Balance با Ledger reconciliation روزانه کنترل شود.

### 15.6 صندوق، فروش، دارایی و سایر حوزه‌ها

| حوزه | جدول‌ها |
|---|---|
| صندوق | `Cashiers`, `CashReports`, `CashReportLines`, `CashReportReviews`, `CashReportDeletions` |
| ممیزی سپیدز | `SepidzImportBatches`, `SepidzRawBlocks`, `SepidzEvents`, `SepidzEventItems`, `SepidzChanges`, `SepidzAlerts`, `SepidzReviews`, `SepidzLinks` |
| دارایی | `Assets`, `AssetCategories`, `AssetLocations`, `AssetMaintenance`, `AssetQuantityTransactions`, `AssetIncidents`, `AssetCounts` |
| مالی | `FinancialAccounts`, `FinancialEntries`, `FinancialEntryLines`, `MonthlyOverrides`, `FiscalPeriods` |
| نظرسنجی | `SurveyResponses`, `SurveyFollowUps` |
| سیستم | `ErrorLogs`, `ImportJobs`, `ImportRows`, `FeatureFlags`, `SystemSettings`, `OutboxMessages` |

## 16. API هدف

از API whole-document به REST/Command endpoint نسخه‌دار مهاجرت شود:

```text
GET    /api/v2/catalog/items?search=&type=&active=
POST   /api/v2/catalog/items
PATCH  /api/v2/catalog/items/{id}           If-Match: rowVersion
POST   /api/v2/menu-items/{id}/recipe-versions
POST   /api/v2/inventory/receipts/{id}/post Idempotency-Key: ...
POST   /api/v2/inventory/stocktakes/{id}/approve
GET    /api/v2/inventory/balances?itemId=&locationId=
GET    /api/v2/procurement/reorder-board
POST   /api/v2/purchase-orders
POST   /api/v2/cash-reports/{id}/delete-request
POST   /api/v2/cash-reports/{id}/approve-deletion
```

قرارداد پاسخ: `data`, `errors[]`, `traceId`, pagination. خطاهای validation با field path فارسی‌پذیر. OpenAPI منبع تولید Client TypeScript باشد.

## 17. برنامه مهاجرت بدون ورود مجدد داده

### فاز صفر: تثبیت

- Freeze تغییر Schema JSON؛ Backup همه ۱۰ module با hash و timestamp.
- اجرای QA v10.12.1، شمارش رکورد و Referential Audit.
- ثبت ADR برای ۹/۱۲ تب، واحد پول، SQL Server/PostgreSQL و auth.
- اضافه کردن `schemaVersion`, `updatedAt/version` و optimistic check به API فعلی.

### فاز یک: SQL و Import Staging

- ساخت DB migration و جدول‌های mapping: `LegacyModule`, `LegacyId`, `NewTable`, `NewId`, `ImportBatchId`.
- Import هر JSON به Staging بدون تغییر؛ validation schema و گزارش duplicate/orphan.
- Normalize در transaction؛ کد سپیدز و LegacyId حفظ شود.
- Reconciliation: counts، sum amounts، recipe cost sample، stock balances، supplier debt.
- هیچ Cutover قبل از صفر شدن خطاهای بحرانی.

### فاز دو: Compatibility API

- Backend SQL بتواند موقتاً شکل JSON فعلی Load/Save را تولید/دریافت کند.
- Save قدیمی با ETag و transaction؛ parallel-write test.
- React و HTML قدیمی هم‌زمان فقط از یک DB استفاده کنند؛ dual-write مستقل ممنوع.

### فاز سه: مهاجرت React به ترتیب کم‌ریسک

1. Shell، Auth، Design System، Settings/Feature Flags؛
2. اطلاعات پایه و کاتالوگ؛
3. مدیریت منو و قیمت‌گذاری؛
4. تأمین و خرید؛
5. انبار و انبارگردانی؛
6. صندوق/فروش/سپیدز؛
7. پرسنل/حقوق؛
8. اموال، مالی، نظرسنجی و گزارش‌ها.

هر slice: parity checklist، unit/integration/E2E، UAT با داده واقعی، feature flag و rollback route.

### فاز چهار: Cutover

- Maintenance window، final backup، delta import، reconciliation و lock API قدیمی.
- فعال‌سازی React برای گروه محدود، سپس همه کاربران.
- نگهداری read-only سیستم قدیم حداقل یک دوره مالی/انبار.
- Runbook rollback: DNS/feature flag، restore point، queue replay و reconciliation.

## 18. تست و معیار پذیرش

### تست‌های اجباری

- Unit: unit conversion، weighted average، recipe effective date، payroll، debt.
- Integration: posting transaction، concurrency، rollback، authorization.
- Migration: count/hash/sum/FK/orphan/duplicate و sample golden records.
- E2E: افزودن قلم تا رسپی، خرید تا receipt، فروش تا مصرف، count تا variance، گزارش صندوق تا approval.
- Visual regression Desktop/Mobile RTL.
- Accessibility: keyboard، focus، label، contrast، screen reader.
- Security: OWASP، IDOR، rate limiting، secret scan، PII masking.
- Backup restore drill و disaster recovery.

### معیارهای عدم‌پسرفت

- کدهای ۵۳۶ قلم سپیدز بدون تغییر؛ ۷۹ قلم اضافه حفظ شود.
- ۶۱۵ قلم یکتا، ۳۷۹ آیتم منو و ۹۱۲ Recipe line مرجع با گزارش اختلاف.
- Load هر module بدون Seed write.
- حذف رکورد وابسته مسدود؛ inactive کار کند.
- جمع موجودی قلم = مجموع محل‌ها.
- شمارش Approved Baseline بعدی؛ مغایرت دوباره محاسبه نشود.
- تاریخ فروش، نسخه صحیح رسپی را انتخاب کند.
- بدهی تأمین‌کننده با Invoice/Payment reconcile شود.

QA نسخه فعلی: Syntax PASS؛ Phase 1 برابر 19/19، Menu 18/18، Phase 3 برابر 26/26 و کنترل v10.12.1 برابر 20/20.

## 19. راهنمای ادامه برای AI یا توسعه‌دهنده بعدی

1. ZIP مرجع را Extract و SHA/QA را ثبت کن.
2. `app-config.js`، سپس `config.js`، سپس HTML صفحه و آخرین Patchهای JS/CSS مربوط را بخوان.
3. قبل از تغییر، JSON زنده را Backup کن؛ Seed را داده زنده فرض نکن.
4. مشخص کن درخواست مربوط به As-Is است یا معماری React/SQL.
5. Source of truth هر مفهوم را تعیین کن؛ mirror جدید نساز.
6. هنگام افزودن فیلد، JSON contract، Backend strict DTO، migration، UI، validation، audit و test را هم‌زمان به‌روزرسانی کن.
7. شناسه، کد سپیدز، Snapshot تاریخی و version effective date را حفظ کن.
8. برای عملیات مالی/انبار Soft Delete/Reversal و approval استفاده کن.
9. فایل JS patch جدید فقط برای Hotfix اضطراری؛ توسعه اصلی در React module باشد.
10. خروجی هر نسخه: ZIP، Changelog، Backend/JSON notes، QA report، migration/rollback notes و hash.

### Prompt شروع پیشنهادی برای چت جدید

```text
سند RAYO_ADMIN_MASTER_HANDOFF_v10_12_1.md و سورس v10.12.1 را مرجع اصلی بگیر.
ابتدا بخش «اصول غیرقابل نقض»، «قرارداد JSON»، «بدهی فنی» و «برنامه مهاجرت» را بخوان.
هیچ Seed/Merge/Save خودکاری روی Load ایجاد نکن، شناسه‌ها و کدهای سپیدز را تغییر نده،
و وضعیت فعلی HTML/JSON را با طرح پیشنهادی React/SQL اشتباه نگیر.
قبل از پیاده‌سازی، اثر درخواست بر داده زنده، Backend DTO، migration، rollback و QA را اعلام کن.
```

## 20. تصمیم‌های باز که باید قبل از توسعه نهایی شوند

1. تأیید ۹ تب فعلی انبار یا بازگشت هدفمند به ۱۲ تب تاریخی.
2. SQL Server یا PostgreSQL؛ پیشنهاد فعلی SQL Server در صورت ادامه ASP.NET.
3. تعریف دقیق شعبه/سازمان و احتمال چندشعبه‌ای.
4. Canonical currency (پیشنهاد تومان) و سیاست نگهداری ریال خام.
5. سیستم مرجع فروش: سپیدز Import یا integration مستقیم.
6. مرز Accounting: آیا Invoice/Payment کامل در Rayo ثبت می‌شود یا فقط Summary.
7. سیاست Asset در برابر General Inventory بر پایه عمر مفید/ارزش/شماره‌دار بودن.
8. نقش‌ها و ماتریس permission نهایی.
9. دوره نگهداری Audit/Error/PII و سیاست Backup.
10. روش Deployment، محیط‌های dev/stage/prod و CI/CD.

## 21. نتیجه

بهترین مسیر ادامه، حفظ نسخه v10.12.1 به‌عنوان Baseline و اجرای مهاجرت Strangler به یک Modular Monolith با React/TypeScript و SQL است. کاتالوگ مشترک، دفتر immutable انبار، رسپی نسخه‌دار، خرید مستقل ولی لینک‌پذیر با Receipt، RBAC سمت Server و migration قابل reconciliation هسته معماری هدف هستند. هر تغییر کوتاه‌مدت باید از ایجاد منبع داده دوم یا Patch وابسته به ترتیب جدید جلوگیری کند.
