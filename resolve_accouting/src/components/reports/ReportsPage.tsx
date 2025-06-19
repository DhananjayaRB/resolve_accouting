import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Plus, Filter, Search, FileText, Download, FilePlus, FileDown, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import ReportForm from './ReportForm';
import JournalPreview from './JournalPreview';

const ReportsPage: React.FC = () => {
  const { payrollJournals, reportConfigurations } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [selectedJournalId, setSelectedJournalId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredJournals = payrollJournals.filter(
    (journal) => journal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateReport = () => {
    setShowForm(true);
  };

  const handleViewJournal = (journalId: string) => {
    setSelectedJournalId(journalId);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleClosePreview = () => {
    setSelectedJournalId(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Generated':
        return 'bg-success-100 text-success-800';
      case 'Draft':
        return 'bg-warning-100 text-warning-800';
      case 'Exported':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Payroll Journal Reports</h2>
        <button
          onClick={handleGenerateReport}
          className="btn btn-primary flex items-center"
        >
          <Plus size={18} className="mr-1" /> Generate Report
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search reports..."
            className="flex-grow focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Reports Table */}
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Journal Name</th>
              <th className="table-header-cell">Period</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Created At</th>
              <th className="table-header-cell">Balance</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredJournals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No journal reports found. Generate one to get started.
                </td>
              </tr>
            ) : (
              filteredJournals.map((journal) => (
                <tr key={journal.id} className="table-row">
                  <td className="table-cell font-medium text-gray-900">{journal.name}</td>
                  <td className="table-cell">
                    {format(new Date(journal.periodStart), 'MMM d, yyyy')} - {format(new Date(journal.periodEnd), 'MMM d, yyyy')}
                  </td>
                  <td className="table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        journal.status
                      )}`}
                    >
                      {journal.status}
                    </span>
                  </td>
                  <td className="table-cell">
                    {format(new Date(journal.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="table-cell">
                    {journal.totalDebit === journal.totalCredit ? (
                      <span className="text-success-600">Balanced</span>
                    ) : (
                      <span className="text-error-600">Unbalanced</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewJournal(journal.id)}
                        className="text-primary-600 hover:text-primary-900"
                        title="View"
                      >
                        <FileText size={16} />
                      </button>
                      <button
                        className="text-success-600 hover:text-success-900"
                        title="Download Excel"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        className="text-primary-600 hover:text-primary-900"
                        title="Export to Tally"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Report Templates Section */}
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Templates</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportConfigurations.map((config) => (
            <div key={config.id} className="card card-hover p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{config.name}</h4>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    config.format === 'Excel'
                      ? 'bg-success-100 text-success-800'
                      : 'bg-primary-100 text-primary-800'
                  }`}
                >
                  {config.format}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">
                {config.detailLevel} level report
                {config.filters?.dateRange && ` for specific date range`}
              </p>
              <div className="flex justify-end mt-2">
                <button className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center">
                  Use Template <FilePlus size={16} className="ml-1" />
                </button>
              </div>
            </div>
          ))}
          <div className="card card-hover border border-dashed border-gray-300 p-4 flex flex-col items-center justify-center">
            <Plus size={24} className="text-gray-400 mb-2" />
            <p className="text-gray-600 text-sm font-medium">Create New Template</p>
          </div>
        </div>
      </div>

      {/* Report Generation Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <ReportForm onClose={handleCloseForm} />
          </div>
        </div>
      )}

      {/* Journal Preview Modal */}
      {selectedJournalId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <JournalPreview 
              journalId={selectedJournalId} 
              onClose={handleClosePreview} 
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;