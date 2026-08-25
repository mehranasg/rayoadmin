# Inventory & Cost Control — Rayo Admin v10.0.0

## Source of Truth

از نسخه 10، توسعه جدید انبار بر مدل عملیاتی زیر متمرکز است:

- `locations`
- `openingBalances`
- `inventoryMovements`
- `purchaseInvoices`
- `stockReceipts`
- `wasteRecords`
- `consumptionRecords`
- `salesPeriods`
- `stocktakes`
- `periodClosures`

ساختار Legacy `periods/adjustments` برای سازگاری داده قدیمی حذف فیزیکی نشده، اما قابلیت‌های جدید روی Ledger بالا توسعه یافته‌اند.

## Locationهای اولیه

- انبار اصلی
- آشپزخانه
- بار
- قلیان
- سالن / سرویس

Locationها قابل ویرایش/افزودن هستند و هر آیتم منو می‌تواند `productionLocationId` داشته باشد.

## Ledger حرکات

نوع‌های اصلی:

- `PURCHASE_RECEIPT`
- `TRANSFER`
- `RETURN_TO_WAREHOUSE`
- `WASTE`
- `SPILL`
- `EXPIRY`
- `BREAKAGE`
- `MISSING`
- `STAFF_CONSUMPTION`
- `MANAGEMENT_GUEST`
- `TEST_CONSUMPTION`
- `OTHER_AUTHORIZED`
- `ADJUSTMENT`

مصرف فروش به‌صورت Derived از `salesPeriods + recipeVersions + productionLocationId` محاسبه می‌شود و برای جلوگیری از دو بار کم‌شدن، Movement فیزیکی مستقل برای SALE_CONSUMPTION ذخیره نمی‌شود.

## معادله موجودی

برای هر ماده و Location، محاسبه از آخرین شمارش تأییدشده یا Opening Balance شروع می‌شود:

`Expected = Baseline + Movement In - Movement Out - Standard Sales Consumption`

شمارش تأییدشده Baseline جدید می‌شود. Adjustment ناشی از شمارش برای Audit Trail ذخیره می‌شود، ولی چون شمارش همان تاریخ Baseline است، دوباره در موجودی محاسباتی اعمال نمی‌شود.

## Recipe Versioning

`pricing.recipeVersions[]` شامل:

- MenuItemID
- EffectiveFrom
- CreatedAt / CreatedBy
- Source
- Lines[]

فروش هر تاریخ با آخرین نسخه‌ای که `EffectiveFrom <= SaleDate` است محاسبه می‌شود.

در Migration اولیه، رسپی‌های موجود با `EffectiveFrom = 0000/00/00` Snapshot می‌شوند؛ این فقط وضعیت فعلی رسپی را حفظ می‌کند و تاریخچه‌ای را که قبلاً ثبت نشده بازسازی نمی‌کند.

## Costing

روش عملی نسخه 10: **Weighted Average / میانگین موزون دوره‌ای**.

برای هر ماده در بازه:

- Opening Quantity × Opening Unit Cost
- خریدهای دوره با Unit Cost واقعی Receipt
- Weighted Unit Cost
- Closing Quantity × Weighted Unit Cost

`Actual COGS = Opening Value + Purchases - Closing Value`

و سپس:

`Unexplained = Actual COGS - Standard Sales COGS - Registered Waste - Authorized Consumption`

اثر تغییر قیمت خرید جداگانه (`priceEffect`) گزارش می‌شود تا تورم با کسری فیزیکی مخلوط نشود.

## Cycle Count

برای هر ماده می‌توان تعریف کرد:

- DAILY / WEEKLY / MONTHLY
- Location پیش‌فرض
- Tolerance درصدی
- شمارش‌کننده‌های مجاز
- تأییدکننده‌ها

پرسنل Blind Count ثبت می‌کند و مقدار Expected قبل از Submit به او نمایش داده نمی‌شود. شمارش Submitted باید توسط مدیر Approve/Reject شود.

## Permissionهای جدید پرسنل

- `inventoryWaste`
- `inventoryConsumption`
- `inventoryTransfers`
- `inventoryCounts`

## بستن دوره

Snapshot دوره شامل KPIها و خطوط ماده است تا گزارش بستن دوره با تغییرات آینده UI/قیمت جابه‌جا نشود. اعتبار COGS واقعی به پوشش Count پایان دوره وابسته است و درصد Coverage در صفحه نمایش داده می‌شود.
