import express from 'express';
import pool from '../db/config.js';

const router = express.Router();

// Get all ledgers
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM ledger ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching ledgers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new ledger
router.post('/', async (req, res) => {
  console.log('Received POST request to /api/ledgers:', req.body);
  
  const { name, code, category, isActive, financialYear } = req.body;
  
  // Validate required fields
  if (!name || !category) {
    return res.status(400).json({ error: 'Name and category are required' });
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO ledger (name, code, category, is_active, financial_year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, code, category, isActive, financialYear]
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
  const { name, code, category, isActive, financialYear } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE ledger SET name = $1, code = $2, category = $3, is_active = $4, financial_year = $5 WHERE id = $6 RETURNING *',
      [name, code, category, isActive, financialYear, id]
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
  
  try {
    const result = await pool.query(
      'UPDATE ledger SET is_active = false WHERE id = $1 RETURNING *',
      [id]
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