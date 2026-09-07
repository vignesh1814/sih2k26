# Module 6: Guiding Principles for AI-Driven Legal Compliance
**Jurisprudence & Automation Strategy**

## 1. The Principle of "Deterministic Defensibility"
In corporate legal compliance, ambiguity is a liability. The Indian Legal Metrology Act, 2009, relies heavily on subjective terms like "prominent," "legible," and "conspicuous." An AI system cannot evaluate subjective aesthetics; doing so exposes the system to legal challenge under Article 14 (arbitrariness).
*   **Execution Rule**: Every subjective term must be mapped to a deterministic, mathematically verifiable threshold (e.g., Contrast Ratio > 4.5:1, Font Height > Table I mm limits).
*   **Fallback**: If a deterministic threshold cannot be met, the AI must flag for "Human Review" rather than issuing a deterministic "Fail."

## 2. The Principle of "Defined Ignorance"
An AI system powered by 2D computer vision has strict physical limitations. It is vital to legally define what the AI *cannot* verify to shield the governing authority from claims of ultra vires (acting beyond authority) or false prosecution.
*   **Physical Scaling**: Monocular cameras cannot measure absolute millimeters. The AI can only enforce Rule 7 (font heights) if a physical reference scale is present in the frame, or by calculating relative bounding-box proportions and conditionally flagging them.
*   **Weight Verification**: The AI **cannot** verify the actual Net Weight of a package. The legal enforcement of weight (e.g., under-weighing) requires calibrated scales, Tare/Gross calculations, and application of the First Schedule Maximum Permissible Error (MPE). The AI's jurisdiction is strictly limited to verifying the *presence and formatting* of the Net Quantity declaration, not its physical accuracy.

## 3. Strict Liability and Evidence
Legal Metrology operates on strict liability. Intent (mens rea) is irrelevant. If the MRP is missing, the offense is complete. The AI's bounding box outputs serve as the *prima facie* digital evidence. Therefore, the confidence thresholds for detection must be exceptionally high (e.g., > 0.95) before triggering a compounding notice.
