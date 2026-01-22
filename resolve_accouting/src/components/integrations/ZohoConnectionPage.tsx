import React, { useState } from 'react';
import { Cloud, Plug, CheckCircle2, XCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import InfoIcon from '../common/InfoIcon';

const ZohoConnectionPage: React.FC = () => {
  const [form, setForm] = useState({
    apiKey: '',
    organizationId: '',
    region: 'US',
    clientId: '',
    clientSecret: '',
  });
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestSuccess(null);

    // Simulate connection test
    setTimeout(() => {
      setTestResult('Successfully connected to Zoho Books');
      setTestSuccess(true);
      setIsTesting(false);
      toast.success('Zoho connection test successful');
    }, 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      toast.success('Zoho connection configuration saved successfully');
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-light text-gray-800">Zoho Connection Setup</h2>
        <InfoIcon
          title="Zoho Books Integration"
          content="Connect to Zoho Books API. You'll need your API key, Organization ID, and OAuth credentials from your Zoho Books account."
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
             <Cloud className="text-gray-400" size={26} />}
          </div>
          <div>
            <span className="text-sm font-light text-gray-700">
              {isTesting ? 'Testing connection...' :
               testSuccess === true ? 'Connection successful' :
               testSuccess === false ? 'Connection failed' :
               'Enter Zoho Books connection details'}
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
              placeholder="Enter your Zoho API key"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Organization ID *</label>
            <input
              type="text"
              name="organizationId"
              value={form.organizationId}
              onChange={handleChange}
              className="input w-full"
              placeholder="Enter your Zoho organization ID"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Region *</label>
            <select
              name="region"
              value={form.region}
              onChange={handleChange}
              className="select w-full"
            >
              <option value="US">United States (US)</option>
              <option value="IN">India (IN)</option>
              <option value="EU">Europe (EU)</option>
              <option value="AU">Australia (AU)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Client ID</label>
            <input
              type="text"
              name="clientId"
              value={form.clientId}
              onChange={handleChange}
              className="input w-full"
              placeholder="OAuth Client ID (optional)"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-light text-gray-700 mb-1">Client Secret</label>
            <input
              type="password"
              name="clientSecret"
              value={form.clientSecret}
              onChange={handleChange}
              className="input w-full"
              placeholder="OAuth Client Secret (optional)"
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
            disabled={isTesting || !form.apiKey || !form.organizationId}
            className="btn btn-secondary flex items-center"
          >
            <Plug size={16} className="mr-2" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !form.apiKey || !form.organizationId}
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

export default ZohoConnectionPage;
