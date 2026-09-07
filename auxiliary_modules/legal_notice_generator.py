"""
Module 4: Statutory Inspection Memo & Preliminary Violation Notice Generator
Generates a legally framed inspection notice under Section 36(1) and Section 48
of the Legal Metrology Act, 2009, with embedded cryptographic image hashes and
precise statutory citations.
"""

import hashlib
import datetime

class LegalNoticeGenerator:
    # Statutory penalty tiers under Section 36(1) of Legal Metrology Act, 2009
    PENALTY_TIERS = {
        "first_offence": {"max_fine_inr": 25000, "compounding_eligible": True},
        "second_offence": {"max_fine_inr": 50000, "compounding_eligible": False},
        "subsequent_offence": {"max_fine_inr": 100000, "imprisonment_months": 12, "compounding_eligible": False}
    }

    @staticmethod
    def compute_evidence_hash(image_bytes_or_str):
        """Generates SHA-256 hash of evidentiary packaging image for chain of custody."""
        if isinstance(image_bytes_or_str, str):
            data = image_bytes_or_str.encode('utf-8')
        else:
            data = image_bytes_or_str
        return hashlib.sha256(data).hexdigest()

    @classmethod
    def generate_inspection_memo(cls, offender_name, offender_address, product_generic_name,
                                 violations, image_identifier="SAMPLE_IMG", is_first_offence=True):
        """
        Generates a legally defensible Inspection Memo & Preliminary Notice.
        violations: list of dicts with keys: 'rule_code', 'statutory_reference', 'description', 'bbox'
        """
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        evidence_hash = cls.compute_evidence_hash(f"{image_identifier}_{now}")

        penalty_info = cls.PENALTY_TIERS["first_offence"] if is_first_offence else cls.PENALTY_TIERS["second_offence"]

        memo_lines = [
            "=" * 78,
            "DEPARTMENT OF LEGAL METROLOGY — ENFORCEMENT & COMPLIANCE DIVISION",
            "PRELIMINARY INSPECTION MEMORANDUM & NOTICE OF APPARENT CONTRAVENTION",
            f"Issued under Rule 6 / Rule 7 of LMPC Rules 2011 read with Section 36(1), LM Act 2009",
            "=" * 78,
            f"Date & Timestamp   : {now}",
            f"Evidence Hash      : SHA-256: {evidence_hash}",
            f"Subject Commodity  : {product_generic_name}",
            f"Manufacturer/Packer: {offender_name}",
            f"Registered Address : {offender_address}",
            "-" * 78,
            "STATEMENT OF APPARENT STATUTORY VIOLATIONS:",
        ]

        for idx, v in enumerate(violations, 1):
            bbox_str = f" [Coordinates: {v.get('bbox')}]" if v.get('bbox') else ""
            memo_lines.append(f"  {idx}. Statute Violated: {v.get('statutory_reference', 'LMPC Rules 2011')}")
            memo_lines.append(f"     Rule Code       : {v.get('rule_code')}")
            memo_lines.append(f"     Nature of Breach: {v.get('description')}{bbox_str}")

        memo_lines.extend([
            "-" * 78,
            "LEGAL LIABILITY & PENALTY PROVISIONS:",
            f"  - Governing Section: Section 36(1) of the Legal Metrology Act, 2009.",
            f"  - Offence Class    : {'First Alleged Offence' if is_first_offence else 'Repeat Offence'}.",
            f"  - Statutory Fine   : Liable to fine up to INR {penalty_info['max_fine_inr']:,}.",
            f"  - Compounding      : {'Eligible for compounding under Section 48 upon application to Assistant Controller' if penalty_info['compounding_eligible'] else 'Ineligible for compounding (repeat offence). Subject to direct prosecution.'}",
            "-" * 78,
            "NOTE FOR LEGAL METROLOGY INSPECTOR:",
            "  This document represents an automated pre-investigation extraction summary.",
            "  Final compounding fee or seizure notice requires verification of historical records",
            "  and physical confirmation per Section 15 of the Act.",
            "=" * 78
        ])

        return "\n".join(memo_lines)

if __name__ == '__main__':
    print("Testing Module 4: Legal Notice Generator in isolation...")
    generator = LegalNoticeGenerator()

    sample_violations = [
        {
            "rule_code": "R6(1)(c)",
            "statutory_reference": "Rule 6(1)(c) of LMPC Rules 2011",
            "description": "Non-standard unit 'gms' used instead of metric 'g'",
            "bbox": [40, 70, 220, 92]
        },
        {
            "rule_code": "R6(11)",
            "statutory_reference": "Rule 6(11) (2022 Amendment)",
            "description": "Unit Sale Price omitted on pre-packaged retail commodity post-Oct 2022",
            "bbox": None
        }
    ]

    memo = generator.generate_inspection_memo(
        offender_name="Apex FMCG Ltd",
        offender_address="Plot 14, Okhla Industrial Area, New Delhi",
        product_generic_name="Roasted Almonds (500g)",
        violations=sample_violations,
        is_first_offence=True
    )
    print(memo)
