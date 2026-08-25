# QA Report — Rayo Admin v10.5.0

## Scope

This QA covers the requested v10.5.0 changes:

1. Date fields must not be formatted as money.
2. `ingredientUnit is not defined` must be fixed.
3. Snapp sales must support a date range.
4. Snapp sales must support Excel import similar to daily menu sales.
5. Manual menu and Snapp sales must show calculated total amount while entering quantity.
6. Existing 12-tab Inventory final view must remain intact.

## Results

### JavaScript syntax
- 40/40 JavaScript files passed `node --check`.
- Syntax failures: 0.

### JSON
- 11/11 seed JSON files parsed successfully.

### Local HTML references
- 387 local `src/href` references checked.
- Missing local files: 0.

### Build/cache
- Active HTML/cache references updated to `v=10.5.0`.
- Old `10.4.0/10.4.1` active cache references in HTML and active v10 UI patch files: 0.

## Targeted acceptance tests

Custom `qa_v10_5.js`: **13/13 PASS**

- `ingredientUnit()` helper declared in Inventory v10 scope: PASS
- Helper declared before `wastePane`: PASS
- Jalali inputs explicitly excluded from Money formatter: PASS
- Date labels excluded from Money formatter: PASS
- Manual menu sales has calculated total UI/update hook: PASS
- Snapp has From date: PASS
- Snapp has To date: PASS
- Snapp Excel import control/function: PASS
- Snapp calculated amount per line: PASS
- Snapp records tagged `salesSource/source = SNAPP`: PASS
- Excel importer recognizes daily-sales compatible columns: PASS
- Runtime final Inventory Sales view renders Snapp panel: PASS
- Runtime final Inventory wrapper keeps 12 Inventory tabs: PASS

## Runtime numeric tests

### Manual menu sales calculated amount
Input:
- Quantity: 3
- Current menu price: 125,000 Toman

Output:
- **375,000 Toman**

Result: PASS

### Date vs money detection
Simulated fields:
- `تاریخ فروش` + `data-jalali="1"` => Money input: **false**
- `مبلغ فروش (تومان)` => Money input: **true**

Result: PASS

### Snapp Excel import
Mock file rows:
- 1405/05/01 — Menu M1 — Qty 2
- 1405/05/02 — Menu M1 — Qty 3

Result:
- 2 daily `SNAPP` periods created
- quantities saved as 2 and 3
- inventory module save invoked

Result: PASS

## Root-cause confirmation for reported errors

### `ingredientUnit is not defined`
`js/32-inventory-cost-control-v10.js` used `ingredientUnit()` from `wastePane` and related views but did not define the function in that module scope. The helper is now defined locally and no longer relies on another file's private scope.

### Dates formatted with commas
The generic money detector considered labels containing words such as `فروش` as monetary fields. Because Jalali date inputs are text inputs, `تاریخ فروش` could be incorrectly marked as money. The detector now rejects:
- `data-jalali="1"`
- `.jalali-input`
- labels containing `تاریخ/روز/ماه/سال/ساعت`
- IDs/names containing `date/jalali/fromdate/todate`

It also removes an incorrect money marker if a field was previously misclassified.

## Browser E2E note

A local mock RayoData server was prepared and Chromium Headless was attempted for a full DOM dump. Chromium did not terminate reliably in the current container environment, so that full-browser dump is **not counted as a PASS**. Targeted VM/runtime tests above executed the actual project functions and final Inventory wrapper.

After deployment, perform a short production smoke test:
1. Hard refresh.
2. Open `inventory.html?tab=waste` and confirm no `ingredientUnit` error.
3. Check a Jalali date input remains `1405/xx/xx` without comma formatting.
4. Open `فروش روزانه`, verify Snapp From/To + Excel controls.
5. Enter a menu item and quantity and confirm calculated amount updates.
6. Save a test Snapp sale, reload, and confirm persistence.

