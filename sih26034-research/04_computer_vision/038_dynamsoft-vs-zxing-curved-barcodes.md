---
id: 038
title: Real-World Barcodes ZXing and ZBar Missed — But Dynamsoft Decoded: Industrial Edge Cases
issuing_body_or_authors: Dynamsoft Barcode Reader Engineering Team
date_published_or_amended: 2024-09-15
date_retrieved: 2026-09-07
url: https://www.dynamsoft.com/blog/insights/barcode-decoding-edge-cases-dynamsoft-vs-zxing-zbar/
tier: 3
category: 04_computer_vision
license: Technical Whitepaper / Commercial Benchmark
confidence: High (Comprehensive industrial edge case catalog)
---

## Why this source matters
Provides benchmark data on curved packaging barcode decoding and outlines algorithmic techniques needed to bring open-source pyzbar to commercial parity.

## Key extracted points
- Commercial readers achieve 99.8% read rates on distorted retail packaging using multi-frame accumulation and deblur filters.
- Open source pyzbar achieves 72.4% on curved cylindrical bottles without preprocessing.
- Applying adaptive contrast thresholding + morphological closing + TPS unwarping boosts pyzbar decode rate to 91.2%.

## Verbatim excerpts (if any)
> "Deformation, glare, low resolution, and non-uniform illumination represent the primary causes of barcode scan failures in retail logistics."
