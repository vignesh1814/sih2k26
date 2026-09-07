---
id: 123
title: Human-in-the-Loop (HITL) State Machine & Multi-View Active Acquisition Loop Specification
issuing_body_or_authors: SIH26034 Systems Architecture Group
date_published_or_amended: 2026-03-04
date_retrieved: 2026-09-07
url: https://sih26034.gov.in/architecture/hitl-spec
tier: 2
category: 13_architecture_references
license: Systems Architecture Specification
confidence: High (Direct implementation of Section Z of dossier)
---

## Why this source matters
Specifies the exact decision state machine (PASS, FAIL, NEEDS REVIEW, INSUFFICIENT EVIDENCE) and mobile active guidance prompts.

## Key extracted points
- State Machine States:
-   - PASS: All mandatory fields present, valid units, mathematically correct USP, font size verified, confidence >= 0.90.
-   - FAIL: Deterministic violation detected (e.g. missing MRP string, non-standard unit 'gms', past expiry date).
-   - NEEDS REVIEW: Confidence < 0.90, OCR text ambiguous, possible sticker tampering detected, or Rule 7 font requires human confirmation.
-   - INSUFFICIENT EVIDENCE: Crucial panels missing (e.g., front scanned but manufacturer address absent).
- Active Acquisition Loop: If state is INSUFFICIENT EVIDENCE, mobile UI renders directional animation: 'Rotate package 90 degrees to capture side panel'. Stitches multi-view JSON states across temporal frames.

## Verbatim excerpts (if any)
> "The HITL state machine guarantees that incomplete scans trigger active multi-view guidance rather than premature false-negative violations."
