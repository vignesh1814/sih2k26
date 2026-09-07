---
id: 035
title: A Comparative Benchmark of Real-Time Detectors: RT-DETR vs YOLO Architecture Analysis
issuing_body_or_authors: National Institutes of Health / PMC (PMC13417413)
date_published_or_amended: 2024-05-19
date_retrieved: 2026-09-07
url: https://pmc.ncbi.nlm.nih.gov/articles/PMC13417413/
tier: 2
category: 04_computer_vision
license: Open Access / PMC
confidence: High (Rigorous peer-reviewed comparative study)
---

## Why this source matters
Validates why RT-DETR is superior to YOLOv8 for detecting complex bounding box panels on packaging without non-maximum suppression (NMS) bottlenecks.

## Key extracted points
- RT-DETR achieves 53.1% AP on COCO val2017 at 108 FPS on Nvidia T4, outperforming YOLOv8-X in both accuracy and inference stability.
- Eliminates Non-Maximum Suppression (NMS), preventing adjacent declaration bounding boxes (e.g., MRP next to Net Qty) from being erroneously suppressed.
- Transformer encoder efficiently handles multi-scale features, critical for detecting small barcodes alongside large Principal Display Panels.

## Verbatim excerpts (if any)
> "RT-DETR avoids the handcrafted non-maximum suppression step, achieving superior speed-accuracy trade-offs across complex spatial scenes."
