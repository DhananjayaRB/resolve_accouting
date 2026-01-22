import React, { useState } from 'react';
import { FolderTree, Search, Filter, Link2 } from 'lucide-react';

const OracleMappingPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  // Sample Oracle data mapping
  const sampleMappings = [
    { id: 1, oracleTable: 'GL_ACCOUNTS', oracleField: 'ACCOUNT_CODE', localField: 'Ledger Code', status: 'Mapped' },
    { id: 2, oracleTable: 'GL_ACCOUNTS', oracleField: 'ACCOUNT_NAME', localField: 'Ledger Name', status: 'Mapped' },
    { id: 3, oracleTable: 'GL_ACCOUNTS', oracleField: 'ACCOUNT_TYPE', localField: 'Category', status: 'Mapped' },
    { id: 4, oracleTable: 'GL_JOURNALS', oracleField: 'JOURNAL_DATE', localField: 'Transaction Date', status: 'Pending' },
    { id: 5, oracleTable: 'GL_JOURNALS', oracleField: 'AMOUNT', localField: 'Amount', status: 'Mapped' },
  ];

  const filteredMappings = sampleMappings.filter(m => 
    m.oracleTable.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.localField.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Oracle Data Mapping</h2>
        <p className="text-gray-600 mt-1">Map Oracle database fields to local accounting fields</p>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search mappings..."
            className="flex-grow focus:outline-none text-sm"
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
              <th className="table-header-cell">Oracle Table</th>
              <th className="table-header-cell">Oracle Field</th>
              <th className="table-header-cell">Local Field</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredMappings.map((mapping) => (
              <tr key={mapping.id} className="table-row">
                <td className="table-cell font-medium">{mapping.oracleTable}</td>
                <td className="table-cell">{mapping.oracleField}</td>
                <td className="table-cell">{mapping.localField}</td>
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

export default OracleMappingPage;

