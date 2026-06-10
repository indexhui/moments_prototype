# Route Puzzle Asset Rules

This document records project-specific rules for implementing route puzzle stages in Moment.

## Core Rule

Use existing route puzzle assets first.

When the user provides a screenshot, Figma frame, or visual reference for a route puzzle, treat it as a guide for:

- which existing route assets should appear
- where those assets should appear in the level
- what connection pattern the level is demonstrating

Do not treat the reference as permission to create new route tile art, generate replacement images, or swap in a custom asset set.

## Approved Route Asset Source

For standard route puzzle tiles, prefer files under:

- `/public/images/route/route_new/`

Examples:

- `/images/route/route_new/wide_to_wide_街道.png`
- `/images/route/route_new/wide_to_narrow_街道.png`
- `/images/route/route_new/wide_to_wide_捷運.png`
- `/images/route/route_new/wide_to_narrow_捷運.png`
- `/images/route/route_new/straight_捷運.png`
- `/images/route/route_new/straight_超商.png`

Only use a bespoke route tile directory when the user explicitly asks for those bespoke assets.

## Edge Metadata Must Follow Asset Keys

Route edge metadata must match the asset key:

- `wide_to_wide_*` means `topEdge: "wide"` and `bottomEdge: "wide"`
- `wide_to_narrow_*` means `topEdge: "wide"` and `bottomEdge: "narrow"`
- `narrow_to_wide_*` means `topEdge: "narrow"` and `bottomEdge: "wide"`
- `straight_*` means `topEdge: "narrow"` and `bottomEdge: "narrow"`

Do not infer edge metadata from a compressed screenshot if a named route asset exists.

## Before Editing A Route Puzzle Stage

1. Identify the owning component, such as `StorySimpleMetroRouteView.tsx` or `ArrangeRouteView.tsx`.
2. List the exact route image paths currently used by that stage.
3. Compare those paths to the user's reference.
4. If the reference shows a standard route tile, map it back to the matching `route_new` asset.
5. Update `topEdge` / `bottomEdge` from the asset key.
6. Remove unused bespoke assets from preload lists if the stage no longer uses them.

## Anti-Pattern From June 2026

In the frog return-home route after the first frog photo, bespoke `frog_return_home` tiles were used where the intended assets were the standard `route_new` street and metro tiles. This caused confusing edge metadata and false mismatch seams.

The correct fix was to use the standard assets directly, such as:

- `wide_to_wide_街道.png`
- `wide_to_narrow_街道.png`
- `wide_to_wide_捷運.png`
- `wide_to_narrow_捷運.png`

The lesson: screenshots and Figma files explain level composition; they do not authorize inventing new route tile art.
