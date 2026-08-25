# QA Report — Rayo Admin v10.3.0

## وضعیت
نسخه برای تحویل Static / Contract / Isolated Runtime آماده است. مرورگر واقعی روی Backend هاست از محیط فعلی قابل Navigation کامل نیست؛ بعد از Deploy یک Smoke Test واقعی Save/Load توصیه می‌شود.

## Static QA
- JavaScript: **39/39 PASS** (`node --check`)
- JSON: **11/11 valid**
- HTML pages: **15**
- Local HTML src/href references: **372 checked / 0 missing**
- همه HTMLها: cache version **10.3.0**
- `js/app-config.js`: build **10.3.0**

## Sidebar / Routing QA
- MENU مشترک (`17-v9-3-admin-enhancements.js`) و MENU صفحه مستقل Sales (`28-sales-analysis-page-v9-6-1.js`) از نظر ساختار **Exact Match** هستند.
- Sidebar صفحه فروش دیگر Inventory submenu قدیمی ندارد.
- «انبار و کنترل مصرف» یک لینک واحد است.
- `inventory.html` فایل `36-final-inventory-consolidation-v10-3.js` را بعد از v10.2 Load می‌کند.

## Isolated Runtime — Final Inventory View
Mock runtime روی `36-final-inventory-consolidation-v10-3.js` اجرا شد:
- Final marker `__v103final`: **PASS**
- Build dataset `10.3.0`: **PASS**
- 12/12 Inventory tabs در همه Tabها: **PASS**
- Old inventory tabs removed: **PASS**
- Snapp sales visible on Sales tab: **PASS**
- Stocktake last purchase price visible: **PASS**
- Workflow pane: **PASS**
- Receipts pane: **PASS**
- Variance report pane: **PASS**

## Inventory Logic Contracts
- Snapp is stored in `inventory.salesPeriods` with `salesSource/source = SNAPP`.
- Inventory standard sale consumption iterates all active `salesPeriods`; therefore Snapp flows through the same recipe/location consumption engine.
- Stocktake price updates ingredient last price and `ingredientPriceHistory` (`stocktake-entry`).
- Valuation page uses current calculated stock × valid unit cost.
- Variance report includes quantity/value loss and personnel waste report.
- Waste reports submitted by personnel remain pending until manager review.

## Previous-request regression checklist
Verified in final source:
- Recipe unit / purchase unit visibility.
- Personnel list access cleanup; permissions kept in access management.
- Input-select placeholder installer.
- Cash report after payroll; pricing after cash report; inventory after pricing.
- Sepidz Audit and reports pages remain separate destinations.
- Corporate drinks exclusion rules retained.
- Purchase/accounting separated from physical receiving.
- Supplier account tab normalization retained.
- Manager daily message and shift-day message retained.
- Personnel profile 1/3/6/12 month summary retained.
- Violation with or without fine retained.
- Advance requests retained.
- Reservations/deposits retained.
- `اتمام همکاری` status retained.
- Staff prev/next week, section filter, Back, tips, payments, leave, violations/rewards retained.
- Inventory-count permission retained.
- Login Show Password retained.
- Cash-report duplicate/future-day lock retained.
- Per-module reset retained.
- One-time asset Rial→Toman migration retained.
- Waste/Sales and Waste/Material ratios retained.
- Mobile capped modal and Jalali responsive rules retained.
- Import-button runtime dedupe retained.

## Known limitation
No web application can reliably prevent OS-level screenshots. No fake screenshot-block feature is claimed.
