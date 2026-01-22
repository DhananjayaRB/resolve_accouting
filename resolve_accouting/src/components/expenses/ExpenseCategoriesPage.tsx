import React, { useState } from 'react';
import { FolderTree, Plus, Edit, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const ExpenseCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState([
    { id: 1, name: 'Travel', description: 'Business travel expenses', isActive: true },
    { id: 2, name: 'Meals', description: 'Food and dining expenses', isActive: true },
    { id: 3, name: 'Office Supplies', description: 'Stationery and office materials', isActive: true },
    { id: 4, name: 'Utilities', description: 'Electricity, water, internet bills', isActive: true },
    { id: 5, name: 'Marketing', description: 'Advertising and promotional expenses', isActive: true },
  ]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Expense Categories</h2>
          <p className="text-gray-600 mt-1">Manage expense categories for classification</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-1" /> Add Category
        </button>
      </div>

      <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 max-w-md">
        <Search size={18} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Search categories..."
          className="flex-grow focus:outline-none text-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Name</th>
              <th className="table-header-cell">Description</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredCategories.map((cat) => (
              <tr key={cat.id} className="table-row">
                <td className="table-cell font-medium">{cat.name}</td>
                <td className="table-cell">{cat.description}</td>
                <td className="table-cell">
                  <span className={`badge ${cat.isActive ? 'badge-success' : 'badge-warning'}`}>
                    {cat.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button className="text-secondary-600 hover:text-secondary-700">
                      <Edit size={16} />
                    </button>
                    <button className="text-red-600 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseCategoriesPage;

