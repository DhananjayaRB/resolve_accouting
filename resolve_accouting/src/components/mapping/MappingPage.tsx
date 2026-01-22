import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Link2, Filter, Search, Plus, Save, Trash2, Eye, Download, Upload, Zap } from 'lucide-react';
import { PayrollItemType } from '../../types';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx-js-style';
import { createStyledWorksheet, styleHeaderRow, styleTitleCell } from '../../utils/excelStyles';
import InfoIcon from '../common/InfoIcon';
import LedgerSelect from '../common/LedgerSelect';

interface PayrollItem {
  id: string;
  name: string;
  type: PayrollItemType;
  description?: string;
  code?: string;
  isActive?: boolean;
  payGroup?: string;
  payCategory?: string;
  sequenceNo?: number;
}

interface LedgerHead {
  id: string;
  name: string;
  code?: string;
  isActive?: boolean;
}

const MappingPage: React.FC = () => {
  const { 
    payrollItems, 
    ledgerHeads, 
    payrollMappings,
    addPayrollMapping,
    updatePayrollMapping,
    deletePayrollMapping
  } = useApp();
  const [filter, setFilter] = useState<PayrollItemType | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayrollItem, setSelectedPayrollItem] = useState<string>('');
  const [selectedLedgerHead, setSelectedLedgerHead] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAutoMapping, setIsAutoMapping] = useState(false);
  
  // Filter active ledgers only
  const activeLedgerHeads = ledgerHeads.filter(ledger => ledger.isActive);
  console.log('Active ledger heads:', activeLedgerHeads);
  
  // Find existing mappings for each payroll item
  const getExistingMapping = (payrollItemId: string) => {
    const mapping = payrollMappings.find(mapping => mapping.payrollItemId === payrollItemId);
    console.log('Finding mapping for payroll item:', payrollItemId, 'Found:', mapping);
    return mapping;
  };

  // Add debug logging for initial data
  useEffect(() => {
    console.log('Initial Data:', {
      payrollItems,
      ledgerHeads,
      payrollMappings,
      activeLedgerHeads
    });
  }, []);

  // Initialize mappings when the table is empty
  useEffect(() => {
    const initializeMappings = async () => {
      if (isInitialized || payrollMappings.length > 0 || payrollItems.length === 0 || activeLedgerHeads.length === 0) {
        console.log('Skipping initialization:', {
          isInitialized,
          payrollMappingsLength: payrollMappings.length,
          payrollItemsLength: payrollItems.length,
          activeLedgerHeadsLength: activeLedgerHeads.length
        });
        return;
      }

      console.log('Initializing mappings...');
      setIsLoading(true);

      try {
        // Get default ledger heads based on type
        const defaultLedgers = {
          'Earning': activeLedgerHeads.find(l => l.name.toLowerCase().includes('salary expense')),
          'Deduction': activeLedgerHeads.find(l => l.name.toLowerCase().includes('deduction')),
          'Asset': activeLedgerHeads.find(l => l.name.toLowerCase().includes('bank')),
          'Liability': activeLedgerHeads.find(l => l.name.toLowerCase().includes('payable'))
        };

        // Create mappings for each payroll item
        for (const item of payrollItems) {
          const defaultLedger = defaultLedgers[item.type];
          if (defaultLedger) {
            console.log(`Creating mapping for ${item.name} to ${defaultLedger.name}`);
            await addPayrollMapping({
              payrollItemId: item.id,
              payrollItemName: item.name,
              ledgerHeadId: defaultLedger.id,
              ledgerHeadName: defaultLedger.name,
              financialYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
            });
          }
        }

        toast.success('Initial mappings created successfully');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing mappings:', error);
        toast.error('Failed to create initial mappings');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMappings();
  }, [payrollItems, activeLedgerHeads, payrollMappings.length, isInitialized, addPayrollMapping]);

  // Add debug logging for payroll mappings
  useEffect(() => {
    console.log('Current payroll mappings:', payrollMappings);
  }, [payrollMappings]);

  // Filter payroll items based on search term and filter
  const filteredPayrollItems = payrollItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || item.type === filter;
    return matchesSearch && matchesFilter;
  });

  console.log('Filtered payroll items:', filteredPayrollItems);

  const handleMappingChange = async (payrollItemId: string, ledgerHeadId: string) => {
    try {
      const existingMapping = getExistingMapping(payrollItemId);
      const payrollItem = payrollItems.find(item => item.id === payrollItemId);
      const ledgerHead = activeLedgerHeads.find(head => head.id === ledgerHeadId);

      if (!payrollItem || !ledgerHead) {
        throw new Error('Invalid payroll item or ledger head');
      }

      console.log('Updating mapping:', {
        payrollItemId,
        ledgerHeadId,
        existingMapping,
        payrollItem,
        ledgerHead
      });

      if (existingMapping) {
        await updatePayrollMapping(existingMapping.id, {
          ledgerHeadId,
          ledgerHeadName: ledgerHead.name
        });
      } else {
        const newMapping = await addPayrollMapping({
          payrollItemId,
          payrollItemName: payrollItem.name,
          ledgerHeadId,
          ledgerHeadName: ledgerHead.name,
          financialYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
        });
        console.log('New mapping created:', newMapping);
      }

      // Force a re-render by updating the search term
      setSearchTerm(prev => prev + ' ');
      setTimeout(() => setSearchTerm(prev => prev.trim()), 0);

      toast.success('Mapping updated successfully');
    } catch (error) {
      console.error('Error updating mapping:', error);
      toast.error('Failed to update mapping');
    }
  };

  const handleDeleteMapping = async (id: string) => {
    try {
      await deletePayrollMapping(id);
      toast.success('Mapping deleted successfully');
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error('Failed to delete mapping');
    }
  };

  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // ===== INSTRUCTIONS SHEET =====
      const instructionsData = [
        ['PAYROLL MAPPING TEMPLATE - INSTRUCTIONS'],
        [''],
        ['HOW TO USE THIS TEMPLATE:'],
        ['1. Go to the "Payroll Mappings" sheet to add your mapping entries'],
        ['2. Use the "Masters" sheet to see available dropdown values'],
        ['3. Fill in the required fields: Payroll Item, Mapped Ledger'],
        ['4. Optional fields: Type, Ledger ID, Financial Year'],
        [''],
        ['FIELD DESCRIPTIONS:'],
        ['• Payroll Item: Name of the payroll item (Required) - e.g., "Basic Salary", "HRA", "TDS"'],
        ['• Type: Payroll item type (Optional) - Earning, Deduction, Asset, Liability'],
        ['• Mapped Ledger: Name of the ledger to map (Required) - Must match a ledger from Ledgers page'],
        ['• Ledger ID: Ledger ID (Optional, will be looked up if empty)'],
        ['• Financial Year: Financial year (Optional) - e.g., "2024-25", "2025-26"'],
        [''],
        ['VALIDATION RULES:'],
        ['• Payroll Item must exist in your payroll system'],
        ['• Mapped Ledger must exist in your Ledgers list'],
        ['• Type must be one of: Earning, Deduction, Asset, Liability'],
        [''],
        ['IMPORTANT NOTES:'],
        ['• Delete the example row before adding your data'],
        ['• Do not modify the "Masters" sheet'],
        ['• Save the file before importing'],
        ['• You can map multiple payroll items in the same file'],
        [''],
        ['SUPPORT:'],
        ['For assistance, contact your system administrator'],
      ];

      const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
      wsInstructions['!cols'] = [{ wch: 80 }];
      styleTitleCell(wsInstructions, 'A1'); // Apply title style
      XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

      // ===== MASTERS SHEET =====
      const mastersData = [
        ['MASTER VALUES - Use these for dropdowns'],
        [''],
        ['PAYROLL ITEM TYPES'],
        ['Earning'],
        ['Deduction'],
        ['Asset'],
        ['Liability'],
        [''],
        ['COMMON FINANCIAL YEARS'],
        ['2024-25'],
        ['2025-26'],
        ['2026-27'],
        [''],
        ['COMMON PAYROLL ITEMS'],
        ['Basic Salary - Earning'],
        ['HRA (House Rent Allowance) - Earning'],
        ['DA (Dearness Allowance) - Earning'],
        ['TDS (Tax Deducted at Source) - Deduction'],
        ['PF (Provident Fund) - Deduction'],
        ['ESI (Employee State Insurance) - Deduction'],
        [''],
        ['COMMON LEDGER MAPPINGS'],
        ['Basic Salary → Salary Expense'],
        ['HRA → House Rent Allowance Expense'],
        ['TDS → TDS Payable'],
        ['PF → Provident Fund Payable'],
        ['ESI → ESI Payable'],
        [''],
        ['TIPS:'],
        ['• Copy values from this sheet to paste into the Payroll Mappings sheet'],
        ['• Use consistent naming conventions'],
        ['• Ensure ledger names match exactly with your Ledgers list'],
      ];

      const wsMasters = XLSX.utils.aoa_to_sheet(mastersData);
      wsMasters['!cols'] = [{ wch: 50 }];
      styleTitleCell(wsMasters, 'A1'); // Apply title style
      XLSX.utils.book_append_sheet(wb, wsMasters, 'Masters');

      // ===== PAYROLL MAPPINGS DATA SHEET =====
      // Always show only one sample record
      const data = [
        {
          'Payroll Item': 'Example Payroll Item',
          'Type': 'Earning',
          'Mapped Ledger': 'Example Ledger',
          'Ledger ID': '',
          'Financial Year': '2024-25',
        }
      ];

      // Add header row with instructions
      const headerRow = [
        {
          'Payroll Item': 'Payroll Item * (Required)',
          'Type': 'Type (Earning/Deduction/Asset/Liability)',
          'Mapped Ledger': 'Mapped Ledger * (Name from Ledgers)',
          'Ledger ID': 'Ledger ID (Optional, will be looked up if empty)',
          'Financial Year': 'Financial Year (Optional)',
        }
      ];

      const allData = [...headerRow, ...data];
      const ws = XLSX.utils.json_to_sheet(allData, { skipHeader: false });

      // Apply header styling
      styleHeaderRow(ws, Object.keys(headerRow[0]).length);

      // Set column widths for better readability
      const colWidths = [
        { wch: 30 }, // Payroll Item
        { wch: 15 }, // Type
        { wch: 30 }, // Mapped Ledger
        { wch: 15 }, // Ledger ID
        { wch: 18 }, // Financial Year
      ];
      ws['!cols'] = colWidths;

      // Freeze header row (first two rows)
      ws['!freeze'] = { xSplit: 0, ySplit: 2, topLeftCell: 'A3', activePane: 'bottomLeft' };

      XLSX.utils.book_append_sheet(wb, ws, 'Payroll Mappings');

      // Set active sheet to Payroll Mappings
      wb.Workbook = wb.Workbook || {};
      wb.Workbook.Views = [{ ActiveTab: 2 }]; // 0=Instructions, 1=Masters, 2=Payroll Mappings

      const fileName = `payroll_mapping_template.xlsx`;

      XLSX.writeFile(wb, fileName);
      toast.success('Template downloaded successfully with Instructions and Masters sheets');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file');
    }
  };

  // Calculate string similarity using Levenshtein distance
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    // Exact match
    if (s1 === s2) return 1.0;
    
    // Check if one contains the other
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.8;
    }
    
    // Check for common words
    const words1 = s1.split(/\s+/);
    const words2 = s2.split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w) && w.length > 2);
    if (commonWords.length > 0) {
      const similarity = commonWords.length / Math.max(words1.length, words2.length);
      return similarity * 0.7;
    }
    
    // Calculate Levenshtein distance
    const len1 = s1.length;
    const len2 = s2.length;
    const matrix: number[][] = [];
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j - 1] + 1
          );
        }
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    return 1 - (distance / maxLen);
  };

  // Find best matching ledger for a payroll item
  const findBestMatch = (payrollItemName: string, payrollItemType: PayrollItemType): { ledger: LedgerHead; score: number } | null => {
    let bestMatch: { ledger: LedgerHead; score: number } | null = null;
    let bestScore = 0;

    for (const ledger of activeLedgerHeads) {
      // Skip if ledger is already mapped to another item
      const isMapped = payrollMappings.some(m => m.ledgerHeadId === ledger.id);
      if (isMapped) continue;

      // Calculate similarity score
      const nameScore = calculateSimilarity(payrollItemName, ledger.name);
      
      // Boost score if category matches expected type
      let typeBonus = 0;
      if (payrollItemType === 'Earning' && (ledger.category === 'Expense' || ledger.name.toLowerCase().includes('salary'))) {
        typeBonus = 0.2;
      } else if (payrollItemType === 'Deduction' && (ledger.category === 'Liability' || ledger.name.toLowerCase().includes('deduction'))) {
        typeBonus = 0.2;
      } else if (payrollItemType === 'Asset' && ledger.category === 'Asset') {
        typeBonus = 0.2;
      } else if (payrollItemType === 'Liability' && ledger.category === 'Liability') {
        typeBonus = 0.2;
      }

      const totalScore = nameScore + typeBonus;

      if (totalScore > bestScore && totalScore >= 0.3) { // Minimum threshold of 30% similarity
        bestScore = totalScore;
        bestMatch = { ledger, score: totalScore };
      }
    }

    return bestMatch;
  };

  // Auto map all unmapped payroll items
  const handleAutoMap = async () => {
    if (!window.confirm('This will automatically map unmapped payroll items to similar ledger heads. Continue?')) {
      return;
    }

    setIsAutoMapping(true);
    let mappedCount = 0;
    let skippedCount = 0;
    const mappingResults: Array<{ payrollItem: string; ledger: string; score: number }> = [];

    try {
      // Get all unmapped payroll items
      const unmappedItems = payrollItems.filter(item => {
        const existingMapping = getExistingMapping(item.id);
        return !existingMapping;
      });

      if (unmappedItems.length === 0) {
        toast.info('All payroll items are already mapped');
        setIsAutoMapping(false);
        return;
      }

      // Map each unmapped item
      for (const item of unmappedItems) {
        const match = findBestMatch(item.name, item.type);
        
        if (match && match.score >= 0.3) {
          try {
            await addPayrollMapping({
              payrollItemId: item.id,
              payrollItemName: item.name,
              ledgerHeadId: match.ledger.id,
              ledgerHeadName: match.ledger.name,
              financialYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
            }, true); // Silent mode - don't show individual toasts
            mappedCount++;
            mappingResults.push({
              payrollItem: item.name,
              ledger: match.ledger.name,
              score: match.score
            });
          } catch (error) {
            console.error(`Error mapping ${item.name}:`, error);
            skippedCount++;
          }
        } else {
          skippedCount++;
        }
      }

      // Show single summary toast
      if (mappedCount > 0) {
        toast.success(`Auto-mapped ${mappedCount} payroll item${mappedCount > 1 ? 's' : ''} successfully${skippedCount > 0 ? `. ${skippedCount} item${skippedCount > 1 ? 's' : ''} skipped` : ''}`);
        
        // Log detailed results to console
        console.log('Auto-mapping results:', mappingResults);
      } else {
        toast.info('No suitable matches found for unmapped items');
      }
    } catch (error) {
      console.error('Error during auto-mapping:', error);
      toast.error('Error during auto-mapping');
    } finally {
      setIsAutoMapping(false);
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Try to find the Payroll Mappings sheet, or use the first sheet
        let sheetName = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('payroll') || name.toLowerCase().includes('mapping')
        ) || workbook.SheetNames[0];
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Skip the first two header rows (instructions and actual headers)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: 2 });

        if (jsonData.length === 0) {
          toast.error('Excel file is empty or only contains headers');
          e.target.value = '';
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        for (const row: any of jsonData) {
          try {
            // Skip header rows that contain instructions (like "Payroll Item * (Required)")
            if (row['Payroll Item'] && (
              row['Payroll Item'].includes('*') || 
              row['Payroll Item'].includes('Required') || 
              row['Payroll Item'].includes('Optional')
            )) {
              continue;
            }

            const payrollItemName = row['Payroll Item'] || row['Payroll Item * (Required)'] || row['Payroll Item Name'] || row.payrollItem || '';
            const ledgerName = row['Mapped Ledger'] || row['Mapped Ledger * (Name from Ledgers)'] || row['Ledger'] || row.ledgerHeadName || '';
            const ledgerId = row['Ledger ID'] || row['Ledger ID (Optional, will be looked up if empty)'] || row.ledgerHeadId || '';
            const financialYear = row['Financial Year'] || row['Financial Year (Optional)'] || '';

            if (!payrollItemName || !ledgerName) {
              errors.push(`Row ${successCount + errorCount + 3}: Payroll Item and Mapped Ledger are required`);
              errorCount++;
              continue;
            }

            const payrollItem = payrollItems.find(item => item.name === payrollItemName);
            const ledgerHead = activeLedgerHeads.find(head => 
              head.name === ledgerName || head.id === ledgerId
            );

            if (!payrollItem) {
              errors.push(`Row ${successCount + errorCount + 3}: Payroll Item "${payrollItemName}" not found`);
              errorCount++;
              continue;
            }

            if (!ledgerHead) {
              errors.push(`Row ${successCount + errorCount + 3}: Ledger "${ledgerName}" not found`);
              errorCount++;
              continue;
            }

            const existingMapping = getExistingMapping(payrollItem.id);
            if (existingMapping) {
              await updatePayrollMapping(existingMapping.id, {
                ledgerHeadId: ledgerHead.id,
                ledgerHeadName: ledgerHead.name,
                financialYear: financialYear || existingMapping.financialYear,
              });
            } else {
              await addPayrollMapping({
                payrollItemId: payrollItem.id,
                payrollItemName: payrollItem.name,
                ledgerHeadId: ledgerHead.id,
                ledgerHeadName: ledgerHead.name,
                financialYear: financialYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
              }, true); // Silent mode
            }
            successCount++;
          } catch (error: any) {
            errors.push(`Row ${successCount + errorCount + 3}: ${error.message || 'Unknown error'}`);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} payroll mapping${successCount > 1 ? 's' : ''}.`);
        }
        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} mapping${errorCount > 1 ? 's' : ''}. See console for details.`);
          console.error('Import errors:', errors);
        }
        if (successCount === 0 && errorCount === 0) {
          toast.info('No valid payroll mapping data found to import.');
        }

        e.target.value = ''; // Reset input
      } catch (error) {
        console.error('Error importing Excel:', error);
        toast.error('Failed to import Excel file. Please check the file format.');
        e.target.value = ''; // Reset input
      }
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Payroll Mapping</h2>
          <InfoIcon
            title="Payroll Mapping"
            content="Map payroll items (salary components) to ledger heads for accounting integration. This mapping determines how payroll transactions are recorded in your accounting system when synced to Tally."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAutoMap}
            disabled={isAutoMapping || payrollItems.length === 0 || activeLedgerHeads.length === 0}
            className="btn btn-primary flex items-center"
            title="Auto Map based on similar names"
          >
            <Zap size={18} className={`mr-1 ${isAutoMapping ? 'animate-pulse' : ''}`} />
            {isAutoMapping ? 'Auto Mapping...' : 'Auto Map'}
          </button>
          <button
            onClick={handleDownloadExcel}
            className="btn btn-secondary flex items-center"
            title="Download as Excel"
          >
            <Download size={18} className="mr-1" /> Download Excel
          </button>
          <label className="btn btn-secondary flex items-center cursor-pointer" title="Import from Excel">
            <Upload size={18} className="mr-1" /> Import Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>
        </div>
      </div>
      
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search payroll items..."
            className="flex-grow focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as PayrollItemType | 'All')}
            className="select text-sm py-2"
          >
            <option value="All">All Types</option>
            <option value="Earning">Earnings</option>
            <option value="Deduction">Deductions</option>
            <option value="Asset">Assets</option>
            <option value="Liability">Liabilities</option>
          </select>
        </div>
      </div>
      
      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Payroll Item</th>
              <th className="table-header-cell">Type</th>
              <th className="table-header-cell">Mapped Ledger</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredPayrollItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-cell text-center py-4 text-gray-500">
                  No payroll items found matching your search
                </td>
              </tr>
            ) : (
              filteredPayrollItems.map((item) => {
                const existingMapping = getExistingMapping(item.id);
                console.log('Rendering item:', item.name, 'with mapping:', existingMapping);
                return (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <span className="font-medium text-gray-900">{item.name}</span>
                        {item.description && (
                          <p className="text-sm text-gray-500">{item.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.type === 'Earning'
                            ? 'bg-secondary-100 text-secondary-800'
                            : item.type === 'Deduction'
                            ? 'bg-error-100 text-error-800'
                            : item.type === 'Asset'
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-warning-100 text-warning-800'
                        }`}
                      >
                        {item.type}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="min-w-[280px]">
                        <LedgerSelect
                          ledgers={activeLedgerHeads.filter(ledger => {
                            // Include the currently mapped ledger for this item
                            if (existingMapping?.ledgerHeadId === ledger.id) {
                              return true;
                            }
                            // Exclude ledgers that are mapped to other items
                            return !payrollMappings.some(mapping => 
                              mapping.ledgerHeadId === ledger.id && 
                              mapping.payrollItemId !== item.id
                            );
                          })}
                          value={existingMapping?.ledgerHeadId || ''}
                          onChange={(ledgerId) => handleMappingChange(item.id, ledgerId)}
                          placeholder="Select Ledger"
                          showCode={true}
                        />
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex space-x-2">
                        {existingMapping ? (
                          <button
                            className="text-gray-400 cursor-not-allowed"
                            disabled
                          >
                            <Link2 size={16} />
                          </button>
                        ) : (
                          <button
                            className="text-gray-400 cursor-not-allowed"
                            disabled
                          >
                            <Link2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      
      {/* Summary Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h3 className="text-md font-semibold text-gray-800 mb-2">Mapping Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-xs text-gray-500">Total Items</p>
            <p className="text-lg font-semibold">{payrollItems.length}</p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-xs text-gray-500">Mapped Items</p>
            <p className="text-lg font-semibold">{payrollMappings.length}</p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-xs text-gray-500">Unmapped Items</p>
            <p className="text-lg font-semibold">{payrollItems.length - payrollMappings.length}</p>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <p className="text-xs text-gray-500">Active Ledgers</p>
            <p className="text-lg font-semibold">{activeLedgerHeads.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MappingPage;