# Backend / JSON notes — v10.12.0

Endpoint یا Module جدید لازم نیست. همان Moduleهای `inventory`، `pricing` و `suppliers` استفاده می‌شوند.

## فیلدهای جدید ورود مستقیم

در `inventory.stockReceipts[]` این فیلدها ممکن است اضافه شوند:

- `sourceType: "DIRECT_ENTRY"`
- `totalPriceToman`
- `referenceNumber`
- `sourceName`
- `notes`
- `locationId`, `unitCostToman`, `createdBy`, `createdAt`

در `pricing.ingredientPriceHistory[]` برای قیمت ثبت‌شده همراه ورود:

- `source: "direct-stock-receipt"`
- `receiptId`
- `unitCostToman`

اگر Backend اشیای JSON را آزاد ذخیره می‌کند، تغییری لازم نیست. اگر DTO/Whitelist سخت‌گیرانه است، فیلدهای بالا باید مجاز شوند. Migration اجباری نیست و Load عادی هیچ Save یا Merge خودکاری انجام نمی‌دهد.
