import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  LedgerHead, 
  PayrollItem, 
  PayrollMapping, 
  ReportConfiguration, 
  PayrollJournal 
} from '../types';
import {
  mockPayrollMappings,
  mockReportConfigurations,
  mockPayrollJournals
} from '../data/mockData';
import toast from 'react-hot-toast';
import { getStoredToken, getStoredUserInfo } from '../utils/auth';

// API URLs
const LOCAL_API_URL = 'http://localhost:3001/api';
const UAT_API_URL = 'https://apiv1.resolvepay.in';

interface PayrollMapping {
  id: string;
  payrollItemId: string;
  payrollItemName: string;
  ledgerHeadId: string;
  ledgerHeadName: string;
  financialYear: string;
  createdAt: string;
  updatedAt: string;
}

interface AppContextType {
  // Ledger Heads
  ledgerHeads: LedgerHead[];
  addLedgerHead: (ledgerHead: Omit<LedgerHead, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateLedgerHead: (id: string, ledgerHead: Partial<LedgerHead>) => Promise<void>;
  deleteLedgerHead: (id: string) => Promise<void>;
  
  // Payroll Items
  payrollItems: PayrollItem[];
  
  // Mappings
  payrollMappings: PayrollMapping[];
  addPayrollMapping: (mapping: Omit<PayrollMapping, 'id' | 'createdAt' | 'updatedAt'>, silent?: boolean) => Promise<void>;
  updatePayrollMapping: (id: string, mapping: Partial<PayrollMapping>) => Promise<void>;
  deletePayrollMapping: (id: string) => Promise<void>;
  
  // Reports
  reportConfigurations: ReportConfiguration[];
  addReportConfiguration: (config: Omit<ReportConfiguration, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReportConfiguration: (id: string, config: Partial<ReportConfiguration>) => void;
  deleteReportConfiguration: (id: string) => void;
  
  // Journals
  payrollJournals: PayrollJournal[];
  generatePayrollJournal: (periodStart: string, periodEnd: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ledgerHeads, setLedgerHeads] = useState<LedgerHead[]>([]);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [payrollMappings, setPayrollMappings] = useState<PayrollMapping[]>([]);
  const [reportConfigurations, setReportConfigurations] = useState<ReportConfiguration[]>(mockReportConfigurations);
  const [payrollJournals, setPayrollJournals] = useState<PayrollJournal[]>(mockPayrollJournals);

  // Fetch ledgers, payroll items, and mappings on component mount
  useEffect(() => {
    fetchLedgers();
    fetchPayrollItems();
    fetchPayrollMappings();
  }, []);

  const fetchLedgers = async () => {
    try {
      console.log('Fetching ledgers...');
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        console.error('No organization ID found');
        return;
      }
      
      const response = await fetch(`${LOCAL_API_URL}/ledgers?org_id=${org_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        }
      });

      if (!response.ok) throw new Error('Failed to fetch ledgers');
      const data = await response.json();
      console.log('Raw ledger data:', data);
      
      // Transform the data to match our expected format
      const transformedData = data.map((ledger: any) => ({
        id: ledger.id.toString(), // Ensure ID is a string
        name: ledger.name,
        code: ledger.code || '',
        type: ledger.type || 'Expense',
        isActive: ledger.is_active !== undefined ? ledger.is_active : true,
        category: ledger.category || 'Expense',
        description: ledger.description || '',
        financialYear: ledger.financial_year || '',
        createdAt: ledger.created_at || new Date().toISOString(),
        updatedAt: ledger.updated_at || new Date().toISOString()
      }));
      
      console.log('Transformed ledger data:', transformedData);
      setLedgerHeads(transformedData);
    } catch (error) {
      console.error('Error fetching ledgers:', error);
      toast.error('Failed to fetch ledgers');
    }
  };

  const fetchPayrollItems = async () => {
    try {
      console.log('Fetching payroll items...');
      const token = getStoredToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${UAT_API_URL}/payrun/heads`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch payroll items');
      const responseData = await response.json();
      console.log('Received payroll items data:', responseData);
      
      if (responseData.result === 'Success' && responseData.data) {
        // Transform the data to match our expected format
        const transformedData = responseData.data.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          code: item.prefix || '',
          type: item.pay_category_name || 'Earning',
          isActive: true,
          description: item.description || '',
          payGroup: item.pay_group_name || '',
          payCategory: item.pay_category_name || '',
          sequenceNo: item.sequence_no || 0
        }));
        console.log('Transformed payroll items data:', transformedData);
        setPayrollItems(transformedData);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching payroll items:', error);
      toast.error('Failed to fetch payroll items');
    }
  };

  const fetchPayrollMappings = async () => {
    try {
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        console.error('No organization ID found');
        return;
      }
      
      const response = await fetch(`${LOCAL_API_URL}/payroll-mappings?org_id=${org_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Raw payroll mappings data:', data);

      // Transform the data to match our PayrollMapping interface
      const transformedData = data.map((mapping: any) => ({
        id: mapping.id.toString(),
        payrollItemId: mapping.payroll_item_id,
        payrollItemName: mapping.payroll_item_name,
        ledgerHeadId: mapping.ledger_head_id,
        ledgerHeadName: mapping.ledger_head_name,
        financialYear: mapping.financial_year,
        createdAt: mapping.created_at,
        updatedAt: mapping.updated_at
      }));

      console.log('Transformed payroll mappings:', transformedData);
      setPayrollMappings(transformedData);
    } catch (error) {
      console.error('Error fetching payroll mappings:', error);
      toast.error('Failed to fetch payroll mappings');
    }
  };

  // Ledger Head Functions
  const addLedgerHead = async (ledgerHead: Omit<LedgerHead, 'id' | 'createdAt' | 'updatedAt'>, silent = false) => {
    try {
      // Validate required fields
      if (!ledgerHead.name || ledgerHead.name.trim() === '') {
        throw new Error('Ledger name is required');
      }

      if (!ledgerHead.category) {
        throw new Error('Ledger category is required');
      }

      // Transform the data to match the API's expected format
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        throw new Error('Organization ID is required');
      }

      const requestBody: any = {
        name: ledgerHead.name.trim(),
        code: ledgerHead.code?.trim() || null,
        category: ledgerHead.category,
        is_active: ledgerHead.isActive !== undefined ? ledgerHead.isActive : true,
        financial_year: ledgerHead.financialYear?.trim() || null,
        description: ledgerHead.description?.trim() || null,
        org_id: org_id,
      };

      // Remove null values to avoid sending them
      Object.keys(requestBody).forEach(key => {
        if (requestBody[key] === null || requestBody[key] === '') {
          delete requestBody[key];
        }
      });

      const response = await fetch(`${LOCAL_API_URL}/ledgers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create ledger' }));
        throw new Error(errorData.error || errorData.message || 'Failed to create ledger');
      }
      
      const newLedger = await response.json();
      
      // Transform the response to match our frontend format
      const transformedLedger: LedgerHead = {
        id: newLedger.id.toString(),
        name: newLedger.name,
        code: newLedger.code || '',
        type: newLedger.type || 'Expense',
        isActive: newLedger.is_active ?? true,
        category: newLedger.category || 'Expense',
        description: newLedger.description || '',
        financialYear: newLedger.financial_year || '',
        createdAt: newLedger.created_at || new Date().toISOString(),
        updatedAt: newLedger.updated_at || new Date().toISOString()
      };

      setLedgerHeads([...ledgerHeads, transformedLedger]);
      
      // Only show toast if not in silent mode (for bulk imports)
      if (!silent) {
        toast.success('Ledger created successfully');
      }
      
      return transformedLedger;
    } catch (error: any) {
      console.error('Error creating ledger:', error);
      if (!silent) {
        toast.error(error.message || 'Failed to create ledger');
      }
      throw error; // Re-throw so caller can handle it
    }
  };

  const updateLedgerHead = async (id: string, ledgerHead: Partial<LedgerHead>) => {
    try {
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        throw new Error('Organization ID is required');
      }

      // Transform the data to match the API's expected format
      const requestBody = {
        ...ledgerHead,
        is_active: ledgerHead.isActive,
        financial_year: ledgerHead.financialYear,
        org_id: org_id
      };

      const response = await fetch(`${LOCAL_API_URL}/ledgers/${id}?org_id=${org_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error('Failed to update ledger');
      
      const updatedLedger = await response.json();
      console.log('Raw updated ledger:', updatedLedger);

      // Transform the response to match our frontend format
      const transformedLedger: LedgerHead = {
        id: updatedLedger.id.toString(),
        name: updatedLedger.name,
        code: updatedLedger.code || '',
        type: updatedLedger.type || 'Expense',
        isActive: updatedLedger.is_active ?? true,
        category: updatedLedger.category || 'Expense',
        description: updatedLedger.description || '',
        financialYear: updatedLedger.financial_year || '',
        createdAt: updatedLedger.created_at || new Date().toISOString(),
        updatedAt: updatedLedger.updated_at || new Date().toISOString()
      };

      console.log('Transformed updated ledger:', transformedLedger);
      setLedgerHeads(
        ledgerHeads.map((head) =>
          head.id === id ? transformedLedger : head
        )
      );
      toast.success('Ledger updated successfully');
    } catch (error) {
      console.error('Error updating ledger:', error);
      toast.error('Failed to update ledger');
    }
  };

  const deleteLedgerHead = async (id: string) => {
    try {
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        throw new Error('Organization ID is required');
      }

      const response = await fetch(`${LOCAL_API_URL}/ledgers/${id}?org_id=${org_id}`, {
        method: 'DELETE',
        headers: {
          'X-Org-Id': org_id
        }
      });

      if (!response.ok) throw new Error('Failed to delete ledger');
      
      const deletedLedger = await response.json();
      setLedgerHeads(
        ledgerHeads.map((head) =>
          head.id === id ? deletedLedger : head
        )
      );
      toast.success('Ledger deleted successfully');
    } catch (error) {
      console.error('Error deleting ledger:', error);
      toast.error('Failed to delete ledger');
    }
  };

  // Payroll Mapping Functions
  const addPayrollMapping = async (mapping: Omit<PayrollMapping, 'id' | 'createdAt' | 'updatedAt'>, silent = false) => {
    try {
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        throw new Error('Organization ID is required');
      }

      console.log('Sending mapping data:', mapping);
      
      const requestBody = {
        payroll_item_id: mapping.payrollItemId,
        payroll_item_name: mapping.payrollItemName,
        ledger_head_id: mapping.ledgerHeadId,
        ledger_head_name: mapping.ledgerHeadName,
        financial_year: mapping.financialYear,
        org_id: org_id
      };
      console.log('Request body:', requestBody);

      const response = await fetch(`${LOCAL_API_URL}/payroll-mappings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      const newMapping = JSON.parse(responseText);
      console.log('Created mapping:', newMapping);
      
      // Transform the response to match our PayrollMapping interface
      const transformedMapping: PayrollMapping = {
        id: newMapping.id.toString(),
        payrollItemId: newMapping.payroll_item_id,
        payrollItemName: newMapping.payroll_item_name,
        ledgerHeadId: newMapping.ledger_head_id,
        ledgerHeadName: newMapping.ledger_head_name,
        financialYear: newMapping.financial_year,
        createdAt: newMapping.created_at,
        updatedAt: newMapping.updated_at
      };

      setPayrollMappings(prev => [...prev, transformedMapping]);
      
      // Only show toast if not in silent mode (for bulk operations like Auto Map)
      if (!silent) {
        toast.success('Payroll mapping created successfully');
      }
      
      return transformedMapping;
    } catch (error) {
      console.error('Error creating payroll mapping:', error);
      if (!silent) {
        toast.error(error instanceof Error ? error.message : 'Failed to create payroll mapping');
      }
      throw error;
    }
  };

  const updatePayrollMapping = async (id: string, mapping: Partial<PayrollMapping>) => {
    try {
      // Get the existing mapping to ensure we have all required fields
      const existingMapping = payrollMappings.find(m => m.id === id);
      if (!existingMapping) {
        throw new Error('Mapping not found');
      }

      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        throw new Error('Organization ID is required');
      }

      // Merge the existing mapping with the updates
      const requestBody = {
        payroll_item_id: mapping.payrollItemId || existingMapping.payrollItemId,
        payroll_item_name: mapping.payrollItemName || existingMapping.payrollItemName,
        ledger_head_id: mapping.ledgerHeadId || existingMapping.ledgerHeadId,
        ledger_head_name: mapping.ledgerHeadName || existingMapping.ledgerHeadName,
        financial_year: mapping.financialYear || existingMapping.financialYear,
        org_id: org_id,
        updated_at: new Date().toISOString()
      };
      console.log('Sending update request:', { id, requestBody });

      const response = await fetch(`${LOCAL_API_URL}/payroll-mappings/${id}?org_id=${org_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      const responseText = await response.text();
      console.log('Response text:', responseText);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      const updatedMapping = JSON.parse(responseText);
      console.log('Updated mapping from API:', updatedMapping);
      
      // Transform the response to match our PayrollMapping interface
      const transformedMapping: PayrollMapping = {
        id: updatedMapping.id.toString(),
        payrollItemId: updatedMapping.payroll_item_id,
        payrollItemName: updatedMapping.payroll_item_name,
        ledgerHeadId: updatedMapping.ledger_head_id,
        ledgerHeadName: updatedMapping.ledger_head_name,
        financialYear: updatedMapping.financial_year,
        createdAt: updatedMapping.created_at,
        updatedAt: updatedMapping.updated_at
      };

      setPayrollMappings(
        payrollMappings.map((map) =>
          map.id === id ? transformedMapping : map
        )
      );
      toast.success('Payroll mapping updated successfully');
    } catch (error) {
      console.error('Error updating payroll mapping:', error);
      console.error('Error details:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      toast.error(error instanceof Error ? error.message : 'Failed to update payroll mapping');
      throw error;
    }
  };

  const deletePayrollMapping = async (id: string) => {
    try {
      const response = await fetch(`${LOCAL_API_URL}/payroll-mappings/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      setPayrollMappings(payrollMappings.filter((mapping) => mapping.id !== id));
      toast.success('Payroll mapping deleted successfully');
    } catch (error) {
      console.error('Error deleting payroll mapping:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete payroll mapping');
      throw error;
    }
  };

  // Report Configuration Functions
  const addReportConfiguration = (config: Omit<ReportConfiguration, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newConfig: ReportConfiguration = {
      ...config,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setReportConfigurations([...reportConfigurations, newConfig]);
  };

  const updateReportConfiguration = (id: string, config: Partial<ReportConfiguration>) => {
    setReportConfigurations(
      reportConfigurations.map((conf) =>
        conf.id === id
          ? { ...conf, ...config, updatedAt: new Date().toISOString() }
          : conf
      )
    );
  };

  const deleteReportConfiguration = (id: string) => {
    setReportConfigurations(reportConfigurations.filter((config) => config.id !== id));
  };

  // Journal Functions
  const generatePayrollJournal = (periodStart: string, periodEnd: string) => {
    // In a real application, this would calculate actual journal entries based on payroll data
    // For now, we'll just create a new journal with the mock data
    const newJournal: PayrollJournal = {
      id: Date.now().toString(),
      name: `Payroll Journal ${new Date(periodStart).toLocaleDateString()} - ${new Date(periodEnd).toLocaleDateString()}`,
      periodStart,
      periodEnd,
      entries: mockPayrollJournals[0].entries, // Using mock entries for demo
      totalDebit: mockPayrollJournals[0].totalDebit,
      totalCredit: mockPayrollJournals[0].totalCredit,
      createdAt: new Date().toISOString(),
      status: 'Generated',
    };
    setPayrollJournals([...payrollJournals, newJournal]);
  };

  const value = {
    ledgerHeads,
    addLedgerHead,
    updateLedgerHead,
    deleteLedgerHead,
    payrollItems,
    payrollMappings,
    addPayrollMapping,
    updatePayrollMapping,
    deletePayrollMapping,
    reportConfigurations,
    addReportConfiguration,
    updateReportConfiguration,
    deleteReportConfiguration,
    payrollJournals,
    generatePayrollJournal,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};