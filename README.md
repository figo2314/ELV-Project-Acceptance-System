# ELV Project Acceptance System

Offline-first web prototype for ELV/BMS project acceptance, inspection records, progress tracking, comments, and photo evidence.

## Current MVP

- Mobile-friendly project, location, team/category, equipment, and inspection flow
- Field workflow with project/location/team filters, equipment cards, point action list, quick Pass/Fail/N/A, and shared comment suggestions
- Field users can add new site points/sub-devices and correct existing point metadata during inspection
- PM-style admin command center with per-project equipment, point, inspection, issue, completion, and manager tracking
- High-visibility dashboard with portfolio completion, equipment/point totals, issue load, unassigned items, overdue items, project performance, and attention list
- Admin layout with left navigation and dedicated pages for Dashboard, Data Table, Import & Sync, Issues, and People
- English-first UI with Traditional Chinese toggle
- Equipment, point, and sub-device hierarchy for BMS/ELV inspections
- Admin equipment manager with Excel import, template download, direct web edit/update, and Excel-like row editing
- Import & Sync supports drag-and-drop Excel validation before committing data to the database
- Local browser storage for records, camera photos, and file attachments
- Offline status indicator, pending-sync queue, and API-backed sync
- PWA manifest and service worker cache for offline loading
- Lightweight Express API with a JSON database at `data/db.json`
- PostgreSQL migration-ready schema at `docs/postgres-schema.sql`

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL shown by Vite, usually `http://127.0.0.1:5173/`.

The API runs at `http://127.0.0.1:4177/api`.

## Web Data Management

Use the Admin tab for small projects or quick edits:

- Add equipment directly from the web form
- Filter by project and equipment
- Edit one point/sub-device per row in an Excel-like table
- Update project manager ownership
- Edit project, location, team, equipment, point, reference, assignee, due date, and status

Changes are saved to the local API database at `data/db.json`.

## Excel Import

Use the Admin tab, click `Download Excel Template`, fill it in, then upload `.xlsx`, `.xls`, or `.csv` with `Import Excel`.

The Import & Sync page validates files in the browser before writing to the database. It blocks duplicate points under the same project/location/equipment and missing required columns, and warns about unknown equipment types.

Supported column names:

- `Project`
- `Location`
- `Team` / `Category` / `System`
- `Equipment` / `Equipment Name` / `Device`
- `Type` / `Equipment Type`
- `Point` / `Point Name` / `Sub Device`
- `Point Type` / `Signal Type`
- `Reference` / `Expected`
- `Assignee`
- `Due` / `Target Date`

Each row represents one point/sub-device under an equipment item. Repeat the same `Equipment` value with different `Point` values to create multiple points under the same device.

## Build

```powershell
npm.cmd run build
```

## Suggested Next Phase

- Replace the JSON database with PostgreSQL using `docs/postgres-schema.sql`
- Add authentication and role-based permissions
- Add Excel export for device lists and checklist templates
- Generate PDF acceptance reports
- Connect AI translation for comments and report text
