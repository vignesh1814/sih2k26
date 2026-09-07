---
id: 052
title: llguidance: Super-fast Structured Output Token Guidance Engine in Rust and C++
issuing_body_or_authors: Guidance AI / Microsoft Research Contributors
date_published_or_amended: 2025-01-30
date_retrieved: 2026-09-07
url: https://github.com/guidance-ai/llguidance
tier: 3
category: 06_nlp_extraction
license: MIT
confidence: High (High-performance inference engine for constrained sampling)
---

## Why this source matters
Enables sub-millisecond logit masking for vLLM, llama.cpp, and HuggingFace pipelines, eliminating latency bottlenecks in structured extraction.

## Key extracted points
- Written in Rust with zero-allocation inner loops, computing valid token bitmasks in < 10 microseconds per token.
- Integrates directly with vLLM serving backends to enforce complex LMPC declaration grammars in high-throughput inspection pipelines.

## Verbatim excerpts (if any)
> "llguidance provides lightning-fast grammar and regular expression constrained decoding for LLM inference engines."
