package com.sih26034.lmpc.data.models

import com.google.gson.annotations.SerializedName

data class BoundingBox(
    @SerializedName("x_min") val xMin: Float,
    @SerializedName("y_min") val yMin: Float,
    @SerializedName("x_max") val xMax: Float,
    @SerializedName("y_max") val yMax: Float,
    @SerializedName("confidence") val confidence: Float,
    @SerializedName("text") val text: String
)

data class RuleViolation(
    @SerializedName("rule_code") val ruleCode: String,
    @SerializedName("declaration") val declaration: String,
    @SerializedName("reason") val reason: String,
    @SerializedName("severity") val severity: String,
    @SerializedName("suggested_correction") val suggestedCorrection: String?
)

data class ExtractedDeclarations(
    @SerializedName("generic_name") val genericName: String?,
    @SerializedName("net_quantity") val netQuantity: String?,
    @SerializedName("unit") val unit: String?,
    @SerializedName("mrp") val mrp: Float?,
    @SerializedName("mrp_text") val mrpText: String?,
    @SerializedName("has_inclusive_phrase") val hasInclusivePhrase: Boolean?,
    @SerializedName("unit_sale_price") val unitSalePrice: Float?,
    @SerializedName("mfg_date") val mfgDate: String?,
    @SerializedName("expiry_date") val expiryDate: String?,
    @SerializedName("manufacturer") val manufacturer: String?,
    @SerializedName("country_of_origin") val countryOfOrigin: String?,
    @SerializedName("consumer_care") val consumerCare: String?,
    @SerializedName("barcode") val barcode: String?
)

data class ImageQualityAssessment(
    @SerializedName("is_acceptable") val isAcceptable: Boolean,
    @SerializedName("blur_score") val blurScore: Float,
    @SerializedName("glare_percentage") val glarePercentage: Float,
    @SerializedName("exposure_status") val exposureStatus: String,
    @SerializedName("recommended_action") val recommendedAction: String
)

data class ScanResponse(
    @SerializedName("scan_id") val scanId: String,
    @SerializedName("status") val status: String,
    @SerializedName("overall_confidence") val overallConfidence: Float,
    @SerializedName("image_quality") val imageQuality: ImageQualityAssessment,
    @SerializedName("declarations") val declarations: ExtractedDeclarations,
    @SerializedName("violations") val violations: List<RuleViolation>,
    @SerializedName("detections") val detections: List<BoundingBox>,
    @SerializedName("evidence_hash") val evidenceHash: String,
    @SerializedName("report_download_url") val reportDownloadUrl: String?,
    @SerializedName("message") val message: String?
)

data class HealthResponse(
    @SerializedName("status") val status: String,
    @SerializedName("service") val service: String,
    @SerializedName("ocr_engine") val ocrEngine: String,
    @SerializedName("rules_engine") val rulesEngine: String,
    @SerializedName("version") val version: String
)
