---
id: 052
title: Zen Engine Execution Performance & Memory Benchmarks vs JVM Engines
issuing_body_or_authors: GoRules Engineering Documentation
date_published_or_amended: 2024-10-02
date_retrieved: 2026-09-07
url: https://docs.gorules.io/developers/overview/performance
tier: 3
category: 07_rule_engines
license: Documentation / MIT
confidence: High (Official empirical throughput and latency metrics)
---

## Why this source matters
Provides benchmark data demonstrating Zen Engine's 100x throughput advantage over JVM-based Drools in stateless REST microservices.

## Key extracted points
- Processes over 250,000 complex decisions per second per CPU core.
- Stateless execution model: Each request passes an isolated JSON context, eliminating concurrency lock contention.
- Memory footprint: ~15MB RAM baseline vs Drools requiring 512MB-2GB JVM heap allocations.
- Cold start latency: < 2ms, enabling instant scaling on serverless and containerized edge infrastructure.

## Verbatim excerpts (if any)
> "Zen Engine delivers bare-metal execution speeds, evaluating complex multi-node decision graphs with sub-millisecond latency."
