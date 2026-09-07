---
id: 048
title: Dead End: Pure RegEx Extraction on Raw Packaging OCR
date_retrieved: 2026-09-07
category: 99_dead_ends
status: abandoned
reason: Fails on OCR misrecognitions ('50O g', 'Rs. l50') and multi-line manufacturer addresses
---

## Summary
Rule-based regex matching broke down on packaging typography variations, decorative fonts, and common OCR substitutions (letter 'O' for number '0', 'l' for '1'). Abandoned in favor of schema-constrained LLM parsing.
