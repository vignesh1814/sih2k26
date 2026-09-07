# Module 7: Edge Cases - Multi-Piece, Combination, and Wholesale Packages
**Rules 16, 17, 24, and 25 of the Packaged Commodities Rules, 2011**

## 1. Multi-Piece and Combination Packages (Rules 16 & 17 Context)
While Rules 16 & 17 explicitly deal with price alteration (obliteration/smudging), the packaging structure of "Multi-piece" (identical items) and "Combination" (dissimilar items, e.g., a Gift Box) packages dictates *where* declarations must appear.
*   **The Outer Package Rule**: For a combination package (e.g., a Diwali gift box with soap, shampoo, and a loofah), the outer package must bear the total MRP, total Net Quantity (or a list of individual quantities), and the Manufacturer's address. 
*   **AI Implication**: If the AI is scanning the *outer* box, it must not flag the package as non-compliant if it lacks a specific ingredient list for the soap, provided the outer box contains the mandatory LMPC declarations.
*   **Price Alteration (Rule 16/17)**: The AI must detect if an MRP sticker has been pasted *over* a printed MRP, or if there are multiple MRPs. The rule strictly prohibits charging more than the printed price and prohibits smudging/altering. **AI Logic**: Count the number of `mrp` bounding boxes. If `count > 1`, flag for "Potential Rule 16 Violation - Multiple/Altered MRP".

## 2. Wholesale Packages (Rule 24)
Rule 24 defines the declarations for a "wholesale package" (a package meant for a retailer, not the ultimate consumer, containing multiple retail packages).
*   **Mandatory Declarations (Rule 24)**:
    1. Name and address of the manufacturer/importer/packer.
    2. Identity of the commodity.
    3. Total number of retail packages contained OR total net quantity.
*   **Exemptions**: A wholesale package is explicitly exempt from displaying the MRP and the Date of Manufacture.
*   **AI Implication**: The AI must first classify the package type. If the image represents a secondary/carton box (wholesale), the absence of an MRP must **not** trigger a Rule 6 violation.

## 3. General Exemptions (Rule 25)
Rule 25 relaxes requirements for very small packages or specific commodities where PDP display is impractical. The AI must cross-reference the `product_class` against the exemption list before enforcing standard rules.
