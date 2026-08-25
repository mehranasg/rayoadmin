# Backend modules required — v9.5

تمام Load/Saveها باید فقط از RayoData و همراه QueryString `module` باشند.

## Endpoint
```text
GET  /api/v1.0/RayoData/Load?module=<name>
POST /api/v1.0/RayoData/Save?module=<name>
```

## Modules
```text
personnel
suppliers
pricing
inventory
cashreport
assets
finance
survey
```

اگر کنترلر Allowlist دارد، حداقل نگاشت زیر لازم است:

```csharp
["personnel"] = "personnel-data.json",
["suppliers"] = "suppliers-data.json",
["pricing"] = "pricing-data.json",
["inventory"] = "inventory-data.json",
["cashreport"] = "cash-report-data.json",
["assets"] = "assets-data.json",
["finance"] = "finance-data.json",
["survey"] = "survey-data.json"
```

نام دامنه فقط در `js/app-config.js` نگهداری می‌شود.

## Seed
فایل‌های `seed/` دیتابیس Runtime نیستند. فقط وقتی API برای یک ماژول داده اولیه ندارد، Bootstrap یک‌باره انجام می‌شود و `bootstrapCompletedAt` در meta ذخیره می‌شود. Pricing علاوه بر Bootstrap، Migration ID یک‌باره برای سه Excel سپیدز دارد.

## افزوده v9.8.0

از v9.8.0 ماژول مستقل زیر نیز لازم است:

```text
errorlog
```

نگاشت پیشنهادی:

```csharp
["errorlog"] = "error-log-data.json"
```

جزئیات کامل در `BACKEND_MODULES_v9_8.md` آمده است.
