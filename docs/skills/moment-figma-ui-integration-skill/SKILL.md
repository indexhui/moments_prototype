---
name: moment-figma-ui-integration-skill
description: Use this skill when implementing a Figma design into the Moment prototype and the main challenge is deciding the correct in-game container, such as whether the design should be a page, center phone-stage view, overlay, modal, or subcomponent. It guides how to borrow layout and hierarchy from Figma without accidentally recreating the surrounding container UI.
---

# Moment Figma UI Integration Skill

Use this skill when the user provides a Figma design for `moment_prototype` and asks to build or adapt it into the game.

This skill is for **UI placement and container judgment**, not for story-script implementation.

## Read These First

Before changing code, read only these files:

1. `/Users/hugh/works/moment_prototype/docs/FIGMA_UI_INTEGRATION_RULES.md`
2. `/Users/hugh/works/moment_prototype/src/components/game/ArrangeRouteView.tsx`
3. `/Users/hugh/works/moment_prototype/src/components/game/GameSceneView.tsx`
4. `/Users/hugh/works/moment_prototype/src/components/game/GameFrame.tsx`

Read additional files only after you know which container owns the new UI.

## Core Rule

Do not start by copying the whole Figma frame.

First identify what the frame represents **inside the game**:

- full page
- center phone-stage content
- overlay / modal
- section inside an existing screen
- standalone small component

If this is unclear, stop and resolve the container first.

## Placement Workflow

For each Figma task, answer these questions in order:

1. Which existing game flow owns this UI?
   - `ArrangeRouteView`
   - `GameSceneView`
   - `GameFrame`
   - event modal
2. Is the Figma frame content, or is it also showing a container for presentation?
3. Which parts should be borrowed?
   - spacing
   - hierarchy
   - proportions
   - grouping
4. Which parts should **not** be rebuilt?
   - duplicated page header
   - duplicated footer
   - duplicated outer phone shell
   - showcase-only layout chrome

Implement only after these answers are clear.

## Default Interpretation Rules

### 1. Phone-like Figma frames are usually not new routes

If a Figma frame looks like a phone screen, first assume it belongs to:

- the center game stage, or
- an overlay on top of the center game stage

Do not default to creating a new route.

### 2. Arrange-route additions usually belong to overlays

If the design is:

- temporary reference information
- a location guide
- a mission explanation
- something the player checks and then returns from

Prefer an overlay or modal inside `ArrangeRouteView`.

### 3. Do not recreate existing chrome

If the current owning screen already provides:

- title bar
- footer button
- shell framing

and the Figma frame includes them only for positional context, do not rebuild them.

### 4. Preserve project patterns over literal Figma output

Reuse the project's existing patterns and components first:

- Chakra UI layout primitives
- existing overlay structure
- existing phone-stage sizing
- existing button and panel conventions

Figma is for layout intent, not literal DOM structure.

## Example: Map Overlay

Correct interpretation for the map design used in arrange route:

- owner: `ArrangeRouteView`
- container: overlay
- borrow from Figma:
  - map card position
  - internal spacing
  - yellow device-like frame inside the modal
- do not rebuild:
  - outer page header
  - outer page footer / depart button
  - whole route as a separate page

## Output Expectations

When using this skill:

- state the intended container in one sentence before implementing
- implement only the content that belongs to that container
- mention any Figma parts intentionally omitted because they belong to outer chrome
