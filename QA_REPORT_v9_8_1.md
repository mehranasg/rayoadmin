# QA Report — Rayo Admin v9.8.1

## Scope
Hotfix only for the Assets module runtime error `amShowGuide is not defined`.

## Root cause
`amShowGuide`, `amReviewIncident`, `amSaveIncidentReview`, and `assetState` are defined inside the Assets module IIFE, but v9.8.0 attempted to export them with an `Object.assign(window, ...)` statement placed after the IIFE had already closed. That statement runs outside the functions' lexical scope and throws a runtime ReferenceError.

## Fix
- Removed the invalid outside-IIFE `Object.assign` export.
- Exported `amShowGuide`, `amReviewIncident`, and `amSaveIncidentReview` from inside `amInstall()`, where those symbols are in scope.
- Preserved the existing `getAssetsState` export in the same in-scope install path.
- Bumped browser cache/build references to `9.8.1`.

## Regression scope
No feature logic, CSS, seed data, suppliers, personnel, inventory, sales analytics, finance, or other modules were modified.

## Validation
- `node --check` passed for every JavaScript file.
- All JSON files parsed successfully.
- Confirmed there is no remaining outside-IIFE `Object.assign(window,{amShowGuide...})` statement.
- Confirmed `window.amShowGuide=amShowGuide` exists inside `amInstall()`.
