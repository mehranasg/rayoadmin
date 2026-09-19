# مرجع داده و API جاری

مبنای بررسی `39f5d1c`، 2026-09-19. **Inferred from current code**: schema رسمی جامع JSON Schema/OpenAPI در مخزن وجود ندارد. جدول‌ها از `js/config.js`، adapterها، سازنده/مصرف‌کنندهٔ رکورد و QA استخراج شده‌اند؛ DTO مستقر، تعداد دادهٔ زنده و الزام‌های خارج از این مخزن `Unverified` هستند. تمام مثال‌ها ساختگی و برای تشریح قراردادند.

## ۱. مالکیت، شناسه و روابط

| مفهوم | مالک حقیقت | رابطه و سازگاری |
|---|---|---|
| قلم | `pricing.ingredients` | `id` مرجع؛ `code` و `sepids` حفظ شوند |
| آیتم/رسپی | `pricing.menuItems/recipes/recipeVersions` | خط به menuItemId و ingredientId؛ نسخهٔ تاریخ‌دار |
| تأمین‌کننده | `suppliers.suppliers` | id و code هر دو در دادهٔ Legacy مصرف می‌شوند |
| تأمین قلم | `suppliers.supplierItems` | ingredientId به کاتالوگ؛ supplierCode/شناسه طبق رکورد موجود |
| خرید/پرداخت/رسید | `inventory` | UI در تأمین یا انبار؛ سند دوم نسازید |
| مقدار موجودی | baseline و دفتر `inventory` | balance خروجی محاسبه است؛ `trackedIngredients` کنترل/fallback قدیمی |
| پرسنل/حقوق/تنظیمات عمومی | `hr` در Client، `personnel` در Backend | personnelId به فرد؛ شناسه/نام تاریخی حفظ شوند |
| صندوق/تحلیل فروش | `cashreport` | reports با salesAnalytics یکی نیست |
| فروش برای مصرف انبار | `inventory.salesPeriods` | menuItemId و productionLocationId/نگاشت تولید |
| مقصد وجوه | `cashreport.transferAccounts/cashRecipients` | شناسهٔ حساب/شخص و snapshot مالک |
| مصرف/بازگرداندن وجه | `finance.entries` | custodyKind و account/recipient؛ به صندوق لینک معنایی دارد |
| بدهی عمومی/چک | `finance.obligations/settlements/checks` | از supplier debt جدا؛ منبع تأمین را کپی نکند |
| دارایی | `assets.assets` | دارایی بادوام با قلم کاتالوگ یکی نیست |

`suppliers.items` mirror/archive سازگاری است (`Deprecated` برای توسعهٔ مرجع جدید)، حذفش بدون migration مجاز نیست. تطبیق براساس نام یا شباهت نام، کلید رابطه نیست. ID موجود حتی در صورت تغییر نام ثابت می‌ماند. snapshotهای نام/کد/قیمت/واحد هنگام تغییر master بازنویسی نمی‌شوند.

## ۲. اسناد ماژول

آرایه/شیءهای ثبت‌شده در `MODULE_FIELDS` با نام دقیق زیرند. این فهرست **تمام دادهٔ مصرفی برنامه نیست**؛ extensionهای بعدی در جدول بعد آمده‌اند. برای Save فقط سند کامل Loadشده و معتبر قابل استفاده است.

| Client → Backend | شیءها | آرایه‌ها |
|---|---|---|
| `hr → personnel` | meta, lists, settings, salaryModel, floorMap | personnel, weeklyPlans, monthlyPlans, shiftRecords, monthlyAdjustments, tipGroups, penaltiesRewards, delays, payments, consumptions, leaves, leaveRequests, payrollClosures, staffingRequirements, holidays, changeLog |
| `suppliers` | meta, lists | suppliers, items, supplierItems, purchaseRequests, changeLog |
| `pricing` | meta, settings, lists | ingredients, menuItems, recipes, recipeVersions, priceHistory, ingredientPriceHistory, changeLog |
| `inventory` | meta, settings | trackedIngredients, periods, itemMappings, changeLog, purchaseInvoices, supplierPayments, stockReceipts, wasteRecords, wasteShiftDeclarations, consumptionRecords, salesPeriods, stocktakes, locations, openingBalances, inventoryMovements, periodClosures, operationalUsagePeriods, operationalConsumptionProfiles |
| `cashreport` | meta, settings, salesAnalytics | cashiers, transferAccounts, cashRecipients, reports, changeLog |
| `assets` | meta, settings, lists | assets, maintenanceRecords, quantityTransactions, assetIncidents, counts, changeLog |
| `finance` | meta, settings | entries, monthlyOverrides, changeLog |
| `survey` | meta, settings | responses, changeLog |
| `errorlog` | meta | entries |
| `sepidsaudit` | meta, settings | importBatches, rawBlocks, events, eventItems, changes, alerts, reviews, links |

| extension واقعی | شاهد | قاعده |
|---|---|---|
| HR: workViolations, protocols, checklistTemplates, checklistRecords | 23، 29 و Seed HR | حذف به‌دلیل نبود در MODULE_FIELDS ممنوع |
| HR: advanceRequests, reservations؛ پیام روز/شیفت در settings/ساختارهای مربوط | 22، 34 و 37 | دادهٔ operational؛ Reset نیز باید این بخش‌ها را بشناسد |
| HR: payments[].tipSettlement/tipAllocations | 00، 37 و `qa_tip_monthly_settlement.js` | هر allocation به tipGroupId؛ مبلغ پرداخت/گردکردن جدا |
| HR: personnel[].accommodation.equipment | 44 | وسایل تحویلی با type/quantity/deliveredAt/notes در پرونده |
| inventory.supplierDirectDebts | 42 | بدهی مستقیم/مانده اولیه، مستقل از stock receipt |
| finance.parties, obligations, settlements, checks | 20::ensure | فهرست‌های واقعی جاری با وجود نبود در MODULE_FIELDS |
| cashreport.salesAnalytics.daily/monthly/itemDaily | 24، 28 | object حاوی آرایه؛ Query collection می‌تواند مسیر نقطه‌ای داشته باشد |

Gateway با spread سطح بالا و merge شیءهای شناخته‌شده unknown fields را نگه می‌دارد؛ آرایه‌های شناخته‌شده را نرمال می‌کند. schema HR عمدتاً raw برگردانده می‌شود و `migrate` هسته آن را تکمیل می‌کند. نبود یا نوع نادرست یک آرایه ممکن است [] شود؛ این validation کامل یا اثبات completeness نیست. adapterها باید نتیجهٔ خطا/Query ناقص را از Load کامل جدا نگه دارند.

## ۳. فرهنگ رکوردها

الزام‌ها در این بخش الزام فرم/مصرف فعلی‌اند، نه validation عمومی Server. فیلدهای legacy اختیاری را با default حدسی به دادهٔ زنده ننویسید. برای تغییر هر ردیف، symbol تولیدکننده و مصرف‌کننده را با `rg` بررسی کنید.

### کاتالوگ و قیمت

| رکورد | فیلدهای مصرفی | اعتبار و سابقه |
|---|---|---|
| ingredients | id, code, name, category, itemType, recipeCapable, inventoryTracked, procurementEnabled, purchaseUnit, recipeUnit, packageQuantity, lastPurchasePriceToman, wastePercent, lastPurchaseDate, status, notes, sepids | مقدار بسته مثبت؛ افت `0 <= x < 100`؛ قیمت نامعلوم با صفر یکی نیست |
| کنترل سفارش قلم | reorderPoint, targetStock, usageLocation, orderOwner | صفر صریح معتبر؛ نبود مقدار با نبود نیاز سفارش یکی نیست؛ `RayoReorder` fallback trackedIngredients دارد |
| menuItems | id, code, name, category, currentPriceToman, customTargetCostPercent, manualCostToman, manualCostEnabled, status, siteStatus, lastPriceChangeAt, unit, notes, sepids | وضعیت سایت از فعال بودن عملیاتی جدا |
| recipes | id در دادهٔ فعلی، menuItemId, ingredientId, quantity, notes | مقدار خالص در recipeUnit؛ هر رابطه باید معتبر باشد |
| recipeVersions | id, menuItemId, effectiveFrom, lines, createdAt, createdBy, source | خطوط جدید snapshot wastePercent/recipeUnit دارند؛ نسخهٔ قدیمی بدون آن تخمینی است |
| ingredientPriceHistory | id, ingredientId, date, priceToman, source, createdAt؛ فیلدهای اختیاری packageQuantity, purchaseUnit, recipeUnit و ارتباط فاکتور/رسید | واحد قیمت بسته را با unitCost انبار مخلوط نکنید؛ void و منبع قیمت بررسی شوند |
| priceHistory | سابقهٔ قیمت منو؛ شناسه منو، تاریخ و قیمت‌های تغییر | تولیدکنندهٔ جاری در فایل 08 مرجع نام دقیق فیلدهای هر مسیر است |

شاهد: فایل‌های 08، 32، 42، 43، 45 و 47 و `qa_standard_preparation_loss.js`. فرمول افت و حفظ تاریخچه در [ضمیمه](STANDARD_PREPARATION_LOSS.md).

### خرید و موجودی

| رکورد | فیلدهای اصلی مشاهده‌شده | وضعیت/الزام |
|---|---|---|
| suppliers | id, code, name؛ گروه، اطلاعات تماس/حساب، orderDays, deliveryDays, deliveryTime, orderOwner، status | نام/شناسه مرجع؛ اطلاعات حساس در payload نمونه نیاید |
| supplierItems | supplierCode, ingredientId, itemCode, itemCodeSnapshot, itemNameSnapshot, lastPurchasePriceToman, deliveryTime, isPrimary | `isPrimary` در برخی داده‌ها رشتهٔ «بله» است؛ boolean فرض نشود |
| purchaseRequests | id, date، supplierId/supplierCode، lines در فرم جدید؛ فیلدهای تخت legacy نیز وجود دارند، status, notes, createdAt/updatedAt | وضعیت سفارش فارسی با فاکتور یکسان نیست؛ فرم‌های 42 و 22 مرجع‌اند |
| purchaseInvoices | id, supplierId, invoiceNumber, date, lines, status، paymentStatus، pricingSyncStatus | `draft/finalized/void` در مسیر جاری؛ lines دارای ingredientId, quantity, unitPrice؛ دادهٔ قدیمی شکل‌های دیگر دارد |
| supplierPayments | id, supplierId, invoiceId اختیاری، date, amount, method, paymentLocationId, paymentLocationNameSnapshot, reference, notes | amount در این مسیر تومان؛ شناسه محل پرداخت پایدار |
| supplierDirectDebts | id, supplierId, debtType, date، مبلغ/شرح و snapshot مبنا، status | تولیدکننده `saveDirectDebt` در 42؛ ابطال با دلیل، نه حذف |
| locations | id, code, name, type, section, isActive, notes | تعریف محل در Reset حفظ می‌شود تا FK تنظیمات معتبر بماند |
| stockReceipts | id, ingredientId, locationId, date, quantity, unitCostToman, totalPriceToman، invoiceId اختیاری، status، unitSnapshot/itemNameSnapshot/locationNameSnapshot | ورود مستقیم: یک Save inventory؛ قیمت catalog ثابت |
| inventoryMovements | id, ingredientId, type, quantity، مبدأ/مقصد مطابق نوع، date, sourceKey, referenceId, status | ارتباط رسید `sourceKey: receipt:<id>`؛ از دوباره‌شماری جلوگیری شود |
| stocktakes | id, date, locationId, status, lines، created/approved audit | lines: ingredientId, actual و قیمت اختیاری purchasePriceToman/unitCost؛ فقط approved baseline است |
| openingBalances | قلم، محل، تاریخ و مقدار/بها | ساختار legacy معتبر را حفظ؛ از شمارش تأییدشدهٔ جدیدتر عقب‌تر است |
| salesPeriods | id، بازه/تاریخ، کانال/منبع، lines | lines: menuItemId, quantity؛ چندروزه فاقد تفکیک برای forecast کافی نیست |
| wasteRecords/consumptionRecords | id، تاریخ، محل، قلم/نوع آیتم، مقدار، نوع مصرف/ضایعات، status/review و گزارش‌دهنده | pending پرسنلی تا تأیید اثر ندارد؛ مصرف مجاز از ضایعات جدا |
| periodClosures | id, from, to, status, metrics, lines | `closed` snapshot؛ بازهٔ دقیق منطبق از snapshot خوانده می‌شود |

انواع حرکت مصرف‌شده در هسته: PURCHASE_RECEIPT، TRANSFER، RETURN_TO_WAREHOUSE، WASTE، SPILL، EXPIRY، BREAKAGE، MISSING، STAFF_CONSUMPTION، MANAGEMENT_GUEST، TEST_CONSUMPTION، OTHER_AUTHORIZED، ADJUSTMENT. مصرف فروش مشتق از رسپی است و حرکت ذخیره‌ای دوم نیست. نام فیلد مبدأ/مقصد و انواع قدیمی را از `RayoInventoryV10` در فایل 32 بخوانید؛ این جدول DDL نهایی نیست.

`stockReceipts[].isArchived` اختیاری، نبود آن false است. voidReason/voidedAt/voidedBy و archivedAt/archivedBy/unarchivedAt/unarchivedBy سابقه‌اند. آرشیو، ابطال را برنمی‌گرداند. [قواعد دقیق رسید و شمارش](INVENTORY_RECEIPT_UI.md).

`operationalConsumptionProfiles`: id, ingredientId, locationId, active, unit, fixedQuantity, fixedDays, activityQuantity, activityBase, driver, menuItemIds, effectiveFrom, note, createdAt/By, updatedAt/By. driver فقط SOLD_ITEMS/SELECTED_ITEMS؛ ویرایش نسخهٔ افزایشی می‌سازد. settings شامل operationalForecastDays، operationalWarningDays و operationalCountMaxAgeDays است. [قرارداد کامل و نامشخص‌بودن داده](OPERATIONAL_CONSUMPTION_FORECAST.md).

### منابع انسانی

`personnel`: id, name, mainPosition, backupPosition, nationality, insurance, startDate, phone, employmentType, status, section، hourlyRate/قرارداد ثابت، transportMonthly, fixedAllowance, monthlyCredit, mealCredit, gradeId, experienceMonths, salaryProfile, personnelGroup, kitchenRank, subSection، فیلدهای بانکی، username, userPassword, userAccess. نام فیلدهای حساب را بدون مقادیر در فرم 23 و patchهای 05–07 بررسی کنید. رمز خام در معماری جاری وجود دارد؛ در مهاجرت نباید به‌عنوان مدل امنیتی هدف تکرار شود.

`staffingRequirements`: id, dayIndex, shift, section, subSection, position, requiredCount, active. ترکیب قدیمی ناسازگار حفظ و علامت‌گذاری می‌شود. برنامهٔ هفتگی/ماهانه دارای assignmentهای تو‌در‌توست؛ schema flat ساختگی جای آن نگذارید. `shiftRecords`، تعدیلات، تأخیر، پرداخت، مصرف و مرخصی به personnelId و دوره/تاریخ وصل‌اند. فرم‌های 00–03 و 41 مرجع اجزای واقعی‌اند.

`tipGroups`: id, receiveDate, totalAmount، نوع/گروه/شرکت‌کننده و وزن‌ها، status، مقادیر تسویهٔ legacy. `payments[].tipAllocations` شامل tipGroupId و paidAmount است؛ `tipSettlement` این پرداخت را از حقوق جدا می‌کند. تسویهٔ قدیمی فاقد لینک از روی نام یا مبلغ حدس زده نمی‌شود. شاهد: `effectiveSettled`، فایل 37 و QA انعام.

`salaryModel` ضرایب و پایه‌های سالانه و draft دارد؛ `payrollClosures` snapshot دوره و ردیف‌های حقوق را نگه می‌دارد. پروتکل/چک‌لیست/تخلف/رزرو/مساعده extensionهای HR هستند. نبود نمونهٔ پر در Seed، نبود قابلیت را اثبات نمی‌کند.

### صندوق، وجوه و مالی

`cashreport.reports`: id, date, cashierId، نام تاریخی صندوقدار، مبالغ فروش/خالص/کارتخوان/کارت‌به‌کارت/نقد/انعام، otherTransactions، managementReviewStatus/managementNote/reviewedAt/reviewedBy و snapshot مقصد. نام دقیق همهٔ کانال‌های مبلغ از `crReadAdminForm` و `RayoCashVariance` استخراج شود؛ واحد همهٔ مبالغ خام این فرم ریال است.

`transferAccounts`: id, name, status, notes و ownerRecipientId/bankName/cardNumber اختیاری. `cashRecipients`: اشخاص مرجع با شناسه/نام/وضعیت. reports دارای cardToCardOwnerIdSnapshot/cardToCardOwnerNameSnapshot و snapshot حساب/تحویل‌گیرنده‌اند. مالک صریح خالی نباید به مالک جدید نسبت داده شود.

`finance.entries` در مسیر وجوه: id, date, type, custodyKind, amountToman، شناسه و نام حساب/تحویل‌گیرنده، snapshot مالک، title/notes و audit؛ type/custodyKind یکی از expense، personalWithdrawal، custodyReturn. ویرایش `revisions` می‌سازد و void علت/زمان/کاربر دارد. [جزئیات معنایی](CASH_CUSTODY_AND_DESTINATIONS.md).

`finance.obligations`: id، direction (payable/receivable)، partySource/partyId، title، category، amountToman، date، dueDate، entryType (normal/opening)، period، reference، description، status/audit. `settlements`: id, requestId, obligationId, direction, date, amountToman, method, notes, status, createdAt. `checks`: id, obligationId, type, number, bank, amountToman, issueDate, dueDate, partySource, partyId, status, notes, createdAt. pending چک تسویه نیست؛ `calcObligation` مانده و بخش بدون پوشش را محاسبه می‌کند. این مدل double-entry ledger رسمی نیست.

### اموال، نظرسنجی، ممیزی و خطا

`assets.assets`: id, itemId, trackingMode, assetTag, name, category, location, unit, brand, model, serialNumber, purchaseDate, purchaseCost, baseUnitPriceToman, pricingGroup, annualDepreciationRate, valuationQuantity, aggregateRecord, warrantyUntil, nextServiceDate, initialQuantity, minimumRequired, status, notes, createdAt/updatedAt, isArchived و metadata منشأ. تعمیر، تراکنش تعداد، count و incident به دارایی وصل‌اند؛ فایل 12 مالک schema عملی است.

ارزش‌گذاری جاری در `amAssetValuation`: قیمت مبنا از `valuationBaseUnitPriceToman` سپس `baseUnitPriceToman` سپس `purchaseCost`؛ نسبت ارز از `settings.currentExchangeRateToman / settings.baseExchangeRateToman`؛ ضریب استهلاک `max(0, 1 - rate × elapsedFullYears)` از `settings.valuationBaseDate`. نرخ به ترتیب override معتبر `annualDepreciationRate`، گروه در `settings.depreciationRates`، `sourceAnnualDepreciationRate` و در نهایت ۰٫۱۰ است. مقدار دارایی تعدادی از `amCurrentQuantity` و دارایی شماره‌دار/تجمیعی از `amValuationQty` می‌آید. ارزش واحد و سپس کل گرد می‌شوند؛ قیمت تاریخی با تغییر ارز بازنویسی نمی‌شود. fallback کد برای ارز مبنا ۱۹۰٬۰۰۰ تومان و تاریخ مبنا `1405/05/20` است؛ این‌ها نرخ بازار یا الزام دادهٔ زنده نیستند. اعداد ۹۴٬۰۰۰/۱۸۸٬۰۰۰ و «یک سال ثابت» متعلق به سند تاریخی‌اند و مبنای اجرای جاری نیستند.

`survey.responses` شامل مشخصات مشتری/تماس، مرجع فاکتور/اقلام، service channel، رضایت، علت و پیگیری مدیر است؛ فایل 21/22 مرجع نام دقیق فیلدهای فرم‌اند. خروجی تماس حساس است و نمونهٔ واقعی اینجا نمی‌آید.

`sepidsaudit` سلسلهٔ import batch→raw block→event→eventItems/changes/alerts→reviews/links دارد. کلید منطقی رویداد و hash خام دو مفهوم مستقل‌اند. هیچ linkage قطعی به invoice فروش بدون دادهٔ مناسب فرض نشود؛ parser فایل 33 و قالب‌های templates مرجع‌اند.

`errorlog.entries`: id, at, localTime, message, stack, url, user, context, severity؛ فایل 31 آخرین ۱۰۰۰ مورد را نگه می‌دارد. پاک‌سازی جامع PII در این پیاده‌سازی تأیید نشده است. auditهای Client با هویت session قابل تغییر، audit قابل اتکای سروری نیستند.

## ۴. مبالغ، تاریخ، وضعیت و dropdown

- مبالغ معمول pricing/inventory/finance/assets تومان‌اند؛ cash report ورودی ریال دارد و برای نمایش/گردش ÷۱۰ می‌شود. raw import sourceCurrency را حفظ کنید؛ واحد هر فیلد باید روشن باشد.
- تاریخ کسب‌وکار عمدتاً شمسیِ صفرپر `YYYY/MM/DD`، برخی importها فشرده و audit timestampها ISO-8601 هستند. sort متنی فقط با قالب همگن معتبر است. `0000/00/00` در نسخه‌های رسپی Legacy sentinel است، نه تاریخ واقعی قابل ساختن در فرم تازه.
- quantity در واحد مصرف/موجودی و packageQuantity نسبت صریح بسته است؛ تبدیل جرم به حجم بدون ضریب معتبر ممنوع. اعداد فارسی/عربی و اعشار فارسی در مسیرهای اصلاح‌شده پشتیبانی می‌شوند؛ تمام Legacyها parser یکسان ندارند.
- status عمومی واحد نداریم: فعال/غیرفعال، posted/void، draft/finalized، approved، closed، pending و وضعیت‌های فارسی سفارش/بازبینی بسته به entity. archive با `isArchived` یا `IsArchived` نیز دیده می‌شود. تغییر case یا یکسان‌سازی نیازمند migration است.
- masterهای dropdown: HR.lists و settings؛ pricing.lists برای دسته/واحد و کاتالوگ برای قلم؛ suppliers.lists برای گروه/روش؛ inventory.locations و inventory.settings.paymentLocations؛ cashreport.transferAccounts/cashRecipients؛ assets.lists و survey.settings. ابزار انتخابگر مشترک `RayoSearchPicker` در 43 است؛ **سرویس مرکزی واحد برای همهٔ dropdownها وجود ندارد**.

## ۵. قرارداد HTTP فعلی

ریشه از `RAYO_ENV.API_ORIGIN + API_PREFIX + API_CONTROLLER` ساخته می‌شود. تعریف‌های دقیق در [Gateway](../js/config.js) و [Controller مرجع](../backend-prefrence/RayoDataController.optimized.cs) موجود است.

| درخواست | module کجاست؟ | بدنه/نتیجه |
|---|---|---|
| `GET /api/v1.0/RayoData/Load?module=personnel` | query؛ Client hr به personnel تبدیل می‌شود | سند کامل؛ `_` برای cache bust |
| `POST /api/v1.0/RayoData/Save?module=inventory` | query | سند کامل JSON؛ Server مرجع JToken می‌پذیرد |
| `POST /api/v1.0/RayoData/Query` | JSON body | یک collection، فیلتر/تاریخ/sort/page |
| `POST /api/v1.0/RayoData/Mutate` | JSON body | insert/update/upsert/archive یک رکورد |

کامنت ابتدای config دربارهٔ querystring اجباری برای همهٔ درخواست‌ها با اجرای واقعی Query/Mutate منطبق نیست؛ کد ارسال body مرجع است. headerهای POST، `Content-Type: application/json; charset=utf-8` و Accept هستند؛ `credentials:'omit'`، timeout و AbortController مصرف می‌شوند.

Load پاسخ شیء، JSON-stringشده، envelopeهای data/result/value و aliasهای ماژول را باز می‌کند. 500 یک retry پس از ۷۰۰ms دارد؛ خطای دیگر به bootstrap نمی‌رود. `{}` یک ماژول خالیِ initialized=false است؛ وجود صرف defaults مجوز Save نیست.

Save عادی به Load موفق/ready و initialized=true نیاز دارد، به استثنای مسیرهای صریح Initialize و errorlog. meta.serverSaveToken و updatedAt اضافه و پس از POST، GET در فاصله‌های ۵۰۰/۱۵۰۰/۳۰۰۰ms کنترل می‌شود. token/time تأیید نسخه است؛ verify موفق بدون مقایسهٔ فیلدها تضمین عدم حذف DTO نیست. برخی مسیرهای حساس، محتوای فیلدها را نیز مقایسه می‌کنند. `verify:false` و allow* گزینه‌های داخلی محدودند و الگوی توسعهٔ عادی نیستند.

### Query — نمونهٔ ساختگی مطابق serializer و QA

```json
{
  "module": "personnel",
  "collection": "tipGroups",
  "filters": {},
  "dateField": "receiveDate",
  "from": "1405/06/01",
  "to": "1405/06/31",
  "sortBy": "receiveDate",
  "descending": true,
  "includeArchived": false,
  "page": 1,
  "pageSize": 100
}
```

```json
{"items":[],"page":1,"pageSize":100,"total":0,"totalPages":0,"version":7,"updatedAt":"2026-09-19T00:00:00Z"}
```

صفحه از ۱، اندازه پیش‌فرض ۱۰۰ و حداکثر ۵۰۰ است. filters در Controller برابری‌اند، نه query language یا جست‌وجوی دلخواه. بازهٔ تاریخ شامل ابتدا/انتها و مقایسه متنی است؛ sort تک‌فیلدی است. collection نقطه‌ای مجاز است؛ نبود collection پاسخ خالی دارد. archive از `IsArchived` با خواندن case-insensitive شناخته می‌شود. کل سند در Server مرجع از فایل خوانده و در حافظه فیلتر می‌شود؛ pagination به معنی query دیتابیس نیست.

Queryهای همسان در حال اجرا در Gateway deduplicate می‌شوند. version ماژول نگهداری می‌شود؛ Query نه snapshot کامل تولید می‌کند و نه initialized را اثبات می‌کند. گزارش وجوه تغییر version میان صفحات را رد می‌کند؛ همهٔ readerهای Legacy این کنترل را ندارند.

### Mutate — نمونهٔ ساختگی، اجرا نشود

```json
{
  "module": "personnel",
  "collection": "tipGroups",
  "operation": "archive",
  "recordId": "QA-TIP-001",
  "idField": "id",
  "expectedVersion": 7,
  "requestId": "00000000-0000-4000-8000-000000000001",
  "data": {}
}
```

Gateway idField را پیش‌فرض `id` می‌گذارد؛ DTO مرجع پیش‌فرض `RecordID` دارد. recordId/requestId/expectedVersion در Server لازم‌اند. version باید از Query معتبر (یا Load دارای version واقعی) بیاید؛ **Load Controller موجود raw JSON می‌دهد و نسخهٔ metadata را در envelope اضافه نمی‌کند**، پس Load همیشه نسخهٔ قابل استفاده برای Mutate نمی‌دهد.

update/upsert در Controller با MergeArrayHandling.Replace و MergeNullValueHandling.Merge انجام می‌شوند: آرایهٔ فرزند جایگزین و null صریح merge می‌شود. رکورد کوچک ناقص را بدون بررسی semantics به update ندهید. archive فقط IsArchived/UpdatedAt را می‌نویسد؛ همهٔ data همراه درخواست archive لزوماً ثبت نمی‌شود. audit سروری مرجع CreatedAt/UpdatedAt با نام PascalCase دارد و ممیزی actor کامل ندارد.

requestId تکراری در فهرست ۲۰۰ مورد اخیر بدون اجرای دوباره پاسخ duplicate می‌گیرد؛ این تضمین idempotency نامحدود/تراکنشی نیست. داده و metadata جدا نوشته می‌شوند و قفل process-local است. تعارض version با HTTP 409 رد می‌شود؛ Gateway همهٔ 409های Mutate را version_conflict معرفی می‌کند، حتی وقتی Server علت دقیق دیگری مانند record_exists داده باشد.

### خطا و snapshot ناقص

`RayoApiError`: status, code, message, response, url, method و cause اختیاری. خطاهای Client: timeout، request_aborted، network_error، empty_response، invalid_json، invalid_query_response، version_unavailable. خطاهای Server مرجع: unknown_module، data_not_found، invalid_server_json، read_failed/save_failed/query_failed/mutation_failed، invalid_collection، record_not_found، record_exists و version_conflict.

```json
{"code":"version_conflict","message":"Server data changed after this collection was loaded. Query again before retrying.","expectedVersion":7,"currentVersion":8}
```

مسیر ایمن توسعه: Load کامل معتبر→clone با حفظ unknown fields→تغییر محدود→Save→Load و مقایسه؛ یا Query→Mutate رکورد→Query مجدد. **هرگز** items یک صفحه یا state حاصل از Load ناموفق را با Save کامل نفرستید. guard Gateway به‌تنهایی completeness، همهٔ FKها یا هم‌زمانی Save قدیمی را تضمین نمی‌کند. تعارض و نتیجهٔ نامطمئن نیاز بازخوانی/تصمیم‌اند، نه retry با شناسهٔ تازه یا overwrite خودکار.

## ۶. Seed، منشأ و migration

| فایل seed | نقش و محتوای اولیهٔ بررسی‌شده |
|---|---|
| personnel-data.seed.json | ۱۲ پروندهٔ اولیه و مدل/فهرست HR؛ اطلاعات شخصی آن اینجا تکثیر نشده |
| pricing-data.seed.json | ۶۱۵ قلم، ۳۷۹ منو، ۹۱۲ خط رسپی، ۵۳۱ تاریخچه قیمت ماده |
| suppliers-data.seed.json | ۶۱۵ mirror قلم؛ suppliers/supplierItems اولیه خالی |
| inventory-data.seed.json | ۵ محل و تنظیمات؛ آرایه‌های عملیات اولیه خالی |
| cash-report-data.seed.json | ۲ صندوقدار اولیه، reports/مقاصد خالی و تنظیمات |
| assets-data.seed.json | ۱۹۰ نوع دارایی تجمیعی؛ تاریخچه عملیات اولیه خالی |
| finance-data.seed.json | تنظیمات/فهرست و سند مالی خالی |
| survey-data.seed.json | فهرست رضایت/کانال و responses خالی |
| error-log-data.seed.json | schema خالی لاگ؛ وجود فایل به معنی Seed در خطای Load نیست |
| sepids-audit-data.seed.json | تنظیم ممیزی و هشت collection خالی |

`seed/manifest.json` منشأ و build تاریخی است، نه manifest انتشار جاری. منشأ قیمت/منو، فایل‌های `seed/source-excel/انواع کالای خام.xlsx`، `آیتمهای منو.xlsx` و رسپی `Junction.xlsx` است. فایل‌های `archive/kham_v9_5_3.xlsx` و `Item_v9_5_3.xlsx` تاریخی‌اند. گزارش قدیمی از ۵۳۶ کد سپیدز و ۷۹ قلم اضافه سخن می‌گفت؛ معیار مهاجرت زنده باید ID/code خود export باشد، نه الزام تعداد ثابت Seed. قیمت منشأ سپیدز ریال و Seed pricing تومان است. رسپی‌های جدید از فایل ناموجود اختراع نشده‌اند؛ `recipeSeedWins:false` تاریخی برای حفاظت ویرایش‌هاست.

`loadOrBootstrap` و `applySeedMigration` اکنون هیچ Seed/Save خودکاری انجام نمی‌دهند. migrationهای normalization ممکن است در حافظه شکل داده را تکمیل کنند؛ نوشتن فقط در اقدام صریح است. برای کاتالوگ، `RayoCatalogV1010` پیش‌نمایش/Backup و Save ترتیبی pricing سپس suppliers و rollback جبرانی دارد؛ [راهنمای عملیات](../MIGRATION_GUIDE_v10_10_0.md). `scripts/merge-pricing-into-supplier-seed.js` ابزار تاریخی Seed است، نه راه‌حل Load یا منبع master.

Initialize، Reset همهٔ جداول، Restore JSON مخصوص Reset و ZIP عمومی Backup عملیات متفاوت‌اند. راهنمای [Reset/Restore](SETTINGS_SEPARATION_AND_TABLE_RESET.md) مرجع است. پاک‌سازی مستندات هیچ‌کدام را اجرا نکرده و به JSON عملیاتی، DTO، schemaVersion، ID، کد سپیدز یا دادهٔ زنده دست نزده است؛ manifest پالایش فقط metadata مستندات است.
