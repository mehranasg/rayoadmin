# QA REPORT — Rayo Admin v9.5.4

## Build
- Version/cache: `9.5.4`
- Runtime API architecture: unchanged (`RayoData?module=...`)
- New backend module: **No**
- New sales history location: `cashreport.salesAnalytics`

## 1. JavaScript / JSON validity
- JavaScript syntax (`node --check`): **27/27 PASS**
- JSON parse validation: **9/9 PASS**
- HTML files using cache `v=9.5.4`: **13**
- Remaining HTML/JS cache refs to `v=9.5.3`: **0**
- Runtime references to `SplitCost/Load` or `SplitCost/Save`: **0**

## 2. Personnel account regression
Static/runtime-contract checks: **PASS**
- No `pv_username`, `pv_user_password`, `pv_user_enabled` in the main Personnel form patch.
- Old Phase 2 fallback account-field injector removed.
- Personnel List has a dedicated `نام کاربری / رمز` button.
- Popup fields: username, password, panel enabled and permissions.
- Username uniqueness validation retained.
- Active panel requires username + password.
- Dedicated save-function VM test: **PASS** for username/password/enabled/permissions + duplicate rejection.

## 3. Staff login
- Login condition requires `status === 'فعال'`: **PASS**
- Login condition requires `userAccess.enabled === true`: **PASS**
- Existing session is rechecked and invalidated for inactive/disabled personnel: **PASS**

## 4. Leave requests
- Independent Admin view `leaveRequests`: **PASS**
- Separate Personnel Management menu item: **PASS**
- Approve action: **PASS (static contract)**
- Reject action requires non-empty reason: **PASS**
- `managerNote` is shown in Staff Panel history: **PASS**
- Approved request uses `requestId` guard to prevent duplicate real leave rows: **PASS**

## 5. Shift menu ordering
- First: `برنامه هفتگی`: **PASS**
- Second: `برنامه ماهانه`: **PASS**
- Then staffing/analysis/history items: **PASS**

## 6. Uploaded Pricing data validation
The two supplied Pricing source workbooks were read with `artifact_tool`.

### `انواع کالای خام.xlsx`
- Source rows: **536**
- Seed ingredients: **536**
- Code/name/price comparison against Seed: **0 mismatches**
- Rial→Toman conversion: **PASS**
- `ING-7071 / فیله مرغ`: purchase unit kg, recipe unit gram, `packageQuantity=1000`: **PASS**

### `آیتمهای منو.xlsx`
- Source rows: **379**
- Seed menu items: **379**
- Code/name/price comparison against Seed: **0 mismatches**
- Rial→Toman conversion: **PASS**
- Stable IDs `MENU-<code>` retained: **PASS**

### Recipes
- Seed recipe lines retained: **912**
- New recipe workbook found in this request's attached files: **No**
- Safety behavior: `recipeSeedWins=false`, so existing API recipe edits are not overwritten by the new seed migration.

### Ingredient price history
- Rows with positive initial price: **531**

## 7. Pricing CRUD
Static contract checks:
- Add/Edit/Delete menu item: **PASS**
- Add/Edit/Delete ingredient: **PASS**
- Add/Edit/Delete recipe line / amount: **PASS**
- Menu unit and site-status editable: **PASS**
- Ingredient purchase unit, recipe unit, package quantity, price and price-date editable: **PASS**
- Compact Jalali date support in Excel ingredient imports: **PASS**

## 8. Sales Excel parser tests using the supplied workbook structures
Node test harness used rows extracted from the actual supplied Excel files.

### Sales by date
- Parsed: **17 rows**
- First normalized date: `1405/05/01`
- First row: total receipts **97**, hall **73**, subscribers **24**
- Re-import same records: remains **17** (no duplicates): **PASS**

### Sales by month
- Parsed: **8 rows**
- Compact month example normalized to `1406/01`: **PASS**
- Key is month (`YYYY/MM`): **PASS**

### Single-item sales by date
- Parsed: **17 rows**
- First normalized date: `1405/05/01`
- First row: total quantity **22**, hall **20**, subscribers **2**
- Re-import same item+dates: remains **17**: **PASS**

## 9. Sales reporting contracts
- Tabs: daily / monthly / item: **PASS**
- Metrics: total / in-person / hall / subscribers: **PASS**
- Growth charts use counts, not Rial amounts: **PASS**
- Same-month multi-year comparison: **PASS (code/parser contract)**
- Item import requires selecting a menu item: **PASS**
- Existing history is preserved; only missing keys are added: **PASS**

## 10. Design preservation
- `css/style.css` SHA-256 in v9.5.3: `24d0591fc19969623f19172b1de09477bc897053cec08312583946297ba7af84`
- `css/style.css` SHA-256 in v9.5.4: `24d0591fc19969623f19172b1de09477bc897053cec08312583946297ba7af84`
- Result: **byte-identical / PASS**

## 11. Deploy smoke tests still required
The local environment cannot validate the real production API/browser session end-to-end. After upload to the real host, verify:
1. Open Personnel List → `نام کاربری / رمز` popup → Save → reload → popup retains values.
2. Add/Edit Personnel does not display account fields.
3. An inactive personnel with valid credentials cannot login.
4. Submit leave from Staff Panel → reject with reason in Admin → reason appears in Staff Panel.
5. Upload the three sales report formats in `reports.html` and reload the page; imported history remains.
6. Confirm the one-time Pricing migration applies to the real `pricing` module and preserves any existing manually changed recipe quantities.

## Known limitation
A new recipe Excel was described by the user but was not present among the files attached to this request. To avoid data loss, v9.5.4 keeps the 912 previously validated recipe rows and does not force them over Runtime recipe edits. When the actual new recipe workbook is supplied, it can be parsed into a follow-up migration without changing the UI architecture.
