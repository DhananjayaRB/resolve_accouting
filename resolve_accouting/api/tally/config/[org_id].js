import pool from '../../../server/db/config.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { org_id } = req.query;
    
    if (!org_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization ID is required' 
      });
    }

    const result = await pool.query(
      `SELECT * FROM organization_tally_config WHERE org_id = $1 ORDER BY created_at DESC`,
      [org_id]
    );
    
    return res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching Tally configs:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Tally configs', 
      error: error.message 
    });
  }
}

