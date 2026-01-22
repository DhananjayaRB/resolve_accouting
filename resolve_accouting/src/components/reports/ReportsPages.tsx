import React, { useState } from 'react';
import { BarChart3, AlertCircle, FileBarChart, Download, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

// Sync Summary Page
export const SyncSummaryPage: React.FC = () => {
  const sampleSummary = [
    { system: 'Tally', lastSync: new Date('2025-01-20'), totalRecords: 1250, success: 1200, failed: 50, status: 'Active' },
    { system: 'Oracle', lastSync: new Date('2025-01-20'), totalRecords: 890, success: 890, failed: 0, status: 'Active' },
    { system: 'SAP', lastSync: new Date('2025-01-19'), totalRecords: 450, success: 445, failed: 5, status: 'Active' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Sync Summary</h2>
        <p className="text-gray-600 mt-1">Overview of all system synchronizations</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {sampleSummary.map((s, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">{s.system}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Last Sync:</span><span>{format(s.lastSync, 'MMM dd, yyyy')}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Total:</span><span className="font-medium">{s.totalRecords}</span></div>
              <div className="flex justify-between"><span className="text-secondary-600">Success:</span><span className="font-medium text-secondary-600">{s.success}</span></div>
              <div className="flex justify-between"><span className="text-red-600">Failed:</span><span className="font-medium text-red-600">{s.failed}</span></div>
              <div className="mt-3"><span className={`badge ${s.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>{s.status}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Error Reports Page
export const ErrorReportsPage: React.FC = () => {
  const sampleErrors = [
    { id: 1, date: new Date('2025-01-20'), system: 'Tally', error: 'Connection timeout', record: 'JRN-001', severity: 'High' },
    { id: 2, date: new Date('2025-01-19'), system: 'Oracle', error: 'Invalid data format', record: 'LED-045', severity: 'Medium' },
    { id: 3, date: new Date('2025-01-18'), system: 'SAP', error: 'Authentication failed', record: 'TRX-123', severity: 'High' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Error Reports</h2>
        <p className="text-gray-600 mt-1">View synchronization and system errors</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Date</th>
              <th className="table-header-cell">System</th>
              <th className="table-header-cell">Error</th>
              <th className="table-header-cell">Record</th>
              <th className="table-header-cell">Severity</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleErrors.map((e) => (
              <tr key={e.id} className="table-row">
                <td className="table-cell">{format(e.date, 'MMM dd, yyyy HH:mm')}</td>
                <td className="table-cell">{e.system}</td>
                <td className="table-cell text-red-600">{e.error}</td>
                <td className="table-cell">{e.record}</td>
                <td className="table-cell"><span className={`badge ${e.severity === 'High' ? 'badge-error' : 'badge-warning'}`}>{e.severity}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Audit Logs Page
export const AuditLogsPage: React.FC = () => {
  const sampleLogs = [
    { id: 1, timestamp: new Date('2025-01-20 14:30'), user: 'Admin User', action: 'Created Ledger', entity: 'Cash Account', ip: '192.168.1.10' },
    { id: 2, timestamp: new Date('2025-01-20 13:15'), user: 'Finance Manager', action: 'Updated Mapping', entity: 'Payroll Mapping', ip: '192.168.1.15' },
    { id: 3, timestamp: new Date('2025-01-20 12:00'), user: 'Admin User', action: 'Deleted Profile', entity: 'Tally Profile', ip: '192.168.1.10' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Audit Logs</h2>
        <p className="text-gray-600 mt-1">Track all system activities and changes</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Timestamp</th>
              <th className="table-header-cell">User</th>
              <th className="table-header-cell">Action</th>
              <th className="table-header-cell">Entity</th>
              <th className="table-header-cell">IP Address</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleLogs.map((log) => (
              <tr key={log.id} className="table-row">
                <td className="table-cell">{format(log.timestamp, 'MMM dd, yyyy HH:mm:ss')}</td>
                <td className="table-cell">{log.user}</td>
                <td className="table-cell">{log.action}</td>
                <td className="table-cell">{log.entity}</td>
                <td className="table-cell">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Export Reports Page
export const ExportReportsPage: React.FC = () => {
  const sampleExports = [
    { id: 1, reportName: 'Financial Summary', format: 'PDF', exportedDate: new Date('2025-01-20'), size: '2.5 MB' },
    { id: 2, reportName: 'Trial Balance', format: 'Excel', exportedDate: new Date('2025-01-19'), size: '1.2 MB' },
    { id: 3, reportName: 'Sync Logs', format: 'CSV', exportedDate: new Date('2025-01-18'), size: '0.8 MB' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Export Reports</h2>
          <p className="text-gray-600 mt-1">Download and export various reports</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Download size={18} className="mr-1" /> Export Report
        </button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Report Name</th>
              <th className="table-header-cell">Format</th>
              <th className="table-header-cell">Exported Date</th>
              <th className="table-header-cell">Size</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleExports.map((exp) => (
              <tr key={exp.id} className="table-row">
                <td className="table-cell font-medium">{exp.reportName}</td>
                <td className="table-cell"><span className="badge badge-secondary">{exp.format}</span></td>
                <td className="table-cell">{format(exp.exportedDate, 'MMM dd, yyyy')}</td>
                <td className="table-cell">{exp.size}</td>
                <td className="table-cell"><button className="text-secondary-600"><Download size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

