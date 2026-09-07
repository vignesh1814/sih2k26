"""
Module 1: Image Quality & Pre-Triage Gatekeeper
Isolate and evaluates packaging images for blur, localized glare, and illumination before OCR/VLM.
Uses NumPy and PIL for zero-dependency execution across environments.
"""

import numpy as np
from PIL import Image, ImageOps

class ImageQualityTriage:
    def __init__(self, blur_threshold=100.0, glare_threshold_pct=3.0, under_exp_thresh=45, over_exp_thresh=225):
        self.blur_threshold = blur_threshold
        self.glare_threshold_pct = glare_threshold_pct
        self.under_exp_thresh = under_exp_thresh
        self.over_exp_thresh = over_exp_thresh

    def _compute_laplacian_variance(self, gray_np):
        """
        Computes the variance of the Laplacian using standard 3x3 kernel convolution.
        Higher variance = sharper image edges; lower variance = blurry.
        """
        kernel = np.array([
            [0,  1, 0],
            [1, -4, 1],
            [0,  1, 0]
        ], dtype=np.float32)
        
        # Convolve using NumPy
        h, w = gray_np.shape
        pad = np.pad(gray_np.astype(np.float32), 1, mode='reflect')
        laplacian = (
            pad[0:h, 1:w+1] + pad[2:h+2, 1:w+1] + 
            pad[1:h+1, 0:w] + pad[1:h+1, 2:w+2] - 
            4 * pad[1:h+1, 1:w+1]
        )
        return float(np.var(laplacian))

    def evaluate_quality(self, image_input, roi_xyxy=None):
        """
        Evaluates an image (file path, PIL Image, or NumPy array).
        roi_xyxy: Optional [x1, y1, x2, y2] to evaluate quality specifically within the PDP/text area.
        """
        if isinstance(image_input, str):
            img = Image.open(image_input).convert('RGB')
        elif isinstance(image_input, Image.Image):
            img = image_input.convert('RGB')
        elif isinstance(image_input, np.ndarray):
            img = Image.fromarray(image_input).convert('RGB')
        else:
            raise ValueError("Unsupported image input type.")

        if roi_xyxy is not None:
            x1, y1, x2, y2 = [int(v) for v in roi_xyxy]
            img = img.crop((x1, y1, x2, y2))

        img_np = np.array(img)
        gray = np.array(ImageOps.grayscale(img))

        # 1. Blur evaluation
        blur_score = self._compute_laplacian_variance(gray)
        is_blurry = blur_score < self.blur_threshold

        # 2. Glare evaluation (saturated pixels in RGB >= 250 in all channels)
        saturated_pixels = np.sum((img_np[:, :, 0] >= 250) & 
                                  (img_np[:, :, 1] >= 250) & 
                                  (img_np[:, :, 2] >= 250))
        total_pixels = img_np.shape[0] * img_np.shape[1]
        glare_pct = float((saturated_pixels / max(total_pixels, 1)) * 100)
        has_excessive_glare = glare_pct > self.glare_threshold_pct

        # 3. Exposure evaluation
        mean_brightness = float(np.mean(gray))
        if mean_brightness < self.under_exp_thresh:
            exposure_status = "UNDEREXPOSED"
        elif mean_brightness > self.over_exp_thresh:
            exposure_status = "OVEREXPOSED"
        else:
            exposure_status = "NORMAL"

        # Determine overall acceptability
        is_acceptable = (not is_blurry) and (not has_excessive_glare) and (exposure_status == "NORMAL")

        reasons = []
        if is_blurry:
            reasons.append(f"Image is out of focus (sharpness: {blur_score:.1f} < {self.blur_threshold})")
        if has_excessive_glare:
            reasons.append(f"Excessive specular glare ({glare_pct:.2f}% saturated pixels)")
        if exposure_status != "NORMAL":
            reasons.append(f"Lighting condition poor: {exposure_status} (mean brightness: {mean_brightness:.1f})")

        recommended_action = "PROCEED_TO_OCR" if is_acceptable else f"RETAKE_IMAGE: {'; '.join(reasons)}"

        return {
            "is_acceptable": is_acceptable,
            "blur_score": round(blur_score, 2),
            "is_blurry": is_blurry,
            "glare_percentage": round(glare_pct, 2),
            "has_excessive_glare": has_excessive_glare,
            "exposure_status": exposure_status,
            "mean_brightness": round(mean_brightness, 2),
            "recommended_action": recommended_action
        }

if __name__ == '__main__':
    print("Testing Module 1: Image Quality Triage in isolation...")
    triage = ImageQualityTriage(blur_threshold=80.0)

    # Test 1: Synthetic sharp image
    sharp_img = np.zeros((300, 300, 3), dtype=np.uint8)
    sharp_img[50:250, 50:250] = 200
    sharp_res = triage.evaluate_quality(sharp_img)
    print("Test 1 (Sharp Image):", sharp_res["recommended_action"])

    # Test 2: Severe Glare image
    glare_img = np.zeros((300, 300, 3), dtype=np.uint8) + 120
    glare_img[100:200, 100:200] = 255  # 11% glare patch
    glare_res = triage.evaluate_quality(glare_img)
    print("Test 2 (Glare Image):", glare_res["recommended_action"])

    # Test 3: Very dark warehouse image
    dark_img = np.zeros((300, 300, 3), dtype=np.uint8) + 20
    dark_res = triage.evaluate_quality(dark_img)
    print("Test 3 (Dark Image):", dark_res["recommended_action"])
