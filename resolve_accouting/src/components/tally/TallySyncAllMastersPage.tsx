import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FolderTree, 
  Building2, 
  Package, 
  Ruler, 
  Users, 
  FileText, 
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Receipt,
  ChevronDown,
  Settings
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getStoredUserInfo } from '../../utils/auth';
import InfoIcon from '../common/InfoIcon';

interface MasterData {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  endpoint: string;
  lastSync: string | null;
  recordCount: number;
  status: 'idle' | 'syncing' | 'success' | 'error';
  isTransaction?: boolean;
}

interface TallyProfile {
  id: number;
  profile_name: string;
  tally_ip: string;
  tally_port: number;
  tally_company_name: string;
  created_at: string;
}

const TallySyncAllMastersPage: React.FC = () => {
  const [masters, setMasters] = useState<MasterData[]>([
    {
      id: 'groups',
      name: 'Groups',
      icon: <FolderTree size={24} />,
      description: 'Account groups and categories',
      endpoint: '/api/tally/sync-masters',
      lastSync: null,
      recordCount: 0,
      status: 'idle'
    },
    {
      id: 'ledgers',
      name: 'Ledgers',
      icon: <BookOpen size={24} />,
      description: 'Chart of Accounts - All ledger accounts',
      endpoint: '/api/tally/sync-masters',
      lastSync: null,
      recordCount: 0,
      status: 'idle'
    },
    {
      id: 'vouchers',
      name: 'Voucher Types',
      icon: <FileText size={24} />,
      description: 'Voucher type configurations',
      endpoint: '/api/tally/sync-masters',
      lastSync: null,
      recordCount: 0,
      status: 'idle'
    },
    {
      id: 'costcenters',
      name: 'Cost Centers',
      icon: <Building2 size={24} />,
      description: 'Cost centers and departments',
      endpoint: '/api/tally/sync-masters',
      lastSync: null,
      recordCount: 0,
      status: 'idle'
    },
    {
      id: 'stockitems',
      name: 'Stock Items',
      icon: <Package size={24} />,
      description: 'Inventory items and stock masters',
      endpoint: '/api/tally/sync-masters',
      lastSync: null,
      recordCount: 0,
      status: 'idle'
    },
    {
      id: 'units',
      name: 'Units',
      icon: <Ruler size={24} />,
      description: 'Units of measurement',
      endpoint: '/api/tally/sync-masters',
      lastSync: null,
      recordCount: 0,
      status: 'idle'
    },
    {
      id: 'parties',
      name: 'Parties',
      icon: <Users size={24} />,
      description: 'Customers and suppliers',
      endpoint: '/api/tally/sync-masters',
      lastSync: null,
      recordCount: 0,
      status: 'idle'
    },
    {
      id: 'transactions',
      name: 'All Transactions',
      icon: <Receipt size={24} />,
      description: 'All vouchers and transactions from Tally',
      endpoint: '/api/tally/sync-transactions',
      lastSync: null,
      recordCount: 0,
      status: 'idle',
      isTransaction: true
    },
  ]);

  const [syncingAll, setSyncingAll] = useState(false);
  const [profiles, setProfiles] = useState<TallyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingSyncMaster, setPendingSyncMaster] = useState<MasterData | null>(null);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  useEffect(() => {
    // Load last sync times and record counts
    loadSyncStatus();
    // Load Tally profiles
    loadProfiles();
  }, []);

  const loadSyncStatus = async () => {
    try {
      const { org_id } = getStoredUserInfo();
      if (!org_id) return;

      // Fetch sync status for each master type
      // This would typically come from a sync logs table
      // For now, we'll just update the UI with placeholder data
      setMasters(prev => prev.map(master => ({
        ...master,
        lastSync: localStorage.getItem(`tally_sync_${master.id}_${org_id}`) || null,
        recordCount: parseInt(localStorage.getItem(`tally_count_${master.id}_${org_id}`) || '0')
      })));
    } catch (error) {
      console.error('Error loading sync status:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      setIsLoadingProfiles(true);
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        toast.error('Organization ID is required');
        return;
      }

      // Get API URL dynamically
      // Express server uses path parameter, Vercel uses query parameter
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = import.meta.env.VITE_API_PORT || '3001';
      const apiUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
        ? `${protocol}//${hostname}:${port}/api/tally/config?org_id=${org_id}`
        : `http://localhost:${port}/api/tally/config/${org_id}`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load Tally profiles');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setProfiles(data.data);
        // Auto-select first profile if available
        if (data.data.length > 0 && selectedProfileId === null) {
          setSelectedProfileId(data.data[0].id);
        }
      } else {
        throw new Error(data.message || 'Failed to load profiles');
      }
    } catch (error: any) {
      console.error('Error loading profiles:', error);
      toast.error('Failed to load Tally profiles. Please configure Tally profiles first.');
    } finally {
      setIsLoadingProfiles(false);
    }
  };

  const handleSync = async (master: MasterData, profileId?: number) => {
    try {
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        toast.error('Organization ID is required');
        return;
      }

      // Check if profile selection is needed
      const profileIdToUse = profileId || selectedProfileId;
      
      if (!profileIdToUse) {
        if (profiles.length === 0) {
          toast.error('No Tally profiles found. Please create a Tally profile first.');
          return;
        }
        // If multiple profiles, show selection modal
        if (profiles.length > 1) {
          setPendingSyncMaster(master);
          setShowProfileModal(true);
          return;
        }
        // If only one profile, use it
        if (profiles.length === 1) {
          setSelectedProfileId(profiles[0].id);
        }
      }

      // Update status to syncing
      setMasters(prev => prev.map(m => 
        m.id === master.id ? { ...m, status: 'syncing' as const } : m
      ));

      // Get API URL dynamically
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = import.meta.env.VITE_API_PORT || '3001';
      const apiUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
        ? `${protocol}//${hostname}:${port}${master.endpoint}`
        : `http://localhost:${port}${master.endpoint}`;

      const requestBody: any = { 
        org_id,
        profile_id: profileIdToUse || selectedProfileId
      };
      
      // For transactions, add date range if needed
      if (master.isTransaction) {
        // Use current financial year by default
        const today = new Date();
        const currentYear = today.getFullYear();
        const financialYearStart = new Date(currentYear, 3, 1); // April 1st
        const financialYearEnd = new Date(currentYear + 1, 2, 31); // March 31st
        
        requestBody.from_date = financialYearStart.toISOString().split('T')[0];
        requestBody.to_date = financialYearEnd.toISOString().split('T')[0];
      } else {
        requestBody.master_type = master.id;
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (data.success) {
        const syncTime = new Date().toISOString();
        localStorage.setItem(`tally_sync_${master.id}_${org_id}`, syncTime);
        localStorage.setItem(`tally_count_${master.id}_${org_id}`, data.count?.toString() || '0');

        setMasters(prev => prev.map(m => 
          m.id === master.id 
            ? { 
                ...m, 
                status: 'success' as const,
                lastSync: syncTime,
                recordCount: data.count || 0
              } 
            : m
        ));

        toast.success(`${master.name} synced successfully! ${data.count || 0} records imported.`);
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setMasters(prev => prev.map(m => 
            m.id === master.id ? { ...m, status: 'idle' as const } : m
          ));
        }, 3000);
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (error: any) {
      console.error(`Error syncing ${master.name}:`, error);
      setMasters(prev => prev.map(m => 
        m.id === master.id ? { ...m, status: 'error' as const } : m
      ));
      toast.error(`Failed to sync ${master.name}: ${error.message || 'Unknown error'}`);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setMasters(prev => prev.map(m => 
          m.id === master.id ? { ...m, status: 'idle' as const } : m
        ));
      }, 3000);
    }
  };

  const handleSyncAll = async () => {
    // Check if profile selection is needed
    if (!selectedProfileId) {
      if (profiles.length === 0) {
        toast.error('No Tally profiles found. Please create a Tally profile first.');
        return;
      }
      if (profiles.length > 1) {
        toast.error('Please select a Tally profile before syncing all masters.');
        return;
      }
      if (profiles.length === 1) {
        setSelectedProfileId(profiles[0].id);
      }
    }

    setSyncingAll(true);
    
    // Update all masters to syncing status
    setMasters(prev => prev.map(m => ({ ...m, status: 'syncing' as const })));
    
    try {
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        toast.error('Organization ID is required');
        return;
      }

      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = import.meta.env.VITE_API_PORT || '3001';
      const apiUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
        ? `${protocol}//${hostname}:${port}/api/tally/sync-all-masters`
        : `http://localhost:${port}/api/tally/sync-all-masters`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        body: JSON.stringify({
          org_id,
          profile_id: selectedProfileId || profiles[0]?.id
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update all masters to success status
        setMasters(prev => prev.map(m => ({ ...m, status: 'success' as const })));
        
        const counts = data.counts || {};
        toast.success(
          `All masters synced successfully! ` +
          `Categories: ${counts.mainCategories || 0}, ` +
          `Groups: ${counts.subGroups || 0}, ` +
          `Ledgers: ${counts.ledgers || 0}`
        );
        
        // Update record counts in localStorage
        const { org_id } = getStoredUserInfo();
        if (org_id) {
          localStorage.setItem(`tally_count_groups_${org_id}`, String(counts.subGroups || 0));
          localStorage.setItem(`tally_count_ledgers_${org_id}`, String(counts.ledgers || 0));
          localStorage.setItem(`tally_sync_groups_${org_id}`, new Date().toISOString());
          localStorage.setItem(`tally_sync_ledgers_${org_id}`, new Date().toISOString());
        }
        
        // Refresh sync status
        loadSyncStatus();
        
        // Reset status after 3 seconds
        setTimeout(() => {
          setMasters(prev => prev.map(m => ({ ...m, status: 'idle' as const })));
        }, 3000);
      } else {
        throw new Error(data.message || 'Sync failed');
      }
    } catch (error: any) {
      console.error('Error syncing all masters:', error);
      setMasters(prev => prev.map(m => ({ ...m, status: 'error' as const })));
      toast.error(`Failed to sync all masters: ${error.message || 'Unknown error'}`);
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setMasters(prev => prev.map(m => ({ ...m, status: 'idle' as const })));
      }, 3000);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleProfileSelect = (profileId: number) => {
    setSelectedProfileId(profileId);
    setShowProfileModal(false);
    
    // If there was a pending sync, execute it now
    if (pendingSyncMaster) {
      handleSync(pendingSyncMaster, profileId);
      setPendingSyncMaster(null);
    }
  };

  const getStatusIcon = (status: MasterData['status']) => {
    switch (status) {
      case 'syncing':
        return <RefreshCw size={20} className="text-secondary-600 animate-spin" />;
      case 'success':
        return <CheckCircle2 size={20} className="text-green-600" />;
      case 'error':
        return <XCircle size={20} className="text-red-600" />;
      default:
        return <Clock size={20} className="text-gray-400" />;
    }
  };

  const formatLastSync = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hr ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="space-y-6 animate-fade-in p-1">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-light text-gray-800">Sync All Masters from Tally</h2>
          <InfoIcon
            title="Tally Master Data Sync"
            content="Sync all master data and transactions from your Tally ERP system. This includes ledgers, groups, cost centers, stock items, and all transactions. Each type can be synced individually or all at once."
          />
        </div>
        <button
          onClick={handleSyncAll}
          disabled={syncingAll}
          className="btn btn-primary flex items-center gap-2 flex-shrink-0"
        >
          <RefreshCw size={18} className={syncingAll ? 'animate-spin' : ''} />
          {syncingAll ? 'Syncing All...' : 'Sync All Masters'}
        </button>
      </div>

      {/* Profile Selector in Header */}
      {profiles.length > 0 && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-gray-600" />
            <span className="text-sm text-gray-600 font-light">Tally Profile:</span>
            <select
              value={selectedProfileId || ''}
              onChange={(e) => setSelectedProfileId(Number(e.target.value))}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.profile_name} ({profile.tally_company_name})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
        {masters.map((master) => (
          <div
            key={master.id}
            className={`bg-white rounded-2xl shadow-lg border p-6 hover:shadow-xl transition-all duration-200 ${
              master.isTransaction 
                ? 'border-primary-300 bg-gradient-to-br from-primary-50 to-white' 
                : 'border-gray-100'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${
                  master.isTransaction 
                    ? 'bg-primary-100 text-primary-600' 
                    : 'bg-secondary-50 text-secondary-600'
                }`}>
                  {master.icon}
                </div>
                <div>
                  <h3 className="text-lg font-light text-gray-800">{master.name}</h3>
                  <p className="text-xs text-gray-500 font-light mt-1">{master.description}</p>
                </div>
              </div>
              {getStatusIcon(master.status)}
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-light">Records:</span>
                <span className="font-light text-gray-800">{master.recordCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-light">Last Sync:</span>
                <span className="font-light text-gray-800">{formatLastSync(master.lastSync)}</span>
              </div>
            </div>

            <button
              onClick={() => handleSync(master)}
              disabled={master.status === 'syncing' || syncingAll}
              className={`w-full btn ${
                master.status === 'syncing' 
                  ? 'btn-secondary' 
                  : master.status === 'success'
                  ? 'btn-success'
                  : master.status === 'error'
                  ? 'btn-error'
                  : 'btn-primary'
              } flex items-center justify-center gap-2`}
            >
              {master.status === 'syncing' ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Syncing...
                </>
              ) : master.status === 'success' ? (
                <>
                  <CheckCircle2 size={16} />
                  Synced
                </>
              ) : master.status === 'error' ? (
                <>
                  <XCircle size={16} />
                  Retry Sync
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Sync Now
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {masters.every(m => m.status === 'idle' && !m.lastSync) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle size={20} className="text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-light text-blue-800 mb-1">Getting Started</h4>
            <p className="text-xs text-blue-700 font-light">
              Click "Sync Now" on any master tile to import data from Tally, or use "Sync All Masters" to sync everything at once. 
              Make sure your Tally configuration is set up correctly before syncing.
            </p>
          </div>
        </div>
      )}

      {/* Profile Selection Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-light text-gray-800">Select Tally Profile</h3>
              <button
                onClick={() => {
                  setShowProfileModal(false);
                  setPendingSyncMaster(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Select which Tally profile to use for syncing <strong>{pendingSyncMaster?.name}</strong>:
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    selectedProfileId === profile.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-800">{profile.profile_name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {profile.tally_company_name} • {profile.tally_ip}:{profile.tally_port}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default TallySyncAllMastersPage;

