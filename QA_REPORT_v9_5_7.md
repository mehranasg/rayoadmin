# QA Report — Rayo Admin v9.5.7

## Scope
Only the Personnel > Access Management flow was changed.

## Verified
- Runtime sidebar contains `مدیریت دسترسی‌ها` under `مدیریت پرسنل`.
- Default filter is employment status `فعال`.
- Active personnel without any username/userAccess record are visible.
- Filters can show inactive or all personnel.
- Access filter supports all / enabled / disabled / account not defined.
- Editor contains username, password, panel enabled/disabled, and existing permissions.
- Enabling panel requires username and password.
- Staff login still requires both employment status `فعال` and `userAccess.enabled === true`.
- Runtime unit scenario: active employee with no account -> visible -> credentials created -> panel access enabled: PASS.
- JavaScript syntax: PASS for all JS files.
- Seed JSON validity: PASS.
- Main CSS SHA-256 is identical to v9.5.6.
- Cache/build query bumped to v9.5.7.
