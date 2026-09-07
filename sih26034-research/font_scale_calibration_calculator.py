"""
Experiment E2: Reference Object Camera Calibration & Font Scale Calculator
Validates whether a known physical reference object (ISO/IEC 7810 ID-1 Card: 85.60mm x 53.98mm)
can reliably calculate pixel-to-millimeter ratio and verify Rule 7 font height compliance.
"""

class CalibrationCalculator:
    # Standard ISO/IEC 7810 ID-1 card dimensions (standard banking card, driving license, Aadhaar)
    CARD_WIDTH_MM = 85.60
    CARD_HEIGHT_MM = 53.98

    # LMPC Rule 7 Table I minimum font height requirements (in mm) based on Net Quantity
    TABLE_I_REQUIREMENTS = [
        {'max_qty_g_or_ml': 50, 'min_numeral_height_mm': 1.0},
        {'max_qty_g_or_ml': 200, 'min_numeral_height_mm': 2.0},
        {'max_qty_g_or_ml': 1000, 'min_numeral_height_mm': 4.0},
        {'max_qty_g_or_ml': float('inf'), 'min_numeral_height_mm': 6.0}
    ]

    @classmethod
    def compute_scale_factor(cls, detected_card_width_px, detected_card_height_px):
        """Calculates millimeters per pixel from detected reference card bounding box."""
        scale_x = cls.CARD_WIDTH_MM / detected_card_width_px
        scale_y = cls.CARD_HEIGHT_MM / detected_card_height_px
        # Average scale factor assuming square pixels and frontal plane alignment
        mm_per_pixel = (scale_x + scale_y) / 2.0
        return mm_per_pixel

    @classmethod
    def estimate_physical_font_height(cls, font_bbox_height_px, mm_per_pixel):
        """Estimates physical font height in millimeters."""
        return round(font_bbox_height_px * mm_per_pixel, 2)

    @classmethod
    def check_rule_7_compliance(cls, net_quantity_value, estimated_font_height_mm):
        """Evaluates estimated font height against LMPC Rule 7 Table I standards."""
        required_height = 1.0
        for tier in cls.TABLE_I_REQUIREMENTS:
            if net_quantity_value <= tier['max_qty_g_or_ml']:
                required_height = tier['min_numeral_height_mm']
                break

        is_compliant = estimated_font_height_mm >= required_height
        margin_percent = round(((estimated_font_height_mm - required_height) / required_height) * 100, 1)

        return {
            'net_quantity': net_quantity_value,
            'required_min_height_mm': required_height,
            'estimated_height_mm': estimated_font_height_mm,
            'is_compliant': is_compliant,
            'margin_percent': margin_percent,
            'status': 'PASS' if is_compliant else 'FAIL'
        }

def run_calibration_simulation():
    print('=== Running Experiment E2: Reference Object Calibration Simulation ===')
    # Simulated scenario: Smartphone photograph at ~30cm distance
    # Card is detected as 428px wide by 270px high
    detected_card_w = 428.0
    detected_card_h = 270.0

    scale = CalibrationCalculator.compute_scale_factor(detected_card_w, detected_card_h)
    print(f'Computed mm-per-pixel scale: {scale:.4f} mm/px')

    test_cases = [
        {'label': 'Package A (150g, font bbox 22px)', 'qty': 150, 'font_px': 22},
        {'label': 'Package B (500g, font bbox 16px - Violating)', 'qty': 500, 'font_px': 16},
        {'label': 'Package C (1000g, font bbox 32px)', 'qty': 1000, 'font_px': 32}
    ]

    for tc in test_cases:
        est_height = CalibrationCalculator.estimate_physical_font_height(tc['font_px'], scale)
        res = CalibrationCalculator.check_rule_7_compliance(tc['qty'], est_height)
        print(f"{tc['label']}: Est Height = {res['estimated_height_mm']}mm, Req = {res['required_min_height_mm']}mm -> {res['status']}")

if __name__ == '__main__':
    run_calibration_simulation()
