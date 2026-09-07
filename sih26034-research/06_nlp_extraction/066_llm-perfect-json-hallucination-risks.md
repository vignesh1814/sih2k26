---
id: 066
title: Your LLM Can Return Perfect JSON and Still Be Wrong: The Compliance Hallucination Trap
issuing_body_or_authors: Towards Data Science AI Integrity Group
date_published_or_amended: 2024-10-14
date_retrieved: 2026-09-07
url: https://towardsdatascience.com/your-llm-can-return-perfect-json-and-still-be-wrong/
tier: 3
category: 06_nlp_extraction
license: Technical Analysis / Article
confidence: High (Crucial architectural warning for legal/regulatory AI systems)
---

## Why this source matters
Directly warns against blindly trusting syntactically valid JSON outputs from LLMs, highlighting silent data corruption risks in legal compliance systems.

## Key extracted points
- Syntactic validity != semantic truth: An LLM can produce valid JSON matching the Pydantic schema while fabricating values.
- Example: On a package with no printed manufacturing date, an LLM instructed to produce `{mfg_date: 'MM/YYYY'}` may hallucinate '03/2024'.
- Mitigation: All extracted fields must retain an explicit `source_bounding_box_id` and raw OCR transcript reference to enable deterministic cross-checking.

## Verbatim excerpts (if any)
> "Schema enforcement guarantees format correctness, not factual correctness. In regulatory applications, grounding to source evidence is mandatory."
