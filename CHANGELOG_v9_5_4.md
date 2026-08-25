# CHANGELOG — Rayo Admin v9.5.4

## Personnel account
- Username/password/permissions removed from Add/Edit Personnel form.
- Dedicated `نام کاربری / رمز` action remains in Personnel List and opens a separate popup.
- Removed the old Phase 2 fallback injector so account fields cannot return to the personnel edit form.
- Staff login now requires both employment `status === فعال` and `userAccess.enabled === true`.
- Existing staff session is invalidated if the personnel becomes inactive or panel access is disabled.

## Leave requests
- Added independent `درخواست‌های مرخصی` item under `مدیریت پرسنل`.
- Admin can approve or reject requests.
- Rejection requires a reason (`managerNote`).
- Staff panel displays request status and manager response/rejection reason.
- Approved requests continue to create a real leave record only once.

## Shift menu
- `برنامه هفتگی` is now first under `مدیریت شیفت پلن`.
- `برنامه ماهانه` is second.

## Pricing / initial Sepidz data
- Updated Pricing seed from the newly supplied `انواع کالای خام.xlsx` and `آیتمهای منو.xlsx`.
- Source Rial prices are converted to Toman (`÷10`).
- 536 ingredients, 379 menu items, 531 ingredient price-history rows.
- Existing 912 valid recipe lines are retained because no new recipe workbook was present in this request's attachments.
- New migration ID: `pricing-sepids-master-1405-05-19-v2`.
- `recipeSeedWins=false` prevents the migration from overwriting recipe edits already stored in Runtime API data.
- Manual CRUD for menu items, ingredients and recipe lines remains available.

## Sales analytics
- Added sales analytics section to existing `reports.html`, without replacing the previous management reports.
- Imports the supplied Sepidz formats:
  - sales by date
  - sales by month
  - one-item sales by date
- Compact Jalali date normalization supported (`14050501` → `1405/05/01`, `140601` → `1406/01`).
- Import is additive/idempotent: existing dates/months/item+date keys remain and only missing records are added.
- Charts use receipt counts: total, in-person, hall, subscribers.
- Rial sales amounts are retained only as source/reference values and are not used as the growth/decline metric.
- Same-month YoY comparison and growth/decline percentage are shown when at least two years exist.
- Sales analytics is stored under `cashreport.salesAnalytics`; no new Backend module is required.

## Design
- Main stylesheet is byte-identical to v9.5.3.
- No new CSS file was added.
- Existing classic RTL visual system and page structure are retained; only requested menu/functionality changes were made.
