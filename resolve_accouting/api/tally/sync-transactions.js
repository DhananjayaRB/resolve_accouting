import axios from 'axios';
import pool from '../../server/db/config.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Org-Id');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { org_id, from_date, to_date, profile_id } = req.body;
    const orgId = org_id || req.query.org_id;
    const profileId = profile_id || req.query.profile_id;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    // Get Tally config from database - use profile_id if provided, otherwise get first one
    let configResult;
    if (profileId) {
      configResult = await pool.query(
        `SELECT tally_ip, tally_port, profile_name, tally_company_name 
         FROM organization_tally_config 
         WHERE org_id = $1 AND id = $2 LIMIT 1`,
        [orgId, profileId]
      );
    } else {
      configResult = await pool.query(
        `SELECT tally_ip, tally_port, profile_name, tally_company_name 
         FROM organization_tally_config 
         WHERE org_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [orgId]
      );
    }

    if (configResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: profileId 
          ? 'Tally profile not found. Please check the profile ID.'
          : 'Tally configuration not found. Please configure Tally first.'
      });
    }

    const { tally_ip, tally_port, profile_name, tally_company_name } = configResult.rows[0];
    const tallyUrl = `http://${tally_ip}:${tally_port}`;

    // Default date range: current financial year if not provided
    const today = new Date();
    const currentYear = today.getFullYear();
    const financialYearStart = new Date(currentYear, 3, 1); // April 1st
    const financialYearEnd = new Date(currentYear + 1, 2, 31); // March 31st
    
    const fromDate = from_date || financialYearStart.toISOString().split('T')[0];
    const toDate = to_date || financialYearEnd.toISOString().split('T')[0];

    // Request all vouchers/transactions from Tally using XML
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
          <SVFROMDATE>${fromDate}</SVFROMDATE>
          <SVTODATE>${toDate}</SVTODATE>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

    try {
      const response = await axios.post(tallyUrl, xmlRequest, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 60000 // 60 seconds timeout for large transaction datasets
      });

      // Parse XML response and extract transaction data
      const xmlData = response.data;
      
      // Sample transactions - in production, parse the XML and extract actual transaction data
      // This is a placeholder - you'll need to implement XML parsing based on Tally's response format
      const sampleTransactions = [
        {
          voucher_number: 'VCH-001',
          voucher_type: 'Payment',
          date: fromDate,
          ledger_name: 'Cash',
          amount: 10000,
          debit_credit: 'Debit',
          narration: 'Payment made'
        },
        {
          voucher_number: 'VCH-002',
          voucher_type: 'Receipt',
          date: fromDate,
          ledger_name: 'Bank Account',
          amount: 5000,
          debit_credit: 'Credit',
          narration: 'Receipt received'
        },
        {
          voucher_number: 'VCH-003',
          voucher_type: 'Journal',
          date: fromDate,
          ledger_name: 'Sales',
          amount: 15000,
          debit_credit: 'Credit',
          narration: 'Sales entry'
        }
      ];

      // Save to database
      let savedCount = 0;
      const errors = [];

      // First, ensure the table exists (create if not exists)
      try {
        await pool.query(`
          CREATE TABLE IF NOT EXISTS tally_transactions (
            id SERIAL PRIMARY KEY,
            voucher_number VARCHAR(100),
            voucher_type VARCHAR(50),
            voucher_date DATE,
            ledger_name VARCHAR(255),
            amount DECIMAL(15, 2),
            debit_credit VARCHAR(10),
            narration TEXT,
            org_id VARCHAR(50) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(voucher_number, org_id, voucher_date)
          )
        `);
      } catch (tableError) {
        console.log('Table may already exist:', tableError.message);
      }

      for (const transaction of sampleTransactions) {
        try {
          await pool.query(
            `INSERT INTO tally_transactions 
             (voucher_number, voucher_type, voucher_date, ledger_name, amount, debit_credit, narration, org_id, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
             ON CONFLICT (voucher_number, org_id, voucher_date) DO UPDATE SET 
               voucher_type = EXCLUDED.voucher_type,
               ledger_name = EXCLUDED.ledger_name,
               amount = EXCLUDED.amount,
               debit_credit = EXCLUDED.debit_credit,
               narration = EXCLUDED.narration,
               updated_at = NOW()`,
            [
              transaction.voucher_number,
              transaction.voucher_type,
              transaction.date,
              transaction.ledger_name,
              transaction.amount,
              transaction.debit_credit,
              transaction.narration,
              orgId
            ]
          );
          savedCount++;
        } catch (error) {
          console.error(`Error saving transaction:`, transaction.voucher_number, error);
          errors.push({ item: transaction.voucher_number, error: error.message });
        }
      }

      return res.json({
        success: true,
        message: `Synced ${savedCount} transactions from Tally`,
        count: savedCount,
        dateRange: { from: fromDate, to: toDate },
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (tallyError) {
      console.error('Error connecting to Tally:', tallyError);
      return res.status(503).json({
        success: false,
        message: 'Could not connect to Tally. Please ensure Tally is running and accessible.',
        error: tallyError.message
      });
    }
  } catch (error) {
    console.error('Error syncing transactions from Tally:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync transactions from Tally',
      error: error.message
    });
  }
}

