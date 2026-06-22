# Offline Sync Passed

Phase 3 has been completed and the app builds successfully.

## Updated Modules

- `src/modules/state.js`
  - Added `SYNC_RETRY_DELAYS`.
  - Added `getPendingSyncRecords(data)`.
  - Added `getSyncQueueCount(data)`.
  - Added `getNextSyncRetryDelay(attempt)`.
  - Added `createSyncRetryState(attempt, now)`.
  - Added `clearSyncRetryState()`.

- `src/modules/api.js`
  - `createApiError()` now preserves parsed response bodies on `error.body`, allowing 409 conflict payloads to be handled by the UI.

- `src/modules/ui.js`
  - Added sync queue state: `syncQueueOpen`, `activeConflictId`, `syncRetryAttempt`, and `syncRetryAt`.
  - Updated `renderTopbar()` so pending records become a clickable sync status badge.
  - Added `renderSyncQueueModal()` and `renderSyncQueueItem()`.
  - Added reusable conflict UI via `showConflictModal(localData, serverData, conflict)`.
  - Added `renderConflictModal()` and `renderConflictChoice()`.
  - Updated `syncRecords(showToast, options)` with retry backoff, 409 handling, and conflict modal triggering.
  - Added sync helpers: `extractConflictsFromError()`, `scheduleSyncRetry()`, `getSyncRetryWaitSeconds()`, and `getActiveConflict()`.
  - Added conflict actions: `openConflictForRecord()`, `closeConflictModal()`, `resolveActiveConflict()`, `keepServerConflictData()`, and `useLocalConflictData()`.
  - Added event handlers for `data-sync-queue-toggle`, `data-close-sync-queue`, `data-retry-sync`, `data-sync-record`, `data-close-conflict`, and `data-resolve-conflict`.

- `src/styles.css`
  - Added button reset/hover/focus styling for clickable `.sync-pill` badges.

## Validation

- `npm run build` passed with 0 errors.
- `git diff --check` passed.
