import express from 'express';
import pool from '../../db/config.js';
import authenticateJWT from '../../middleware/jwtAuth.js';

const router = express.Router();

/**
 * Helper function to encode cursor to Base64
 */
function encodeCursor(cursor) {
  try {
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
  } catch (error) {
    console.error('Error encoding cursor:', error);
    return null;
  }
}

/**
 * Helper function to decode cursor from Base64
 */
function decodeCursor(cursorString) {
  try {
    const decoded = Buffer.from(cursorString, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding cursor:', error);
    return null;
  }
}

/**
 * Build nested tree structure from flat rows
 * Handles unlimited nesting depth using group_path
 * Each row contains the full path to the group, so we build the tree level by level
 */
function buildNestedTree(rows, allGroups = []) {
  const categoryMap = new Map();
  const groupInfoCache = new Map(); // Cache group info by group_id

  // First pass: collect all unique group information from allGroups (if provided)
  // This ensures we have names for all groups in paths, not just the last one
  for (const group of allGroups) {
    if (group.id && group.name) {
      groupInfoCache.set(group.id, {
        id: group.id,
        name: group.name,
        parent_group_id: group.parent_group_id
      });
    }
  }

  // Also collect from rows (in case allGroups query failed)
  for (const row of rows) {
    if (row.group_id && row.group_name) {
      if (!groupInfoCache.has(row.group_id)) {
        groupInfoCache.set(row.group_id, {
          id: row.group_id,
          name: row.group_name,
          parent_group_id: row.parent_group_id
        });
      }
    }
  }

  // Second pass: build tree structure from rows
  for (const row of rows) {
    const category = row.category || 'Uncategorized';
    
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        groups: []
      });
    }

    const categoryData = categoryMap.get(category);
    const groupPath = row.group_path || [];
    
    if (groupPath.length === 0) continue;

    // Navigate/create the tree structure based on group_path
    // group_path contains the full ancestry: [root_id, child_id, grandchild_id, ...]
    let currentLevel = categoryData.groups;
    
    for (let i = 0; i < groupPath.length; i++) {
      const groupId = groupPath[i];
      const isLastGroup = i === groupPath.length - 1;
      
      // Find or create group at this level
      let groupNode = currentLevel.find(g => g.group_id === groupId);
      
      if (!groupNode) {
        // Get group info from cache (which has all groups) or fallback to row data
        let groupInfo = groupInfoCache.get(groupId);
        
        if (!groupInfo) {
          // Fallback: try to find in allGroups or use row data
          const foundGroup = allGroups.find(g => g.id === groupId);
          if (foundGroup) {
            groupInfo = {
              id: foundGroup.id,
              name: foundGroup.name,
              parent_group_id: foundGroup.parent_group_id
            };
            groupInfoCache.set(groupId, groupInfo);
          } else {
            // Last resort: use row data (only works for last group in path)
            groupInfo = {
              id: groupId,
              name: (i === groupPath.length - 1) ? (row.group_name || `Group ${groupId}`) : `Group ${groupId}`,
              parent_group_id: i > 0 ? groupPath[i - 1] : null
            };
          }
        }
        
        groupNode = {
          group_id: groupInfo.id,
          group_name: groupInfo.name,
          parent_group_id: groupInfo.parent_group_id || (i > 0 ? groupPath[i - 1] : null),
          child_groups: [],
          ledgers: []
        };
        currentLevel.push(groupNode);
      }

      if (isLastGroup) {
        // This is the deepest group in the path - attach ledger here
        if (row.ledger_id) {
          // Check if ledger already added (avoid duplicates)
          const ledgerExists = groupNode.ledgers.some(l => l.ledger_id === row.ledger_id);
          if (!ledgerExists) {
            groupNode.ledgers.push({
              ledger_id: row.ledger_id,
              ledger_name: row.ledger_name,
              is_active: row.is_active !== undefined ? row.is_active : true
            });
          }
        }
      } else {
        // Move to next level in the tree
        currentLevel = groupNode.child_groups;
      }
    }
  }

  // Sort groups at each level by group_id for consistent ordering
  function sortGroups(groups) {
    groups.sort((a, b) => a.group_id - b.group_id);
    groups.forEach(g => {
      if (g.child_groups && g.child_groups.length > 0) {
        sortGroups(g.child_groups);
      }
    });
  }

  const result = Array.from(categoryMap.values());
  result.forEach(cat => {
    if (cat.groups && cat.groups.length > 0) {
      sortGroups(cat.groups);
    }
  });
  
  return result;
}

/**
 * GET /api/v1/sync-tally-master
 * Returns ALL Tally master data in hierarchy (no pagination)
 * Structure: Category -> Group (recursive) -> Ledger
 */
router.get('/sync-tally-master', authenticateJWT, async (req, res) => {
  try {
    const orgId = req.orgId || req.user?.org_id;
    
    if (!orgId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Organization ID not found in token'
        }
      });
    }

    // Check if parent_group_id column exists
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

    if (!hasParentGroupId) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SCHEMA_ERROR',
          message: 'parent_group_id column not found. Please run migration 010_add_parent_group_id_to_tally_groups.sql'
        }
      });
    }

    // Build query to get ALL data (no pagination)
    const query = `
      WITH RECURSIVE group_tree AS (
          SELECT
              g.id,
              g.name,
              g.parent_group_id,
              ARRAY[g.id] AS path,
              0 AS level
          FROM tally_groups g
          WHERE g.parent_group_id IS NULL
            AND g.org_id = $1

          UNION ALL

          SELECT
              c.id,
              c.name,
              c.parent_group_id,
              gt.path || c.id,
              gt.level + 1
          FROM tally_groups c
          JOIN group_tree gt ON c.parent_group_id = gt.id
          WHERE c.org_id = $1
      )
      SELECT
          l.category,
          gt.id          AS group_id,
          gt.name        AS group_name,
          gt.parent_group_id,
          gt.level       AS group_level,
          gt.path        AS group_path,
          l.id           AS ledger_id,
          l.name         AS ledger_name,
          l.is_active
      FROM group_tree gt
      LEFT JOIN ledger l ON l.group_id = gt.id AND l.org_id = $1
      WHERE l.id IS NOT NULL
      ORDER BY
          l.category,
          gt.level,
          gt.path,
          l.id
    `;

    const queryParams = [orgId];

    // Fetch all groups to build complete group info cache
    // This ensures we have names for all groups in the path, not just the last one
    const allGroupsQuery = `
      SELECT id, name, parent_group_id
      FROM tally_groups
      WHERE org_id = $1
    `;
    
    // Execute both queries in parallel for better performance
    const [result, groupsResult] = await Promise.all([
      pool.query(query, queryParams),
      pool.query(allGroupsQuery, [orgId])
    ]);
    
    const rows = result.rows;
    const allGroups = groupsResult.rows;

    // Build nested tree structure from flat rows with complete group info
    const nestedData = buildNestedTree(rows, allGroups);

    // Count totals for meta
    const totalGroups = allGroups.length;
    const totalLedgers = rows.length;
    const totalCategories = new Set(rows.map(r => r.category)).size;

    // Response with ALL data (no pagination)
    res.json({
      success: true,
      data: nestedData,
      meta: {
        synced_at: new Date().toISOString(),
        source: 'Tally Prime',
        total_categories: totalCategories,
        total_groups: totalGroups,
        total_ledgers: totalLedgers
      }
    });

  } catch (error) {
    console.error('Error in sync-tally-master:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while fetching Tally master data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      }
    });
  }
});

export default router;
