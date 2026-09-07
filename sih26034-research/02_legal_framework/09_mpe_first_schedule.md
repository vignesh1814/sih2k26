# Module 9: Physical Tolerances and The First Schedule (MPE)
**Why AI Cannot Enforce Weight**

## The First Schedule: Maximum Permissible Error (MPE)
Under the Legal Metrology Act, a package is not immediately illegal if its actual weight is slightly less than the declared weight. The law recognizes manufacturing tolerances, defined in the First Schedule as the Maximum Permissible Error (MPE).
*   **Example**: For a declared weight of 200g, the MPE might be 4.5%. Thus, a physical weight of 191g is legally compliant.

## AI Limitations & The Legal Firewall
1.  **Computer Vision Cannot Weigh**: The AI can extract the text "Net Wt: 200g". It cannot physically weigh the item.
2.  **The Tare Weight Problem**: Even if integrated with a digital scale, the scale measures "Gross Weight". Legal Metrology penalizes on "Net Weight". Determining Net Weight requires knowing the exact "Tare Weight" (the weight of the empty packaging), which varies wildly.
3.  **Legal Conclusion**: The AI system must have a hardcoded legal firewall. It can only issue violations for **Rule 6 (Absence of Declaration)** or **Rule 13 (Improper SI Unit format)**. It cannot issue violations under Section 36 of the Act (Selling non-standard packages) without a human officer physically conducting the Net Weight test using calibrated standard weights.
