import React, { useState } from 'react';
import { FileBarChart, Search, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import InfoIcon from '../common/InfoIcon';

const DarwinBoxLogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  // Sample DarwinBox sync logs
  const sampleLogs = [
    { id: 1, syncDate: new Date('2025-01-22'), records: 250, status: 'Success', duration: '4.5s', type: 'Employee Data', syncDirection: 'From DarwinBox' },
    { id: 2, syncDate: new Date('2025-01-22'), records: 1250, status: 'Success', duration: '8.2s', type: 'Payroll Data', syncDirection: 'From DarwinBox' },
    { id: 3, syncDate: new Date('2025-01-21'), records: 0, status: 'Failed', duration: '1.2s', type: 'Attendance', error: 'Authentication failed', syncDirection: 'From DarwinBox' },
    { id: 4, syncDate: new Date('2025-01-21'), records: 89, status: 'Success', duration: '2.8s', type: 'Employee Data', syncDirection: 'To DarwinBox' },
    { id: 5, syncDate: new Date('2025-01-20'), records: 450, status: 'Partial', duration: '6.5s', type: 'Payroll Data', error: '12 records skipped - missing required fields', syncDirection: 'From DarwinBox' },
    { id: 6, syncDate: new Date('2025-01-20'), records: 156, status: 'Success', duration: '3.2s', type: 'Leave Data', syncDirection: 'From DarwinBox' },
  ];

  const filteredLogs = sampleLogs.filter(log =>
    log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.syncDirection.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(log => filter === 'All' || log.status === filter);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Success': return <CheckCircle2 size={16} className="text-secondary-600" />;
      case 'Failed': return <XCircle size={16} className="text-red-600" />;
      default: return <Clock size={16} className="text-warning-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-light text-gray-800">DarwinBox Sync Logs</h2>
        <InfoIcon
          title="DarwinBox HRMS Sync Logs"
          content="View synchronization history with DarwinBox HRMS. Track employee data, payroll, attendance, and leave data synchronization."
        />
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search logs..."
            className="flex-grow focus:outline-none text-sm font-light"
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
              <th className="table-header-cell">Sync Date</th>
              <th className="table-header-cell">Type</th>
              <th className="table-header-cell">Direction</th>
              <th className="table-header-cell">Records</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Duration</th>
              <th className="table-header-cell">Error</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredLogs.map((log) => (
              <tr key={log.id} className="table-row">
                <td className="table-cell font-light">{format(log.syncDate, 'MMM dd, yyyy HH:mm')}</td>
                <td className="table-cell font-light">{log.type}</td>
                <td className="table-cell font-light">
                  <span className={`badge ${log.syncDirection === 'To DarwinBox' ? 'badge-primary' : 'badge-secondary'}`}>
                    {log.syncDirection}
                  </span>
                </td>
                <td className="table-cell numeric font-light">{log.records}</td>
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className={`badge ${
                      log.status === 'Success' ? 'badge-success' :
                      log.status === 'Failed' ? 'badge-error' : 'badge-warning'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </td>
                <td className="table-cell font-light">{log.duration}</td>
                <td className="table-cell text-red-600 font-light text-sm">{log.error || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DarwinBoxLogsPage;
