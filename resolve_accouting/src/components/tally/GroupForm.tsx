import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getStoredUserInfo } from '../../utils/auth';
import toast from 'react-hot-toast';

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

interface GroupFormProps {
  onClose: () => void;
  editingGroupId?: number | null;
  group?: TallyGroup | null;
  onSuccess: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({ onClose, editingGroupId, group, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    parent_group: '',
    group_type: 'Primary',
    alias: '',
  });

  useEffect(() => {
    if (editingGroupId && group) {
      setFormData({
        name: group.name || '',
        code: group.code || '',
        parent_group: group.parent_group || '',
        group_type: group.group_type || 'Primary',
        alias: group.alias || '',
      });
    }
  }, [editingGroupId, group]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    setIsSubmitting(true);
    try {
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

      const url = editingGroupId 
        ? `${apiUrl}?id=${editingGroupId}`
        : apiUrl;

      const response = await fetch(url, {
        method: editingGroupId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        body: JSON.stringify({
          ...formData,
          org_id,
          code: formData.code || null,
          parent_group: formData.parent_group || null,
          alias: formData.alias || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save group');
      }

      const data = await response.json();
      toast.success(editingGroupId ? 'Group updated successfully' : 'Group created successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving group:', error);
      toast.error(error.message || 'Failed to save group');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">
            {editingGroupId ? 'Edit Group' : 'Add Group'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter group name"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              Code
            </label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter group code"
            />
          </div>

          <div>
            <label htmlFor="parent_group" className="block text-sm font-medium text-gray-700 mb-2">
              Parent Group
            </label>
            <input
              type="text"
              id="parent_group"
              name="parent_group"
              value={formData.parent_group}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter parent group name"
            />
          </div>

          <div>
            <label htmlFor="group_type" className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              id="group_type"
              name="group_type"
              value={formData.group_type}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Primary">Primary</option>
              <option value="Secondary">Secondary</option>
            </select>
          </div>

          <div>
            <label htmlFor="alias" className="block text-sm font-medium text-gray-700 mb-2">
              Alias
            </label>
            <input
              type="text"
              id="alias"
              name="alias"
              value={formData.alias}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter alias"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingGroupId ? 'Update Group' : 'Create Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GroupForm;

