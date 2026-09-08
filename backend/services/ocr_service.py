import os
import cv2
import json
import numpy as np
from typing import List, Tuple, Dict, Any
from PIL import Image
from dotenv import load_dotenv
from rapidocr_onnxruntime import RapidOCR

load_dotenv()

class OCRService:
    def __init__(self, gemini_api_key: str = None):
        # Initialize RapidOCR local engine as high-speed reliable fallback
        self.local_engine = RapidOCR()
        
        self.api_key = gemini_api_key or os.getenv("GEMINI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                print("[INFO] Gemini Vision client initialized for Bounding Box generation.")
            except Exception as e:
                print(f"[WARN] Gemini client init error: {e}")

    def run_ocr(self, image_path: str) -> Tuple[List[Dict[str, Any]], float]:
        """
        Executes text detection and recognition on target image path.
        Prioritizes Gemini Vision model for intelligent semantic bounding boxes.
        Falls back seamlessly to local RapidOCR if Gemini is offline, throttled, or unconfigured.
        """
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found at {image_path}")

        # Try Gemini Vision model for bounding boxes if client is configured
        if self.client:
            try:
                detections, avg_conf = self._run_gemini_vision_bboxes(image_path)
                if detections:
                    print(f"[INFO] Generated {len(detections)} bounding boxes via Gemini Vision.")
                    return detections, avg_conf
            except Exception as e:
                print(f"[WARN] Gemini Vision bounding box generation failed: {e}. Using local RapidOCR fallback.")

        # Fallback to local RapidOCR
        return self._run_local_ocr(image_path)

    def _run_gemini_vision_bboxes(self, image_path: str) -> Tuple[List[Dict[str, Any]], float]:
        image = Image.open(image_path)
        orig_w, orig_h = image.size

        prompt = """
Locate all printed text and statutory declarations on this Indian packaged commodity.
Detect each label element and its 2D bounding box.

Return a valid JSON array of objects with:
- "text": string (the exact printed text detected)
- "box_2d": [ymin, xmin, ymax, xmax] (normalized integers from 0 to 1000)
- "confidence": float between 0.0 and 1.0

Example:
[
  {"text": "TATA Salt", "box_2d": [343, 267, 432, 696], "confidence": 0.99}
]
"""
        response = self.client.models.generate_content(
            model='gemini-flash-lite-latest',
            contents=[image, prompt],
            config={'response_mime_type': 'application/json'}
        )

        data = json.loads(response.text)
        if not isinstance(data, list):
            return [], 0.0

        detections = []
        confidences = []

        for item in data:
            box = item.get("box_2d")
            text = str(item.get("text", "")).strip()
            conf = float(item.get("confidence", 0.95))

            if box and len(box) == 4 and text:
                ymin, xmin, ymax, xmax = box
                # Scale from 0-1000 normalized to pixel coordinates matching image aspect
                # Scan.tsx SVG canvas scales to 800x500
                canvas_w = 800.0
                canvas_h = 500.0
                
                detections.append({
                    "x_min": round((xmin / 1000.0) * canvas_w, 2),
                    "y_min": round((ymin / 1000.0) * canvas_h, 2),
                    "x_max": round((xmax / 1000.0) * canvas_w, 2),
                    "y_max": round((ymax / 1000.0) * canvas_h, 2),
                    "confidence": conf,
                    "text": text
                })
                confidences.append(conf)

        avg_conf = float(np.mean(confidences)) if confidences else 0.0
        return detections, avg_conf

    def _run_local_ocr(self, image_path: str) -> Tuple[List[Dict[str, Any]], float]:
        result, elapse = self.local_engine(image_path)
        if not result:
            return [], 0.0

        detections = []
        confidences = []
        for item in result:
            bbox, text, conf = item
            pts = np.array(bbox)
            x_min = float(np.min(pts[:, 0]))
            y_min = float(np.min(pts[:, 1]))
            x_max = float(np.max(pts[:, 0]))
            y_max = float(np.max(pts[:, 1]))

            detections.append({
                "x_min": x_min,
                "y_min": y_min,
                "x_max": x_max,
                "y_max": y_max,
                "confidence": float(conf),
                "text": str(text).strip()
            })
            confidences.append(float(conf))

        avg_conf = float(np.mean(confidences)) if confidences else 0.0
        return detections, avg_conf
