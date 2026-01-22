import React, { useState } from 'react';
import { FolderTree, Search, Filter, Link2 } from 'lucide-react';
import InfoIcon from '../common/InfoIcon';

const ZohoMappingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  // Sample Zoho data mapping
  const sampleMappings = [
    { id: 1, zohoField: 'account_name', zohoType: 'Chart of Accounts', localField: 'Ledger Name', status: 'Mapped' },
    { id: 2, zohoField: 'account_code', zohoType: 'Chart of Accounts', localField: 'Ledger Code', status: 'Mapped' },
    { id: 3, zohoField: 'account_type', zohoType: 'Chart of Accounts', localField: 'Category', status: 'Mapped' },
    { id: 4, zohoField: 'date', zohoType: 'Journal Entry', localField: 'Transaction Date', status: 'Mapped' },
    { id: 5, zohoField: 'debit', zohoType: 'Journal Entry', localField: 'Debit Amount', status: 'Mapped' },
    { id: 6, zohoField: 'credit', zohoType: 'Journal Entry', localField: 'Credit Amount', status: 'Mapped' },
    { id: 7, zohoField: 'description', zohoType: 'Journal Entry', localField: 'Description', status: 'Pending' },
    { id: 8, zohoField: 'reference_number', zohoType: 'Journal Entry', localField: 'Reference', status: 'Pending' },
  ];

  const filteredMappings = sampleMappings.filter(m => 
    m.zohoField.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.localField.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.zohoType.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(m => filter === 'All' || m.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-light text-gray-800">Zoho Data Mapping</h2>
        <InfoIcon
          title="Zoho Books Data Mapping"
          content="Map Zoho Books fields to your local accounting fields. This ensures data is correctly synchronized between systems."
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
              <th className="table-header-cell">Zoho Type</th>
              <th className="table-header-cell">Zoho Field</th>
              <th className="table-header-cell">Local Field</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredMappings.map((mapping) => (
              <tr key={mapping.id} className="table-row">
                <td className="table-cell font-light">{mapping.zohoType}</td>
                <td className="table-cell font-light">{mapping.zohoField}</td>
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

export default ZohoMappingPage;
