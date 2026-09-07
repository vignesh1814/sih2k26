# Module 8: Jurisdictional Boundaries - LMPC vs. FSSAI
**Preventing Ultra Vires Actions by the AI**

## The Jurisdictional Conflict
A packaged food product in India is governed by two major frameworks:
1.  **LMPC (Legal Metrology Packaged Commodities)**: Enforced by the Controller of Legal Metrology. Focuses on Trade and Commerce (Price, Weight, Manufacturer, Date).
2.  **FSSAI (Food Safety and Standards Authority of India)**: Enforced by Food Safety Officers. Focuses on Health and Safety (Nutrition, Ingredients, Veg/Non-Veg logos, FSSAI License No.).

## The AI Enforcement Boundary
The SIH26034 project is strictly for Legal Metrology compliance.
*   **The Risk**: If the AI flags a package for missing an FSSAI License Number or a Veg/Non-Veg logo, it is acting outside its jurisdiction (ultra vires). The Legal Metrology department has no legal authority to issue fines for FSSAI violations.
*   **AI Architecture Rules**:
    1.  The NLP entity extraction must ignore `nutrition_facts`, `ingredients`, and `fssai_license` during the LMPC compliance check.
    2.  If the bounding box model detects a "Green Dot" (Veg logo), it must not be used to calculate the Principal Display Panel (PDP) area for LMPC Rule 7 purposes unless it physically encroaches on the required LMPC declarations.
    3.  **Strict Silo**: The `legal_ontology_mapping.json` must exclusively contain LMPC Rules (Rules 6, 7, etc.). FSSAI rules must be maintained in a separate, inactive schema unless the government mandates a joint-enforcement portal.
