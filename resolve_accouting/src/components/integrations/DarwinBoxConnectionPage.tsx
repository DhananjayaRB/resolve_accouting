import React, { useState } from 'react';
import { Users, Plug, CheckCircle2, XCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import InfoIcon from '../common/InfoIcon';

const DarwinBoxConnectionPage: React.FC = () => {
  const [form, setForm] = useState({
    apiKey: '',
    apiSecret: '',
    companyId: '',
    baseUrl: 'https://api.darwinbox.in',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestSuccess(null);

    // Simulate connection test
    setTimeout(() => {
      setTestResult('Successfully connected to DarwinBox HRMS');
      setTestSuccess(true);
      setIsTesting(false);
      toast.success('DarwinBox connection test successful');
    }, 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      toast.success('DarwinBox connection configuration saved successfully');
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-light text-gray-800">DarwinBox Connection Setup</h2>
        <InfoIcon
          title="DarwinBox HRMS Integration"
          content="Connect to DarwinBox HRMS API. You'll need your API Key, API Secret, and Company ID from your DarwinBox account settings."
        />
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`h-14 w-14 rounded-full border-2 flex items-center justify-center ${
            isTesting ? 'border-secondary-400 bg-secondary-50 animate-pulse' :
            testSuccess === true ? 'border-secondary-500 bg-secondary-50' :
            testSuccess === false ? 'border-red-500 bg-red-50' :
            'border-gray-200 bg-gray-50'
          }`}>
            {isTesting ? <Plug className="text-secondary-600 animate-spin" size={26} /> :
             testSuccess === true ? <CheckCircle2 className="text-secondary-600" size={26} /> :
             testSuccess === false ? <XCircle className="text-red-600" size={26} /> :
             <Users className="text-gray-400" size={26} />}
          </div>
          <div>
            <span className="text-sm font-light text-gray-700">
              {isTesting ? 'Testing connection...' :
               testSuccess === true ? 'Connection successful' :
               testSuccess === false ? 'Connection failed' :
               'Enter DarwinBox HRMS connection details'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">API Key *</label>
            <input
              type="password"
              name="apiKey"
              value={form.apiKey}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter your DarwinBox API key"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">API Secret *</label>
            <input
              type="password"
              name="apiSecret"
              value={form.apiSecret}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter your DarwinBox API secret"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Company ID *</label>
            <input
              type="text"
              name="companyId"
              value={form.companyId}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter your DarwinBox company ID"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Base URL *</label>
            <input
              type="text"
              name="baseUrl"
              value={form.baseUrl}
              onChange={handleChange}
              className="input w-full"
              placeholder="https://api.darwinbox.in"
            />
          </div>
        </div>

        {testResult && (
          <div className={`mt-4 p-3 rounded-md text-sm font-light ${
            testSuccess ? 'bg-secondary-50 text-secondary-800 border border-secondary-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {testResult}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !form.apiKey || !form.apiSecret || !form.companyId}
            className="btn btn-secondary flex items-center"
          >
            <Plug size={16} className="mr-2" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !form.apiKey || !form.apiSecret || !form.companyId}
            className="btn btn-primary flex items-center"
          >
            <Save size={16} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DarwinBoxConnectionPage;
