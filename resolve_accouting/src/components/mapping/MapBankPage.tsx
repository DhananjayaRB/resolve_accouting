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

const MapBankPage: React.FC = () => {
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
    return payrollMappings.find(mapping => mapping.payrollItemId === payrollItemId);
  };

  // Initialize mappings when the table is empty
  useEffect(() => {
    const initializeMappings = async () => {
      if (isInitialized || payrollMappings.length > 0 || payrollItems.length === 0 || activeLedgerHeads.length === 0) {
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
      </div>
      
      <div className="card p-4 mb-6">
        <p className="text-gray-600">
          Map your bank accounts to corresponding ledger heads to ensure accurate accounting entries. 
          Each bank account should be mapped to an appropriate ledger head.
        </p>
      </div>
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search bank accounts..."
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
            <option value="Asset">Bank Accounts</option>
            <option value="Liability">Payables</option>
          </select>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="table-header">Bank Account</th>
              <th className="table-header">Type</th>
              <th className="table-header">Mapped Ledger</th>
              <th className="table-header">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredPayrollItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-cell text-center py-4 text-gray-500">
                  No bank accounts found matching your search
                </td>
              </tr>
            ) : (
              filteredPayrollItems.map((item) => {
                const existingMapping = getExistingMapping(item.id);
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
                          item.type === 'Asset'
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
                            // Only show ledgers that are not mapped to other items
                            // or are mapped to the current item
                            const otherMapping = payrollMappings.find(
                              m => m.ledgerHeadId === ledger.id && m.payrollItemId !== item.id
                            );
                            return !otherMapping || existingMapping?.ledgerHeadId === ledger.id;
                          })
                          .map(ledger => (
                            <option key={ledger.id} value={ledger.id}>
                              {ledger.name}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        {existingMapping && (
                          <button
                            onClick={() => handleDeleteMapping(existingMapping.id)}
                            className="text-error-600 hover:text-error-800"
                            title="Delete mapping"
                          >
                            <Trash2 size={18} />
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
    </div>
  );
};

export default MapBankPage; 