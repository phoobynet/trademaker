# TradeMaker Multi-panel Workspace Demonstrator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the smallest useful TradeMaker browser application: a believable, simulated news-analysis workspace in which the user can arrange, minimise, maximise, float, close, reopen, save, and reset panels.

**Architecture:** Keep the product-specific workspace rules behind a small TradeMaker-owned interface. Dockview supplies the low-level docking mechanics, while Vue components know only about typed panel data and TradeMaker commands. All demonstration content is local sample data. The only persistence is a versioned layout document and a theme choice in browser storage.

**Tech Stack:** pnpm workspace; Vite 8.2.2; Vue 3.5.42; strict TypeScript; Tailwind CSS 4.3.3; daisyUI 5.7.22; Dockview Vue 8.2.0 (open-source package); Vitest 4.1.11; Vue Test Utils; Playwright 1.62.1.

**Spec:** [Approved facts](./facts.md)

## Global Constraints

- Keep this as one browser single-page application. Do not add Tauri, Go, a database, authentication, external APIs, background schedulers, or extra browser windows.
- Make every piece of market, company, news, price, evidence, and interpretation data visibly simulated.
- Use plain-English names in code, tests, controls, and documentation. Do not refer to an issue number or an architectural decision number without also stating its descriptive title.
- Domain panels must not import Dockview or call Dockview APIs. They receive typed data and TradeMaker-owned commands.
- Use daisyUI components and Tailwind utilities for ordinary interface elements. Write custom CSS only for the full-height workspace, Dockview theme integration, focus treatment, and resizing constraints that the component libraries do not provide.
- Use the paid daisyUI Blueprint MCP workflow before implementing the visual shell: setup expert, rules enforcer, page architect, component syntax expert, implementation, then quality inspector.
- Treat close and minimise as different operations. Minimise preserves the panel instance and its current state; close discards that instance so reopening starts with clean sample defaults.
- Keep controls keyboard accessible, preserve visible focus, and do not introduce keyboard traps.
- Verify at a 1280 by 720 viewport as the minimum desktop target.
- Work test-first. For each behaviour, add the smallest failing test, observe the expected failure, implement the behaviour, and rerun that focused test before continuing.
- Use focused commits after each task. Do not commit generated secrets, populated environment files, browser traces, screenshots, or test reports.

## What the User Will See

The first screen is a restrained, dark TradeMaker workbench showing one simulated news story. Six panels explain the story from source to interpretation:

1. **News source** — the simulated article and publication details.
2. **Evidence and claims** — what the text explicitly says and how confident the extraction is.
3. **Primary security** — the company most directly affected.
4. **Related companies** — sibling or competitor securities that may move for similar reasons.
5. **Wider market** — sector and broad-market context.
6. **Guided interpretation** — a novice-friendly explanation of what the evidence might mean, what remains unknown, and what to examine next.

The shell has a clearly labelled panel menu, reset control, theme switch, simulated-data label, docked workspace, and bottom taskbar for minimised panels.

~~~mermaid
flowchart LR
    Story["Local simulated story"] --> Panels["Six focused Vue panels"]
    Registry["TradeMaker panel registry"] --> Controller["Workspace controller"]
    Panels --> Controller
    Controller --> Adapter["Small Dockview adapter"]
    Adapter --> Dockview["Dockview layout engine"]
    Controller --> State["Panel state store"]
    Controller --> Saved["Versioned browser layout"]
    Theme["Remembered theme"] --> Shell["TradeMaker shell"]
    Dockview --> Shell
    Panels --> Shell
~~~

## Data and Storage in Plain English

There is no server-side data store in this goal.

| Data | Shape | Location | Lifetime |
| --- | --- | --- | --- |
| Demonstration story | Typed TypeScript object containing the article, claims, securities, market context, and teaching notes | Bundled source file | Changes only when the code changes |
| Open panel catalogue | Typed registry of panel type, title, Vue component, and default parameters | Bundled source file | Application lifetime |
| Current panel state | Record keyed by unique panel instance ID | Vue reactive memory | Current session; also copied into the saved layout document |
| Docked layout | Dockview's serializable layout object | Vue memory | Current session |
| Saved workspace | Versioned JSON document containing the Dockview layout, minimised panels, and serializable panel state | Browser local storage | Survives reload until reset |
| Theme | One validated theme name | Browser local storage | Survives reload until changed |

Use one explicit storage document:

~~~ts
export const WORKSPACE_LAYOUT_VERSION = 1 as const

export interface SavedWorkspaceV1 {
  version: typeof WORKSPACE_LAYOUT_VERSION
  dockviewLayout: SerializedDockview
  minimizedPanels: MinimizedPanelRecord[]
  panelStateByInstanceId: Record<string, SerializablePanelState>
}
~~~

The storage reader must validate the version and the required top-level shapes. If parsing or restoration fails, it removes the invalid document and builds the default layout. This is deliberately small versioning, not a general migration framework.

## The Important Close-versus-Minimise Rule

~~~mermaid
stateDiagram-v2
    [*] --> Open: open from panel menu
    Open --> Minimized: minimise
    Minimized --> Open: restore from taskbar
    Open --> Open: dock / tab / resize / float / maximise
    Open --> Closed: close and discard state
    Closed --> Open: reopen with sample defaults
~~~

- **Minimise:** save the panel's identity, parameters, current serializable state, and a sensible restore target; remove its visual Dockview panel; show its name in the taskbar; restore the same instance ID and state in one action.
- **Close:** remove its visual Dockview panel, minimised record, and state entry; the panel menu can create the standard instance again using fresh defaults.
- **Maximise:** use Dockview's native in-workspace maximise and restore mechanism so the underlying layout is unchanged.
- **Float:** use Dockview's in-page floating group with bounds constrained to the workbench. Do not use pop-out APIs.

## Intended Repository Shape

~~~text
trademaker/
├── apps/
│   └── workbench/
│       ├── e2e/
│       ├── src/
│       │   ├── demo/
│       │   │   ├── panels/
│       │   │   ├── sampleStory.ts
│       │   │   └── types.ts
│       │   ├── workspace/
│       │   │   ├── components/
│       │   │   ├── dockview/
│       │   │   ├── panelRegistry.ts
│       │   │   ├── storage.ts
│       │   │   ├── types.ts
│       │   │   └── workspaceStore.ts
│       │   ├── App.vue
│       │   ├── main.ts
│       │   └── styles.css
│       ├── index.html
│       ├── package.json
│       ├── tsconfig.app.json
│       └── vite.config.ts
├── goals/
├── eslint.config.js
├── package.json
├── playwright.config.ts
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── prettier.config.mjs
├── tsconfig.json
└── README.md
~~~

## Task 1: Establish the pnpm Monorepo and a Tested Vue Application

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `.gitignore`
- Create: `.editorconfig`
- Create: `eslint.config.js`
- Create: `prettier.config.mjs`
- Create: `tsconfig.json`
- Create: `apps/workbench/package.json`
- Create: `apps/workbench/index.html`
- Create: `apps/workbench/tsconfig.app.json`
- Create: `apps/workbench/tsconfig.node.json`
- Create: `apps/workbench/vite.config.ts`
- Create: `apps/workbench/src/env.d.ts`
- Create: `apps/workbench/src/main.ts`
- Create: `apps/workbench/src/App.vue`
- Create: `apps/workbench/src/styles.css`
- Test: `apps/workbench/src/App.spec.ts`

- [ ] **Step 1: Add the workspace manifests and exact runtime baseline**

Use pnpm only. Set `packageManager` to the pnpm version used to create the lockfile and require a Node version accepted by Vite 8. The root package is private and delegates commands to `@trademaker/workbench`.

Root commands must have these meanings:

~~~json
{
  "scripts": {
    "dev": "pnpm --filter @trademaker/workbench dev",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint .",
    "typecheck": "pnpm --filter @trademaker/workbench typecheck",
    "test:unit": "pnpm --filter @trademaker/workbench test:unit",
    "test:e2e": "playwright test",
    "build": "pnpm --filter @trademaker/workbench build",
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:e2e && pnpm build"
  }
}
~~~

Pin or lock the approved runtime versions: Vue 3.5.42, Vite 8.2.2, `@vitejs/plugin-vue` 6.0.8, Tailwind CSS 4.3.3, `@tailwindcss/vite` 4.3.3, daisyUI 5.7.22, Dockview Vue 8.2.0, TypeScript 7.0.2, Vitest 4.1.11, and Playwright 1.62.1. Install the latest mutually compatible patch versions of the formatting, linting, Vue Test Utils, DOM test environment, Lucide Vue icons, and accessibility test packages, recording exact resolutions in `pnpm-lock.yaml`.

- [ ] **Step 2: Configure strict TypeScript, Vue, Tailwind, daisyUI, Vitest, ESLint, and Prettier**

Configure `vite.config.ts` with the Vue and Tailwind Vite plugins, a `@` alias to `apps/workbench/src`, and a Vitest DOM environment. Configure Tailwind 4 and daisyUI 5 in `styles.css` using their supported CSS-first integration. Import Dockview's distributed stylesheet once, at the application boundary.

The TypeScript application config must enable strict checking and disallow unchecked indexed access. Do not use `any` to bypass Dockview types.

- [ ] **Step 3: Write the first failing application smoke test**

`App.spec.ts` mounts `App.vue` and expects the landmark named “TradeMaker workspace” and the visible label “Simulated demonstration.” Run:

~~~sh
pnpm test:unit -- App.spec.ts
~~~

Expected result: fail because the shell has not yet been implemented.

- [ ] **Step 4: Add the smallest application shell that makes the smoke test pass**

Create a full-viewport `App.vue` with the named main landmark and a persistent simulated-data badge. Do not build panel behaviour yet.

- [ ] **Step 5: Verify the foundation**

Run:

~~~sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test:unit -- App.spec.ts
pnpm build
~~~

Expected result: all commands pass and `apps/workbench/dist` is produced.

- [ ] **Step 6: Commit**

~~~sh
git add package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore .editorconfig eslint.config.js prettier.config.mjs tsconfig.json apps/workbench
git commit -m "workspace: scaffold the browser workbench"
~~~

## Task 2: Establish the Visual Language with daisyUI Blueprint

**Files:**

- Modify: `apps/workbench/src/App.vue`
- Modify: `apps/workbench/src/styles.css`
- Create: `apps/workbench/src/workspace/components/WorkspaceHeader.vue`
- Create: `apps/workbench/src/workspace/components/WorkspaceHeader.spec.ts`
- Create: `apps/workbench/src/workspace/components/WorkspaceFrame.vue`
- Create: `apps/workbench/src/workspace/components/WorkspaceFrame.spec.ts`

- [ ] **Step 1: Run the mandatory Blueprint discovery sequence**

Use a unique lowercase workflow ID such as `trademaker-workbench-shell`.

1. Ask the daisyUI setup expert to inspect `/Users/glenn/GolandProjects/trademaker` and confirm install/configuration needs, dark and light theme choices, colours, local/system fonts, and Lucide icons.
2. Pass the setup result to the daisyUI rules enforcer.
3. Ask the page architect for a single-screen desktop trading workbench: compact header, dominant panel canvas, bottom taskbar, restrained density, and a clear simulated-data status.
4. Ask the component syntax expert for every daisyUI component the page architect selects, in repeat batches if required.

Record the resulting visual decisions in code and the README using descriptive names. Do not create a separate design-document branch or introduce a Figma dependency.

- [ ] **Step 2: Write failing component tests for the permanent shell**

Test that:

- the header has a TradeMaker name;
- the simulated-data status is always visible;
- “Panels,” “Reset workspace,” and theme controls have accessible names;
- the workspace frame exposes separate docking-canvas and taskbar regions;
- keyboard focus is visibly styleable on every header control.

Run:

~~~sh
pnpm test:unit -- WorkspaceHeader.spec.ts WorkspaceFrame.spec.ts
~~~

Expected result: fail because these components do not exist.

- [ ] **Step 3: Implement the shell with daisyUI and Tailwind**

Use daisyUI navbar, button, dropdown/menu, badge, tooltip, and theme-controller patterns returned by Blueprint. Use icons as supporting visuals, never as the only accessible label. Keep custom CSS tokens small and name them by purpose, for example `--workspace-taskbar-height` rather than arbitrary numbers.

- [ ] **Step 4: Run the Blueprint quality inspector**

Ask the quality inspector for `fix_changes`, apply relevant fixes, and rerun it until it reports no material design-system or accessibility violations. Inspect the actual diff before accepting mechanical changes.

- [ ] **Step 5: Verify and commit**

Run focused component tests, formatting, linting, type checking, and the production build. Then commit:

~~~sh
git add apps/workbench/src
git commit -m "workspace: establish the TradeMaker shell"
~~~

## Task 3: Model One Simulated News-analysis Story

**Files:**

- Create: `apps/workbench/src/demo/types.ts`
- Create: `apps/workbench/src/demo/sampleStory.ts`
- Create: `apps/workbench/src/demo/sampleStory.spec.ts`
- Create: `apps/workbench/src/demo/components/SimulatedDataNotice.vue`
- Create: `apps/workbench/src/demo/panels/NewsSourcePanel.vue`
- Create: `apps/workbench/src/demo/panels/EvidenceClaimsPanel.vue`
- Create: `apps/workbench/src/demo/panels/PrimarySecurityPanel.vue`
- Create: `apps/workbench/src/demo/panels/RelatedCompaniesPanel.vue`
- Create: `apps/workbench/src/demo/panels/WiderMarketPanel.vue`
- Create: `apps/workbench/src/demo/panels/GuidedInterpretationPanel.vue`
- Test: `apps/workbench/src/demo/panels/DemoPanels.spec.ts`

- [ ] **Step 1: Define the story data without market jargon shortcuts**

Create explicit types:

~~~ts
export interface SimulatedNewsStory {
  id: string
  simulated: true
  source: NewsSource
  extractedClaims: ExtractedClaim[]
  primarySecurity: SecuritySnapshot
  relatedCompanies: RelatedCompanySnapshot[]
  widerMarket: MarketContext
  guidedInterpretation: GuidedInterpretation
}

export interface ExtractedClaim {
  id: string
  statement: string
  sourceExcerpt: string
  confidence: "low" | "medium" | "high"
  whyItMatters: string
}

export interface GuidedInterpretation {
  plainEnglishSummary: string
  supportingEvidence: string[]
  uncertainties: string[]
  questionsToResearchNext: string[]
  notTradingAdvice: true
}
~~~

Use a fictional but realistic semiconductor-sector event so the story can naturally show a primary company, siblings, and wider-market consequences without presenting fabricated information as a real event. Every security snapshot must include a plain-English explanation alongside any abbreviated metric.

- [ ] **Step 2: Write failing data-quality tests**

Test that the story:

- has `simulated: true`;
- contains all six sections;
- has at least two related companies;
- gives every claim source text and a “why it matters” explanation;
- gives the guided interpretation supporting evidence, uncertainty, next questions, and a not-trading-advice marker;
- contains no network URL that the application tries to fetch at runtime.

- [ ] **Step 3: Add the sample story**

Create one coherent object in `sampleStory.ts`. Keep it deterministic: no current date, random values, timers, or network calls.

- [ ] **Step 4: Write failing panel component tests**

Mount each panel with its typed slice of the story. Expect a descriptive heading, the simulated-data notice, useful empty-state handling, and novice-friendly explanatory text. Include a small piece of editable demonstration state, such as a selected claim or an expanded explanation, so state preservation can be proven later.

- [ ] **Step 5: Implement the six presentational panels**

Panels only render their props and emit semantic user intentions. They do not import `dockview-vue`, browser storage, or the workspace controller.

- [ ] **Step 6: Verify and commit**

Run the focused data and panel tests, lint, typecheck, and build. Then commit:

~~~sh
git add apps/workbench/src/demo
git commit -m "demo: add the simulated analysis story"
~~~

## Task 4: Create the TradeMaker-owned Panel Contract and State Store

**Files:**

- Create: `apps/workbench/src/workspace/types.ts`
- Create: `apps/workbench/src/workspace/panelRegistry.ts`
- Create: `apps/workbench/src/workspace/panelRegistry.spec.ts`
- Create: `apps/workbench/src/workspace/workspaceStore.ts`
- Create: `apps/workbench/src/workspace/workspaceStore.spec.ts`
- Create: `apps/workbench/src/workspace/useWorkspace.ts`

- [ ] **Step 1: Define the boundary that TradeMaker owns**

Use a stable union for the six panel types and a registry whose values describe components and defaults:

~~~ts
export type PanelType =
  | "news-source"
  | "evidence-claims"
  | "primary-security"
  | "related-companies"
  | "wider-market"
  | "guided-interpretation"

export interface WorkspacePanelDefinition {
  type: PanelType
  title: string
  component: Component
  createDefaultParameters: () => SerializablePanelParameters
}

export interface WorkspacePanelInstance {
  instanceId: string
  type: PanelType
  title: string
  parameters: SerializablePanelParameters
}

export interface WorkspaceCommands {
  openPanel(type: PanelType): void
  closePanel(instanceId: string): void
  minimizePanel(instanceId: string): void
  restorePanel(instanceId: string): void
  toggleMaximize(instanceId: string): void
  floatPanel(instanceId: string): void
  resetWorkspace(): void
}
~~~

`SerializablePanelParameters` and `SerializablePanelState` must be JSON-compatible types, not `unknown` values silently asserted into the right shape.

- [ ] **Step 2: Write failing registry tests**

Test that each panel type:

- occurs exactly once;
- has a readable title;
- maps to the expected Vue component;
- creates a fresh parameters object each time;
- produces a unique instance ID through the instance factory.

- [ ] **Step 3: Implement the registry and instance factory**

Keep the default instance IDs deterministic for the initial six panels. When a closed singleton panel is reopened, it may reuse its stable ID because the old instance and state have been fully deleted; it must still receive a newly created parameters object.

- [ ] **Step 4: Write failing state-lifecycle tests**

Prove these differences with a plain in-memory store:

- selecting a claim, minimising, and restoring retains the selection;
- maximising, floating, docking, tabbing, or resizing does not replace panel state;
- closing deletes panel state;
- reopening creates the default state;
- two panel state entries cannot share an instance ID;
- a taskbar entry has an instance ID, readable title, type, parameters, and restore placement.

- [ ] **Step 5: Implement the reactive state store and injection boundary**

Use a small Vue reactive store provided at the shell boundary. Domain components receive their state or scoped callbacks through props/injection. Keep all Dockview types out of this store.

- [ ] **Step 6: Verify and commit**

Run registry and store tests plus static checks. Then commit:

~~~sh
git add apps/workbench/src/workspace
git commit -m "workspace: define the panel lifecycle"
~~~

## Task 5: Isolate Dockview and Build the Default Layout

**Files:**

- Create: `apps/workbench/src/workspace/dockview/DockviewWorkspaceAdapter.ts`
- Create: `apps/workbench/src/workspace/dockview/DockviewWorkspaceAdapter.spec.ts`
- Create: `apps/workbench/src/workspace/dockview/defaultLayout.ts`
- Create: `apps/workbench/src/workspace/dockview/defaultLayout.spec.ts`
- Create: `apps/workbench/src/workspace/components/DockWorkspace.vue`
- Create: `apps/workbench/src/workspace/components/DockWorkspace.spec.ts`
- Create: `apps/workbench/src/workspace/components/WorkspacePanelHost.vue`
- Create: `apps/workbench/src/workspace/components/WorkspacePanelTab.vue`
- Modify: `apps/workbench/src/workspace/components/WorkspaceFrame.vue`

- [ ] **Step 1: Define a narrow adapter instead of spreading Dockview calls**

`DockviewWorkspaceAdapter` is the only application service that imports Dockview APIs. Its public methods use TradeMaker types:

~~~ts
export interface WorkspaceLayoutPort {
  attach(containerApi: DockviewApi): void
  addPanel(instance: WorkspacePanelInstance, placement?: PanelPlacement): void
  removePanel(instanceId: string): void
  capturePlacement(instanceId: string): PanelPlacement
  maximize(instanceId: string): void
  restoreMaximized(instanceId: string): void
  float(instanceId: string): void
  serialize(): SerializedDockview
  restore(layout: SerializedDockview): void
  onLayoutChanged(listener: () => void): Disposable
}
~~~

Dockview-specific types may appear inside the adapter implementation, but not in domain panel files, the registry, or the state store. If an upstream type is needed at the interface edge, wrap it in a local opaque alias and validate it at restoration.

- [ ] **Step 2: Write failing adapter tests with a small fake Dockview API**

Test translation rather than Dockview's own library:

- adding a TradeMaker instance supplies ID, component type, title, and serializable parameters;
- maximising and restoring call Dockview's native group mechanism;
- floating uses an in-page floating group and requests viewport bounds;
- no path calls a pop-out or external-window API;
- serialization and restoration delegate once;
- an unknown instance ID gives a controlled, readable result instead of throwing from an unchecked property access.

- [ ] **Step 3: Write failing default-layout tests**

Define six panels in a deterministic arrangement:

- news and extracted evidence are immediately readable;
- company and market context use the lower portion efficiently;
- guided interpretation remains visible without covering the source;
- at least one group starts with tabs, making the tab behaviour obvious;
- all six default instances are present exactly once.

Test the abstract placement instructions, not pixel positions.

- [ ] **Step 4: Implement the Dockview host and component resolver**

Use `DockviewVue` with Vue slot/component registration. `WorkspacePanelHost.vue` resolves the TradeMaker panel registry and passes typed story data/state into the domain component. `WorkspacePanelTab.vue` provides readable title and labelled actions. Disable or replace built-in menu items that would expose browser pop-out behaviour.

- [ ] **Step 5: Build the default layout on Dockview ready**

Apply the default placement instructions only when no valid saved layout is being restored. Configure floating groups to stay within the workspace viewport. Ensure the container has an explicit height chain so Dockview can resize correctly.

- [ ] **Step 6: Verify native interactions manually before automation**

At 1280 by 720:

- drag a tab to create a left/right split;
- drag another tab to create a top/bottom split;
- drag a panel into another tab strip;
- resize a divider;
- float and redock a panel.

Record any Dockview integration constraint in a code comment next to the adapter, using plain English and a link to the relevant upstream documentation when useful.

- [ ] **Step 7: Verify and commit**

Run focused tests, static checks, and build. Then commit:

~~~sh
git add apps/workbench/src/workspace
git commit -m "workspace: add the docked panel canvas"
~~~

## Task 6: Implement Close, Reopen, Minimise, Restore, Maximise, and Float

**Files:**

- Create: `apps/workbench/src/workspace/WorkspaceController.ts`
- Create: `apps/workbench/src/workspace/WorkspaceController.spec.ts`
- Create: `apps/workbench/src/workspace/components/PanelPicker.vue`
- Create: `apps/workbench/src/workspace/components/PanelPicker.spec.ts`
- Create: `apps/workbench/src/workspace/components/WorkspaceTaskbar.vue`
- Create: `apps/workbench/src/workspace/components/WorkspaceTaskbar.spec.ts`
- Modify: `apps/workbench/src/workspace/components/WorkspacePanelTab.vue`
- Modify: `apps/workbench/src/workspace/components/WorkspaceHeader.vue`
- Modify: `apps/workbench/src/workspace/components/WorkspaceFrame.vue`

- [ ] **Step 1: Write controller tests before wiring controls**

Use fake registry, store, storage, and layout-port objects. Test:

- opening a missing panel creates fresh defaults and adds one visual panel;
- opening an already open singleton activates it rather than duplicating it;
- closing removes the visual panel and deletes current and minimised state;
- minimising captures placement, removes only the visual panel, and creates one named taskbar entry without deleting state;
- restoring removes the taskbar entry and recreates the same instance and state;
- restoring falls back to the documented default placement when the former neighbour no longer exists;
- maximise toggles native maximise/restore without rewriting panel state;
- floating delegates to in-page floating only;
- every missing-panel or duplicate-action case is safe and produces a deterministic result.

- [ ] **Step 2: Implement the controller**

Coordinate the panel registry, state store, and layout adapter here. Do not let individual buttons sequence low-level operations. The controller is the single place that decides whether panel state is retained or discarded.

- [ ] **Step 3: Write failing component tests for controls**

Test:

- the “Panels” menu lists all six descriptive titles;
- open panels are indicated;
- closed panels can be reopened;
- taskbar entries use readable names and restore with one click or keyboard activation;
- close, minimise, maximise/restore, and float controls have explicit accessible labels that include the panel title;
- there is no pop-out control;
- the taskbar collapses to a quiet empty state when nothing is minimised.

- [ ] **Step 4: Implement the panel menu, custom tab actions, and taskbar**

Use daisyUI patterns already approved by Blueprint. Do not rely on icon meaning. Keep the taskbar at the bottom of the application, not inside a Dockview group.

- [ ] **Step 5: Add integration tests around state preservation**

Mount the workspace with a fake layout port. Select or expand content inside a demonstration panel, run each non-destructive layout action, and assert the selection remains. Close and reopen it, and assert the selection returns to the sample default.

- [ ] **Step 6: Verify and commit**

Run all workspace component and controller tests, then static checks and build. Commit:

~~~sh
git add apps/workbench/src/workspace
git commit -m "workspace: add panel window controls"
~~~

## Task 7: Save, Restore, Reset, and Theme the Workspace

**Files:**

- Create: `apps/workbench/src/workspace/storage.ts`
- Create: `apps/workbench/src/workspace/storage.spec.ts`
- Create: `apps/workbench/src/workspace/theme.ts`
- Create: `apps/workbench/src/workspace/theme.spec.ts`
- Modify: `apps/workbench/src/workspace/WorkspaceController.ts`
- Modify: `apps/workbench/src/workspace/components/WorkspaceHeader.vue`
- Modify: `apps/workbench/src/App.vue`

- [ ] **Step 1: Write failing storage validation tests**

Cover:

- a valid version-1 document round-trips;
- malformed JSON is rejected and removed;
- missing required fields are rejected;
- an unsupported version is rejected;
- a Dockview restoration exception falls back to the default;
- minimised records and panel state survive reload;
- reset clears the saved layout before rebuilding defaults;
- storage-unavailable errors do not prevent the application from opening.

Do not test browser storage through scattered direct calls. Test one storage adapter with an in-memory `Storage` fake.

- [ ] **Step 2: Implement the versioned storage adapter**

Use descriptive keys such as `trademaker:workspace-layout` and `trademaker:theme`. Parse defensively. Keep the validator next to the versioned TypeScript type so they evolve together.

- [ ] **Step 3: Debounce layout persistence**

Subscribe once to Dockview layout changes and save after a short debounce so divider drags do not cause excessive synchronous storage writes. Flush the latest state before page unload only if necessary and test that listener cleanup occurs when the workspace unmounts.

- [ ] **Step 4: Write failing reset tests**

Test that the clearly labelled reset control:

1. clears the stored layout;
2. clears minimised and transient panel state;
3. exits maximised state if necessary;
4. recreates all six default panels;
5. leaves the selected colour theme unchanged.

- [ ] **Step 5: Write failing theme tests**

Accept exactly two public theme values, one restrained dark theme and one light theme chosen through Blueprint. Invalid saved values use dark. Changing theme updates the root `data-theme` attribute and persists the choice.

- [ ] **Step 6: Implement persistence, reset, and theme switching**

Make saved-state failure visible only when useful: silently recover from an old or corrupt local layout, but provide a short non-blocking status message such as “Saved layout could not be restored; the default workspace is open.”

- [ ] **Step 7: Verify and commit**

Run storage, controller, theme, and component tests; static checks; and build. Commit:

~~~sh
git add apps/workbench/src
git commit -m "workspace: remember and reset the layout"
~~~

## Task 8: Prove the Workspace in a Real Browser

**Files:**

- Create: `playwright.config.ts`
- Create: `apps/workbench/e2e/workspace.spec.ts`
- Create: `apps/workbench/e2e/accessibility.spec.ts`
- Create: `apps/workbench/e2e/helpers/workspace.ts`
- Modify: `apps/workbench/package.json`
- Modify: `package.json`

- [ ] **Step 1: Configure deterministic browser tests**

Use Playwright Chromium against the Vite preview server. Set the desktop viewport to 1280 by 720. Clear browser storage before each test except the explicit reload-persistence test. Keep traces and screenshots only on failure and gitignore their directories.

- [ ] **Step 2: Write the guided-story smoke test**

Assert that all six panel titles or their visible tabs exist, the simulated label is visible, and no real network request is made. Fail the test on unexpected outgoing requests rather than merely mocking them.

- [ ] **Step 3: Write stable action tests**

Through visible controls:

- minimise two named panels and restore one from the bottom taskbar;
- close a named panel and reopen it from “Panels”;
- maximise and restore a panel;
- float a panel and confirm it remains within the application viewport;
- reset the workspace;
- switch theme and reload;
- alter layout/state, reload, and confirm restoration;
- inject invalid saved JSON, reload, and confirm the default layout plus recovery message.

- [ ] **Step 4: Add focused drag tests for native Dockview behaviour**

Use tab labels and measured panel bounds rather than brittle generated class sequences. Prove one horizontal or vertical split, one tab merge, one divider resize, and one redock from floating. If browser-coordinate dragging proves unreliable across supported Chromium versions, keep one end-to-end drag smoke and cover placement translation in the adapter tests; document the reason beside the helper.

- [ ] **Step 5: Add keyboard and accessibility checks**

Use `@axe-core/playwright` and direct keyboard navigation to check:

- no serious or critical automated accessibility violations;
- the Panels menu opens and operates from the keyboard;
- panel actions and taskbar restores are reachable;
- focus remains visible;
- Escape closes menus without leaving a trap;
- focus moves to a sensible control after a panel is closed or minimised.

- [ ] **Step 6: Run the full browser suite**

~~~sh
pnpm test:e2e
~~~

Expected result: all interaction and accessibility tests pass without external services or credentials.

- [ ] **Step 7: Commit**

~~~sh
git add package.json pnpm-lock.yaml playwright.config.ts apps/workbench
git commit -m "test: prove the workspace interactions"
~~~

## Task 9: Explain the Demonstrator and Run the Complete Gate

**Files:**

- Modify: `README.md`
- Create: `apps/workbench/README.md`
- Modify as verification requires: files created in Tasks 1–8

- [ ] **Step 1: Write the root monorepo guide**

Explain in plain English:

- what this demonstrator proves;
- what it intentionally does not contain;
- the folder map;
- prerequisites;
- `pnpm install`, `pnpm dev`, `pnpm check`, and individual verification commands;
- why it is one browser window;
- that all content is simulated and not trading advice.

- [ ] **Step 2: Write the workspace architecture guide**

Include the architecture and close-versus-minimise diagrams from this plan. Explain the panel registry, state store, Dockview adapter, browser storage document, and how a future real feature replaces a mock panel without coupling domain code to Dockview.

Add a “How to add a panel” walkthrough:

1. define the typed domain data;
2. create a presentational Vue component and test;
3. add a descriptive panel type and registry entry;
4. define fresh default parameters/state;
5. add it to the default layout only if it belongs in the starting story;
6. add browser coverage for its lifecycle.

- [ ] **Step 3: Inspect the finished interface**

Start the development server and inspect the application at 1280 by 720 in both dark and light themes. Check clipped text, inaccessible menus, unexpected scrollbars, minimum panel size, taskbar crowding, floating bounds, and visible focus. Apply only evidence-based corrections.

- [ ] **Step 4: Run the Blueprint quality inspector one final time**

Use `fix_changes` against the completed page. Review and apply appropriate fixes, then rerun focused tests affected by the changes.

- [ ] **Step 5: Run the complete local gate**

From the repository root:

~~~sh
pnpm check
git status --short
git diff --check
~~~

Expected result:

- formatting check passes;
- lint passes;
- strict TypeScript check passes;
- all unit and component tests pass;
- all Playwright interaction and accessibility tests pass;
- production build passes;
- no unexpected generated or secret files appear;
- `git diff --check` reports no whitespace errors.

- [ ] **Step 6: Commit the finished demonstration**

~~~sh
git add README.md apps/workbench/README.md
git commit -m "docs: explain the workspace demonstrator"
~~~

## Completion Evidence

The goal is complete only when all of the following can be shown:

- a clean install and `pnpm check` pass locally;
- the six simulated analysis panels tell one coherent story;
- dock, tab, resize, close/reopen, minimise/restore, maximise/restore, float/redock, persist/reload, reset, and theme switching work in a real browser;
- non-destructive layout actions retain panel state, while close/reopen resets it;
- no panel can leave the single browser tab;
- invalid saved state recovers safely;
- the 1280 by 720 workbench remains usable with keyboard-accessible controls;
- the README explains the architecture without relying on unexplained abbreviations or issue numbers.

## Risks and Deliberate Responses

| Risk | Response |
| --- | --- |
| Dockview's native close lifecycle could accidentally discard state during minimise | Route close and minimise through the TradeMaker controller and custom panel tab; store panel state outside the Dockview component lifecycle |
| Hiding a Dockview group could minimise other tabbed panels too | Remove only the selected visual panel and represent minimised instances in the TradeMaker taskbar |
| Restoring an old layout could fail after panel types change | Version and validate the saved document; recover to the documented default |
| Coordinate-based drag tests can be brittle | Keep placement logic covered by adapter tests and use a small number of browser drag smokes based on labelled tabs and measured bounds |
| A trading-style screen can become dense or mysterious | Use one guided story, readable panel names, visible simulated labels, novice explanations, restrained defaults, and a 1280 by 720 usability check |
| The prototype could become a second monolith | Keep domain panels presentational, panel mechanics behind the workspace controller, sample data isolated, and all future service work outside this goal |

