# نکات Backend و JSON — Rayo Admin v10.9.2

## نتیجه کوتاه

Endpoint یا Module جدید لازم نیست. همان ماژول‌های `suppliers`، `inventory` و `cashreport` استفاده می‌شوند. اگر RayoData کل JSON ماژول را بدون DTO محدود ذخیره می‌کند، در Backend تغییری لازم نیست.

اگر Backend مدل/DTO سخت‌گیرانه دارد، باید فیلدهای زیر را بدون حذف فیلدهای ناشناخته Preserve کند.

## تغییرات ماژول suppliers

### `suppliers.items[]`

فیلدهای جدید/مورد استفاده:

- `pricingIngredientId`: شناسه ماده متناظر در Pricing؛ کلید ارتباط با موجودی.
- `sepidsCode`: Snapshot کد سپیدز.
- `source`: برای مواد همگام‌شده مقدار `pricing`.
- `sourceCodeLocked`: برای کد سپیدز مقدار `true`.
- `legacyCodes`: کدهای قدیمی قلم پیش از Merge.
- `orderOwner`: مسئول یا بخش سفارش‌گذار قلم.

### `suppliers.suppliers[]`

فیلدهای برنامه تأمین:

- `orderDays: string[]`
- `deliveryDays: string[]`
- `deliveryTime: string`
- `orderOwner: string`

### `suppliers.purchaseRequests[]`

این آرایه از قبل در Contract ماژول وجود داشت و اکنون برای سفارش‌های واقعی استفاده می‌شود. ساختار هر ردیف:

```json
{
  "id": "PO-...",
  "date": "1405/05/29",
  "ingredientId": "ING-1001",
  "itemCode": "1001",
  "itemName": "راسته گوساله",
  "supplierId": "SUP-...",
  "supplierCode": "SUP-001",
  "supplierNameSnapshot": "نام تأمین‌کننده",
  "quantity": 20,
  "unit": "کیلوگرم",
  "unitPriceToman": 1750000,
  "estimatedTotalToman": 35000000,
  "expectedDeliveryDate": "1405/05/30",
  "actualDeliveryDate": "",
  "status": "ثبت‌شده",
  "orderedBy": "admin",
  "orderOwner": "مسئول خرید",
  "orderMethod": "واتس‌اپ",
  "reference": "",
  "notes": "",
  "followupNotes": "",
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
```

مقادیر وضعیت: `ثبت‌شده`، `تأیید تأمین‌کننده`، `ارسال‌شده`، `تحویل‌شده`، `لغوشده`.

## تغییرات ماژول cashreport

حذف گزارش، ردیف مربوط را از `cashreport.reports` حذف می‌کند و Audit زیر را به `cashreport.changeLog[]` اضافه می‌کند:

- `action`
- `reportId`
- `reportDate`
- `cashierName`
- `totalSales`
- `reason`
- `approvedBy`
- `at`

## نکته Deploy داده زنده

پس از Deploy، Seed جدید به داده زنده تزریق نمی‌شود. برای افزودن اقلام به اطلاعات فعلی:

1. وارد `تأمین‌کنندگان` شوید.
2. تب `تنظیمات` را باز کنید.
3. `بررسی و همگام‌سازی اقلام` را بزنید.
4. آمار Preview را بررسی کنید.
5. `پشتیبان‌گیری و همگام‌سازی` را تأیید کنید.

این مسیر ابتدا JSON فعلی تأمین‌کنندگان را دانلود می‌کند و سپس با تأیید Save سرور، تغییر را نهایی می‌کند.

