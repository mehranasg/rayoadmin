# Rayo Admin v9.5.2 — ChangeLog

- Fix: Personnel username/password/enabled/permissions now bind to the actual V6.4 save path.
- Fix: duplicate username validation.
- Fix: personnel Excel import supports account/permission fields.
- Fix: daily sales Excel re-import is idempotent per identical source file.
- Fix: waste Excel re-import is idempotent per identical source file.
- Add: configurable payment locations stored in Inventory settings.
- Add: purchase invoice settlement status and payment location in Admin.
- Add: supplier payment location.
- Add: purchase invoice settlement/location in Staff Panel.
- Add: invoice Excel mapping for settlement/location with strict validation for paid invoices.
- Fix: Finance direct view query handling for entries/settings/calculator/monthly.
- Sync: Build/cache to 9.5.2 and seed manifest to all 8 backend modules.
- No CSS/design/navigation redesign.
