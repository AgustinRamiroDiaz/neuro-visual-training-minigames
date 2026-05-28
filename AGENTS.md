# Agent Guide

## Project Purpose

This project builds neuro and visual training minigames. The main catalog is Vue. Each playable minigame is Phaser.

Keep the experience focused: users should quickly find a drill, understand what it trains, and start playing.

## Commands

```bash
pnpm install
pnpm run dev
pnpm run build
pnpm run preview
```

Use `pnpm run build` as the default verification command after code changes.

## Code Layout

- `src/main.ts`: Vue app entry.
- `src/App.vue`: catalog and play-view state.
- `src/components/`: Vue UI components.
- `src/data/minigames.ts`: minigame metadata used by the catalog.
- `src/game/`: Phaser setup, event bridge, and scenes.
- `SPEC.md`: product and architecture specification.

## Development Conventions

- Keep Vue responsible for browsing, filtering, layout, menus, settings, and session summaries.
- Keep Phaser responsible for interactive gameplay, animation, physics, and in-game input.
- Add minigame metadata in `src/data/minigames.ts` before exposing a new game in the catalog.
- Prefer one Phaser scene per distinct game once mechanics diverge.
- Use `src/game/EventBus.ts` for narrow communication from Phaser to Vue, such as scene readiness, score updates, game-over events, or settings changes.
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

- Run `pnpm run build`.
- Check that the Vue catalog renders.
- Check that search and skill filters work.
- Check that selecting a minigame creates a Phaser canvas.
- Check that returning to the catalog destroys the play view cleanly.
