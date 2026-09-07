---
id: 055
title: SKU-110K Dense Retail Shelf Object Detection Dataset Manifest
issuing_body_or_authors: Goldman, E., et al. / Ultralytics Integration
date_published_or_amended: 2023-05-12
date_retrieved: 2026-09-07
url: https://docs.ultralytics.com/datasets/detect/sku-110k
tier: 2
category: 08_datasets/manifests
license: CC BY-NC-SA 4.0
confidence: High (Standard dense retail object localization benchmark)
---

## Why this source matters
Provides training data for RT-DETR and YOLO models to identify and crop individual retail packages from cluttered supermarket shelves.

## Key extracted points
- Image count: 11,743 high-resolution supermarket shelf images containing 1,733,678 bounding box instances.
- Average density: 147 items per image, simulating extreme retail clutter.
- Annotation format: Normalized bounding box coordinates `[class_id, x_center, y_center, width, height]`.
- Role in SIH26034: Pre-training the macro object detector to crop the single target packaged commodity before passing it to panel segmentation.

## Verbatim excerpts (if any)
> "SKU-110K is an object detection dataset for detecting densely packed, identical and distinct retail products on supermarket shelves."
