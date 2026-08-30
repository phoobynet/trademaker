# Open-source tooling research

Reviewed: 30 August 2026

## Context

TradeMaker will retain Go for server-side services and Vue/TypeScript for the
workbench. The aim of this research is to avoid rebuilding commodity
infrastructure while retaining control over the research model and user
experience.

TradeMaker is a private, single-user application for its owner alone. It is not
a public service or SaaS product. Tooling choices must not introduce accounts,
multi-tenancy, billing, collaboration, public API commitments, or other
infrastructure whose purpose is serving unrelated users. Remote access should
be protected at the host or private-network boundary.

The recommended approach is to assemble the application from focused
open-source components rather than adopt a complete trading platform.

## Recommended foundation

| Area                | Project                                                                 | Recommendation                                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Go API              | [Huma](https://github.com/danielgtaylor/huma)                           | Use over the standard `net/http` router. It generates OpenAPI, validates requests, and standardises errors. Current releases require Go 1.25 or newer.    |
| Database access     | [pgx](https://github.com/jackc/pgx)                                     | Use PostgreSQL directly through its established Go driver and toolkit.                                                                                    |
| Typed queries       | [sqlc](https://github.com/sqlc-dev/sqlc)                                | Generate type-safe Go code from SQL rather than introduce an ORM.                                                                                         |
| Migrations          | [goose](https://github.com/pressly/goose)                               | Required for every schema change. Keep versioned SQL migrations and embed them in a dedicated migration command.                                          |
| Background jobs     | [River](https://github.com/riverqueue/river)                            | Use when the first durable job is introduced. It provides transactional enqueueing, retries, uniqueness, scheduling, and an operational UI on PostgreSQL. |
| Frontend API types  | [openapi-typescript](https://github.com/openapi-ts/openapi-typescript)  | Generate TypeScript types from Huma's OpenAPI document.                                                                                                   |
| Server state        | [TanStack Query](https://github.com/TanStack/query)                     | Manage API caching, retries, invalidation, pagination, and background refresh in Vue. Do not use it for local window state.                               |
| Browser persistence | [Dexie](https://github.com/dexie/Dexie.js)                              | Retain the approved IndexedDB plan for workspaces, window state, and cached research.                                                                     |
| Price charts        | [Lightweight Charts](https://github.com/tradingview/lightweight-charts) | Use for candlestick, volume, and streaming financial charts.                                                                                              |
| Research charts     | [Apache ECharts](https://github.com/apache/echarts)                     | Use for comparisons, confidence distributions, sectors, and relationship visualisations.                                                                  |
| Database testing    | Repository interfaces and fakes                                         | Keep the normal test suite independent of PostgreSQL and Docker. Mock database access at narrow application-owned boundaries.                             |
| Observability       | [OpenTelemetry Go](https://github.com/open-telemetry/opentelemetry-go)  | Instrument traces and metrics without coupling the service to one monitoring vendor.                                                                      |

The initial server stack should therefore remain small:

```text
Huma + net/http
PostgreSQL + pgx + sqlc + goose
River
slog + OpenTelemetry
Repository interfaces + fakes or mocks
OpenAPI -> openapi-typescript -> TanStack Query
```

There is no initial requirement for Redis, a separate message broker, a
workflow engine, or a time-series database.

## Database and migration policy

The default test suite must not start PostgreSQL, Docker containers, or River's
database runtime. Domain services and job handlers should depend on narrow
TradeMaker-owned repository and queue interfaces. Unit tests should use
hand-written fakes or mocks implementing those interfaces, and worker handlers
should be callable directly with ordinary test inputs.

Keep `pgx`, generated `sqlc` queries, and River adapters at the infrastructure
boundary. Application code should not expose SQL strings, transactions, or
driver types through its interfaces. This makes the majority of tests fast and
prevents database mocking details from spreading through the codebase.

Every database schema change must be represented by a versioned `goose`
migration. Do not make ad hoc schema changes or rely on ORM auto-migration.
Apply migrations through an explicit deployment command rather than having
every application instance race to migrate during startup.

Mocks cannot detect invalid PostgreSQL syntax, query/schema drift, transaction
behaviour, or a broken migration sequence. This is an accepted tradeoff for
the normal development loop. If direct database validation is later required,
keep it as an explicit, infrequent pre-deployment check outside the default
test command rather than slowing every local and CI test run.

## Add when required

### Financial text classification

Evaluate [ProsusAI FinBERT](https://huggingface.co/ProsusAI/finbert) for
sentence-level sentiment classification of financial news. It returns
positive, negative, and neutral probabilities and is a useful low-cost signal
for prioritising and summarising incoming research. Benchmark it against
[HKUST FinBERT Tone](https://huggingface.co/yiyanghkust/finbert-tone), which was
trained on financial reports, earnings calls, analyst reports, and 10,000
manually annotated analyst-report sentences. The ProsusAI model is the better
initial candidate for news; the HKUST variant may be stronger for filings and
analyst material. Select between them using a small TradeMaker-labelled
evaluation set rather than published aggregate scores.

FinBERT is a text classifier, not an evidence or prediction engine. It cannot
establish whether a claim is true, determine which security a multi-company
sentence affects, or infer the resulting price movement. Store all three
probabilities alongside the input hash, sentence span, model identifier, model
revision, and processing time. Treat sentiment as one versioned feature in the
evidence model, never as a trading recommendation.

Keep model inference outside the Go API process. A small Python worker using
Hugging Face Transformers can consume River jobs, batch sentences, and persist
results to PostgreSQL. This keeps Python and ML dependencies isolated while Go
continues to own ingestion, scheduling, domain rules, and the public API. An
ONNX deployment can be evaluated later if measurements justify reducing the
worker's runtime or memory cost.

Both reference repositories use Apache-2.0, but their code and model lineage
are several years old. Before commercial deployment, pin the exact model
revision, scan the model artifact, confirm the model-weight and training-data
terms, and test calibration on TradeMaker's actual sources. The original
ProsusAI implementation uses the obsolete `pytorch_pretrained_bert` package;
use the model artifact through current Transformers rather than adopting that
repository's application code.

### Live updates

Use [coder/websocket](https://github.com/coder/websocket) when the workbench
needs live news, analysis status, or price updates. It is a small, idiomatic Go
WebSocket implementation. Do not introduce streaming infrastructure before a
concrete live-update workflow exists.

### News and feed ingestion

Use [gofeed](https://github.com/mmcdole/gofeed) to avoid implementing RSS and
Atom parsing. If polling, retention, deduplication, scraping rules, and feed
management grow into a subsystem, evaluate
[Miniflux](https://github.com/miniflux/v2) as a separately deployed sidecar.

### OpenBB data gateway

[OpenBB](https://github.com/OpenBB-finance/OpenBB) is best understood as a
universal adapter for financial data. Instead of building separate clients for
SEC, FRED, Yahoo Finance, Polygon, Tiingo, Benzinga, and other sources,
TradeMaker can ask OpenBB for a standard data type and select the provider.
OpenBB supplies provider connectors, validates and normalises their responses,
and exposes them through Python or a FastAPI REST service. Its
[standardisation framework](https://docs.openbb.co/odp/python/developer/standardization)
uses consistent query names, data types, null handling, percentage formats,
and field naming across providers.

OpenBB does not host or license the underlying data. Provider API keys,
subscriptions, rate limits, data quality, and usage terms still apply. Its
[provider catalogue](https://docs.openbb.co/odp/python/extensions/providers)
contains public sources such as SEC, FRED, the Federal Reserve, BLS, IMF, and
OECD, alongside free and paid third-party market-data and news connectors.

If adopted, run OpenBB as a separate internal Python service:

```text
Vue workbench
      |
Go API and River workers
      |
TradeMaker MarketDataGateway
      |
OpenBB FastAPI service
      |
SEC / FRED / Polygon / Tiingo / other providers
```

Go must continue to own the public API, jobs, caching, persistence, provider
selection policy, evidence and provenance, and TradeMaker's canonical domain
models. Map OpenBB responses into those owned models instead of allowing
OpenBB's schemas to become the domain model. Unit tests should fake or mock the
`MarketDataGateway`; the OpenBB service must not run as part of the default
test suite.

OpenBB is suitable for research ingestion, provider evaluation, and switching
between comparable sources. It is not a source of licensed data, an execution
engine, or a low-latency market feed. The extra Python service also adds
deployment, monitoring, dependency, and security-patching work.

The currently published OpenBB Platform package declares
[AGPL-3.0-only](https://github.com/OpenBB-finance/OpenBB/blob/develop/openbb_platform/pyproject.toml).
OpenBB has [announced](https://openbb.co/) an intention to release its wider
suite under a permissive open-source licence, but has not committed to a
complete release schedule. Treat the currently published package licence as
authoritative until replacement packages are actually released, and complete
a licensing review before network deployment or modification.

OpenBB merits a focused, disposable prototype rather than immediate adoption
as core infrastructure. The prototype should compare two providers for
historical prices, retrieve an SEC filing, retrieve a FRED series, and record
response consistency, missing fields, latency, error behaviour, provider
terms, and operational cost. Adopt it only if those savings outweigh the
Python service and licensing obligations.

### Generated frontend clients

Start with generated types and a small HTTP adapter. If repetitive client and
query code becomes material, evaluate [Orval](https://github.com/orval-labs/orval)
for generated Vue Query hooks. The project's Node 24 baseline satisfies the
current Orval runtime requirement, but generated client code should still be
adopted only when it removes meaningful repetition.

### Large datasets

Add [TanStack Virtual](https://github.com/TanStack/virtual) only when news,
filing, or evidence lists are large enough to demonstrate a rendering issue.
Consider a full data grid only after requirements such as spreadsheet editing,
grouping, or pivoting are established.

## Keep custom

The following areas are TradeMaker's product-specific behaviour and should
remain owned by the project:

- The free-window desktop, including focus, z-order, movement, resize,
  minimise, maximise, restoration, and persistence semantics.
- Claims, evidence, provenance, confidence, and uncertainty models.
- Related-company and wider-market analysis.
- Canonical financial data types and provider adapters.
- Research orchestration and data-licensing boundaries.
- The Graphite Observatory visual language and research workflow.

Replacing the window system with Dockview or `interact.js` would still leave
the project responsible for window identity, z-order, persistence, focus, and
desktop semantics. It would also conflict with the approved Pointer Events
direction, so it is unlikely to reduce overall complexity.

## Defer until justified

- [QuestDB](https://github.com/questdb/questdb): designed for high-volume
  market time-series workloads, but unnecessary until PostgreSQL becomes a
  measured bottleneck for tick or order-book data.
- [NATS](https://github.com/nats-io/nats-server): introduce only when multiple
  independently deployed services need durable event distribution.
- [Temporal](https://github.com/temporalio/temporal): valuable for long-running
  workflows, compensation, and human approval, but substantial operational
  machinery for the current product.
- [QuantConnect LEAN](https://github.com/QuantConnect/Lean) and
  [NautilusTrader](https://github.com/nautechsystems/nautilus_trader): capable
  execution and backtesting engines, but TradeMaker is currently an investment
  research workbench rather than an algorithmic execution system.

## Licensing posture

Prefer MIT, Apache-2.0, ISC, and similarly permissive dependencies for embedded
libraries. River uses MPL-2.0 and should receive a normal dependency and legal
review before adoption. AGPL components such as OpenBB should only be used
after a deliberate architecture and licensing decision, normally as separate
services rather than embedded code.

## Conclusion

The largest immediate savings come from generated API contracts, PostgreSQL
access and migrations, durable background jobs, IndexedDB persistence,
financial charting, feed parsing, and financial-text classification. Fast
tests come from keeping storage and queue infrastructure behind repository
interfaces with deterministic fakes or mocks. This foundation leaves
TradeMaker's domain model and workbench experience under project control
without prematurely adopting infrastructure intended for a distributed
trading system.
