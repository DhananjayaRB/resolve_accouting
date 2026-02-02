import pool from '../../server/db/config.js';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, X-Org-Id');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const orgId = req.headers['x-org-id'] || req.query.org_id;
    
    console.log('Chart of Accounts API called with orgId:', orgId);
    
    if (!orgId) {
      console.error('No orgId provided');
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    console.log('Fetching all groups...');
    
    // Check if parent_group_id column exists (for backward compatibility)
    let hasParentGroupId = false;
    try {
      const columnCheck = await pool.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'tally_groups' 
         AND column_name = 'parent_group_id'`
      );
      hasParentGroupId = columnCheck.rows.length > 0;
    } catch (err) {
      console.warn('Could not check for parent_group_id column:', err.message);
    }
    
    // Get all groups with their parent information
    let allGroupsResult;
    if (hasParentGroupId) {
      // Use parent_group_id if available (after migration)
      allGroupsResult = await pool.query(
        `SELECT tg.*, 
                parent.name as parent_group_name,
                parent.id as parent_group_id_ref
         FROM tally_groups tg
         LEFT JOIN tally_groups parent ON tg.parent_group_id = parent.id
         WHERE tg.org_id = $1
         ORDER BY tg.name ASC`,
        [orgId]
      );
    } else {
      // Fallback to parent_group (name) for backward compatibility
      allGroupsResult = await pool.query(
        `SELECT tg.*, 
                parent.name as parent_group_name,
                parent.id as parent_group_id_ref
         FROM tally_groups tg
         LEFT JOIN tally_groups parent ON tg.parent_group = parent.name AND tg.org_id = parent.org_id
         WHERE tg.org_id = $1
         ORDER BY tg.name ASC`,
        [orgId]
      );
    }

    console.log(`Found ${allGroupsResult.rows.length} groups`);
    
    // Get all ledgers
    console.log('Fetching ledgers...');
    const ledgersResult = await pool.query(
      `SELECT l.*, tg.name as group_name, tg.id as group_id
       FROM ledger l
       LEFT JOIN tally_groups tg ON l.group_id = tg.id
       WHERE l.org_id = $1
       ORDER BY l.name ASC`,
      [orgId]
    );

    console.log(`Found ${ledgersResult.rows.length} ledgers`);
    
    // Helper function to build recursive hierarchy
    function buildGroupNode(group, allGroups, ledgers, processedGroups = new Set()) {
      // Prevent circular references
      if (!group || !group.id) {
        return null;
      }
      
      if (processedGroups.has(group.id)) {
        console.warn(`Circular reference detected for group ${group.name} (ID: ${group.id})`);
        return null;
      }
      processedGroups.add(group.id);
      
      const node = {
        id: `group_${group.id}`,
        type: (hasParentGroupId && group.parent_group_id) || (!hasParentGroupId && group.parent_group) ? 'subgroup' : 'category',
        name: group.name || '',
        code: group.code || null,
        alias: group.alias || null,
        group_type: group.group_type || null,
        parent_group: group.parent_group_name || group.parent_group || null,
        children: []
      };

      // Find child groups (groups that have this group as parent)
      let childGroups;
      if (hasParentGroupId) {
        childGroups = allGroups.filter(g => g && g.parent_group_id === group.id);
      } else {
        childGroups = allGroups.filter(g => g && g.parent_group === group.name && g.org_id === group.org_id);
      }
      
      for (const childGroup of childGroups) {
        if (childGroup) {
          const childNode = buildGroupNode(childGroup, allGroups, ledgers, new Set(processedGroups));
          if (childNode) {
            node.children.push(childNode);
          }
        }
      }

      // Find ledgers for this group
      const groupLedgers = ledgers.filter(l => l && l.group_id === group.id);
      for (const ledger of groupLedgers) {
        if (ledger) {
          node.children.push({
            id: `ledger_${ledger.id}`,
            type: 'ledger',
            name: ledger.name || '',
            code: ledger.code || null,
            category: ledger.category || null,
            group_name: ledger.group_name || null,
            is_active: ledger.is_active !== undefined ? ledger.is_active : true,
            financial_year: ledger.financial_year || null
          });
        }
      }

      return node;
    }
    
    // Build hierarchical structure
    const hierarchy = [];
    
    // Get root groups (groups without parent)
    let rootGroups;
    if (hasParentGroupId) {
      rootGroups = allGroupsResult.rows.filter(g => !g.parent_group_id);
    } else {
      rootGroups = allGroupsResult.rows.filter(g => !g.parent_group || g.parent_group === '');
    }
    
    for (const rootGroup of rootGroups) {
      if (rootGroup) {
        const rootNode = buildGroupNode(rootGroup, allGroupsResult.rows, ledgersResult.rows);
        if (rootNode) {
          hierarchy.push(rootNode);
        }
      }
    }

    // Add uncategorized items
    const uncategorizedLedgers = ledgersResult.rows.filter(l => !l.group_name);
    if (uncategorizedLedgers.length > 0) {
      hierarchy.push({
        id: 'uncategorized',
        type: 'category',
        name: 'Uncategorized',
        code: null,
        alias: null,
        group_type: null,
        children: uncategorizedLedgers.map(ledger => ({
          id: `ledger_${ledger.id}`,
          type: 'ledger',
          name: ledger.name,
          code: ledger.code,
          category: ledger.category,
          group_name: null,
          is_active: ledger.is_active,
          financial_year: ledger.financial_year
        }))
      });
    }

    // Count root groups and all subgroups
    const rootGroupsCount = rootGroups.length;
    let allSubGroupsCount;
    if (hasParentGroupId) {
      allSubGroupsCount = allGroupsResult.rows.filter(g => g && g.parent_group_id).length;
    } else {
      allSubGroupsCount = allGroupsResult.rows.filter(g => g && g.parent_group && g.parent_group !== '').length;
    }

    console.log(`Built hierarchy with ${hierarchy.length} top-level nodes`);
    
    // Ensure hierarchy is always an array
    const safeHierarchy = Array.isArray(hierarchy) ? hierarchy : [];
    
    const response = {
      success: true,
      data: safeHierarchy,
      counts: {
        categories: rootGroupsCount || 0,
        subGroups: allSubGroupsCount || 0,
        ledgers: ledgersResult.rows.length || 0
      }
    };
    
    console.log('Sending response:', JSON.stringify(response).substring(0, 200) + '...');
    return res.json(response);
  } catch (error) {
    console.error('Error fetching chart of accounts:', error);
    console.error('Error stack:', error.stack);
    
    // Return a safe error response
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while fetching chart of accounts',
      data: [] // Always return empty array on error
    });
  }
}

