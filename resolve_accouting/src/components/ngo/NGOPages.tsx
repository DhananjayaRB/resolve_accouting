import React, { useState } from 'react';
import { Link2, BookOpen, BarChart3, Download, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

// Fund Mapping Page
export const FundMappingPage: React.FC = () => {
  const sampleMappings = [
    { id: 1, fundName: 'Education Fund', ledgerHead: 'Education Expenses', status: 'Mapped' },
    { id: 2, fundName: 'Healthcare Fund', ledgerHead: 'Medical Expenses', status: 'Mapped' },
    { id: 3, fundName: 'Infrastructure Fund', ledgerHead: 'Infrastructure', status: 'Pending' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Fund Mapping</h2>
        <p className="text-gray-600 mt-1">Map NGO funds to ledger heads</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Fund Name</th>
              <th className="table-header-cell">Ledger Head</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleMappings.map((m) => (
              <tr key={m.id} className="table-row">
                <td className="table-cell font-medium">{m.fundName}</td>
                <td className="table-cell">{m.ledgerHead}</td>
                <td className="table-cell"><span className="badge badge-success">{m.status}</span></td>
                <td className="table-cell"><button className="text-secondary-600"><Link2 size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Donor Ledgers Page
export const DonorLedgersPage: React.FC = () => {
  const sampleDonors = [
    { id: 1, name: 'ABC Foundation', amount: 500000, date: new Date('2025-01-15'), purpose: 'Education' },
    { id: 2, name: 'XYZ Trust', amount: 300000, date: new Date('2025-01-10'), purpose: 'Healthcare' },
    { id: 3, name: 'Global Charity', amount: 750000, date: new Date('2025-01-05'), purpose: 'Infrastructure' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Donor Ledgers</h2>
        <p className="text-gray-600 mt-1">Track donations and donor contributions</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Donor Name</th>
              <th className="table-header-cell">Amount</th>
              <th className="table-header-cell">Date</th>
              <th className="table-header-cell">Purpose</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleDonors.map((d) => (
              <tr key={d.id} className="table-row">
                <td className="table-cell font-medium">{d.name}</td>
                <td className="table-cell numeric">₹{d.amount.toLocaleString()}</td>
                <td className="table-cell">{format(d.date, 'MMM dd, yyyy')}</td>
                <td className="table-cell">{d.purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Utilization Reports Page
export const UtilizationReportsPage: React.FC = () => {
  const sampleReports = [
    { id: 1, fund: 'Education Fund', allocated: 1000000, utilized: 750000, balance: 250000, utilization: '75%' },
    { id: 2, fund: 'Healthcare Fund', allocated: 800000, utilized: 600000, balance: 200000, utilization: '75%' },
    { id: 3, fund: 'Infrastructure Fund', allocated: 1200000, utilized: 900000, balance: 300000, utilization: '75%' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Utilization Reports</h2>
        <p className="text-gray-600 mt-1">View fund utilization and allocation reports</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Fund</th>
              <th className="table-header-cell">Allocated</th>
              <th className="table-header-cell">Utilized</th>
              <th className="table-header-cell">Balance</th>
              <th className="table-header-cell">Utilization</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleReports.map((r) => (
              <tr key={r.id} className="table-row">
                <td className="table-cell font-medium">{r.fund}</td>
                <td className="table-cell numeric">₹{r.allocated.toLocaleString()}</td>
                <td className="table-cell numeric">₹{r.utilized.toLocaleString()}</td>
                <td className="table-cell numeric">₹{r.balance.toLocaleString()}</td>
                <td className="table-cell"><span className="badge badge-success">{r.utilization}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Compliance Export Page
export const ComplianceExportPage: React.FC = () => {
  const sampleExports = [
    { id: 1, reportType: 'FCRA Report', period: 'Q4 2024', exportedDate: new Date('2025-01-20'), status: 'Exported' },
    { id: 2, reportType: 'Income Tax Return', period: 'FY 2024-25', exportedDate: new Date('2025-01-15'), status: 'Exported' },
    { id: 3, reportType: 'Audit Report', period: 'Annual 2024', exportedDate: new Date('2025-01-10'), status: 'Pending' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Compliance Export</h2>
          <p className="text-gray-600 mt-1">Export compliance reports for regulatory filing</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Download size={18} className="mr-1" /> Export Report
        </button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Report Type</th>
              <th className="table-header-cell">Period</th>
              <th className="table-header-cell">Exported Date</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleExports.map((e) => (
              <tr key={e.id} className="table-row">
                <td className="table-cell font-medium">{e.reportType}</td>
                <td className="table-cell">{e.period}</td>
                <td className="table-cell">{format(e.exportedDate, 'MMM dd, yyyy')}</td>
                <td className="table-cell"><span className="badge badge-success">{e.status}</span></td>
                <td className="table-cell"><button className="text-secondary-600"><Download size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

