# Offline Core Engine Complete

This phase upgrades the frontend offline architecture from a visible pending-record queue into a transactional offline-first core with binary asset caching, independent retry state, and field-level conflict resolution.

## Architectural Choices

### IndexedDB Transaction Stores

`src/modules/state.js` now defines a dedicated offline sync database:

- Database: `elv-offline-sync-core`
- Store: `pending_mutations`
  - Tracks structural mutations such as `record.update`, `record.merge`, and `form.upload`.
  - Indexed by `equipmentId`, `recordId`, and `retryAt` so independent equipment queues can move separately.
- Store: `pending_assets`
  - Tracks raw `Blob` assets for photos, PDFs, drawings, and documents.
  - Linked to mutations through `mutationId`.

This avoids storing large files in `localStorage`, reducing `QuotaExceededError` risk and keeping persistent UI state separate from binary payloads.

### Binary Asset Caching

When media upload fails because the API is offline or unavailable, the UI rebuilds the `FormData` into:

- scalar metadata in `pending_mutations.formFields`
- binary files in `pending_assets.blob`
- asset references in `pending_mutations.assetIds`

The replay loop reconstructs `FormData` from IndexedDB and retries `apiFormPost()` when the user clicks Retry Now or when sync is triggered.

### Retry And Backoff

`state.js` implements jittered exponential backoff:

```text
delay = Math.min(60000, 1000 * Math.pow(2, attempt)) + Math.random() * 1000
```

Retry metadata is stored per mutation, so one frozen upload does not block unrelated equipment mutations.

### Field-Level Merge State

`src/modules/ui.js` replaces the simple client/server-wins dialog with `renderGranularConflictModal()`.

For each conflict:

- Local and server records are compared field by field.
- Mismatched fields render as a matrix row.
- Each row has a checkbox deciding whether that field uses local or server data.
- `commitGranularConflictMerge()` builds a merged record from the selected fields.
- The merged record is queued as `record.merge`, updates the local revision token, and force-runs sync.

Tracked fields currently include:

- `status`
- `result`
- `assignee`
- `comments`
- `due`
- `title`
- `reference`
- `updatedAt`

### Chaos Simulation

`scripts/simulate-offline-chaos.mjs` simulates:

- 100 randomized offline point mutations.
- 20 binary file uploads.
- independent equipment retry buckets.
- mock 409 conflicts.
- field-level merge selection.

Assertions verify that entries and binary blobs are not dropped, retry state advances, and granular conflict diffs are generated.

## Validation

- `node --check src/modules/state.js` passed.
- `node --check src/modules/ui.js` passed.
- `node --check scripts/simulate-offline-chaos.mjs` passed.
- `node scripts/simulate-offline-chaos.mjs` passed.
- `npm run build` passed with 0 errors.
