---
id: 002c
title: LMPC Rule 26 — Complete Statutory Exemption Matrix
issuing_body_or_authors: Department of Consumer Affairs, Government of India
date_published_or_amended: 2023-10-06
date_retrieved: 2026-09-07
url: https://consumeraffairs.gov.in/acts-and-rules/legal-metrology
tier: 1
category: 02_legal_framework
license: Government of India Open Data / Public Domain
confidence: High (Primary Statutory Regulations)
---

## Why this source matters
Rule 26 provides statutory exemptions from the packaging rules. Implementing these gates in the rule engine prevents false-positive violation alerts on small items, bulk commodities, industrial packaging, and restaurant food.

## Full Exemption Clauses Breakdown

### Rule 26(a) — Small Packages (<= 10g or <= 10ml)
- **Condition**: Packages containing commodities where the net weight or measure is **10 grams or 10 millilitres or less**.
- **Carve-out / Exception**: Tobacco and tobacco products are **NOT exempt** under this clause regardless of small package size.
- **Rule Engine Action**: If commodity != tobacco and net quantity <= 10g/ml, bypass standard Rule 6 retail declaration requirements.

### Rule 26(b) — Fast Food / Restaurant Items
- **Condition**: Fast food items packed by a restaurant, hotel, or food service establishment.
- **Rule Engine Action**: Exempt from standard retail packaging declarations.

### Rule 26(c) — Scheduled Drugs Formulations
- **Condition**: Formulations covered under the Drugs (Price Control) Order (DPCO), 2013.
- **Rule Engine Action**: Pharmaceutical pricing declarations are governed by National Pharmaceutical Pricing Authority (NPPA) rather than LMPC Rule 6(1)(e).

### Rule 26(d) — Bulk Agricultural Produce
- **Condition**: Agricultural produce packed in quantities exceeding **50 kilograms** (e.g., bulk grain sacks).
- **Rule Engine Action**: Exempt from retail package standards; treated under wholesale rules.

### Rule 26(e) — Industrial and Institutional Consumers
- **Condition**: Packages containing commodities sold directly to institutional consumers (hospitals, hotels, airlines) or industrial consumers (for use in manufacturing).
- **Mandatory Condition**: Package must bear prominent declaration: *"Not for Retail Sale"*.

### Rule 26(f) — Garments and Hosiery Sold in Loose / Open Form
- **Condition** (Introduced via G.S.R. 648(E) 2022 / 2023 amendments): Garments, hosiery, or textiles sold in open/loose condition at point of sale where consumer has opportunity to touch, feel, or try on prior to purchase.
- **Proviso**: Key information (manufacturer, size, MRP, consumer care) may be provided on attached hangtag or label.
