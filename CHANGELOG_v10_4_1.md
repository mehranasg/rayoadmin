# Rayo Admin v10.4.1 — Inventory View Scope Fix

- Root cause fixed: core `views` is a global lexical `const`, not `window.views`.
- `32-inventory-cost-control-v10.js` now attaches inventory/pricing/dashboard wrappers to the real `views` registry.
- `36-final-inventory-consolidation-v10-3.js` now waits for the v10 inventory wrapper and then installs the final 12-tab inventory view on the real `views.inventory`.
- No inventory business data/schema was changed.
- `inventory.html` cache-busted to 10.4.1.
