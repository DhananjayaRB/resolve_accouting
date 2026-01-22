import React, { useState } from 'react';
import { FileCheck, CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

const ExpenseApprovalPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const sampleExpenses = [
    { id: 1, employee: 'John Doe', amount: 5000, category: 'Travel', date: new Date('2025-01-20'), status: 'Pending', description: 'Flight tickets' },
    { id: 2, employee: 'Jane Smith', amount: 2500, category: 'Meals', date: new Date('2025-01-19'), status: 'Approved', description: 'Client dinner' },
    { id: 3, employee: 'Bob Johnson', amount: 1500, category: 'Office Supplies', date: new Date('2025-01-18'), status: 'Rejected', description: 'Printer paper' },
    { id: 4, employee: 'Alice Brown', amount: 8000, category: 'Travel', date: new Date('2025-01-17'), status: 'Pending', description: 'Hotel booking' },
  ];

  const filteredExpenses = sampleExpenses.filter(exp =>
    exp.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle2 size={16} className="text-secondary-600" />;
      case 'Rejected': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-warning-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Expense Approval Status</h2>
        <p className="text-gray-600 mt-1">Review and approve expense submissions</p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search expenses..."
            className="flex-grow focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select text-sm py-2">
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Employee</th>
              <th className="table-header-cell">Amount</th>
              <th className="table-header-cell">Category</th>
              <th className="table-header-cell">Date</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredExpenses.map((exp) => (
              <tr key={exp.id} className="table-row">
                <td className="table-cell font-medium">{exp.employee}</td>
                <td className="table-cell numeric">₹{exp.amount.toLocaleString()}</td>
                <td className="table-cell">{exp.category}</td>
                <td className="table-cell">{format(exp.date, 'MMM dd, yyyy')}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(exp.status)}
                    <span className={`badge ${
                      exp.status === 'Approved' ? 'badge-success' :
                      exp.status === 'Rejected' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {exp.status}
                    </span>
                  </div>
                </td>
                <td className="table-cell">
                  <button className="text-secondary-600 hover:text-secondary-700">
                    <FileCheck size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseApprovalPage;

