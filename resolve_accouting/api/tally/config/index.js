import pool from '../../../server/db/config.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method } = req;
    const { id } = req.query;

    switch (method) {
      case 'POST':
        // Create new Tally config
        const { org_id, profile_name, tally_company_name, tally_ip, tally_port, created_by } = req.body;
        
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
        
        return res.json({ success: true, message: 'Tally config saved', data: result.rows[0] });

      case 'PUT':
        // Update existing Tally config
        if (!id) {
          return res.status(400).json({ success: false, message: 'Profile ID is required' });
        }
        
        const { org_id: updateOrgId, profile_name: updateProfileName, tally_company_name: updateTallyCompanyName, tally_ip: updateTallyIp, tally_port: updateTallyPort, updated_by } = req.body;
        
        const profileId = parseInt(id, 10);
        if (isNaN(profileId)) {
          return res.status(400).json({ success: false, message: 'Invalid profile ID' });
        }
        
        if (!updateOrgId || !updateProfileName || !updateTallyCompanyName || !updateTallyIp || !updateTallyPort || !updated_by) {
          return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        
        // Check if profile exists
        const checkResult = await pool.query(
          `SELECT id, org_id, profile_name FROM organization_tally_config WHERE id = $1`,
          [profileId]
        );
        
        if (checkResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Tally configuration not found' });
        }
        
        // Check for name conflicts
        const nameConflict = await pool.query(
          `SELECT id FROM organization_tally_config WHERE org_id = $1 AND profile_name = $2 AND id != $3`,
          [updateOrgId, updateProfileName, profileId]
        );
        
        if (nameConflict.rows.length > 0) {
          return res.status(409).json({ success: false, message: 'Profile name already exists for this organization' });
        }
        
        // Update the profile
        const updateResult = await pool.query(
          `UPDATE organization_tally_config 
           SET profile_name = $1, 
               tally_company_name = $2, 
               tally_ip = $3, 
               tally_port = $4, 
               updated_at = NOW()
           WHERE id = $5 AND org_id = $6 RETURNING *`,
          [updateProfileName, updateTallyCompanyName, updateTallyIp, parseInt(updateTallyPort, 10), profileId, updateOrgId]
        );
        
        if (updateResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Tally configuration not found or not authorized' });
        }
        
        return res.json({ success: true, message: 'Tally config updated', data: updateResult.rows[0] });

      case 'DELETE':
        // Delete Tally config
        if (!id) {
          return res.status(400).json({ success: false, message: 'Profile ID is required' });
        }
        
        const deleteProfileId = parseInt(id, 10);
        if (isNaN(deleteProfileId)) {
          return res.status(400).json({ success: false, message: 'Invalid profile ID' });
        }
        
        // Check if profile exists
        const deleteCheckResult = await pool.query(
          `SELECT id, org_id, profile_name FROM organization_tally_config WHERE id = $1`,
          [deleteProfileId]
        );
        
        if (deleteCheckResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Tally configuration not found' });
        }
        
        // Delete the profile
        const deleteResult = await pool.query(
          `DELETE FROM organization_tally_config WHERE id = $1 RETURNING id`,
          [deleteProfileId]
        );
        
        if (deleteResult.rows.length === 0) {
          return res.status(404).json({ success: false, message: 'Tally configuration not found or already deleted' });
        }
        
        return res.json({ 
          success: true, 
          message: 'Tally config deleted successfully',
          data: { id: deleteResult.rows[0].id }
        });

      default:
        res.setHeader('Allow', ['POST', 'PUT', 'DELETE']);
        return res.status(405).json({ success: false, message: `Method ${method} not allowed` });
    }
  } catch (error) {
    console.error('Error in Tally config API:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

