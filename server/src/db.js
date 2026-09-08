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
  entities: [
    {
      entity_id: 'ENT-2026-001',
      registration_no: 'GOI/TS/2026/2779',
      firm_name: 'Hyderabad Tulaman Private Limited',
      entity_type: 'Manufacturer & Packer',
      establishment_address: 'Plot 14, Industrial Development Area, Nacharam, Hyderabad, Telangana',
      district: 'Medchal-Malkajgiri',
      state: 'Telangana',
      pincode: '500076',
      registered_commodities: ['Electronic Weighing Machines', 'Packaged Industrial Lubricants', 'Pre-packaged Pulses & Grains'],
      license_status: 'ACTIVE',
      registration_date: '2021-04-10',
      valid_upto: '2028-04-09',
      contact_email: 'compliance@tulaman.in',
      contact_phone: '+91 40 2717 1234',
      compliance_rating: 96,
      total_inspections: 8,
      violations_count: 1,
      repeat_offender: false
    },
    {
      entity_id: 'ENT-2026-002',
      registration_no: 'GOI/GJ/2025/3810',
      firm_name: 'Sunrise Foods & FMCG Ltd',
      entity_type: 'Manufacturer',
      establishment_address: 'Plot 42, GIDC Phase II, Naroda Industrial Estate, Ahmedabad, Gujarat',
      district: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '382330',
      registered_commodities: ['Savouries & Namkeen', 'Dairy Ghee & Butter', 'Edible Vegetable Oils', 'Packaged Spices'],
      license_status: 'ACTIVE',
      registration_date: '2019-11-15',
      valid_upto: '2027-11-14',
      contact_email: 'legal@sunrisegroup.com',
      contact_phone: '+91 79 2281 9000',
      compliance_rating: 74,
      total_inspections: 14,
      violations_count: 6,
      repeat_offender: true
    },
    {
      entity_id: 'ENT-2026-003',
      registration_no: 'GOI/MH/2024/5192',
      firm_name: 'Himalayan Dry Fruits & Agro Products Pvt Ltd',
      entity_type: 'Packer',
      establishment_address: 'Sector 19A, APMC Market Yard, Vashi, Navi Mumbai, Maharashtra',
      district: 'Thane',
      state: 'Maharashtra',
      pincode: '400703',
      registered_commodities: ['Dry Fruits & Nuts', 'Organic Seeds', 'Roasted Snacks', 'Imported Berries'],
      license_status: 'ACTIVE',
      registration_date: '2022-02-18',
      valid_upto: '2029-02-17',
      contact_email: 'compliance@himalayanfruits.in',
      contact_phone: '+91 22 2789 4500',
      compliance_rating: 98,
      total_inspections: 9,
      violations_count: 0,
      repeat_offender: false
    },
    {
      entity_id: 'ENT-2026-004',
      registration_no: 'GOI/KA/2025/1102',
      firm_name: 'Britannia Industries Limited',
      entity_type: 'Manufacturer & Packer',
      establishment_address: '5/1A Hungerford Street, Bidadi Industrial Area, Ramanagara, Karnataka',
      district: 'Ramanagara',
      state: 'Karnataka',
      pincode: '562109',
      registered_commodities: ['Biscuits & Cookies', 'Bread & Bakery Products', 'Dairy Products', 'Cakes & Rusk'],
      license_status: 'ACTIVE',
      registration_date: '2018-06-01',
      valid_upto: '2028-05-31',
      contact_email: 'regulatory@britindia.com',
      contact_phone: '+91 80 3768 7000',
      compliance_rating: 94,
      total_inspections: 22,
      violations_count: 2,
      repeat_offender: false
    },
    {
      entity_id: 'ENT-2026-005',
      registration_no: 'GOI/DL/2026/8904',
      firm_name: 'Apex Global Imports & Trade Corp',
      entity_type: 'Importer',
      establishment_address: 'Unit 304, Okhla Industrial Area Phase III, New Delhi',
      district: 'South Delhi',
      state: 'Delhi',
      pincode: '110020',
      registered_commodities: ['Packaged Confectionery', 'Beverages & Soft Drinks', 'Cosmetics & Toiletries'],
      license_status: 'UNDER_REVIEW',
      registration_date: '2023-08-12',
      valid_upto: '2026-10-30',
      contact_email: 'customs@apexglobal.in',
      contact_phone: '+91 11 4161 8800',
      compliance_rating: 68,
      total_inspections: 6,
      violations_count: 4,
      repeat_offender: true
    }
  ],
  rules: [
    {
      rule_id: 'RULE-PCR-6-1-A',
      rule_code: 'Rule 6(1)(a)',
      rule_name: 'Name and Address of Manufacturer/Packer/Importer',
      act_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      section_or_rule: 'Rule 6(1)(a)',
      amendment_version: '2021 Amendment (G.S.R. 779(E))',
      effective_date: '2022-01-01',
      commodity_category: 'All Packaged Commodities',
      requirement_description: 'Name and complete address of manufacturer, packer, or importer with city, state and PIN code must be clearly stated on Principal Display Panel.',
      mandatory: true,
      applicable_conditions: ['Must include pincode', 'Importer must declare country of manufacture'],
      penalty_clause: 'Section 36(1) of Act - Fine up to Rs. 25,000 for 1st offence; Rs. 50,000 for 2nd offence',
      status: 'ACTIVE'
    },
    {
      rule_id: 'RULE-PCR-6-1-B',
      rule_code: 'Rule 6(1)(b)',
      rule_name: 'Generic / Common Name of Commodity',
      act_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      section_or_rule: 'Rule 6(1)(b)',
      amendment_version: 'Principal Rules 2011',
      effective_date: '2011-04-01',
      commodity_category: 'All Packaged Commodities',
      requirement_description: 'Common or generic name of commodity contained in the package must be prominently displayed.',
      mandatory: true,
      penalty_clause: 'Section 36(1) of Act - Fine up to Rs. 25,000',
      status: 'ACTIVE'
    },
    {
      rule_id: 'RULE-PCR-6-1-C',
      rule_code: 'Rule 6(1)(c)',
      rule_name: 'Net Quantity in Standard Units of Mass/Measure/Count',
      act_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      section_or_rule: 'Rule 6(1)(c) & Rule 12',
      amendment_version: '2022 Amendment (G.S.R. 571(E))',
      effective_date: '2022-12-01',
      commodity_category: 'All Packaged Commodities',
      requirement_description: 'Net quantity in standard SI units (g, kg, ml, l, m, cm, N, U). Prohibits non-standard abbreviations like "gms", "gm", "ltr", "kilo". Must comply with Maximum Permissible Error (MPE) in Second Schedule.',
      mandatory: true,
      penalty_clause: 'Section 36(1) & Section 11 of Act - Fine up to Rs. 25,000 & Seizure under Section 15',
      status: 'ACTIVE'
    },
    {
      rule_id: 'RULE-PCR-6-1-D',
      rule_code: 'Rule 6(1)(d)',
      rule_name: 'Month and Year of Manufacture / Pre-packing',
      act_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      section_or_rule: 'Rule 6(1)(d)',
      amendment_version: '2021 Amendment (G.S.R. 779(E))',
      effective_date: '2022-01-01',
      commodity_category: 'All Packaged Commodities',
      requirement_description: 'Month and Year in which commodity is manufactured or pre-packed must be clearly stated (e.g., MM/YYYY or Month YYYY).',
      mandatory: true,
      penalty_clause: 'Section 36(1) of Act',
      status: 'ACTIVE'
    },
    {
      rule_id: 'RULE-PCR-6-1-E',
      rule_code: 'Rule 6(1)(e)',
      rule_name: 'MRP Inclusive of All Taxes & Unit Sale Price (USP)',
      act_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      section_or_rule: 'Rule 6(1)(e) & Rule 6(11)',
      amendment_version: '2022 Amendment (G.S.R. 571(E))',
      effective_date: '2022-12-01',
      commodity_category: 'All Packaged Commodities',
      requirement_description: 'MRP in Indian Rupees (Rs. or ₹) with mandatory statutory phrase "Inclusive of all taxes" or "Incl. of all taxes". Unit Sale Price (USP) per gram, kilogram, ml, litre, or piece must be declared for packages containing more than 1 piece/100g/100ml.',
      mandatory: true,
      penalty_clause: 'Section 36(1) - Fine up to Rs. 25,000 / Compounding fee Rs. 25,000',
      status: 'ACTIVE'
    },
    {
      rule_id: 'RULE-PCR-6-1-G',
      rule_code: 'Rule 6(1)(g)',
      rule_name: 'Country of Origin / Manufacture',
      act_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      section_or_rule: 'Rule 6(1)(g)',
      amendment_version: '2020 E-Commerce & Physical Packaging Notification',
      effective_date: '2020-07-23',
      commodity_category: 'Imported & Domestic Packages',
      requirement_description: 'Country of Origin or country of manufacture must be conspicuously stated on the packaging.',
      mandatory: true,
      penalty_clause: 'Section 36(1) & Customs / Seizure referral',
      status: 'ACTIVE'
    },
    {
      rule_id: 'RULE-PCR-6-2',
      rule_code: 'Rule 6(2)',
      rule_name: 'Consumer Care / Grievance Redressal Mechanism',
      act_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      section_or_rule: 'Rule 6(2)',
      amendment_version: 'Principal Rules 2011',
      effective_date: '2011-04-01',
      commodity_category: 'All Packaged Commodities',
      requirement_description: 'Name, address, telephone number, and email address of person/officer who can be contacted in case of consumer complaints.',
      mandatory: true,
      penalty_clause: 'Section 36(1) of Act - Fine up to Rs. 25,000',
      status: 'ACTIVE'
    },
    {
      rule_id: 'RULE-PCR-7-1',
      rule_code: 'Rule 7 & 9',
      rule_name: 'Principal Display Panel (PDP) Size & Minimum Font Height',
      act_reference: 'Legal Metrology (Packaged Commodities) Rules, 2011',
      section_or_rule: 'Rule 7 & Table under Rule 9',
      amendment_version: 'Principal Rules 2011',
      effective_date: '2011-04-01',
      commodity_category: 'All Packaged Commodities',
      requirement_description: 'Font height of numeral declarations must satisfy statutory minimums (e.g. Net Qty <= 50g: min 1mm; 50-200g: min 2mm; 200g-1kg: min 4mm; > 1kg: min 6mm).',
      mandatory: true,
      penalty_clause: 'Section 36(1) of Act',
      status: 'ACTIVE'
    }
  ],
  sessions: [
    {
      session_id: 'IN-20260908-1024',
      inspector_id: 'INSP-TS-108',
      inspector_name: 'Inspector V. Ramesh',
      jurisdiction_district: 'Medchal-Malkajgiri',
      jurisdiction_state: 'Telangana',
      inspection_type: 'Surprise inspection',
      gps_location: {
        latitude: 17.4435,
        longitude: 78.5521,
        accuracy_meters: 4.2,
        address_resolved: 'Nacharam Industrial Area, Hyderabad, Telangana 500076'
      },
      entity_id: 'ENT-2026-001',
      entity_name: 'Hyderabad Tulaman Private Limited',
      entity_reg_no: 'GOI/TS/2026/2779',
      entity_type: 'Manufacturer & Packer',
      premises_address: 'Plot 14, Industrial Development Area, Nacharam, Hyderabad',
      packages_inspected: 4,
      compliant_count: 3,
      review_required_count: 1,
      non_compliant_count: 0,
      violations_detected: 0,
      physical_measurements_recorded: 2,
      seizures_count: 0,
      status: 'COMPLETED',
      officer_observations: 'Standard packaging lines compliant with PCR 2011 (as amended 2022). Batch calibration records verified.',
      action_recommended: 'NONE',
      started_at: new Date('2026-09-08T10:00:00Z'),
      completed_at: new Date('2026-09-08T11:30:00Z')
    },
    {
      session_id: 'IN-20260908-1025',
      inspector_id: 'INSP-GJ-204',
      inspector_name: 'Inspector P. Deshmukh',
      jurisdiction_district: 'Ahmedabad',
      jurisdiction_state: 'Gujarat',
      inspection_type: 'Routine inspection',
      gps_location: {
        latitude: 23.0712,
        longitude: 72.6489,
        accuracy_meters: 6.1,
        address_resolved: 'GIDC Phase II, Naroda, Ahmedabad, Gujarat 382330'
      },
      entity_id: 'ENT-2026-002',
      entity_name: 'Sunrise Foods & FMCG Ltd',
      entity_reg_no: 'GOI/GJ/2025/3810',
      entity_type: 'Manufacturer',
      premises_address: 'Plot 42, GIDC Phase II, Naroda Industrial Estate, Ahmedabad',
      packages_inspected: 5,
      compliant_count: 2,
      review_required_count: 1,
      non_compliant_count: 2,
      violations_detected: 4,
      physical_measurements_recorded: 3,
      seizures_count: 1,
      status: 'SUBMITTED_TO_SUPERVISOR',
      officer_observations: 'Discovered non-standard unit abbreviations "gms" and "ltr" across multiple snack and ghee packaging lines. Physical weighing indicated 22g deficiency on 400g pack exceeding MPE.',
      action_recommended: 'STATUTORY_CHALLAN',
      started_at: new Date('2026-09-08T11:00:00Z'),
      completed_at: new Date('2026-09-08T13:45:00Z')
    }
  ],
  measurements: [
    {
      measurement_id: 'MSR-2026-001',
      session_id: 'IN-20260908-1025',
      sample_no: 'SMPL-01',
      product_name: 'Spicy Potato Sev Bhujia',
      declared_quantity: 400,
      declared_unit: 'g',
      actual_quantity: 378,
      difference: -22,
      permissible_error_limit: 12, // 3% of 400g = 12g under Schedule 2
      instrument_type: 'Electronic Precision Balance (Class II, Verified d=0.1g)',
      instrument_certificate_no: 'LM/GJ/VER/2026/8941',
      result: 'FAIL',
      reason: 'Net deficiency of 22g exceeds Maximum Permissible Error (MPE) limit of 12g under Second Schedule.',
      created_at: new Date('2026-09-08T11:35:00Z')
    },
    {
      measurement_id: 'MSR-2026-002',
      session_id: 'IN-20260908-1024',
      sample_no: 'SMPL-01',
      product_name: 'Premium Roasted Cashews',
      declared_quantity: 500,
      declared_unit: 'g',
      actual_quantity: 504,
      difference: 4,
      permissible_error_limit: 15, // 15g under Schedule 2
      instrument_type: 'Digital Weighing Balance (Class III)',
      instrument_certificate_no: 'LM/TS/VER/2026/3012',
      result: 'PASS',
      reason: 'Quantity within statutory tolerance.',
      created_at: new Date('2026-09-08T10:45:00Z')
    }
  ],
  seizures: [
    {
      seizure_id: 'SEIZ-2026-0012',
      session_id: 'IN-20260908-1025',
      scan_id: 'SCAN-IN-2026-0892',
      entity_name: 'Sunrise Foods & FMCG Ltd',
      entity_reg_no: 'GOI/GJ/2025/3810',
      product_name: 'Spicy Potato Sev Bhujia (400g Non-Compliant Batch)',
      quantity_seized_units: 150,
      unit_of_measure: 'pouches',
      estimated_stock_value: 13500,
      reason_for_seizure: 'Substantial Net Quantity Deficiency exceeding MPE (Rule 12)',
      statutory_act_section: 'Section 15 of Legal Metrology Act, 2009',
      evidence_photos: [],
      custody_location: 'Ahmedabad District Legal Metrology Storehouse',
      custodian_officer: 'Inspector P. Deshmukh',
      witness_details: 'Sub-Inspector Patel, Local Police Station Naroda',
      status: 'SEIZED_IN_CUSTODY',
      created_at: new Date('2026-09-08T13:00:00Z')
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
