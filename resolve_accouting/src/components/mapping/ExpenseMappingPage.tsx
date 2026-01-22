import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Filter, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { PayrollItemType } from '../../types';

interface ExpenseItem {
  id: string;
  name: string;
  description?: string;
  payGroup?: string;
  payCategory?: string;
  type?: PayrollItemType;
}

const ExpenseMappingPage: React.FC = () => {
  const {
    payrollItems,
    ledgerHeads,
    payrollMappings,
    addPayrollMapping,
    updatePayrollMapping,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('All');

  // Treat payroll items with a payCategory or payGroup as expenses for this view
  const expenseItems: ExpenseItem[] = payrollItems
    .filter((item) => item.payCategory || item.payGroup)
    .map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      payGroup: item.payGroup,
      payCategory: item.payCategory,
      type: item.type,
    }));

  const activeLedgerHeads = ledgerHeads.filter((ledger) => ledger.isActive);

  const getExistingMapping = (expenseId: string) => {
    return payrollMappings.find((mapping) => mapping.payrollItemId === expenseId);
  };

  const filteredExpenseItems = expenseItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup =
      filterGroup === 'All' ||
      item.payCategory === filterGroup ||
      item.payGroup === filterGroup;
    return matchesSearch && matchesGroup;
  });

  const handleMappingChange = async (expenseId: string, ledgerHeadId: string) => {
    try {
      const existingMapping = getExistingMapping(expenseId);
      const expenseItem = expenseItems.find((item) => item.id === expenseId);
      const ledgerHead = activeLedgerHeads.find((head) => head.id === ledgerHeadId);

      if (!expenseItem || !ledgerHead) {
        throw new Error('Invalid expense item or ledger head');
      }

      if (existingMapping) {
        await updatePayrollMapping(existingMapping.id, {
          ledgerHeadId,
          ledgerHeadName: ledgerHead.name,
        });
      } else {
        await addPayrollMapping({
          payrollItemId: expenseItem.id,
          payrollItemName: expenseItem.name,
          ledgerHeadId,
          ledgerHeadName: ledgerHead.name,
          financialYear:
            new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        });
      }

      toast.success('Expense mapping updated successfully');
    } catch (error) {
      console.error('Error updating expense mapping:', error);
      toast.error('Failed to update expense mapping');
    }
  };

  // Collect unique groups for the filter dropdown
  const uniqueGroups = Array.from(
    new Set(
      expenseItems
        .map((item) => item.payCategory || item.payGroup)
        .filter((v): v is string => Boolean(v)),
    ),
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Expense Mapping</h2>
      </div>

      <div className="card p-4 mb-6">
        <p className="text-gray-600">
          Map your expense heads to corresponding ledger heads. Each expense head
          should be mapped to the correct ledger to ensure accurate accounting.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search expense heads..."
            className="flex-grow focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="select text-sm py-2"
          >
            <option value="All">All Expense Groups</option>
            {uniqueGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Expense Head</th>
              <th className="table-header-cell">Expense Group</th>
              <th className="table-header-cell">Ledger Mapping</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredExpenseItems.length === 0 ? (
              <tr>
                <td
                  colSpan={3}
                  className="table-cell text-center py-4 text-gray-500"
                >
                  No expense heads found matching your search
                </td>
              </tr>
            ) : (
              filteredExpenseItems.map((item) => {
                const existingMapping = getExistingMapping(item.id);

                return (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell">
                      <div>
                        <span className="font-medium text-gray-900">
                          {item.name}
                        </span>
                        {item.description && (
                          <p className="text-sm text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-800">
                        {item.payCategory || item.payGroup || '-'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <select
                        className="select text-sm py-1.5"
                        value={existingMapping?.ledgerHeadId || ''}
                        onChange={(e) =>
                          handleMappingChange(item.id, e.target.value)
                        }
                      >
                        <option value="">-- Select Ledger --</option>
                        {activeLedgerHeads
                          .filter((ledger) => {
                            if (existingMapping?.ledgerHeadId === ledger.id) {
                              return true;
                            }
                            return !payrollMappings.some(
                              (mapping) =>
                                mapping.ledgerHeadId === ledger.id &&
                                mapping.payrollItemId !== item.id,
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

export default ExpenseMappingPage;


