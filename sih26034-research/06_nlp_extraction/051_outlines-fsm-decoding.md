---
id: 051
title: Outlines: Guaranteed Structured Output Generation with Finite-State Machine Token Masking
issuing_body_or_authors: Willard, B. T., & Louf, R. (ArXiv:2502.18878 / Outlines Dev)
date_published_or_amended: 2025-02-24
date_retrieved: 2026-09-07
url: https://arxiv.org/html/2502.18878v1
tier: 2
category: 06_nlp_extraction
license: Apache 2.0
confidence: High (Groundbreaking theoretical and practical paper on constrained decoding)
---

## Why this source matters
Provides mathematically guaranteed JSON schema conformance at the token sampling level, completely eliminating malformed JSON syntax errors in LLMs.

## Key extracted points
- Compiles regular expressions and JSON schemas into Finite-State Machines (FSMs) ahead of generation.
- At each token generation step, masks the LLM's vocabulary logits to only allow valid syntax transitions.
- Zero prompt overhead: Does not require few-shot schema examples in the prompt, dramatically cutting token latency and inference cost.
- Essential for SIH26034 compliance engine: Guarantees that every extracted entity conforms 100% to the LMPC Pydantic schema.

## Verbatim excerpts (if any)
> "Outlines forces language model token generation to follow a regular expression or JSON schema via finite-state machine indexing."
