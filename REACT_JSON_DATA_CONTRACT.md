# قرارداد داده JSON برای توسعه آینده React / Backend

این سند از پنل کاربری حذف شده و فقط برای توسعه‌دهنده نگهداری می‌شود. پنل عملیاتی نباید این قرارداد فنی را به کاربر نمایش دهد.

## 1) API Runtime

تنها مسیر داده عملیاتی پروژه:

```text
GET  {API_ORIGIN}/api/v1.0/RayoData/Load?module=<module>
POST {API_ORIGIN}/api/v1.0/RayoData/Save?module=<module>
Content-Type: application/json
```

`API_ORIGIN` فقط در `js/app-config.js` تعریف می‌شود.

## 2) ماژول‌ها

| Module | کاربرد |
|---|---|
| `personnel` | پرسنل، شیفت، حقوق، مرخصی، دسترسی، آموزش، چک‌لیست |
| `suppliers` | تأمین‌کنندگان، ارتباط اقلام، درخواست‌های خرید |
| `pricing` | آیتم منو، مواد اولیه، رسپی، تاریخچه قیمت |
| `inventory` | فروش آیتمی، ضایعات، فاکتور خرید، ورود انبار، پرداخت تأمین‌کننده، انبارگردانی |
| `cashreport` | گزارش صندوق و تحلیل فروش |
| `assets` | اموال، تعمیرات، موجودی اقلام، شکستگی/مفقودی |
| `finance` | گزارش تقریبی سود و زیان |
| `survey` | نظرسنجی مشتری |
| `errorlog` | لاگ خطاهای فنی مستقل |

## 3) اصول عمومی داده

- هر رکورد مهم باید ID پایدار داشته باشد.
- Seed فقط برای Bootstrap/Migration است، نه Runtime fallback روی خطای سرور.
- داده هر ماژول مستقل ذخیره می‌شود.
- Migrationها باید Idempotent و دارای ID باشند.
- کدهای سپیدز برای Item/Ingredient حفظ شوند.
- مبلغ عملیاتی در پنل تومان است، مگر Import خاصی که صراحتاً ریال باشد.
- وضعیت‌ها باید فیلد صریح باشند؛ رنگ به تنهایی وضعیت محسوب نمی‌شود.

## 4) ارتباط‌های مهم

```text
Purchase Invoice
  -> inventory.purchaseInvoices
  -> inventory.stockReceipts
  -> pricing.ingredientPriceHistory / latest ingredient price

Staff Purchase Request
  -> suppliers.purchaseRequests
  -> Admin review / close

Asset Incident
  -> assets.assetIncidents
  -> Admin review
  -> optional quantity transaction after manager approval

Supplier
  -> suppliers.suppliers
  -> suppliers.supplierItems
  -> suppliers.purchaseRequests
  -> inventory.purchaseInvoices
  -> inventory.supplierPayments
```

## 5) حساب کاربری و Permission

در رکورد پرسنل:

```json
{
  "username": "...",
  "userPassword": "...",
  "userAccess": {
    "enabled": true,
    "permissions": {
      "cashReport": false,
      "purchaseRequests": false,
      "purchaseInvoices": false,
      "tips": false,
      "surveys": false,
      "suppliersView": false
    }
  }
}
```

این ساختار مربوط به معماری فعلی است. در مهاجرت Production باید Password خام حذف و Authentication/Authorization سمت سرور پیاده شود.

## 6) لاگ خطا

لاگ خطا از این نسخه در ماژول جدا ذخیره می‌شود:

```text
module=errorlog
```

Schema پایه:

```json
{
  "meta": {
    "schemaVersion": "1.0.0",
    "module": "Rayo Error Log",
    "updatedAt": null
  },
  "entries": []
}
```

حداکثر 1000 رکورد اخیر در Frontend نگهداری می‌شود.

## 7) نکته Deploy Backend

اگر Backend دارای Allowlist ثابت ماژول‌هاست، `errorlog` باید به آن اضافه شود. نمونه:

```csharp
["errorlog"] = "error-log-data.json"
```

بدون این تغییر، پنل همچنان اجرا می‌شود ولی ذخیره پایدار لاگ خطا روی سرور انجام نخواهد شد.
