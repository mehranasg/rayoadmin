# QA Report — Rayo Admin v10.6.1

Acceptance checks: **18/18 PASS**

- PASS — Inventory core still has exactly 12 tabs — `['workflow', 'overview', 'valuation', 'receipts', 'sales', 'locations', 'transfer', 'waste', 'stock', 'cost', 'history', 'varianceReports']`
- PASS — Inventory sidebar remains direct link/no legacy submenu
- PASS — Inventory null guard checks inventory and pricing
- PASS — Advanced inventory render has readiness guard
- PASS — Pricing has core recipe-version flag
- PASS — Pricing wrapper disabled when core tab exists
- PASS — Recipe versions is a first-class pricing tab
- PASS — Recipe versions view keeps pcTabs via viewsPricing
- PASS — Legacy zero date is presented as base version
- PASS — Ingredient group is a select
- PASS — Ingredient categories have seeded fallback groups
- PASS — Ingredient edit persists selected category
- PASS — Save status has saving/verifying/verified/warning/error states
- PASS — Save verification is awaited
- PASS — Unverified save throws and blocks false success
- PASS — Staff back button has distinctive styling
- PASS — Build bumped to 10.6.1
- PASS — All HTML cache-bust references bumped — `15 html files`

Additional automated checks:
- JavaScript syntax: 40/40 PASS
- Seed JSON parse: 11/11 PASS

Important regression guard:
- Inventory & Consumption Control remains a single sidebar link with exactly 12 core tabs.

Browser/backend limitation:
- Live POST/GET verification against chat.yekzan.com was not executed from this offline container. The new UI status will expose verification failures on the deployed site.