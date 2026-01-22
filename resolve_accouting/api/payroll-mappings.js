import pool from '../server/db/config.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method } = req;
    const { id } = req.query;

    switch (method) {
      case 'GET':
        // Get all payroll mappings
        const result = await pool.query('SELECT * FROM payrun_ledger_mappings ORDER BY created_at DESC');
        return res.json(result.rows);

      case 'POST':
        // Create a new payroll mapping
        const { payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year } = req.body;
        
        if (!payroll_item_id || !payroll_item_name || !ledger_head_id || !ledger_head_name || !financial_year) {
          return res.status(400).json({ 
            message: 'Missing required fields',
            required: ['payroll_item_id', 'payroll_item_name', 'ledger_head_id', 'ledger_head_name', 'financial_year']
          });
        }
        
        // Check if mapping already exists
        const existingMapping = await pool.query(
          'SELECT * FROM payrun_ledger_mappings WHERE payroll_item_id = $1 AND ledger_head_id = $2 AND financial_year = $3',
          [payroll_item_id, ledger_head_id, financial_year]
        );

        if (existingMapping.rows.length > 0) {
          return res.status(409).json({
            message: 'Mapping already exists for this financial year',
            existingMapping: existingMapping.rows[0]
          });
        }

        // Create new mapping
        const insertResult = await pool.query(
          'INSERT INTO payrun_ledger_mappings (payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *',
          [payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year]
        );
        
        return res.status(201).json(insertResult.rows[0]);

      case 'PUT':
        // Update a payroll mapping
        if (!id) {
          return res.status(400).json({ message: 'Mapping ID is required' });
        }
        
        const { payroll_item_id: updatePayrollItemId, payroll_item_name: updatePayrollItemName, ledger_head_id: updateLedgerHeadId, ledger_head_name: updateLedgerHeadName } = req.body;
        
        const updateResult = await pool.query(
          'UPDATE payrun_ledger_mappings SET payroll_item_id = $1, payroll_item_name = $2, ledger_head_id = $3, ledger_head_name = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
          [updatePayrollItemId, updatePayrollItemName, updateLedgerHeadId, updateLedgerHeadName, id]
        );
        
        if (updateResult.rows.length === 0) {
          return res.status(404).json({ message: 'Payroll mapping not found' });
        }
        
        return res.json(updateResult.rows[0]);

      case 'DELETE':
        // Delete a payroll mapping
        if (!id) {
          return res.status(400).json({ message: 'Mapping ID is required' });
        }
        
        const deleteResult = await pool.query('DELETE FROM payrun_ledger_mappings WHERE id = $1 RETURNING *', [id]);
        
        if (deleteResult.rows.length === 0) {
          return res.status(404).json({ message: 'Payroll mapping not found' });
        }
        
        return res.json({ message: 'Payroll mapping deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Error in payroll-mappings API:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

