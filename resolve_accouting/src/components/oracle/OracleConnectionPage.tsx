import React, { useState } from 'react';
import { Database, Plug, CheckCircle2, XCircle, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const OracleConnectionPage: React.FC = () => {
  const [form, setForm] = useState({
    host: '',
    port: '1521',
    serviceName: '',
    username: '',
    password: '',
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
      setTestResult('Successfully connected to Oracle database');
      setTestSuccess(true);
      setIsTesting(false);
    }, 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      toast.success('Oracle connection configuration saved successfully');
      setIsSaving(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Oracle Connection Setup</h2>
        <p className="text-gray-600 mt-1">Configure connection to Oracle database</p>
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
             <Database className="text-gray-400" size={26} />}
          </div>
          <div>
            <span className="text-sm font-medium text-gray-700">
              {isTesting ? 'Testing connection...' :
               testSuccess === true ? 'Connection successful' :
               testSuccess === false ? 'Connection failed' :
               'Enter Oracle connection details'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Host *</label>
            <input
              type="text"
              name="host"
              value={form.host}
              onChange={handleChange}
              className="input w-full"
              placeholder="e.g. localhost or 192.168.1.10"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Port *</label>
            <input
              type="text"
              name="port"
              value={form.port}
              onChange={handleChange}
              className="input w-full"
              placeholder="1521"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
            <input
              type="text"
              name="serviceName"
              value={form.serviceName}
              onChange={handleChange}
              className="input w-full"
              placeholder="e.g. ORCL"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="input w-full"
              placeholder="Oracle username"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="input w-full"
              placeholder="Oracle password"
            />
          </div>
        </div>

        {testResult && (
          <div className={`mt-4 p-3 rounded-md text-sm ${
            testSuccess ? 'bg-secondary-50 text-secondary-800 border border-secondary-200' :
            'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {testResult}
          </div>
        )}

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !form.host || !form.port}
            className="btn btn-secondary flex items-center"
          >
            <Plug size={16} className="mr-2" />
            {isTesting ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !form.host || !form.port || !form.serviceName}
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

export default OracleConnectionPage;

