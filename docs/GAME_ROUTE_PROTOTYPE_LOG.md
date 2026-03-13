# Moment Prototype - Game Route Prototype Log

## Scope

This document records the current game prototype features and the implementation logic, focused on:

- story scene flow
- in-page history modal
- "arrange route" puzzle stage
- route tile drag/drop, validation, and rollback behavior

## Current Feature Summary

### 1) Entry and Stage Flow

- Home page provides a central mobile canvas (393x852 style target).
- "開始遊戲" now goes to the arrange-route stage first.
- Arrange route stage "出發" then enters story scene flow.

Related routes:

- `/` (home)
- `/game/arrange-route` (route arrangement stage)
- `/game` (first story scene)
- `/game/[sceneId]` (dynamic scene)

---

### 2) Scene System (Data Driven)

Scenes are defined in `src/lib/game/scenes.ts`.

Each scene supports:

- `sceneLabel`
- `backgroundImage` / `backgroundColor`
- `characterName` / `characterAvatar`
- `dialogue`
- `nextSceneId`
- chapter association for history scope

Scene rendering uses:

- `GameSceneView` for center mobile screen
- `GameFrame` as desktop shell (left/right info sidebars + centered phone canvas)

---

### 3) In-Page History (回顧) Modal

- Triggered by the second icon in scene UI.
- Implemented as full-screen overlay modal in the same page (no route jump).
- Includes fade/slide motion.
- Only displays dialogues up to current scene progress in the same chapter.

---

### 4) Left Sidebar Utility

Left sidebar (`GameFrame`) currently includes:

- scene/basic info
- progress display
- dev helper button: quick jump to arrange-route stage
- restart button

This is intentionally stable so center gameplay UI can evolve independently.

---

### 5) Arrange Route Stage (Core Puzzle)

Implemented in `src/components/game/ArrangeRouteView.tsx`.

Current interactions:

- route tiles can be dragged from bottom palette to board cells
- placed tiles can be dragged to another board cell (reposition)
- placed tiles can be dragged back to bottom palette (recall/remove)
- tile palette is horizontally scrollable (avoids tile deformation)

Board concepts:

- fixed start cell (home) and end cell (company)
- route tile is represented as a 3x3 pattern
- connectors are derived from pattern edges

---

## Validation and Connection Logic

### 1) Tile Model

Each tile is modeled with:

- `id`
- `label`
- `pattern: number[3][3]` (1 = road path, 0 = empty)

Edge connectors are computed from pattern:

- top/bottom can be multi-slot
- left/right currently use the center side slot rule to avoid corner ambiguity

### 2) Start/End Connector Rules

Start and end use explicit connector definitions (level-tunable):

- start currently uses full-width style exit (`[0,1,2]` semantics)
- end uses a constrained receive slot setup

### 3) Match Rule

Neighbor edges use strict equality matching of slot arrays.

Meaning:

- `0-3` must connect to `0-3`
- `0-1` cannot connect to `0-3`

### 4) Whole-Route Connectivity

Global connectivity is checked with BFS:

- search starts from start cell
- traversal only follows exact connector matches
- route is valid if end cell is reachable

---

## Placement Failure UX (Current Behavior)

The current UX intentionally supports player learning:

1. Early exploration can place imperfect tiles.
2. Once both key gate cells are filled (after-start and before-end), stricter checks are applied.
3. If invalid:
   - tile is shown as placed first
   - error toast/notice appears: `路線銜接不起來`
   - then rollback happens
4. Rollback targets are based on endpoint-neighbor mismatch checks (not blindly "latest tile" only).

The error notice:

- absolute overlay
- fade in/out
- non-layout-shifting

---

## Notable Stability Fixes

- Chakra provider uses `@chakra-ui/next-js` cache provider to reduce hydration mismatch risk.
- `GameFrame` uses mounted-guard strategy to avoid server/client first-render mismatch in this prototype stage.

---

## Suggested Next Refactor

`ArrangeRouteView.tsx` is now large and should be split for maintainability:

- `route-tiles.ts` (tile definitions)
- `route-logic.ts` (connector + bfs + validation helpers)
- `ArrangeRouteBoard.tsx` (board rendering + drop handlers)
- `ArrangeRoutePalette.tsx` (tile palette + recall interactions)
- `ArrangeRouteNotifications.tsx` (error feedback)

This will reduce risk when adding more tile types and stage variants.

