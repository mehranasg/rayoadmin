# Backend Modules — Rayo Admin v9.8.0

ماژول‌های مورد انتظار `RayoData`:

```text
personnel
suppliers
pricing
inventory
cashreport
assets
finance
survey
errorlog
```

نمونه Allowlist:

```csharp
["personnel"]  = "personnel-data.json",
["suppliers"]  = "suppliers-data.json",
["pricing"]    = "pricing-data.json",
["inventory"]  = "inventory-data.json",
["cashreport"] = "cash-report-data.json",
["assets"]     = "assets-data.json",
["finance"]    = "finance-data.json",
["survey"]     = "survey-data.json",
["errorlog"]   = "error-log-data.json"
```

`errorlog` در v9.8.0 جدید است و باید مستقل از JSONهای عملیاتی ذخیره شود.
