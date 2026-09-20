# ماتریس وضعیت قابلیت‌ها

سورس مبنا `39f5d1c`، 2026-09-19؛ محصول v10.12.1. `Implemented`: کد قابل استفاده موجود؛ `Partial`: پیاده‌سازی محدود/ناسازگار؛ `Planned`: هدف آینده؛ `Deprecated`: مبنای توسعه نباشد؛ `Unverified`: شواهد کافی نداریم. اطمینان «زیاد» یعنی کد و QA محلی مرتبط، «متوسط» یعنی شاهد سورس با پوشش آزمون محدود. هیچ ردیف به‌تنهایی اثبات استقرار/دادهٔ زنده نیست. اعداد فایل به فهرست کامل [مرجع فنی](CURRENT_IMPLEMENTATION.md) اشاره دارند.

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
| تنظیمات | صفحه مستقل و مسیرهای قدیمی | settings.html، 16، 44؛ qa_management_tabs | HR.settings | Implemented | زیاد | منبع داده مستقل نیست | حفظ Back/Forward |
| تنظیمات | مخفی‌کردن امکانات | 44::saveFeatures | HR.settings.featureVisibility | Implemented | متوسط | فقط visibility | با RBAC اشتباه نشود |
| تنظیمات | Backup کامل | 38::downloadAll | ۱۰ Load | Implemented | زیاد | consistency لحظه‌ای چندماژولی ندارد | snapshot سروری آینده |
| تنظیمات | Initialize صریح خالی/404 | 39؛ qa_settings_reset | Seed → module | Implemented | زیاد | 500 مجوز نیست | حفظ gate |
| تنظیمات | Reset همه جداول و Restore | 39؛ qa_settings_reset | همه ماژول‌ها | Implemented | زیاد | rollback جبرانی، محیط مستقل لازم | تست restore Stage |
| تنظیمات | Reset از Seed/Bootstrap خودکار | config، 39 | Legacy | Deprecated | زیاد | اسناد قدیمی دستور ناسازگار دارند | اجرا نشود |
| کاتالوگ | master واحد، نوع/گروه مستقل | base-data.html، 43، 47؛ qa_v10_12_1 | pricing.ingredients | Implemented | زیاد | فیلترهای Legacy ناهمگن | audit flags |
| کاتالوگ | mirror به‌عنوان master | 43 | suppliers.items | Deprecated | زیاد | برای سازگاری هنوز نگه داشته می‌شود | حذف فقط با migration |
| کاتالوگ | نقطه سفارش/صفر واقعی | RayoReorder؛ qa_reorder_point | ingredient + tracked fallback | Implemented | زیاد | واحد و مقدار نامعلوم جدا | حفظ golden tests |
| کاتالوگ | migration دستی روابط | 43::previewMigration/applyMigration | pricing + suppliers | Implemented | متوسط | دو Save جبرانی | preview محیط مجاز |
| منو | آیتم/دسته/رسپی/نسخه | menu-management.html، 45 | pricing | Implemented | زیاد | E2E مرورگر موجود نیست | parity UI |
| منو | غیرفعال‌سازی دارای سابقه | 45::deleteMenu | menu/sales/versions | Implemented | متوسط | سایر حذف‌های Legacy یکسان نیستند | تست وابستگی‌ها |
| قیمت | افت و تبدیل واحد/بهای خالص | 08، 32؛ qa_standard_preparation_loss | ingredient/recipe/history | Implemented | زیاد | snapshot قدیمی ناقص | برآورد را برچسب بزنید |
| قیمت | هزینهٔ قطعی تاریخی همه منوها | 08، 32 | نسخه/closure | Partial | زیاد | تاریخچهٔ ثبت‌نشده قابل بازیابی نیست | عدم backfill حدسی |
| قیمت | پیشنهاد/تاریخچه/تنظیمات | pricing.html، 08، 45 | pricing | Implemented | متوسط | استثناهای اقلام شرکتی | نمونهٔ پذیرش |
| تأمین | مشخصات و روابط چندانتخاب | 04، 30، 43؛ qa_supplier_relation_search | suppliers + catalog | Implemented | زیاد | داده بانکی حساس | UI Stage |
| تأمین | قیمت دستی مرتبط/مقایسه | 42::saveManualPrice | pricing + supplierItems | Implemented | متوسط | چند سند و واحد قیمت | آزمون قطع Save |
| تأمین | سفارش/فاکتور چندخطی | 42، 22 | purchaseRequests/invoices | Implemented | متوسط | tabهای قدیمی کامل نمایش داده نمی‌شوند | UAT مسیر واقعی |
| تأمین | میز سفارش در منوی نهایی | 42، 46::supplierTabs | Legacy orderDesk | Deprecated | زیاد | کد/route سازگار باقی است | خودکار برنگردد |
| تأمین | بدهی و مانده اولیه | 42؛ qa_supplier_parties_debts | invoices/payments/directDebts | Implemented | زیاد | دفتر رسمی حسابداری نیست | reconcile نمونه |
| انبار | ۹ تب، موجودی کل/محل و چاپ | inventory.html، 46؛ qa_v10_12_1 | ledger/counts/pricing | Implemented | زیاد | asset چاپ/فونت نیاز مرورگر | visual check |
| انبار | ورود مستقیم و قیمت واحد/کل | 46؛ qa_inventory_receipt_ui | stockReceipts + movement | Implemented | زیاد | catalogue price تغییر نمی‌کند | حفظ قرارداد |
| انبار | انتقال متوازن | 32، 46؛ qa_inventory_entry_issue | inventoryMovements | Implemented | زیاد | transaction Server ندارد | concurrency Stage |
| انبار | شمارش گروهی/اولیه/دوره‌ای | 32، 35، 46؛ qa_inventory_bulk_count | stocktakes | Implemented | زیاد | قیمت فرم‌ها واحد متفاوت دارد | کنترل labels |
| انبار | ابطال/آرشیو رسید | 46؛ qa_inventory_receipt_ui | receipt/movement | Implemented | زیاد | نشست مدیر Client | server authorization |
| انبار | فروش/اسنپ و مصرف رسپی | 14، 32، 36 | salesPeriods/recipeVersions | Implemented | متوسط | کامل‌بودن ورودی کانال‌ها نامعلوم | تطبیق واردسازی |
| انبار | waste/consumption و review | 32، 34، 22 | waste/consumption/declarations | Implemented | متوسط | مدرک فایل/approval چندمرحله‌ای ندارد | UAT پایان شیفت |
| انبار | cost/variance/closure | 32، 46 | ledger + periodClosures | Implemented | زیاد | coverage شمارش شرط اعتبار | نمایش completeness |
| انبار | forecast زمانی/فروش‌محور | 46؛ qa_operational_forecast | operationalConsumptionProfiles | Partial | زیاد | invoice count/۳ دوره ندارد؛ missing→unknown | دادهٔ پوشش معتبر |
| انبار | ۱۲ تب تاریخی | هسته 32 در برابر UI 46 | Legacy | Deprecated | زیاد | الگوی تاریخی تست‌ها | ۹ تب حفظ شود |
| HR | پرونده/فیلتر/پروفایل/گزارش | 00، 23، 44؛ qa_personnel_counts | personnel و سوابق | Implemented | زیاد | برخی فیلدها Legacy | نمونهٔ پذیرش |
| HR | بانک/قرارداد ثابت و ساعتی | 05–07، 23؛ qa_personnel_salary_account | personnel | Implemented | زیاد | صحت حقوق قانونی ادعا نمی‌شود | golden payroll |
| HR | وسایل تحویلی | 44::saveIssuedEquipment | personnel.accommodation.equipment | Implemented | متوسط | ثبت داخل HR | حفظ snapshot |
| شیفت | هفته/ماه/تقویم/نیاز/ظرفیت | 00–03، 41، 44؛ qa_shift_menu | plans/records/requirements | Implemented | زیاد | پوشش همه محاسبات در QA محدود | سناریوی شیفت کامل |
| HR | مرخصی/مساعده/پیام/رزرو | 19، 22، 34، 37 | HR extensions | Implemented | متوسط | تراکنش چندرکوردی سروری ندارد | E2E تأیید |
| حقوق | کارکرد/فیش/بستن دوره | 00–03 | payrollClosures/salaryModel | Implemented | متوسط | نیاز تطبیق نمونهٔ عملیاتی مجاز | golden fixtures |
| انعام | Query/ثبت/فیلتر | 00؛ qa_tips_query/qa_tip_form_filters | tipGroups | Implemented | زیاد | Query به سند کامل تبدیل نشود | guard completeness |
| انعام | تسویه ماهانه و گردکردن | 37؛ qa_tip_monthly_settlement | payments.tipAllocations | Implemented | زیاد | پرداخت legacy بی‌لینک تخصیص نمی‌یابد | حفظ روابط |
| آموزش | پروتکل/چک‌لیست/گزارش | 29 و 22 | HR arrays | Implemented | متوسط | E2E واقعی اجرا نشده | UAT پرسنلی |
| صندوق | ثبت/گزارش/مغایرت | 11، config؛ qa_cash_variance/query | cashreport.reports | Implemented | زیاد | ریال ورودی، تومان گزارش | تطبیق channelها |
| صندوق | حذف ایمن همه مسیرها | 11 archive در برابر override 42 | cashreport.reports | Partial | زیاد | حذف فیزیکی فعال Legacy | CUR-03 |
| وجوه | شخص/حساب/مالک/گردش/void | 11، 20؛ qa_cash_custody | cashreport + finance.entries | Implemented | زیاد | موجودی بانک نیست | Stage round-trip |
| فروش | تحلیل روز/ماه/آیتم/سال | 24، 28 | cashreport.salesAnalytics | Implemented | متوسط | موجودی از salesPeriods جداست | تطبیق source |
| سپیدز | parser block/preview/dedup/risk/review | 33، templates | sepidsaudit | Implemented | متوسط | score اثبات تخلف نیست | fixture نهایی فایل‌ها |
| سپیدز | اتصال قطعی event به فروش invoice | 33 | داده واردشده | Partial | متوسط | شماره/ساختار همه فروش‌ها کافی نیست | قرارداد گزارش فروش |
| مالی | تعهد/تسویه/چک/مانده اولیه و گردش وجه | 20؛ qa_finance_obligations، qa_opening_settlement | finance + منابع وجه | Implemented | زیاد | ثبت داخلی؛ اتصال بانکی ندارد؛ حساب رویدادهای Legacy ممکن است نامعلوم باشد | reconcile موارد هشدار |
| مالی | حفظ سابقهٔ entries معمولی | 20::deleteEntry | finance.entries | Implemented | زیاد | رکوردهای جدید با void حفظ می‌شوند | کنترل داده Legacy |
| مالی | P&L/override/سناریو | 20 | finance + cash/inventory/HR | Implemented | متوسط | تقریبی، جای حسابداری رسمی نیست | کنترل دوباره‌شماری |
| اموال | دارایی/تعمیر/تعداد/incident/ارزش | 12، 19، 30؛ qa_ui_lists_assets | assets | Implemented | متوسط | Seed تجمیعی؛ tag کامل ناموجود | دادهٔ مجاز و UAT |
| نظرسنجی | ثبت/پیگیری/روند/خروجی | 21 و 22 | survey | Implemented | متوسط | Backend مجوز PII نامعلوم | آزمون scope |
| گزارش | ارزش/خسارت/سود/شاخص‌ها | 15، 28، 44، 46 | projection حوزه‌ها | Partial | متوسط | دادهٔ ناقص برخی جمع‌ها را محدود می‌کند | نمایش پوشش |
| ابزار | Excel/CSV/چاپ | 18 و importer حوزه | فایل انتخابی/fixture | Implemented | متوسط | CDN؛ قالب‌ها به importer وابسته‌اند | تست فایل ساختگی |
| خطا | ثبت پایدار Client | 31 | errorlog | Partial | زیاد | scrub/auth/retention سروری تأییدنشده | CUR-09 |
| آینده | React، API v2 و DB | راهنمای مهاجرت | هدف پیشنهادی | Planned | طرح | در مخزن پیاده نشده | تصمیم و فازبندی |
| آینده | چندمستاجری، RBAC سروری، audit قطعی | راهنمای مهاجرت | هدف پیشنهادی | Planned | طرح | tenant فعلی در API نیست | تصمیم محصول/Backend |

نتایج اجرای suiteها و موارد مرورگری اجرا‌نشده در [گزارش پالایش](DOCS_CLEANUP_REPORT.md) ثبت می‌شوند. فایل‌های قدیمی با عنوان PASS یا «مرحله بعد» این ماتریس را عوض نمی‌کنند.
