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

Anonymous users only use local storage. Account users still use local storage, but can save that local state to the backend or load backend state into local storage.

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
   - `AccountPanel.vue` calls `accountStore.createAccount`.
   - Frontend sends `POST /api/users`.
   - Backend creates a `users` row and an empty `user_preferences` row.
   - Frontend remembers the returned user id locally.

3. Save to cloud
   - Frontend sends local settings with `PUT /api/users/:userId/preferences`.
   - Frontend sends local history with `PUT /api/users/:userId/history`.
   - Backend replaces the user's cloud history with the submitted records.

4. Load from cloud
   - Frontend calls `GET /api/users/:userId/sync`.
   - Backend returns user, preferences, and history.
   - Frontend replaces local settings and local history with the cloud data.

5. Play while signed in
   - Completed playthroughs are written locally first.
   - `PlayView.vue` then asks `accountStore` to save current local settings and history to cloud.

## API Summary

- `GET /api/health`
  - Service health check.

- `POST /api/users`
  - Creates a cloud user.

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

- `GET /api/users/:userId/sync`
  - Returns user, preferences, and history in one request.

## Current Limits

There is no real authentication yet. The frontend stores the returned user id locally and uses it as the cloud account reference. That is enough for local development and cloud-save plumbing, but production auth should add passwords, sessions or tokens, and account recovery.
