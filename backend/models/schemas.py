from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x_min: float
    y_min: float
    x_max: float
    y_max: float
    confidence: float
    text: str

class RuleViolation(BaseModel):
    rule_code: str = Field(..., description="Legal citation, e.g. Rule 6(1)(c) or Rule 13")
    declaration: str = Field(..., description="Affected declaration, e.g. Net Quantity, MRP")
    reason: str = Field(..., description="Statutory explanation of the violation")
    severity: str = Field(default="CRITICAL", description="CRITICAL or WARNING")
    suggested_correction: Optional[str] = None
    bbox: Optional[List[float]] = None

class ExtractedDeclarations(BaseModel):
    generic_name: Optional[str] = None
    net_quantity: Optional[str] = None
    unit: Optional[str] = None
    mrp: Optional[float] = None
    mrp_text: Optional[str] = None
    has_inclusive_phrase: Optional[bool] = None
    unit_sale_price: Optional[float] = None
    mfg_date: Optional[str] = None
    expiry_date: Optional[str] = None
    manufacturer: Optional[str] = None
    country_of_origin: Optional[str] = None
    consumer_care: Optional[str] = None
    barcode: Optional[str] = None

class ImageQualityAssessment(BaseModel):
    is_acceptable: bool
    blur_score: float
    glare_percentage: float
    exposure_status: str
    recommended_action: str

class ScanResponse(BaseModel):
    scan_id: str
    status: str = Field(..., description="PASS | FAIL | NEEDS_REVIEW | INSUFFICIENT_EVIDENCE")
    overall_confidence: float
    image_quality: ImageQualityAssessment
    declarations: ExtractedDeclarations
    violations: List[RuleViolation] = []
    detections: List[BoundingBox] = []
    evidence_hash: str
    report_download_url: Optional[str] = None
    message: Optional[str] = None

class ReportRequest(BaseModel):
    scan_id: str
    officer_name: Optional[str] = "Legal Metrology Field Inspector"
    station_jurisdiction: Optional[str] = "Metrology Central Enforcement Wing"
    notes: Optional[str] = None

class ReportResponse(BaseModel):
    report_id: str
    pdf_url: str
    evidence_hash: str
    generated_at: str
    status: str
