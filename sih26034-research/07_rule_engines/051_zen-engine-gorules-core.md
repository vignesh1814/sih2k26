---
id: 051
title: GoRules Zen Engine: Native Rust Business Rules Engine for Stateless Microservices
issuing_body_or_authors: GoRules Open Source Development Team
date_published_or_amended: 2024-08-10
date_retrieved: 2026-09-07
url: https://github.com/gorules/zen
tier: 3
category: 07_rule_engines
license: MIT
confidence: High (Core execution environment chosen for LMPC compliance logic)
---

## Why this source matters
Defines the high-performance, cross-platform execution core selected under Decision Gate M-1 to evaluate extracted JSON against versioned LMPC rules.

## Key extracted points
- Native Rust core with zero garbage collection overhead and sub-millisecond execution times (< 50 microseconds per decision graph).
- Official Python C-bindings (`pip install zen-engine`), allowing seamless embedding directly into FastAPI / ML inference pipelines.
- JSON Decision Model (JDM) format allows business analysts and legal officers to edit decision tables visually without touching application code.
- Supports temporal decision graphs: rules can branch based on `mfg_date` to evaluate packages under the specific legal regime active when packed.

## Verbatim excerpts (if any)
> "Zen Engine is an open-source, ultra-fast business rules engine written in Rust, designed for high-throughput microservices."
