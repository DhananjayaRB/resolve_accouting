import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, ArrowLeft, Link2, Check, X } from 'lucide-react';

interface SetupMappingProps {
  onNext: () => void;
  onBack: () => void;
}

const SetupMapping: React.FC<SetupMappingProps> = ({ onNext, onBack }) => {
  const { payrollItems, ledgerHeads, payrollMappings, addPayrollMapping, deletePayrollMapping } = useApp();
  
  // Get only active ledgers
  const activeLedgers = ledgerHeads.filter(ledger => ledger.isActive);
  
  // Pre-populate the form with existing mappings
  const [mappingState, setMappingState] = useState<Record<string, string>>(
    payrollMappings.reduce((acc, mapping) => {
      acc[mapping.payrollItemId] = mapping.ledgerHeadId;
      return acc;
    }, {} as Record<string, string>)
  );
  
  const handleMappingChange = (payrollItemId: string, ledgerHeadId: string) => {
    setMappingState(prev => ({
      ...prev,
      [payrollItemId]: ledgerHeadId,
    }));
  };
  
  const handleSaveMapping = () => {
    // Only add new mappings based on the form state
    Object.entries(mappingState).forEach(([payrollItemId, ledgerHeadId]) => {
      if (ledgerHeadId) {
        addPayrollMapping({
          payrollItemId,
          ledgerHeadId,
          financialYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
        });
      }
    });
    onNext();
  };

  const unmappedItems = payrollItems.filter(
    item => !mappingState[item.id]
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center text-lg font-medium text-gray-900">
        <Link2 className="h-6 w-6 text-primary-600 mr-2" />
        Step 2: Map Payroll Items to Ledgers
      </div>
      
      <p className="text-gray-600">
        Link each payroll item to the appropriate ledger head. This mapping will be used 
        when generating accounting entries in your payroll journal.
      </p>
      
      {/* Mapping Progress */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-gray-800">Mapping Progress</h4>
          <span className="text-sm font-medium text-gray-600">
            {payrollItems.length - unmappedItems}/{payrollItems.length} items mapped
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${((payrollItems.length - unmappedItems) / payrollItems.length) * 100}%` }}
          ></div>
        </div>
        {unmappedItems > 0 && (
          <p className="text-sm text-warning-600 mt-2">
            You have {unmappedItems} unmapped items. It's recommended to map all items.
          </p>
        )}
      </div>
      
      {/* Mapping Form */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h4 className="font-medium text-gray-800">Payroll Item Mapping</h4>
        </div>
        
        <div className="divide-y divide-gray-200">
          {payrollItems.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="mb-3 md:mb-0">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span
                      className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
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
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  )}
                </div>
                
                <div className="flex items-center">
                  <select
                    value={mappingState[item.id] || ''}
                    onChange={(e) => handleMappingChange(item.id, e.target.value)}
                    className="select text-sm py-1.5 min-w-[200px]"
                  >
                    <option value="">-- Select Ledger --</option>
                    {activeLedgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>
                        {ledger.name} {ledger.code ? `(${ledger.code})` : ''}
                      </option>
                    ))}
                  </select>
                  
                  {mappingState[item.id] ? (
                    <Check size={18} className="ml-2 text-success-500" />
                  ) : (
                    <X size={18} className="ml-2 text-warning-500" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="btn btn-secondary flex items-center"
        >
          <ArrowLeft size={18} className="mr-1" /> Back
        </button>
        
        <button
          onClick={handleSaveMapping}
          className="btn btn-primary flex items-center"
          disabled={unmappedItems === payrollItems.length}
        >
          Continue <ArrowRight size={18} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default SetupMapping;