import React, { useState } from 'react';
import { FolderTree, Search, Filter, Link2 } from 'lucide-react';
import InfoIcon from '../common/InfoIcon';

const DarwinBoxMappingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  // Sample DarwinBox data mapping
  const sampleMappings = [
    { id: 1, darwinboxField: 'employee_code', darwinboxType: 'Employee', localField: 'Employee Code', status: 'Mapped' },
    { id: 2, darwinboxField: 'employee_name', darwinboxType: 'Employee', localField: 'Employee Name', status: 'Mapped' },
    { id: 3, darwinboxField: 'department', darwinboxType: 'Employee', localField: 'Department', status: 'Mapped' },
    { id: 4, darwinboxField: 'designation', darwinboxType: 'Employee', localField: 'Designation', status: 'Mapped' },
    { id: 5, darwinboxField: 'salary_component', darwinboxType: 'Payroll', localField: 'Payroll Item', status: 'Mapped' },
    { id: 6, darwinboxField: 'amount', darwinboxType: 'Payroll', localField: 'Amount', status: 'Mapped' },
    { id: 7, darwinboxField: 'pay_period', darwinboxType: 'Payroll', localField: 'Pay Period', status: 'Pending' },
    { id: 8, darwinboxField: 'cost_center', darwinboxType: 'Payroll', localField: 'Cost Center', status: 'Pending' },
  ];

  const filteredMappings = sampleMappings.filter(m => 
    m.darwinboxField.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.localField.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.darwinboxType.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(m => filter === 'All' || m.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-light text-gray-800">DarwinBox Data Mapping</h2>
        <InfoIcon
          title="DarwinBox HRMS Data Mapping"
          content="Map DarwinBox HRMS fields to your local payroll fields. This ensures employee and payroll data is correctly synchronized."
        />
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search mappings..."
            className="flex-grow focus:outline-none text-sm font-light"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="select text-sm py-2">
            <option value="All">All Status</option>
            <option value="Mapped">Mapped</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">DarwinBox Type</th>
              <th className="table-header-cell">DarwinBox Field</th>
              <th className="table-header-cell">Local Field</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredMappings.map((mapping) => (
              <tr key={mapping.id} className="table-row">
                <td className="table-cell font-light">{mapping.darwinboxType}</td>
                <td className="table-cell font-light">{mapping.darwinboxField}</td>
                <td className="table-cell font-light">{mapping.localField}</td>
                <td className="table-cell">
                  <span className={`badge ${mapping.status === 'Mapped' ? 'badge-success' : 'badge-warning'}`}>
                    {mapping.status}
                  </span>
                </td>
                <td className="table-cell">
                  <button className="text-secondary-600 hover:text-secondary-700">
                    <Link2 size={16} />
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

export default DarwinBoxMappingPage;
