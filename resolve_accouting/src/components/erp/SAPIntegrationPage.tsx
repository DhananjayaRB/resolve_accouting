import React, { useState } from 'react';
import { Server, CheckCircle2, XCircle, RefreshCw, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const SAPIntegrationPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const sampleData = {
    connectionStatus: 'Connected',
    lastSync: '2025-01-20 14:30:00',
    totalRecords: 1250,
    syncFrequency: 'Daily',
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      toast.success('SAP data synchronized successfully');
      setIsSyncing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">SAP Integration</h2>
        <p className="text-gray-600 mt-1">Manage SAP ERP integration and data synchronization</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Connection Status</h3>
            <div className={`flex items-center gap-2 ${isConnected ? 'text-secondary-600' : 'text-gray-400'}`}>
              {isConnected ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              <span className="text-sm font-medium">{sampleData.connectionStatus}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Last Sync:</span>
              <span className="font-medium">{sampleData.lastSync}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Records:</span>
              <span className="font-medium">{sampleData.totalRecords.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Sync Frequency:</span>
              <span className="font-medium">{sampleData.syncFrequency}</span>
            </div>
          </div>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="btn btn-primary w-full mt-4 flex items-center justify-center"
          >
            <RefreshCw size={16} className={`mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SAP Server</label>
              <input type="text" className="input w-full" defaultValue="sap.company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <input type="text" className="input w-full" defaultValue="100" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">System Number</label>
              <input type="text" className="input w-full" defaultValue="00" />
            </div>
            <button className="btn btn-secondary w-full flex items-center justify-center">
              <Settings size={16} className="mr-2" />
              Configure
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SAPIntegrationPage;

