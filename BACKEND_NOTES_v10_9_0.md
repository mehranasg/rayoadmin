# Backend Notes — v10.9.0

## نتیجه کوتاه

برای این نسخه **Module یا Endpoint جدید لازم نیست**. همان Moduleهای `pricing`، `inventory`، `cashreport` و `suppliers` کافی هستند.

## فیلدهای جدید یا تکمیل‌شده

### `pricing.ingredients[]`

```json
{
  "itemType": "RECIPE | OPERATIONAL_CONSUMABLE",
  "consumptionDriver": "GUESTS | CHECKS | OPEN_DAYS | SHIFTS | WASH_CYCLES",
  "standardUsagePerDriver": 0,
  "driverBase": 100
}
```

این فیلدها اختیاری‌اند. اقلام قدیمی که `itemType` ندارند مانند ماده رسپی رفتار می‌کنند.

### `inventory.operationalUsagePeriods[]`

```json
{
  "id": "OPUSE-...",
  "from": "1405/05/01",
  "to": "1405/05/31",
  "driverValues": {
    "GUESTS": 12000,
    "CHECKS": 6500,
    "OPEN_DAYS": 31
  },
  "updatedAt": "ISO-8601",
  "updatedBy": "admin"
}
```

### `cashreport.reports[]`

```json
{
  "managementReviewStatus": "نیازمند بررسی | بررسی‌شده | بدون نیاز به بررسی",
  "managementNote": "توضیحات مدیر",
  "reviewedAt": "ISO-8601",
  "reviewedBy": "admin"
}
```

گزارش‌های قدیمی بدون این فیلدها در Frontend بر اساس حد مجاز مغایرت به‌صورت خودکار نمایش داده می‌شوند؛ این محاسبه در Load عادی Auto-save نمی‌شود.

### پرداخت تأمین‌کننده

ساختار موجود `inventory.supplierPayments[]` استفاده می‌شود و JSON جدیدی لازم نیست:

```json
{
  "supplierId": "SUP-...",
  "invoiceId": "PINV-... | empty",
  "date": "1405/05/20",
  "amount": 1000000,
  "method": "کارت به کارت",
  "paymentLocationId": "PAYLOC-...",
  "paymentLocationNameSnapshot": "نام حساب",
  "reference": "شماره پیگیری",
  "notes": "شرح"
}
```

## اگر Backend اعتبارسنجی Schema سخت‌گیرانه دارد

فیلدهای بالا و آرایه `operationalUsagePeriods` باید در whitelist همان Moduleها مجاز شوند. اگر Backend کل JSON Module را بدون حذف فیلدهای ناشناخته نگه می‌دارد، هیچ تغییر Backend لازم نیست.

## قاعده ایمنی اجباری

- GET عادی نباید Seed بخواند.
- پاسخ خالی، 404، 500 یا قطعی شبکه مجوز POST نیست.
- Initialize فقط با `allowInitialize` و اقدام صریح مدیر انجام می‌شود.
- Reset از Seed فقط با Backup و تأیید دوبل انجام می‌شود.
- فیلدهای جدید در Migration سمت Frontend فقط در RAM نرمال می‌شوند و هنگام Load خودکار Save نمی‌شوند.
