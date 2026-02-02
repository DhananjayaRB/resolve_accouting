import axios from 'axios';
import pool from '../../server/db/config.js';

// Map Tally group names to our category system
function mapCategoryFromGroup(groupName) {
  if (!groupName) return 'Expense';
  
  const name = groupName.toLowerCase();
  
  // Asset categories
  if (name.includes('asset') || name.includes('bank') || name.includes('cash') || 
      name.includes('deposit') || name.includes('investment') || name.includes('stock')) {
    return 'Asset';
  }
  
  // Liability categories
  if (name.includes('liability') || name.includes('creditor') || name.includes('loan') ||
      name.includes('payable') || name.includes('duty') || name.includes('tax')) {
    return 'Liability';
  }
  
  // Income categories
  if (name.includes('income') || name.includes('revenue') || name.includes('sales') ||
      name.includes('receipt') || name.includes('profit')) {
    return 'Income';
  }
  
  // Expense categories (default)
  return 'Expense';
}

// Replace &amp; with &
function decodeHtmlEntities(text) {
  if (!text) return text;
  return text.replace(/&amp;/g, '&').replace(/&#4;/g, '').trim();
}

// Parse XML to extract all groups and ledgers
function parseAccountsXML(xmlString, orgId) {
  const mainCategories = []; // Groups without parent
  const subGroups = []; // Groups with parent
  const ledgers = [];
  
  try {
    // Replace &amp; with & in the entire XML
    xmlString = xmlString.replace(/&amp;/g, '&');
    
    // Extract all GROUPs
    const groupMatches = xmlString.match(/<GROUP\s+NAME="([^"]*)"[^>]*>[\s\S]*?<\/GROUP>/gi);
    
    if (groupMatches) {
      for (const groupMatch of groupMatches) {
        const nameMatch = groupMatch.match(/NAME="([^"]*)"/i);
        const name = nameMatch ? decodeHtmlEntities(nameMatch[1]) : null;
        if (!name) continue;
        
        const reservedNameMatch = groupMatch.match(/RESERVEDNAME="([^"]*)"/i);
        const code = reservedNameMatch ? decodeHtmlEntities(reservedNameMatch[1]) : name;
        
        // Check for PARENT element
        const parentMatch = groupMatch.match(/<PARENT[^>]*>([^<]+)<\/PARENT>/i);
        const parent = parentMatch ? decodeHtmlEntities(parentMatch[1].trim()) : null;
        
        // Extract alias from LANGUAGENAME.LIST
        let alias = null;
        const aliasMatch = groupMatch.match(/<LANGUAGENAME\.LIST>[\s\S]*?<NAME\.LIST[^>]*>[\s\S]*?<NAME[^>]*>([^<]+)<\/NAME>/i);
        if (aliasMatch) {
          alias = decodeHtmlEntities(aliasMatch[1]);
        }
        
        const groupData = {
          name: name,
          code: code,
          parent_group: parent,
          group_type: parent ? 'Secondary' : 'Primary',
          alias: alias || name,
          org_id: orgId
        };
        
        // If no parent or empty parent, it's a main category
        if (!parent || parent.trim() === '') {
          mainCategories.push(groupData);
        } else {
          subGroups.push(groupData);
        }
      }
    }
    
    // Extract all LEDGERs
    const ledgerMatches = xmlString.match(/<LEDGER\s+NAME="([^"]*)"[^>]*>[\s\S]*?<\/LEDGER>/gi);
    
    if (ledgerMatches) {
      for (const ledgerMatch of ledgerMatches) {
        const nameMatch = ledgerMatch.match(/NAME="([^"]*)"/i);
        const name = nameMatch ? decodeHtmlEntities(nameMatch[1]) : null;
        if (!name) continue;
        
        const reservedNameMatch = ledgerMatch.match(/RESERVEDNAME="([^"]*)"/i);
        const code = reservedNameMatch ? decodeHtmlEntities(reservedNameMatch[1]) : name;
        
        // Extract PARENT (this is the sub-group name)
        const parentMatch = ledgerMatch.match(/<PARENT[^>]*>([^<]+)<\/PARENT>/i);
        const parentGroupName = parentMatch ? decodeHtmlEntities(parentMatch[1].trim()) : null;
        
        // Determine category from parent group hierarchy
        let category = 'Expense';
        if (parentGroupName) {
          // Find the sub-group to get its parent (main category)
          const subGroup = subGroups.find(sg => sg.name === parentGroupName);
          if (subGroup && subGroup.parent_group) {
            category = mapCategoryFromGroup(subGroup.parent_group);
          } else {
            category = mapCategoryFromGroup(parentGroupName);
          }
        }
        
        ledgers.push({
          name: name,
          code: code,
          category: category,
          parent_group_name: parentGroupName,
          is_active: true,
          financial_year: null,
          org_id: orgId
        });
      }
    }
    
  } catch (error) {
    console.error('Error parsing accounts XML:', error);
    throw error;
  }
  
  return { mainCategories, subGroups, ledgers };
}

// Find or create a group and return its ID
async function findOrCreateGroup(groupName, parentGroupName, orgId) {
  if (!groupName) return null;
  
  // First, check if parent exists and get/create it if needed
  let parentGroupId = null;
  if (parentGroupName) {
    const parentResult = await pool.query(
      'SELECT id FROM tally_groups WHERE name = $1 AND org_id = $2',
      [parentGroupName, orgId]
    );
    
    if (parentResult.rows.length > 0) {
      parentGroupId = parentResult.rows[0].id;
    } else {
      // Create parent group if it doesn't exist
      const newParentResult = await pool.query(
        `INSERT INTO tally_groups (name, code, parent_group, group_type, alias, org_id)
         VALUES ($1, $2, NULL, $3, $4, $5)
         ON CONFLICT (name, org_id) DO UPDATE SET updated_at = NOW()
         RETURNING id`,
        [parentGroupName, parentGroupName, 'Primary', parentGroupName, orgId]
      );
      parentGroupId = newParentResult.rows[0].id;
    }
  }
  
  // Now find or create the group itself
  const result = await pool.query(
    'SELECT id FROM tally_groups WHERE name = $1 AND org_id = $2',
    [groupName, orgId]
  );
  
  if (result.rows.length > 0) {
    return result.rows[0].id;
  }
  
  // Create the group
  const insertResult = await pool.query(
    `INSERT INTO tally_groups (name, code, parent_group, group_type, alias, org_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (name, org_id) DO UPDATE SET updated_at = NOW(), parent_group = EXCLUDED.parent_group
     RETURNING id`,
    [groupName, groupName, parentGroupName, parentGroupName ? 'Secondary' : 'Primary', groupName, orgId]
  );
  
  return insertResult.rows[0].id;
}

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
    const { org_id, profile_id } = req.body;
    const orgId = org_id || req.query.org_id;
    const profileId = profile_id || req.query.profile_id;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    // Get Tally config from database
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

    const { tally_ip, tally_port } = configResult.rows[0];
    const tallyUrl = `http://${tally_ip}:${tally_port}`;

    // Request "List of Accounts" from Tally
    const xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>List of Accounts</REPORTNAME>
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
        timeout: 30000 // 30 second timeout
      });

      const xmlData = response.data;
      
      // Parse the XML to extract groups and ledgers
      const { mainCategories, subGroups, ledgers } = parseAccountsXML(xmlData, orgId);
      
      // Step 1: Save main categories (groups without parent) first
      let mainCategoryCount = 0;
      for (const category of mainCategories) {
        try {
          const result = await pool.query(
            `INSERT INTO tally_groups (name, code, parent_group, parent_group_id, group_type, alias, org_id)
             VALUES ($1, $2, NULL, NULL, $3, $4, $5)
             ON CONFLICT (name, org_id) DO UPDATE SET 
               updated_at = NOW(),
               code = EXCLUDED.code,
               group_type = EXCLUDED.group_type,
               alias = EXCLUDED.alias,
               parent_group = NULL,
               parent_group_id = NULL
             RETURNING id`,
            [category.name, category.code, category.group_type, category.alias, orgId]
          );
          mainCategoryCount++;
        } catch (error) {
          console.error(`Error saving main category ${category.name}:`, error);
        }
      }
      
      // Step 2: Save sub-groups (groups with parent) - supports multi-level hierarchies
      // We may need multiple passes if sub-groups have other sub-groups as parents
      let subGroupCount = 0;
      let maxIterations = 20; // Increased for deeper hierarchies
      let remainingSubGroups = [...subGroups];
      
      while (remainingSubGroups.length > 0 && maxIterations > 0) {
        maxIterations--;
        const processedThisRound = [];
        
        for (const subGroup of remainingSubGroups) {
          try {
            // Find parent group ID (could be a main category or another sub-group)
            let parentGroupId = null;
            if (subGroup.parent_group) {
              const parentCheck = await pool.query(
                'SELECT id FROM tally_groups WHERE name = $1 AND org_id = $2',
                [subGroup.parent_group, orgId]
              );
              
              if (parentCheck.rows.length > 0) {
                parentGroupId = parentCheck.rows[0].id;
              } else {
                // Check if parent is in mainCategories (will be created)
                const parentInMainCategories = mainCategories.find(mc => mc.name === subGroup.parent_group);
                if (parentInMainCategories) {
                  // Parent will be created, skip for now
                  continue;
                }
              }
            }
            
            // Only create if parent exists (or no parent needed)
            if (parentGroupId !== null || !subGroup.parent_group) {
              const result = await pool.query(
                `INSERT INTO tally_groups (name, code, parent_group, parent_group_id, group_type, alias, org_id)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)
                 ON CONFLICT (name, org_id) DO UPDATE SET 
                   updated_at = NOW(),
                   code = EXCLUDED.code,
                   parent_group = EXCLUDED.parent_group,
                   parent_group_id = EXCLUDED.parent_group_id,
                   group_type = EXCLUDED.group_type,
                   alias = EXCLUDED.alias
                 RETURNING id`,
                [subGroup.name, subGroup.code, subGroup.parent_group, parentGroupId, subGroup.group_type, subGroup.alias, orgId]
              );
              subGroupCount++;
              processedThisRound.push(subGroup);
            }
          } catch (error) {
            console.error(`Error saving sub-group ${subGroup.name}:`, error);
            // Still mark as processed to avoid infinite loop
            processedThisRound.push(subGroup);
          }
        }
        
        // Remove processed groups
        remainingSubGroups = remainingSubGroups.filter(sg => !processedThisRound.includes(sg));
        
        // If no progress was made, break to avoid infinite loop
        if (processedThisRound.length === 0) {
          console.warn('Some sub-groups could not be created - parent groups may be missing');
          break;
        }
      }
      
      // Step 3: Save ledgers and link them to sub-groups
      let ledgerCount = 0;
      for (const ledger of ledgers) {
        try {
          // Find the sub-group ID
          let groupId = null;
          if (ledger.parent_group_name) {
            const groupResult = await pool.query(
              'SELECT id FROM tally_groups WHERE name = $1 AND org_id = $2',
              [ledger.parent_group_name, orgId]
            );
            if (groupResult.rows.length > 0) {
              groupId = groupResult.rows[0].id;
            }
          }
          
          await pool.query(
            `INSERT INTO ledger (name, code, category, is_active, financial_year, group_id, org_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (name, org_id) DO UPDATE SET 
               updated_at = NOW(),
               code = EXCLUDED.code,
               category = EXCLUDED.category,
               group_id = EXCLUDED.group_id`,
            [ledger.name, ledger.code, ledger.category, ledger.is_active, ledger.financial_year, groupId, orgId]
          );
          ledgerCount++;
        } catch (error) {
          console.error(`Error saving ledger ${ledger.name}:`, error);
        }
      }

      return res.json({
        success: true,
        message: 'All masters synced successfully',
        counts: {
          mainCategories: mainCategoryCount,
          subGroups: subGroupCount,
          ledgers: ledgerCount,
          total: mainCategoryCount + subGroupCount + ledgerCount
        }
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
    console.error('Error syncing all masters from Tally:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync all masters from Tally',
      error: error.message
    });
  }
}

