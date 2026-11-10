# Task: Rayo attendance module — import, auto-correction, monthly staff list & report

You are working in the restaurant management panel codebase. Inspect the repo first and follow its existing stack, structure, ORM, auth, UI kit and conventions. The panel is RTL Persian: all user-facing text, dates and numbers are Persian (Jalali calendar, Persian digits); code, identifiers and comments are English.

This is for one restaurant (Rayo) for now. Keep shift rules in a single settings record editable from the panel (no multi-tenant work yet), never as constants scattered in code.

Work in phases and stop for review after each: (1) data model + settings + importer with tests, (2) calculation engine with tests, (3) staff monthly list with editing and saving, (4) monthly report + export.

---

## 1. Core concept: the work shift is the unit, not the calendar day

Every punch belongs to a **business day**. Punches before `business_day_cutoff` (06:00) belong to the previous business day. An evening shift that ends at 01:00 on 1405/08/02 belongs entirely to business day 1405/08/01. All lists, totals and reports are keyed by business day.

---

## 2. Settings (editable in the panel, these defaults)

All values below are edited from a settings page in the panel. Nothing here may be hard-coded.

### 2.1 Weekly schedule (one row per weekday, keyed by the **business day's** weekday)
Thursday's evening shift ending at 01:00 on Friday's calendar date is still a Thursday shift.

| Weekday | Morning required arrival | Opening (info only) | Morning late tolerance | Morning end | Evening start | Evening late tolerance | Evening end |
|---|---|---|---|---|---|---|---|
| Sat–Wed | 09:00 | 09:30 | 15 min | 17:30 | 16:30 | 0 | 00:30 |
| Thursday | 08:30 | 09:00 | 15 min | 17:30 | 16:30 | 0 | 01:00 |
| Friday | 08:30 | 09:00 | 15 min | 17:30 | 16:30 | 0 | 00:30 |

> Thursday/Friday morning end, evening start, Friday evening end and the weekend tolerance are assumptions; the owner will adjust them in settings.

Notes:
- Lateness is measured from **required arrival**, not opening time.
- Morning end and evening start overlap by one hour on purpose (cover for late evening staff). Single-shift staff are judged against their own shift's times only.
- Double-shift staff take a 2-hour rest at a time that differs per person (e.g. 15–17 or 16–18). Their schedule is: required morning arrival → evening end, minus `standard_rest_min`. The rest's timing is never judged, only its length.

### 2.2 General settings
| Key | Default |
|---|---|
| business_day_cutoff | 06:00 |
| standard_rest_min | 120 |
| window_morning (entries only) | 06:00 → 12:00 |
| window_midday (exits and entries) | 12:00 → 21:00 |
| window_night (exits only) | 21:00 → 06:00 |
| tolerance_mode | `full` (lateness beyond tolerance counts in full from required arrival; `excess` = only the part beyond tolerance) |
| early_arrival_counts_as_overtime | false |
| overtime_requires_approval | true (work after shift end is stored as «اضافه‌کار در انتظار تأیید» and counts only after the manager approves it, fully or partly) |
| same_type_merge_window_min | 30 |
| opposite_type_merge_window_min | 3 |
| rest_fill_mode | `standard` (`standard` or `worst_case`, see §4.4) |

Validate that the three windows cover 24h without overlap, and that each weekday's times fall inside the right windows.

---

## 3. Importer

### 3.1 Expected file
One sheet, first row = headers, one row per **single punch** (not entry/exit pairs), all staff, any date range. A sample with test data is at `fixtures/rayo-attendance-sample.xlsx` (the same sheets are also in `fixtures/*.csv` for easy reading) (sheet `ترددها`; sheets `راهنمای فرمت` and `سناریوهای تست` are documentation — read them, use `سناریوهای تست` as the expected-results basis for engine tests).

| Header | Required | Format |
|---|---|---|
| کد پرسنلی | yes | stable unique code |
| نام و نام خانوادگی | yes | display only |
| تاریخ | yes | Jalali calendar date of this punch, `YYYY/MM/DD` |
| ساعت | yes | `HH:MM:SS` or `HH:MM` |
| نوع تردد | yes | `ورود` / `خروج` |
| روش ثبت | yes | e.g. `چهره`, `دستی` |
| کد دستگاه | no | |

Parsing:
- Locate columns by header text, not position. Accept Persian, Arabic or ASCII digits; accept cells stored as text or as Excel date/time values.
- Ignore fully empty rows and any row whose employee code is empty (title/total rows).
- Unknown employee codes: show on the preview screen; admin maps each to an existing employee or creates one; the code is saved on the employee record.
- Raw punches are immutable and deduplicated by (employee, timestamp). Re-uploading the same or an overlapping file never creates duplicates and never overwrites manual edits.
- Put the parser behind an adapter interface so the vendor's current export (paired rows `کارمند | تاریخ | ورود | خروج | کارکرد | ثبت`, Jalali month names like `۵ آبان ۱۴۰۵`, `—` for empty, a trailing `جمع` row) can be supported as a second adapter if the new format is delayed. In that adapter, explode each pair into separate punches and treat an exit earlier than its entry as next calendar day.

Upload flow: upload → preview (rows read, punches new / duplicate, unknown codes, rejected rows with row number and reason, affected date range) → confirm → recalculate affected employee business days.

---

## 4. Calculation engine (pure, framework-agnostic, fully unit-tested)

Input: all raw punches of one employee for one business day + settings + any manual overrides. Output: one `attendance_day`.

### 4.1 Merge consecutive punches (in the employee's favor)
Sort punches by time, then:
- Consecutive punches of the **same type** within `same_type_merge_window_min`: entries → keep the **earliest**; exits → keep the **latest**. Example: entries at 08:30 and 08:40 → entry 08:30. Exits at 00:20 and 00:35 → exit 00:35.
- Consecutive punches of **opposite type** within `opposite_type_merge_window_min` (accidental double press, e.g. exit 17:15 + entry 17:15): merge into one punch at the earlier time with type `unknown`; the slot rules decide what it is.
- Every merge adds an explanation line (§4.5).

### 4.2 Slot assignment
The window decides; the pressed button is only a tie-breaker in the midday window.
- Morning window → S1 (morning entry). Night window → S4 (night exit). If several remain after merging: earliest is S1, latest is S4, flag `needs_review`.
- Midday window:
  - 2 punches → first S2 (morning exit / rest start), second S3 (evening entry / rest end).
  - 1 punch: if S1 exists and S4 exists → button decides S2 (`خروج`) or S3 (`ورود`); if `unknown`, treat it as S2. If S1 exists and no S4 → S2. If no S1 → S3, unless button is `خروج`, then S2.
  - 3+ punches → first S2, last S3, flag `needs_review`.

### 4.3 Shift inference and filling
| Slots present | Shift | Filled |
|---|---|---|
| S1,S2 | morning | — |
| S3,S4 | evening | — |
| S1,S2,S3,S4 | double | — |
| S1 | morning | S2 worst-case |
| S2 | morning | S1 worst-case |
| S3 | evening | S4 worst-case |
| S4 | evening | S3 worst-case |
| S1,S2,S3 | double | S4 worst-case |
| S2,S3,S4 | double | S1 worst-case |
| S1,S3,S4 | double | S2 by rest rule |
| S1,S2,S4 | double | S3 by rest rule |
| S1,S4 | double | S2 and S3 by rest rule |
| none | no_record | — |

### 4.4 Worst-case rule (missing shift-boundary punch)
A missing punch is filled with the time **least favorable to the employee** that is still plausible, so that skipping a punch never pays more than punching honestly:
- Missing **entry** → the **end** of its entry window (S1 → 12:00, S3 of an evening-only shift → 21:00), but never later than the shift's exit.
- Missing **exit** → the **start** of its exit window (S2 of a morning-only shift → 12:00, S4 → 21:00), but never earlier than the shift's entry.

Rest rule (S2/S3 inside a double shift): with `rest_fill_mode = standard`, the missing side is derived from the other side ± `standard_rest_min`; if both are missing, rest = `standard_rest_min` is deducted and both rest times are shown as «نامشخص» (rest timing varies per person, so no times are invented). With `worst_case`, a missing S2 = start of midday window and a missing S3 = end of midday window (clamped to actual punches). Rest-rule fills are still flagged and explained.

### 4.5 Explanations for staff
Every merge, fill and review flag writes a plain Persian explanation stored on the day and shown in the list (and printable for the employee). Templates (fill in times):
- Missing entry: «ورود {شیفت} ثبت نشده بود. چون ساعت واقعی ورود مشخص نیست، طبق قانون رستوران دیرترین ساعت ممکن ({ساعت}) در نظر گرفته شد تا ثبت نکردن تردد به نفع کسی تمام نشود. اگر زودتر آمده‌اید، به مدیر اطلاع دهید تا اصلاح شود.»
- Missing exit: «خروج {شیفت} ثبت نشده بود. چون ساعت واقعی خروج مشخص نیست، طبق قانون رستوران زودترین ساعت ممکن ({ساعت}) در نظر گرفته شد تا ثبت نکردن تردد به نفع کسی تمام نشود. اگر دیرتر رفته‌اید، به مدیر اطلاع دهید تا اصلاح شود.»
- Rest fill: «{خروج برای استراحت / برگشت از استراحت} ثبت نشده بود و بر اساس استراحت استاندارد {مدت} محاسبه شد.»
- Same-type merge: «چند {ورود/خروج} پشت سر هم ثبت شده بود؛ به نفع شما {زودترین ورود/دیرترین خروج} ({ساعت}) مبنا قرار گرفت.»
- Opposite-type merge: «یک ورود و خروج در فاصله‌ی کمتر از {n} دقیقه ثبت شده بود و یک تردد حساب شد.»
- Needs review: «الگوی ترددها غیرعادی است و توسط مدیر بررسی می‌شود.»

### 4.6 Per-day fields
Times are compared with the schedule of the business day's weekday (§2.1).
- ورود صبح, خروج صبح, ورود عصر, خروج عصر — each with source `actual | merged | worst_case | rest_rule | manual`.
- **Single morning:** تأخیر ورود = S1 − required arrival (0 if within tolerance; per tolerance_mode otherwise); تعجیل خروج = morning end − S2 if positive; اضافه‌کار خروج = S2 − morning end if positive.
- **Single evening:** same, with evening start / evening end.
- **Double:** تأخیر ورود = S1 vs morning required arrival; تعجیل/اضافه‌کار خروج = S4 vs evening end; خروج صبح and ورود عصر have no deviation; مدت استراحت = S3 − S2 and the part above `standard_rest_min` is کسر کار (a shorter rest earns nothing).
- Early arrival before required time earns nothing unless `early_arrival_counts_as_overtime`.
- Overtime after shift end: stored as pending; the manager approves all, part, or none of it from the list (§5). Only approved overtime enters totals.
- کارکرد شیفت صبح = S2 − S1; کارکرد شیفت عصر = S4 − S3; کارکرد کل روز = sum (for double with unknown rest times: S4 − S1 − standard_rest).
- ساعت موظف = scheduled hours of the detected shift(s) for that weekday.
- تأخیر کل روز, تعجیل کل روز, کسر کار کل روز (lateness + early exit + rest overrun), اضافه‌کار در انتظار تأیید, اضافه‌کار تأییدشده.
- وضعیت شیفت: تک‌شیفت صبح / تک‌شیفت عصر / دوشیفت / بدون تردد.
- Flags: has_auto_fill, needs_review, has_pending_overtime, manually_edited; explanation list (§4.5).

Store all durations as integer minutes; display as `ساعت:دقیقه` in Persian digits.

Unit tests: every scenario in sheet `سناریوهای تست` (also provided as `fixtures/rayo-attendance-sample.test-scenarios.csv`), every row of §4.3, both rest modes, both tolerance modes, cutoff boundary (05:55 vs 06:00), Thursday 01:00 end, merge rules.

---

## 5. Staff section: monthly list (main screen)

- Under the personnel section: upload Excel (§3) and a per-employee monthly view (employee + Jalali month picker). One row per business day of the month, including days without punches, showing all §4.6 fields, weekday, source badges per time (auto-filled times visually distinct), and the explanation text.
- Day status per day: حاضر (computed) / غیبت / مرخصی استحقاقی / مرخصی استعلاجی / آف. Days with no punches start as «تعیین‌نشده»; show the count of undetermined days.
- Editing from the list: change any of the four times, add a punch, delete a punch, set status, add a note, reset a day to computed. Edits are stored as an override layer on top of raw punches (raw data is never modified); recalculation and re-uploads keep overrides. When a time is edited manually, replace the auto explanation with «توسط مدیر اصلاح شد» plus the optional note.
- Approve pending overtime per day (full, partial minutes, or reject) with an optional note.
- Explicit **ذخیره** for the month view with unsaved-changes warning, plus an audit log (who, what, old → new, when).
- An all-staff "needs attention" view for the month: days with needs_review, auto-fills, pending overtime, or undetermined status, so corrections can be done in one pass.

---

## 6. Monthly attendance report (per employee, plus all-staff summary)

Total worked, total required hours, total lateness, total early exit, total deficit, approved overtime, net; number of shifts (double = 2); present days, single-shift days, double-shift days; absence days; entitlement leave; sick leave; off days; undetermined days; number of auto-filled and manually edited days. Export the monthly list and the report to Excel, and a printable RTL page per employee that includes the daily explanations.

---

## Notes
- Timezone Asia/Tehran. Store the punch timestamp and the business date separately.
- Ask before adding dependencies beyond a Jalali date library and an xlsx parser.
- Weekly shift schedule integration will come later; keep the day model ready for an "expected shift" field.
