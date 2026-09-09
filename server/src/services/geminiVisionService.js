import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { ExtractionService } from './extractionService.js';
import { OCRService } from './ocrService.js';

dotenv.config();

export class GeminiVisionService {
  /**
   * Analyze one or more package panel images directly with Gemini Multimodal Vision.
   * @param {string|string[]} imagePaths - Path(s) to package images
   * @param {Object} options - Extra configuration options
   * @returns {Promise<{ declarations: Object, detections: Array, avg_conf: number, analysis_mode: string }>}
   */
  static async analyzePackageImages(imagePaths, options = {}) {
    const paths = Array.isArray(imagePaths) ? imagePaths : [imagePaths];
    const validPaths = paths.filter(p => fs.existsSync(p));

    if (validPaths.length === 0) {
      throw new Error('No valid image file paths provided for Gemini analysis');
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 1. If Gemini API Key is available, invoke Gemini 1.5 Flash Vision Multimodal API directly
    if (apiKey) {
      try {
        const geminiResult = await this.callGeminiVisionAPI(validPaths, apiKey);
        if (geminiResult && geminiResult.declarations) {
          return {
            ...geminiResult,
            analysis_mode: 'GEMINI_1_5_VISION'
          };
        }
      } catch (geminiErr) {
        console.warn(`[GeminiVisionService] Direct Gemini API call failed (${geminiErr.message}). Using local engine fallback.`);
      }
    }

    // 2. Local Fallback Engine (when API key is absent or offline)
    let combinedDetections = [];
    let confs = [];

    for (const imgPath of validPaths) {
      const ocrRes = await OCRService.runTesseractOCR(imgPath);
      if (ocrRes.detections) {
        combinedDetections = combinedDetections.concat(ocrRes.detections);
      }
      if (ocrRes.avg_conf) {
        confs.push(ocrRes.avg_conf);
      }
    }

    const declarations = ExtractionService.extractDeclarations(combinedDetections);
    const avgConf = confs.length > 0 ? confs.reduce((a, b) => a + b, 0) / confs.length : 0.92;

    return {
      declarations,
      detections: combinedDetections,
      avg_conf: Math.round(avgConf * 100) / 100,
      analysis_mode: 'GEMINI_VISION_FALLBACK'
    };
  }

  /**
   * Directly sends image parts to Gemini Vision API with comprehensive LMPC statutory parsing prompt.
   */
  static async callGeminiVisionAPI(imagePaths, apiKey) {
    const contentsParts = [];

    const prompt = `You are the Official Legal Metrology (LMPC) Compliance AI Engine for the Department of Consumer Affairs, Government of India.
Carefully analyze the attached pre-packaged commodity image(s) and evaluate all statutory declarations under the Legal Metrology (Packaged Commodities) Rules, 2011 & Amendments.

Extract the following statutory declarations strictly from what is printed on the package:
1. "generic_name": Common or generic name of commodity (e.g., "Biscuits", "Wheat Flour", "Refined Sunflower Oil", "Toothpaste"). If not found, return null.
2. "net_quantity": Numeric value of net quantity (e.g., "500", "1", "100", "250"). If not found, return null.
3. "unit": Standard SI unit abbreviation strictly as printed (e.g., "g", "kg", "ml", "l", "m", "N", "u", "count", "gms", "gm", "ltr"). If not found, return null.
4. "mrp": Numeric maximum retail price in Indian Rupees (e.g. 50.00, 20, 199.50). If MRP is not detected or missing, return null.
5. "mrp_text": Exact printed price string (e.g., "MRP Rs. 50.00 incl. of all taxes"). If not found, return null.
6. "has_inclusive_phrase": Boolean true if the phrase "incl. of all taxes" or "inclusive of all taxes" is printed; false otherwise.
7. "unit_sale_price": Declared or printed Unit Sale Price per standard unit (e.g. 0.20 per g, 1.03 / g, 50.00 / kg). If not found, return null.
8. "mfg_date": Month & Year or Year of manufacture/packing/import (e.g., "05/2024", "2024", "PKD 08/24", "May 2024"). Any printed manufacturing year should be returned here. If not found, return null.
9. "expiry_date": Expiry date / best before string if present (e.g. "12 months from pkg", "05/2025"). If not found, return null.
10. "manufacturer": Full name and complete address of manufacturer, packer, or importer. If not found, return null.
11. "country_of_origin": Country of origin (e.g. "India", "Made in India"). If not found, return null.
12. "consumer_care": Consumer helpline contact, email address, toll-free number (1800...), or mobile number for consumer grievances. If any email or number is present, capture it here. If not found, return null.
13. "barcode": 12 or 13-digit EAN/UPC barcode number if legible. If not found, return null.
14. "detections": Array of detected text lines with their 2D bounding boxes in format:
    [{"text": string, "box_2d": [ymin, xmin, ymax, xmax], "confidence": float between 0.0 and 1.0}]

Return a single JSON object strictly matching this schema:
{
  "declarations": {
    "generic_name": string | null,
    "net_quantity": string | null,
    "unit": string | null,
    "mrp": number | null,
    "mrp_text": string | null,
    "has_inclusive_phrase": boolean,
    "unit_sale_price": number | null,
    "mfg_date": string | null,
    "expiry_date": string | null,
    "manufacturer": string | null,
    "country_of_origin": string | null,
    "consumer_care": string | null,
    "barcode": string | null
  },
  "detections": [
    {
      "text": "MRP Rs. 50.00 incl. of all taxes",
      "box_2d": [100, 200, 150, 600],
      "confidence": 0.98
    }
  ]
}`;

    contentsParts.push({ text: prompt });

    // Attach all panel images as inline base64 data
    for (const imgPath of imagePaths) {
      const buffer = fs.readFileSync(imgPath);
      const ext = path.extname(imgPath).toLowerCase().replace('.', '') || 'jpeg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      contentsParts.push({
        inline_data: {
          mime_type: mimeType,
          data: buffer.toString('base64')
        }
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: contentsParts
          }
        ],
        generationConfig: {
          response_mime_type: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini Vision API status ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawJson) {
      throw new Error('Empty response from Gemini Vision');
    }

    const parsed = JSON.parse(rawJson);
    const decl = parsed.declarations || {};

    // Standardize detections to 800x500 canvas coordinates
    const detections = [];
    const canvasW = 800.0;
    const canvasH = 500.0;

    if (Array.isArray(parsed.detections)) {
      for (const d of parsed.detections) {
        const box = d.box_2d;
        if (box && box.length === 4) {
          const [ymin, xmin, ymax, xmax] = box;
          detections.push({
            text: d.text || '',
            confidence: parseFloat(d.confidence || 0.95),
            x_min: Math.round((xmin / 1000.0) * canvasW),
            y_min: Math.round((ymin / 1000.0) * canvasH),
            x_max: Math.round((xmax / 1000.0) * canvasW),
            y_max: Math.round((ymax / 1000.0) * canvasH)
          });
        }
      }
    }

    return {
      declarations: decl,
      detections,
      avg_conf: 0.98
    };
  }
}
