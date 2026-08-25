# Rayo Admin v10.5.0 — Changelog

## Bug fixes
- Fixed `ReferenceError: ingredientUnit is not defined` in `32-inventory-cost-control-v10.js`.
- Fixed Jalali/date fields being incorrectly detected and formatted as monetary inputs.
- Added cleanup for previously mis-marked `data-v102-money` inputs when the field is actually a date.

## Sales feature changes
- Snapp sales now support `از تاریخ` / `تا تاریخ`.
- Added Snapp Excel import using the daily-sales compatible column mapping.
- Excel rows with dates are stored as daily SNAPP sales periods.
- Duplicate/overlapping active Snapp dates are blocked.
- Manual menu sales show calculated row amount (`quantity × current menu price`).
- Manual Snapp sales show calculated row amount and form total.

## Build / deploy
- Build and cache version updated to `10.5.0` across HTML entry points and active UI patches.
- Package remains flat-deploy compatible.

## Documentation
- Added `RAYO_ADMIN_PROJECT_HANDOFF_v10_5_0.md` as the comprehensive handoff document for a new chat/AI/developer.
