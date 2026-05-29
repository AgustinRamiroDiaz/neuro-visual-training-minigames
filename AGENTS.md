# Agent Guide

## Project Purpose

This project builds neuro and visual training minigames. The main catalog is Vue. Each playable minigame is Phaser.

Keep the experience focused: users should quickly find a drill, understand what it trains, and start playing.

## Commands

```bash
pnpm --dir frontend install
pnpm --dir frontend run dev
pnpm --dir frontend run lint
pnpm --dir frontend run build
pnpm --dir frontend run preview
cargo check --manifest-path backend/Cargo.toml
docker compose up --build
```

Use `pnpm --dir frontend run lint` and `pnpm --dir frontend run build` as the default frontend verification commands after code changes. Use `cargo check --manifest-path backend/Cargo.toml` after backend changes.

## Code Layout

- `frontend/src/main.ts`: Vue app entry.
- `frontend/src/App.vue`: router shell.
- `frontend/src/views/`: route-level Vue screens.
- `frontend/src/components/`: Vue UI components.
- `frontend/src/minigames/registry.ts`: playable minigame registrations.
- `frontend/src/minigames/types.ts`: pluggable minigame interface.
- `frontend/src/data/minigames.ts`: compatibility re-export of the registry.
- `frontend/src/game/`: Phaser setup, event bridge, and scenes.
- `frontend/src/stores/`: Pinia stores for local/cloud state.
- `backend/`: Rocket API, sqlx migrations, and Postgres-backed persistence.
- `SPEC.md`: product and architecture specification.

## Development Conventions

- Keep Vue responsible for browsing, filtering, layout, menus, settings, and session summaries.
- Keep Phaser responsible for interactive gameplay, animation, physics, and in-game input.
- Add new playable minigames through `frontend/src/minigames/registry.ts`.
- Put minigame-specific setup UI beside the minigame under `frontend/src/minigames/<game-id>/`.
- Keep `frontend/src/App.vue` as a router shell; do not add per-minigame configuration branches there.
- Store custom setup presets through `frontend/src/presets/presetStore.ts` or `useStoredPresets`; do not call `localStorage` directly from setup components.
- Use Pinia stores for shared frontend state such as history, persisted settings, and optional cloud account state.
- Prefer one Phaser scene per distinct game once mechanics diverge.
- Use `frontend/src/game/EventBus.ts` for narrow communication from Phaser to Vue, such as scene readiness, score updates, game-over events, or settings changes.
- Destroy Phaser game instances when leaving play views to avoid duplicate canvases and stale listeners.

## UI Guidance

- The catalog should feel like a focused training tool, not a marketing page.
- Cards are appropriate for minigame selection because each card is an action target.
- Keep copy short and practical: skill area, what the game trains, duration, and difficulty.
- Maintain responsive layouts for desktop, tablet, and mobile.
- Avoid decorative UI that competes with the game previews.

## Gameplay Guidance

- Make each game understandable within a few seconds.
- Prefer short rounds and immediate feedback.
- Record useful training signals: score, accuracy, reaction time, streak, misses, or completion time.
- Include safety considerations for motion, flashing, and high-contrast stimuli.
- Do not add rapid flashing effects without a user setting or a clear reason.

## Verification

Before handing off changes:

- Run `pnpm --dir frontend run build`.
- Run `cargo check --manifest-path backend/Cargo.toml` after backend changes.
- Check that the Vue catalog renders.
- Check that search and skill filters work.
- Check that selecting a minigame creates a Phaser canvas.
- Check that returning to the catalog destroys the play view cleanly.
