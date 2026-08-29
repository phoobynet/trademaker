# Goal: Prove the TradeMaker Multi-panel Workspace

Build a clean pnpm monorepo whose first application is a Vite 8 and Vue 3 browser workbench demonstrating TradeMaker's permanent panel shell with entirely local, visibly simulated news-analysis data. The workbench must make docking, tabbing, resizing, closing, reopening, minimising, restoring, maximising, internal floating, layout persistence, reset, and theme switching understandable before any backend or live-data work begins.

## Shared Understanding

The user-reviewed, testable requirements are in [facts.md](./facts.md).

## Execution Plan

The approved file-by-file build and verification sequence is in [plan.md](./plan.md).

## Done When

This goal is done when every accepted fact is satisfied, the complete root-level `pnpm check` command passes without external services or credentials, and the browser demonstration clearly proves the full panel lifecycle at a 1280 by 720 viewport while keeping all panel activity inside one browser tab.
