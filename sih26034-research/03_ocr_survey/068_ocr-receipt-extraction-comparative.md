---
id: 068
title: Comparative Analysis of Open-Source OCR Frameworks for Retail Label and Receipt Extraction
issuing_body_or_authors: Kowalski, P., et al. (ResearchGate / IEEE)
date_published_or_amended: 2024-07-16
date_retrieved: 2026-09-07
url: https://www.researchgate.net/publication/399040735_Comparative_Analysis_of_Open-Source_OCR_Frameworks_for_Receipt_Data_Extraction_and_Post-Processing
tier: 2
category: 03_ocr_survey
license: Open Research Publication
confidence: High (Rigorous multi-engine character accuracy evaluation)
---

## Why this source matters
Empirically tests character error rates (CER) and word error rates (WER) across PaddleOCR, Tesseract 5, EasyOCR, and TrOCR on thermal receipts and retail labels.

## Key extracted points
- PaddleOCR achieved lowest CER (3.4%) and lowest WER (7.8%) across noisy retail prints.
- Tesseract 5 degraded severely when text skew exceeded 12 degrees (WER increased to 34.2%).
- TrOCR achieved high CER on clean horizontal text but suffered 4x higher latency and failed on tight numeric sequences (e.g. barcode numerals).

## Verbatim excerpts (if any)
> "PaddleOCR exhibits superior noise resilience and skew tolerance in retail text extraction compared to legacy LSTM and heavy transformer models."
