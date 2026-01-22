import pool from '../server/db/config.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Org-Id');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method } = req;
    const { id } = req.query;
    
    // Get org_id from header or body
    const orgId = req.headers['x-org-id'] || req.body?.org_id || req.query?.org_id;
    
    if (!orgId) {
      return res.status(400).json({ message: 'Organization ID is required' });
    }

    switch (method) {
      case 'GET':
        // Get all payroll mappings filtered by org_id
        const result = await pool.query('SELECT * FROM payrun_ledger_mappings WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
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
        
        // Check if mapping already exists for this org
        const existingMapping = await pool.query(
          'SELECT * FROM payrun_ledger_mappings WHERE payroll_item_id = $1 AND ledger_head_id = $2 AND financial_year = $3 AND org_id = $4',
          [payroll_item_id, ledger_head_id, financial_year, orgId]
        );

        if (existingMapping.rows.length > 0) {
          return res.status(409).json({
            message: 'Mapping already exists for this financial year',
            existingMapping: existingMapping.rows[0]
          });
        }

        // Create new mapping with org_id
        const insertResult = await pool.query(
          'INSERT INTO payrun_ledger_mappings (payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year, org_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *',
          [payroll_item_id, payroll_item_name, ledger_head_id, ledger_head_name, financial_year, orgId]
        );
        
        return res.status(201).json(insertResult.rows[0]);

      case 'PUT':
        // Update a payroll mapping
        if (!id) {
          return res.status(400).json({ message: 'Mapping ID is required' });
        }
        
        const { payroll_item_id: updatePayrollItemId, payroll_item_name: updatePayrollItemName, ledger_head_id: updateLedgerHeadId, ledger_head_name: updateLedgerHeadName } = req.body;
        
        const updateResult = await pool.query(
          'UPDATE payrun_ledger_mappings SET payroll_item_id = $1, payroll_item_name = $2, ledger_head_id = $3, ledger_head_name = $4, updated_at = NOW() WHERE id = $5 AND org_id = $6 RETURNING *',
          [updatePayrollItemId, updatePayrollItemName, updateLedgerHeadId, updateLedgerHeadName, id, orgId]
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
        
        const deleteResult = await pool.query('DELETE FROM payrun_ledger_mappings WHERE id = $1 AND org_id = $2 RETURNING *', [id, orgId]);
        
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

