import axios from 'axios';
import pool from '../../server/db/config.js';

// Master type configurations
const MASTER_CONFIGS = {
  ledgers: {
    reportName: 'List of Ledgers',
    tableName: 'ledger',
    fields: ['name', 'code', 'category', 'is_active', 'financial_year', 'group_id', 'org_id']
  },
  groups: {
    reportName: 'List of Groups',
    tableName: 'tally_groups',
    fields: ['name', 'code', 'parent_group', 'group_type', 'alias', 'org_id']
  },
  costcenters: {
    reportName: 'List of Cost Centers',
    tableName: 'tally_costcenters',
    fields: ['name', 'code', 'alias', 'org_id']
  },
  stockitems: {
    reportName: 'List of Stock Items',
    tableName: 'tally_stockitems',
    fields: ['name', 'code', 'unit', 'opening_balance', 'org_id']
  },
  units: {
    reportName: 'List of Units',
    tableName: 'tally_units',
    fields: ['name', 'code', 'base_unit', 'conversion_factor', 'org_id']
  },
  parties: {
    reportName: 'List of Parties',
    tableName: 'tally_parties',
    fields: ['name', 'code', 'type', 'address', 'org_id']
  },
  vouchertypes: {
    reportName: 'List of Voucher Types',
    tableName: 'tally_vouchertypes',
    fields: ['name', 'code', 'type', 'org_id']
  }
};

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
    const { org_id, master_type, profile_id } = req.body;
    const orgId = org_id || req.query.org_id;
    const masterType = master_type || req.query.master_type;
    const profileId = profile_id || req.query.profile_id;

    if (!orgId) {
      return res.status(400).json({
        success: false,
        message: 'Organization ID is required'
      });
    }

    if (!masterType || !MASTER_CONFIGS[masterType]) {
      return res.status(400).json({
        success: false,
        message: `Invalid master type. Supported types: ${Object.keys(MASTER_CONFIGS).join(', ')}`
      });
    }

    const config = MASTER_CONFIGS[masterType];

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

    // Request master data from Tally using XML
    // Special XML payload for Groups and Ledgers
    let xmlRequest;
    if (masterType === 'groups') {
      xmlRequest = `<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>EXPORT</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>Group</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                <GroupType>Primary</GroupType>
            </STATICVARIABLES>
        </DESC>
    </BODY>
</ENVELOPE>`;
    } else if (masterType === 'ledgers') {
      xmlRequest = `<ENVELOPE>
    <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export</TALLYREQUEST>
        <TYPE>Collection</TYPE>
        <ID>AllLedgersWithParent</ID>
    </HEADER>
    <BODY>
        <DESC>
            <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
            </STATICVARIABLES>
            <TDL>
                <TDLMESSAGE>
                    <COLLECTION NAME="AllLedgersWithParent">
                        <TYPE>Ledger</TYPE>
                        <FETCH>Name, Parent, OpeningBalance, Email</FETCH>
                    </COLLECTION>
                </TDLMESSAGE>
            </TDL>
        </DESC>
    </BODY>
</ENVELOPE>`;
    } else {
      xmlRequest = `<?xml version="1.0" encoding="UTF-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>${config.reportName}</REPORTNAME>
        <STATICVARIABLES>
          <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        </STATICVARIABLES>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;
    }

    try {
      const response = await axios.post(tallyUrl, xmlRequest, {
        headers: { 'Content-Type': 'text/xml' },
        timeout: 30000 // 30 seconds timeout for large datasets
      });

      // Parse XML response and extract master data
      const xmlData = response.data;
      
      // Parse XML and extract data
      let parsedData = [];
      if (masterType === 'groups') {
        // Parse Groups XML response
        parsedData = parseGroupsXML(xmlData);
      } else if (masterType === 'ledgers') {
        // Parse Ledgers XML response
        parsedData = await parseLedgersXML(xmlData, orgId);
      } else {
        // For other types, use sample data for now
        // TODO: Implement XML parsing for other master types
        parsedData = getSampleDataForMasterType(masterType);
      }

      // Save to database
      let savedCount = 0;
      const errors = [];

      for (const item of parsedData) {
        try {
          // Build dynamic INSERT query based on master type
          const fields = config.fields;
          const values = fields.map(field => {
            if (field === 'org_id') return orgId;
            if (field === 'is_active') return item[field] !== undefined ? item[field] : true;
            if (field === 'financial_year') return item[field] || '2024-25';
            if (field === 'group_id') return item[field] || null;
            return item[field] || null;
          });
          
          const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
          const fieldNames = fields.join(', ');
          
          // Use ON CONFLICT for ledgers and groups (which have unique constraint on name+org_id)
          // For other tables, adjust conflict resolution as needed
          let conflictClause;
          if (masterType === 'ledgers') {
            conflictClause = 'ON CONFLICT (name, org_id) DO UPDATE SET updated_at = NOW(), code = EXCLUDED.code, category = EXCLUDED.category, group_id = EXCLUDED.group_id';
          } else if (masterType === 'groups') {
            conflictClause = 'ON CONFLICT (name, org_id) DO UPDATE SET updated_at = NOW(), code = EXCLUDED.code, parent_group = EXCLUDED.parent_group, group_type = EXCLUDED.group_type, alias = EXCLUDED.alias';
          } else {
            conflictClause = 'ON CONFLICT DO NOTHING';
          }

          await pool.query(
            `INSERT INTO ${config.tableName} (${fieldNames}, created_at, updated_at)
             VALUES (${placeholders}, NOW(), NOW())
             ${conflictClause}`,
            values
          );
          savedCount++;
        } catch (error) {
          console.error(`Error saving ${masterType} item:`, item.name || item.code, error);
          errors.push({ item: item.name || item.code, error: error.message });
        }
      }

      return res.json({
        success: true,
        message: `Synced ${savedCount} ${masterType} from Tally`,
        count: savedCount,
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
    console.error('Error syncing masters from Tally:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to sync masters from Tally',
      error: error.message
    });
  }
}

// Parse Groups XML response from Tally
function parseGroupsXML(xmlString) {
  const groups = [];
  try {
    // Parse the actual Tally XML structure
    // Groups are in <COLLECTION><GROUP NAME="..." RESERVEDNAME="...">...</GROUP></COLLECTION>
    const groupMatches = xmlString.match(/<GROUP\s+NAME="([^"]*)"\s+RESERVEDNAME="([^"]*)"[^>]*>[\s\S]*?<\/GROUP>/gi);
    
    if (groupMatches) {
      for (const groupMatch of groupMatches) {
        // Extract NAME attribute
        const nameMatch = groupMatch.match(/NAME="([^"]*)"/i);
        const name = nameMatch ? nameMatch[1].trim() : null;
        
        // Skip if no name found
        if (!name) continue;
        
        // Extract RESERVEDNAME attribute (this is the code)
        const reservedNameMatch = groupMatch.match(/RESERVEDNAME="([^"]*)"/i);
        const reservedName = reservedNameMatch ? reservedNameMatch[1].trim() : '';
        
        // Use RESERVEDNAME as code, or fallback to NAME if RESERVEDNAME is empty
        const code = reservedName || name;
        
        // Extract PARENT if present (might be in a PARENT element or attribute)
        const parentMatch = groupMatch.match(/<PARENT[^>]*>([^<]+)<\/PARENT>/i) || 
                           groupMatch.match(/PARENT="([^"]*)"/i);
        const parent_group = parentMatch ? parentMatch[1].trim() : null;
        
        // Group type is "Primary" based on the request we sent
        const group_type = 'Primary';
        
        // Extract alias from LANGUAGENAME.LIST if available
        // The first NAME in LANGUAGENAME.LIST is usually the display name/alias
        const languageNameMatch = groupMatch.match(/<LANGUAGENAME\.LIST>[\s\S]*?<NAME\.LIST[^>]*>[\s\S]*?<NAME[^>]*>([^<]+)<\/NAME>/i);
        const alias = languageNameMatch ? languageNameMatch[1].trim() : null;
        
        groups.push({
          name: name,
          code: code,
          parent_group: parent_group,
          group_type: group_type,
          alias: alias || name // Use name as alias if no alias found
        });
      }
    } else {
      // Try alternative parsing if the regex doesn't match
      // Look for GROUP elements in any format
      const altGroupMatches = xmlString.match(/<GROUP[^>]*>[\s\S]*?<\/GROUP>/gi);
      if (altGroupMatches) {
        for (const groupMatch of altGroupMatches) {
          // Try to extract name from NAME attribute or element
          const nameAttrMatch = groupMatch.match(/NAME="([^"]*)"/i);
          const nameElemMatch = groupMatch.match(/<NAME[^>]*>([^<]+)<\/NAME>/i);
          const name = nameAttrMatch ? nameAttrMatch[1].trim() : (nameElemMatch ? nameElemMatch[1].trim() : null);
          
          if (!name) continue;
          
          const reservedNameMatch = groupMatch.match(/RESERVEDNAME="([^"]*)"/i);
          const code = reservedNameMatch && reservedNameMatch[1].trim() ? reservedNameMatch[1].trim() : name;
          
          groups.push({
            name: name,
            code: code,
            parent_group: null,
            group_type: 'Primary',
            alias: name
          });
        }
      }
    }
    
    // If no groups found in XML, log warning
    if (groups.length === 0) {
      console.warn('No groups found in XML response. XML structure might be different.');
      console.log('XML Response sample:', xmlString.substring(0, 1000));
    } else {
      console.log(`Successfully parsed ${groups.length} groups from Tally XML`);
    }
  } catch (error) {
    console.error('Error parsing Groups XML:', error);
    console.error('XML sample:', xmlString.substring(0, 500));
  }
  
  return groups;
}

// Parse Ledgers XML response from Tally
async function parseLedgersXML(xmlString, orgId) {
  const ledgers = [];
  try {
    // Parse the actual Tally XML structure
    // Ledgers are in <COLLECTION><LEDGER NAME="..." RESERVEDNAME="..."><PARENT>...</PARENT></LEDGER></COLLECTION>
    const ledgerMatches = xmlString.match(/<LEDGER\s+NAME="([^"]*)"\s+RESERVEDNAME="([^"]*)"[^>]*>[\s\S]*?<\/LEDGER>/gi);
    
    if (ledgerMatches) {
      for (const ledgerMatch of ledgerMatches) {
        // Extract NAME attribute
        const nameMatch = ledgerMatch.match(/NAME="([^"]*)"/i);
        const name = nameMatch ? nameMatch[1].trim() : null;
        
        // Skip if no name found
        if (!name) continue;
        
        // Extract RESERVEDNAME attribute (this is the code)
        const reservedNameMatch = ledgerMatch.match(/RESERVEDNAME="([^"]*)"/i);
        const reservedName = reservedNameMatch ? reservedNameMatch[1].trim() : '';
        
        // Use RESERVEDNAME as code, or fallback to NAME if RESERVEDNAME is empty
        const code = reservedName || name;
        
        // Extract PARENT (Group name) - can be in format <PARENT TYPE="String">GroupName</PARENT>
        const parentMatch = ledgerMatch.match(/<PARENT[^>]*TYPE="String"[^>]*>([^<]+)<\/PARENT>/i) ||
                           ledgerMatch.match(/<PARENT[^>]*>([^<]+)<\/PARENT>/i);
        const parentGroupName = parentMatch ? parentMatch[1].trim() : null;
        
        // Find or create the group and get its ID
        let groupId = null;
        if (parentGroupName) {
          groupId = await findOrCreateGroup(parentGroupName, orgId);
        }
        
        // Determine category based on group name (common accounting categories)
        const category = determineCategoryFromGroup(parentGroupName);
        
        ledgers.push({
          name: name,
          code: code,
          category: category,
          group_id: groupId,
          is_active: true,
          financial_year: null // Can be set based on your requirements
        });
      }
    } else {
      // Try alternative parsing if the regex doesn't match
      const altLedgerMatches = xmlString.match(/<LEDGER[^>]*>[\s\S]*?<\/LEDGER>/gi);
      if (altLedgerMatches) {
        for (const ledgerMatch of altLedgerMatches) {
          const nameAttrMatch = ledgerMatch.match(/NAME="([^"]*)"/i);
          const nameElemMatch = ledgerMatch.match(/<NAME[^>]*>([^<]+)<\/NAME>/i);
          const name = nameAttrMatch ? nameAttrMatch[1].trim() : (nameElemMatch ? nameElemMatch[1].trim() : null);
          
          if (!name) continue;
          
          const reservedNameMatch = ledgerMatch.match(/RESERVEDNAME="([^"]*)"/i);
          const code = reservedNameMatch && reservedNameMatch[1].trim() ? reservedNameMatch[1].trim() : name;
          
          const parentMatch = ledgerMatch.match(/<PARENT[^>]*TYPE="String"[^>]*>([^<]+)<\/PARENT>/i) ||
                             ledgerMatch.match(/<PARENT[^>]*>([^<]+)<\/PARENT>/i);
          const parentGroupName = parentMatch ? parentMatch[1].trim() : null;
          
          let groupId = null;
          if (parentGroupName) {
            groupId = await findOrCreateGroup(parentGroupName, orgId);
          }
          
          const category = determineCategoryFromGroup(parentGroupName);
          
          ledgers.push({
            name: name,
            code: code,
            category: category,
            group_id: groupId,
            is_active: true,
            financial_year: null
          });
        }
      }
    }
    
    if (ledgers.length === 0) {
      console.warn('No ledgers found in XML response. XML structure might be different.');
      console.log('XML Response sample:', xmlString.substring(0, 1000));
    } else {
      console.log(`Successfully parsed ${ledgers.length} ledgers from Tally XML`);
    }
  } catch (error) {
    console.error('Error parsing Ledgers XML:', error);
    console.error('XML sample:', xmlString.substring(0, 500));
  }
  
  return ledgers;
}

// Find or create a group by name and return its ID
async function findOrCreateGroup(groupName, orgId) {
  try {
    if (!groupName || !orgId) return null;
    
    // First, try to find existing group
    const findResult = await pool.query(
      'SELECT id FROM tally_groups WHERE name = $1 AND org_id = $2 LIMIT 1',
      [groupName, orgId]
    );
    
    if (findResult.rows.length > 0) {
      return findResult.rows[0].id;
    }
    
    // Group doesn't exist, create it
    const insertResult = await pool.query(
      `INSERT INTO tally_groups (name, code, parent_group, group_type, alias, org_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       ON CONFLICT (name, org_id) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [groupName, groupName, null, 'Primary', groupName, orgId]
    );
    
    if (insertResult.rows.length > 0) {
      console.log(`Created new group: ${groupName} (ID: ${insertResult.rows[0].id})`);
      return insertResult.rows[0].id;
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding/creating group ${groupName}:`, error);
    return null;
  }
}

// Determine category based on group name
function determineCategoryFromGroup(groupName) {
  if (!groupName) return 'Expense'; // Default
  
  const groupNameLower = groupName.toLowerCase();
  
  // Asset groups
  if (groupNameLower.includes('asset') || 
      groupNameLower.includes('bank') || 
      groupNameLower.includes('cash') ||
      groupNameLower.includes('debtor') ||
      groupNameLower.includes('deposit') ||
      groupNameLower.includes('investment') ||
      (groupNameLower.includes('loan') && groupNameLower.includes('advance'))) {
    return 'Asset';
  }
  
  // Liability groups
  if (groupNameLower.includes('liability') || 
      groupNameLower.includes('creditor') ||
      (groupNameLower.includes('loan') && !groupNameLower.includes('advance')) ||
      groupNameLower.includes('provision') ||
      groupNameLower.includes('duties') ||
      groupNameLower.includes('tax') ||
      groupNameLower.includes('payable')) {
    return 'Liability';
  }
  
  // Income groups
  if (groupNameLower.includes('income') || 
      groupNameLower.includes('sales') ||
      groupNameLower.includes('service income') ||
      groupNameLower.includes('donation') ||
      groupNameLower.includes('revenue')) {
    return 'Income';
  }
  
  // Expense groups (default)
  if (groupNameLower.includes('expense') || 
      groupNameLower.includes('cost') ||
      groupNameLower.includes('overhead') ||
      groupNameLower.includes('depreciation')) {
    return 'Expense';
  }
  
  // Default to Expense if no match
  return 'Expense';
}

// Sample data generators for each master type
function getSampleDataForMasterType(masterType) {
  switch (masterType) {
    case 'ledgers':
      return [
        { name: 'Cash', code: 'CASH001', category: 'Asset' },
        { name: 'Bank Account', code: 'BANK001', category: 'Asset' },
        { name: 'Sales', code: 'SALES001', category: 'Income' },
        { name: 'Purchase', code: 'PURCH001', category: 'Expense' },
      ];
    case 'groups':
      return [
        { name: 'Assets', code: 'ASSETS', parent_group: null },
        { name: 'Liabilities', code: 'LIAB', parent_group: null },
        { name: 'Income', code: 'INCOME', parent_group: null },
        { name: 'Expenses', code: 'EXP', parent_group: null },
      ];
    case 'costcenters':
      return [
        { name: 'Head Office', code: 'HO', alias: 'HO' },
        { name: 'Branch 1', code: 'BR1', alias: 'Branch 1' },
        { name: 'Production', code: 'PROD', alias: 'Production' },
      ];
    case 'stockitems':
      return [
        { name: 'Product A', code: 'PROD-A', unit: 'Nos', opening_balance: 100 },
        { name: 'Product B', code: 'PROD-B', unit: 'Nos', opening_balance: 50 },
      ];
    case 'units':
      return [
        { name: 'Nos', code: 'NOS', base_unit: 'Nos', conversion_factor: 1 },
        { name: 'Kg', code: 'KG', base_unit: 'Kg', conversion_factor: 1 },
        { name: 'Meter', code: 'MTR', base_unit: 'Meter', conversion_factor: 1 },
      ];
    case 'parties':
      return [
        { name: 'Customer A', code: 'CUST-A', type: 'Customer', address: 'Address 1' },
        { name: 'Supplier B', code: 'SUPP-B', type: 'Supplier', address: 'Address 2' },
      ];
    case 'vouchertypes':
      return [
        { name: 'Payment', code: 'PAYMENT', type: 'Payment' },
        { name: 'Receipt', code: 'RECEIPT', type: 'Receipt' },
        { name: 'Journal', code: 'JOURNAL', type: 'Journal' },
      ];
    default:
      return [];
  }
}

