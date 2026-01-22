import React, { useEffect, useState } from 'react';
import { CheckCircle2, PlugZap, Save, XCircle, Trash2, Edit } from 'lucide-react';
import { getStoredUserInfo } from '../../utils/auth';
import toast from 'react-hot-toast';
import InfoIcon from '../common/InfoIcon';
import Loader from '../common/Loader';

interface TallyConfigForm {
  profile_name: string;
  tally_ip: string;
  tally_port: string;
  tally_company_name: string;
}

interface TallyProfile {
  id: number;
  profile_name: string;
  tally_ip: string;
  tally_port: number;
  tally_company_name: string;
  created_at: string;
}

const TallyConfigPage: React.FC = () => {
  const [form, setForm] = useState<TallyConfigForm>({
    profile_name: '',
    tally_ip: '',
    tally_port: '9000',
    tally_company_name: 'Default Company',
  });
  const [profiles, setProfiles] = useState<TallyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async (onComplete?: (profiles: TallyProfile[]) => void) => {
    try {
      setIsLoadingProfiles(true);
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        console.warn('No org_id found, cannot load profiles');
        return;
      }

      console.log('Loading profiles for org_id:', org_id);
      const response = await fetch(`http://localhost:3001/api/tally/config/${org_id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load profiles: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const loadedProfiles = data.data || [];
        console.log('Loaded profiles:', loadedProfiles);
        setProfiles(loadedProfiles);
        
        // Call the callback if provided
        if (onComplete) {
          onComplete(loadedProfiles);
        } else {
          // If no profile is selected and we have profiles, select the first one
          if (selectedProfileId === null && loadedProfiles.length > 0) {
            handleSelectProfile(loadedProfiles[0]);
          }
        }
      } else {
        console.error('Failed to load profiles:', data.message);
        toast.error(data.message || 'Failed to load profiles');
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      toast.error('Error loading profiles. Please refresh the page.');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleSelectProfile = (profile: TallyProfile) => {
    setSelectedProfileId(profile.id);
    setForm({
      profile_name: profile.profile_name,
      tally_ip: profile.tally_ip,
      tally_port: profile.tally_port.toString(),
      tally_company_name: profile.tally_company_name,
    });
  };

  const handleNewProfile = () => {
    setSelectedProfileId(null);
    setForm({
      profile_name: '',
      tally_ip: '',
      tally_port: '9000',
      tally_company_name: 'Default Company',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    setTestSuccess(null);

    try {
      const { tally_ip, tally_port } = form;

      if (!tally_ip || !tally_port) {
        setTestResult('Please enter both Tally Host IP and Port.');
        setTestSuccess(false);
        return;
      }

      const response = await fetch('http://localhost:3001/api/tally/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tally_ip, tally_port }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.success) {
        setTestResult(data.message || `Successfully connected to Tally at ${tally_ip}:${tally_port}`);
        setTestSuccess(true);
      } else {
        setTestResult(
          data?.message ||
            `Could not connect to http://${tally_ip}:${tally_port}. Please ensure Tally is running, the IP/Port are correct, and firewall allows access.`,
        );
        setTestSuccess(false);
      }
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const { org_id, user_id } = getStoredUserInfo();
      const { profile_name, tally_ip, tally_port, tally_company_name } = form;

      if (!org_id || !user_id) {
        toast.error('Organisation or user information is missing. Please launch from Resolve and try again.');
        setIsSaving(false);
        return;
      }

      if (!profile_name || !tally_ip || !tally_port) {
        toast.error('Please enter Profile Name, Tally Host IP, and Port.');
        setIsSaving(false);
        return;
      }

      // Determine if this is an update or create
      const isUpdate = selectedProfileId !== null;
      const url = isUpdate 
        ? `http://localhost:3001/api/tally/config/${selectedProfileId}`
        : 'http://localhost:3001/api/tally/config';
      
      const method = isUpdate ? 'PUT' : 'POST';

      const requestBody: any = {
        org_id,
        profile_name,
        tally_company_name,
        tally_ip,
        tally_port: parseInt(tally_port, 10),
      };

      if (isUpdate) {
        requestBody.updated_by = user_id;
      } else {
        requestBody.created_by = user_id;
      }

      console.log(`Saving config (${isUpdate ? 'UPDATE' : 'CREATE'}):`, requestBody);

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // Parse response once
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Check if response is ok
      if (!response.ok) {
        throw new Error(data.message || `Failed to ${isUpdate ? 'update' : 'save'} configuration: ${response.status}`);
      }

      if (data.success) {
        toast.success(`Tally configuration ${isUpdate ? 'updated' : 'saved'} successfully.`);
        
        // Reload profiles and select the saved/updated profile
        const savedProfileId = data.data?.id;
        const savedProfileData = data.data;
        
        // Reload profiles list with a callback to select the saved profile
        await loadProfiles((loadedProfiles) => {
          // After profiles are loaded, find and select the saved/updated profile
          if (savedProfileId) {
            const profileToSelect = loadedProfiles.find(p => p.id === savedProfileId);
            if (profileToSelect) {
              handleSelectProfile(profileToSelect);
            } else if (savedProfileData) {
              // If profile not found in list (shouldn't happen), use the returned data
              handleSelectProfile(savedProfileData as TallyProfile);
            }
          }
        });
      } else {
        toast.error(data.message || `Failed to ${isUpdate ? 'update' : 'save'} Tally configuration.`);
      }
    } catch (error: any) {
      console.error('Error saving Tally config:', error);
      const errorMessage = error.message || 'Error saving Tally configuration. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProfile = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/tally/config/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Parse response once
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Check if response is ok
      if (!response.ok) {
        throw new Error(data.message || `Failed to delete profile: ${response.status}`);
      }

      if (data.success) {
        toast.success('Profile deleted successfully.');
        await loadProfiles();
        if (selectedProfileId === id) {
          handleNewProfile();
        }
      } else {
        toast.error(data.message || 'Failed to delete profile.');
      }
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      const errorMessage = error.message || 'Error deleting profile. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Tally Integration</h2>
          <InfoIcon
            title="Tally Integration"
            content="Configure Tally connection settings and manage profiles. Create multiple Tally profiles for different companies or environments. Test connections before saving to ensure proper integration."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profiles List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Tally Profiles</h3>
              <button
                onClick={handleNewProfile}
                className="text-sm text-secondary-600 hover:text-secondary-700 font-medium"
              >
                + New Profile
              </button>
            </div>
            {isLoadingProfiles ? (
              <Loader 
                message="Loading profiles..."
                size="sm"
                variant="compact"
              />
            ) : profiles.length === 0 ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                No profiles yet. Create one to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.map((profile) => (
                  <div
                    key={profile.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedProfileId === profile.id
                        ? 'border-secondary-500 bg-secondary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleSelectProfile(profile)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">{profile.profile_name}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {profile.tally_ip}:{profile.tally_port}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteProfile(profile.id);
                        }}
                        className="text-red-500 hover:text-red-700 ml-2"
                        title="Delete profile"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Configuration Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 space-y-6 relative overflow-hidden">
            {/* Animated connection indicator */}
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary-50 blur-3xl opacity-60" />

            <div className="flex items-center gap-4 mb-4">
              <div
                className={`relative flex items-center justify-center h-14 w-14 rounded-full border-2 
                ${
                  isTesting
                    ? 'border-secondary-400 bg-secondary-50 animate-pulse'
                    : testSuccess === true
                    ? 'border-secondary-500 bg-secondary-50 animate-[pulse_1.8s_ease-in-out_infinite]'
                    : testSuccess === false
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                {isTesting && (
                  <PlugZap className="text-secondary-600 animate-spin" size={26} />
                )}
                {testSuccess === true && !isTesting && (
                  <CheckCircle2 className="text-secondary-600" size={26} />
                )}
                {testSuccess === false && !isTesting && (
                  <XCircle className="text-red-600" size={26} />
                )}
                {testSuccess === null && !isTesting && (
                  <PlugZap className="text-gray-400" size={26} />
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-700">
                  {isTesting
                    ? 'Testing connection to Tally...'
                    : testSuccess === true
                    ? 'Tally connection looks good.'
                    : testSuccess === false
                    ? 'Unable to reach Tally.'
                    : 'Enter the Tally IP and Port, then test the connection.'}
                </span>
                <span className="text-xs text-gray-500">
                  We ping your Tally server from the backend so browser security (CORS) will not block it.
                </span>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-6 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="profile_name"
                    value={form.profile_name}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="e.g. Production Tally, Test Tally"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    A unique name to identify this Tally configuration profile.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tally Host IP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tally_ip"
                    value={form.tally_ip}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="e.g. 127.0.0.1 or 192.168.1.10"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    IP address of the machine where Tally is running.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tally Port <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="tally_port"
                    value={form.tally_port}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="e.g. 9000"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Port configured in Tally for ODBC/HTTP communication.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tally Company Name
                  </label>
                  <input
                    type="text"
                    name="tally_company_name"
                    value={form.tally_company_name}
                    onChange={handleChange}
                    className="input w-full"
                    placeholder="e.g. Default Company"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Company name in Tally (optional).
                  </p>
                </div>
              </div>

              {testResult && (
                <div
                  className={`rounded-md p-3 text-sm transition-all duration-300 ${
                    testSuccess
                      ? 'bg-secondary-50 text-secondary-800 border border-secondary-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testResult}
                </div>
              )}

              <div className="flex flex-wrap gap-3 justify-end mt-4">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting || !form.tally_ip || !form.tally_port}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-400 hover:bg-gray-50 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <PlugZap size={16} />
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={isSaving || !form.profile_name || !form.tally_ip || !form.tally_port}
                  className="inline-flex items-center gap-2 rounded-full bg-secondary-500 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-secondary-600 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={16} />
                  {isSaving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TallyConfigPage;
