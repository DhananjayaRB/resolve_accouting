import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Link2, Filter, Search, Plus, Save, Trash2, Eye } from 'lucide-react';
import { PayrollItemType } from '../../types';
import toast from 'react-hot-toast';

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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800"></h2>
      </div> ledg
      
      <div className="card p-4 mb-6">
        <p className="text-gray-600">
          Map your payroll items to corresponding ledger heads to ensure accurate accounting entries. 
          Each payroll item should be mapped to an appropriate ledger head based on its type.
        </p>
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
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Payroll Item</th>
              <th className="table-header">Type</th>
              <th className="table-header">Mapped Ledger</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
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
                  <tr key={item.id} className="hover:bg-gray-50">
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
                            ? 'bg-success-100 text-success-800'
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
                      <select
                        className="select text-sm py-1.5"
                        value={existingMapping?.ledgerHeadId || ''}
                        onChange={(e) => handleMappingChange(item.id, e.target.value)}
                      >
                        <option value="">-- Select Ledger --</option>
                        {activeLedgerHeads
                          .filter(ledger => {
                            // Include the currently mapped ledger for this item
                            if (existingMapping?.ledgerHeadId === ledger.id) {
                              return true;
                            }
                            // Exclude ledgers that are mapped to other items
                            return !payrollMappings.some(mapping => 
                              mapping.ledgerHeadId === ledger.id && 
                              mapping.payrollItemId !== item.id
                            );
                          })
                          .map((ledger) => (
                            <option key={ledger.id} value={ledger.id}>
                              {ledger.name}
                            </option>
                          ))}
                      </select>
                      {existingMapping && (
                        <div className="mt-1 text-sm text-gray-500">
                          Currently mapped to: {existingMapping.ledgerHeadName}
                        </div>
                      )}
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