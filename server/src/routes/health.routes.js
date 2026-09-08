import { Router } from 'express';
import { isDbConnected } from '../db.js';

const router = Router();

const sendHealth = (req, res) => {
  return res.json({
    status: 'ONLINE',
    service: 'SIH26034 - Legal Metrology (LMPC) MERN Compliance Engine',
    version: '2.0.0',
    database: isDbConnected() ? 'CONNECTED' : 'IN_MEMORY_FALLBACK',
    gemini_active: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
};

router.get('/health', sendHealth);
router.get('/', sendHealth);

export default router;
