import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LedgerCategory, LedgerHead } from '../../types';
import { X } from 'lucide-react';
import { getStoredToken } from '../../utils/auth';

interface LedgerFormProps {
  onClose: () => void;
  editingLedgerId: string | null;
}

interface FinancialYear {
  customer_year_details_id: string;
  year: string;
  year_data: string;
  period_start_date: string;
  period_end_date: string;
}

interface FinancialYearResponse {
  result: string;
  statuscode: number;
  message: string;
  data: {
    financial_year_data: FinancialYear[];
    year_data: FinancialYear[];
  }
}

const LedgerForm: React.FC<LedgerFormProps> = ({ onClose, editingLedgerId }) => {
  const { ledgerHeads, addLedgerHead, updateLedgerHead } = useApp();
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    code: string;
    category: LedgerCategory;
    isActive: boolean;
    financialYear?: string;
  }>({
    name: '',
    code: '',
    category: 'Expense',
    isActive: true,
    financialYear: '',
  });

  useEffect(() => {
    fetchFinancialYears();
  }, []);

  const fetchFinancialYears = async () => {
    try {
      setIsLoading(true);
      const token = getStoredToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://uat-api.resolveindia.com/user/financial-year', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch financial years');
      }

      const data: FinancialYearResponse = await response.json();
      console.log('Financial years data:', data);
      
      if (data.result === 'Success' && data.data.year_data) {
        setFinancialYears(data.data.year_data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching financial years:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (editingLedgerId) {
      const ledgerToEdit = ledgerHeads.find(
        (ledger) => ledger.id === editingLedgerId
      );
      if (ledgerToEdit) {
        console.log('Editing ledger:', ledgerToEdit);
        
        // Find the financial year ID if we have a year name
        let financialYearId = ledgerToEdit.financialYear || '';
        if (ledgerToEdit.financialYear && financialYears.length > 0) {
          const yearData = financialYears.find(y => y.year === ledgerToEdit.financialYear);
          if (yearData) {
            financialYearId = yearData.customer_year_details_id;
          }
        }
        
        setFormData({
          name: ledgerToEdit.name,
          code: ledgerToEdit.code || '',
          category: ledgerToEdit.category,
          isActive: ledgerToEdit.isActive,
          financialYear: financialYearId,
        });
      }
    }
  }, [editingLedgerId, ledgerHeads, financialYears]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: (e.target as HTMLInputElement).checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      alert('Ledger name is required');
      return;
    }

    // Ensure financial year is included in the update and isActive defaults to true
    const updateData = {
      ...formData,
      financialYear: formData.financialYear || undefined,
      isActive: formData.isActive ?? true
    };

    if (editingLedgerId) {
      updateLedgerHead(editingLedgerId, {
        ...updateData,
        updatedAt: new Date().toISOString(),
      });
    } else {
      addLedgerHead(updateData);
    }
    
    onClose();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {editingLedgerId ? 'Edit Ledger Head' : 'Create New Ledger Head'}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
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

          <div>
            <label htmlFor="financialYear" className="block text-sm font-medium text-gray-700">
              Financial Year
            </label>
            <select
              id="financialYear"
              name="financialYear"
              value={formData.financialYear || ''}
              onChange={handleChange}
              className="select mt-1"
              disabled={isLoading}
            >
              <option value="">Select Financial Year</option>
              {financialYears.map((year) => (
                <option key={year.customer_year_details_id} value={year.customer_year_details_id}>
                  {year.year}
                </option>
              ))}
            </select>
            {isLoading && (
              <p className="text-xs text-gray-500 mt-1">
                Loading financial years...
              </p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active Ledger
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
          >
            {editingLedgerId ? 'Update Ledger' : 'Create Ledger'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LedgerForm;