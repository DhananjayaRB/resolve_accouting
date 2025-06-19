import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, BookOpen, Check, ArrowRight } from 'lucide-react';
import { LedgerCategory } from '../../types';

interface SetupLedgersProps {
  onNext: () => void;
}

const SetupLedgers: React.FC<SetupLedgersProps> = ({ onNext }) => {
  const { ledgerHeads, addLedgerHead } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    category: 'Expense' as LedgerCategory,
  });
  const [quickLedgers, setQuickLedgers] = useState([
    { name: 'Salary Expense', code: 'EXP001', category: 'Expense' as LedgerCategory, added: false },
    { name: 'Employee Salary Payable', code: 'LIA001', category: 'Liability' as LedgerCategory, added: false },
    { name: 'Bank Account', code: 'AST001', category: 'Asset' as LedgerCategory, added: false },
    { name: 'TDS Payable', code: 'LIA002', category: 'Liability' as LedgerCategory, added: false },
  ]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      alert('Ledger name is required');
      return;
    }
    
    addLedgerHead({
      ...formData,
      isActive: true,
    });
    
    // Reset form
    setFormData({
      name: '',
      code: '',
      category: 'Expense',
    });
  };

  const handleQuickAdd = (index: number) => {
    const ledger = quickLedgers[index];
    
    // Check if ledger already exists by name
    const exists = ledgerHeads.some(
      (head) => head.name.toLowerCase() === ledger.name.toLowerCase()
    );
    
    if (!exists) {
      addLedgerHead({
        name: ledger.name,
        code: ledger.code,
        category: ledger.category,
        isActive: true,
      });
    }
    
    // Mark as added
    const updatedLedgers = [...quickLedgers];
    updatedLedgers[index] = { ...updatedLedgers[index], added: true };
    setQuickLedgers(updatedLedgers);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center text-lg font-medium text-gray-900">
        <BookOpen className="h-6 w-6 text-primary-600 mr-2" />
        Step 1: Setup Ledger Heads
      </div>
      
      <p className="text-gray-600">
        Configure the ledger heads that will be used for your accounting entries. 
        These ledgers will be mapped to payroll items in the next step.
      </p>
      
      {/* Quick Add Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
        <h4 className="font-medium text-gray-800 mb-3">Quick Add Common Ledgers</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLedgers.map((ledger, index) => {
            const exists = ledgerHeads.some(
              (head) => head.name.toLowerCase() === ledger.name.toLowerCase()
            );
            const isDisabled = exists || ledger.added;
            
            return (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 bg-white rounded border ${
                  isDisabled 
                    ? 'border-gray-200' 
                    : 'border-gray-300 hover:border-primary-300 cursor-pointer'
                }`}
                onClick={() => !isDisabled && handleQuickAdd(index)}
              >
                <div>
                  <p className="font-medium text-gray-900">{ledger.name}</p>
                  <div className="flex items-center text-sm">
                    <span className="text-gray-500 mr-2">{ledger.code}</span>
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      ledger.category === 'Asset'
                        ? 'bg-success-100 text-success-800'
                        : ledger.category === 'Liability'
                        ? 'bg-warning-100 text-warning-800'
                        : ledger.category === 'Expense'
                        ? 'bg-error-100 text-error-800'
                        : 'bg-primary-100 text-primary-800'
                    }`}>
                      {ledger.category}
                    </span>
                  </div>
                </div>
                {isDisabled ? (
                  <Check size={18} className="text-success-500" />
                ) : (
                  <Plus size={18} className="text-primary-500" />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Manual Add Form */}
      <form onSubmit={handleSubmit} className="grid md:grid-cols-3 gap-4 p-4 border border-gray-200 rounded-lg">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Ledger Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="input mt-1"
            placeholder="e.g., Salary Expense"
          />
        </div>

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700">
            Accounting Code
          </label>
          <input
            type="text"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            className="input mt-1"
            placeholder="e.g., EXP001"
          />
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category *
          </label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className="select mt-1"
          >
            <option value="Asset">Asset</option>
            <option value="Liability">Liability</option>
            <option value="Expense">Expense</option>
            <option value="Income">Income</option>
          </select>
        </div>
        
        <div className="md:col-span-3 flex justify-end">
          <button
            type="submit"
            className="btn btn-primary flex items-center"
          >
            <Plus size={18} className="mr-1" /> Add Ledger
          </button>
        </div>
      </form>
      
      {/* Current Ledgers */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h4 className="font-medium text-gray-800">Current Ledgers</h4>
        </div>
        <div className="max-h-60 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ledgerHeads.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                    No ledgers defined yet. Add some to get started.
                  </td>
                </tr>
              ) : (
                ledgerHeads.map((ledger) => (
                  <tr key={ledger.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{ledger.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-500">{ledger.code || '-'}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-end mt-6">
        <button
          onClick={onNext}
          className="btn btn-primary flex items-center"
          disabled={ledgerHeads.length === 0}
        >
          Continue <ArrowRight size={18} className="ml-1" />
        </button>
      </div>
    </div>
  );
};

export default SetupLedgers;