import express from 'express';
import pool from '../db/config.js'; // Use the shared pool

const router = express.Router();

// Debug middleware for this route
router.use((req, res, next) => {
  console.log(`Payroll mappings route accessed: ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

// Get all payroll mappings
router.get('/', async (req, res) => {
  console.log('Fetching all payroll mappings');
  try {
    const result = await pool.query('SELECT * FROM payrun_ledger_mappings ORDER BY created_at DESC');
    console.log(`Found ${result.rows.length} mappings`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payroll mappings:', error);
    res.status(500).json({ message: 'Error fetching payroll mappings' });
  }
});

// Create a new payroll mapping
router.post('/', async (req, res) => {
  console.log('Received request body:', req.body);
  const { payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year } = req.body;
  
  // Validate required fields
  if (!payroll_item_id || !payroll_item_name || !ledger_head_id || !ledger_head_name || !financial_year) {
    console.error('Missing required fields:', { payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year });
    return res.status(400).json({ 
      message: 'Missing required fields',
      required: ['payroll_item_id', 'payroll_item_name', 'ledger_head_id', 'ledger_head_name', 'financial_year'],
      received: req.body
    });
  }
  
  try {
    // First check if the mapping already exists for this financial year
    const existingMapping = await pool.query(
      'SELECT * FROM payrun_ledger_mappings WHERE payroll_item_id = $1 AND ledger_head_id = $2 AND financial_year = $3',
      [payroll_item_id, ledger_head_id, financial_year]
    );

    if (existingMapping.rows.length > 0) {
      console.log('Mapping already exists:', existingMapping.rows[0]);
      return res.status(409).json({
        message: 'Mapping already exists for this financial year',
        existingMapping: existingMapping.rows[0]
      });
    }

    // Create new mapping
    const result = await pool.query(
      'INSERT INTO payrun_ledger_mappings (payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
      [payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year]
    );
    
    console.log('Created mapping:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating payroll mapping:', error);
    res.status(500).json({ 
      message: 'Error creating payroll mapping',
      error: error.message,
      details: error.detail || null
    });
  }
});

// Update a payroll mapping
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Updating payroll mapping ${id}:`, req.body);
  const { payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name } = req.body;
  
  try {
    const result = await pool.query(
      'UPDATE payrun_ledger_mappings SET payroll_item_id = $1, payroll_item_name = $2, ledger_head_id = $3, ledger_head_name = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
      [payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, id]
    );
    
    if (result.rows.length === 0) {
      console.log(`Mapping ${id} not found`);
      return res.status(404).json({ message: 'Payroll mapping not found' });
    }
    
    console.log('Updated mapping:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payroll mapping:', error);
    res.status(500).json({ message: 'Error updating payroll mapping' });
  }
});

// Delete a payroll mapping
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Deleting payroll mapping ${id}`);
  
  try {
    const result = await pool.query('DELETE FROM payrun_ledger_mappings WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      console.log(`Mapping ${id} not found`);
      return res.status(404).json({ message: 'Payroll mapping not found' });
    }
    
    console.log('Deleted mapping:', result.rows[0]);
    res.json({ message: 'Payroll mapping deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll mapping:', error);
    res.status(500).json({ message: 'Error deleting payroll mapping' });
  }
});

export default router; 