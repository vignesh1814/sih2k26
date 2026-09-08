import { Router } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { inMemoryStore, isDbConnected } from '../db.js';

const router = Router();

// List statutory audit trail
router.get('/audit-trail', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    if (isDbConnected()) {
      const logs = await AuditLog.find({}).sort({ timestamp: -1 }).limit(limit).lean();
      return res.json({ logs, count: logs.length });
    }
    const logs = inMemoryStore.auditLogs.slice(0, limit);
    return res.json({ logs, count: logs.length });
  } catch (err) {
    console.error('[Audit trail error]', err);
    return res.json({ logs: inMemoryStore.auditLogs, count: inMemoryStore.auditLogs.length });
  }
});

// Create manual audit entry
router.post('/audit-trail', async (req, res) => {
  try {
    const { user_name, user_role, action, resource, details, status } = req.body;
    const entry = {
      timestamp: new Date(),
      user_name: user_name || 'Inspector System',
      user_role: user_role || 'INSPECTOR',
      action: action || 'MANUAL_AUDIT',
      resource: resource || 'GENERAL',
      details: details || 'Officer executed audit review',
      status: status || 'SUCCESS',
      ip_address: req.ip || '127.0.0.1'
    };

    if (isDbConnected()) {
      await AuditLog.create(entry);
    } else {
      inMemoryStore.auditLogs.unshift(entry);
    }

    return res.json({ success: true, entry });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to record audit log' });
  }
});

export default router;
