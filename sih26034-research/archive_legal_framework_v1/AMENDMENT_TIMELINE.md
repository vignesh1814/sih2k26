# Comprehensive LMPC Amendment & Notification Timeline (2011 – 2026)

| Year | Notification / Instrument | Notification Date | Effective Date | Sub-Rules Affected | Substantive Change | Logic Impact on Rule Engine | Versioning Flag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **2011** | **G.S.R. 202(E)** | 2011-03-07 | 2011-04-01 | All Rules (1–34) | Promulgation of Legal Metrology (Packaged Commodities) Rules, 2011. | Baseline rule set established. | `v2011` |
| **2015** | **G.S.R. 385(E)** | 2015-05-14 | 2016-01-01 | Rule 6(2) | Mandatory consumer care contact details (phone and email). | Flag violation if phone/email missing. | `v2015` |
| **2017** | **G.S.R. 629(E)** | 2017-06-23 | 2018-01-01 | Rule 6(10), Rule 7 Table I, Rule 18(2) | Mandatory e-commerce declarations; dual MRP prohibited; Table I consolidated by PDP Area. | Consolidated Table I font height checks; validate single MRP. | `v2018` |
| **2021** | **G.S.R. 779(E)** | 2021-11-02 | Deferred | Rule 6(1)(d), Rule 6(11), Schedule II | Mandated Unit Sale Price (USP); Date of Mfg instead of Packing; omitted Second Schedule pack sizes. | Added USP math checks; enforces Month/Year of Mfg. | `v2021` |
| **2022** | **G.S.R. 226(E)** | 2022-03-28 | 2022-10-01 | Rule 6(11) | Set definitive effective date for Unit Sale Price to Oct 1, 2022; mandated 2-decimal rounding. | Enforce USP math: `mrp / net_qty` rounded to 2 decimals. | `v2022_usp` |
| **2022** | **G.S.R. 577(E)** | 2022-07-14 | 2022-07-14 | Rule 6(1) proviso | Permitted QR code for certain declarations on electronic products. | If commodity == electronic, permit QR code URL check. | `v2022_qr` |
| **2022** | **G.S.R. 648(E)** | 2022-09-02 | 2022-09-02 | Rule 26(f) | Exemption for garments/hosiery sold in open/loose form at point of sale. | Bypass package rules for open loose textiles with hangtag. | `v2022_garment` |
| **2023** | **G.S.R. 720(E)** | 2023-10-06 | 2024-01-01 | Rule 26, Rule 6 | Exemption for electronic spare parts/warranty units; loose e-commerce item standards. | Spare parts marked "For Replacement Only" bypass retail rules. | `v2024` |
| **2024–2026** | **Jan Vishwas & Circulars** | 2024-01-22 | 2024-01-22 | Parent Act Sec 36 | Decriminalized minor weights infractions into monetary penalties; reinforced packaging mandates. | Penal citations updated to current compounding fee schedules. | `v2026_current` |
