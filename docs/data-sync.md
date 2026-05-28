# Frontend and Backend Data Sync

The app is local-first. Users can play without an account, and the frontend stores preferences and play history in browser `localStorage`. Creating an account adds optional cloud save/load through the Rocket backend.

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

Anonymous users only use local storage. Account users still use local storage, and the app syncs that local state to the backend in the background when the backend is reachable.

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

## Sync Flow

1. Anonymous play
   - User configures a minigame.
   - `gameSettingsStore` saves settings locally.
   - Phaser emits `game-finished`.
   - `historyStore` saves the playthrough locally.

2. Create account
   - The Register screen calls `accountStore.createAccount`.
   - Frontend sends `POST /api/users`.
   - Backend creates a `users` row and an empty `user_preferences` row.
   - Frontend remembers the returned user id locally.

3. Login
   - The Login screen calls `accountStore.login`.
   - Frontend sends `POST /api/login`.
   - Backend looks up the user by username and returns the user id.
   - Frontend loads cloud preferences and history into local storage.

4. Background sync
   - `AccountNav.vue` watches local settings and history.
   - When local data changes, the app schedules a background sync.
   - Frontend sends local settings with `PUT /api/users/:userId/preferences`.
   - Frontend sends local history with `PUT /api/users/:userId/history`.
   - Backend replaces the user's cloud history with the submitted records.
   - The UI shows a syncing indicator while requests are in flight.

5. Load from cloud
   - Frontend calls `GET /api/users/:userId/sync`.
   - Backend returns user, preferences, and history.
   - Frontend merges cloud settings/history with local settings/history.
   - Local settings win on conflicts, which protects offline edits.

6. Play while signed in
   - Completed playthroughs are written locally first.
   - The background sync watcher notices the local history change and syncs it.

7. Offline and retry
   - If the backend is unavailable or the browser is offline, local storage remains the source of truth.
   - The account store marks the sync as pending/offline.
   - When the browser comes back online, `AccountNav.vue` retries sync automatically.

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
