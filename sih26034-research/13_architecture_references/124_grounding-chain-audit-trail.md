---
id: 124
title: Grounding Chain & Legal Traceability Audit Trail Specification
issuing_body_or_authors: SIH26034 Legal Engineering Group
date_published_or_amended: 2026-03-05
date_retrieved: 2026-09-07
url: https://sih26034.gov.in/architecture/grounding-chain
tier: 2
category: 13_architecture_references
license: Legal Systems Specification
confidence: High (Direct implementation of Section AA explainability requirements)
---

## Why this source matters
Defines the immutable 5-node traceability chain required to substantiate legal notices and compoundable offenses under Indian law.

## Key extracted points
- Traceability Chain: `Legal Verdict (Challan) -> Violated Statute Clause -> Extracted Key-Value Pair -> Raw OCR Transcript Token -> Pixel Bounding Box Polygon`.
- Every non-compliance flag in the output PDF report embeds: (1) Exact rule number (e.g., Rule 6(1)(e)), (2) Cropped image showing offending label area, (3) Color-coded bounding box overlay, (4) Confidence score, (5) Cryptographic timestamp and inspector signature.

## Verbatim excerpts (if any)
> "Explainability is achieved through an unbroken evidentiary chain linking the statutory violation directly to pixel coordinates on the packaging."
