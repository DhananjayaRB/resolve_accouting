import React, { useState } from 'react';
import { Code, Plus, Trash2, Edit, Play, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CustomAPIPage: React.FC = () => {
  const [apis, setApis] = useState([
    { id: 1, name: 'Custom ERP API', endpoint: 'https://api.example.com/sync', method: 'POST', status: 'Active', lastSync: '2025-01-20 10:15:00' },
    { id: 2, name: 'Legacy System API', endpoint: 'https://legacy.company.com/data', method: 'GET', status: 'Inactive', lastSync: '2025-01-18 09:30:00' },
  ]);

  const handleTest = (id: number) => {
    toast.success('API connection test successful');
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this API configuration?')) {
      setApis(apis.filter(api => api.id !== id));
      toast.success('API configuration deleted');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Custom API Integration</h2>
          <p className="text-gray-600 mt-1">Configure and manage custom ERP API integrations</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-1" /> Add API
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {apis.map((api) => (
          <div key={api.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">{api.name}</h3>
                  <span className={`badge ${api.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                    {api.status}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <div><span className="font-medium">Endpoint:</span> {api.endpoint}</div>
                  <div><span className="font-medium">Method:</span> {api.method}</div>
                  <div><span className="font-medium">Last Sync:</span> {api.lastSync}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleTest(api.id)}
                  className="btn btn-secondary flex items-center"
                  title="Test Connection"
                >
                  <Play size={16} />
                </button>
                <button className="btn btn-secondary flex items-center" title="Edit">
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(api.id)}
                  className="btn btn-secondary flex items-center text-red-600"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CustomAPIPage;

