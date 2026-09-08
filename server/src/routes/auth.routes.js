import { Router } from 'express';
import bcrypt from 'bcryptjs';
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
    organization: 'Legal Metrology Department',
    jurisdiction: 'District Enforcement Unit',
    password: 'inspector123'
  },
  {
    id: '2',
    email: 'dlmo@lm.gov.in',
    name: 'Dr. R. K. Verma',
    role: 'DLMO',
    department: 'Office of District Legal Metrology Officer',
    organization: 'District Legal Metrology Directorate',
    jurisdiction: 'District Headquarters',
    password: 'dlmo123'
  },
  {
    id: '2_compat',
    email: 'superior@lm.gov.in',
    name: 'Dr. R. K. Verma',
    role: 'DLMO',
    department: 'Office of District Legal Metrology Officer',
    organization: 'District Legal Metrology Directorate',
    jurisdiction: 'District Headquarters',
    password: 'superior123'
  },
  {
    id: '3',
    email: 'manufacturer@brand.com',
    name: 'Sunrise Foods & FMCG Ltd',
    role: 'MANUFACTURER',
    department: 'Corporate Regulatory & Packaging Division',
    organization: 'Sunrise Foods & FMCG Ltd',
    jurisdiction: 'GIDC Gujarat & Pan-India Distribution',
    password: 'brand123'
  },
  {
    id: '4',
    email: 'admin@lm.gov.in',
    name: 'System Administrator',
    role: 'DLMO', // Aligned to DLMO as highest supervisory role per SRS
    department: 'National IT & Standards Directorate',
    organization: 'Legal Metrology Department',
    jurisdiction: 'National',
    password: 'admin123'
  }
];

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let foundUser = null;
    let isDbUser = false;

    if (isDbConnected()) {
      foundUser = await User.findOne({ email: email.toLowerCase() });
      if (foundUser) isDbUser = true;
    }

    if (!foundUser) {
      foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    }

    if (!foundUser) {
      return res.status(401).json({ message: 'Invalid credentials or unauthorized account' });
    }

    // Password validation
    let isPasswordValid = false;
    if (isDbUser && foundUser.password) {
      // Check if hashed or plain
      if (foundUser.password.startsWith('$2a$') || foundUser.password.startsWith('$2b$')) {
        isPasswordValid = await bcrypt.compare(password, foundUser.password);
      } else {
        isPasswordValid = foundUser.password === password;
      }
    } else if (foundUser.password) {
      isPasswordValid = foundUser.password === password;
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const effectiveRole = foundUser.role === 'SUPERIOR' ? 'DLMO' : foundUser.role;

    const userData = {
      id: foundUser._id ? foundUser._id.toString() : foundUser.id || '1',
      email: foundUser.email,
      name: foundUser.name,
      role: effectiveRole,
      department: foundUser.department,
      organization: foundUser.organization || (effectiveRole === 'MANUFACTURER' ? foundUser.name : 'Legal Metrology Department'),
      jurisdiction: foundUser.jurisdiction
    };

    // Log login audit
    const auditEntry = {
      timestamp: new Date(),
      user_name: userData.name,
      user_role: userData.role,
      action: 'LOGIN',
      resource: 'AUTH_SESSION',
      details: `${userData.role} [${userData.name}] authenticated successfully`,
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
      details: `${user.role} [${user.name}] session terminated cleanly`,
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
