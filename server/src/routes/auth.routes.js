import { Router } from 'express';
import { User } from '../models/User.js';
import { AuditLog } from '../models/AuditLog.js';
import { inMemoryStore, isDbConnected } from '../db.js';

const router = Router();

const MOCK_USERS = [
  {
    id: '1',
    email: 'inspector@lm.gov.in',
    name: 'Field Inspector Sharma',
    role: 'INSPECTOR',
    department: 'Metrology Central Enforcement Wing',
    jurisdiction: 'Maharashtra & Western Zone',
    password: 'inspector123'
  },
  {
    id: '2',
    email: 'superior@lm.gov.in',
    name: 'Dr. R. K. Verma (Controller)',
    role: 'SUPERIOR',
    department: 'Directorate of Legal Metrology HQ',
    jurisdiction: 'National Headquarters (New Delhi)',
    password: 'superior123'
  },
  {
    id: '3',
    email: 'manufacturer@brand.com',
    name: 'Sunrise Foods & FMCG Ltd (Compliance Desk)',
    role: 'MANUFACTURER',
    department: 'Corporate Regulatory & Packaging Division',
    jurisdiction: 'GIDC Gujarat & Pan-India Distribution',
    password: 'brand123'
  },
  {
    id: '4',
    email: 'admin@lm.gov.in',
    name: 'System Superadmin',
    role: 'ADMIN',
    department: 'National IT & Standards Directorate',
    jurisdiction: 'National',
    password: 'admin123'
  }
];

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    let foundUser = null;

    if (isDbConnected()) {
      foundUser = await User.findOne({ email });
    }

    if (!foundUser) {
      foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    }

    if (!foundUser) {
      return res.status(401).json({ message: 'Invalid credentials or unauthorized account' });
    }

    const userData = {
      id: foundUser._id ? foundUser._id.toString() : foundUser.id || '1',
      email: foundUser.email,
      name: foundUser.name,
      role: foundUser.role,
      department: foundUser.department,
      jurisdiction: foundUser.jurisdiction
    };

    // Log login audit
    const auditEntry = {
      timestamp: new Date(),
      user_name: userData.name,
      user_role: userData.role,
      action: 'LOGIN',
      resource: 'AUTH_SESSION',
      details: `${userData.role} [${userData.name}] authenticated successfully from IP ${req.ip || '127.0.0.1'}`,
      status: 'SUCCESS',
      ip_address: req.ip || '127.0.0.1'
    };

    if (isDbConnected()) {
      try { await AuditLog.create(auditEntry); } catch (e) {}
    } else {
      inMemoryStore.auditLogs.unshift(auditEntry);
    }

    return res.json({
      success: true,
      user: userData,
      token: `lm_jwt_${Buffer.from(userData.email).toString('base64')}_${Date.now()}`
    });
  } catch (err) {
    console.error('[Auth Error]', err);
    return res.status(500).json({ message: 'Authentication server error' });
  }
});

// Logout endpoint with session audit
router.post('/logout', async (req, res) => {
  try {
    const user = req.body.user || { name: 'Officer', role: 'INSPECTOR' };

    const auditEntry = {
      timestamp: new Date(),
      user_name: user.name || 'Officer',
      user_role: user.role || 'INSPECTOR',
      action: 'LOGOUT',
      resource: 'AUTH_SESSION',
      details: `${user.role} [${user.name}] session terminated cleanly from IP ${req.ip || '127.0.0.1'}`,
      status: 'SUCCESS',
      ip_address: req.ip || '127.0.0.1'
    };

    if (isDbConnected()) {
      try { await AuditLog.create(auditEntry); } catch (e) {}
    } else {
      inMemoryStore.auditLogs.unshift(auditEntry);
    }

    return res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    return res.json({ success: true, message: 'Logged out' });
  }
});

export default router;
