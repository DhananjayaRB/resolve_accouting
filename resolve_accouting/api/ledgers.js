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
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    switch (method) {
      case 'GET':
        // Get all ledgers or single ledger filtered by org_id
        if (id) {
          const singleResult = await pool.query('SELECT * FROM ledger WHERE id = $1 AND org_id = $2', [id, orgId]);
          if (singleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ledger not found' });
          }
          return res.json(singleResult.rows[0]);
        }
        const result = await pool.query('SELECT * FROM ledger WHERE org_id = $1 ORDER BY created_at DESC', [orgId]);
        return res.json(result.rows);

      case 'POST':
        // Create a new ledger
        const { name, code, category, isActive, financialYear } = req.body;
        
        if (!name || !category) {
          return res.status(400).json({ error: 'Name and category are required' });
        }
        
        const insertResult = await pool.query(
          'INSERT INTO ledger (name, code, category, is_active, financial_year, org_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [name, code, category, isActive, financialYear, orgId]
        );
        return res.status(201).json(insertResult.rows[0]);

      case 'PUT':
        // Update a ledger
        if (!id) {
          return res.status(400).json({ error: 'Ledger ID is required' });
        }
        
        const { name: updateName, code: updateCode, category: updateCategory, isActive: updateIsActive, financialYear: updateFinancialYear } = req.body;
        const updateResult = await pool.query(
          'UPDATE ledger SET name = $1, code = $2, category = $3, is_active = $4, financial_year = $5 WHERE id = $6 AND org_id = $7 RETURNING *',
          [updateName, updateCode, updateCategory, updateIsActive, updateFinancialYear, id, orgId]
        );
        
        if (updateResult.rows.length === 0) {
          return res.status(404).json({ error: 'Ledger not found' });
        }
        
        return res.json(updateResult.rows[0]);

      case 'DELETE':
        // Soft delete a ledger
        if (!id) {
          return res.status(400).json({ error: 'Ledger ID is required' });
        }
        
        const deleteResult = await pool.query(
          'UPDATE ledger SET is_active = false WHERE id = $1 AND org_id = $2 RETURNING *',
          [id, orgId]
        );
        
        if (deleteResult.rows.length === 0) {
          return res.status(404).json({ error: 'Ledger not found' });
        }
        
        return res.json(deleteResult.rows[0]);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Error in ledgers API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

