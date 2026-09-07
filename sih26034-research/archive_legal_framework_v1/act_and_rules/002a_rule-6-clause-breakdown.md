---
id: 002a
title: LMPC Rule 6 — Mandatory Declarations Clause-by-Clause Specification
issuing_body_or_authors: Department of Consumer Affairs, Government of India
date_published_or_amended: 2023-10-06
date_retrieved: 2026-09-07
url: https://consumeraffairs.gov.in/acts-and-rules/legal-metrology
tier: 1
category: 02_legal_framework
license: Government of India Open Data / Public Domain
confidence: High (Detailed Statutory Mapping)
---

## Why this source matters
This document breaks down every discrete sub-clause of Rule 6 of the LMPC Rules 2011 into its exact legal requirement, data format, optical verification criteria, and rule engine validation logic.

## Detailed Sub-Clause Breakdown

### Rule 6(1)(a) — Name and Address of Manufacturer / Packer / Importer
- **Legal Mandate**: Package must bear the complete registered commercial name and physical postal address of the manufacturer. Where manufacturer is not packer, both must appear. For imported goods, the importer's complete name and address are mandatory.
- **Verification Rule**: Must contain an identifiable entity name and postal address (street, city, state, pin code). "Marketed by" / "Manufactured for" is legally valid provided manufacturer/packer details are also declared.
- **Compliance Status**: Mandatory for 100% of retail packages.

### Rule 6(1)(aa) — Country of Origin (Imports)
- **Legal Mandate**: Introduced to ensure origin transparency. On imported packages, the country of origin, manufacture, or assembly must be clearly declared (e.g., "Country of Origin: Vietnam").
- **Verification Rule**: Conditional on product being imported; must match a valid international country name dictionary.

### Rule 6(1)(b) — Common or Generic Name
- **Legal Mandate**: Common or generic name of the commodity contained in the package.
- **Verification Rule**: Must not be solely a proprietary brand name (e.g., "Maggi" is a brand; "Instant Noodles" is generic name).

### Rule 6(1)(c) — Net Quantity
- **Legal Mandate**: Net quantity in standard SI metric units (weight, volume, length, area, or number).
- **Verification Rule**: Must strictly follow standard SI symbols (`g`, `kg`, `ml`, `l` or `L`, `m`, `cm`, `N`, `U`). Prohibits non-standard abbreviations like `gms`, `gms.`, `gm`, `ltr`, `ltrs`, `kgs`. Must have clear surrounding whitespace (Rule 7).

### Rule 6(1)(d) — Month and Year of Manufacture / Packing
- **Legal Mandate** (Amended Nov 2021, GSR 779(E)): Must declare **month and year of manufacture** (previously allowed month and year of pre-packing or import).
- **Format**: `MM/YYYY`, `Month YYYY`, or `DD/MM/YYYY`. Must not represent future dates.

### Rule 6(1)(da) — Best Before / Use By Date
- **Legal Mandate**: Applicable to perishable commodities or goods unfit for human consumption after a period of time.
- **Verification Rule**: Must state "Best before [date/period]" or "Use by [date]".

### Rule 6(1)(e) — Maximum Retail Price (MRP)
- **Legal Mandate**: Retail sale price in Indian Rupees inclusive of all taxes.
- **Exact Phrasing Requirement**: Must be in format:
  - `Maximum Retail Price Rs. [price] (inclusive of all taxes)` or
  - `MRP Rs. [price] incl. of all taxes` or
  - `MRP ₹ [price] (incl. of all taxes)`.
- **Violations**: Missing "inclusive of all taxes" or dual MRP stickers without statutory notification.

### Rule 6(1)(f) — Dimensions of Commodity
- **Legal Mandate**: Where sizes/dimensions are relevant (textiles, paper, foil, hardware), dimensions (length, width, diameter) of individual units must be specified.

### Rule 6(2) — Consumer Care Details
- **Legal Mandate** (Amended May 2015, GSR 385(E)): Package must bear:
  1. Name of designated person/office
  2. Complete postal address
  3. Telephone / Helpline number
  4. E-mail address
- **Verification Rule**: Missing email or telephone constitutes a statutory violation under Rule 6(2).

### Rule 6(10) — E-Commerce Digital Declarations
- **Legal Mandate** (Amended June 2017, GSR 629(E)): All mandatory declarations (except month/year of manufacture) must be displayed on e-commerce product display pages prior to purchase.

### Rule 6(11) — Unit Sale Price (USP)
- **Legal Mandate** (Amended Nov 2021, GSR 779(E), effective Oct 1, 2022):
  - Must declare unit price rounded off to **two decimal places** in Indian Rupees.
  - *Units*:
    - Net weight < 1 kg: Price per **g** (`Rs. X.XX per g`).
    - Net weight > 1 kg: Price per **kg** (`Rs. X.XX per kg`).
    - Net volume < 1 L: Price per **ml** (`Rs. X.XX per ml`).
    - Net volume > 1 L: Price per **L** (`Rs. X.XX per L`).
    - Net length < 1 m: Price per **cm** (`Rs. X.XX per cm`).
    - Net length > 1 m: Price per **m** (`Rs. X.XX per m`).
    - Sold by number: Price per **number** or **unit** (`Rs. X.XX per N` or `per unit`).
  - *Exemption*: If net quantity is exactly 1 unit/kg/L, and MRP equals USP, separate USP is optional.
