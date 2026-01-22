import React, { useState } from 'react';
import { Users, CheckCircle2, XCircle, RefreshCw, Settings, FileBarChart } from 'lucide-react';
import toast from 'react-hot-toast';
import InfoIcon from '../common/InfoIcon';

const DarwinBoxIntegrationPage: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const sampleData = {
    connectionStatus: 'Not Connected',
    lastSync: 'Never',
    totalRecords: 0,
    syncFrequency: 'Manual',
    employees: 0,
    payrollRecords: 0,
  };

  const handleConnect = async () => {
    setIsConnected(true);
    toast.success('DarwinBox connection established successfully');
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setTimeout(() => {
      toast.success('DarwinBox data synchronized successfully');
      setIsSyncing(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-light text-gray-800">DarwinBox Integration</h2>
          <InfoIcon
            title="DarwinBox HRMS Integration"
            content="Connect and sync your HR and payroll data with DarwinBox HRMS. Configure connection settings, map data fields, and manage synchronization schedules."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status Card */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-light text-gray-800">Connection Status</h3>
            <Users size={24} className="text-secondary-600" />
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
              {isConnected ? 'Connected' : 'Connect to DarwinBox'}
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
              <span className="text-sm text-gray-600 font-light">Employees:</span>
              <span className="text-sm font-light text-gray-800">{sampleData.employees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 font-light">Payroll Records:</span>
              <span className="text-sm font-light text-gray-800">{sampleData.payrollRecords}</span>
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
            <label className="block text-sm font-light text-gray-700 mb-1">DarwinBox API Key</label>
            <input
              type="password"
              className="input"
              placeholder="Enter your DarwinBox API key"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">API Secret</label>
            <input
              type="password"
              className="input"
              placeholder="Enter your DarwinBox API secret"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Company ID</label>
            <input
              type="text"
              className="input"
              placeholder="Enter your DarwinBox company ID"
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

export default DarwinBoxIntegrationPage;
