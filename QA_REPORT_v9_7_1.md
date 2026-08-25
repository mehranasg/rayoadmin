# QA Report — Rayo Admin v9.7.1

## Scope
- Fix routing for آموزش‌ها و چک‌لیست‌ها.
- Verify staff-panel access to training/checklists.
- Move asset management out of Settings into a standalone Sidebar item.

## Results
- Structural checks: **20/20 PASS**
- JavaScript syntax: **PASS (all JS files)**
- JSON validation: **PASS**
- CSS regression: **unchanged**

### Detailed checks
- PASS — Router accepts protocols
- PASS — Admin view registered protocols
- PASS — Menu URL exists protocols
- PASS — Router accepts checklistTemplates
- PASS — Admin view registered checklistTemplates
- PASS — Menu URL exists checklistTemplates
- PASS — Router accepts checklistReports
- PASS — Admin view registered checklistReports
- PASS — Menu URL exists checklistReports
- PASS — Assets independent in main menu
- PASS — Assets removed from main settings submenu
- PASS — Assets independent in sales analysis menu
- PASS — Assets removed from sales analysis settings
- PASS — Staff training menu item
- PASS — Staff checklist menu item
- PASS — Staff training renderer wired
- PASS — Staff checklist renderer wired
- PASS — Staff protocols loaded from personnel state
- PASS — Staff checklists loaded from personnel state
- PASS — CSS unchanged
