---
id: 004
title: US Patent 7,587,412 B2: Image Scaling and Calibration Using Reference Dimensions
issuing_body_or_authors: Balfour, et al. / USPTO
date_published_or_amended: 2009-09-08
date_retrieved: 2026-09-07
url: https://patentimages.storage.googleapis.com/09/a2/33/6d784d4e1b9c03/US7587412.pdf
tier: 2
category: 10_patents_prior_art
license: Public Patent Record
confidence: High (Technical calibration prior art)
---

## Why this source matters
Establishes standard methods for utilizing planar reference objects to calibrate perspective distortion and deduce absolute dimensions in millimeters.

## Key extracted points
- Details mathematical perspective transformation using four corner points of a known standard object (e.g., credit card / ID card = 85.60 mm x 53.98 mm).
- Computes pixel-to-millimeter scaling matrix `H` (homography matrix), resolving absolute font height from 2D pixel bounding boxes.
- Serves as the theoretical baseline for SIH26034 Experiment E2 (Physical Font Size Estimation).

## Verbatim excerpts (if any)
> "Perspective projection of an unknown scene is calibrated by computing a planar homography matrix relative to a reference object of predetermined dimensions."
