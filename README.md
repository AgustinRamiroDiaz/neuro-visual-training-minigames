# Neuro Visual Training Minigames

Vue + Phaser frontend for short visual and neuro skill training minigames, plus a Rocket + Postgres backend for optional cloud saves.

## Frontend

```bash
pnpm --dir frontend install
pnpm --dir frontend run dev
pnpm --dir frontend run build
```

Open http://localhost:5173 in your browser.

The app works without an account using local storage. Creating an account enables cloud save/load for preferences and play history.

## Full Stack

```bash
docker compose up --build
```

Services:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000/api
- Postgres: localhost:5432

## Backend

```bash
cd backend
cargo check
cargo run
```

The backend uses Rocket, sqlx, and Postgres. Set `DATABASE_URL` when running outside Docker.

See `SPEC.md` for product direction and `AGENTS.md` for implementation conventions.

See `docs/data-sync.md` for how the frontend and backend store and sync user data.
