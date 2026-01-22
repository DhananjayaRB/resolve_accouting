import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LedgerCategory } from '../../types';
import { Plus, Filter, Search, Edit, Trash2, Eye, Power, Download, Upload, RefreshCw } from 'lucide-react';
import LedgerForm from './LedgerForm';
import { getStoredToken } from '../../utils/auth';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';
import InfoIcon from '../common/InfoIcon';
import Loader from '../common/Loader';

const LedgersPage: React.FC = () => {
  const { ledgerHeads, updateLedgerHead, deleteLedgerHead, addLedgerHead } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<any>(null);
  const [filter, setFilter] = useState<LedgerCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLedger, setEditingLedger] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [financialYears, setFinancialYears] = useState<any[]>([]);
  const [isSyncingFromTally, setIsSyncingFromTally] = useState(false);

  useEffect(() => {
    console.log('Current ledger heads:', ledgerHeads);
    fetchFinancialYears();
  }, [ledgerHeads]);

  const fetchFinancialYears = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch('https://uat-api.resolveindia.com/user/financial-year', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch financial years:', errorText);
        throw new Error(`Failed to fetch financial years: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      console.log('Financial years data:', data);
      
      if (data.result === 'Success' && data.data.year_data) {
        setFinancialYears(data.data.year_data);
      } else {
        console.error('Invalid financial years response format:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching financial years:', error);
    }
  };

  const getFinancialYearName = (yearId: string) => {
    const year = financialYears.find(y => y.customer_year_details_id === yearId);
    return year ? year.year : yearId;
  };

  const handleEditClick = (ledgerId: string) => {
    setEditingLedger(ledgerId);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingLedger(null);
  };

  const handleToggleActive = (ledgerId: string, currentStatus: boolean) => {
    updateLedgerHead(ledgerId, { isActive: !currentStatus });
  };

  const handleDelete = async (ledgerId: string) => {
    if (window.confirm('Are you sure you want to delete this ledger?')) {
      try {
        await deleteLedgerHead(ledgerId);
      } catch (error) {
        console.error('Error deleting ledger:', error);
      }
    }
  };

  const handleViewClick = (ledger: any) => {
    setSelectedLedger(ledger);
    setShowViewModal(true);
  };

  const handleViewClose = () => {
    setShowViewModal(false);
    setSelectedLedger(null);
  };

  const handleSyncFromTally = async () => {
    setIsSyncingFromTally(true);
    try {
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        toast.error('Organization ID is required');
        setIsSyncingFromTally(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/tally/sync-ledgers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        body: JSON.stringify({ org_id })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully synced ${data.count || 0} ledger heads from Tally`);
        // Refresh the ledger heads list
        window.location.reload(); // Simple refresh, or you can call a refresh function
      } else {
        toast.error(data.message || 'Failed to sync from Tally');
      }
    } catch (error) {
      console.error('Error syncing from Tally:', error);
      toast.error('Error syncing from Tally. Please try again.');
    } finally {
      setIsSyncingFromTally(false);
    }
  };

  const handleDownloadExcel = () => {
    try {
      // If there are ledgers, export them; otherwise create a template
      const data = filteredLedgers.length > 0 
        ? filteredLedgers.map((ledger) => ({
            'Name': ledger.name,
            'Code': ledger.code || '',
            'Category': ledger.category,
            'Status': ledger.isActive ? 'Active' : 'Inactive',
            'Financial Year': ledger.financialYear || '',
            'Description': ledger.description || '',
          }))
        : [
            // Template with example row
            {
              'Name': 'Example Ledger',
              'Code': 'EX001',
              'Category': 'Expense',
              'Status': 'Active',
              'Financial Year': '',
              'Description': 'Example description',
            }
          ];

      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths for better readability
      const colWidths = [
        { wch: 30 }, // Name
        { wch: 15 }, // Code
        { wch: 15 }, // Category
        { wch: 12 }, // Status
        { wch: 15 }, // Financial Year
        { wch: 30 }, // Description
      ];
      ws['!cols'] = colWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Ledger Heads');
      
      const fileName = filteredLedgers.length > 0
        ? `ledger_heads_${new Date().toISOString().split('T')[0]}.xlsx`
        : `ledger_template.xlsx`;
      
      XLSX.writeFile(wb, fileName);
      toast.success(filteredLedgers.length > 0 
        ? 'Excel file downloaded successfully' 
        : 'Template downloaded successfully');
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast.error('Failed to download Excel file');
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
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error('Excel file is empty');
          e.target.value = '';
          return;
        }

        let successCount = 0;
        let errorCount = 0;
        const errors: string[] = [];

        // Process rows in batches to avoid overwhelming the UI
        for (const row: any of jsonData) {
          try {
            // Normalize column names (handle various formats)
            const name = row.Name || row.name || row['Ledger Name'] || '';
            const code = row.Code || row.code || row['Ledger Code'] || '';
            const category = (row.Category || row.category || 'Expense') as LedgerCategory;
            const status = row.Status || row.status || 'Active';
            const financialYear = row['Financial Year'] || row['FinancialYear'] || row.financialYear || row['Financial Year'] || '';
            const description = row.Description || row.description || '';

            // Validate required fields
            if (!name || name.trim() === '') {
              errors.push(`Row ${successCount + errorCount + 1}: Name is required`);
              errorCount++;
              continue;
            }

            // Validate category
            const validCategories: LedgerCategory[] = ['Asset', 'Liability', 'Expense', 'Income'];
            const normalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
            if (!validCategories.includes(normalizedCategory as LedgerCategory)) {
              errors.push(`Row ${successCount + errorCount + 1}: Invalid category "${category}". Must be one of: Asset, Liability, Expense, Income`);
              errorCount++;
              continue;
            }

            // Determine active status
            const isActive = status === 'Active' || status === 'active' || status === 'TRUE' || status === true || status === '';

            await addLedgerHead({
              name: name.trim(),
              code: code ? code.trim() : '',
              category: normalizedCategory as LedgerCategory,
              isActive,
              financialYear: financialYear ? financialYear.toString().trim() : '',
              description: description ? description.toString().trim() : '',
            }, true); // Silent mode for bulk import
            successCount++;
          } catch (error: any) {
            console.error('Error importing row:', row, error);
            errors.push(`Row ${successCount + errorCount + 1}: ${error.message || 'Failed to create ledger'}`);
            errorCount++;
          }
        }

        // Show summary toast
        if (successCount > 0) {
          toast.success(`Imported ${successCount} ledger${successCount > 1 ? 's' : ''} successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`);
        }
        
        // Show errors if any (but limit to avoid spam)
        if (errorCount > 0 && errors.length > 0) {
          const errorMessage = errors.length > 5 
            ? `${errors.slice(0, 5).join('; ')}... and ${errors.length - 5} more errors`
            : errors.join('; ');
          console.error('Import errors:', errors);
          // Only show first few errors in toast to avoid spam
          if (errors.length <= 3) {
            errors.forEach(err => toast.error(err));
          } else {
            toast.error(`${errorCount} rows failed. Check console for details.`);
          }
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

  const filteredLedgers = ledgerHeads
    .filter((ledger) => showInactive || ledger.isActive)
    .filter((ledger) => filter === 'All' || ledger.category === filter)
    .filter(
      (ledger) =>
        ledger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ledger.code?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    )
    .sort((a, b) => {
      // Get the most recent date (either created or updated)
      const aLatestDate = new Date(Math.max(
        new Date(a.createdAt).getTime(),
        new Date(a.updatedAt).getTime()
      ));
      const bLatestDate = new Date(Math.max(
        new Date(b.createdAt).getTime(),
        new Date(b.updatedAt).getTime()
      ));
      return bLatestDate.getTime() - aLatestDate.getTime();
    });

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      {/* Show loader overlay when syncing */}
      {isSyncingFromTally && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <Loader 
            message="Syncing Ledgers from Tally..."
            subMessage="Please wait while we fetch ledger heads"
            size="md"
            variant="compact"
          />
        </div>
      )}
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Ledger Heads Management</h2>
          <InfoIcon
            title="Ledger Heads Management"
            content="Manage your chart of accounts. Create, edit, and organize ledger heads by category (Asset, Liability, Expense, Income). Sync ledger heads directly from Tally or import/export via Excel."
          />
        </div>
        <div className="flex gap-2">
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
          <button
            onClick={handleSyncFromTally}
            disabled={isSyncingFromTally}
            className="btn btn-secondary flex items-center"
            title="Sync Ledger Heads from Tally"
          >
            <RefreshCw size={18} className={`mr-1 ${isSyncingFromTally ? 'animate-spin' : ''}`} />
            {isSyncingFromTally ? 'Syncing...' : 'Sync from Tally'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex items-center"
          >
            <Plus size={18} className="mr-1" /> Add Ledger Head
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center flex-shrink-0">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search ledgers..."
            className="flex-grow focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LedgerCategory | 'All')}
            className="select text-sm py-2"
          >
            <option value="All">All Categories</option>
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="showInactive"
            checked={showInactive}
            onChange={() => setShowInactive(!showInactive)}
            className="mr-2 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="showInactive" className="text-sm text-gray-700">
            Show Inactive
          </label>
        </div>
      </div>

      {/* Ledger Table - Scrollable */}
      <div className="table-container custom-scrollbar">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Name</th>
              <th className="table-header-cell">Code</th>
              <th className="table-header-cell">Category</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Financial Year</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {ledgerHeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No ledger heads found. Create one to get started.
                </td>
              </tr>
            ) : (
              ledgerHeads.map((ledger) => (
                <tr key={ledger.id} className="table-row">
                  <td className="table-cell font-medium text-gray-900">{ledger.name}</td>
                  <td className="table-cell">{ledger.code || '-'}</td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ledger.category === 'Asset'
                          ? 'bg-secondary-100 text-secondary-800'
                          : ledger.category === 'Liability'
                          ? 'bg-warning-100 text-warning-800'
                          : ledger.category === 'Expense'
                          ? 'bg-error-100 text-error-800'
                          : 'bg-primary-100 text-primary-800'
                      }`}
                    >
                      {ledger.category}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        ledger.isActive
                          ? 'bg-secondary-100 text-secondary-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {ledger.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">{getFinancialYearName(ledger.financialYear) || '-'}</td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleEditClick(ledger.id)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleViewClick(ledger)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(ledger.id)}
                        className="text-error-600 hover:text-error-900"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ledger Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <LedgerForm
              onClose={handleFormClose}
              editingLedgerId={editingLedger}
            />
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showViewModal && selectedLedger && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Ledger Details</h3>
              <button
                onClick={handleViewClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLedger.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Code</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLedger.code || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <p className="mt-1 text-sm text-gray-900">{selectedLedger.category}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="mt-1 text-sm text-gray-900">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedLedger.isActive
                        ? 'bg-success-100 text-success-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {selectedLedger.isActive ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Financial Year</label>
                <p className="mt-1 text-sm text-gray-900">{getFinancialYearName(selectedLedger.financialYear) || 'Current'}</p>
              </div>
              {selectedLedger.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedLedger.description}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={handleViewClose}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgersPage;