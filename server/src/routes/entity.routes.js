import express from 'express';
import Entity from '../models/Entity.js';
import { inMemoryStore, isDbConnected } from '../db.js';

const router = express.Router();

// GET /api/entities - List all registered entities with search query
router.get('/', async (req, res) => {
  try {
    const { query, district, entity_type } = req.query;

    if (isDbConnected()) {
      const filter = {};
      if (query) {
        filter.$or = [
          { registration_no: { $regex: query, $options: 'i' } },
          { firm_name: { $regex: query, $options: 'i' } },
          { registered_commodities: { $regex: query, $options: 'i' } }
        ];
      }
      if (district) filter.district = district;
      if (entity_type) filter.entity_type = entity_type;

      const entities = await Entity.find(filter).sort({ compliance_rating: -1 });
      return res.json({ success: true, count: entities.length, data: entities });
    }

    // In-Memory store fallback
    let results = inMemoryStore.entities || [];
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(e => 
        e.registration_no.toLowerCase().includes(q) ||
        e.firm_name.toLowerCase().includes(q) ||
        (e.registered_commodities && e.registered_commodities.some(c => c.toLowerCase().includes(q)))
      );
    }
    if (district) {
      results = results.filter(e => e.district.toLowerCase() === district.toLowerCase());
    }
    if (entity_type) {
      results = results.filter(e => e.entity_type.toLowerCase() === entity_type.toLowerCase());
    }

    return res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    console.error('Error fetching entities:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/entities/:reg_no - Get specific entity by Registration No or Entity ID
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;

    if (isDbConnected()) {
      const entity = await Entity.findOne({
        $or: [
          { registration_no: identifier },
          { entity_id: identifier }
        ]
      });
      if (!entity) {
        return res.status(404).json({ success: false, message: 'Registered entity not found' });
      }
      return res.json({ success: true, data: entity });
    }

    const entity = (inMemoryStore.entities || []).find(e => 
      e.registration_no.toLowerCase() === identifier.toLowerCase() ||
      e.entity_id.toLowerCase() === identifier.toLowerCase()
    );

    if (!entity) {
      return res.status(404).json({ success: false, message: 'Registered entity not found' });
    }

    return res.json({ success: true, data: entity });
  } catch (error) {
    console.error('Error fetching entity by identifier:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/entities - Register new premises / manufacturer
router.post('/', async (req, res) => {
  try {
    const entityData = {
      entity_id: `ENT-${Date.now().toString(36).toUpperCase()}`,
      ...req.body
    };

    if (isDbConnected()) {
      const newEntity = new Entity(entityData);
      await newEntity.save();
      return res.status(201).json({ success: true, data: newEntity });
    }

    inMemoryStore.entities.unshift(entityData);
    return res.status(201).json({ success: true, data: entityData });
  } catch (error) {
    console.error('Error creating entity:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
