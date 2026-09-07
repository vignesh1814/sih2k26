"""
Master Test Suite: Verifies all auxiliary modules in isolation.
"""
import numpy as np
from auxiliary_modules.image_quality_triage import ImageQualityTriage
from auxiliary_modules.barcode_validator import BarcodeValidator
from auxiliary_modules.metric_unit_math import MetricUnitMathEngine
from auxiliary_modules.legal_notice_generator import LegalNoticeGenerator
from auxiliary_modules.demo_offline_fallback import DemoOfflineFallback
from auxiliary_modules.benchmark_metrics_exporter import BenchmarkMetricsExporter

def test_suite():
    print("==================================================")
    print("RUNNING FULL ISOLATED AUXILIARY TEST SUITE")
    print("==================================================")

    # 1. Triage
    triage = ImageQualityTriage(blur_threshold=50.0)
    img = np.zeros((200, 200, 3), dtype=np.uint8) + 128
    res1 = triage.evaluate_quality(img)
    assert res1["exposure_status"] == "NORMAL"
    print("[OK] Module 1 (Image Quality Triage): Passed")

    # 2. Barcode
    res2 = BarcodeValidator.validate_ean13("8901058852394")
    assert res2["is_valid"] is True
    assert res2["is_gs1_india"] is True
    print("[OK] Module 2 (GS1 Barcode Validator): Passed")

    # 3. Unit Math
    res3 = MetricUnitMathEngine.verify_unit_sale_price(100.0, 500, "g", 0.20)
    assert res3["is_compliant"] is True
    illegal_u = MetricUnitMathEngine.validate_unit_symbol("gms")
    assert illegal_u["is_valid"] is False
    print("[OK] Module 3 (Metric Unit Math Engine): Passed")

    # 4. Notice Generator
    res4 = LegalNoticeGenerator.generate_inspection_memo("Corp", "Address", "Biscuit", [])
    assert "SECTION 36(1)" in res4.upper()
    print("[OK] Module 4 (Legal Notice Generator): Passed")

    # 5. Offline Fallback
    res5 = DemoOfflineFallback.get_response("compliant_biscuit")
    assert res5["compliance_status"] == "PASS"
    print("[OK] Module 5 (Demo Offline Fallback): Passed")

    # 6. Benchmark Exporter
    res6 = BenchmarkMetricsExporter.export_ascii_summary()
    assert "EMPIRICAL BENCHMARK SUMMARY" in res6
    print("[OK] Module 6 (Benchmark Metrics Exporter): Passed")

    print("==================================================")
    print("ALL 6 AUXILIARY MODULES PASSED IN ISOLATION!")
    print("==================================================")

if __name__ == '__main__':
    test_suite()
