# QA Report — Rayo Admin v9.6.1

## Scope
Only `فروش → تحلیل گزارش فروش` was changed. No CSS or unrelated module logic was changed.

## Root cause fixed
`reports.html?view=salesAnalysis` still lived inside the general management/HR reports runtime. That page can be wrapped/overridden by legacy report functions, including payroll forecast cards. Sales Analytics is now a dedicated page (`sales-analysis.html`) that does not load those HR/report scripts.

## Exact Excel formats verified
The four user-supplied workbooks were inspected directly:

1. `فروش به تفکیک تاریخ(1).xlsx`
   - 17 data rows
   - Columns mapped: total receipt count, total amount, in-person count/amount, hall count/amount, subscriber count/amount, Jalali date.
   - Sample date format `14050501` is normalized to `1405/05/01`.

2. `فروش به تفکیک ماه(1).xlsx`
   - 8 data rows
   - Same count/channel mapping as daily report.
   - Sample month format `140601` is normalized to `1406/01`.

3. `ریز فروش یک روز.xlsx`
   - 54 unique item rows
   - Columns mapped: total price, unit price, count, item code, item name (name is in column G without a header).
   - File contains no date column; the page therefore requires one date input next to this importer.
   - All 54 item codes in the supplied example exist in the current 379-item pricing seed.

4. `گزارش فروش یک کالا به تفکیک تاریخ (گزارش مدیریتی)(1).xlsx`
   - 17 data rows
   - Columns mapped: total amount/count, cafe count/amount, hall count/amount, subscriber count/amount, Jalali date.
   - Dates such as `1405/05/1` normalize to `1405/05/01`.

## Functional behavior
- Daily trend chart: total, in-person, hall, subscriber receipt counts.
- Monthly trend chart: total, in-person, hall, subscriber receipt counts.
- Year-over-year chart appears only when at least two years exist for the selected month.
- Item history chart supports the single-item history file.
- One-day detail file adds missing `menuItemId + date` records to item history.
- Re-import never overwrites existing daily/monthly/item-date records; only missing keys are added.
- Rial amounts are stored for reference but are not used as the main growth/decline metric.

## Regression checks
- `css/style.css` SHA-256 is identical to v9.6.0.
- All JavaScript files pass `node --check`.
- All JSON files parse successfully.
- The new page contains no payroll forecast content.
- Legacy URL `reports.html?view=salesAnalysis` redirects to `sales-analysis.html`.
