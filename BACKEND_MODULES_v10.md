# Backend Modules — Rayo Admin v10.0.0

نسخه 10 از همان قرارداد `RayoData` استفاده می‌کند و دو JSON مستقل کنترلی باید در Allowlist بک‌اند وجود داشته باشند:

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
sepidsaudit
```

نمونه Allowlist:

```csharp
["personnel"]   = "personnel-data.json",
["suppliers"]   = "suppliers-data.json",
["pricing"]     = "pricing-data.json",
["inventory"]   = "inventory-data.json",
["cashreport"]  = "cash-report-data.json",
["assets"]      = "assets-data.json",
["finance"]     = "finance-data.json",
["survey"]      = "survey-data.json",
["errorlog"]    = "error-log-data.json",
["sepidsaudit"] = "sepids-audit-data.json"
```

## نکته مهم

- `errorlog` برای لاگ خطاهای Frontend است و مستقل از داده‌های عملیاتی ذخیره می‌شود.
- `sepidsaudit` برای ImportBatch، Raw Block، Event، Snapshot، Diff، Alert، Review و Link گزارش‌های کنترلی سپیدز است.
- اگر Backend دارای Allowlist ثابت باشد و `sepidsaudit` اضافه نشود، صفحه Audit سپیدز در Load/Save خطای 4xx/5xx خواهد داد.
- Seedها فقط Bootstrap هستند؛ روی JSON واقعی سرور دستی overwrite نشوند.
