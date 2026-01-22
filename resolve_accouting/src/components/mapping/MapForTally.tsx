import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { getStoredToken } from '../../utils/auth';
import { generateTallyXML, pushToTally } from '../../utils/tally';
import toast from 'react-hot-toast';
import { FileText, BarChart3, Link2, CheckCircle2, Loader2, ArrowRight, ArrowLeft, Play, Eye, Send, Clock, Bell, FileCheck, TrendingUp } from 'lucide-react';
import InfoIcon from '../common/InfoIcon';
import Loader from '../common/Loader';

interface FinancialYear {
  customer_year_details_id: string;
  year: string;
  year_data: string;
  period_start_date: string;
  period_end_date: string;
}

interface FinancialYearResponse {
  result: string;
  statuscode: number;
  message: string;
  data: {
    financial_year_data: FinancialYear[];
    year_data: FinancialYear[];
  }
}

interface PayPeriod {
  isProcessed: boolean;
  ispublished: boolean;
  pay_period_range: string;
  pay_period_name: string;
  pay_period_start_date: string;
  pay_period_end_date: string;
}

interface PayPeriodResponse {
  result: string;
  statuscode: number;
  message: string;
  data: {
    processed_data: PayPeriod[];
    upcoming_data: PayPeriod[];
  }
}

interface PayrollData {
  employee_name: string;
  emp_number: string;
  pay_value_data: Array<{
    data_field_name: string;
    pay_value: string;
    pay_head_name: string;
    is_pay_head: string;
    is_total: string | null;
  }>;
  [key: string]: any;
}

interface PayrollHeader {
  text: string;
  dataField: string;
  is_pay_head: string | null;
  is_total: string | null;
  pay_category_id: string | null;
  sequence_number: number;
  pay_group_id: string | null;
  main_title: string;
  sub_header: string;
  footer: string;
  footerAlign: string;
  footerClasses: string;
  align: string;
  classes: string;
  dataType: string;
}

interface PayrollResponse {
  data: PayrollData[];
  header: PayrollHeader[];
}

const MapForTally: React.FC = () => {
  console.log('[MapForTally] Component rendering');
  const { payrollItems, ledgerHeads, payrollMappings } = useApp();
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [financialYears, setFinancialYears] = useState<FinancialYear[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingYears, setIsLoadingYears] = useState(false);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [payrollHeaders, setPayrollHeaders] = useState<PayrollHeader[]>([]);
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(false);
  const [isPushingToTally, setIsPushingToTally] = useState(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'detailed'>('summary');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [pushProgress, setPushProgress] = useState(0);
  const [pushStatus, setPushStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [runInBackground, setRunInBackground] = useState(false);
  const [pushLogs, setPushLogs] = useState<string[]>([]);
  const [syncedTransactions, setSyncedTransactions] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState(20);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [tallyConfig] = useState({
    ip: '192.168.20.82',
    port: 9000
  });

  const syncSteps = [
    { id: 1, label: 'Connected to Tally server', completed: false },
    { id: 2, label: 'Validated payroll data', completed: false },
    { id: 3, label: 'Prepared XML payload', completed: false },
    { id: 4, label: 'Sending transactions to Tally', completed: false },
    { id: 5, label: 'Processing ledger entries', completed: false },
    { id: 6, label: 'Syncing pay head mappings', completed: false },
    { id: 7, label: 'Finalizing sync', completed: false },
  ];

  // Fetch financial years on component mount
  useEffect(() => {
    fetchFinancialYears();
  }, []);

  // Fetch pay periods when selected year changes
  useEffect(() => {
    if (selectedYear) {
      fetchPayPeriods(selectedYear);
    } else {
      setPayPeriods([]); // Clear periods when no year is selected
    }
  }, [selectedYear]);

  // Fetch payroll data when period is selected
  useEffect(() => {
    if (selectedPeriod) {
      fetchPayrollData();
    } else {
      setPayrollData([]);
    }
  }, [selectedPeriod]);

  const fetchPayrollData = async () => {
    try {
      setIsLoadingPayroll(true);
      const token = getStoredToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const selectedPeriodData = payPeriods.find(p => p.pay_period_range === selectedPeriod);
      if (!selectedPeriodData) {
        console.error('Selected period data not found');
        return;
      }

      const requestData = {
        financial_year_id: selectedYear,
        pay_period_id: "4",
        period_start_date: selectedPeriodData.pay_period_start_date,
        period_end_date: selectedPeriodData.pay_period_end_date,
        pay_type_id: "0",
        worker_type_id: "",
        type_id: [0],
        sub_type_id: [],
        required_fields: [],
        is_standard_component: "0",
        isFBP: "0",
        isPT: "0",
        is_paysheet_sub_grouping: "0",
        sub_group_id: "",
        is_sub_total: "0",
        is_zero_columns: "0",
        additional_status: [],
        sort_by: "date_of_joining",
        is_logo: "0",
        is_format: "0",
        pay_period: selectedPeriod,
        pay_unit_id: [],
        other_payheads: []
      };

      console.log('Fetching paysheet data with:', requestData);

      const response = await fetch('https://apiv1.resolvepay.in/payrun/paysheet', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch paysheet data:', errorText);
        throw new Error(`Failed to fetch paysheet data: ${response.status} ${errorText}`);
      }

      const data = await response.json() as PayrollResponse;
      console.log('Paysheet data:', data);

      // Get pay head columns from header
      const payHeadHeaders = data.header.filter(header => header.is_pay_head === "1");
      console.log('Pay head headers:', payHeadHeaders);
      setPayrollHeaders(payHeadHeaders);
      setPayrollData(data.data || []);
    } catch (error) {
      console.error('Error fetching paysheet data:', error);
    } finally {
      setIsLoadingPayroll(false);
    }
  };

  const fetchFinancialYears = async () => {
    try {
      setIsLoadingYears(true);
      const token = getStoredToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Fetching financial years');

      const response = await fetch('https://apiv1.resolvepay.in/user/financial-year', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Financial years response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch financial years:', errorText);
        throw new Error(`Failed to fetch financial years: ${response.status} ${errorText}`);
      }

      const data: FinancialYearResponse = await response.json();
      console.log('Financial years data:', data);
      
      if (data.result === 'Success' && data.data.year_data) {
        console.log('Setting financial years:', data.data.year_data);
        setFinancialYears(data.data.year_data);
      } else {
        console.error('Invalid financial years response format:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching financial years:', error);
    } finally {
      setIsLoadingYears(false);
    }
  };

  const fetchPayPeriods = async (yearId: string) => {
    try {
      setIsLoading(true);
      const token = getStoredToken();
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      console.log('Fetching pay periods for year:', yearId);

      const response = await fetch(`https://apiv1.resolvepay.in/user/pay-period-cycle/4/${yearId}?isPayslip=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch pay periods:', errorText);
        throw new Error(`Failed to fetch pay periods: ${response.status} ${errorText}`);
      }

      const data: PayPeriodResponse = await response.json();
      console.log('Pay periods data:', data);
      
      if (data.result === 'Success') {
        // Merge both processed and upcoming data
        const allPeriods = [
          ...(data.data.processed_data || []),
          ...(data.data.upcoming_data || [])
        ];
        console.log('Setting pay periods:', allPeriods);
        setPayPeriods(allPeriods);
      } else {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching pay periods:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPayValue = (item: PayrollData, dataField: string): string => {
    const payValue = item.pay_value_data?.find(pv => pv.data_field_name === dataField);
    return payValue?.pay_value || '-';
  };

  // Calculate pay head wise totals for Summary tab
  const payHeadSummary = useMemo(() => {
    if (payrollData.length === 0 || payrollHeaders.length === 0) return [];

    const payHeadHeaders = payrollHeaders.filter(h => h.is_pay_head === "1");
    
    return payHeadHeaders.map(header => {
      const total = payrollData.reduce((sum, item) => {
        const value = getPayValue(item, header.dataField);
        return sum + (value !== '-' ? Number(value) : 0);
      }, 0);

      // Find linked ledger for this pay head
      const payrollItem = payrollItems.find(item => 
        item.name === header.text || 
        item.code === header.dataField
      );
      const mapping = payrollItem ? payrollMappings.find(m => m.payrollItemId === payrollItem.id) : null;
      const linkedLedger = mapping ? ledgerHeads.find(l => l.id === mapping.ledgerHeadId) : null;

      return {
        payHeadName: header.text,
        payHeadCode: header.dataField,
        total,
        linkedLedger: linkedLedger?.name || 'Not Mapped',
        linkedLedgerCode: linkedLedger?.code || '-',
        employeeCount: payrollData.filter(item => {
          const value = getPayValue(item, header.dataField);
          return value !== '-' && Number(value) !== 0;
        }).length,
      };
    }).filter(item => item.total > 0); // Only show pay heads with values
  }, [payrollData, payrollHeaders, payrollItems, payrollMappings, ledgerHeads]);

  // Auto-show wizard when data is loaded
  useEffect(() => {
    if (payrollData.length > 0 && selectedYear && selectedPeriod) {
      setCurrentStep(1);
      setPushProgress(0);
      setPushStatus('idle');
      setPushLogs([]);
    }
  }, [payrollData.length, selectedYear, selectedPeriod]);

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const simulatePushToTally = async () => {
    setIsPushingToTally(true);
    setPushStatus('running');
    setPushProgress(0);
    setSyncedTransactions(0);
    setEstimatedTimeRemaining(15);
    setActiveStepIndex(0);
    setPushLogs(['Starting Tally sync process...']);

    // Calculate total transactions
    const totalTransactions = payrollData.length;
    const totalAmount = payHeadSummary.reduce((sum, item) => sum + item.total, 0);

    // Simulate 15 seconds total
    const totalSteps = 15;
    const interval = 1000; // 1 second per step
    const transactionsPerStep = Math.ceil(totalTransactions / totalSteps);
    
    for (let i = 1; i <= totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, interval));
      const progress = Math.round((i / totalSteps) * 100);
      setPushProgress(progress);
      
      // Update synced transactions counter
      const synced = Math.min(totalTransactions, Math.round((i / totalSteps) * totalTransactions));
      setSyncedTransactions(synced);
      
      // Update estimated time remaining
      const remaining = Math.max(0, totalSteps - i);
      setEstimatedTimeRemaining(remaining);
      
      // Update active step and mark completed steps
      if (i === 2) {
        setActiveStepIndex(1);
        setPushLogs(prev => [...prev, '✓ Connected to Tally server']);
      }
      if (i === 4) {
        setActiveStepIndex(2);
        setPushLogs(prev => [...prev, '✓ Validated payroll data']);
      }
      if (i === 6) {
        setActiveStepIndex(3);
        setPushLogs(prev => [...prev, '✓ Prepared XML payload']);
      }
      if (i === 9) {
        setActiveStepIndex(4);
        setPushLogs(prev => [...prev, '✓ Sending transactions to Tally...']);
      }
      if (i === 12) {
        setActiveStepIndex(5);
        setPushLogs(prev => [...prev, '✓ Processing ledger entries...']);
      }
      if (i === 14) {
        setActiveStepIndex(6);
        setPushLogs(prev => [...prev, '✓ Syncing pay head mappings...']);
      }
      
      // Complete sync when reaching 100% (last iteration)
      if (i === totalSteps || progress >= 100) {
        setActiveStepIndex(syncSteps.length); // Mark all steps as completed (set to length so idx < activeStepIndex includes all steps)
        setSyncedTransactions(totalTransactions);
        setEstimatedTimeRemaining(0);
        setPushProgress(100);
        setPushLogs(prev => [...prev, '✓ Finalizing sync...', '✓ Sync completed successfully!']);
        setPushStatus('completed');
        setIsPushingToTally(false);
        if (!runInBackground) {
          toast.success('Successfully pushed to Tally!');
        }
        // Break out of loop since we're done
        break;
      }
    }

    setIsPushingToTally(false);
  };

  const handlePushToTallyFinal = async () => {
    if (runInBackground) {
      // Run in background - show notification option
      simulatePushToTally();
      toast.success('Sync started in background. You will be notified when complete.');
    } else {
      // Run in foreground
      await simulatePushToTally();
    }
  };

  const handlePushToTally = async () => {
    if (!selectedYear || !selectedPeriod) {
      toast.error('Please select both Financial Year and Period');
      return;
    }

    try {
      setIsPushingToTally(true);

      // Get first row of data for demonstration
      const firstEmployee = payrollData[0];
      if (!firstEmployee) {
        toast.error('No payroll data available');
        return;
      }

      // Create a readable string for the employee's pay heads
      let employeeDetails = `Employee Details:\n`;
      employeeDetails += `Name: ${firstEmployee.employee_name}\n`;
      employeeDetails += `Employee Number: ${firstEmployee.emp_number}\n`;
      employeeDetails += `User ID: ${firstEmployee.user_id || firstEmployee.id || 'Not Available'}\n`;
      employeeDetails += `Period: ${selectedPeriod}\n\n`;
      employeeDetails += `Pay Heads:\n`;
      employeeDetails += `-------------------\n`;

      // Get the selected period data
      const selectedPeriodData = payPeriods.find(p => p.pay_period_range === selectedPeriod);
      const periodStartDate = selectedPeriodData?.pay_period_start_date || '';
      const periodEndDate = selectedPeriodData?.pay_period_end_date || '';

      // Loop through all pay heads and amounts
      firstEmployee.pay_value_data?.forEach(payValue => {
        // Find the ledger mapping for this pay head
        const mapping = payrollMappings.find(m => m.payrollItemName === payValue.pay_head_name);
        const ledger = mapping ? ledgerHeads.find(l => l.id === mapping.ledgerHeadId) : null;
        const category = ledger?.category || 'Not Mapped';

        employeeDetails += `${payValue.pay_head_name}: ${new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(Number(payValue.pay_value))} (Category: ${category})\n`;
      });

      // Add period dates to the alert
      employeeDetails += `\nPeriod Details:\n`;
      employeeDetails += `Start Date: ${periodStartDate}\n`;
      employeeDetails += `End Date: ${periodEndDate}\n`;

      // Show alert with the formatted employee details
      alert(employeeDetails);

      // Format the payroll data into the required structure
      const payheadGroups = new Map();

      // First, group all data by payhead
      payrollData.forEach(item => {
        item.pay_value_data?.forEach(payValue => {
          const mapping = payrollMappings.find(m => m.payrollItemName === payValue.pay_head_name);
          const ledger = mapping ? ledgerHeads.find(l => l.id === mapping.ledgerHeadId) : null;
          const category = ledger?.category || 'Not Mapped';

          // Skip if no ledger mapping found
          if (!mapping?.ledgerHeadName) {
            return;
          }

          const key = payValue.pay_head_name;
          if (!payheadGroups.has(key)) {
            payheadGroups.set(key, {
              payHeadId: payValue.pay_head_name,
              payHeadName: payValue.pay_head_name,
              voucherType: category,
              ledgerId: mapping.ledgerHeadId,
              ledgerName: mapping.ledgerHeadName,
              ledgerAmount: 0,
              payPeriod: selectedPeriod,
              initiatedDate: new Date().toISOString().split('T')[0],
              initiatedBy: "SYSTEM"
            });
          }
          
          // Add to total
          const currentGroup = payheadGroups.get(key);
          currentGroup.ledgerAmount = (Number(currentGroup.ledgerAmount) + Number(payValue.pay_value)).toString();
        });
      });

      // Convert map to array
      const tallyData = Array.from(payheadGroups.values());

      const payload = {
        tally_company: "LKQ",
        tally_ip: tallyConfig.ip,
        taly_port: tallyConfig.port.toString(),
        tallydata: tallyData
      };

      // Show the formatted payload in alert
      const formattedPayload = {
        tally_company: payload.tally_company,
        tally_ip: payload.tally_ip,
        taly_port: payload.taly_port,
        tallydata: JSON.stringify(payload.tallydata, null, 4)
      };
      
      alert(JSON.stringify(formattedPayload, null, 4));

      console.log('Tally Payload:', JSON.stringify(formattedPayload, null, 4));
      console.log('Tally Data (unstringified):', JSON.stringify(tallyData, null, 4));

      const token = getStoredToken();
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('https://apiv1.resolvepay.in/organization/import-to-tally', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to push to Tally: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      if (result.result === 'Success') {
        toast.success('Successfully pushed to Tally');
      } else {
        throw new Error(result.message || 'Failed to push to Tally');
      }
    } catch (error) {
      console.error('Error pushing to Tally:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to push to Tally');
    } finally {
      setIsPushingToTally(false);
    }
  };

  console.log('[MapForTally] Rendering JSX');
  
  return (
    <div className="flex flex-col h-full" style={{ minHeight: '100%', width: '100%' }}>
      <div className="flex justify-between items-center mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-gray-800">Transaction Management</h2>
          <InfoIcon
            title="Transaction Management"
            content="View and manage payroll transactions for Tally sync. Select the financial year and period to view Paysheet. You can view summary or detailed transaction data."
          />
        </div>
      </div>
      
      {/* Step-by-Step Wizard - Show directly from beginning - Fits screen */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col" style={{ minHeight: 0 }}>
          {/* Wizard Header - Ultra Compact */}
          <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 px-3 py-1.5 flex-shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-white">Push to Tally</h3>
              {pushStatus === 'running' && (
                <div className="flex items-center gap-1 text-white/90">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-xs font-medium">Syncing...</span>
                </div>
              )}
            </div>
              
            {/* Step Indicator - Ultra Compact */}
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                      currentStep > step ? 'bg-white text-secondary-600 shadow-md' :
                      currentStep === step ? 'bg-white text-secondary-600 ring-1 ring-white/50 shadow-md scale-105' :
                      'bg-white/20 text-white/60'
                    }`}>
                      {currentStep > step ? <CheckCircle2 size={12} className="text-secondary-600" /> : step}
                    </div>
                    <span className={`mt-1 text-[10px] font-medium ${
                      currentStep >= step ? 'text-white' : 'text-white/70'
                    }`}>
                      {step === 1 ? 'Select & Review' : step === 2 ? 'Preview' : 'Push & Sync'}
                    </span>
                  </div>
                  {step < 3 && (
                    <div className={`flex-1 h-0.5 mx-1.5 rounded-full transition-all ${
                      currentStep > step ? 'bg-white' : currentStep === step ? 'bg-white/50' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Wizard Content - No scroll, fits screen */}
          <div className="flex-1 p-2 bg-gray-50 overflow-hidden flex flex-col min-h-0">
              {/* Step 1: Select & Review - Similar to Step 2 */}
              {currentStep === 1 && (
                <div className="flex flex-col h-full space-y-2 animate-fade-in overflow-hidden">
                  <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm flex-shrink-0">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center font-bold text-[10px]">1</span>
                      Select Financial Year & Pay Period
                    </h4>
                    
                    {/* Selection Boxes - Similar to Step 2's summary boxes */}
                    <div className="bg-gradient-to-br from-secondary-50 to-blue-50 rounded-lg p-2 mb-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white rounded p-1.5 border border-gray-200">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Financial Year</label>
                          <select
                            data-field="financial-year"
                            value={selectedYear}
                            onChange={(e) => {
                              setSelectedYear(e.target.value);
                              setSelectedPeriod('');
                            }}
                            className="w-full h-6 text-xs border-0 focus:ring-0 p-0 font-bold text-gray-800 bg-transparent"
                            disabled={isLoadingYears}
                          >
                            <option value="">Select Year</option>
                            {financialYears.map((year) => (
                              <option key={year.customer_year_details_id} value={year.customer_year_details_id}>
                                {year.year}
                              </option>
                            ))}
                          </select>
                          {isLoadingYears && (
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500">
                              <Loader2 size={10} className="animate-spin text-secondary-600" />
                              Loading...
                            </div>
                          )}
                        </div>
                        <div className="bg-white rounded p-1.5 border border-gray-200">
                          <label className="block text-[10px] text-gray-500 mb-0.5">Pay Period</label>
                          <select
                            data-field="pay-period"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value)}
                            className="w-full h-6 text-xs border-0 focus:ring-0 p-0 font-bold text-gray-800 bg-transparent"
                            disabled={isLoading || !selectedYear}
                          >
                            <option value="">Select Period</option>
                            {payPeriods.map((period) => (
                              <option key={period.pay_period_range} value={period.pay_period_range}>
                                {period.pay_period_range}
                              </option>
                            ))}
                          </select>
                          {isLoading && (
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-500">
                              <Loader2 size={10} className="animate-spin text-secondary-600" />
                              Loading...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loading State - Show prominent loader when fetching data */}
                  {isLoadingPayroll && selectedPeriod && (
                    <div className="flex-1 flex items-center justify-center min-h-0">
                      <Loader 
                        message="Fetching Payroll Data..."
                        subMessage="Please wait while we load the paysheet information"
                        size="sm"
                        variant="compact"
                      />
                    </div>
                  )}

                  {/* Summary and Details Tabs - Only show when data is loaded */}
                  {!isLoadingPayroll && payrollData.length > 0 && (
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                      <div className="bg-white rounded-lg p-2 border border-gray-200 shadow-sm flex-1 flex flex-col min-h-0">
                        <div className="border-b border-gray-200 mb-1.5 flex-shrink-0">
                          <nav className="flex space-x-3">
                            <button
                              onClick={() => setActiveTab('summary')}
                              className={`py-1 px-1 border-b-2 font-medium text-xs ${
                                activeTab === 'summary'
                                  ? 'border-secondary-500 text-secondary-600'
                                  : 'border-transparent text-gray-500'
                              }`}
                            >
                              Summary
                            </button>
                            <button
                              onClick={() => setActiveTab('detailed')}
                              className={`py-1 px-1 border-b-2 font-medium text-xs ${
                                activeTab === 'detailed'
                                  ? 'border-secondary-500 text-secondary-600'
                                  : 'border-transparent text-gray-500'
                              }`}
                            >
                              Detailed
                            </button>
                          </nav>
                        </div>

                      {activeTab === 'summary' ? (
                        <div className="flex-1 table-container overflow-y-auto min-h-0">
                          <table className="table">
                            <thead className="table-header sticky top-0">
                              <tr>
                                <th className="table-header-cell">Pay Head</th>
                                <th className="table-header-cell text-right">Total Amount</th>
                                <th className="table-header-cell text-center">Employees</th>
                                <th className="table-header-cell">Linked Ledger</th>
                                <th className="table-header-cell">Ledger Code</th>
                              </tr>
                            </thead>
                            <tbody className="table-body">
                              {payHeadSummary.map((item, idx) => (
                                <tr key={idx} className="table-row">
                                  <td className="table-cell font-medium">{item.payHeadName}</td>
                                  <td className="table-cell numeric text-right">
                                    ₹{new Intl.NumberFormat('en-IN', {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2
                                    }).format(item.total)}
                                  </td>
                                  <td className="table-cell text-center">{item.employeeCount}</td>
                                  <td className="table-cell">
                                    {item.linkedLedger !== 'Not Mapped' ? (
                                      <div className="flex items-center gap-2">
                                        <Link2 size={14} className="text-secondary-600" />
                                        <span>{item.linkedLedger}</span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 italic">{item.linkedLedger}</span>
                                    )}
                                  </td>
                                  <td className="table-cell">{item.linkedLedgerCode}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="table-container max-h-64 overflow-y-auto">
                          <table className="table">
                            <thead className="table-header sticky top-0">
                              <tr>
                                <th className="table-header-cell">Employee</th>
                                <th className="table-header-cell">Code</th>
                                {payrollHeaders.slice(0, 5).map((h, i) => (
                                  <th key={i} className="table-header-cell">{h.text}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="table-body">
                              {payrollData.slice(0, 10).map((item, idx) => (
                                <tr key={idx} className="table-row">
                                  <td className="table-cell">{item.employee_name}</td>
                                  <td className="table-cell">{item.emp_number}</td>
                                  {payrollHeaders.slice(0, 5).map((header, colIdx) => {
                                    const value = getPayValue(item, header.dataField);
                                    return (
                                      <td key={colIdx} className="table-cell numeric text-right">
                                        {value !== '-' && header.dataType === 'number' 
                                          ? `₹${new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value))}`
                                          : value}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {payrollData.length > 10 && (
                            <p className="text-sm text-gray-500 mt-2 text-center">
                              Showing 10 of {payrollData.length} employees
                            </p>
                          )}
                        </div>
                      )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Preview */}
              {currentStep === 2 && (
                <div className="space-y-3 animate-fade-in">
                  <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-sm">
                    <h4 className="text-base font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-secondary-100 text-secondary-700 flex items-center justify-center font-bold text-xs">2</span>
                      Preview Data to Push
                    </h4>
                    <div className="bg-gradient-to-br from-secondary-50 to-blue-50 rounded-lg p-3 space-y-2">
                      <div className="grid grid-cols-5 gap-2">
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <span className="text-xs text-gray-500">Financial Year</span>
                          <p className="font-bold text-xs text-gray-800 mt-0.5">{financialYears.find(y => y.customer_year_details_id === selectedYear)?.year || '-'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <span className="text-xs text-gray-500">Pay Period</span>
                          <p className="font-bold text-xs text-gray-800 mt-0.5">{selectedPeriod || '-'}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <span className="text-xs text-gray-500">Employees</span>
                          <p className="font-bold text-xs text-gray-800 mt-0.5">{payrollData.length}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border border-gray-200">
                          <span className="text-xs text-gray-500">Pay Heads</span>
                          <p className="font-bold text-xs text-gray-800 mt-0.5">{payHeadSummary.length}</p>
                        </div>
                        <div className="bg-white rounded-lg p-2 border-2 border-secondary-300">
                          <span className="text-xs text-gray-600">Total Amount</span>
                          <p className="text-sm font-bold text-secondary-600 mt-0.5">
                            ₹{new Intl.NumberFormat('en-IN', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            }).format(payHeadSummary.reduce((sum, item) => sum + item.total, 0))}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <h5 className="font-semibold mb-2 text-xs">Pay Head Summary:</h5>
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {payHeadSummary.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-1.5 bg-white border border-gray-200 rounded text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-[10px]">{item.payHeadName}</span>
                              {item.linkedLedger !== 'Not Mapped' && (
                                <span className="text-[10px] bg-secondary-100 text-secondary-700 px-1 py-0.5 rounded">
                                  → {item.linkedLedger}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-[10px]">
                              ₹{new Intl.NumberFormat('en-IN', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              }).format(item.total)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Push & Sync */}
              {currentStep === 3 && (
                <div className="flex flex-col h-full space-y-4 overflow-hidden">
                  <div className="flex-shrink-0">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">Step 3: Push to Tally</h4>
                    
                    {pushStatus === 'idle' && (
                      <div className="space-y-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Bell size={20} className="text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <h5 className="font-semibold text-blue-900 mb-1">Background Processing</h5>
                              <p className="text-sm text-blue-700">Run the sync in the background and get notified when complete.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={runInBackground}
                                onChange={(e) => setRunInBackground(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary-600"></div>
                            </label>
                          </div>
                        </div>
                        <button
                          data-action="push-to-tally"
                          onClick={handlePushToTallyFinal}
                          className="btn btn-primary w-full flex items-center justify-center"
                        >
                          <Play size={18} className="mr-2" />
                          Start Push to Tally
                        </button>
                      </div>
                    )}

                    {pushStatus === 'running' && (
                      <div className="space-y-4 relative">
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-secondary-50/50 via-blue-50/30 to-teal-50/50 rounded-xl opacity-60 animate-pulse"></div>
                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(0,184,169,0.05)_50%,transparent_100%)] animate-shimmer rounded-xl"></div>
                        
                        <div className="relative z-10">
                          {/* Circular Progress with Metrics */}
                          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-lg mb-4">
                            <div className="flex items-center justify-between mb-6">
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-1">Sync Progress</h5>
                                <p className="text-xs text-gray-500">Pushing data to Tally</p>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-secondary-600">{pushProgress}%</div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {estimatedTimeRemaining > 0 ? `~${estimatedTimeRemaining}s remaining` : 'Almost done...'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Circular Progress Indicator */}
                            <div className="flex items-center justify-center mb-6">
                              <div className="relative w-32 h-32">
                                {/* Background Circle */}
                                <svg className="transform -rotate-90 w-32 h-32">
                                  <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    className="text-gray-200"
                                  />
                                  {/* Progress Circle */}
                                  <circle
                                    cx="64"
                                    cy="64"
                                    r="56"
                                    stroke="currentColor"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeDasharray={`${2 * Math.PI * 56}`}
                                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - pushProgress / 100)}`}
                                    strokeLinecap="round"
                                    className="text-secondary-600 transition-all duration-500 ease-out"
                                  />
                                </svg>
                                {/* Center Content */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="text-center">
                                    <Loader2 size={24} className="animate-spin text-secondary-600 mx-auto mb-1" />
                                    <div className="text-xs font-semibold text-gray-600">Syncing</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Live Metrics Grid */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="bg-gradient-to-br from-secondary-50 to-secondary-100 rounded-lg p-3 border border-secondary-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <FileCheck size={14} className="text-secondary-600" />
                                  <span className="text-xs font-medium text-gray-600">Total Transactions</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">{payrollData.length}</div>
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <TrendingUp size={14} className="text-blue-600" />
                                  <span className="text-xs font-medium text-gray-600">Synced</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                  {syncedTransactions} <span className="text-xs text-gray-500">/ {payrollData.length}</span>
                                </div>
                              </div>
                              <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3 border border-teal-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <BarChart3 size={14} className="text-teal-600" />
                                  <span className="text-xs font-medium text-gray-600">Total Amount</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900">
                                  ₹{new Intl.NumberFormat('en-IN', {
                                    maximumFractionDigits: 0
                                  }).format(payHeadSummary.reduce((sum, item) => sum + item.total, 0) / 100000)}L
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Step-based Status Indicators */}
                          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-lg">
                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                              <Clock size={16} className="text-secondary-600" />
                              Sync Status
                            </h5>
                            <div className="space-y-2">
                              {syncSteps.map((step, idx) => {
                                const isCompleted = idx < activeStepIndex;
                                const isActive = idx === activeStepIndex && pushStatus === 'running';
                                const isPending = idx > activeStepIndex;
                                
                                return (
                                  <div
                                    key={step.id}
                                    className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                      isCompleted
                                        ? 'bg-green-50 border border-green-200'
                                        : isActive
                                        ? 'bg-secondary-50 border-2 border-secondary-300 animate-pulse'
                                        : 'bg-gray-50 border border-gray-200'
                                    }`}
                                  >
                                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                      isCompleted
                                        ? 'bg-green-500'
                                        : isActive
                                        ? 'bg-secondary-600'
                                        : 'bg-gray-300'
                                    }`}>
                                      {isCompleted ? (
                                        <CheckCircle2 size={16} className="text-white" />
                                      ) : isActive ? (
                                        <Loader2 size={14} className="text-white animate-spin" />
                                      ) : (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                      )}
                                    </div>
                                    <span className={`text-sm font-medium flex-1 ${
                                      isCompleted
                                        ? 'text-green-800'
                                        : isActive
                                        ? 'text-secondary-800'
                                        : 'text-gray-500'
                                    }`}>
                                      {step.label}
                                    </span>
                                    {isActive && (
                                      <span className="text-xs text-secondary-600 font-medium animate-pulse">
                                        In progress...
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {pushStatus === 'completed' && (
                      <div className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
                        {/* Success Background Animation */}
                        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-xl opacity-60"></div>
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.1)_0%,transparent_70%)] rounded-xl animate-pulse"></div>
                        
                        <div className="relative z-10 bg-white rounded-xl p-6 border-2 border-green-200 shadow-xl flex-1 flex flex-col min-h-0 overflow-hidden">
                          {/* Scrollable Content Area - Full scroll support */}
                          <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                            {/* Large Animated Success Icon */}
                            <div className="text-center mb-6 flex-shrink-0">
                              <div className="relative inline-block mb-4">
                                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                                <div className="absolute inset-0 bg-green-300 rounded-full animate-pulse"></div>
                                <div className="relative inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-2xl">
                                  <CheckCircle2 size={48} className="text-white" />
                                </div>
                              </div>
                              <h5 className="text-2xl font-bold text-gray-900 mb-2">Sync Completed Successfully!</h5>
                              <p className="text-gray-600 text-sm">All data has been pushed to Tally successfully.</p>
                            </div>

                            {/* Sync Summary Metrics */}
                            <div className="grid grid-cols-3 gap-4 mb-6 flex-shrink-0">
                              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <FileCheck size={16} className="text-green-600" />
                                  <span className="text-xs font-medium text-gray-600">Transactions</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{payrollData.length}</div>
                                <div className="text-xs text-gray-500 mt-1">Total synced</div>
                              </div>
                              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <TrendingUp size={16} className="text-blue-600" />
                                  <span className="text-xs font-medium text-gray-600">Pay Heads</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900">{payHeadSummary.length}</div>
                                <div className="text-xs text-gray-500 mt-1">Mapped & synced</div>
                              </div>
                              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200 text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <BarChart3 size={16} className="text-teal-600" />
                                  <span className="text-xs font-medium text-gray-600">Total Amount</span>
                                </div>
                                <div className="text-xl font-bold text-gray-900">
                                  ₹{new Intl.NumberFormat('en-IN', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  }).format(payHeadSummary.reduce((sum, item) => sum + item.total, 0) / 100000)}L
                                </div>
                                <div className="text-xs text-gray-500 mt-1">Processed</div>
                              </div>
                            </div>

                            {/* Sync Status - Show in completed state */}
                            <div className="bg-white rounded-xl p-4 mb-6 border border-gray-200 shadow-lg flex-shrink-0">
                              <h6 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                <Clock size={16} className="text-green-600" />
                                <span>Sync Status</span>
                              </h6>
                              <div className="space-y-2">
                                {syncSteps.map((step, idx) => {
                                  const isCompleted = pushStatus === 'completed' || idx < activeStepIndex;
                                  return (
                                    <div
                                      key={step.id}
                                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                        isCompleted
                                          ? 'bg-green-50 border border-green-200'
                                          : 'bg-gray-50 border border-gray-200'
                                      }`}
                                    >
                                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                                        isCompleted
                                          ? 'bg-green-500'
                                          : 'bg-gray-300'
                                      }`}>
                                        {isCompleted ? (
                                          <CheckCircle2 size={16} className="text-white" />
                                        ) : (
                                          <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                      </div>
                                      <span className={`text-sm font-medium flex-1 ${
                                        isCompleted
                                          ? 'text-green-800'
                                          : 'text-gray-500'
                                      }`}>
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Sync Summary Steps - Fully scrollable */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200 flex-shrink-0">
                              <h6 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                <CheckCircle2 size={16} className="text-green-600" />
                                <span>Sync Summary</span>
                              </h6>
                              <div className="space-y-2 overflow-y-auto custom-scrollbar" style={{ maxHeight: '400px', minHeight: '200px' }}>
                                {syncSteps.map((step, idx) => {
                                  // In completed state, all steps should show as completed
                                  const isCompleted = pushStatus === 'completed' || idx <= activeStepIndex;
                                  return (
                                    <div 
                                      key={step.id} 
                                      className={`flex items-center gap-3 p-2.5 rounded-lg transition-all ${
                                        isCompleted 
                                          ? 'bg-white border border-green-200' 
                                          : 'bg-gray-100 border border-gray-200'
                                      }`}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                                      ) : (
                                        <div className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0" />
                                      )}
                                      <span className={`text-sm font-medium flex-1 ${
                                        isCompleted ? 'text-gray-700' : 'text-gray-400'
                                      }`}>
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                              })}
                            </div>
                          </div>
                          </div>

                          {/* CTAs */}
                          <div className="flex gap-3 flex-shrink-0">
                            <button
                              onClick={() => {
                                // Navigate to sync report (placeholder)
                                toast.success('Sync report feature coming soon!');
                              }}
                              className="flex-1 btn btn-outline flex items-center justify-center gap-2 py-2.5"
                            >
                              <FileText size={16} />
                              View Sync Report
                            </button>
                            <button
                              onClick={() => {
                                setCurrentStep(1);
                                setPushProgress(0);
                                setPushStatus('idle');
                                setPushLogs([]);
                                setSyncedTransactions(0);
                                setEstimatedTimeRemaining(15);
                                setActiveStepIndex(0);
                              }}
                              className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-2.5 shadow-lg hover:shadow-xl"
                            >
                              <Play size={16} />
                              Start New Sync
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wizard Footer - Always visible at bottom, fixed */}
              <div className="flex justify-between items-center pt-1.5 border-t border-gray-200 bg-white rounded-b-xl px-2 pb-1.5 flex-shrink-0">
                {currentStep > 1 && (
                  <button
                    onClick={handlePrevStep}
                    disabled={pushStatus === 'running'}
                    className="btn btn-secondary flex items-center text-xs py-1.5 px-3"
                  >
                    <ArrowLeft size={12} className="mr-1" />
                    Previous
                  </button>
                )}
                <div className="flex gap-1.5 ml-auto">
                  {currentStep < 3 && (
                    <button
                      data-step="next"
                      onClick={handleNextStep}
                      disabled={!selectedYear || !selectedPeriod || payrollData.length === 0 || pushStatus === 'running'}
                      className="btn btn-primary flex items-center shadow-md hover:shadow-lg transition-all text-xs py-1.5 px-3"
                    >
                      Next
                      <ArrowRight size={12} className="ml-1" />
                    </button>
                  )}
                  {currentStep === 3 && pushStatus === 'completed' && (
                    <button
                      onClick={() => {
                        setCurrentStep(1);
                        setPushProgress(0);
                        setPushStatus('idle');
                        setPushLogs([]);
                      }}
                      className="btn btn-primary shadow-md hover:shadow-lg transition-all text-xs py-1.5 px-3"
                    >
                      Start New Sync
                    </button>
                  )}
                </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default MapForTally; 