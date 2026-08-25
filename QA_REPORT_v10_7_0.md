# QA Report — Rayo Admin v10.7.0

## نتیجه
PASS برای Contractهای قابل تست محلی. Backend واقعی `chat.yekzan.com` از این محیط تست Write نشده است.

## Syntax / structure
- JavaScript syntax: 41/41 PASS
- JSON parse: 11/11 PASS
- Local HTML references: 388 checked / 0 missing
- HTML cache/build refs: همه روی 10.7.0

## Data safety
- Normal `loadOrBootstrap`: API-only — PASS
- Seed object save guard — PASS
- Live-load-before-save guard — PASS
- Guard runtime test: Save قبل از Load موفق مسدود شد؛ بعد از GET موفق POST مجاز شد — PASS
- Dormant Seed migration: disabled — PASS
- Assets Seed auto migration: disabled — PASS
- Inventory schema/Ledger auto-save on Load: disabled — PASS
- Explicit Reset remains the only allowed Seed write path — PASS

## Backup
- Backup module is loaded in Settings — PASS
- Reads all supported live API modules — PASS
- Aborts on any failed module — PASS
- Seed excluded — PASS
- ZIP writer generated a test ZIP and `unzip -t` reported no errors — PASS

## Personnel/access/login
- Extra permissions removed from access-management LIST — PASS
- Permissions remain editable inside access modal — PASS
- Admin password visibility eye in access modal — PASS
- Admin login password eye — PASS
- Staff login password eye — PASS

## Cash/sales
- Label `میانگین رقم هر فاکتور (حدودی)` — PASS
- Floor rounding example 2,654,234 → 2,650,000 Toman — PASS
- `cashreport.salesAnalytics` added to formal schema/default — PASS
- Sales-analysis current path `verify:true` — PASS
- Legacy reports sales-analysis path `verify:true` — PASS
- New Backend module required: NO — uses existing `cashreport`

## Inventory regression
- Core tabs: 12/12 PASS
- Sidebar inventory is direct link / no submenu — PASS

## محدودیت QA
- Persistence on the production Backend can only be finally confirmed after deployment because this environment does not perform destructive writes to the user's live production data.
