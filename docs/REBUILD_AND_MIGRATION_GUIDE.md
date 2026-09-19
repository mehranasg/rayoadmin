# بازسازی و مهاجرت — چهار مسیر مستقل

مبنای وضعیت فعلی: [مرجع فنی](CURRENT_IMPLEMENTATION.md) و [قرارداد داده](DATA_AND_API_REFERENCE.md)، commit `39f5d1c`. **تمام معماری، نام جدول، route و endpoint هدف در این سند `Planned` است** مگر جایی که صریحاً به فایل جاری ارجاع داده شود. در این کار React، Backend تازه، دیتابیس یا migration اجرایی ایجاد نشده است.

## پیش‌شرط مشترک و تصمیم‌های ثبت‌شده

تصمیم‌های لازم‌الاجرا از درخواست/قواعد جاری: کاتالوگ واحد `pricing.ingredients`، استقلال category/itemType، ۹ تب انبار، حفظ ID/کد سپیدز، حفظ snapshot تاریخی، Load بدون Seed/Save خودکار، و عملیات مخرب فقط با Backup/Preview/Rollback. بازسازی برای رفع محدودیت‌ها مجوز تکرار حذف فیزیکی Legacy نیست.

ترتیب ورود داده: مراجع واحد/دسته/محل و پرسنل→کاتالوگ/منو→تأمین و رابطه→نسخهٔ رسپی و قیمت→خرید/پرداخت→دفتر/شمارش/فروش→صندوق/مالی/حقوق→اموال/ممیزی/نظرسنجی. هویت کاربری و مجوز پیش از فعال‌شدن write عمومی آماده شوند. دادهٔ زنده در این ممیزی دریافت نشده؛ نمونه‌های واقعیِ مجاز برای شکل‌های خالی/متفاوت باید در Stage استخراج و حساسیت‌زدایی شوند.

## مسیر A — بازسازی از ابتدا

هدف، بازسازی قرارداد محصول است، نه بازتولید ۴۸ patch. [مشخصات محصول](PROJECT_MASTER_SPEC.md) جریان‌ها و پذیرش حوزه‌ها، ماتریس وضعیت دامنهٔ موجود و مرجع داده نام/معنای فیلدها را می‌دهند. پیاده‌سازی قدیمی فقط برای استخراج جزئیات و golden case استفاده شود؛ code path ناامن به الزام محصول تبدیل نشود.

| مرحله | خروجی نسخهٔ اول | وابستگی | معیار خروج |
|---|---|---|---|
| A0 | مرز محیط، auth، مجوز، backup/restore، ثبت خطا و قرارداد خطا | تصمیم مالک دربارهٔ نقش و محیط | حساب بدون مجوز از API رد شود؛ restore ساختگی آزموده شود |
| A1 | کاتالوگ، واحد/دسته، محل و پرسنل پایه | A0 | ID/code پایدار، inactive و unknown fields/LegacyId محفوظ |
| A2 | منو، نسخهٔ رسپی، افت، قیمت و گزارش هزینه | A1 | مثال افت، واحد نامعتبر، نسخهٔ تاریخ‌دار و قیمت دستی پاس |
| A3 | تأمین‌کننده، خرید/پرداخت، ورود و انتقال | A1–A2 | فاکتور موجودی نسازد؛ رسید یک اثر، انتقال دو سمت، هزینه سازگار |
| A4 | فروش، ضایعات، شمارش، دوره و مغایرت | A2–A3 | baseline تأییدشده، عدم دوباره‌شماری، snapshot دوره، جمع محل‌ها |
| A5 | صندوق، وجوه، تعهدات و گزارش مالی | A0–A4 | ریال/تومان، مالک تاریخی، ابطال، مانده و هزینه بدون تکرار |
| A6 | شیفت/حقوق/انعام، پنل پرسنل، آموزش | A1، auth | قرارداد ثابت/ساعتی، تسویه سهم، تأیید مرخصی و visibility صحیح |
| A7 | ممیزی، اموال، نظرسنجی، گزارش تکمیلی/forecast | دادهٔ حوزه‌های مربوط | import تکراری، دارایی تجمیعی، forecast ناقص و مجوز PII آزموده شوند |

MVP عملیاتی برای پایلوت می‌تواند A0 تا A5 باشد، اما **هم‌ارزی کامل محصول** تا تکمیل A6/A7 و نیازهای واقعی کاربران ادعا نشود. برای هر زیرماژول، سناریوی عادی، Empty، خطا، دوبارکلیک، قطع ارتباط، conflict، رکورد غیرفعال و سابقهٔ قدیمی تعریف شود.

تکرار نشود: mirror مستقل اقلام، ذخیرهٔ سند صفحه‌ای، fallback به Seed، رمز در JSON عمومی، حذف سابقه، قیمت/واحد حدسی، ساخت تاریخچهٔ گمشده، تغییر محاسبهٔ دورهٔ بسته، و وابستگی رفتار به ترتیب override. نوع بانک/حسابداری و قواعد حقوقی بدون تصمیم صاحب محصول اضافه نشود.

## مسیر B — ادامه توسعهٔ همین نسخه

1. `AGENTS.md` و [شروع AI](AI_START_HERE.md)، سپس فقط سند و فایل مربوط. از `git status` و HTML/loader شروع کنید؛ latest filename به‌تنهایی مالک اجرا نیست.
2. رفتار موردنظر و شاهد اختلاف را ثبت کنید. اثر JSON، DTO، migration و دادهٔ زنده را مشخص کنید؛ اگر صرفاً UI است صریح بنویسید.
3. مالک فعلی را تغییر دهید. patch تازه فقط وقتی اصلاح همان مالک ایمن نیست. شمارهٔ محصول برای کار ناقص تغییر نکند.
4. فیلد اختیاری با خواندن backward-compatible و نوشتن صریح اضافه شود؛ unknown fields و ID محفوظ. field absent، null، صفر و false را یکسان نکنید.
5. syntax و QA همان حوزه، Gateway و startup را اجرا کنید؛ تست دستی با fixture، Save/Load، شبکهٔ ناموفق و عدم Seed/Save در Load انجام شود.
6. diff و لینک‌های مستندات را بررسی، نتیجه و limitation را ثبت و commit کوچک بسازید. rollback کد، revert همان commit؛ rollback داده فقط با طرح مستقل و مقایسهٔ ثبت‌های جدیدتر.

### backlog حاصل از سورس فعلی

| اولویت | مسئله | اقدام/پذیرش مستقل |
|---|---|---|
| P0 | CUR-01/02: Save بدون version و snapshot ناقص | جداسازی full-document/collection state، version اجباری برای write، دو نویسنده→409 بدون Lost Update |
| P0 | CUR-03/04: حذف صندوق و entries عادی | حذف override مخرب، archive/reversal با audit و حفظ تاریخچه؛ QA روی آخرین تابع نصب‌شده |
| P0 | CUR-05: auth/permission Client | قرارداد هویت سروری و آزمون URL/API مستقیم بدون مجوز |
| P1 | CUR-06: چند Save و metadata جدا | ابتدا hardening کنترل نسخه/backup؛ سپس transaction DB و idempotency پایدار |
| P1 | CUR-07/08: validation و Error/Empty | schema بدون حذف unknown، رد نوع نادرست، نمایش read-only در شکست |
| P1 | CUR-09: errorlog | scrub اطلاعات حساس، retention، rate limit و audit سروری |
| P1 | تاریخچه/واحد/هزینه | نمونهٔ دادهٔ مجاز، ثبت uncertainty، عدم backfill حدسی |
| P2 | QA نسخه‌ای و وابستگی مرورگر | runner جاری با گزارش explicit legacy failures؛ fixture مستقل و E2E |
| P2 | فونت/CDN/markers/patchها | بستهٔ دارایی مجاز و reproducible؛ کاهش override مرحله‌ای |

این backlog دستور اجرای خودکار migration یا تغییر Runtime در تسک مستندات نیست.

## مسیر C — مهاجرت Frontend به React

### انتخاب و مرزبندی پیشنهادی

React + TypeScript با build مستقل، routeهای صریح و مهاجرت یک صفحه در هر مرحله پیشنهاد می‌شود. امکان اضافه‌کردن تدریجی React به پروژهٔ موجود در [راهنمای رسمی React](https://react.dev/learn/add-react-to-an-existing-project) پشتیبانی شده است. برای رایو، جداسازی route جدید از صفحهٔ classic از دست‌کاری مشترک یک DOM ساده‌تر است؛ این انتخاب طراحی پروژه است.

ساختار **پیشنهادی، هنوز ناموجود**:

```text
apps/web/src/
  app/             # router, session, providers, shell
  features/        # catalog, menu, inventory, cash, hr, finance, ...
  shared/          # rtl controls, dates, amounts, errors
  data/            # legacy gateway adapter, typed contracts
  domain/          # pure costing, units, payroll, variance
tests/             # contract, integration, e2e, migration fixtures
```

server state در TanStack Query و state فرم/فیلتر در component یا URL نگهداری شود؛ کپی همزمان تمام JSONها در store عمومی توصیه نمی‌شود. Query برای fetch/cache/synchronization سرور طراحی شده است؛ [مرجع رسمی](https://tanstack.com/query/latest/docs/framework/react/overview). context فقط session، theme و تنظیمات کم‌تغییر؛ افزودن store دیگر نیازمند مسئلهٔ مشخص است.

adapter قدیمی باید `{data, version, completeness, source}` را در مدل داخلی تفکیک کند؛ این wrapper پیشنهادی است، فیلد موجود API نیست. `saveFullDocument` فقط full snapshot معتبر بپذیرد و Mutate فقط record draft و version. parsing envelope، alias hr/personnel، unknown fields، خطا و currency داخل adapter باشند. conflict به UI برسد؛ retry خودکار برای write مالی/انبار یا version conflict خاموش باشد. requestId retry همان عملیات ثابت بماند.

فرم‌ها schema مشترک typed، خطای field-level فارسی، dirty state، کنترل دوبارکلیک و حفظ draft پس از خطا داشته باشند. فرم چندخطی و autocomplete با stable key/ID ساخته شود؛ input مبلغ/اعشار با هر keystroke format مخرب نشود. validation Client برای تجربهٔ کاربری است و Server دوباره آن را enforce می‌کند. انتخاب کتابخانه فرم/validation و pin نسخه در شروع implementation انجام شود؛ این سند نسخهٔ نصب‌شده ادعا نمی‌کند.

Design System کوچک: Button، Text/Number/MoneyField، JalaliDateField، SearchPicker، Modal، DataTable، StatusBadge، Empty/Error/Loading، PermissionBoundary و PrintLayout. tokens رنگ/فاصلهٔ موجود، IRANSansX مجاز، RTL و focus/keyboard حفظ شوند. تاریخ در domain از متن نمایش جدا شود؛ accessibility و نمایش ۳۶۰px/دسکتاپ و چاپ A4 معیار پذیرش باشند.

### نگاشت صفحه به route/component پیشنهادی

| صفحهٔ موجود | route پیشنهادی | component/feature پیشنهادی |
|---|---|---|
| index.html | `/app/dashboard` | AdminShell, Dashboard |
| base-data.html | `/app/catalog` | CatalogPage, ItemEditor |
| menu-management.html | `/app/menu/:tab` | MenuPage, RecipeEditor, RecipeVersions |
| pricing.html | `/app/pricing/:tab` | PricingSummary, PriceHistory |
| inventory.html | `/app/inventory/:tab` | InventoryPage و همان ۹ tab |
| suppliers.html | `/app/suppliers/:tab` | SupplierList, Relations, Accounts |
| cash-report-admin.html | `/app/cash/:tab` | CashReports, Destinations, CustodyLedger |
| cash-report.html | `/cash/entry` | CashEntry با هویت سروری مناسب |
| sales-analysis.html | `/app/sales` | SalesAnalytics |
| sepids-audit.html | `/app/sales/audit` | ImportPreview, AuditInbox |
| personnel.html?view=... | `/app/hr/:view` | Personnel, Shifts, Payroll, Tips |
| finance.html?view=... | `/app/finance/:view` | Obligations, Checks, MonthlyPL |
| reports.html | `/app/reports/:tab` | ReadOnlyReports |
| assets.html / survey.html | `/app/assets` / `/app/survey` | Assets / Survey |
| settings.html | `/app/settings/:view` | Settings, Backup, ExplicitDataOperations |
| personel/*.html، staff-login/panel | `/staff/:view`، `/login` | StaffShell و فرم‌های مجاز |

### هم‌زیستی و خروج مرحله‌ای

1. shell + adapter + حالت خواندنی کاتالوگ: old URL و new URL روی یک منبع معتبر؛ parity فیلتر/عدد/RTL با fixture. خروج: هیچ write ناخواسته و هیچ تفاوت شمارش/شناسه.
2. ویرایش کاتالوگ/منو/قیمت: ابتدا version و auth Backend روشن شود؛ یک نویسنده برای هر slice، flag مسیر. خروج: Save/refresh و تاریخچه/unknown fields و خطا پاس.
3. تأمین و انبار: مهاجرت فرم و محاسبات pure با golden data؛ خروج: receipt/transfer/count/variance و دورهٔ بسته برابر، no duplicate.
4. صندوق/مالی/سپیدز: query pagination، idempotency و archive؛ خروج: مانده، ریال/تومان، review و permission صحیح.
5. HR/حقوق/پرسنل و سپس اموال/نظرسنجی: خروج: سناریوهای محصول، پوشش role و UAT کاربران مربوط.
6. حذف route/patch قدیمی فقط وقتی مصرف‌کننده‌ای باقی نیست و یک دورهٔ عملیاتیِ موردتوافق با parity طی شده است؛ صرف ساخت صفحهٔ React پایان مرحله نیست.

dual-write مستقل به JSON و DB ممنوع. در دورهٔ هم‌زیستی، feature flag و routing مشخص می‌کند کدام UI حق نوشتن دارد؛ صفحهٔ قدیمی حوزهٔ منتقل‌شده read-only شود. هیچ DOM همزمان تحت مدیریت React و renderer سراسری نباشد. rollback هر slice بازگرداندن route/flag است، مشروط به سازگاری داده؛ اگر schema جدید ناسازگار است ابتدا adapter برگشتی آماده باشد.

Unit: واحد/افت/نسخهٔ رسپی/حقوق/مانده. Integration: envelope/unknown fields، full vs partial، Save verification، 409 و requestId. E2E: کاتالوگ تا رسپی، خرید تا receipt، فروش تا مصرف، count تا period close، صندوق تا گردش، تسویه انعام. RTL/keyboard/focus و شبکهٔ کند/قطع نیز پوشش داده شوند. harnessهای متنی قدیمی جای این‌ها را نمی‌گیرند.

## مسیر D — Client/Server واقعی با دیتابیس

### معماری هدف پیشنهادی

یک Backend ماژولار در یک سرویس (modular monolith)، یک DB رابطه‌ای و Frontend فوق برای مقیاس فعلی کافی است. وجود Controller C# دلیل انتخاب کم‌هزینهٔ ASP.NET Core/EF Core در صورت ادامهٔ تیم .NET است؛ فایل فعلی ASP.NET Web API قدیمی است و انتقالش کپی مستقیم به Core نیست. SQL Server برای زیرساخت .NET موجود گزینهٔ اول مشروط، PostgreSQL جایگزین در صورت تناسب میزبانی/هزینه است؛ تصمیم نهایی با مالک محصول.

مرز ماژول‌ها: Identity، Catalog/Menu/Pricing، Procurement، Inventory، HR/Payroll، Cash/Finance، Assets، Survey/Audit. محاسبه و validation مالی/انبار در service/domain Server؛ Frontend فقط پیش‌نمایش همسان ارائه کند. queue، microservice، event sourcing کامل و انبار دادهٔ جدا فقط پس از نیاز اثبات‌شده اضافه شوند.

auth: session سروری با cookie امن HttpOnly/Secure و حفاظت CSRF برای مرورگر هم‌مبدأ؛ برای client بیرونی احتمالی قرارداد token/OIDC مستقل. رمز خام JSON migrate مستقیم نشود؛ reset حساب‌ها یا تبدیل کنترل‌شدهٔ یک‌باره با سیاست تأییدشده. logout، expiry و ابطال نشست سمت سرور اعمال شود.

RBAC پیشنهادی: مدیر سیستم، مدیر رستوران، مالی، خرید، انباردار، صندوقدار و پرسنل. permission به module/action و scope شعبه/شخص وصل شود؛ هر API مجوز و مالکیت entity را کنترل کند. نقش‌های پیشنهادی تأیید محصول می‌خواهند؛ featureVisibility امنیت نیست.

### schema اولیهٔ پیشنهادی

این جدول طرح منطقی است، DDL آمادهٔ production نیست. PK داخلی و `LegacyModule+LegacyId` یکتا برای mapping؛ code سپیدز رشته و صفرهای ابتدایی محفوظ. tenant/branch باید از هویت معتبر Server بیاید، نه مقدار آزاد Client. برای masterها IsActive/IsArchived، زمان/actor و concurrency token؛ برای تراکنش posted، reversal به جای تغییر خاموش.

| حوزه | جدول‌های پیشنهادی و روابط کلیدی |
|---|---|
| هویت | Organizations, Branches, Users, Roles, Permissions, UserRoles, RolePermissions, Sessions |
| کاتالوگ | Units, UnitConversions, CatalogCategories, CatalogItems؛ نوع/flags/واحد FK؛ ItemPriceHistory |
| منو | MenuCategories, MenuItems, MenuPriceHistory, RecipeVersions, RecipeLines؛ نسخه→منو و خط→قلم |
| تأمین | Suppliers, SupplierBankAccounts, SupplierItems, SupplierQuotes؛ رابطه supplier+catalog item |
| خرید | PurchaseRequests/Lines, PurchaseOrders/Lines, PurchaseInvoices/Lines, SupplierPayments, SupplierOpeningBalances |
| انبار | InventoryLocations, InventoryTransactions/Lines, GoodsReceipts/Lines, WasteEvents/Lines, SalesImports/Lines, Stocktakes/Lines, InventoryPeriods, InventoryBalances, ReorderPolicies, OperationalConsumptionProfiles |
| منابع انسانی | Personnel, PersonnelBankAccounts, Sections, Positions, SectionPositions, ShiftDefinitions, StaffingRequirements, WeeklyPlans/Assignments, MonthlyPlans/Assignments, ShiftRecords, Holidays, LeaveRequests |
| حقوق | PayrollPeriods/Rows, PayrollAdjustments, PayrollPayments, TipGroups/Participants, TipPaymentAllocations, Advances, Violations |
| آموزش | Protocols, ChecklistTemplates/Items, ChecklistRuns/Results |
| صندوق و مالی | Cashiers, CashReports/Lines/Reviews, CashRecipients, TransferAccounts, CustodyEntries, FinancialParties, Obligations, Settlements, Checks, MonthlyOverrides |
| اموال/خدمات | Assets, AssetMaintenance, AssetQuantityTransactions, AssetIncidents, AssetCounts, Reservations, SurveyResponses/FollowUps |
| ممیزی/سیستم | SepidzImportBatches/RawBlocks/Events/EventItems/Changes/Alerts/Reviews/Links, AuditLogs, ErrorLogs, ImportJobs/Rows, LegacyMappings, LegacyDocuments, IdempotencyRequests, SystemSettings |

مبلغ هدف با currency صریح و decimal مناسب برای هزینهٔ واحد کسری؛ پیشنهاد اولیه decimal(19,4) برای مبلغ و decimal(19,6) برای quantity/conversion، با سیاست گردکردن نهایی ثبت‌شده. ذخیرهٔ مبلغ کل صحیح با cost کسری اشتباه نشود. BusinessDate میلادی date به‌علاوهٔ متن واردشدهٔ اصلی/تقویم؛ audit زمان UTC و timezone شعبه Asia/Tehran. دادهٔ تاریخی نامعتبر quarantine شود، نه تاریخ حدسی.

FK/indexهای لازم: item+location+date، supplier+date، personnel+period، status+dueDate، import hash و unique code در scope مصوب. نسخهٔ منتشرشدهٔ رسپی برای هر تاریخ overlap نداشته باشد. posted ledger و closure immutable؛ balance projection قابل بازسازی. فیلد ناشناخته در LegacyDocuments/extension bag تا تعیین mapping نگهداری شود.

### سازگاری، هم‌زمانی و transaction

API نسخه‌دار و قرارداد تولیدشده از OpenAPI پیشنهاد می‌شود. هر تغییر master با version/ETag، conflict با پاسخ صریح و بدون last-write-wins. EF Core concurrency token و مقایسهٔ نسخهٔ خوانده‌شده را پشتیبانی می‌کند؛ [مستند رسمی](https://learn.microsoft.com/en-us/ef/core/saving/concurrency). posting رسید/انتقال/تأیید شمارش و ثبت مالی وابسته در یک transaction انجام شود؛ تراکنش و savepointهای EF باید با provider منتخب آزموده شوند. [مرجع transaction](https://learn.microsoft.com/en-us/ef/core/saving/transactions).

requestId/idempotency در DB با scope هویت+عملیات و hash payload یکتا باشد؛ همان key با payload متفاوت خطا دهد. نتیجهٔ عملیات تا مدت موردتوافق قابل بازیابی بماند. retry پس از timeout باید همان نتیجه را بازگرداند؛ دوبارکلیک نباید receipt/payment تکراری بسازد. audit actor، action، entity، قبل/بعد کنترل‌شده، زمان و correlationId در همان transaction ذخیره شود؛ secret/PII در log عمومی نیاید.

### endpointهای صرفاً پیشنهادی

| endpoint هدف | هدف |
|---|---|
| `GET/POST /api/v2/catalog/items`، `PATCH /api/v2/catalog/items/{id}` | فهرست/ثبت/اصلاح با version |
| `POST /api/v2/menu-items/{id}/recipe-versions` | نسخهٔ تاریخ‌دار immutable |
| `POST /api/v2/inventory/receipts/{id}/post` | posting با idempotency |
| `POST /api/v2/inventory/stocktakes/{id}/approve` | تأیید مجاز و baseline |
| `GET /api/v2/inventory/balances` | query با scope/فیلتر/صفحه |
| `POST /api/v2/cash-reports/{id}/void` | ابطال مجاز با دلیل/audit |
| `POST /api/v2/obligations/{id}/settlements` | تسویهٔ اتمی با کنترل مانده |
| `POST /api/v2/import-jobs`، `GET /api/v2/import-jobs/{id}` | staging/preview/result |

هیچ‌کدام از این مسیرها در Gateway فعلی وجود ندارد. قرارداد پاسخ هدف: data، errors با field/code/message، traceId و metadata صفحه/نسخه. validation، نبود مجوز، تعارض و خطای داخلی status متمایز داشته باشند. export باید permission، scope و audit داشته باشد؛ import تا تأیید Preview فقط staging بنویسد.

### مهاجرت مرحله‌ای JSON → DB و rollback

| مرحله | اقدام | گیت ادامه | بازگشت |
|---|---|---|---|
| D0 | Backup تمام ماژول‌ها با hash، ثبت counts/amounts/IDs، freeze تغییر schema | دریافت کامل و restore آزمایشی موفق | بدون write جدید، حفظ سیستم فعلی |
| D1 | ورود raw JSON تغییرنیافته به staging؛ ثبت module/legacyId/importBatch/hash | duplicate/orphan/date/currency/unknown گزارش شده | حذف batch آزمایشی فقط در Stage؛ originals محفوظ |
| D2 | mapping و normalize در transaction؛ schema migration نسخه‌دار | count/FK/مجموع مبلغ/stock/debt/payroll/recipe نمونه برابر یا اختلاف توجیه‌شده | rollback transaction/restore Stage؛ عدم تغییر منبع |
| D3 | Compatibility API روی همان DB؛ Load/Query legacy و Save فقط با full snapshot/version | contract tests، هم‌زمانی، crash و unknown fields | flag به منبع قدیم فقط قبل از پذیرش write جدید یا با delta قابل بازپخش |
| D4 | پایلوت خواندنی، سپس writer واحد برای هر حوزه و React مرحله‌ای | UAT و reconciliation دوره‌ای، بدون dual-write مستقل | توقف write، export delta، mapping برگشتی آزموده، سپس بازگشت route |
| D5 | پنجره cutover، final backup/delta، قفل writer قدیمی، reconcile و فعال‌سازی | تمام خطاهای بحرانی صفر؛ مسئول عملیات تأیید کند | maintenance، restore point + replay تأییدشده، reconcile؛ restore کور ممنوع |

نام، ID/code، snapshot افت/واحد/مالک، نسخهٔ رسپی، void/archive و period closure همگی در migration preserved باشند. برای snapshot فاقد جزئیات، status «نامشخص/تخمینی» منتقل شود. تعداد دارایی‌های تجمیعی به ردیف ساختگی tag تبدیل نشود. دادهٔ Seed هرگز بر export زنده اولویت ندارد. سیستم قدیمی پس از cutover حداقل دورهٔ موردتوافق فقط‌خواندنی بماند.

### عملیات، امنیت و پذیرش هدف

- محیط‌های Development با fixture، Staging با دادهٔ حساسیت‌زدایی‌شده و Production با secret store/دسترسی محدود جدا؛ API origin/DB/tenant مشترک ناخواسته ممنوع.
- CI: build reproducible با lockfile، unit/contract/integration/E2E، migration dry-run، secret/dependency scan و artifact مشخص. deployment به مرحلهٔ approval عملیاتی جدا برسد.
- Backup رمزگذاری‌شده خارج از هاست اصلی، سیاست retention و restore drill؛ RPO/RTO عددی باید با مالک محصول توافق شود. backup بدون تمرین restore کافی نیست.
- log ساختاری، traceId، health/readiness، شمارندهٔ conflict/error/latency، هشدار شکست backup/import و audit دسترسی حساس؛ log شامل credential یا payload کامل HR نباشد.
- rate limit برای login، import بزرگ و export حساس؛ محدودیت اندازه/فرمت فایل، جلوگیری از formula injection در CSV و scope داده. مقدار limit از بار واقعی تعیین شود.
- تست چندکاربره: دو ویرایش متعارض، دوبار submit، timeout بعد از commit، restart بین عملیات، rollback مالی/موجودی، مجوز object-level و تطبیق ledger با balance.

## تصمیم‌های باز برای مالک محصول

۱. محصول تک‌رستوران می‌ماند یا سازمان/شعبه/tenant مستقل از ابتدا لازم است؟ ۲. نقش‌ها و مجوزهای دقیق و سیاست حساب مدیر چیست؟ ۳. زیرساخت و تیم Backend، SQL Server یا PostgreSQL و هزینهٔ میزبانی؟ ۴. مرز دفتر داخلی مالی با حسابداری رسمی و اتصال فروش سپیدز؟ ۵. واحد پول هدف و دقت/گردکردن، قواعد تاریخ و بستن دوره؟ ۶. سیاست نگهداری PII/audit/backup و RPO/RTO؟ ۷. ترتیب پایلوت، زمان قطع write و مدت نگهداری read-only؟

۹ تب انبار و عدم بازنویسی به React در کار جاری **تصمیم باز نیستند**؛ تغییر آن‌ها درخواست صریح تازه می‌خواهد. این تصمیم‌های آینده مانع پالایش مستندات فعلی نیستند.
