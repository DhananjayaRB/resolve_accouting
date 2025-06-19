import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Download, FileSpreadsheet, ExternalLink, Info } from 'lucide-react';
import { format } from 'date-fns';

interface JournalPreviewProps {
  journalId: string;
  onClose: () => void;
}

const formatCurrency = (amount?: number) => {
  if (amount === undefined) return '';
  // Format as Indian Rupees with commas
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount / 100); // Assuming amount is stored in paise
};

const JournalPreview: React.FC<JournalPreviewProps> = ({ journalId, onClose }) => {
  const { payrollJournals } = useApp();
  const journal = payrollJournals.find(j => j.id === journalId);
  
  if (!journal) {
    return (
      <div className="p-4 text-center">
        <p>Journal not found</p>
        <button onClick={onClose} className="btn btn-secondary mt-4">Close</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{journal.name}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-4">
        <div className="bg-gray-50 px-3 py-2 rounded-md flex items-center">
          <span className="text-xs text-gray-500 mr-2">Period:</span>
          <span className="text-sm font-medium">
            {format(new Date(journal.periodStart), 'MMM d, yyyy')} - {format(new Date(journal.periodEnd), 'MMM d, yyyy')}
          </span>
        </div>
        
        <div className="bg-gray-50 px-3 py-2 rounded-md flex items-center">
          <span className="text-xs text-gray-500 mr-2">Status:</span>
          <span className="text-sm font-medium">
            {journal.status}
          </span>
        </div>
        
        <div className="bg-gray-50 px-3 py-2 rounded-md flex items-center">
          <span className="text-xs text-gray-500 mr-2">Created:</span>
          <span className="text-sm font-medium">
            {format(new Date(journal.createdAt), 'MMM d, yyyy')}
          </span>
        </div>
      </div>
      
      {/* Journal Entries Table */}
      <div className="table-container mb-4">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Date</th>
              <th className="table-header-cell">Ledger</th>
              <th className="table-header-cell">Description</th>
              <th className="table-header-cell">Reference</th>
              <th className="table-header-cell text-right">Debit</th>
              <th className="table-header-cell text-right">Credit</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {journal.entries.map((entry) => (
              <tr key={entry.id} className="table-row">
                <td className="table-cell">
                  {format(new Date(entry.date), 'dd/MM/yyyy')}
                </td>
                <td className="table-cell font-medium">{entry.ledgerName}</td>
                <td className="table-cell">{entry.description}</td>
                <td className="table-cell text-sm text-gray-500">{entry.reference}</td>
                <td className="table-cell text-right">
                  {entry.debit ? formatCurrency(entry.debit) : ''}
                </td>
                <td className="table-cell text-right">
                  {entry.credit ? formatCurrency(entry.credit) : ''}
                </td>
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="bg-gray-50 font-semibold">
              <td colSpan={4} className="px-6 py-4 text-sm text-gray-700 text-right">
                Totals
              </td>
              <td className="table-cell text-right text-success-700">
                {formatCurrency(journal.totalDebit)}
              </td>
              <td className="table-cell text-right text-success-700">
                {formatCurrency(journal.totalCredit)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Balance Info */}
      {journal.totalDebit === journal.totalCredit ? (
        <div className="bg-success-50 border border-success-200 rounded-md p-3 flex items-center mb-6">
          <Info size={18} className="text-success-600 mr-2" />
          <span className="text-success-700 text-sm">
            This journal is balanced. Total debits equal total credits.
          </span>
        </div>
      ) : (
        <div className="bg-error-50 border border-error-200 rounded-md p-3 flex items-center mb-6">
          <Info size={18} className="text-error-600 mr-2" />
          <span className="text-error-700 text-sm">
            This journal is not balanced. Please review the entries.
          </span>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          className="btn btn-secondary flex items-center"
        >
          <Download size={16} className="mr-1" /> Excel
        </button>
        <button
          type="button"
          className="btn btn-secondary flex items-center"
        >
          <FileSpreadsheet size={16} className="mr-1" /> Tally XML
        </button>
        <button
          type="button"
          className="btn btn-primary flex items-center"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default JournalPreview;