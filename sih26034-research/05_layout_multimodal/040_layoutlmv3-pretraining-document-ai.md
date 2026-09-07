---
id: 040
title: LayoutLMv3: Pre-training for Document AI with Unified Text and Image Masking
issuing_body_or_authors: Huang, Y., Lv, T., Cui, L., Lu, Y., & Wei, F. (Microsoft Research)
date_published_or_amended: 2022-04-18
date_retrieved: 2026-09-07
url: https://www.researchgate.net/publication/360030234_LayoutLMv3_Pre-training_for_Document_AI_with_Unified_Text_and_Image_Masking
tier: 2
category: 05_layout_multimodal
license: Open Research Publication
confidence: High (Foundational landmark paper for multimodal document understanding)
---

## Why this source matters
Defines state-of-the-art key information extraction (KIE) combining OCR text, 2D bounding boxes, and visual patch embeddings.

## Key extracted points
- Achieves 92.15% F1 on FUNSD and 98.52% F1 on SROIE for key-value entity extraction.
- Natively integrates 2D spatial coordinate embeddings: `(x0, y0, x1, y1)` normalized to 0-1000 grid.
- Critical limitation for packaging: Requires pre-existing OCR bounding boxes and extensive fine-tuning on Indian multilingual retail packaging layouts.

## Verbatim excerpts (if any)
> "LayoutLMv3 integrates text, layout, and image modalities into a unified architecture with masked language and masked vision modeling."
