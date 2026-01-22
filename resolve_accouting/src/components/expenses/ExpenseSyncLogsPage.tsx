import React, { useState } from 'react';
import { FileBarChart, CheckCircle2, XCircle, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';

const ExpenseSyncLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const sampleLogs = [
    { id: 1, syncDate: new Date('2025-01-20'), records: 45, status: 'Success', duration: '1.8s' },
    { id: 2, syncDate: new Date('2025-01-19'), records: 38, status: 'Success', duration: '1.5s' },
    { id: 3, syncDate: new Date('2025-01-18'), records: 0, status: 'Failed', duration: '0.3s', error: 'API timeout' },
    { id: 4, syncDate: new Date('2025-01-17'), records: 52, status: 'Success', duration: '2.1s' },
  ];

  const filteredLogs = sampleLogs.filter(log =>
    log.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success': return <CheckCircle2 size={16} className="text-secondary-600" />;
      case 'Failed': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-warning-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Expense Sync Logs</h2>
        <p className="text-gray-600 mt-1">View expense synchronization history</p>
      </div>

      <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 max-w-md">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search logs..."
          className="flex-grow focus:outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Sync Date</th>
              <th className="table-header-cell">Records</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Duration</th>
              <th className="table-header-cell">Error</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="table-row">
                <td className="table-cell">{format(log.syncDate, 'MMM dd, yyyy HH:mm')}</td>
                <td className="table-cell numeric">{log.records}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className={`badge ${log.status === 'Success' ? 'badge-success' : 'badge-error'}`}>
                      {log.status}
                    </span>
                  </div>
                </td>
                <td className="table-cell">{log.duration}</td>
                <td className="table-cell text-red-600">{log.error || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseSyncLogsPage;

