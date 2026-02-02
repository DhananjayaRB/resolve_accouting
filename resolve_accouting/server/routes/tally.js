import express from 'express';
import axios from 'axios';
import pool from '../db/config.js';
import syncMastersHandler from '../../api/tally/sync-masters.js';
import chartOfAccountsHandler from '../../api/tally/chart-of-accounts.js';
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

// Get all Tally configs for an organization (supports both path and query parameters)
router.get('/config/:org_id?', async (req, res) => {
  try {
    // Support both path parameter and query parameter
    const org_id = req.params.org_id || req.query.org_id || req.headers['x-org-id'];
    
    if (!org_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Organization ID is required' 
      });
    }
    
    console.log(`Fetching Tally configs for org_id: ${org_id}`);
    
    const result = await pool.query(
      `SELECT * FROM organization_tally_config WHERE org_id = $1 ORDER BY created_at DESC`,
      [org_id]
    );
    
    console.log(`Found ${result.rows.length} profiles for org_id: ${org_id}`);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching Tally configs:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Tally configs', 
      error: error.message 
    });
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
    
    // Get org_id and profile_id from header, body, or query parameter
    const orgId = req.headers['x-org-id'] || req.body.org_id || req.query.org_id;
    const profileId = req.body.profile_id || req.query.profile_id;
    
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

      // Save to database with org_id
      let savedCount = 0;
      for (const ledger of sampleLedgers) {
        try {
          await pool.query(
            `INSERT INTO ledger (name, code, category, is_active, financial_year, org_id, created_at, updated_at)
             VALUES ($1, $2, $3, true, $4, $5, NOW(), NOW())
             ON CONFLICT DO NOTHING`,
            [ledger.name, ledger.code, ledger.category, '2024-25', orgId]
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

// Get chart of accounts (hierarchical view)
router.get('/chart-of-accounts', async (req, res) => {
  await chartOfAccountsHandler(req, res);
});

// Get all groups for an organization
router.get('/groups', async (req, res) => {
  try {
    // Get org_id from header or query parameter
    const orgId = req.headers['x-org-id'] || req.query.org_id;
    const { id } = req.query;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }
    
    // If id is provided, get single group
    if (id) {
      const singleResult = await pool.query(
        `SELECT tg.*, 
                parent.name as parent_group_name,
                parent.id as parent_group_id_ref
         FROM tally_groups tg
         LEFT JOIN tally_groups parent ON tg.parent_group_id = parent.id
         WHERE tg.id = $1 AND tg.org_id = $2`,
        [id, orgId]
      );
      if (singleResult.rows.length === 0) {
        return res.status(404).json({ error: 'Group not found' });
      }
      return res.json(singleResult.rows[0]);
    }
    
    // Get all groups with parent information
    const result = await pool.query(
      `SELECT tg.*, 
              parent.name as parent_group_name,
              parent.id as parent_group_id_ref
       FROM tally_groups tg
       LEFT JOIN tally_groups parent ON tg.parent_group_id = parent.id
       WHERE tg.org_id = $1 
       ORDER BY tg.name ASC`,
      [orgId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Update a group
router.put('/groups', async (req, res) => {
  try {
    const { id } = req.query;
    const orgId = req.headers['x-org-id'] || req.body?.org_id || req.query.org_id;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    const { name, code, parent_group, parent_group_id, group_type, alias } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Prevent self-reference (a group cannot be its own parent)
    if (parent_group_id && parseInt(parent_group_id) === parseInt(id)) {
      return res.status(400).json({ error: 'A group cannot be its own parent' });
    }
    
    // If parent_group_id is provided, validate it exists and belongs to same org
    let finalParentGroupId = parent_group_id || null;
    if (finalParentGroupId) {
      const parentCheck = await pool.query(
        'SELECT id FROM tally_groups WHERE id = $1 AND org_id = $2',
        [finalParentGroupId, orgId]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Parent group not found or does not belong to this organization' });
      }
    }
    
    // If parent_group (name) is provided but parent_group_id is not, try to find it
    if (parent_group && !finalParentGroupId) {
      const parentNameCheck = await pool.query(
        'SELECT id FROM tally_groups WHERE name = $1 AND org_id = $2',
        [parent_group, orgId]
      );
      if (parentNameCheck.rows.length > 0) {
        finalParentGroupId = parentNameCheck.rows[0].id;
      }
    }
    
    const updateResult = await pool.query(
      `UPDATE tally_groups 
       SET name = $1, code = $2, parent_group = $3, parent_group_id = $4, group_type = $5, alias = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND org_id = $8 
       RETURNING *`,
      [name, code || null, parent_group || null, finalParentGroupId, group_type || null, alias || null, id, orgId]
    );
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json(updateResult.rows[0]);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Delete a group
router.delete('/groups', async (req, res) => {
  try {
    const { id } = req.query;
    const orgId = req.headers['x-org-id'] || req.body?.org_id || req.query.org_id;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }
    
    if (!id) {
      return res.status(400).json({ error: 'Group ID is required' });
    }
    
    const deleteResult = await pool.query(
      'DELETE FROM tally_groups WHERE id = $1 AND org_id = $2 RETURNING *',
      [id, orgId]
    );
    
    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ error: 'Group not found' });
    }
    
    res.json({ success: true, message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Create a new group (optional - groups are usually synced from Tally)
router.post('/groups', async (req, res) => {
  try {
    const orgId = req.headers['x-org-id'] || req.body?.org_id || req.query.org_id;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }
    
    const { name, code, parent_group, parent_group_id, group_type, alias } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // If parent_group_id is provided, validate it exists and belongs to same org
    let finalParentGroupId = parent_group_id || null;
    if (finalParentGroupId) {
      const parentCheck = await pool.query(
        'SELECT id FROM tally_groups WHERE id = $1 AND org_id = $2',
        [finalParentGroupId, orgId]
      );
      if (parentCheck.rows.length === 0) {
        return res.status(400).json({ error: 'Parent group not found or does not belong to this organization' });
      }
    }
    
    // If parent_group (name) is provided but parent_group_id is not, try to find it
    if (parent_group && !finalParentGroupId) {
      const parentNameCheck = await pool.query(
        'SELECT id FROM tally_groups WHERE name = $1 AND org_id = $2',
        [parent_group, orgId]
      );
      if (parentNameCheck.rows.length > 0) {
        finalParentGroupId = parentNameCheck.rows[0].id;
      }
    }
    
    const insertResult = await pool.query(
      `INSERT INTO tally_groups (name, code, parent_group, parent_group_id, group_type, alias, org_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, code || null, parent_group || null, finalParentGroupId, group_type || (finalParentGroupId ? 'Secondary' : 'Primary'), alias || null, orgId]
    );
    
    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Sync masters from Tally
router.post('/sync-masters', async (req, res) => {
  await syncMastersHandler(req, res);
});

// Sync all masters from Tally (comprehensive sync)
import syncAllMastersHandler from '../../api/tally/sync-all-masters.js';
router.post('/sync-all-masters', async (req, res) => {
  await syncAllMastersHandler(req, res);
});

// Chart of Accounts endpoint
router.get('/chart-of-accounts', async (req, res) => {
  await chartOfAccountsHandler(req, res);
});

export default router; 