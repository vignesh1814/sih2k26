---
id: 121
title: Architectural Decision Record M-1: Rule Engine Selection (Zen Engine vs Drools vs JSON-Logic)
issuing_body_or_authors: SIH26034 Technical Architecture Review Board
date_published_or_amended: 2026-03-02
date_retrieved: 2026-09-07
url: https://sih26034.gov.in/architecture/adr-m1
tier: 2
category: 13_architecture_references
license: Internal Architecture Record
confidence: High (Formal decision gate from Section M of dossier)
---

## Why this source matters
Documents the formal evaluation and definitive selection of GoRules Zen Engine for LMPC rule execution.

## Key extracted points
- Context: The compliance system must evaluate extracted packaging metadata against versioned, dynamic LMPC rules (2011-2023).
- Options considered: Drools (Java), Zen Engine / GoRules (Rust/Python), JSON-Logic (JS/Python).
- Decision: Select Zen Engine (GoRules).
- Justification: Provides native Python C-bindings, eliminating JVM overhead; executes decision tables in microseconds; supports temporal decision graphs; visual JDM graph editor allows non-coders to update rules as new gazettes are notified.
- Tradeoff accepted: Requires Rust compilation during environment setup, but eliminates all cross-language serialization bottlenecks.

## Verbatim excerpts (if any)
> "Decision M-1: Adopt Zen Engine as the core compliance rules evaluation engine for high-throughput, version-aware legal decision graphs."
