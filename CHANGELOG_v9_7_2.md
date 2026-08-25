# CHANGELOG v9.7.2 — Asset Valuation

## Scope
Only the Assets module and its Excel importer were changed. No other operational module was functionally modified.

## Changes
- Loaded the Rayo master asset catalogue into `seed/assets-data.seed.json` with 190 stable ItemIDs (`ITM-0001` … `ITM-0190`).
- Added one-time migration `assets-rayo-master-1405-v1` so existing API data is merged rather than blindly replaced.
- Added current valuation settings:
  - base USD rate: 94,000 Toman
  - current USD rate: 188,000 Toman
  - depreciation application period: 1 year by default
  - annual depreciation rates by pricing group
- Added dynamic valuation calculation from historical base price, FX ratio and depreciation.
- Depreciation rates are controlled by pricing group. A per-asset override exists only when the manager explicitly sets one.
- Added current unit value and total current value to the asset list and asset detail view.
- Added valuation summary and FX parameters to the Assets dashboard.
- Expanded the asset edit form with ItemID, base price, pricing group, optional depreciation override, valuation quantity and source fields.
- Expanded the Excel importer to understand the actual Rayo master asset workbook headers and upsert primarily by ItemID.
- The workbook's aggregate count of 405 active asset tags is retained as source metadata. Individual tag rows were not synthesized where the binary tag sheet was unavailable to the runtime package.

## Default valuation formula
`Current Unit Value = Base Unit Price × (Current FX / Base FX) × max(0, 1 - Annual Depreciation Rate × Depreciation Period)`

## Calculated initial snapshot
- Asset types: 190
- Priced asset types: 178
- Zero-price asset types: 12
- Historical aggregate base value: 43,156,000,000 Toman
- Calculated current aggregate value at USD 188,000 and default depreciation settings: 74,757,300,000 Toman

## Version/cache
- `12-rayo-assets-module.js?v=9.7.2`
- `19-phase2-admin.js?v=9.7.2`
- `seed/manifest.json` build: `9.7.2`
