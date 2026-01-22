import React, { useState } from 'react';
import { Building2, UserCog, Shield, Bell, Key, Save, Plus, Trash2, Edit } from 'lucide-react';

// Organization Settings
export const OrganizationSettingsPage: React.FC = () => {
  const [form, setForm] = useState({
    name: 'Resolve Pay Organization',
    taxId: 'GST123456789',
    address: '123 Business Street, City, State 123456',
    phone: '+91-1234567890',
    email: 'contact@resolvepay.in',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Organization Settings</h2>
        <p className="text-gray-600 mt-1">Manage organization information and details</p>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(form).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                className="input w-full"
              />
            </div>
          ))}
        </div>
        <button className="btn btn-primary mt-6 flex items-center">
          <Save size={18} className="mr-1" /> Save Changes
        </button>
      </div>
    </div>
  );
};

// Users & Roles
export const UsersRolesPage: React.FC = () => {
  const sampleUsers = [
    { id: 1, name: 'Admin User', email: 'admin@resolvepay.in', role: 'Administrator', status: 'Active' },
    { id: 2, name: 'Finance Manager', email: 'finance@resolvepay.in', role: 'Manager', status: 'Active' },
    { id: 3, name: 'Accountant', email: 'accountant@resolvepay.in', role: 'User', status: 'Active' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Users & Roles</h2>
          <p className="text-gray-600 mt-1">Manage system users and their roles</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-1" /> Add User
        </button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Name</th>
              <th className="table-header-cell">Email</th>
              <th className="table-header-cell">Role</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleUsers.map((user) => (
              <tr key={user.id} className="table-row">
                <td className="table-cell font-medium">{user.name}</td>
                <td className="table-cell">{user.email}</td>
                <td className="table-cell"><span className="badge badge-secondary">{user.role}</span></td>
                <td className="table-cell"><span className="badge badge-success">{user.status}</span></td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button className="text-secondary-600"><Edit size={16} /></button>
                    <button className="text-red-600"><Trash2 size={16} /></button>
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

// Permissions
export const PermissionsPage: React.FC = () => {
  const samplePermissions = [
    { role: 'Administrator', ledger: true, payroll: true, reports: true, settings: true },
    { role: 'Manager', ledger: true, payroll: true, reports: true, settings: false },
    { role: 'User', ledger: true, payroll: false, reports: false, settings: false },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Permissions</h2>
        <p className="text-gray-600 mt-1">Configure role-based access permissions</p>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Role</th>
              <th className="table-header-cell text-center">Ledger</th>
              <th className="table-header-cell text-center">Payroll</th>
              <th className="table-header-cell text-center">Reports</th>
              <th className="table-header-cell text-center">Settings</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {samplePermissions.map((perm, idx) => (
              <tr key={idx} className="table-row">
                <td className="table-cell font-medium">{perm.role}</td>
                <td className="table-cell text-center">{perm.ledger ? '✓' : '✗'}</td>
                <td className="table-cell text-center">{perm.payroll ? '✓' : '✗'}</td>
                <td className="table-cell text-center">{perm.reports ? '✓' : '✗'}</td>
                <td className="table-cell text-center">{perm.settings ? '✓' : '✗'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Notifications
export const NotificationsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    syncAlerts: true,
    errorAlerts: true,
    weeklyReports: false,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Notifications</h2>
        <p className="text-gray-600 mt-1">Configure notification preferences</p>
      </div>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="space-y-4">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <label className="font-medium text-gray-800 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                <p className="text-sm text-gray-600">Receive notifications for {key.replace(/([A-Z])/g, ' $1').toLowerCase()}</p>
              </div>
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                className="h-5 w-5 rounded border-gray-300 text-secondary-600 focus:ring-secondary-500"
              />
            </div>
          ))}
        </div>
        <button className="btn btn-primary mt-6 flex items-center">
          <Save size={18} className="mr-1" /> Save Preferences
        </button>
      </div>
    </div>
  );
};

// API Keys
export const APIKeysPage: React.FC = () => {
  const sampleKeys = [
    { id: 1, name: 'Production API Key', key: 'sk_live_1234567890abcdef', created: '2025-01-15', lastUsed: '2025-01-20', status: 'Active' },
    { id: 2, name: 'Test API Key', key: 'sk_test_abcdef1234567890', created: '2025-01-10', lastUsed: '2025-01-18', status: 'Active' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">API Keys</h2>
          <p className="text-gray-600 mt-1">Manage API keys for external integrations</p>
        </div>
        <button className="btn btn-primary flex items-center">
          <Plus size={18} className="mr-1" /> Generate Key
        </button>
      </div>
      <div className="table-container">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Name</th>
              <th className="table-header-cell">Key</th>
              <th className="table-header-cell">Created</th>
              <th className="table-header-cell">Last Used</th>
              <th className="table-header-cell">Status</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {sampleKeys.map((k) => (
              <tr key={k.id} className="table-row">
                <td className="table-cell font-medium">{k.name}</td>
                <td className="table-cell font-mono text-sm">{k.key.substring(0, 20)}...</td>
                <td className="table-cell">{k.created}</td>
                <td className="table-cell">{k.lastUsed}</td>
                <td className="table-cell"><span className="badge badge-success">{k.status}</span></td>
                <td className="table-cell">
                  <div className="flex gap-2">
                    <button className="text-secondary-600"><Edit size={16} /></button>
                    <button className="text-red-600"><Trash2 size={16} /></button>
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

