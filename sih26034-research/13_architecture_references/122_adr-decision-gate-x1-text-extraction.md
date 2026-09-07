---
id: 122
title: Architectural Decision Record X-1: Text Extraction Paradigm (Hybrid OCR+LLM vs Pure VLM vs Regex)
issuing_body_or_authors: SIH26034 Technical Architecture Review Board
date_published_or_amended: 2026-03-03
date_retrieved: 2026-09-07
url: https://sih26034.gov.in/architecture/adr-x1
tier: 2
category: 13_architecture_references
license: Internal Architecture Record
confidence: High (Formal decision gate from Section X of dossier)
---

## Why this source matters
Documents the definitive architectural selection of Route D (Hybrid OCR + LLM with Outlines) for extracting structured declarations.

## Key extracted points
- Context: Converting noisy visual packaging images into strictly typed Pydantic compliance payloads.
- Options: Route A (Regex on OCR), Route B (LayoutLMv3), Route C (Pure VLM zero-shot), Route D (Hybrid OCR + LLM with Outlines).
- Decision: Select Route D (Hybrid OCR + Outlines Schema Enforcement).
- Justification: PaddleOCR delivers deterministic 2D bounding boxes needed for legal challans; small LLM (Llama-3-8B / Qwen2.5) with Outlines guarantees 100% valid JSON matching the LMPC schema while healing OCR noise.
- Consequences: Eliminates regex brittleness while preventing generative hallucination through strict bounding-box grounding.

## Verbatim excerpts (if any)
> "Decision X-1: Adopt Hybrid OCR + Schema-Enforced LLM, pairing spatial bounding-box grounding with semantic extraction robustness."
