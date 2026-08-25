# Backend / JSON notes — v10.12.1

برای این نسخه هیچ تغییر Backend، Endpoint، Module، Schema یا Migration لازم نیست.

- اقلام همچنان در `pricing.ingredients[]` ذخیره می‌شوند؛ فقط محل مدیریت آن‌ها در UI تغییر کرده است.
- گروه در `category` و نوع قلم در `itemType` باقی می‌ماند و مستقل از یکدیگر ذخیره می‌شوند.
- جمع موجودی از داده‌های فعلی `inventory` محاسبه می‌شود و فیلد تازه‌ای ذخیره نمی‌شود.
- صفحه جدید هیچ Save یا Migration خودکاری هنگام Load ندارد.
