---
id: 110
title: Target Metrics, Academic Benchmarks, and Quantitative SLA Specification
issuing_body_or_authors: SIH26034 Algorithmic Evaluation Committee
date_published_or_amended: 2026-03-02
date_retrieved: 2026-09-07
url: https://sih26034.gov.in/benchmarks/sla-spec
tier: 2
category: 12_benchmarks_papers
license: Evaluation Specification
confidence: High (Direct synthesis of Section AE benchmarking framework)
---

## Why this source matters
Establishes quantifiable, verifiable accuracy and latency SLAs for each subsystem of the compliance platform.

## Key extracted points
- OCR Subsystem: Character Error Rate (CER) < 5%, Word Error Rate (WER) < 8% on clean packaging; CER < 9% on curved packaging.
- Detection Subsystem: Mean Average Precision (mAP@50) > 90% for Principal Display Panel (PDP) and barcode localization.
- Extraction Subsystem: Field-level F1 Score > 95% on high-priority numeric fields (MRP, Net Quantity, Mfg Date); F1 > 90% on Consumer Care contact block.
- End-to-End System: > 85% fully automated compliance decisions (PASS/FAIL), <= 15% routed to NEEDS REVIEW, false positive violation rate < 1.0%.
- Latency SLA: Sub-2.0 second end-to-end processing time per image scan on GPU server; sub-4.0 seconds on mobile web clients.

## Verbatim excerpts (if any)
> "Quantitative system SLAs: CER < 5%, mAP@50 > 90%, F1 > 95%, End-to-End Automation > 85%, False Positive Rate < 1%."
