import express from 'express';
import pool from '../db/config.js';
import cors from 'cors';

const router = express.Router();

// CORS middleware for this router
router.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Org-Id', 'Accept'],
  exposedHeaders: ['Content-Type', 'Content-Length']
}));

// Handle preflight requests
router.options('*', cors());

// Get all ledgers
router.get('/', async (req, res) => {
  try {
    // Get org_id from header or query parameter
    const orgId = req.headers['x-org-id'] || req.query.org_id;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }
    
    console.log(`Fetching ledgers for org_id: ${orgId}`);
    
    const result = await pool.query(
      `SELECT 
        l.*,
        tg.name as group_name,
        tg.parent_group as parent_group_name
      FROM ledger l
      LEFT JOIN tally_groups tg ON l.group_id = tg.id AND tg.org_id = l.org_id
      WHERE l.org_id = $1 
      ORDER BY l.created_at DESC`,
      [orgId]
    );
    console.log(`Fetched ${result.rows.length} ledgers with group information`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ledgers:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new ledger
router.post('/', async (req, res) => {
  console.log('Received POST request to /api/ledgers:', req.body);
  
  // Get org_id from header or body
  const orgId = req.headers['x-org-id'] || req.body.org_id;
  
  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  const { name, code, category, isActive, financialYear } = req.body;
  
  // Validate required fields
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO ledger (name, code, category, is_active, financial_year, org_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, code, category, isActive, financialYear, orgId]
    );
    console.log('Successfully created ledger:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating ledger:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update a ledger
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Get org_id from header or body
  const orgId = req.headers['x-org-id'] || req.body.org_id;
  
  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  const { name, code, category, isActive, financialYear } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE ledger SET name = $1, code = $2, category = $3, is_active = $4, financial_year = $5 WHERE id = $6 AND org_id = $7 RETURNING *',
      [name, code, category, isActive, financialYear, id, orgId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating ledger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a ledger (soft delete by setting is_active to false)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Get org_id from header or query parameter
  const orgId = req.headers['x-org-id'] || req.query.org_id;
  
  if (!orgId) {
    return res.status(400).json({ error: 'Organization ID is required' });
  }
  
  try {
    const result = await pool.query(
      'UPDATE ledger SET is_active = false WHERE id = $1 AND org_id = $2 RETURNING *',
      [id, orgId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ledger not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error deleting ledger:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 