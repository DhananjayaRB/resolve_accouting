import React, { useState } from 'react';
import { FolderTree, Search, Filter, Link2 } from 'lucide-react';
import InfoIcon from '../common/InfoIcon';

const SAPMappingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  // Sample SAP data mapping
  const sampleMappings = [
    { id: 1, sapTable: 'SKB1', sapField: 'SAKNR', localField: 'GL Account Code', status: 'Mapped' },
    { id: 2, sapTable: 'SKB1', sapField: 'TXT50', localField: 'GL Account Name', status: 'Mapped' },
    { id: 3, sapTable: 'SKB1', sapField: 'KTOPL', localField: 'Chart of Accounts', status: 'Mapped' },
    { id: 4, sapTable: 'BKPF', sapField: 'BELNR', localField: 'Document Number', status: 'Mapped' },
    { id: 5, sapTable: 'BKPF', sapField: 'BUDAT', localField: 'Posting Date', status: 'Mapped' },
    { id: 6, sapTable: 'BSEG', sapField: 'DMBTR', localField: 'Amount in Local Currency', status: 'Mapped' },
    { id: 7, sapTable: 'BSEG', sapField: 'SHKZG', localField: 'Debit/Credit Indicator', status: 'Pending' },
    { id: 8, sapTable: 'BSEG', sapField: 'SGTXT', localField: 'Line Item Text', status: 'Pending' },
  ];

  const filteredMappings = sampleMappings.filter(m => 
    m.sapTable.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.sapField.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.localField.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(m => filter === 'All' || m.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-light text-gray-800">SAP Data Mapping</h2>
        <InfoIcon
          title="SAP ERP Data Mapping"
          content="Map SAP ERP tables and fields to your local accounting fields. This ensures data is correctly synchronized between SAP and your accounting system."
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
              <th className="table-header-cell">SAP Table</th>
              <th className="table-header-cell">SAP Field</th>
              <th className="table-header-cell">Local Field</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredMappings.map((mapping) => (
              <tr key={mapping.id} className="table-row">
                <td className="table-cell font-light">{mapping.sapTable}</td>
                <td className="table-cell font-light">{mapping.sapField}</td>
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

export default SAPMappingPage;
