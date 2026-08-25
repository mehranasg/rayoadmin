# QA REPORT v9.7.2 — Asset Valuation

## Result
PASS for static/runtime checks available in this environment.

## Source/data checks
- Seed asset types: 190
- Stable ItemID range: `ITM-0001` … `ITM-0190`
- Base FX: 94,000 Toman
- Current FX: 188,000 Toman
- Depreciation groups: 7
- Source active-tag aggregate retained in metadata: 405
- Calculated current aggregate valuation: 74,757,300,000 Toman

## Runtime valuation tests
- Fresh 190-record seed normalization: PASS
- ITM-0001 at 100m base, 10% dep, FX 188/94 → 180m: PASS
- Group depreciation setting change dynamically affects imported assets: PASS
- Explicit per-asset depreciation override takes precedence: PASS
- One-time migration merges into existing API state and stamps migration ID: PASS
- Existing asset identity/tag survives merge test: PASS

## Syntax/data validation
- JavaScript: 32/32 files pass `node --check`.
- JSON: 9/9 seed JSON files parse successfully.

## Regression controls
- CSS SHA-256: `24d0591fc19969623f19172b1de09477bc897053cec08312583946297ba7af84` and identical to v9.7.1.
- Functional JS changes limited to:
  - `js/12-rayo-assets-module.js`
  - `js/19-phase2-admin.js` (asset Excel importer only)
- Management HTML files differ from v9.7.1 only in cache query versions for those two JS files.
- No substantive HTML layout changes detected after normalizing cache versions.

## Known limitation
The source workbook reports 405 active numbered asset tags, but this package does not fabricate the individual 405 tag rows from partial parsed source data. The accurate source aggregate is retained in metadata and the importer can ingest exact per-item/tag data from the workbook when supplied through the Assets Excel import UI.

## Deploy smoke tests recommended
1. Open `assets.html` and confirm 190 asset types appear after one-time migration.
2. Verify current FX shows 188,000 Toman.
3. Change current FX, save, and confirm values recalculate without changing base prices.
4. Change one group depreciation rate and confirm all assets in that group recalculate.
5. Edit one asset and set an explicit depreciation override; confirm only that asset uses the override.
6. Confirm maintenance, quantity events and counts still load/save.
