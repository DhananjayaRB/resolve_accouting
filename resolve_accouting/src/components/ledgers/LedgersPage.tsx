import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { LedgerCategory } from '../../types';
import { Plus, Filter, Search, Edit, Trash2, Eye, Power } from 'lucide-react';
import LedgerForm from './LedgerForm';
import { getStoredToken } from '../../utils/auth';

const LedgersPage: React.FC = () => {
  const { ledgerHeads, updateLedgerHead, deleteLedgerHead } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<any>(null);
  const [filter, setFilter] = useState<LedgerCategory | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingLedger, setEditingLedger] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [financialYears, setFinancialYears] = useState<any[]>([]);

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Ledger Heads Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center"
        >
          <Plus size={18} className="mr-1" /> Add Ledger Head
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
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

      {/* Ledger Table */}
      <div className="table-container">
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
                          ? 'bg-success-100 text-success-800'
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
                          ? 'bg-success-100 text-success-800'
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