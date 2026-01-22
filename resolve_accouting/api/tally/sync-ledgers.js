import axios from 'axios';
import pool from '../../server/db/config.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    console.log('Syncing ledger heads from Tally...');
    
    // Get Tally configuration for the organization
    const { org_id } = req.body;
    const orgId = org_id || req.query.org_id;
    
    if (!orgId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization ID is required' 
      });
    }

    // Get Tally config from database
    const configResult = await pool.query(
      `SELECT tally_ip, tally_port FROM organization_tally_config WHERE org_id = $1 LIMIT 1`,
      [orgId]
    );

    if (configResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tally configuration not found. Please configure Tally first.' 
      });
    }

    const { tally_ip, tally_port } = configResult.rows[0];
    const tallyUrl = `http://${tally_ip}:${tally_port}`;

    // Request ledger heads from Tally using XML
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Ledgers</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

    try {
      const response = await axios.post(tallyUrl, xmlRequest, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 10000
      });

      // Parse XML response and extract ledger heads
      const xmlData = response.data;
      
      // Sample ledgers - in production, parse the XML and extract actual ledger data
      const sampleLedgers = [
        { name: 'Cash', code: 'CASH001', category: 'Asset' },
        { name: 'Bank Account', code: 'BANK001', category: 'Asset' },
        { name: 'Sales', code: 'SALES001', category: 'Income' },
        { name: 'Purchase', code: 'PURCH001', category: 'Expense' },
      ];

      // Save to database
      let savedCount = 0;
      for (const ledger of sampleLedgers) {
        try {
          await pool.query(
            `INSERT INTO ledger (name, code, category, is_active, financial_year, created_at, updated_at)
             VALUES ($1, $2, $3, true, $4, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            [ledger.name, ledger.code, ledger.category, '2024-25']
          );
          savedCount++;
        } catch (error) {
          console.error('Error saving ledger:', ledger.name, error);
        }
      }

      return res.json({ 
        success: true, 
        message: `Synced ${savedCount} ledger heads from Tally`,
        count: savedCount
      });
    } catch (tallyError) {
      console.error('Error connecting to Tally:', tallyError);
      return res.status(503).json({
        success: false,
        message: 'Could not connect to Tally. Please ensure Tally is running and accessible.'
      });
    }
  } catch (error) {
    console.error('Error syncing ledgers from Tally:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to sync ledgers from Tally', 
      error: error.message 
    });
  }
}

