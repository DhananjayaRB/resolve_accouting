import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, RefreshCw, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

const PayrollSyncStatusPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const sampleSyncs = [
    { id: 1, period: 'January 2025', syncDate: new Date('2025-01-20'), status: 'Success', records: 125, duration: '3.2s' },
    { id: 2, period: 'December 2024', syncDate: new Date('2025-01-15'), status: 'Success', records: 118, duration: '2.8s' },
    { id: 3, period: 'November 2024', syncDate: new Date('2025-01-10'), status: 'Partial', records: 95, duration: '4.1s', error: '5 records failed' },
    { id: 4, period: 'October 2024', syncDate: new Date('2025-01-05'), status: 'Failed', records: 0, duration: '0.5s', error: 'Connection timeout' },
  ];

  const filteredSyncs = sampleSyncs.filter(sync =>
    sync.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sync.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success': return <CheckCircle2 size={18} className="text-secondary-600" />;
      case 'Failed': return <XCircle size={18} className="text-red-600" />;
      default: return <Clock size={18} className="text-warning-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Payroll Sync Status</h2>
          <p className="text-gray-600 mt-1">View payroll synchronization history and status</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <RefreshCw size={18} className="mr-1" /> Sync Now
        </button>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search sync history..."
            className="flex-grow focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select text-sm py-2">
            <option value="All">All Status</option>
            <option value="Success">Success</option>
            <option value="Failed">Failed</option>
            <option value="Partial">Partial</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Pay Period</th>
              <th className="table-header-cell">Sync Date</th>
              <th className="table-header-cell">Records</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Duration</th>
              <th className="table-header-cell">Error</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredSyncs.map((sync) => (
              <tr key={sync.id} className="table-row">
                <td className="table-cell font-medium">{sync.period}</td>
                <td className="table-cell">{format(sync.syncDate, 'MMM dd, yyyy HH:mm')}</td>
                <td className="table-cell numeric">{sync.records}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(sync.status)}
                    <span className={`badge ${
                      sync.status === 'Success' ? 'badge-success' :
                      sync.status === 'Failed' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {sync.status}
                    </span>
                  </div>
                </td>
                <td className="table-cell">{sync.duration}</td>
                <td className="table-cell text-red-600">{sync.error || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayrollSyncStatusPage;

