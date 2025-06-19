import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, FileSpreadsheet, FileCheck } from 'lucide-react';
import { ReportFormat, ReportDetailLevel } from '../../types';
import { useApp } from '../../context/AppContext';

interface SetupReportsProps {
  onNext: () => void;
  onBack: () => void;
}

const SetupReports: React.FC<SetupReportsProps> = ({ onNext, onBack }) => {
  const { addReportConfiguration } = useApp();
  const [defaultFormat, setDefaultFormat] = useState<ReportFormat>('Excel');
  const [defaultDetailLevel, setDefaultDetailLevel] = useState<ReportDetailLevel>('Detailed');
  
  // Form for a report template
  const [formData, setFormData] = useState({
    name: '',
    format: 'Excel' as ReportFormat,
    detailLevel: 'Detailed' as ReportDetailLevel,
    includeInactive: false,
  });
  
  const [ipAddress, setIpAddress] = useState('');
  const [portNo, setPortNo] = useState('');
  const [tallyCompanyName, setTallyCompanyName] = useState('');
  
  // Helper to extract org_id and user_id from resolve-tokens in localStorage
  function getOrgAndUserIdFromResolveTokens() {
    try {
      const tokens = JSON.parse(localStorage.getItem('resolve-tokens') || '{}');
      return {
        org_id: tokens.orgId || '',
        user_id: tokens.userId || ''
      };
    } catch (e) {
      return { org_id: '', user_id: '' };
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };
  
  const handleDefaultFormatChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultFormat(e.target.value as ReportFormat);
  };
  
  const handleDefaultDetailLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultDetailLevel(e.target.value as ReportDetailLevel);
  };
  
  const handleAddTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Template name is required');
      return;
    }
    
    addReportConfiguration({
      ...formData,
    });
    
    // Reset form
    setFormData({
      name: '',
      format: 'Excel',
      detailLevel: 'Detailed',
      includeInactive: false,
    });
  };
  
  const handleContinue = async () => {
    const { org_id, user_id } = getOrgAndUserIdFromResolveTokens();
    console.log('Will send:', {
      org_id,
      tally_company_name: tallyCompanyName,
      tally_ip: ipAddress,
      tally_port: portNo,
      created_by: user_id
    });
    try {
      const response = await fetch('http://localhost:3001/api/tally/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id,
          tally_company_name: tallyCompanyName,
          tally_ip: ipAddress,
          tally_port: portNo,
          created_by: user_id
        })
      });
      const data = await response.json();
      if (data.success) {
        // Optionally show a success message
        onNext();
      } else {
        alert(data.message || 'Failed to save Tally config');
      }
    } catch (error) {
      alert('Error saving Tally config');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center text-lg font-medium text-gray-900">
        <FileSpreadsheet className="h-6 w-6 text-primary-600 mr-2" />
        Step 3: Configure Tally Connection
      </div>
      <p className="text-gray-600">
        Please enter the Tally IP Address and Port Number to connect to Tally.
      </p>
      {/* Only show IP Address and Port No. fields and Continue button */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <form className="space-y-4">
          <div>
            <label htmlFor="ipAddress" className="block text-sm font-medium text-gray-700">
              IP Address
            </label>
            <input
              type="text"
              id="ipAddress"
              name="ipAddress"
              value={ipAddress}
              onChange={e => setIpAddress(e.target.value)}
              className="input mt-1"
              placeholder="e.g., 192.168.20.82"
            />
          </div>
          <div>
            <label htmlFor="portNo" className="block text-sm font-medium text-gray-700">
              Port No.
            </label>
            <input
              type="text"
              id="portNo"
              name="portNo"
              value={portNo}
              onChange={e => setPortNo(e.target.value)}
              className="input mt-1"
              placeholder="e.g., 9000"
            />
          </div>
          <div>
            <label htmlFor="tallyCompanyName" className="block text-sm font-medium text-gray-700">
              Tally Company Name
            </label>
            <input
              type="text"
              id="tallyCompanyName"
              name="tallyCompanyName"
              value={tallyCompanyName}
              onChange={e => setTallyCompanyName(e.target.value)}
              className="input mt-1"
              placeholder="e.g., LKQ India Private Limited"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleContinue}
            >
              Continue <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupReports;