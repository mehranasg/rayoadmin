# نکات Backend — v10.11.0

- Endpoint یا Module جدید لازم نیست.
- همه داده‌ها همچنان از `RayoData/Load|Save?module=pricing` خوانده و ذخیره می‌شوند.
- اگر Backend برای `pricing.menuItems[]` دارای DTO سخت‌گیرانه است، فیلدهای اختیاری `archivedAt`، `archivedBy` و `archiveReason` را مجاز کنید.
- نبود این فیلدها برای آیتم‌های فعلی معتبر است.
- هیچ Render، Load یا Migration خودکاری Seed را روی API ذخیره نمی‌کند.
