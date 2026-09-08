import { Router } from 'express';
import { Challan } from '../models/Challan.js';
import { Scan } from '../models/Scan.js';
import { AuditLog } from '../models/AuditLog.js';
import { inMemoryStore, isDbConnected } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// List Challans with optional filtering
router.get('/challans', async (req, res) => {
  try {
    const { manufacturer, status, limit = 100, exclude_settled } = req.query;
    let query = {};
    if (manufacturer) {
      query.manufacturer_name = new RegExp(manufacturer, 'i');
    }
    if (status) {
      query.status = status;
    } else if (exclude_settled === 'true') {
      query.status = { $ne: 'PAID' };
    }

    if (isDbConnected()) {
      const challans = await Challan.find(query).sort({ issued_at: -1 }).limit(parseInt(limit)).lean();
      return res.json({ challans, count: challans.length });
    }

    let records = inMemoryStore.challans || [];
    if (manufacturer) {
      records = records.filter(c => c.manufacturer_name.toLowerCase().includes(manufacturer.toLowerCase()));
    }
    if (status) {
      records = records.filter(c => c.status === status);
    } else if (exclude_settled === 'true') {
      records = records.filter(c => c.status !== 'PAID');
    }
    return res.json({ challans: records, count: records.length });
  } catch (err) {
    console.error('[Challans List Error]', err);
    return res.status(500).json({ message: 'Failed to retrieve challans' });
  }
});

// Issue a New Legal Challan (Superior Officer)
router.post('/challans/issue', async (req, res) => {
  try {
    const {
      scan_id,
      manufacturer_name,
      product_name,
      issued_by = 'Dr. R. K. Verma, Controller of Legal Metrology',
      inspector_name = 'Field Inspector',
      violation_codes = [],
      act_sections = ['Section 36(1) of Legal Metrology Act, 2009'],
      penalty_amount = 25000,
      due_days = 15,
      hearing_days = 21,
      notes = ''
    } = req.body;

    if (!manufacturer_name || !product_name) {
      return res.status(400).json({ message: 'manufacturer_name and product_name are mandatory' });
    }

    const challan_id = `CHL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dueDate = new Date(now.getTime() + due_days * 24 * 60 * 60 * 1000);
    const hearingDate = new Date(now.getTime() + hearing_days * 24 * 60 * 60 * 1000);

    const challanDoc = {
      challan_id,
      scan_id: scan_id || null,
      manufacturer_name,
      product_name,
      issued_by,
      issued_by_role: 'SUPERIOR',
      inspector_name,
      violation_codes: Array.isArray(violation_codes) ? violation_codes : [violation_codes],
      act_sections: Array.isArray(act_sections) ? act_sections : [act_sections],
      penalty_amount: Number(penalty_amount) || 25000,
      status: 'ISSUED',
      due_date: dueDate,
      hearing_date: hearingDate,
      issued_at: now,
      manufacturer_response: null,
      notes
    };

    if (isDbConnected()) {
      await Challan.create(challanDoc);
    } else {
      inMemoryStore.challans.unshift(challanDoc);
    }

    // Log legal audit trail
    const auditDoc = {
      timestamp: now,
      user_name: issued_by,
      user_role: 'SUPERIOR',
      action: 'ISSUE_CHALLAN',
      resource: challan_id,
      details: `Statutory Compounding Challan of ₹${penalty_amount} issued against ${manufacturer_name} for commodity ${product_name}`,
      status: 'SUCCESS',
      ip_address: req.ip || '127.0.0.1'
    };

    if (isDbConnected()) {
      try { await AuditLog.create(auditDoc); } catch (e) {}
    } else {
      inMemoryStore.auditLogs.unshift(auditDoc);
    }

    return res.status(201).json({
      success: true,
      message: 'Statutory challan successfully issued and recorded in legal registry.',
      challan: challanDoc
    });
  } catch (err) {
    console.error('[Challan Issue Error]', err);
    return res.status(500).json({ message: `Failed to issue challan: ${err.message}` });
  }
});

// Update Challan Status (Manufacturer acknowledges, submits proof, or pays)
router.put('/challans/:id/status', async (req, res) => {
  try {
    const challanId = req.params.id;
    const { 
      status, 
      response_text, 
      proof_url, 
      payment_mode = 'Treasury Net Banking',
      transaction_id,
      user_name = 'Manufacturer' 
    } = req.body;

    let updated = null;
    const txnId = transaction_id || `TXN-LM-${Math.floor(100000 + Math.random() * 900000)}`;

    const updateData = { status };
    if (response_text) updateData.manufacturer_response = response_text;
    if (proof_url) updateData.rectification_proof_url = proof_url;
    if (status === 'PAID') {
      updateData.payment_mode = payment_mode;
      updateData.transaction_id = txnId;
      updateData.paid_at = new Date();
    }

    if (isDbConnected()) {
      updated = await Challan.findOneAndUpdate(
        { challan_id: challanId },
        { $set: updateData },
        { new: true }
      );
    } else {
      const idx = inMemoryStore.challans.findIndex(c => c.challan_id === challanId);
      if (idx !== -1) {
        Object.assign(inMemoryStore.challans[idx], updateData);
        updated = inMemoryStore.challans[idx];
      }
    }

    if (!updated) {
      return res.status(404).json({ message: 'Challan record not found' });
    }

    // If paid, synchronize scan record to SETTLED so it is removed from active non-compliant reports
    if (status === 'PAID' && updated.scan_id) {
      if (isDbConnected()) {
        try {
          await Scan.findOneAndUpdate(
            { scan_id: updated.scan_id },
            { $set: { status: 'SETTLED', is_settled: true, settled_at: new Date(), settlement_challan_id: challanId } }
          );
        } catch (scanErr) {
          console.warn('[Scan settlement sync warning]', scanErr);
        }
      } else {
        const scanIdx = inMemoryStore.scans.findIndex(s => s.scan_id === updated.scan_id);
        if (scanIdx !== -1) {
          inMemoryStore.scans[scanIdx].status = 'SETTLED';
          inMemoryStore.scans[scanIdx].is_settled = true;
          inMemoryStore.scans[scanIdx].settled_at = new Date();
          inMemoryStore.scans[scanIdx].settlement_challan_id = challanId;
        }
      }
    }

    // Record audit event
    const auditDoc = {
      timestamp: new Date(),
      user_name,
      user_role: 'MANUFACTURER',
      action: status === 'PAID' ? 'FINE_PAID_SETTLED' : 'CHALLAN_STATUS_UPDATE',
      resource: challanId,
      details: status === 'PAID' 
        ? `Fine of ₹${updated.penalty_amount || 'N/A'} paid via ${payment_mode} (Ref: ${txnId}). Non-compliance case settled.`
        : `Challan status changed to ${status}. Response: "${response_text || 'No remarks'}"`,
      status: 'SUCCESS',
      ip_address: req.ip || '127.0.0.1'
    };

    if (isDbConnected()) {
      try { await AuditLog.create(auditDoc); } catch (e) {}
    } else {
      inMemoryStore.auditLogs.unshift(auditDoc);
    }

    return res.json({ 
      success: true, 
      challan: updated,
      transaction_id: txnId,
      message: status === 'PAID' ? 'Compounding penalty successfully paid and case settled.' : 'Challan updated'
    });
  } catch (err) {
    return res.status(500).json({ message: `Failed to update challan: ${err.message}` });
  }
});

// Single Challan Details
router.get('/challans/:id', async (req, res) => {
  try {
    const challanId = req.params.id;
    let challan = null;
    if (isDbConnected()) {
      challan = await Challan.findOne({ challan_id: challanId }).lean();
    } else {
      challan = inMemoryStore.challans.find(c => c.challan_id === challanId);
    }

    if (!challan) {
      return res.status(404).json({ message: 'Challan not found' });
    }
    return res.json({ challan });
  } catch (err) {
    return res.status(500).json({ message: 'Error retrieving challan' });
  }
});

export default router;
