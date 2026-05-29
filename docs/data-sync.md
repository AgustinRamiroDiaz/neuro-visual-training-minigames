# Frontend and Backend Data Sync

The app is local-first. Users can play without an account, and the frontend stores preferences and play history in browser `localStorage`. Creating an account adds cloud sync through the Rocket backend, but the local app remains usable while offline or while the backend is unavailable.

The important rule is that anonymous progress and account progress are treated as separate local profiles:

- Anonymous progress is restored whenever no account is logged in.
- Account progress is active only while a user is logged in.
- Login asks whether the current local progress should be uploaded and merged into the account.
- Logout removes the active account data from local storage and restores the anonymous profile.

## Frontend Storage

The frontend keeps shared state in Pinia stores:

- `frontend/src/stores/historyStore.ts`
  - Stores completed playthrough records.
  - Persists locally through `frontend/src/history/playHistory.ts`.
  - Records include timestamp, game id, game name, and arbitrary metadata.

- `frontend/src/stores/gameSettingsStore.ts`
  - Stores each minigame's latest settings by game id.
  - Persists locally in `localStorage`.

- `frontend/src/stores/accountStore.ts`
  - Stores the optional cloud account id and sync status.
  - Calls backend sync helpers in `frontend/src/api/cloudSync.ts`.

- `frontend/src/sync/localProfiles.ts`
  - Contains profile-level helpers for anonymous backups, active account cleanup, and merge behavior.
  - Keeps login/logout storage policy out of unrelated views.

- `frontend/src/sync/useCloudSync.ts`
  - Owns background sync lifecycle work: local state watches, debounce timing, online/offline events, and cloud/local merging.
  - Mounted once from `frontend/src/App.vue`.
  - Exposes sync display state and logout cleanup behavior for `AccountNav.vue`.

The active app always reads and writes the normal history/settings local storage keys while the user plays. The anonymous profile is kept in separate backup keys:

- `neuro-visual-training-play-history:anonymous`
- `neuro-visual-training-game-settings:anonymous`

When a user logs in or registers, the current active local state is copied into those anonymous backup keys before the account state is applied. That lets the app restore anonymous progress later, even after the active local storage has been replaced by account data.

## Backend Storage

The backend is a Rocket HTTP API using sqlx with Postgres.

Schema lives in `backend/migrations/20260528190000_initial_schema.sql`:

- `users`
  - One row per cloud account.
  - Currently lightweight: username plus optional display name.

- `user_preferences`
  - One JSONB document per user.
  - The frontend stores minigame settings in this JSON under `gameSettings`.

- `play_history`
  - One row per completed playthrough.
  - Stores timestamp, game id, game name, and metadata JSONB.
  - Stores a stable client id so cloud replaces and local merges do not duplicate existing playthroughs.

## Sync Flow

1. Anonymous play
   - User configures a minigame.
   - `gameSettingsStore` saves settings locally.
   - Phaser emits `game-finished`.
   - `historyStore` saves the playthrough locally.

2. Register or log in with existing local progress
   - The auth screen detects active local history/settings.
   - The user chooses whether to upload and merge that local progress into the account.
   - The app saves the active local progress into the anonymous backup keys before switching profiles.

3. Create account
   - The Register screen calls `accountStore.createAccount`.
   - Frontend sends `POST /api/users`.
   - Backend creates a `users` row and an empty `user_preferences` row.
   - Frontend remembers the returned user id locally.
   - If the user chose upload/merge, the anonymous progress is saved to the new account.
   - If the user chose not to upload, the new account starts with empty history/settings.

4. Login
   - The Login screen calls `accountStore.login`.
   - Frontend sends `POST /api/login`.
   - Backend looks up the user by username and returns the user id.
   - Frontend loads cloud preferences and history with `GET /api/users/:userId/sync`.
   - If the user chose upload/merge, local progress is merged with cloud progress, then pushed back to the backend.
   - If the user chose not to upload, cloud progress replaces the active local history/settings.

5. Background sync
   - `useCloudSync` watches local settings and history.
   - When local data changes, the app schedules a background sync.
   - Frontend sends local settings with `PUT /api/users/:userId/preferences`.
   - Frontend sends local history with `PUT /api/users/:userId/history`.
   - Backend replaces the user's cloud history with the submitted records.
   - The UI shows a syncing indicator while requests are in flight.

6. Load from cloud
   - Frontend calls `GET /api/users/:userId/sync`.
   - Backend returns user, preferences, and history.
   - Frontend merges cloud settings/history with local settings/history.
   - Local settings win on conflicts, which protects offline edits.

7. Play while signed in
   - Completed playthroughs are written locally first.
   - The background sync watcher notices the local history change and syncs it.

8. Offline and retry
   - If the backend is unavailable or the browser is offline, local storage remains the source of truth.
   - The account store marks the sync as pending/offline.
   - When the browser comes back online, `useCloudSync` retries sync automatically.

9. Logout
   - The app forgets the active account reference.
   - Active account history/settings are removed from the normal local storage keys.
   - The anonymous backup history/settings are restored into the active stores.
   - This keeps account-specific progress from remaining visible after logout.

## Merge Rules

Settings are stored by game id. During a merge, cloud settings are used as the base and local settings are applied on top. If both cloud and local have settings for the same game id, local wins.

History is stored as individual playthrough records with stable ids. During a merge, cloud records and local records are deduplicated by id, then sorted newest first by timestamp.

The login/register prompt controls whether the current local state participates in the merge:

- Upload and merge: current local history/settings are merged with cloud history/settings and then pushed to the backend.
- Use only cloud state: current local history/settings are kept only as anonymous backup and the account uses its cloud state.
- Start this account empty: for a new account, current local history/settings are kept only as anonymous backup and the new account starts empty.

## API Summary

- `GET /api/health`
  - Service health check.

- `POST /api/users`
  - Creates a cloud user.

- `POST /api/login`
  - Looks up a cloud user by username.

- `GET /api/users/:userId/preferences`
  - Reads preference JSON for a user.

- `PUT /api/users/:userId/preferences`
  - Replaces preference JSON for a user.

- `GET /api/users/:userId/history`
  - Lists cloud play history.

- `POST /api/users/:userId/history`
  - Adds one cloud history record.

- `PUT /api/users/:userId/history`
  - Replaces all cloud history records for a user.
  - Each record includes a stable client id so local/cloud merges do not duplicate playthroughs.

- `GET /api/users/:userId/sync`
  - Returns user, preferences, and history in one request.

## Current Limits

There is no real authentication yet. Register and Login are username-based, and the frontend stores the returned user id locally as the cloud account reference. That is enough for local development and cloud-save plumbing, but production auth should add passwords, sessions or tokens, and account recovery.
