# QA — Rayo Admin v10.4.1

## Root cause
`00-base.js` declares `const views={...}`. Global lexical bindings are visible to later classic scripts by identifier, but are **not properties of `window`**. v10 inventory modules were waiting on `window.views`, so their installers never ran and the legacy 7-tab `14-ops-integration.js` view remained active.

## Before/After runtime scope test
- v10.4.0: v10 wrapper not installed; legacy tabs present.
- v10.4.1: 12/12 requested tabs present; legacy purchase invoice/payment/Sepidz sales/stocktake tab labels removed from tab bar.

## Requested tabs
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

## Static checks
- `node --check js/32-inventory-cost-control-v10.js`: PASS
- `node --check js/36-final-inventory-consolidation-v10-3.js`: PASS
- `inventory.html` references scripts with `v=10.4.1`: PASS
