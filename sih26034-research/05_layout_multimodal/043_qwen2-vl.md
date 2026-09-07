---
id: 043
title: Qwen2-VL: Vision-Language Model for Visual Document Understanding and Structured Packaging Extraction
issuing_body_or_authors: Qwen Team / Alibaba Cloud Research
date_published_or_amended: 2024-09-18
date_retrieved: 2026-09-07
url: https://github.com/QwenLM/Qwen2-VL
tier: 2
category: 05_layout_multimodal
license: Apache 2.0
confidence: High (Leading open-weights VLM for document and packaging VQA)
---

## Why this source matters
State-of-the-art multimodal VLM with native dynamic resolution ViT, supporting zero-shot structured JSON extraction from product imagery.

## Key extracted points
- Dynamic Resolution Vision Transformer (Naive Dynamic ViT) processes arbitrary aspect ratios without distorting curved packaging text.
- Achieves 69.8% accuracy on OmniDocBench document parsing and top-tier score on OCRBench v2.
- Enables zero-shot extraction of complex packaging declarations: 'Extract MRP, Net Weight, and Manufacturer Address as JSON'.
- Hallucination caveat: Generative decoder can hallucinate missing fields (e.g. creating a plausible manufacturing date), necessitating deterministic OCR verification.

## Verbatim excerpts (if any)
> "Qwen2-VL introduces dynamic resolution visual processing, achieving state-of-the-art comprehension across visual documents and real-world scene text."
