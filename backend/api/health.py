import os
from fastapi import APIRouter
from auxiliary_modules.demo_offline_fallback import DemoOfflineFallback

router = APIRouter(prefix="/api/v1", tags=["Health & Fallback"])

@router.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "LMPC Compliance AI Engine",
        "ocr_engine": "RapidOCR PP-OCRv4 ONNX",
        "rules_engine": "Zen Engine (Rust JDM)",
        "version": "1.0.0"
    }

@router.get("/demo/{scenario_key}")
def get_demo_scenario(scenario_key: str):
    """
    Zero-latency mock endpoint for SIH live presentations or offline demonstrations.
    Supported keys: compliant_biscuit, obscured_mrp_violation, non_standard_unit_violation
    """
    res = DemoOfflineFallback.get_response(scenario_key)
    return res
