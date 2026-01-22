import React, { useState } from 'react';
import { FileText, BarChart3, Search, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

// Journals Page
export const JournalsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const sampleJournals = [
    { id: 1, journalNo: 'JRN-001', date: new Date('2025-01-20'), description: 'Salary Payment', amount: 500000, entries: 25 },
    { id: 2, journalNo: 'JRN-002', date: new Date('2025-01-19'), description: 'Office Rent', amount: 150000, entries: 2 },
    { id: 3, journalNo: 'JRN-003', date: new Date('2025-01-18'), description: 'Utility Bills', amount: 45000, entries: 5 },
  ];

  const filteredJournals = sampleJournals.filter(j =>
    j.journalNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Journals</h2>
          <p className="text-gray-600 mt-1">View and manage accounting journal entries</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <FileText size={18} className="mr-1" /> New Journal
        </button>
      </div>

      <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 max-w-md">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search journals..."
          className="flex-grow focus:outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Journal No</th>
              <th className="table-header-cell">Date</th>
              <th className="table-header-cell">Description</th>
              <th className="table-header-cell">Amount</th>
              <th className="table-header-cell">Entries</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredJournals.map((j) => (
              <tr key={j.id} className="table-row">
                <td className="table-cell font-medium">{j.journalNo}</td>
                <td className="table-cell">{format(j.date, 'MMM dd, yyyy')}</td>
                <td className="table-cell">{j.description}</td>
                <td className="table-cell numeric">₹{j.amount.toLocaleString()}</td>
                <td className="table-cell">{j.entries}</td>
                <td className="table-cell"><button className="text-secondary-600"><FileText size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Trial Balance Page
export const TrialBalancePage: React.FC = () => {
  const sampleTrialBalance = [
    { account: 'Cash', debit: 500000, credit: 0, balance: 500000 },
    { account: 'Bank', debit: 2000000, credit: 0, balance: 2000000 },
    { account: 'Sales', debit: 0, credit: 1500000, balance: -1500000 },
    { account: 'Purchase', debit: 800000, credit: 0, balance: 800000 },
    { account: 'Salary Expense', debit: 500000, credit: 0, balance: 500000 },
  ];

  const totalDebit = sampleTrialBalance.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = sampleTrialBalance.reduce((sum, item) => sum + item.credit, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Trial Balance</h2>
          <p className="text-gray-600 mt-1">View trial balance as of selected date</p>
        </div>
        <button className="btn btn-secondary flex items-center">
          <Download size={18} className="mr-1" /> Export
        </button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Account</th>
              <th className="table-header-cell text-right">Debit</th>
              <th className="table-header-cell text-right">Credit</th>
              <th className="table-header-cell text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleTrialBalance.map((item, idx) => (
              <tr key={idx} className="table-row">
                <td className="table-cell font-medium">{item.account}</td>
                <td className="table-cell numeric text-right">{item.debit > 0 ? `₹${item.debit.toLocaleString()}` : '-'}</td>
                <td className="table-cell numeric text-right">{item.credit > 0 ? `₹${item.credit.toLocaleString()}` : '-'}</td>
                <td className={`table-cell numeric text-right ${item.balance < 0 ? 'text-red-600' : ''}`}>
                  ₹{Math.abs(item.balance).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="table-row font-semibold bg-gray-50">
              <td className="table-cell font-bold">Total</td>
              <td className="table-cell numeric text-right">₹{totalDebit.toLocaleString()}</td>
              <td className="table-cell numeric text-right">₹{totalCredit.toLocaleString()}</td>
              <td className="table-cell numeric text-right">₹{Math.abs(totalDebit - totalCredit).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

