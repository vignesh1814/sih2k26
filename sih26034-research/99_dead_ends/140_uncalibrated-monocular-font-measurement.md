---
id: 140
title: Dead End Analysis: Uncalibrated Monocular Font Measurement for Rule 7 Table I Compliance
issuing_body_or_authors: Computer Vision Research Group
date_published_or_amended: 2026-02-28
date_retrieved: 2026-09-07
url: N/A (Internal Experimental Finding)
tier: 4
category: 99_dead_ends
license: Technical Finding
confidence: High (Conclusive mathematical proof of limitation)
---

## Why this source matters
Records the definitive mathematical limitation that monocular 2D images cannot measure absolute millimeters, preventing future teams from wasting resources trying to train a pure CV font-height regressor.

## Key extracted points
- Tested approach: Training a CNN to directly predict millimeter font height from 2D cropped text images.
- Failure reason: Perspective projection maps a 3mm font at 30cm to the exact same pixel height as a 6mm font at 60cm; mathematically ill-posed without depth sensor or reference fiducial.
- Final decision: Classify absolute font height as an unresolved constraint for single uncalibrated photos. Route all borderline font cases to HITL Human Review.

## Verbatim excerpts (if any)
> "Monocular 2D images cannot resolve absolute physical scale without external depth data or known reference objects."
