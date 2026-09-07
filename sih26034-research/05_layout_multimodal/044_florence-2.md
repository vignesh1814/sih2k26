---
id: 044
title: Florence-2: Advancing a Unified Representation for Vision Tasks at the Edge
issuing_body_or_authors: Xiao, B., Wu, H., et al. (Microsoft Azure AI)
date_published_or_amended: 2024-06-21
date_retrieved: 2026-09-07
url: https://botmonster.com/ai/run-vision-models-locally-florence-2-qwen-vl/
tier: 2
category: 05_layout_multimodal
license: MIT
confidence: High (High-efficiency edge vision foundation model)
---

## Why this source matters
Compact vision foundation model capable of running dense region captioning and object detection in 8GB VRAM on consumer/edge hardware.

## Key extracted points
- Compact architecture (0.23B to 0.77B parameters) runs locally at 60+ FPS on mid-tier GPUs and embedded NPUs.
- Unified prompt interface: `<OD>` for object detection, `<DENSE_REGION_CAPTION>` for localized text reading, `<REGION_PROPOSAL>` for panel extraction.
- Well suited for high-speed macro classification and Principal Display Panel localization before passing crops to OCR.

## Verbatim excerpts (if any)
> "Florence-2 takes simple text prompts as instructions to generate desirable results in open-vocabulary object detection, captioning, and grounding."
