# ماتریس وضعیت قابلیت‌ها

سورس مبنا: `main` پس از `1c31f0f` (2026-10-05)؛ محصول v10.12.1. `Implemented`: کد قابل استفاده موجود؛ `Partial`: پیاده‌سازی محدود/ناسازگار؛ `Planned`: هدف آینده؛ `Deprecated`: مبنای توسعه نباشد؛ `Unverified`: شواهد کافی نداریم. اطمینان «زیاد» یعنی کد و QA محلی مرتبط، «متوسط» یعنی شاهد سورس با پوشش آزمون محدود. هیچ ردیف به‌تنهایی اثبات استقرار/دادهٔ زنده نیست. اعداد فایل به فهرست کامل [مرجع فنی](CURRENT_IMPLEMENTATION.md) اشاره دارند.

| ماژول | قابلیت | صفحه/فایل یا QA شاهد | منبع داده | وضعیت | اطمینان | محدودیت | اقدام بعدی |
|---|---|---|---|---|---|---|---|
| هسته | startup و route مستقیم | 00، 16، 44؛ qa_page_startup | state صفحه | Implemented | زیاد | QA بصری انجام نشده | تست دستی RTL |
| هسته | Load بدون Seed/Save عملیاتی | config؛ qa_gateway، qa_settings_reset | ۱۰ API module | Implemented | زیاد | errorlog استثناست | حفظ regression |
| هسته | Save با GET تأییدی | config::saveModule؛ qa_v10_10_0 | سند کامل | Implemented | زیاد | token همه فیلدها را اثبات نمی‌کند | مقایسهٔ معنایی |
| هسته | Query/Mutate و conflict | config؛ qa_gateway | collection | Implemented | زیاد | نصب Controller واقعی نامعلوم | contract test Stage |
| هسته | جلوگیری جامع از partial Save | config، 11، 42 | Query/Load | Partial | زیاد | flag کامل‌بودن عمومی وجود ندارد | CUR-02/03 |
| Backend | Controller فایل JSON | backend-prefrence/RayoDataController.optimized.cs | فایل و metadata | Implemented | متوسط | پروژهٔ میزبان در مخزن نیست | build/deploy در محیط اصلی |
| Backend | auth و RBAC مستقر | Controller، config | هویت سروری | Unverified | کم | middleware/host در دسترس نیست | بررسی محیط و طراحی مجوز |
| Backend | transaction و idempotency پایدار | Controller | فایل JSON | Partial | زیاد | process lock، دو فایل، ۲۰۰ requestId | DB transaction |
| مدیریت | ورود مدیر | 00::loginV5 | static Client/session | Partial | زیاد | credential و مجوز سروری نیست | auth Server |
| پرسنل | ورود و permission | 22، 25، 26 | personnel.userAccess | Partial | زیاد | کنترل Client | enforce API |
| تنظیمات | صفحه مستقل و مسیرهای قدیمی؛ منوی «تنظیمات» → تنظیمات نرم‌افزار | settings.html، 16، 44؛ qa_management_tabs | HR.settings | Implemented | زیاد | منبع داده مستقل نیست | حفظ Back/Forward |
| تنظیمات | هاب «تنظیمات نرم‌افزار» (۸ بخش، کارت‌های ماژول مالک) | 48، 04، 11، 12، 19، 20، 37، 44، 45، 46؛ تست مرورگری 2026-10-05 | ماژول مالک هر بخش | Implemented | متوسط | QA مستقل ندارد؛ تب تنظیمات قیمت‌گذاری، تأمین، مالی و اموال به بخش هاب می‌رود | QA هاب |
| تنظیمات | مخفی‌کردن امکانات | 44::saveFeatures | HR.settings.featureVisibility | Implemented | متوسط | فقط visibility | با RBAC اشتباه نشود |
| تنظیمات | Backup کامل | 38::downloadAll | ۱۰ Load | Implemented | زیاد | consistency لحظه‌ای چندماژولی ندارد | snapshot سروری آینده |
| تنظیمات | Initialize صریح خالی/404 | 39؛ qa_settings_reset | Seed → module | Implemented | زیاد | 500 مجوز نیست | حفظ gate |
| تنظیمات | Reset همه جداول و Restore | 39؛ qa_settings_reset | همه ماژول‌ها | Implemented | زیاد | rollback جبرانی، محیط مستقل لازم | تست restore Stage |
| تنظیمات | Reset از Seed/Bootstrap خودکار | config، 39 | Legacy | Deprecated | زیاد | اسناد قدیمی دستور ناسازگار دارند | اجرا نشود |
| کاتالوگ | master واحد، نوع/گروه مستقل | base-data.html، 43، 47؛ qa_v10_12_1 | pricing.ingredients | Implemented | زیاد | فیلترهای Legacy ناهمگن | audit flags |
| کاتالوگ | mirror به‌عنوان master | 43 | suppliers.items | Deprecated | زیاد | برای سازگاری هنوز نگه داشته می‌شود | حذف فقط با migration |
| کاتالوگ | نقطه سفارش/صفر واقعی | RayoReorder؛ qa_reorder_point | ingredient + tracked fallback | Implemented | زیاد | واحد و مقدار نامعلوم جدا | حفظ golden tests |
| کاتالوگ | migration دستی روابط | 43::previewMigration/applyMigration | pricing + suppliers | Implemented | متوسط | روی دادهٔ زنده انجام شده؛ دو Save جبرانی | فقط برای دادهٔ قدیمی جدید |
| منو | آیتم/دسته/رسپی/نسخه | menu-management.html، 45 | pricing | Implemented | زیاد | E2E مرورگر موجود نیست | parity UI |
| منو | غیرفعال‌سازی دارای سابقه | 45::deleteMenu | menu/sales/versions | Implemented | متوسط | سایر حذف‌های Legacy یکسان نیستند | تست وابستگی‌ها |
| قیمت | افت و تبدیل واحد/بهای خالص | 08، 32؛ qa_standard_preparation_loss | ingredient/recipe/history | Implemented | زیاد | snapshot قدیمی ناقص | برآورد را برچسب بزنید |
| قیمت | هزینهٔ قطعی تاریخی همه منوها | 08، 32 | نسخه/closure | Partial | زیاد | تاریخچهٔ ثبت‌نشده قابل بازیابی نیست | عدم backfill حدسی |
| قیمت | پیشنهاد/تاریخچه؛ تب تنظیمات → هاب | pricing.html، 08، 45 | pricing | Implemented | متوسط | استثناهای اقلام شرکتی | نمونهٔ پذیرش |
| قیمت | نمایش بهای رسپی با پرت واقعی ماه | 08::pcRecipeWasteAdjustedCost | pricing + inventory.periodMetrics | Implemented | متوسط | فقط نمایشی؛ QA مستقل ندارد | — |
| تأمین | مشخصات و روابط چندانتخاب | 04، 30، 43؛ qa_supplier_relation_search | suppliers + catalog | Implemented | زیاد | داده بانکی حساس | UI Stage |
| تأمین | قیمت دستی مرتبط/مقایسه | 42::saveManualPrice | pricing + supplierItems | Implemented | متوسط | چند سند و واحد قیمت | آزمون قطع Save |
| تأمین | سفارش/فاکتور چندخطی | 42، 22 | purchaseRequests/invoices | Implemented | متوسط | — | UAT مسیر واقعی |
| تأمین | فاکتور سریع بدون اقلام + پرداخت در یک Save؛ دکمهٔ داشبورد | 42، 00؛ qa_supplier_quick_invoice | purchaseInvoices.hasLineDetails + supplierPayments | Implemented | زیاد | ویرایش پرداخت بعد از ثبت از تب پرداخت‌ها | — |
| تأمین | میز سفارش‌گذاری و سفارش‌های ثبت‌شده در نوار تب | 42، 46::supplierTabs | purchaseRequests | Implemented | زیاد | `qa_v10_12_0` هنوز حذف این تب‌ها را انتظار دارد | — |
| تأمین | بدهی و مانده اولیه | 42؛ qa_supplier_parties_debts | invoices/payments/directDebts | Implemented | زیاد | دفتر رسمی حسابداری نیست | reconcile نمونه |
| انبار | تک‌انبار اجباری، ۱۰ تب (کنترل روزانه نوشیدنی، مدیریت مصرف و گزارش‌ها تب جدا)، فرم پرتی با سکشن/اموال/جریمه (qa_inventory_waste_form)، موجودی کل و چاپ؛ ورود چندسطری؛ مغایرت ثبت‌شده | inventory.html، 32، 46؛ qa_single_warehouse_mode، qa_unified_inventory | ledger/counts/pricing | Implemented | زیاد | تب موجودی ~۴۵ ثانیه (CUR-15) | — |
| انبار | جدول موجودی: مرتب‌سازی سه‌حالته، فیلتر گروه و وضعیت موجودی، «گردش» | 46؛ qa_inventory_stock_sort_filter | محاسبه در حافظه | Implemented | زیاد | — | — |
| انبار | سطح کنترل (سبک/دقیق/کنارگذاشته)، شمارش هفتگی مصرفی‌ها، صفرگذاری با بازگردانی، بازنشانی شمارش‌ها با Backup | 32، 46؛ qa_inventory_control_levels | settings.itemControlLevels، spotCounts، stocktakes | Implemented | متوسط | صفرگذاری/بازنشانی/شمارش هفتگی QA اختصاصی ندارند | QA این سه |
| انبار | Ledger زمانی قلم با مانده جاری و اقدام سریع | 32::unifiedLedgerRows/drill | ledger + sales | Implemented | زیاد | — | — |
| داشبورد | کارت ارزش ریالی موجودی و ۵ کالای با بیشترین مغایرت | 32::installDashboardCard | inventory | Implemented | متوسط | کارت پس از Load انبار (~۶۰ ثانیه) ظاهر می‌شود | — |
| انبار | ورود مستقیم چندسطری بدون قیمت؛ ویرایش با ابطال و ثبت دوباره | 46؛ qa_inventory_receipt_ui | stockReceipts + movement | Implemented | زیاد | ویرایش QA اختصاصی ندارد | — |
| انبار | انتقال داخلی | 32، 46؛ qa_single_warehouse_mode | inventoryMovements | Deprecated | زیاد | در تک‌انبار رد می‌شود؛ رکوردهای قدیمی حفظ؛ منوی پرسنل گزینهٔ انتقال ندارد و صفحهٔ آن فقط پیام نشان می‌دهد | — |
| انبار | شمارش کل/افتتاحیه، بررسی و بازمحاسبهٔ مغایرت | 32؛ qa_inventory_count_edit، qa_unified_inventory | stocktakes | Implemented | زیاد | فرم شمارش گروهی (bulk) در تک‌انبار نمایش داده نمی‌شود | — |
| کاتالوگ/انبار | اقلام آماده‌سازی‌شده، ترکیب مواد، چگالی و تبدیل در شمارش گروهی و شمارش کل رایو | 08، 32، 46، 47؛ qa_prepared_items_conversion، qa_unified_inventory | pricing.preparedItems + stocktakes.preparedLines | Implemented (Frontend) | زیاد | ماندگاری preparedLines شمارش کل روی Backend زنده آزموده نشده | آزمون Save/Load روی سرور |
| انبار | برگهٔ شمارش دستی (چاپ / اکسل) بر اساس بخش، گروه و محل نگهداری | 32؛ qa_unified_inventory | inventory.settings.countSheet | Implemented (Frontend) | کم | چیدمان در سطح گروه کالاست، نه تک‌قلم | — |
| انبار | واحدهای شمارش هر قلم و ورود چندواحدی (شمارش کل/دوره‌ای/گروهی، ورود مستقیم، پرتی/مصرف) | 08، 32، 46؛ qa_counting_units | ingredients.countingUnits + unitEntryDetail | Implemented (Frontend) | زیاد | پنل پرسنل (22) هنوز فقط واحد پایه؛ ماندگاری روی Backend زنده آزموده نشده | آزمون Save/Load روی سرور |
| انبار | ابطال/آرشیو رسید | 46؛ qa_inventory_receipt_ui | receipt/movement | Implemented | زیاد | نشست مدیر Client | server authorization |
| انبار | فروش/اسنپ و مصرف رسپی | 14، 32، 36 | salesPeriods/recipeVersions | Implemented | متوسط | کامل‌بودن ورودی کانال‌ها نامعلوم | تطبیق واردسازی |
| انبار | کنترل روزانه فروش نوشابه (جدول دسکتاپ، فرم موبایل یک‌نوشیدنی در هر نوبت در مودال داشبورد و پنل پرسنل، مغایرت روز و شبانه، انتخاب شمارندهٔ صبح/شمارندهٔ شب/انباردار، فروش آخرین ورودی و علت‌ها در ردیف جدا، فهرست عمودی نوشیدنی‌ها با وضعیت، فرم A5، گزارش مغایرت روز/شب جدا و تجمیعی، نمودار دو خطی و خلاصهٔ ماهانه) | config (`RayoBeverageControl`)، 46، 22، 25؛ qa_beverage_serving_control | inventory.beverageDailyControls | Implemented | متوسط | فروش روز دستی وارد می‌شود؛ به Ledger موجودی وصل نیست؛ هویت پرسنل سمت مرورگر (CUR-05) | UAT موبایل و مرورگر |
| اموال | شمارش هفتگی گروهی اقلام سرو، ثبت سریع شکستگی، گزارش هفتگی، فرم A5، ابطال به‌جای حذف | 12؛ qa_beverage_serving_control | assets.counts/quantityTransactions | Implemented | متوسط | حذف سابقه تعمیر هنوز فیزیکی است | visual check |
| انبار | waste/consumption و review | 32، 34، 22 | waste/consumption/declarations | Implemented | متوسط | مدرک فایل/approval چندمرحله‌ای ندارد | UAT پایان شیفت |
| انبار | cost/variance/closure | 32، 46 | ledger + periodClosures | Implemented | زیاد | coverage شمارش شرط اعتبار | نمایش completeness |
| انبار | مدیریت مصرف: مصرف واقعی/تئوریک، پرتی و مغایرت جدا، اثر بر فروش و تخصیص به آیتم منو، کیفیت داده، هشدار قابل تنظیم ([ضمیمه](CONSUMPTION_MANAGEMENT.md)) | 32::consumptionReport، 46؛ qa_consumption_management | ledger + counts + salesPeriods + cashreport؛ inventory.settings.consumptionAlerts | Implemented (Frontend) | زیاد | محاسبه در مرورگر، بدون تجمیع Backend؛ تخفیف/برگشت فروش در داده نیست؛ آزمون فقط با دادهٔ ساختگی | UAT روی دادهٔ واقعی |
| انبار | forecast زمانی/فروش‌محور | 46؛ qa_operational_forecast | operationalConsumptionProfiles | Partial | زیاد | invoice count/۳ دوره ندارد؛ missing→unknown | دادهٔ پوشش معتبر |
| انبار | ۱۲ تب تاریخی | هسته 32 در برابر UI 46 | Legacy | Deprecated | زیاد | الگوی تاریخی تست‌ها | ۸ تب جاری حفظ شود |
| HR | پرونده/فیلتر/پروفایل/گزارش (کارت «تعداد پرسنل فعال»، ۵۰ ردیف در صفحه؛ پروفایل و گزارش پرسنلی تا انتخاب پرسنل داده‌ای نشان نمی‌دهند؛ پروفایل دو تب «ماه جاری / انتخابی» و «خلاصه بازه‌ای» بدون ثبت تخلف؛ ثبت/ویرایش تخلف فقط با تاریخ ماه جاری؛ گزارش شیفت فیلتر وضعیت پرسنل با پیش‌فرض «فعال»؛ نام پرسنل بدون کد (`personDisplayName`؛ کد فقط برای هم‌نام‌ها)؛ فیلد «وضعیت همکاری» قبل از انتخاب پرسنل در کارت فیلتر پروفایل، گزارش، انعام (پیش‌فرض همه)، جریمه، تأخیر، پرداخت، مصرف و مرخصی (44::personnelScopeField؛ کنترل قدیمی 35 روی صفحه نصب نمی‌شود)؛ مدیریت دسترسی‌ها پیش‌فرض «فعال») | 00، 17، 23، 25، 34، 44؛ qa_personnel_counts | personnel و سوابق | Implemented | زیاد | برخی فیلدها Legacy | نمونهٔ پذیرش |
| HR | بانک/قرارداد ثابت و ساعتی | 05–07، 23؛ qa_personnel_salary_account | personnel | Implemented | زیاد | صحت حقوق قانونی ادعا نمی‌شود | golden payroll |
| HR | وسایل تحویلی (بدون پاک‌شدن در ذخیرهٔ پرونده؛ برگشت در خطا) | 06، 44::saveIssuedEquipment | personnel.accommodation.equipment | Implemented | متوسط | QA اختصاصی ندارد | — |
| HR | ویزارد ثبت پرسنل جدید، پیش‌بینی هزینهٔ حقوق از قرارداد (`hrForecastMonth`) | 05، 01، 00، 17؛ qa_personnel_payroll_forecast | personnel.salaryContract | Implemented | متوسط | — | — |
| شیفت | هفته/ماه/تقویم/نیاز/ظرفیت | 00–03، 41، 44؛ qa_shift_menu | plans/records/requirements | Implemented | زیاد | پوشش همه محاسبات در QA محدود | سناریوی شیفت کامل |
| HR | مرخصی/مساعده/پیام/رزرو | 19، 22، 34، 37 | HR extensions | Implemented | متوسط | تراکنش چندرکوردی سروری ندارد | E2E تأیید |
| حقوق | کارکرد/فیش/بستن دوره (ورود گروهی فقط پرسنل فعال با راهنمای تاشو؛ فیش بدون انتخاب پیش‌فرض و کمک‌هزینه برگشت = تعداد شیفت شب × مبلغ هر شیفت) | 00–03 | payrollClosures/salaryModel | Implemented | متوسط | نیاز تطبیق نمونهٔ عملیاتی مجاز | golden fixtures |
| حقوق | ریز کارکرد دستگاه حضور و غیاب (ورود Excel/CSV/JSON/dat در «کارکرد ماه»)، «کارکرد ماه من» در پنل پرسنل، درخواست اصلاح کارکرد و تایید/رد مدیر | 18 (`RayoAttendance`)، 19، 22، 00؛ `qa_attendance_corrections` | attendanceLogs/attendanceCorrections | Implemented | متوسط | قالب واقعی خروجی دستگاه کافه هنوز با فایل نمونه تطبیق نشده؛ Save کل سند hr (مثل مرخصی) | ورود فایل واقعی دستگاه روی Stage |
| انعام | Query/ثبت/فیلتر (فرم ثبت: پرسنل فعال در ستون‌های هر گروه، گزینهٔ «همه پرسنل»، شرکت‌کنندگان فعلی همیشه حفظ؛ وضعیت فهرست از دفتر تسویه `tipLiveStatus` و با فیلتر پرسنل وضعیت سهم همان نفر) | 00؛ qa_tips_query/qa_tip_form_filters | tipGroups | Implemented | زیاد | Query به سند کامل تبدیل نشود | guard completeness |
| انعام | تسویه ماهانه و گردکردن جمع ماهانهٔ هر نفر به پایینِ ۵۰۰۰ (سهم گروه دقیق) | 00، 34، 22؛ qa_tip_monthly_settlement، qa_personnel_payroll_forecast | payments.tipAllocations | Implemented | زیاد | پرداخت legacy بی‌لینک تخصیص نمی‌یابد | حفظ روابط |
| آموزش | پروتکل/چک‌لیست/گزارش؛ ورود گروهی CSV/JSON چک‌لیست بر اساس پوزیشن | 29 و 22؛ qa_checklist_csv_import | HR arrays | Implemented | متوسط | ورود گروهی پروتکل وجود ندارد (`qa_protocol_bulk_import` شکست) | — |
| صندوق | ثبت/گزارش/مغایرت | 11، config؛ qa_cash_variance/query | cashreport.reports | Implemented | زیاد | ریال ورودی، تومان گزارش | تطبیق channelها |
| صندوق | حذف ایمن همه مسیرها | 11 archive در برابر override 42 | cashreport.reports | Partial | زیاد | حذف فیزیکی فعال Legacy | CUR-03 |
| وجوه | شخص/حساب/مالک/گردش/void | 11، 20؛ qa_cash_custody | cashreport + finance.entries | Implemented | زیاد | موجودی بانک نیست | Stage round-trip |
| فروش | تحلیل روز/ماه/آیتم/سال | 24، 28 | cashreport.salesAnalytics | Implemented | متوسط | موجودی از salesPeriods جداست | تطبیق source |
| سپیدز | parser block/preview/dedup/risk/review | 33، templates | sepidsaudit | Implemented | متوسط | score اثبات تخلف نیست | fixture نهایی فایل‌ها |
| سپیدز | اتصال قطعی event به فروش invoice | 33 | داده واردشده | Partial | متوسط | شماره/ساختار همه فروش‌ها کافی نیست | قرارداد گزارش فروش |
| مالی | تعهد/تسویه/چک/مانده اولیه و گردش وجه | 20؛ qa_finance_obligations، qa_opening_settlement | finance + منابع وجه | Implemented | زیاد | ثبت داخلی؛ اتصال بانکی ندارد؛ حساب رویدادهای Legacy ممکن است نامعلوم باشد | reconcile موارد هشدار |
| مالی | حفظ سابقهٔ entries معمولی | 20::deleteEntry | finance.entries | Implemented | زیاد | رکوردهای جدید با void حفظ می‌شوند | کنترل داده Legacy |
| مالی | P&L/override/سناریو | 20؛ qa_finance_accrual_tax | finance + cash/inventory/HR | Implemented | متوسط | تقریبی، جای حسابداری رسمی نیست | کنترل دوباره‌شماری |
| مالی | پیش‌بینی هزینهٔ ماه و مقایسه با واقعی | 20::costForecastView | finance.costForecast + HR | Implemented | متوسط | QA اختصاصی ندارد | QA |
| اموال | دارایی/تعمیر/تعداد/incident/ارزش | 12، 19، 30؛ qa_ui_lists_assets | assets | Implemented | متوسط | Seed تجمیعی؛ tag کامل ناموجود | دادهٔ مجاز و UAT |
| نظرسنجی | ثبت/پیگیری/روند/خروجی | 21 و 22 | survey | Implemented | متوسط | Backend مجوز PII نامعلوم | آزمون scope |
| گزارش | ارزش/خسارت/سود/شاخص‌ها | 15، 28، 44، 46 | projection حوزه‌ها | Partial | متوسط | دادهٔ ناقص برخی جمع‌ها را محدود می‌کند | نمایش پوشش |
| ابزار | Excel/CSV/چاپ | 18 و importer حوزه؛ [قالب‌ها](EXCEL_IMPORT_FORMATS.md) | فایل انتخابی/fixture | Implemented | متوسط | CDN؛ قالب‌ها به importer وابسته‌اند | تست فایل ساختگی |
| ابزار | ورود اعداد: ارقام فارسی، جداکنندهٔ سه‌رقمی، خالی‌شدن فیلد مبلغ با کلیک | 35::RayoNumberUX؛ qa_numeric_input | — | Implemented | زیاد | — | — |
| سپیدز | بارگذاری صفحهٔ ممیزی روی دادهٔ زنده | 33 | sepidsaudit | Partial | زیاد | ماژول روی سرور ساخته نشده (404)؛ صفحه پیام خطا می‌دهد (CUR-13) | Initialize صریح ماژول |
| خطا | ثبت پایدار Client (صفحه‌های مدیریت: 30 از لحظهٔ آماده‌شدن Gateway؛ پنل پرسنل و صندوقدار: 31؛ هر ذخیره لاگ سرور را دوباره می‌خواند و فقط ورودی‌های ذخیره‌نشدهٔ همان صفحه را اضافه می‌کند؛ خطای تکراری toast یک بار ثبت می‌شود) | 30، 31 | errorlog | Partial | زیاد | scrub/auth/retention سروری تأییدنشده | CUR-09 |
| آینده | React، API v2 و DB | راهنمای مهاجرت | هدف پیشنهادی | Planned | طرح | در مخزن پیاده نشده | تصمیم و فازبندی |
| دسترسی | کاربران مدیریت با بخش‌های مجاز (منو + نگهبان صفحه) | 44::RayoAdminAccess، 00::loginV5، 16 | hr.settings.adminUsers | Partial | زیاد | فقط سمت مرورگر؛ API مجوز کاربر ندارد؛ hash در سند HR قابل خواندن است | RBAC سروری |
| مدیریت | پنل مانیتورینگ (هشدارها، دارایی/تعهدات، عملکرد ماه، سود/زیان ماهانه و تجمعی) | 49؛ منابع 20/32/40/12/00 | خواندنی همهٔ ماژول‌ها | Implemented | متوسط | دقت تابع دادهٔ منابع (قیمت ناقص انبار، فاکتور خرید ثبت‌نشده) | — |
| انبار | گزارش‌های انبار: پرتی/ضایعات، مغایرت شمارش، ورود، گردش تجمیعی؛ CSV و خروجی AI | 46 (تب reports)، 32 | inventory/pricing | Implemented | متوسط | ارزش ضایعات با بهای فعلی است نه زمان رخداد | — |
| ابزار | حفظ فوکوس و مکان‌نما هنگام بازسازی صفحه با تایپ | 35::RayoFocusKeeper؛ 00 و 22؛ qa_base_data_search_input | — | Implemented | زیاد | — | — |
| آینده | چندمستاجری، RBAC سروری، audit قطعی | راهنمای مهاجرت | هدف پیشنهادی | Planned | طرح | tenant فعلی در API نیست | تصمیم محصول/Backend |

وضعیت suiteها و شکست‌های شناخته‌شده در بخش ۶ [مرجع فنی](CURRENT_IMPLEMENTATION.md) است.
