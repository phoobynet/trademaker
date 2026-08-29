# TradeMaker Project Status

Updated: 29 August 2026

## Current direction

TradeMaker is moving away from an IDE-style docking workspace. Do not continue,
repair, or polish the Dockview implementation.

The approved visual direction is **Graphite Observatory**: a dark graphite
desktop with sea-glass signal colour, compact typography, strong iconography,
restrained depth, and meaningful information graphics. Behaviour should feel
familiar to a macOS user without copying macOS chrome.

The application should use freely overlapping in-browser windows with:

- front-to-back focus and clear active-window treatment;
- dragging and edge/corner resizing;
- minimise, maximise, restore, and close operations;
- persistent window geometry and state;
- one coherent ticker-dossier window;
- supporting tool windows for news, charts, filings, and related-company
  research.

Whether the task dock is always visible or auto-hides remains undecided. Resolve
that choice before implementing the replacement shell.

## Work worth keeping

The pnpm/Vite/Vue/TypeScript foundation, simulated analysis story, accessible
domain components, JSON-safe state cloning, component registry, and tested
state-lifecycle concepts are reusable. The domain components do not import
Dockview and can be reorganised into the dossier and supporting tool windows.

Commit `fc7477f` (`workspace: strengthen lifecycle coverage`) is the last
pre-Dockview recovery point and the safest base for the replacement interface.
Its visual shell is not approved, but its tooling, content, and state model are
useful.

## Archived obsolete work

Commit `66d8226` introduced the rejected Dockview canvas. Commit `24378df`
preserves the interrupted follow-up investigation exactly as it was found.
These commits remain in history so no work is lost, but they are reference
material only.

Before archival, the worktree passed TypeScript checking and all 79 unit tests.
The formatting gate failed in four interrupted Dockview files. That failure was
preserved deliberately instead of polishing code for an abandoned direction.

The old goal under `goals/multi-panel-workspace-demo` is blocked and obsolete.
Its unchecked task list is also stale: it does not reflect the implementation
commits already present.

## Not implemented yet

- A TradeMaker-owned free-window manager.
- Window geometry, z-order, focus, dragging, and edge/corner resizing.
- The approved ticker-dossier and supporting tool-window structure.
- Meaningful production-quality charts.
- Workspace persistence and restoration for the replacement window model.
- Browser interaction and accessibility tests for the replacement interface.

## Safest continuation

1. Preserve the historical Dockview commits; do not develop on top of them.
2. Start a new branch/worktree from `fc7477f`.
3. Write and review a replacement Graphite Observatory goal and implementation
   plan, including the task-dock decision and a serializable free-window model.
4. Build the replacement shell test-first while reusing the foundation and
   domain content.

The selected visual-direction source is tracked at
`.superpowers/brainstorm/58906-1788023803/content/visual-style.html`.
