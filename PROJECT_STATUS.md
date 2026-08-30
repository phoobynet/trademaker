# TradeMaker Project Status

Updated: 30 August 2026

## Deployment and user scope

TradeMaker is a private, single-user application built solely for its owner.
It is not a public service, SaaS product, multi-user system, or application
intended for distribution to other users.

This is a project-wide constraint:

- do not build registration, user accounts, password recovery, organisations,
  teams, roles, permissions, billing, collaboration, or tenant isolation;
- do not introduce multi-tenant database schemas or public API compatibility
  commitments;
- optimise workflows, defaults, and stored preferences for one known user;
- keep provider credentials and research data private to that user; and
- run locally or on the owner's MS-02 Ultra, accessed through localhost or a
  private LAN/VPN rather than exposing TradeMaker directly to the public
  internet.

Operating-system accounts, SSH, firewalling, private-network access, encrypted
secrets, and backups remain infrastructure concerns. They must not grow into an
application-level identity subsystem unless the owner explicitly changes this
scope.

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

The replacement shell will use a TradeMaker-owned TypeScript/Vue window
manager, implemented with browser Pointer Events rather than another docking or
window-interaction framework. The following product boundaries are approved for
the first migration:

- the task dock is always visible;
- the initial desktop opens the Ticker Dossier, News, and Related Companies
  windows;
- each tool has at most one open window; activating its dock item focuses or
  restores that window, or creates it when closed;
- every window record still has a unique instance ID so later multi-window
  workflows do not require a storage migration;
- the replacement shell targets desktop-width viewports only; and
- a typed, versioned Dexie database persists the serializable workspace model
  in IndexedDB through a repository boundary. Vue components and the in-memory
  window store do not access Dexie directly.

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

Fresh verification after merging to `main` produced the same result: linting,
TypeScript checking, all 79 unit tests, and the production build pass. The
formatting check still fails in the four archived Dockview files. The
`pnpm test:e2e` command also fails because no Playwright browser suite or
configuration has been built yet; Playwright currently discovers source unit
specifications that it cannot execute as browser tests.

The old goal under `goals/multi-panel-workspace-demo` is blocked and obsolete.
Its unchecked task list is also stale: it does not reflect the implementation
commits already present.

## Not implemented yet

- A TradeMaker-owned free-window manager.
- Window geometry, z-order, focus, dragging, and edge/corner resizing.
- The approved ticker-dossier and supporting tool-window structure.
- Meaningful production-quality charts.
- Dexie-backed workspace persistence and restoration for the replacement
  window model.
- Browser interaction and accessibility tests for the replacement interface.

## Safest continuation

1. Preserve the historical Dockview commits; do not develop on top of them.
2. Start a new branch/worktree from `fc7477f`.
3. Write and review the detailed Graphite Observatory design and implementation
   plan from the approved shell decisions above, including the serializable
   free-window model and Dexie schema.
4. Build the replacement shell test-first while reusing the foundation and
   domain content.

The selected visual-direction source is tracked at
`.superpowers/brainstorm/58906-1788023803/content/visual-style.html`.
