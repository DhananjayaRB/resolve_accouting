import pool from '../../server/db/config.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Org-Id');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Get org_id from header or query parameter or body
    const orgId = req.headers['x-org-id'] || req.query.org_id || req.body?.org_id;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const { id } = req.query;

    switch (req.method) {
      case 'GET':
        if (id) {
          // Get single group with parent information
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
        return res.json(result.rows);

      case 'PUT':
        // Update a group
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
        
        return res.json(updateResult.rows[0]);

      case 'DELETE':
        // Delete a group
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
        
        return res.json({ success: true, message: 'Group deleted successfully' });

      case 'POST':
        // Create a new group (optional - groups are usually synced from Tally)
        const { name: newName, code: newCode, parent_group: newParentGroup, parent_group_id: newParentGroupId, group_type: newGroupType, alias: newAlias } = req.body;
        
        if (!newName) {
          return res.status(400).json({ error: 'Name is required' });
        }
        
        // If parent_group_id is provided, validate it exists and belongs to same org
        let finalNewParentGroupId = newParentGroupId || null;
        if (finalNewParentGroupId) {
          const parentCheck = await pool.query(
            'SELECT id FROM tally_groups WHERE id = $1 AND org_id = $2',
            [finalNewParentGroupId, orgId]
          );
          if (parentCheck.rows.length === 0) {
            return res.status(400).json({ error: 'Parent group not found or does not belong to this organization' });
          }
        }
        
        // If parent_group (name) is provided but parent_group_id is not, try to find it
        if (newParentGroup && !finalNewParentGroupId) {
          const parentNameCheck = await pool.query(
            'SELECT id FROM tally_groups WHERE name = $1 AND org_id = $2',
            [newParentGroup, orgId]
          );
          if (parentNameCheck.rows.length > 0) {
            finalNewParentGroupId = parentNameCheck.rows[0].id;
          }
        }
        
        const insertResult = await pool.query(
          `INSERT INTO tally_groups (name, code, parent_group, parent_group_id, group_type, alias, org_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING *`,
          [newName, newCode || null, newParentGroup || null, finalNewParentGroupId, newGroupType || (finalNewParentGroupId ? 'Secondary' : 'Primary'), newAlias || null, orgId]
        );
        
        return res.status(201).json(insertResult.rows[0]);

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Error in groups API:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

