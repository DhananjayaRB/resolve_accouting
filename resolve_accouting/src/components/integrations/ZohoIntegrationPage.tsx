import React, { useState } from 'react';
import { Cloud, CheckCircle2, XCircle, RefreshCw, Settings, Link2, FileBarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import InfoIcon from '../common/InfoIcon';

const ZohoIntegrationPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const sampleData = {
    connectionStatus: 'Not Connected',
    lastSync: 'Never',
    totalRecords: 0,
    syncFrequency: 'Manual',
  };

  const handleConnect = async () => {
    setIsConnected(true);
    toast.success('Zoho connection established successfully');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      toast.success('Zoho data synchronized successfully');
      setIsSyncing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-light text-gray-800">Zoho Integration</h2>
          <InfoIcon
            title="Zoho Integration"
            content="Connect and sync your accounting data with Zoho Books. Configure connection settings, map data fields, and manage synchronization schedules."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-light text-gray-800">Connection Status</h3>
            <Cloud size={24} className="text-secondary-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-light">Status:</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-light ${
                isConnected
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isConnected ? (
                  <>
                    <CheckCircle2 size={12} className="mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle size={12} className="mr-1" />
                    Not Connected
                  </>
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-light">Last Sync:</span>
              <span className="text-sm font-light text-gray-800">{sampleData.lastSync}</span>
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnected}
              className={`btn w-full ${isConnected ? 'btn-secondary' : 'btn-primary'}`}
            >
              {isConnected ? 'Connected' : 'Connect to Zoho'}
            </button>
          </div>
        </div>

        {/* Sync Statistics Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-light text-gray-800">Sync Statistics</h3>
            <FileBarChart size={24} className="text-secondary-600" />
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-light">Total Records:</span>
              <span className="text-sm font-light text-gray-800">{sampleData.totalRecords}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-light">Sync Frequency:</span>
              <span className="text-sm font-light text-gray-800">{sampleData.syncFrequency}</span>
            </div>
            <button
              onClick={handleSync}
              disabled={!isConnected || isSyncing}
              className="btn btn-primary w-full flex items-center justify-center"
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={16} className="mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Sync Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-light text-gray-800">Configuration</h3>
          <Settings size={20} className="text-gray-400" />
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Zoho API Key</label>
            <input
              type="password"
              className="input"
              placeholder="Enter your Zoho API key"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Organization ID</label>
            <input
              type="text"
              className="input"
              placeholder="Enter your Zoho organization ID"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Sync Frequency</label>
            <select className="select">
              <option>Manual</option>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
          <button className="btn btn-primary">Save Configuration</button>
        </div>
      </div>
    </div>
  );
};

export default ZohoIntegrationPage;

