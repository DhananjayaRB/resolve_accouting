import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Calendar, Save } from 'lucide-react';
import { ReportFormat, ReportDetailLevel } from '../../types';

interface ReportFormProps {
  onClose: () => void;
}

const ReportForm: React.FC<ReportFormProps> = ({ onClose }) => {
  const { generatePayrollJournal } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    format: 'Excel' as ReportFormat,
    detailLevel: 'Detailed' as ReportDetailLevel,
    startDate: '',
    endDate: '',
    includeInactive: false,
    saveAsTemplate: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim()) {
      alert('Report name is required');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      alert('Date range is required');
      return;
    }
    
    // Generate journal
    generatePayrollJournal(formData.startDate, formData.endDate);
    
    onClose();
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Generate Payroll Journal</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Report Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input mt-1"
              placeholder="e.g., January 2025 Payroll Journal"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="format" className="block text-sm font-medium text-gray-700">
                Format *
              </label>
              <select
                id="format"
                name="format"
                value={formData.format}
                onChange={handleChange}
                required
                className="select mt-1"
              >
                <option value="Excel">Excel</option>
                <option value="TallyXML">Tally XML</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="detailLevel" className="block text-sm font-medium text-gray-700">
                Detail Level *
              </label>
              <select
                id="detailLevel"
                name="detailLevel"
                value={formData.detailLevel}
                onChange={handleChange}
                required
                className="select mt-1"
              >
                <option value="Detailed">Detailed</option>
                <option value="Summary">Summary</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                Start Date *
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  id="startDate"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  className="input pl-9"
                />
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                End Date *
              </label>
              <div className="relative mt-1">
                <input
                  type="date"
                  id="endDate"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  className="input pl-9"
                />
                <Calendar size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="includeInactive"
                name="includeInactive"
                checked={formData.includeInactive}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="includeInactive" className="ml-2 block text-sm text-gray-700">
                Include inactive ledgers
              </label>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="saveAsTemplate"
                name="saveAsTemplate"
                checked={formData.saveAsTemplate}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="saveAsTemplate" className="ml-2 block text-sm text-gray-700">
                Save as report template
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary flex items-center"
          >
            <Save size={18} className="mr-1" /> Generate Journal
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReportForm;