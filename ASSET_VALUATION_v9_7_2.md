# Asset Valuation Model v9.7.2

## Source
Source workbook: `Rayo_Master_Asset_Management_Final_1405.xlsx`

The workbook defines the master asset catalogue, stable ItemIDs, base prices, pricing groups, depreciation rates, current quantities and asset-management workflow. The baseline FX rate is 94,000 Toman and the new requested current rate is 188,000 Toman.

## Current valuation logic
The stored base price remains historical and is not overwritten when FX changes.

`Current Unit Value = Base Unit Price × FX Factor × Depreciation Factor`

Where:
- `FX Factor = Current FX / Base FX`
- `Depreciation Factor = max(0, 1 - Annual Depreciation Rate × Depreciation Period)`
- `Current Total Value = Current Unit Value × Valuation Quantity`

Default settings in this build:
- Base FX: 94,000 Toman
- Current FX: 188,000 Toman
- FX factor: 2.0
- Depreciation period: 1 year

## Group depreciation rates
- General: 10%
- Digital / light electrical: 10%
- Industrial / kitchen / facilities: 15%
- Durable stainless / metal: 5%
- Furniture / decor / lighting: 15%
- Low-durability / consumables / dishes / plants: 20%
- Renovation / construction: 10%

The manager can change these rates from Assets → Categories & Settings. Imported assets use their pricing-group rate automatically. A per-asset rate is only an explicit override.

## Example
For an All-in-One computer with a 100,000,000 Toman base price and 10% annual depreciation:

`100,000,000 × (188,000 / 94,000) × (1 - 0.10 × 1) = 180,000,000 Toman`

## Initial data
- 190 asset types were loaded into the seed with stable ItemIDs.
- The source workbook reports 405 active asset tags.
- Individual tag distribution is not guessed in the seed. Exact tag-level detail can be upserted later through the enhanced Excel importer.
- Current aggregate valuation under default settings: 74,757,300,000 Toman.

## Safe update behavior
The one-time migration fills missing source valuation fields and preserves existing operational records where they already exist. It does not delete maintenance history, quantity transactions or counts.
