---
title: "Building a decoupled TypeScript ecosystem: lessons from splitting Portaless and Verared into 5 repos"
description: "Practical architecture lessons from splitting a monolithic CMS + trust stack into 5 independent repositories with strict unidirectional import boundaries and sha512-pinned npm packages."
pubDate: 2026-11-26
flairs: ["Open Source", "Portaless"]
---

# Building a decoupled TypeScript ecosystem: lessons from splitting Portaless and Verared into 5 repos

Monorepos are great for moving fast early on, but when a project mixes **normative protocol specifications**, **reusable cryptographic primitives**, **a third-party plugin SDK**, **fictional demo templates**, and **a full CMS runtime**, keeping everything in one repository creates hidden coupling and licensing ambiguity.

Splitting **Portaless** and **Verared** into five independent repositories taught us four concrete engineering lessons that apply to any modular TypeScript architecture.

## 1. Draw the layer graph before moving a single file

We enforced a strict unidirectional dependency graph:

1. `verared/vera-trust-spec` (`@verared/spec`, CC BY 4.0) — schemas and conformance vectors only.
2. `verared/vera-trust-stack` (7 `@verared/*` packages on npm, Apache-2.0) — protocol and cryptographic primitives with zero CMS dependencies.
3. `geroiloyola/portaless-plugin-sdk` (`@portaless/plugin-sdk`, MIT) — the only surface third-party plugins may import.
4. `geroiloyola/portaless-templates` (`@portaless/templates`, CC0-1.0) — fictional showcase templates and live demo.
5. `geroiloyola/portaless` (AGPL-3.0-or-later) — the sovereign CMS node consuming the layers above.

## 2. Automate boundary enforcement or coupling will creep back

Conventions written in Markdown decay quickly. A single script (`check-architecture-boundaries.mjs --strict`) running in CI enforces:

- **Zero deep `packages/*/src/` imports** across package boundaries.
- **Zero circular dependencies** between packages.
- **Exact semver pinning** (`0.1.0`, no `^` or `~`) + mandatory `sha512` lockfile integrity for all `@verared/*` stack packages.
- **License boundary verification** so Apache-2.0 / MIT layers never leak AGPL imports.

## 3. Inject host capabilities instead of reading `process.env` inside libraries

When `@verared/apw`, `@verared/local-trust`, and `@verared/identity-atproto` moved out of the CMS repo, every hidden `process.env` read became obvious. Replacing global env lookups with explicit dependency injection (encryption keys, storage factories, trusted-ingress resolvers, and shared resolution budgets) made the libraries portable across both Node 24 and Cloudflare Workers.

## 4. Keep the starter profile clean from the showcase

Separating `portaless-templates` (79-page fictional demo) from the default `starter` profile (clean, minimal build) meant anyone cloning Portaless — including this personal hub — starts from a clean slate without deleting demo fixtures first.
