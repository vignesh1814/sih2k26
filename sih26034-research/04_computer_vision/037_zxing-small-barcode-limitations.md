---
id: 037
title: ZXing Open Source Barcode Decoder: Failure Modes on Small & Curved Retail Packaging
issuing_body_or_authors: Stack Overflow Community / Computer Vision Contributors
date_published_or_amended: 2023-04-18
date_retrieved: 2026-09-07
url: https://stackoverflow.com/questions/8103279/zxing-unable-to-scan-small-upc-codes
tier: 3
category: 04_computer_vision
license: CC BY-SA 4.0
confidence: High (Standard technical reference on open source barcode decoder limits)
---

## Why this source matters
Documents known failure modes of open-source algorithmic barcode decoders (ZXing/pyzbar) when scanning curved bottles and small UPC/EAN labels.

## Key extracted points
- ZXing assumes planar, undistorted barcode lines; cylindrical surface curvature causes non-linear pitch deformation of bars.
- Specular reflections on plastic shrink-wrap obliterate narrow guard bars in EAN-13 codes.
- Architectural mitigation: Implement a pre-processing cylindrical unwarping step using bounding box aspect ratio before passing the crop to pyzbar.

## Verbatim excerpts (if any)
> "ZXing frequently fails when barcodes are printed on curved or non-flat surfaces due to perspective and cylindrical distortion."
