# ELV Project Acceptance System

Offline-first web prototype for ELV/BMS project acceptance, inspection records, progress tracking, comments, and photo evidence.

## Current MVP

- Mobile-friendly project, location, team/category, equipment, and inspection flow
- Desktop dashboard with project progress, open issues, and person statistics
- Bilingual UI switch between Traditional Chinese and English
- Local browser storage for records and photos
- Offline status indicator and pending-sync queue
- PWA manifest and service worker cache for offline loading

## Run Locally

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL shown by Vite, usually `http://127.0.0.1:5173/`.

## Build

```powershell
npm.cmd run build
```

## Suggested Next Phase

- Add backend API, PostgreSQL schema, and authentication
- Replace local-only sync with server-backed sync and conflict handling
- Add Excel import/export for device lists and checklist templates
- Generate PDF acceptance reports
- Connect AI translation for comments and report text
