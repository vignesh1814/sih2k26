import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sih26034_lmpc';

let isConnected = false;

export const inMemoryStore = {
  scans: [
    {
      scan_id: 'SCAN-IN-2026-0891',
      status: 'PASS',
      overall_confidence: 0.98,
      declarations: {
        generic_name: 'Premium Roasted Cashews',
        net_quantity: '500',
        unit: 'g',
        mrp: 450,
        mrp_text: 'Rs. 450.00 (Incl. of all taxes)',
        has_inclusive_phrase: true,
        unit_sale_price: 0.90,
        mfg_date: '08/2026',
        manufacturer: 'Himalayan Dry Fruits Pvt Ltd, Himachal Pradesh - 171001',
        consumer_care: 'Toll Free: 1800-11-2233 | Email: care@himalayanfruits.in',
        country_of_origin: 'India',
        barcode: '8901234567890'
      },
      violations: [],
      detections: [],
      evidence_hash: '7c4a89d4e5f67a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
      created_at: new Date('2026-09-07T10:30:00Z')
    },
    {
      scan_id: 'SCAN-IN-2026-0892',
      status: 'FAIL',
      overall_confidence: 0.94,
      declarations: {
        generic_name: 'Spicy Potato Sev Bhujia',
        net_quantity: '400',
        unit: 'gms',
        mrp: 90,
        mrp_text: 'MRP Rs. 90/-',
        has_inclusive_phrase: false,
        unit_sale_price: 0.22,
        mfg_date: '07/2026',
        manufacturer: 'Sunrise Foods & FMCG Ltd, Plot 42, GIDC, Gujarat - 382445',
        consumer_care: 'care@sunrisegroup.com',
        country_of_origin: 'India',
        barcode: '8909876543210'
      },
      violations: [
        {
          rule_code: 'Rule 6(1)(c) & Rule 13',
          declaration: 'Net Quantity Unit',
          reason: "Prohibited colloquial unit abbreviation 'gms'. Non-standard under Section 11 of Act.",
          severity: 'CRITICAL',
          suggested_correction: "Replace with statutory SI symbol 'g'"
        },
        {
          rule_code: 'Rule 6(1)(e)',
          declaration: 'Maximum Retail Price (MRP)',
          reason: "MRP does not contain mandatory statutory phrase 'Inclusive of all taxes'",
          severity: 'CRITICAL',
          suggested_correction: "Mandatory suffix 'Inclusive of all taxes' must accompany MRP"
        }
      ],
      detections: [],
      evidence_hash: '9f2b84c7a1e05d3b6f8c2e4a7d9b0c1e3f5a7b9c1d3e5f7a9b1c3d5e7f9a1b3c',
      created_at: new Date('2026-09-07T11:45:00Z')
    },
    {
      scan_id: 'SCAN-IN-2026-0893',
      status: 'FAIL',
      overall_confidence: 0.92,
      declarations: {
        generic_name: 'Pure Desi Cow Ghee',
        net_quantity: '1',
        unit: 'ltr',
        mrp: 650,
        mrp_text: 'MRP: Rs. 650.00',
        has_inclusive_phrase: false,
        mfg_date: '06/2026',
        manufacturer: 'Sunrise Foods & FMCG Ltd, Plot 42, GIDC, Gujarat - 382445',
        country_of_origin: 'India'
      },
      violations: [
        {
          rule_code: 'Rule 6(1)(c) & Rule 13',
          declaration: 'Net Quantity Unit',
          reason: "Prohibited colloquial unit 'ltr'. Must declare standard SI symbol 'l' or 'L'.",
          severity: 'CRITICAL',
          suggested_correction: "Use 'l' or 'L' as per Schedule 2"
        },
        {
          rule_code: 'Rule 6(2)',
          declaration: 'Consumer Helpline Details',
          reason: 'Consumer grievance contact number is unstated on the principal display panel.',
          severity: 'WARNING',
          suggested_correction: 'Provide valid grievance helpline'
        }
      ],
      detections: [],
      evidence_hash: '3e4d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e',
      created_at: new Date('2026-09-08T09:15:00Z')
    }
  ],
  challans: [
    {
      challan_id: 'CHL-2026-0041',
      scan_id: 'SCAN-IN-2026-0892',
      manufacturer_name: 'Sunrise Foods & FMCG Ltd',
      product_name: 'Spicy Potato Sev Bhujia (400g)',
      issued_by: 'Dr. R. K. Verma, Controller of Legal Metrology',
      issued_by_role: 'SUPERIOR',
      inspector_name: 'Field Inspector Sharma (Maharashtra Wing)',
      violation_codes: ['Rule 6(1)(c) - Non-standard unit "gms"', 'Rule 6(1)(e) - Missing Tax Declaration'],
      act_sections: ['Section 36(1) of Legal Metrology Act, 2009', 'Rule 32 Compounding Provisions'],
      penalty_amount: 25000,
      status: 'ISSUED',
      due_date: new Date('2026-09-25T18:00:00Z'),
      hearing_date: new Date('2026-09-28T11:00:00Z'),
      issued_at: new Date('2026-09-07T14:00:00Z'),
      manufacturer_response: null,
      notes: 'First statutory warning notice with compounding compounding penalty offer.'
    },
    {
      challan_id: 'CHL-2026-0042',
      scan_id: 'SCAN-IN-2026-0893',
      manufacturer_name: 'Sunrise Foods & FMCG Ltd',
      product_name: 'Pure Desi Cow Ghee (1L)',
      issued_by: 'Dr. R. K. Verma, Controller of Legal Metrology',
      issued_by_role: 'SUPERIOR',
      inspector_name: 'Inspector Deshmukh (Gujarat Enforcement)',
      violation_codes: ['Rule 6(1)(c) - Prohibited symbol "ltr"', 'Rule 6(2) - Missing Grievance Phone'],
      act_sections: ['Section 36(1) of Legal Metrology Act, 2009', 'Section 11 (Prohibition of non-standard units)'],
      penalty_amount: 50000,
      status: 'ACKNOWLEDGED',
      due_date: new Date('2026-09-22T18:00:00Z'),
      hearing_date: new Date('2026-09-26T14:30:00Z'),
      issued_at: new Date('2026-09-08T10:00:00Z'),
      manufacturer_response: 'Notice acknowledged. Packaging team is revising cylinder engraving.',
      notes: 'Repeat violation within 12 months. Mandatory penalty escalation.'
    }
  ],
  auditLogs: [
    {
      timestamp: new Date('2026-09-08T10:00:00Z'),
      user_name: 'Dr. R. K. Verma',
      user_role: 'SUPERIOR',
      action: 'ISSUE_CHALLAN',
      resource: 'CHL-2026-0042',
      details: 'Issued statutory challan of Rs. 50,000 to Sunrise Foods & FMCG Ltd for non-standard unit',
      status: 'SUCCESS',
      ip_address: '10.0.4.12'
    },
    {
      timestamp: new Date('2026-09-07T14:00:00Z'),
      user_name: 'Dr. R. K. Verma',
      user_role: 'SUPERIOR',
      action: 'ISSUE_CHALLAN',
      resource: 'CHL-2026-0041',
      details: 'Issued compounding notice of Rs. 25,000 for missing tax phrase',
      status: 'SUCCESS',
      ip_address: '10.0.4.12'
    }
  ],
  reports: []
};

export const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[MongoDB] Connected successfully to ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[MongoDB] Database connection failed (${error.message}). Operating in in-memory resilience mode.`);
    isConnected = false;
  }
};

export const isDbConnected = () => isConnected;
