---
id: 033
title: Outlines
issuing_body_or_authors: Normal Computing
date_published_or_amended: 2023
date_retrieved: 2026-09-07
url: https://github.com/outlines-dev/outlines
tier: 2
category: 06_nlp_extraction
license: Apache 2.0
confidence: High
---

## Why this source matters
Outlines enforces structured generation at the token level using constrained decoding. This guarantees that local LLMs follow a specified schema with zero latency from retries.

## Key extracted points
- Modifies the LLM logit sampling directly, making it impossible for the model to generate malformed outputs.
- Significantly faster for high-throughput local deployments (e.g., using vLLM) compared to prompt-and-retry validation libraries.
