# Page startup rendering fix

Date: 2026-09-16. Application version remains v10.12.1.

## Changes

- `js/00-base.js` defers the first view write until the initial scripts and their DOMContentLoaded handlers have run. Its existing loading indicator stays active during that interval. A view awaiting registration displays loading instead of the dashboard. Later explicit renders remain synchronous.
- `js/16-mpa-shell.js` selects the initial route synchronously, without route polling or a delayed dashboard navigation.
- Fourteen admin HTML entries declare the existing final patches (44–47) in order and include the final CSS in the head. The final deferred patches register after legacy DOMContentLoaded handlers; dynamic loading remains as a guarded compatibility fallback.
- Existing installer files 15, 17, 23, 25, 29, 34, 36, 40, 42, 43, 46 and 47 no longer schedule redundant initial navigation or delayed whole-view replacement. Late HR view registration redraws only the current route.
- Inventory background completion in files 14 and 32 no longer redraws unrelated pages. Data loading and calculations are unchanged.
- `css/style.css` preserves the shell's layout but hides its interim appearance during script installation. The visibility guard is released even if rendering throws.
- Modified assets use a `startup-1` cache suffix. Staff login/panel HTML changes only update the shared stylesheet cache key. Application version numbers are unchanged.

No new runtime patch was added. `qa_page_startup.js` is a regression test; two existing inventory QA DOM stubs now supply querySelector for stylesheet deduplication.

## Validation

- JavaScript syntax checks: all 50 application files pass.
- `qa_page_startup.js`: 34 checks pass, including 13 initial routes, no pre-install view writes, slow data/view registration, render failure cleanup, final catalog installation, ordered assets in 14 HTML entries, no delayed navigation, and actual gateway loads with mocked live/empty/error responses. Every load request is GET /Load; none requests Seed or writes data.
- Relevant passing suites: `qa_v10_12_1.js`, `qa_management_tabs.js`, `qa_shift_menu.js`, `qa_sales_audit_navigation.js`, `qa_personnel_counts.js`, `qa_personnel_salary_account.js`, `qa_supplier_relation_search.js`, `qa_supplier_parties_debts.js`, `qa_inventory_bulk_count.js`, `qa_inventory_entry_issue.js`, `qa_operational_forecast.js`, `qa_reorder_point.js`, `qa_ui_lists_assets.js`, `qa_cash_reports_query.js`, `qa_tips_query.js`, `qa_gateway.js`.
- `qa_v10_12_0.js`: 24/26, with the same two failures reproduced against the previous Git HEAD (old loader version and old reorder implementation assertions).
- `qa_v10_8_1.js`: 89 checks pass, including syntax, local resource paths and runtime data safety. Three legacy assertions target the old build number, old data-management asset version and old inventory navigation. Those expectations are not changed by this fix.
- Git diff reviewed; whitespace checks pass.
- Manual browser/visual verification is **not completed**: the session's browser tool reports no browser available. VM tests verify execution and DOM write ordering, not rendered layout, font timing or measured layout shift. No live API was used for tests.

## Data impact and rollback

No JSON schema, Backend DTO, migration, IDs, Sepidz codes, inventory tab structure, save policy or live data changes. No deployment performed. Rollback is a Git revert of this frontend change; no data rollback is needed. Normal asynchronous loading indicators remain while actual module data is fetched.
