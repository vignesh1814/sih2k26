import fs from 'fs';
import path from 'path';
import { createWorker } from 'tesseract.js';
import dotenv from 'dotenv';

dotenv.config();

export class OCRService {
  /**
   * Run OCR on image file
   * @param {string} imagePath 
   * @returns {Promise<{detections: Array<{text: string, confidence: number, x_min: number, y_min: number, x_max: number, y_max: number}>, avg_conf: number}>}
   */
  static async runOCR(imagePath) {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image not found at ${imagePath}`);
    }

    // 1. Try Gemini Vision if API key is provided
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      try {
        const geminiResult = await this.runGeminiVisionOCR(imagePath, geminiApiKey);
        if (geminiResult && geminiResult.detections.length > 0) {
          return geminiResult;
        }
      } catch (err) {
        console.warn(`[OCRService] Gemini Vision failed (${err.message}). Falling back to Tesseract OCR.`);
      }
    }

    // 2. Fallback to Tesseract OCR
    return await this.runTesseractOCR(imagePath);
  }

  /**
   * Tesseract OCR extraction with word/line bounding boxes
   */
  static async runTesseractOCR(imagePath) {
    let worker = null;
    try {
      worker = await createWorker('eng');
      const ret = await worker.recognize(imagePath);
      const detections = [];
      const confidences = [];

      const lines = ret.data.lines || [];
      const canvasW = 800.0;
      const canvasH = 500.0;
      const imgW = ret.data.image_width || 800;
      const imgH = ret.data.image_height || 500;

      for (const line of lines) {
        const text = line.text.trim();
        if (text) {
          const conf = (line.confidence || 85) / 100.0;
          const bbox = line.bbox || { x0: 0, y0: 0, x1: 100, y1: 20 };
          
          detections.push({
            text: text,
            confidence: conf,
            x_min: Math.round((bbox.x0 / imgW) * canvasW),
            y_min: Math.round((bbox.y0 / imgH) * canvasH),
            x_max: Math.round((bbox.x1 / imgW) * canvasW),
            y_max: Math.round((bbox.y1 / imgH) * canvasH)
          });
          confidences.push(conf);
        }
      }

      await worker.terminate();

      const avgConf = confidences.length > 0 
        ? confidences.reduce((a, b) => a + b, 0) / confidences.length 
        : 0.85;

      return {
        detections,
        avg_conf: Math.round(avgConf * 100) / 100
      };
    } catch (error) {
      if (worker) {
        try { await worker.terminate(); } catch (e) {}
      }
      console.error(`[OCRService] Tesseract error: ${error.message}`);
      // Return basic fallback
      return { detections: [], avg_conf: 0.0 };
    }
  }

  /**
   * Gemini Vision model for intelligent 2D bounding boxes and statutory extraction
   */
  static async runGeminiVisionOCR(imagePath, apiKey) {
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase().replace('.', '') || 'jpeg';
    const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';

    const prompt = `Locate all printed text and statutory declarations on this Indian packaged commodity.
Detect each label element and its 2D bounding box.
Return a valid JSON array of objects with:
- "text": string (the exact printed text detected)
- "box_2d": [ymin, xmin, ymax, xmax] (normalized integers from 0 to 1000)
- "confidence": float between 0.0 and 1.0

Example:
[
  {"text": "MRP Rs. 50.00 (Incl. of all taxes)", "box_2d": [343, 267, 432, 696], "confidence": 0.99}
]`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error ${response.status}: ${await response.text()}`);
    }

    const resData = await response.json();
    const candidateText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return { detections: [], avg_conf: 0.0 };
    }

    const parsedArray = JSON.parse(candidateText);
    if (!Array.isArray(parsedArray)) {
      return { detections: [], avg_conf: 0.0 };
    }

    const detections = [];
    const confidences = [];
    const canvasW = 800.0;
    const canvasH = 500.0;

    for (const item of parsedArray) {
      const box = item.box_2d;
      const text = (item.text || '').trim();
      const conf = parseFloat(item.confidence || 0.95);

      if (box && box.length === 4 && text) {
        const [ymin, xmin, ymax, xmax] = box;
        detections.push({
          text,
          confidence: conf,
          x_min: Math.round((xmin / 1000.0) * canvasW),
          y_min: Math.round((ymin / 1000.0) * canvasH),
          x_max: Math.round((xmax / 1000.0) * canvasW),
          y_max: Math.round((ymax / 1000.0) * canvasH)
        });
        confidences.push(conf);
      }
    }

    const avgConf = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.95;

    return {
      detections,
      avg_conf: Math.round(avgConf * 100) / 100
    };
  }
}
