# Rayo — agent instructions

All instructions for AI agents (Claude, Codex, others) are in **[CLAUDE.md](CLAUDE.md)**. Read it first; it is binding.

Short version:
- Active code is `app/` (admin panel + in-venue demos); tests are `tests/`; docs are `docs/` (index `docs/README.md`).
- `legacy/` is the frozen old panel: do not change it.
- Messages that start with «ثبت کن:», «ایده:», «باگ:», «بررسی کن:», «به طرح توسعه اضافه کن:» or «تصمیم:» are **record-only**: write them to `docs/BACKLOG.md`, `docs/ROADMAP.md` or `docs/DECISIONS.md` as CLAUDE.md describes. Do not change code.
- Data-safety rules in CLAUDE.md apply to every change. The app runs on live restaurant data.
- Reply to the owner in Persian.
