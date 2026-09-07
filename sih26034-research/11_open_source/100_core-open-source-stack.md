---
id: 100
title: Core Open-Source Technology Stack & Dependency Inventory for SIH26034
issuing_body_or_authors: SIH26034 Systems Architecture Group
date_published_or_amended: 2026-03-01
date_retrieved: 2026-09-07
url: https://github.com
tier: 3
category: 11_open_source
license: Open Source Stack Assessment
confidence: High (Comprehensive dependency audit)
---

## Why this source matters
Consolidates licenses, maintenance signals, GitHub stars, and architectural roles for all selected open-source components.

## Key extracted points
- PaddleOCR (Apache 2.0, 42k+ stars): Primary text detection (DBNet) and recognition (SVTR/CRNN).
- RT-DETR (Apache 2.0, 5k+ stars): Transformer-based real-time macro object detection (PDP and barcodes).
- pyzbar / zbar (LGPL 2.1): Algorithmic barcode decoding with OpenCV preprocessing.
- Outlines / llguidance (Apache 2.0 / MIT): FSM constrained token sampling for schema-guaranteed LLM outputs.
- Zen Engine / GoRules (MIT, 2k+ stars): Native Rust decision-table compliance rule execution.
- FastAPI (MIT, 75k+ stars): High-concurrency asynchronous REST backend.
- OpenCV (Apache 2.0): Image preprocessing, adaptive thresholding, TPS dewarping.

## Verbatim excerpts (if any)
> "All core system components utilize permissive commercial-friendly licenses (MIT, Apache 2.0), avoiding restrictive copyleft traps."
