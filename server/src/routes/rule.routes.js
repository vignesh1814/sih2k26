import express from 'express';
import RuleVersion from '../models/RuleVersion.js';
import { inMemoryStore, isDbConnected } from '../db.js';

const router = express.Router();

// GET /api/rules - List all active/historical rule versions
router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (status) filter.status = status;
      if (category) filter.commodity_category = category;

      const rules = await RuleVersion.find(filter).sort({ section_or_rule: 1 });
      return res.json({ success: true, count: rules.length, data: rules });
    }

    let results = inMemoryStore.rules || [];
    if (status) {
      results = results.filter(r => r.status.toLowerCase() === status.toLowerCase());
    }
    if (category) {
      results = results.filter(r => r.commodity_category.toLowerCase().includes(category.toLowerCase()));
    }

    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error fetching rules:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/rules - Add new rule amendment / version
router.post('/', async (req, res) => {
  try {
    const ruleData = {
      rule_id: `RULE-${Date.now().toString(36).toUpperCase()}`,
      status: 'ACTIVE',
      ...req.body
    };

    if (isDbConnected()) {
      const newRule = new RuleVersion(ruleData);
      await newRule.save();
      return res.status(201).json({ success: true, data: newRule });
    }

    inMemoryStore.rules.push(ruleData);
    return res.status(201).json({ success: true, data: ruleData });
  } catch (error) {
    console.error('Error creating rule version:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
