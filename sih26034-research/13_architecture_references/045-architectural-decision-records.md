---
id: 045
title: Architectural Decision Records (ADR) Summary
issuing_body_or_authors: SIH26034 Architecture Team
date_published_or_amended: 2026-09-07
date_retrieved: 2026-09-07
url: N/A
tier: 2
category: 13_architecture_references
license: Internal
confidence: High
---

## Summary of Core Architectural Decisions
- **ADR-01: Extraction Paradigm**: Adopted Hybrid OCR (PaddleOCR) + Small LLM (Instructor/Outlines) with strict Pydantic schema enforcement over pure VLM (Qwen2-VL) to eliminate hallucinations and retain pixel bounding-box auditability.
- **ADR-02: Rule Engine**: Selected Zen Engine (GoRules, Rust/Python) over Drools (JVM) to prevent cross-runtime serialization latency and enable clean decision tables for temporal LMPC rules.
- **ADR-03: Measurement Compliance**: Categorized Rule 7 physical font millimeter height as requiring Human-in-the-Loop (HITL) AR reference calibration rather than uncalibrated 2D estimation.
- **ADR-04: Multi-Angle Capture**: Implemented INSUFFICIENT EVIDENCE state machine prompting users to scan alternate package faces for missing mandatory declarations.
