---
id: 120
title: Architectural Decision Record: Evaluation of Pipeline Architecture Routes A, B, and C
issuing_body_or_authors: SIH26034 Technical Lead & Architecture Review Board
date_published_or_amended: 2026-03-01
date_retrieved: 2026-09-07
url: https://sih26034.gov.in/architecture/adr-001
tier: 2
category: 13_architecture_references
license: Internal Architecture Record
confidence: High (Foundational engineering synthesis for SIH26034)
---

## Why this source matters
Formalizes the selection of Route C/D (Hybrid OCR + LLM with Outlines and Zen Engine) over pure sequential or pure VLM routes.

## Key extracted points
- Route A (Sequential OCR + Regex): Rejected due to catastrophic brittleness on noisy packaging typography (F1 < 65%).
- Route B (Pure VLM zero-shot): Rejected due to hallucination risks and complete lack of spatial bounding-box auditability required for legal challans.
- Route C/D (Hybrid Verification Pipeline): Selected. PaddleOCR establishes deterministic spatial coordinates and raw text; small LLM with Outlines extracts structured JSON; Zen Engine validates against temporal LMPC rules.
- Consequences: Delivers 100% auditable legal citations directly linked to image bounding boxes, with sub-2 second server inference time.

## Verbatim excerpts (if any)
> "Selected Architecture: Hybrid OCR + Schema-Enforced LLM + Rust Rule Engine, guaranteeing spatial auditability and deterministic legal defensibility."
