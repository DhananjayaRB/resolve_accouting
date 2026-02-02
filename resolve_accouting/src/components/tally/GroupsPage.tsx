import React, { useState, useEffect } from 'react';
import { Search, Download, RefreshCw, FolderTree, Edit, Trash2, Filter } from 'lucide-react';
import { getStoredUserInfo } from '../../utils/auth';
import toast from 'react-hot-toast';
import InfoIcon from '../common/InfoIcon';
import Loader from '../common/Loader';
import GroupForm from './GroupForm';
import * as XLSX from 'xlsx-js-style';
import { styleHeaderRow, styleTitleCell, createStyledWorksheet } from '../../utils/excelStyles';

interface TallyGroup {
  id: number;
  name: string;
  code: string | null;
  parent_group: string | null;
  group_type: string | null;
  alias: string | null;
  org_id: string;
  created_at: string;
  updated_at: string;
}

const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<TallyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TallyGroup | null>(null);
  const [filterType, setFilterType] = useState<string>('All');
  const [filterParentGroup, setFilterParentGroup] = useState<string>('All');
  const [filterName, setFilterName] = useState<string>('All');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        toast.error('Organization ID is required');
        return;
      }

      // Get API URL dynamically
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = import.meta.env.VITE_API_PORT || '3001';
      const apiUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
        ? `${protocol}//${hostname}:${port}/api/tally/groups`
        : `http://localhost:${port}/api/tally/groups`;

      const response = await fetch(`${apiUrl}?org_id=${org_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }

      const data = await response.json();
      setGroups(data);
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      toast.error('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncFromTally = async () => {
    setIsSyncing(true);
    try {
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        toast.error('Organization ID is required');
        setIsSyncing(false);
        return;
      }

      // Get selected profile
      const profilesResponse = await fetch(
        `http://localhost:${import.meta.env.VITE_API_PORT || '3001'}/api/tally/config/${org_id}`,
        {
          headers: { 'X-Org-Id': org_id }
        }
      );
      const profilesData = await profilesResponse.json();
      
      if (!profilesData.success || !profilesData.data || profilesData.data.length === 0) {
        toast.error('No Tally profile found. Please create a Tally profile first.');
        setIsSyncing(false);
        return;
      }

      const profileId = profilesData.data[0].id;

      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = import.meta.env.VITE_API_PORT || '3001';
      const apiUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
        ? `${protocol}//${hostname}:${port}/api/tally/sync-masters`
        : `http://localhost:${port}/api/tally/sync-masters`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        body: JSON.stringify({ 
          org_id, 
          master_type: 'groups',
          profile_id: profileId
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Successfully synced ${data.count || 0} groups from Tally`);
        fetchGroups(); // Refresh the list
      } else {
        toast.error(data.message || 'Failed to sync from Tally');
      }
    } catch (error) {
      console.error('Error syncing from Tally:', error);
      toast.error('Error syncing from Tally. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEditClick = (group: TallyGroup) => {
    setEditingGroup(group);
    setShowForm(true);
  };

  const handleDeleteClick = async (groupId: number) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

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
        ? `${protocol}//${hostname}:${port}/api/tally/groups`
        : `http://localhost:${port}/api/tally/groups`;

      const response = await fetch(`${apiUrl}?id=${groupId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete group');
      }

      toast.success('Group deleted successfully');
      fetchGroups(); // Refresh the list
    } catch (error: any) {
      console.error('Error deleting group:', error);
      toast.error(error.message || 'Failed to delete group');
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGroup(null);
  };

  const handleFormSuccess = () => {
    fetchGroups(); // Refresh the list after successful save
  };

  // Get unique values for filters
  const uniqueTypes = Array.from(new Set(groups.map(g => g.group_type).filter(Boolean))) as string[];
  const uniqueParentGroups = Array.from(new Set(groups.map(g => g.parent_group).filter(Boolean))) as string[];
  const uniqueNames = Array.from(new Set(groups.map(g => g.name).filter(Boolean))).sort() as string[];

  const handleDownloadExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Prepare data for export
      const exportData = filteredGroups.map(group => ({
        'Name': group.name || '',
        'Code': group.code || '',
        'Parent Group': group.parent_group || '',
        'Type': group.group_type || '',
        'Alias': group.alias || '',
        'Synced At': new Date(group.created_at).toLocaleDateString(),
        'Updated At': new Date(group.updated_at).toLocaleDateString(),
      }));

      if (exportData.length === 0) {
        toast.error('No data to export');
        return;
      }

      // Create worksheet with styled headers
      const ws = createStyledWorksheet(exportData, 'Groups', {
        columnWidths: [30, 20, 25, 15, 25, 15, 15],
        freezeHeader: true,
      });

      XLSX.utils.book_append_sheet(wb, ws, 'Groups');
      
      const fileName = `tally_groups_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Exported ${exportData.length} groups to Excel`);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  const filteredGroups = groups.filter(group => {
    // Search filter - check name, code, parent_group, alias
    const matchesSearch = !searchTerm || 
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (group.code && group.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (group.parent_group && group.parent_group.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (group.alias && group.alias.toLowerCase().includes(searchTerm.toLowerCase()));

    // Type filter
    const matchesType = filterType === 'All' || group.group_type === filterType;

    // Parent Group filter
    const matchesParentGroup = filterParentGroup === 'All' || 
      (filterParentGroup === 'None' && !group.parent_group) ||
      group.parent_group === filterParentGroup;

    // Name filter (exact match)
    const matchesName = filterName === 'All' || group.name === filterName;

    return matchesSearch && matchesType && matchesParentGroup && matchesName;
  });

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="h-full flex flex-col animate-fade-in relative">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Groups</h2>
          <InfoIcon
            title="Tally Groups"
            content="Account groups and categories synced from Tally. Groups are used to organize ledgers in the chart of accounts."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadExcel}
            className="btn btn-secondary flex items-center"
            title="Download as Excel"
            disabled={filteredGroups.length === 0}
          >
            <Download size={18} className="mr-1" /> Download Excel
          </button>
          <button
            onClick={handleSyncFromTally}
            disabled={isSyncing}
            className="btn btn-secondary flex items-center"
            title="Sync Groups from Tally"
          >
            <RefreshCw size={18} className={`mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync from Tally'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center flex-shrink-0">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search groups by name, code, parent, or alias..."
            className="flex-grow focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="select text-sm py-2"
          >
            <option value="All">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <select
            value={filterParentGroup}
            onChange={(e) => setFilterParentGroup(e.target.value)}
            className="select text-sm py-2"
          >
            <option value="All">All Parent Groups</option>
            <option value="None">No Parent Group</option>
            {uniqueParentGroups.map(parent => (
              <option key={parent} value={parent}>{parent}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <select
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="select text-sm py-2 min-w-[200px]"
          >
            <option value="All">All Names</option>
            {uniqueNames.slice(0, 100).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Groups Table - Scrollable */}
      <div className="table-container custom-scrollbar">
        <table className="table">
          <thead className="table-header">
            <tr>
              <th className="table-header-cell">Name</th>
              <th className="table-header-cell">Code</th>
              <th className="table-header-cell">Parent Group</th>
              <th className="table-header-cell">Type</th>
              <th className="table-header-cell">Alias</th>
              <th className="table-header-cell">Synced At</th>
              <th className="table-header-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="table-body">
            {filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {groups.length === 0 ? (
                    <div className="flex flex-col items-center gap-2">
                      <FolderTree size={48} className="text-gray-300" />
                      <p>No groups found. Sync from Tally to get started.</p>
                    </div>
                  ) : (
                    'No groups match your filter criteria.'
                  )}
                </td>
              </tr>
            ) : (
              filteredGroups.map((group) => (
                <tr key={group.id} className="table-row">
                  <td className="table-cell font-medium text-gray-900">{group.name}</td>
                  <td className="table-cell">{group.code || '-'}</td>
                  <td className="table-cell">
                    {group.parent_group ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {group.parent_group}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell">
                    {group.group_type ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        group.group_type === 'Primary' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {group.group_type}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="table-cell">{group.alias || '-'}</td>
                  <td className="table-cell text-gray-500">
                    {new Date(group.created_at).toLocaleDateString()}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditClick(group)}
                        className="text-primary-600 hover:text-primary-900 transition-colors p-1 rounded hover:bg-primary-50"
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(group.id)}
                        className="text-red-600 hover:text-red-900 transition-colors p-1 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Group Form Modal */}
      {showForm && (
        <GroupForm
          onClose={handleFormClose}
          editingGroupId={editingGroup?.id || null}
          group={editingGroup}
          onSuccess={handleFormSuccess}
        />
      )}

      {filteredGroups.length > 0 && (
        <div className="text-sm text-gray-600">
          Showing {filteredGroups.length} of {groups.length} groups
        </div>
      )}
    </div>
  );
};

export default GroupsPage;

