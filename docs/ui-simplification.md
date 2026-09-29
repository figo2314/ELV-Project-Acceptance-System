# Local UI simplification — 2026-09-29

Scope: local frontend only. No staging deployment, backend changes, credential changes, or production data changes.

## Changes

- Separate Management / Field navigation; compact account menu and sync status.
- Compact overview metrics with explicit project inspection actions.
- Default inspection list with expandable row editors; retain advanced spreadsheet view.
- Field workflow: find equipment, choose a point, record result/notes, explicitly save attachments. Point metadata is collapsed by default.
- Team list with expandable account forms and a working Add team member entry point.
- Validation toast no longer re-renders and clears unfinished forms.
- Responsive list/editor styles and faster debounced search.

## Verification

- JavaScript syntax check: passed.
- Vite production build: passed.
- git diff --check: passed (Windows line-ending warning only).
- Local web http://127.0.0.1:5188/: HTTP 200.
- Local API http://127.0.0.1:4177/api/ready: HTTP 200, JSON development store.
- Browser login and bootstrap: passed.
- Team Add opens form; missing username/password shows validation and preserves entered name: passed. Test name cleared; no account created.
- Field search finds AHU-PLANT-01 and opens point inspection controls: passed.
- Spreadsheet / simple-list toggle: passed.
- Phone 390px Field and inspection list: no document horizontal overflow.
- Tablet 820px Field: no document horizontal overflow.
- Desktop inspection list visually reviewed. Temporary viewport override reset after testing.

## Remaining checks

Actual record writes, account CRUD, attachment upload, offline replay and PostgreSQL smoke tests were not rerun in this UI pass. These are not claimed as verified. Check note blur followed immediately by result selection, and preservation of selected attachments during re-render, before release.

Local services use ports 5188 and 4177. Impeccable update was attempted with user approval but upstream bundle verification returned HTTP 404; installed skill remains unchanged.

## Follow-up workflow and staging release

- Notes now have an explicit Save notes action, avoiding blur-triggered re-render before the next result click.
- Unsaved notes and file selections are retained per point/record across in-app navigation and re-render, in memory only. Closing/reloading with drafts prompts a warning; sign-out asks before discarding drafts.
- Attachment save disables repeated submission and exposes a saving state. Storage failure retains selected files and reports failure rather than silently accepting partial local storage.
- Removed delayed record-save toast renders that could interrupt active forms.
- Service worker cache version updated for this UI release.
- Local browser: notes saved, survived reload, then were cleared and synchronized; attachment selection survived point switching, uploaded successfully and returned to Synced. One test screenshot attachment remains on local AHU-PLANT-01; no staging record was edited by these tests.
- Local phone Field page at 390px: document width equals viewport width.
- Offline chaos simulation passed: 100 mutations, 20 assets, 7 conflicts. This is a simulation, not a physical-device offline/reconnect test.
- Staging frontend published 2026-09-29 using the allowlisted publish script. See DEPLOYMENT_REPORT.md for backup, verification and limitations.
