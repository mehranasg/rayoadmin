# v10.5.1 — Inventory Core Fix

- Moved the 12-tab Inventory navigation into the original source `14-ops-integration.js`.
- Removed dependency on chained wrappers for Inventory tab visibility.
- Added `__RAYO_INVENTORY_CORE_12` so later modules cannot replace the core Inventory view.
- Exposed advanced pane content through `RayoInventoryV10.renderPane()`.
- Kept Snapp range/Excel entry, stocktake purchase-price entry, `ingredientUnit` fix, valuation and variance functionality.
- Inventory remains a direct sidebar link in normal admin pages and sales-analysis.
- Updated build/cache version to 10.5.1.
