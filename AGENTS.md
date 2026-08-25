# Rayo Admin — Codex Instructions

## Project baseline

- Current operational baseline: Rayo Admin v10.12.1
- Read `docs/RAYO_ADMIN_MASTER_HANDOFF_v10_12_1.md` before architectural changes.
- The current application is a multi-page HTML/CSS/JavaScript application.
- The project is operational and uses real data.

## Data safety

- Never write Seed data during normal Load, Bootstrap or automatic Migration.
- Never automatically Save DEFAULT_DATA after a failed API Load.
- Initialize, Reset and Merge require an explicit administrator action.
- Before destructive or structural data changes, require Backup, Preview and Rollback.
- Do not change existing IDs or Sepidz codes.
- Do not physically delete records with sales, recipe, purchase, payment or inventory history.
- Use inactive, archived, reversal or soft-delete states for historical records.
- Do not commit live JSON backups, passwords, bank details or other sensitive data.

## Current data authority

- `pricing.ingredients` is the current master catalog.
- `suppliers.items` is a legacy compatibility mirror and must not become the master catalog.
- `category` and `itemType` are independent concepts.
- Keep historical names, codes, prices and recipe data as snapshots or versions.
- Preserve the current 9-tab inventory structure unless the product owner explicitly requests a change.

## Working rules

- Inspect the relevant HTML, CSS and all loaded JavaScript patches before editing.
- Do not add another patch file unless the change cannot safely be made in the current implementation.
- Prefer modifying the current owning file instead of adding another override.
- Do not rewrite unrelated files.
- Preserve Persian RTL layout, IRANSansX and the existing visual theme.
- Explain whether a requested change affects JSON, Backend DTO, migration or live data.
- For structural changes, describe migration and rollback before implementation.
- Do not replace the current application with React unless explicitly requested.

## Verification

After JavaScript changes:

- Run JavaScript syntax checks.
- Run the latest relevant QA scripts.
- Inspect `git diff`.
- Test the affected page manually.
- Verify normal Load does not trigger Seed or automatic Save.
- Report changed files, tests, JSON impact and Backend impact.

## Versioning

- Small changes do not require sending or creating a complete ZIP.
- Use Git commits for normal changes.
- Create full ZIP releases only for milestones, deployment packages or explicit requests.
- Do not change version numbers for incomplete work.