# Neuro Visual Training Minigames Specification

## Objective

Create a browser-based set of interactive minigames that help people train visual and neurocognitive skills through short, focused play sessions.

The product has two layers:

- A Vue-powered catalog where users can browse, search, and filter minigames.
- Phaser-powered minigames that provide the actual interactive training experiences.

## Target Experience

Users arrive at a main catalog view that presents each minigame as a card with:

- A visual preview.
- A concise summary.
- The primary skill area.
- Difficulty and expected duration.

Users can search by title, summary, difficulty, or skill area. They can also filter by skill category. Selecting a card opens the play view for that minigame.

## Skill Areas

Initial skill categories:

- Visual Search: spotting targets, contrast changes, and visual differences.
- Reaction: responding quickly to visual signals.
- Tracking: following moving objects or maintaining attention on motion.
- Memory: remembering and reproducing visual sequences.

Additional categories should be added only when a game meaningfully trains a distinct skill.

## Current Minigames

- Contrast Catch: find the odd target in a field of similar shapes.
- Flash Focus: respond to a visual signal as quickly as possible.
- Smooth Pursuit: track a moving point through changing paths.
- Sequence Scan: remember and repeat visual grid sequences.

These are currently catalog entries with a shared placeholder Phaser play scene. Each future minigame should replace or extend the shared scene with its own mechanics.

## Architecture

Vue owns the application shell:

- `src/main.ts` mounts the Vue app.
- `src/App.vue` manages catalog search, filtering, selection, and play view state.
- `src/components/GameCard.vue` renders a minigame card.
- `src/components/PreviewMark.vue` renders lightweight catalog previews.
- `src/components/PhaserGame.vue` creates and destroys the Phaser game instance.
- `src/data/minigames.ts` stores catalog metadata.

Phaser owns gameplay:

- `src/game/main.ts` builds the Phaser game config.
- `src/game/scenes/TrainingScene.ts` is the current Phaser scene.
- `src/game/EventBus.ts` allows Phaser scenes and Vue components to communicate.

This follows the same broad pattern as `phaserjs/template-vue-ts`: Vue handles interface state, Phaser runs inside a component, and an event bus bridges scene readiness or gameplay state back to Vue.

## Gameplay Requirements

Each minigame should:

- Have a clear skill objective.
- Be playable in a short session, ideally 1 to 5 minutes.
- Provide immediate visual feedback.
- Track simple performance signals such as score, accuracy, misses, streak, or reaction time.
- Avoid overstimulating motion, flashing, or contrast patterns unless the game explicitly requires them and provides appropriate settings.
- Work with pointer input first, with keyboard input where useful.

## Catalog Requirements

The main view must support:

- Text search.
- Skill-area filtering.
- A responsive card grid.
- A clear empty state when no minigames match.
- One-click transition into the selected minigame.

## Accessibility And Safety

The application should prioritize:

- Readable contrast.
- Stable layouts across mobile and desktop.
- Tap targets that are comfortable on touch devices.
- Minimal surprise motion in the Vue shell.
- Future in-game settings for reduced motion, colorblind-friendly palettes, and session length.

Because some users may be sensitive to fast visual stimuli, avoid intense flashing and document any game that uses rapid visual changes.

## Technical Stack

- Vite
- TypeScript
- Vue 3
- Phaser
- pnpm

## Future Work

- Add per-minigame Phaser scenes and route selection into those scenes.
- Add score summaries after each session.
- Persist local progress and best scores.
- Add user-facing settings for motion intensity, color palette, session duration, and input mode.
- Split Phaser into a lazy-loaded chunk if the catalog should load before gameplay code.
