import React, { useState } from 'react';
import { Server, Plug, CheckCircle2, XCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import InfoIcon from '../common/InfoIcon';

const SAPConnectionPage: React.FC = () => {
  const [form, setForm] = useState({
    systemId: '',
    client: '',
    applicationServer: '',
    instanceNumber: '00',
    username: '',
    password: '',
    language: 'EN',
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
      setTestResult('Successfully connected to SAP system');
      setTestSuccess(true);
      setIsTesting(false);
      toast.success('SAP connection test successful');
    }, 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      toast.success('SAP connection configuration saved successfully');
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        <h2 className="text-2xl font-light text-gray-800">SAP Connection Setup</h2>
        <InfoIcon
          title="SAP ERP Integration"
          content="Connect to SAP ERP system via RFC or OData. Configure connection parameters including system ID, client, application server, and authentication credentials."
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
             <Server className="text-gray-400" size={26} />}
          </div>
          <div>
            <span className="text-sm font-light text-gray-700">
              {isTesting ? 'Testing connection...' :
               testSuccess === true ? 'Connection successful' :
               testSuccess === false ? 'Connection failed' :
               'Enter SAP ERP connection details'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">System ID *</label>
            <input
              type="text"
              name="systemId"
              value={form.systemId}
              onChange={handleChange}
              className="input w-full"
              placeholder="e.g. PRD, DEV, QAS"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Client *</label>
            <input
              type="text"
              name="client"
              value={form.client}
              onChange={handleChange}
              className="input w-full"
              placeholder="e.g. 100, 200"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Application Server *</label>
            <input
              type="text"
              name="applicationServer"
              value={form.applicationServer}
              onChange={handleChange}
              className="input w-full"
              placeholder="e.g. sapserver.company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Instance Number *</label>
            <input
              type="text"
              name="instanceNumber"
              value={form.instanceNumber}
              onChange={handleChange}
              className="input w-full"
              placeholder="00"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Username *</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="input w-full"
              placeholder="SAP username"
            />
          </div>
          <div>
            <label className="block text-sm font-light text-gray-700 mb-1">Language</label>
            <select
              name="language"
              value={form.language}
              onChange={handleChange}
              className="select w-full"
            >
              <option value="EN">English</option>
              <option value="DE">German</option>
              <option value="FR">French</option>
              <option value="ES">Spanish</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-light text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="input w-full"
              placeholder="SAP password"
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
            disabled={isTesting || !form.systemId || !form.client || !form.applicationServer}
            className="btn btn-secondary flex items-center"
          >
            <Plug size={16} className="mr-2" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !form.systemId || !form.client || !form.applicationServer || !form.username}
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

export default SAPConnectionPage;
