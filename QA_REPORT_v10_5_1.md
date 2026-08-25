# Rayo Admin v10.5.1 — Inventory Core Fix QA

## Root cause
The legacy 7-tab inventory navigation lived in `js/14-ops-integration.js`, while the 12-tab UI was added later by wrappers in `32/34/36`. Any failed or late wrapper installation could expose the old 7-tab view again.

## Structural fix
- `14-ops-integration.js` is now the single source of truth for Inventory navigation.
- The core navigation itself contains exactly 12 tabs.
- `32-inventory-cost-control-v10.js` supplies advanced pane bodies via `RayoInventoryV10.renderPane()` but does not replace `views.inventory` in core-12 mode.
- `34-final-operational-review-v10-1.js` skips its Inventory wrapper in core-12 mode.
- `36-final-inventory-consolidation-v10-3.js` no longer replaces the Inventory view in core-12 mode; Snapp helpers remain available.
- Both admin and sales-analysis sidebars define Inventory as a direct link, not an accordion submenu.

## Required tabs
1. راهنما و ورک‌فلو
2. موجودی و سفارش
3. ارزش روز موجودی
4. دریافت کالا
5. فروش روزانه
6. محل‌ها و نگاشت‌ها
7. انتقال کالا
8. پرتی و ضایعات
9. شمارش دوره‌ای
10. بهای مواد و بستن دوره
11. روند مغایرت
12. گزارش خسارت و مغایرت

## QA results
- Core runtime tab count: **12/12 PASS**
- Legacy tab buttons absent: **PASS**
- `views.inventory` unchanged after loading modules 32 and 36: **PASS**
- Core-12 guard active: **PASS**
- Advanced pane renderer exposed: **PASS**
- Snapp pane/helper preserved: **PASS**
- Admin sidebar Inventory direct link: **PASS**
- Sales-analysis sidebar Inventory direct link: **PASS**
- `ingredientUnit` fix retained: **PASS**
- Snapp From/To + Excel import retained: **PASS**
- Inventory cache version 10.5.1: **PASS**
- JavaScript syntax: **40/40 PASS**
- JSON parse: **11/11 PASS**
