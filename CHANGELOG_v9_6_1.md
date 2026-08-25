# Rayo Admin v9.6.1 — Sales Analytics Excel Fix

## Scope
Only the «تحلیل گزارش فروش» workflow was changed.

## Changes
- Added a dedicated `sales-analysis.html` page so HR/payroll reports cannot leak into Sales Analytics.
- Sidebar item `فروش → تحلیل گزارش فروش` now opens `sales-analysis.html`.
- Legacy `reports.html?view=salesAnalysis` redirects to the dedicated page.
- The page accepts only the four supplied Sepidz Excel formats:
  1. فروش به تفکیک تاریخ
  2. فروش به تفکیک ماه
  3. ریز فروش یک روز
  4. گزارش فروش یک کالا به تفکیک تاریخ
- Daily and monthly charts use receipt counts (کل، حضوری، سالن، مشترکین), not Rial sales values, for trend/growth analysis.
- Year-over-year comparison is rendered only when at least two years exist for the selected month.
- `ریز فروش یک روز` adds missing `item + date` history records for all matched menu codes. The date is entered separately because the supplied file has no date column.
- `گزارش فروش یک کالا...` adds only missing dates for the selected item.
- Existing records are not overwritten or deleted on repeated imports.

## Unchanged
- No CSS changes.
- No changes to personnel, payroll, shift, inventory, purchasing, finance, access management, or cash-report logic.
