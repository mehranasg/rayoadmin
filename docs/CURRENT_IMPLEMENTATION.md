# پیاده‌سازی فعلی

بررسی سورس: `main` پس از commit `1c31f0f` (2026-10-05). شمارهٔ محصول v10.12.1 است؛ `BUILD` در `app-config.js` و `apiVersion` Gateway هنوز 10.10.0 هستند. این اختلاف markerها به معنی برگشت سورس به آن نسخه نیست و در این کار تغییر نکرده است.

## ۱. معماری، پوشه و وابستگی

برنامه MPA، classic script، DOM مستقیم و state سراسری است. npm/package.json، bundler، React، TypeScript، OpenAPI یا پروژهٔ Backend قابل Build در checkout وجود ندارد. ۴۱ HTML (۱۸ در ریشه، ۲۳ در `personel/`) و ۵۲ فایل در `js/` (00 تا 49 به‌علاوهٔ `app-config.js` و `config.js`؛ بدون شکاف تا 49) به‌علاوهٔ `cash-report/js/app.js` وجود دارند. ترتیب script و overrideها بخشی از قرارداد Runtime است.

| مسیر | نقش |
|---|---|
| HTMLهای ریشه | مدیریت، صندوق عمومی، ورود و پنل پرسنل |
| `personel/` | صفحات مستقل پرسنل و CSS اختصاصی |
| `js/00-base.js` تا `js/48-software-settings-hub.js` | هسته، حوزه‌ها و اصلاحات ترتیبی |
| `js/app-config.js`, `js/config.js` | تنظیم مقصد و Gateway |
| `css/` | `style.css` و patchهای 04 تا 10 |
| `cash-report/` | برنامه و CSS صندوق عمومی |
| `seed/` | ۱۰ Seed و manifest؛ فقط Initialize صریح |
| `seed/source-excel/` و `archive/` | منشأ تاریخی Seed، خارج از Runtime عادی |
| `templates/`، `docs/samples/` | قالب‌های ممیزی و fixture؛ دادهٔ زنده نیستند |
| `backend-prefrence/RayoDataController.optimized.cs` | Controller مرجع ASP.NET Web API با فایل JSON |
| `qa_*.js` | آزمون Node/VM، assertion متنی، یا اتصال به مرورگر آزمون |
| `scripts/` | ابزارهای تاریخی bump و ساخت mirror Seed؛ مسیر اجرای عادی نیستند |
| `RAYO_DATA_MODEL_v10_8_0.json` (ریشه) | فقط fixture تست‌های `qa_v10_*`؛ schema رسمی نیست |
| `temp/` | ابزار محلی/خروجی آزمون، نادیده‌گرفته‌شده توسط Git |
| `docs/index.html` | نمایشگر HTML مستندات: فایل‌های `.md` را مستقیم می‌خواند (فهرست، لینک بین اسناد، جست‌وجو)؛ از طریق HTTP: `/docs/index.html` |
| `.claude/` | ابزار محلی Claude Code؛ در `.gitignore` |

`js/18-excel-tools.js::loadXLSX` ابتدا مسیر محلی کتابخانه را امتحان می‌کند و سپس CDNهای XLSX 0.18.5؛ فایل محلی `js/xlsx.full.min.js` در checkout نیست. export می‌تواند CSV شود. فونت‌های IRANSansX از `css/fonts/woff/` درخواست می‌شوند و در Git نیستند؛ هاست (روی سرور اصلی موجودند) یا کپی محلی باید آن‌ها را فراهم کند، وگرنه 404 و fallback. این وابستگی‌ها را با نبود Build اشتباه نگیرید.

رنگ‌ها در `css/style.css` از جمله `--bg:#f4f6f8`, `--primary:#134e4a`, `--primary2:#0f766e`, `--radius:14px` تعریف شده‌اند. CSS نهایی صفحه و منوی موبایل فایل 44 بر قواعد قدیمی اثر دارند؛ توصیف قدیمی «همیشه bottom navigation» تضمین وضعیت نهایی نیست.

## ۲. راه‌اندازی و ترتیب اجرا

ورودی مدیریت `index.html` است. قرارداد startup:

- `js/16-mpa-shell.js` route اولیه را همگام انتخاب می‌کند (نمای پیش‌فرض `settings.html` = `softwareSettings`)؛ polling یا هدایت تأخیری به داشبورد راه‌حل نیست.
- `00-base.js` اولین نوشتن view را تا نصب scriptها و handlerها عقب می‌اندازد و Loading همان صفحه را نگه می‌دارد؛ view آماده‌نشده به داشبورد تبدیل نمی‌شود. render داشبورد اگر HTML یکسان باشد DOM را دوباره نمی‌سازد و Loadهای دیرهنگام با `refreshDashboardSoon` (۱۵۰ms) تجمیع می‌شوند.
- ۱۵ HTML مدیریتی 44→45→46→47 را در head با `defer` دارند (به ترتیب سند، بعد از scriptهای معمولی) و `settings.html` بعد از آن‌ها 48 را. chain پویای 43→44→45→46→47 با guard وجود script فقط fallback است.
- نصب‌کننده‌ها نباید ناوبری/بازنویسی کامل تکراری بسازند؛ ثبت دیرهنگام HR فقط route جاری را دوباره رسم می‌کند و Load پس‌زمینهٔ انبار صفحهٔ نامرتبط را رسم نمی‌کند.
- `10-rayo-stability-v7.js` پس از Load پرسنل `views.dashboard` را **جایگزین** (نه wrap) می‌کند؛ wrapperهای قبلی از بین می‌روند. هر کارت داشبورد باید بعد از آن نصب شود (32 منتظر `window.__RAYO_DASH_V7__` می‌ماند؛ 46 و 23 خودشان بعدتر نصب می‌شوند).
- پارامترهای query در آدرس script (مثل `startup-1` یا `merge_1405_07=1`) فقط کلید cache هستند، نه نسخهٔ محصول؛ با تغییر هر فایل، ارجاع آن در همهٔ HTMLها (و loader پویا) تازه شود.

بارشدن ترتیبی با ترتیب عددیِ همهٔ فایل‌ها در تمام صفحات یکی نیست (بخش ۷).

`views`, `titles`, `state` و `currentView` ممکن است binding واژگانی classic script باشند؛ وجودشان در scope به معنی `window.views` بودن نیست. patchها علاوه بر تعریف تابع، آن را wrap/replace می‌کنند. برای تغییر، همهٔ انتساب‌های symbol و handlerهای DOMContentLoaded را پیدا کنید.

دادهٔ صفحه از adapterهای حوزه به `RAYO_API_GATEWAY` می‌رسد. `StorageAdapter` مربوط HR، `SupplierStorageAdapter` فایل 04، `PricingStorageAdapter` فایل 08، `InventoryStorageAdapter` فایل 09، `CashStorage` فایل 11 و `AssetStorage` فایل 12 هستند. بقای کد Legacy localStorage/file picker به معنی منبع حقیقت داده نیست؛ مسیر عادی API-only و guard ذخیره برقرار است.

## ۳. صفحه ← مالک کد ← داده ← ارتباط

اعداد جدول به پیشوند نام فایل در `js/` اشاره دارند؛ جدول انتهای سند نام کامل فایل‌ها و scriptهای هر صفحه را ثبت می‌کند.

| صفحه/قابلیت | مالک‌ها و symbolهای مهم | داده | مسیر اصلی |
|---|---|---|---|
| داشبورد | 00 (`viewsDashboard`, `dashboardQuickAccess`, `DASH_QUICK_ACTIONS`)، 10، 23، 32 (کارت ارزش موجودی و ۵ مغایرت)، 40، 46 (کارت نوشیدنی) | همهٔ ماژول‌ها خواندنی | Load؛ اقدام سریع مودال مالک را باز می‌کند (فاکتور سریع 42، قیمت 08، اموال 12، مالی 20، نوشیدنی 46) |
| HR | 00–03، 05، 06، 16، 17، 23، 25، 41، 44؛ `init`, `payrollRowsForPeriod`, `hrForecastMonth`, `saveData` | `hr`→`personnel` | Load/Save؛ انعام Query/Mutate |
| کاتالوگ | 08، 43، 47؛ `baseView`, `pcSaveData`, `RayoCatalogV1010`, `RayoIngredientMath` | `pricing`، وابستگی suppliers/inventory | Load/Save |
| منو/رسپی/قیمت | 08، 32، 43، 45؛ `menuMetrics`, `deleteMenu` | `pricing`، فروش inventory | Load/Save |
| انبار نهایی | 09، 14، 19، 32، 35، 36، 40، 43، 46؛ `RayoInventoryV10`, `RayoInventoryV1012`, `RayoReorder` | inventory + pricing؛ HR/suppliers در مسیر مربوط | Load/Save |
| تأمین | 04، 30، 40، 42، 43، 46؛ `supplierTabs`, `savePurchaseInvoice`, `supplierAccount` | suppliers، inventory، pricing | چند سند Load/Save |
| صندوق مدیر | 11، 40، 42؛ `crQueryReports`, `crSaveAdminReport`, `confirmCashDelete` | cashreport؛ finance برای گردش | Query/Mutate و Legacy Save |
| صندوق عمومی/پرسنل | `cash-report/js/app.js`، 22 و Gateway | cashreport + HR/مراجع | مسیر قدیمی Load/Save |
| گردش وجوه | 11؛ `crLoadCustody`, `crVoidCustodyEntry` | cashreport و finance.entries | Query همه صفحات و Mutate |
| فروش | 24، 28؛ ابزار Excel فایل 18 | cashreport.salesAnalytics؛ فروش انبار جدا | Load/Save |
| ممیزی | 33؛ `RayoSepidzAudit` | sepidsaudit، pricing/inventory | Load/Save |
| مالی | 20؛ `ensure`, `save`, `calcObligation`, `saveSettlement`, `costForecastView` | finance + منابع گزارش (HR برای پیش‌بینی هزینه) | Load/Save؛ گردش وجوه از 11 |
| اموال | 12، 19، 30 | assets | Load/Save |
| نظرسنجی | 21 و 22 | survey | Load/Save |
| آموزش/چک‌لیست | 29 و 22 | HR extensions | Load/Save |
| حفظ فوکوس هنگام تایپ (سراسری) | 35 (`RayoFocusKeeper`)؛ فراخوانی در `renderView` فایل 00 و `render` فایل 22 | — | فیلد فعال قبل از بازسازی صفحه (id، `data-live-filter` یا برچسب/placeholder و ترتیب) شناسایی و پس از آن با همان مکان‌نما فوکوس می‌شود؛ هر جست‌وجو/فیلتری که با تایپ صفحه را دوباره رسم کند پیوسته تایپ می‌شود |
| کاربران مدیریت | 44 (`RayoAdminAccess`، view `adminUsers` در settings)، 00 (`loginV5`)، 16 | hr.settings.adminUsers | ورود ثابت = مالک؛ کاربر تعریف‌شده فقط بخش‌های مجاز منو را می‌بیند و صفحهٔ دیگر «دسترسی ندارید» نشان می‌دهد؛ ذخیره با `commit` (Save کامل HR با guard)؛ کنترل سمت مرورگر |
| پنل مانیتورینگ | 49 (`views.monitor`، `RayoMonitor`)؛ منابع: 20 (`RayoFinanceLedger.load/summary/monthCalc`)، 32 (`RayoInventoryV10.ensure`, `wasteEstimate`)، 40 (`RayoReorder`)، 12 (`getAssetsValuation`)، 00 (`monthMetrics`) | خواندنی: finance، cashreport، inventory، pricing، assets، hr | `index.html?view=monitor`؛ هیچ Save یا Initialize |
| مدیریت مصرف | 46 (تب `consumption`: `cmView`, `cmDetail`, `cmExport`, کارت `cmSettingsPanel`)؛ موتور 32 (`consumptionReport`, `consumptionMath`, `costInfoAtDate`, `saveConsumptionAlerts`) | inventory + pricing + cashreport (فقط‌خواندنی)؛ `inventory.settings.consumptionAlerts` | محاسبه در مرورگر روی سندهای Load‌شده؛ تنها Save = کارت هشدار با Load تازه و بازخوانی؛ دسترسی انبارداری + گزارش‌های مدیریتی ([ضمیمه](CONSUMPTION_MANAGEMENT.md)) |
| گزارش‌های انبار | 46 (تب `reports`: `repSet`, `repPreset`, `repExport`) و helperهای خواندنی 32 | inventory + pricing (+ HR برای نام افراد) | فقط خواندنی؛ CSV و Markdown برای AI |
| تنظیمات | 16، 17، 38، 39، 44، 48؛ `SoftwareSettingsHub`, `RayoBackup.downloadAll` | HR settings؛ هاب: کارت‌های ماژول مالک (pricing, inventory, suppliers, finance, cashreport, assets)؛ همه ماژول‌ها در Backup/Reset | خواندن کامل؛ ذخیره با دکمهٔ همان ماژول؛ [ضمیمه](SETTINGS_SEPARATION_AND_TABLE_RESET.md) |
| ورود اعداد (سراسری) | 35 (`RayoNumberUX`) | — | `inputmode="decimal"`/`data-money` همیشه مبلغ است و «کارتخوان»/«کارت به کارت» برخلاف «کارت» (شماره کارت) مبلغ تشخیص داده می‌شوند؛ نمایش ارقام فارسی و جداکنندهٔ سه‌رقمی؛ `value` خام انگلیسی؛ کلیک روی فیلد مبلغ آن را خالی و ترک بدون تایپ مقدار را برمی‌گرداند |
| خطا | 30 (صفحه‌های مدیریت) و 31 (پنل پرسنل/صندوقدار)؛ `RayoErrorLog.capture`؛ صف حافظهٔ 17 فقط وقتی هیچ‌کدام نصب نشده | errorlog.entries | ذخیره = Load تازه + افزودن ورودی‌های ذخیره‌نشده (بدون بازنویسی ورودی صفحه‌های دیگر) |

## ۴. قرارداد و Backend موجود

تنها تنظیم دامنه `js/app-config.js` است؛ `/api/v1.0/RayoData` و timeout 25000ms در Gateway مصرف می‌شوند. چهار action و تفاوت محل module در [مرجع داده](DATA_AND_API_REFERENCE.md) دقیق آمده است. خطای API به Seed fallback نمی‌رود؛ `applySeedMigration` no-op است و `loadOrBootstrap` فقط `loadModule` را صدا می‌زند.

Controller موجود فایل‌ها را در `/uploads/Rayo/` می‌خواند. از `JToken/JObject`، semaphore به‌ازای module، نوشتن جایگزین فایل، metadata نسخه و حافظهٔ ۲۰۰ requestId اخیر استفاده می‌کند. **این SQL نیست.** namespaceها و helperهای پروژهٔ میزبان خارج از مخزن‌اند؛ CORS واقعی، authentication middleware، پیکربندی route، deployment و ذخیره‌سازی پایدار محیط `Unverified` هستند. نبود `[Authorize]` در این Controller شاهد نبود کنترل داخلی این فایل است، نه اثبات همهٔ تنظیمات سرور مستقر.

احراز هویت مدیر در `00-base.js::loginV5` با جدول static Client و `rayo_admin_user` انجام می‌شود؛ مقدار credential در مستندات تکرار نشده است. پرسنل در `22-staff-panel.js::login` رکورد فعال، `userAccess.enabled` و `userPassword` را مقایسه و `rayo_staff_session` می‌سازد. Gateway با `credentials:'omit'` کار می‌کند و token مجوز API ارسال نمی‌کند. `serverSaveToken` نشانهٔ تأیید ذخیره است، **توکن احراز هویت نیست**.

## ۵. محدودیت‌ها و بدهی‌های قابل ردیابی

| شناسه | شاهد و نتیجه | اولویت |
|---|---|---|
| CUR-01 | `saveModule` سند کامل می‌فرستد ولی expectedVersion را برای Save ارسال نمی‌کند؛ گزینهٔ نسخه در Controller کافی نیست | P0 پیش از چندکاربر |
| CUR-02 | `queryCollection` وضعیت را ready می‌کند ولی completeness سند را تضمین نمی‌کند؛ نتایج صفحه‌ای نباید به Save کامل راه یابند | P0 |
| CUR-03 | فایل 42 در `install`، `crDeleteReport=requestCashDelete` و `confirmCashDelete` گزارش را از آرایه حذف و کل cashreport را Save می‌کند؛ خطر حذف سابقه و snapshot ناقص | P0؛ UI نهایی هم باید در Stage بررسی شود |
| CUR-04 | فایل 20، `deleteEntry` برای رکورد غیرcustody حذف فیزیکی دارد؛ قاعدهٔ پروژه هنوز در همهٔ Legacyها enforce نیست | P0 |
| CUR-05 | ورود/permission سمت مرورگر؛ Backend auth/RBAC قابل تأیید نیست | P0 پیش از عرضه عمومی |
| CUR-06 | metadata و فایل داده دو نوشتن جدا، قفل داخل process و عدم transaction چندماژولی | P1؛ crash/multi-instance و Lost Update نیاز آزمون |
| CUR-07 | `normalizeModule` unknown fields را حفظ می‌کند اما آرایهٔ شناخته‌شده با نوع نامعتبر می‌تواند به [] بدل شود؛ validation رسمی کامل نیست | P1 |
| CUR-08 | `pcEnsureLoaded`/`ivEnsureLoaded` در خطا state خالی UI می‌سازند؛ guard مانع Save است ولی همهٔ نمایش‌های Empty/Error یکسان نیستند | P1 |
| CUR-09 | `31-error-log-client` URL، stack و context را ثبت می‌کند؛ scrub جامع در آن یافت نشد، Save لاگ استثنای Load guard دارد | P1 |
| CUR-10 | تاریخ/واحد/ارز چند شکل دارند؛ نسخهٔ قدیمی رسپی فاقد افت و قیمت فاقد بسته برآورد تاریخی را محدود می‌کند | P1 |
| CUR-11 | کاتالوگ مرکزی جاری است ولی mirror و فیلترهای نوع/flag Legacy باقی‌اند | P2 |
| CUR-12 | patchهای ترتیبی و build markerهای متفاوت، CDN/فونت بیرونی و نبود schema رسمی | P2 |
| CUR-13 | ماژول `sepidsaudit` روی سرور ساخته نشده است (Load → 404)؛ صفحهٔ ممیزی پیام خطا و راه «بارگذاری اولیه» را نشان می‌دهد. (حلقهٔ بارگذاری مجدد صفحه — `goView` در `init` فایل 33 — رفع شد) | P2؛ Initialize صریح مدیر |
| CUR-15 | تب موجودی انبار با ~۵۰۰ قلم حدود ۴۰–۵۰ ثانیه تا آماده‌شدن زمان می‌برد | P2 |

قانون «Load عادی هیچ Seed/Save عملیاتی ندارد» با تست‌های ساختگی پاس است؛ این ادعا را به «هیچ POST حتی در وقوع خطای Client» تعمیم ندهید، چون errorlog می‌تواند خودکار نوشته شود. قوانین ایمنی مطلوب با پیاده‌سازی ناقص بالا اشتباه نشوند. هیچ‌یک از این بدهی‌ها در پالایش مستندات با تغییر Runtime پنهان نشده‌اند.

## ۶. اجرا، آزمون و انتشار

برای برنامه static مرحلهٔ Build وجود ندارد. یک HTTP server روی loopback در ریشه لازم است؛ `file://` برای fetch/route/امنیت مبنای قابل اتکا نیست. با Python نصب‌شده `py -m http.server 8765 --bind 127.0.0.1`؛ در این محیط اجرای `python.exe` در دسترس نبود و آزمون HTTP با Node محلی انجام شد. تنظیم API را فقط در کپی/fixture آزمون به دادهٔ ساختگی متصل کنید. از مقدار production در app-config برای آزمون write استفاده نشود.

کنترل پایه:

```powershell
Get-ChildItem js -Filter *.js | ForEach-Object { node --check $_.FullName }
node --check cash-report/js/app.js
node qa_gateway.js
node qa_page_startup.js
node qa_settings_reset.js
node qa_v10_12_1.js
```

| حوزه | QA مرتبط |
|---|---|
| افت/منو/قیمت | `qa_standard_preparation_loss.js`, `qa_prepared_items_conversion.js`, `qa_counting_units.js`, `qa_v10_12_1.js` |
| انبار | `qa_unified_inventory.js`, `qa_single_warehouse_mode.js`, `qa_inventory_control_levels.js`, `qa_inventory_stock_sort_filter.js`, `qa_inventory_entry_issue.js`, `qa_inventory_waste_form.js`, `qa_inventory_bulk_count.js`, `qa_inventory_count_edit.js`, `qa_inventory_receipt_ui.js`, `qa_reorder_point.js`, `qa_operational_forecast.js`, `qa_beverage_serving_control.js`, `qa_consumption_management.js` |
| صندوق | `qa_cash_variance.js`, `qa_cash_destinations.js`, `qa_cash_reports_query.js`, `qa_cash_custody.js` |
| پرسنل/انعام/آموزش | `qa_personnel_counts.js`, `qa_personnel_payroll_forecast.js`, `qa_personnel_salary_account.js`, `qa_tips_query.js`, `qa_tip_form_filters.js`, `qa_tip_monthly_settlement.js`, `qa_checklist_csv_import.js`, `qa_attendance_corrections.js` |
| تأمین/مالی | `qa_supplier_workflows.js`, `qa_supplier_quick_invoice.js`, `qa_supplier_navigation_payment.js`, `qa_supplier_relation_search.js`, `qa_supplier_modal_order_method.js`, `qa_supplier_parties_debts.js`, `qa_finance_obligations.js`, `qa_finance_accrual_tax.js`, `qa_opening_settlement.js` |
| UI/ناوبری | `qa_management_tabs.js`, `qa_page_startup.js`, `qa_numeric_input.js`, `qa_shift_menu.js`, `qa_sales_audit_navigation.js`, `qa_ui_lists_assets.js` |

وضعیت شناخته‌شدهٔ suite در 2026-10-06: از ۵۷ فایل `qa_*.js`، ۴۸ پاس و ۹ شکست دارند. QAهای نسخه‌ای `qa_v10_*` پاس‌اند؛ بررسی‌هایی که رفتارِ عمداً حذف/تغییرکرده را انتظار داشتند در فهرست `SUPERSEDED` همان فایل با دلیل و QA جایگزین «SKIP» چاپ می‌شوند و بقیهٔ بررسی‌ها فعال‌اند. شکست‌های باقی‌مانده از کد جاری ناشی نمی‌شوند: `qa_opening_settlement` (بخش انبار انتظار دارد فاکتور خرید موجودی را بالا ببرد، خلاف قاعدهٔ جاری)؛ `qa_protocol_bulk_import` (قابلیت ورود گروهی پروتکل در کد جاری نیست)؛ `qa_personnel_salary_account` («محاسبه زنده حقوق ثابت از ساعت مستقل است»)؛ `qa_supplier_parties_debts`؛ چهار QA مرورگری (پایین). `qa_remote_supplier_deploy` به در دسترس بودن هاست واقعی وابسته است. FAIL را PASS گزارش نکنید و assertion را برای سبزشدن تغییر ندهید مگر رفتار مطلوب تغییر کرده باشد.

چهار QA مرورگری (`qa_base_data_search_input`, `qa_menu_recipe_ui`, `qa_supplier_company_input`, `qa_supplier_ui_runtime`) به fixture و CDP محلی با پورت‌های hardcoded نیاز دارند. آن‌ها را روی تب نامشخص یا production اجرا نکنید. `qa_remote_supplier_deploy.js` منابع هاست واقعی را می‌خواند و بخشی از QA آفلاین نیست. وجود آن اثبات انتشار آخرین commit نیست.

آزمون مرورگر خودکار (2026-10-05): Edge headless با CDP، ۷۸ صفحه/تب مدیریت روی دادهٔ زنده فقط‌خواندنی (بدون هیچ درخواست `/Save`؛ `Query` خواندنی است)، بدون خطای JS؛ و تعامل داشبورد/موجودی/ورود اعداد/تنظیمات. برای تکرار، هر درخواست `/Save` باید خطا شمرده و `confirm` با «انصراف» بسته شود.

تست دستی پذیرش: روی دادهٔ ساختگی، ورود مدیریت و پرسنل، بارگذاری مستقیم هر route و Back/Forward، انتظار صحیح Loading/Error، تایپ فارسی/اعشاری بدون افت focus، جدول ۵۰۰ ردیفی، RTL موبایل/دسکتاپ، بازخوانی پس از Save، conflict و retry، و Network بدون Seed/Save هنگام Load عادی. نبود مرورگر، این بخش را `Unverified` باقی می‌گذارد.

انتشار آینده: Backup مجاز دادهٔ محیط، پیش‌نمایش روی Stage، سرو فایل‌ها با همان مسیر نسبی و cache keys معتبر، کنترل CORS و چهار action، smoke test و rollback commit. بدون بررسی ترافیک/دادهٔ بعد از انتشار، Backup قدیمی روی دادهٔ جدید restore نشود. این کار فقط مستندات است و انتشار ندارد.

## ۷. فهرست دقیق scriptها و ترتیب صفحات

فهرست زیر از HTMLهای جاری استخراج شده است (2026-10-05). `C` یعنی `app-config.js → config.js`؛ شماره‌ها نام فایل در جدول بعد هستند. `D` یعنی چهار فایل 44→45→46→47 به‌صورت defer در head که بعد از scriptهای معمول اجرا می‌شوند؛ `settings.html` پس از آن‌ها 48 را نیز defer دارد. queryهای cache در این خلاصه حذف شده‌اند؛ هنگام تغییر، مقدار واقعی HTML نیز بررسی شود.

| صفحه | ترتیب اجرا (script معمولی سپس defer) |
|---|---|
| [assets.html](../assets.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| [base-data.html](../base-data.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 32 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| [cash-report-admin.html](../cash-report-admin.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| [cash-report.html](../cash-report.html) | C → cash-report/js/app.js → 13 → 31 → 35 → 37 |
| [finance.html](../finance.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| [index.html](../index.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 23 → 25 → 26 → 30 → 32 → 33 → 34 → 35 → 37 → 40 → 42 → 43 → D → 49 |
| [inventory.html](../inventory.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 32 → 34 → 35 → 36 → 37 → 40 → 42 → 43 → D |
| [menu-management.html](../menu-management.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 32 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| [personnel.html](../personnel.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 23 → 25 → 26 → 29 → 30 → 32 → 34 → 35 → 37 → 38 → 39 → 40 → 41 → 42 → 43 → D |
| [pricing.html](../pricing.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 32 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| [reports.html](../reports.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 24 → 25 → 26 → 30 → 32 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| [sales-analysis.html](../sales-analysis.html) | C → 18 → 28 → 31 → 35 → 37 → 40 → 42 → 43 → D |
| [sepids-audit.html](../sepids-audit.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 32 → 33 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| [settings.html](../settings.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 23 → 25 → 26 → 29 → 30 → 34 → 35 → 37 → 38 → 39 → 40 → 41 → 42 → 43 → D → 48 |
| [staff-login.html](../staff-login.html) | C → 13 → 22 → 26 → 31 → 35 → 37 |
| [staff-panel.html](../staff-panel.html) | C → 13 → 18 → 22 → 26 → 31 → 35 → 37 |
| [suppliers.html](../suppliers.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 32 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| [survey.html](../survey.html) | C → 00 → 01 → 02 → 03 → 04 → 05 → 06 → 07 → 08 → 09 → 10 → 11 → 12 → 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 25 → 26 → 30 → 34 → 35 → 37 → 40 → 42 → 43 → D |
| صفحات personel (22 صفحه: advance، asset-incidents، beverage-control، cash-report، checklists، history، index، inventory-count، inventory-events، inventory-transfer، leave، my-shifts، my-tips، payments، purchase-invoice، purchase-request، reservations، shifts، suppliers، survey، tips، training) | C → 13 → 18 → 22 → 26 → 31 → 35 → 37 |
| [personel/login.html](../personel/login.html) | C → 13 → 22 → 26 → 31 → 35 → 37 |

| شماره/نام | فایل واقعی |
|---|---|
| 00 | [js/00-base.js](../js/00-base.js) |
| 01 | [js/01-v6-overrides.js](../js/01-v6-overrides.js) |
| 02 | [js/02-rayo-v6-2-patch.js](../js/02-rayo-v6-2-patch.js) |
| 03 | [js/03-rayo-v6-3-patch.js](../js/03-rayo-v6-3-patch.js) |
| 04 | [js/04-rayo-suppliers-admin-module.js](../js/04-rayo-suppliers-admin-module.js) |
| 05 | [js/05-rayo-v6-4-personnel-bank-patch.js](../js/05-rayo-v6-4-personnel-bank-patch.js) |
| 06 | [js/06-rayo-v6-4-1-personnel-bank-visibility-patch.js](../js/06-rayo-v6-4-1-personnel-bank-visibility-patch.js) |
| 07 | [js/07-rayo-v6-4-2-bank-guarantee.js](../js/07-rayo-v6-4-2-bank-guarantee.js) |
| 08 | [js/08-rayo-pricing-admin-module.js](../js/08-rayo-pricing-admin-module.js) |
| 09 | [js/09-rayo-inventory-variance-module.js](../js/09-rayo-inventory-variance-module.js) |
| 10 | [js/10-rayo-stability-v7.js](../js/10-rayo-stability-v7.js) |
| 11 | [js/11-rayo-cash-report-module.js](../js/11-rayo-cash-report-module.js) |
| 12 | [js/12-rayo-assets-module.js](../js/12-rayo-assets-module.js) |
| 13 | [js/13-jalali-picker.js](../js/13-jalali-picker.js) |
| 14 | [js/14-ops-integration.js](../js/14-ops-integration.js) |
| 15 | [js/15-management-reports.js](../js/15-management-reports.js) |
| 16 | [js/16-mpa-shell.js](../js/16-mpa-shell.js) |
| 17 | [js/17-v9-3-admin-enhancements.js](../js/17-v9-3-admin-enhancements.js) |
| 18 | [js/18-excel-tools.js](../js/18-excel-tools.js) |
| 19 | [js/19-phase2-admin.js](../js/19-phase2-admin.js) |
| 20 | [js/20-finance-module.js](../js/20-finance-module.js) |
| 21 | [js/21-survey-module.js](../js/21-survey-module.js) |
| 22 | [js/22-staff-panel.js](../js/22-staff-panel.js) |
| 23 | [js/23-personnel-management-v9-5-3.js](../js/23-personnel-management-v9-5-3.js) |
| 24 | [js/24-sales-analytics-v9-5-4.js](../js/24-sales-analytics-v9-5-4.js) |
| 25 | [js/25-user-management-v9-5-5.js](../js/25-user-management-v9-5-5.js) |
| 26 | [js/26-access-brand-v9-5-8.js](../js/26-access-brand-v9-5-8.js) |
| 27 | [js/27-context-help-v9-6-0.js](../js/27-context-help-v9-6-0.js) |
| 28 | [js/28-sales-analysis-page-v9-6-1.js](../js/28-sales-analysis-page-v9-6-1.js) |
| 29 | [js/29-training-checklists-v9-7-0.js](../js/29-training-checklists-v9-7-0.js) |
| 30 | [js/30-operational-polish-v9-8-0.js](../js/30-operational-polish-v9-8-0.js) |
| 31 | [js/31-error-log-client-v9-8-0.js](../js/31-error-log-client-v9-8-0.js) |
| 32 | [js/32-inventory-cost-control-v10.js](../js/32-inventory-cost-control-v10.js) |
| 33 | [js/33-sepids-audit-v10.js](../js/33-sepids-audit-v10.js) |
| 34 | [js/34-final-operational-review-v10-1.js](../js/34-final-operational-review-v10-1.js) |
| 35 | [js/35-operational-closeout-v10-2.js](../js/35-operational-closeout-v10-2.js) |
| 36 | [js/36-final-inventory-consolidation-v10-3.js](../js/36-final-inventory-consolidation-v10-3.js) |
| 37 | [js/37-requested-fixes-v10-4.js](../js/37-requested-fixes-v10-4.js) |
| 38 | [js/38-data-safety-backup-v10-7.js](../js/38-data-safety-backup-v10-7.js) |
| 39 | [js/39-manual-initial-data-v10-8.js](../js/39-manual-initial-data-v10-8.js) |
| 40 | [js/40-rayo-v10-9-comprehensive.js](../js/40-rayo-v10-9-comprehensive.js) |
| 41 | [js/41-staffing-needs-v10-9-1.js](../js/41-staffing-needs-v10-9-1.js) |
| 42 | [js/42-operations-v10-9-2.js](../js/42-operations-v10-9-2.js) |
| 43 | [js/43-central-catalog-v10-10.js](../js/43-central-catalog-v10-10.js) |
| 44 | [js/44-phase1-polish-v10-10-1.js](../js/44-phase1-polish-v10-10-1.js) |
| 45 | [js/45-menu-management-v10-11.js](../js/45-menu-management-v10-11.js) |
| 46 | [js/46-inventory-operations-v10-12.js](../js/46-inventory-operations-v10-12.js) |
| 47 | [js/47-base-data-v10-12-1.js](../js/47-base-data-v10-12-1.js) |
| 48 | [js/48-software-settings-hub.js](../js/48-software-settings-hub.js) |
| 49 | [js/49-management-monitor.js](../js/49-management-monitor.js) |
| ap | [js/app-config.js](../js/app-config.js) |
| co | [js/config.js](../js/config.js) |
