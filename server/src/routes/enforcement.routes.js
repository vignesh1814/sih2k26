import express from 'express';
import Seizure from '../models/Seizure.js';
import { inMemoryStore, isDbConnected } from '../db.js';

const router = express.Router();

// POST /api/enforcement/seizure - Record physical stock seizure under Section 15
router.post('/seizure', async (req, res) => {
  try {
    const {
      session_id = 'GENERAL',
      scan_id,
      entity_name,
      entity_reg_no,
      product_name,
      quantity_seized_units,
      unit_of_measure = 'packages',
      estimated_stock_value = 0,
      reason_for_seizure,
      statutory_act_section = 'Section 15 of Legal Metrology Act, 2009',
      custody_location = 'District Legal Metrology Vault / Safe Custody',
      custodian_officer,
      witness_details
    } = req.body;

    const seizure_id = `SEIZ-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const seizureData = {
      seizure_id,
      session_id,
      scan_id: scan_id || null,
      entity_name: entity_name || 'Unregistered Premise / Vendor',
      entity_reg_no: entity_reg_no || null,
      product_name,
      quantity_seized_units: parseInt(quantity_seized_units) || 1,
      unit_of_measure,
      estimated_stock_value: parseFloat(estimated_stock_value) || 0,
      reason_for_seizure,
      statutory_act_section,
      evidence_photos: [],
      custody_location,
      custodian_officer: custodian_officer || 'Legal Metrology Field Inspector',
      witness_details: witness_details || '',
      status: 'SEIZED_IN_CUSTODY',
      created_at: new Date()
    };

    if (isDbConnected()) {
      const doc = new Seizure(seizureData);
      await doc.save();
      return res.status(201).json({ success: true, data: doc });
    }

    inMemoryStore.seizures = inMemoryStore.seizures || [];
    inMemoryStore.seizures.unshift(seizureData);

    // Increment seizure counter in session
    if (session_id) {
      const sess = (inMemoryStore.sessions || []).find(s => s.session_id === session_id);
      if (sess) {
        sess.seizures_count = (sess.seizures_count || 0) + 1;
        sess.action_recommended = 'SEIZURE_OF_GOODS';
      }
    }

    return res.status(201).json({ success: true, data: seizureData });
  } catch (error) {
    console.error('Error creating seizure memo:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/enforcement/seizures - List all seizure memos
router.get('/seizures', async (req, res) => {
  try {
    const { session_id, status } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (session_id) filter.session_id = session_id;
      if (status) filter.status = status;

      const seizures = await Seizure.find(filter).sort({ created_at: -1 });
      return res.json({ success: true, count: seizures.length, data: seizures });
    }

    let results = inMemoryStore.seizures || [];
    if (session_id) results = results.filter(s => s.session_id === session_id);
    if (status) results = results.filter(s => s.status.toLowerCase() === status.toLowerCase());

    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error fetching seizures:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/enforcement/seizures/:seizure_id/status - Update seizure status
router.put('/seizures/:seizure_id/status', async (req, res) => {
  try {
    const { seizure_id } = req.params;
    const { status, notes } = req.body;

    if (isDbConnected()) {
      const updated = await Seizure.findOneAndUpdate(
        { seizure_id },
        { $set: { status, notes, updated_at: new Date() } },
        { new: true }
      );
      if (!updated) return res.status(404).json({ success: false, message: 'Seizure not found' });
      return res.json({ success: true, data: updated });
    }

    const item = (inMemoryStore.seizures || []).find(s => s.seizure_id === seizure_id);
    if (!item) return res.status(404).json({ success: false, message: 'Seizure not found' });

    item.status = status;
    item.notes = notes;
    item.updated_at = new Date();

    return res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error updating seizure status:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
