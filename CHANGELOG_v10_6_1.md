# Changelog — Rayo Admin v10.6.1

## Save status / persistence safety
- Save status now shows: saving, verifying server version, verified, warning, or error.
- A successful POST is no longer treated as final success when verification is enabled.
- Save waits for server re-read verification; an unverified version throws a visible error and prevents false success toasts in callers.

## Pricing / ingredient groups
- Ingredient group field is now a real select control for both add and edit.
- Category options are built from the known Rayo ingredient groups plus categories already present in live data.
- Live JSON containing only one category no longer collapses the selector to one option.

## Inventory null safety
- Inventory core waits for both inventory and pricing state before rendering data panes.
- RayoInventoryV10 renderPane also has an internal readiness guard, preventing `Cannot read properties of null (reading ingredients)`.

## Dated recipe versions
- Dated recipe versions are now a first-class tab inside the pricing module.
- All pricing tabs remain visible while this tab is open.
- Legacy `0000/00/00` versions are displayed as `نسخه پایه (تاریخ اولیه نامشخص)` instead of a fake date.
- New snapshots still use a real Jalali effective date.

## Staff panel
- Back button is visually distinguished for easier discovery.

## Regression guard
- Inventory sidebar has no submenu.
- Inventory page keeps exactly the established 12 core tabs.
