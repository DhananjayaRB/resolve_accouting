import express from 'express';
import pool from '../db/config.js'; // Use the shared pool
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

// Debug middleware for this route
router.use((req, res, next) => {
  console.log(`Payroll mappings route accessed: ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

// Get all payroll mappings (filtered by org_id if provided)
router.get('/', async (req, res) => {
  console.log('Fetching payroll mappings');
  try {
    // Get org_id from header or query parameter
    const orgId = req.headers['x-org-id'] || req.query.org_id;
    
    let result;
    if (orgId) {
      console.log(`Fetching payroll mappings for org_id: ${orgId}`);
      // Filter by org_id if provided
      result = await pool.query(
        'SELECT * FROM payrun_ledger_mappings WHERE org_id = $1 ORDER BY created_at DESC',
        [orgId]
      );
    } else {
      console.log('Fetching all payroll mappings (no org_id filter)');
      // If no org_id, return all (for backward compatibility)
      result = await pool.query('SELECT * FROM payrun_ledger_mappings ORDER BY created_at DESC');
    }
    
    console.log(`Found ${result.rows.length} mappings`);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payroll mappings:', error);
    res.status(500).json({ 
      message: 'Error fetching payroll mappings',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new payroll mapping
router.post('/', async (req, res) => {
  console.log('Received request body:', req.body);
  // Get org_id from header, body, or query parameter
  const orgId = req.headers['x-org-id'] || req.body.org_id || req.query.org_id;
  
  if (!orgId) {
    return res.status(400).json({ 
      message: 'Organization ID is required',
      error: 'org_id must be provided in header (X-Org-Id), body, or query parameter'
    });
  }
  
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
    // First check if the mapping already exists for this financial year and org_id
    const existingMapping = await pool.query(
      'SELECT * FROM payrun_ledger_mappings WHERE payroll_item_id = $1 AND ledger_head_id = $2 AND financial_year = $3 AND org_id = $4',
      [payroll_item_id, ledger_head_id, financial_year, orgId]
    );

    if (existingMapping.rows.length > 0) {
      console.log('Mapping already exists:', existingMapping.rows[0]);
      return res.status(409).json({
        message: 'Mapping already exists for this financial year',
        existingMapping: existingMapping.rows[0]
      });
    }

    // Create new mapping with org_id
    const result = await pool.query(
      'INSERT INTO payrun_ledger_mappings (payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year, org_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *',
      [payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year, orgId]
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
  
  // Get org_id from header, body, or query parameter
  const orgId = req.headers['x-org-id'] || req.body.org_id || req.query.org_id;
  
  if (!orgId) {
    return res.status(400).json({ 
      message: 'Organization ID is required',
      error: 'org_id must be provided in header (X-Org-Id), body, or query parameter'
    });
  }
  
  const { payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year } = req.body;
  
  try {
    // Update mapping and filter by org_id to ensure user can only update their own mappings
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    
    if (payroll_item_id !== undefined) {
      updateFields.push(`payroll_item_id = $${paramIndex++}`);
      updateValues.push(payroll_item_id);
    }
    if (payroll_item_name !== undefined) {
      updateFields.push(`payroll_item_name = $${paramIndex++}`);
      updateValues.push(payroll_item_name);
    }
    if (ledger_head_id !== undefined) {
      updateFields.push(`ledger_head_id = $${paramIndex++}`);
      updateValues.push(ledger_head_id);
    }
    if (ledger_head_name !== undefined) {
      updateFields.push(`ledger_head_name = $${paramIndex++}`);
      updateValues.push(ledger_head_name);
    }
    if (financial_year !== undefined) {
      updateFields.push(`financial_year = $${paramIndex++}`);
      updateValues.push(financial_year);
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    updateFields.push(`updated_at = NOW()`);
    updateValues.push(id, orgId);
    
    const query = `UPDATE payrun_ledger_mappings SET ${updateFields.join(', ')} WHERE id = $${paramIndex++} AND org_id = $${paramIndex} RETURNING *`;
    
    const result = await pool.query(query, updateValues);
    
    if (result.rows.length === 0) {
      console.log(`Mapping ${id} not found for org_id ${orgId}`);
      return res.status(404).json({ message: 'Payroll mapping not found or not authorized' });
    }
    
    console.log('Updated mapping:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating payroll mapping:', error);
    res.status(500).json({ 
      message: 'Error updating payroll mapping',
      error: error.message
    });
  }
});

// Delete a payroll mapping
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`Deleting payroll mapping ${id}`);
  
  // Get org_id from header or query parameter
  const orgId = req.headers['x-org-id'] || req.query.org_id;
  
  if (!orgId) {
    return res.status(400).json({ 
      message: 'Organization ID is required',
      error: 'org_id must be provided in header (X-Org-Id) or query parameter'
    });
  }
  
  try {
    // Delete mapping and filter by org_id to ensure user can only delete their own mappings
    const result = await pool.query(
      'DELETE FROM payrun_ledger_mappings WHERE id = $1 AND org_id = $2 RETURNING *', 
      [id, orgId]
    );
    
    if (result.rows.length === 0) {
      console.log(`Mapping ${id} not found for org_id ${orgId}`);
      return res.status(404).json({ message: 'Payroll mapping not found or not authorized' });
    }
    
    console.log('Deleted mapping:', result.rows[0]);
    res.json({ message: 'Payroll mapping deleted successfully' });
  } catch (error) {
    console.error('Error deleting payroll mapping:', error);
    res.status(500).json({ 
      message: 'Error deleting payroll mapping',
      error: error.message
    });
  }
});

export default router; 