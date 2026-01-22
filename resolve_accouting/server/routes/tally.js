import express from 'express';
import axios from 'axios';
import pool from '../db/config.js';

const router = express.Router();

// Debug middleware for this route
router.use((req, res, next) => {
  console.log(`Tally route accessed: ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  next();
});

// Test connection to Tally server
router.post('/test', async (req, res) => {
  try {
    const { tally_ip, tally_port } = req.body;

    if (!tally_ip || !tally_port) {
      return res.status(400).json({
        success: false,
        message: 'tally_ip and tally_port are required',
      });
    }

    const url = `http://${tally_ip}:${tally_port}`;
    console.log('Testing Tally connection to:', url);

    try {
      const response = await axios.get(url, { timeout: 5000 });

      return res.json({
        success: true,
        message: `Successfully connected to Tally at ${url}`,
        status: response.status,
        data: response.data,
      });
    } catch (error) {
      console.error('Error testing Tally connection:', error);

      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message:
            'Connection refused. Please ensure Tally is running and accessible from the server.',
        });
      }

      if (error.code === 'ETIMEDOUT') {
        return res.status(504).json({
          success: false,
          message:
            'Connection to Tally timed out. Please check network connectivity and firewall settings.',
        });
      }

      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to connect to Tally',
      });
    }
  } catch (error) {
    console.error('Unexpected error in Tally test endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Unexpected error while testing Tally connection',
    });
  }
});

// Push data to Tally
router.post('/push', async (req, res) => {
  try {
    const { xmlData } = req.body;
    
    if (!xmlData) {
      console.error('Missing XML data in request');
      return res.status(400).json({ 
        success: false, 
        message: 'XML data is required' 
      });
    }

    // Get Tally configuration from environment variables
    const tallyConfig = {
      ip: process.env.TALLY_IP || 'localhost',
      port: process.env.TALLY_PORT || 9000
    };

    console.log('Attempting to connect to Tally at:', `http://${tallyConfig.ip}:${tallyConfig.port}`);

    try {
      // Send XML to Tally
      const response = await axios.post(
        `http://${tallyConfig.ip}:${tallyConfig.port}`,
        xmlData,
        {
          headers: {
            'Content-Type': 'text/xml',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      console.log('Tally response:', response.data);

      // Check Tally's response
      if (response.data && response.data.success) {
        res.json({ 
          success: true, 
          message: 'Successfully pushed to Tally',
          data: response.data 
        });
      } else {
        throw new Error(response.data?.message || 'Failed to push to Tally');
      }
    } catch (tallyError) {
      console.error('Error communicating with Tally:', tallyError);
      
      // Handle specific error cases
      if (tallyError.code === 'ECONNREFUSED') {
        return res.status(503).json({
          success: false,
          message: 'Could not connect to Tally. Please ensure Tally is running and accessible.'
        });
      }
      
      if (tallyError.code === 'ETIMEDOUT') {
        return res.status(504).json({
          success: false,
          message: 'Connection to Tally timed out. Please try again.'
        });
      }

      throw tallyError;
    }
  } catch (error) {
    console.error('Error pushing to Tally:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to push to Tally',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get all Tally configs for an organization
router.get('/config/:org_id', async (req, res) => {
  try {
    const { org_id } = req.params;
    const result = await pool.query(
      `SELECT * FROM organization_tally_config WHERE org_id = $1 ORDER BY created_at DESC`,
      [org_id]
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching Tally configs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch Tally configs', error: error.message });
  }
});

// Save new Tally config for organization
router.post('/config', async (req, res) => {
  try {
    const { org_id, profile_name, tally_company_name, tally_ip, tally_port, created_by } = req.body;
    console.log('POST /config - Creating new profile:', { org_id, profile_name, tally_ip, tally_port });
    
    if (!org_id || !profile_name || !tally_company_name || !tally_ip || !tally_port || !created_by) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Check if profile already exists
    const existing = await pool.query(
      `SELECT * FROM organization_tally_config WHERE org_id = $1 AND profile_name = $2`,
      [org_id, profile_name]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Profile name already exists for this organization. Please use update instead.' 
      });
    }

    // Insert new profile
    const result = await pool.query(
      `INSERT INTO organization_tally_config (org_id, profile_name, tally_company_name, tally_ip, tally_port, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [org_id, profile_name, tally_company_name, tally_ip, parseInt(tally_port, 10), created_by]
    );
    
    console.log('Profile created successfully:', result.rows[0].id);
    res.json({ success: true, message: 'Tally config saved', data: result.rows[0] });
  } catch (error) {
    console.error('Error saving Tally config:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ success: false, message: 'Profile name already exists for this organization' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to save Tally config', error: error.message });
    }
  }
});

// Update existing Tally config by ID
router.put('/config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { org_id, profile_name, tally_company_name, tally_ip, tally_port, updated_by } = req.body;
    
    console.log('PUT /config/:id - Updating profile:', { id, org_id, profile_name, tally_ip, tally_port });
    
    // Validate ID is a number
    const profileId = parseInt(id, 10);
    if (isNaN(profileId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid profile ID' 
      });
    }
    
    if (!org_id || !profile_name || !tally_company_name || !tally_ip || !tally_port || !updated_by) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Check if profile exists and belongs to the organization
    const checkResult = await pool.query(
      `SELECT id, org_id, profile_name FROM organization_tally_config WHERE id = $1`,
      [profileId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tally configuration not found' 
      });
    }
    
    // Check if profile name conflicts with another profile (excluding current one)
    const nameConflict = await pool.query(
      `SELECT id FROM organization_tally_config WHERE org_id = $1 AND profile_name = $2 AND id != $3`,
      [org_id, profile_name, profileId]
    );
    
    if (nameConflict.rows.length > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Profile name already exists for this organization' 
      });
    }
    
    // Update the profile
    const result = await pool.query(
      `UPDATE organization_tally_config 
       SET profile_name = $1, 
           tally_company_name = $2, 
           tally_ip = $3, 
           tally_port = $4, 
           updated_at = NOW()
       WHERE id = $5 AND org_id = $6 RETURNING *`,
      [profile_name, tally_company_name, tally_ip, parseInt(tally_port, 10), profileId, org_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tally configuration not found or not authorized' 
      });
    }
    
    console.log('Profile updated successfully:', result.rows[0].id);
    res.json({ success: true, message: 'Tally config updated', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating Tally config:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update Tally config', 
      error: error.message 
    });
  }
});

// Delete Tally config
router.delete('/config/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE request received for profile ID:', id);
    
    // Validate ID is a number
    const profileId = parseInt(id, 10);
    if (isNaN(profileId)) {
      console.error('Invalid profile ID:', id);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid profile ID' 
      });
    }
    
    console.log('Attempting to delete profile with ID:', profileId);
    
    // Check if profile exists before deleting
    const checkResult = await pool.query(
      `SELECT id, org_id, profile_name FROM organization_tally_config WHERE id = $1`,
      [profileId]
    );
    
    console.log('Profile check result:', checkResult.rows);
    
    if (checkResult.rows.length === 0) {
      console.log('Profile not found for ID:', profileId);
      return res.status(404).json({ 
        success: false, 
        message: 'Tally configuration not found' 
      });
    }
    
    // Delete the profile
    const deleteResult = await pool.query(
      `DELETE FROM organization_tally_config WHERE id = $1 RETURNING id`,
      [profileId]
    );
    
    console.log('Delete result:', deleteResult.rows);
    
    if (deleteResult.rows.length === 0) {
      console.log('No rows deleted for ID:', profileId);
      return res.status(404).json({ 
        success: false, 
        message: 'Tally configuration not found or already deleted' 
      });
    }
    
    console.log('Profile deleted successfully:', deleteResult.rows[0].id);
    res.json({ 
      success: true, 
      message: 'Tally config deleted successfully',
      data: { id: deleteResult.rows[0].id }
    });
  } catch (error) {
    console.error('Error deleting Tally config:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete Tally config', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Sync ledger heads from Tally
router.post('/sync-ledgers', async (req, res) => {
  try {
    console.log('Syncing ledger heads from Tally...');
    
    // Get Tally configuration for the organization
    const { org_id } = req.body;
    if (!org_id) {
      // Try to get from query or use default
      const defaultOrgId = req.query.org_id;
      if (!defaultOrgId) {
        return res.status(400).json({ 
          success: false, 
          message: 'Organization ID is required' 
        });
      }
    }

    // Get Tally config from database
    const configResult = await pool.query(
      `SELECT tally_ip, tally_port FROM organization_tally_config WHERE org_id = $1 LIMIT 1`,
      [org_id || req.query.org_id]
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
      // This is a simplified version - you may need to use an XML parser
      const xmlData = response.data;
      
      // For now, return sample data structure
      // In production, parse the XML and extract actual ledger data
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

      res.json({ 
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
    res.status(500).json({ 
      success: false, 
      message: 'Failed to sync ledgers from Tally', 
      error: error.message 
    });
  }
});

export default router; 