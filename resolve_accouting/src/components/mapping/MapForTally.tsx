import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { getStoredToken } from '../../utils/auth';
import { generateTallyXML, pushToTally } from '../../utils/tally';
import toast from 'react-hot-toast';

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
  const [tallyConfig] = useState({
    ip: '192.168.20.82',
    port: 9000
  });

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
        pay_period: selectedPeriod
      };

      console.log('Fetching paysheet data with:', requestData);

      const response = await fetch('https://uat-api.resolveindia.com/payrun/paysheet', {
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

      const response = await fetch('https://uat-api.resolveindia.com/user/financial-year', {
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

      const response = await fetch(`https://uat-api.resolveindia.com/user/pay-period-cycle/4/${yearId}?isPayslip=true`, {
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

      const response = await fetch('https://uat-api.resolveindia.com/organization/import-to-tally', {
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-center items-center">
        {/* <h2 className="text-2xl font-bold text-gray-800">Map for Tally</h2> */}
      </div>

      <div className="card p-4 mb-6">
        <p className="text-gray-600 text-center">
          Select the financial year and period to view Paysheet
        </p>
      </div>

      {/* Selection Fields */}
      <div className="flex justify-center items-center space-x-4">
        {/* Financial Year Dropdown */}
        <div className="w-64">
          <label htmlFor="financialYear" className="block text-sm font-medium text-gray-700 mb-1 text-center">
            Financial Year
          </label>
          <select
            id="financialYear"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setSelectedPeriod(''); // Reset period when year changes
            }}
            className="block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            disabled={isLoadingYears}
          >
            <option value="">Select Financial Year</option>
            {financialYears.map((year) => (
              <option key={year.customer_year_details_id} value={year.customer_year_details_id}>
                {year.year}
              </option>
            ))}
          </select>
          {isLoadingYears && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              Loading financial years...
            </p>
          )}
        </div>

        {/* Period Dropdown */}
        <div className="w-64">
          <label htmlFor="period" className="block text-sm font-medium text-gray-700 mb-1 text-center">
            Period
          </label>
          <select
            id="period"
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="block w-full h-10 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
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
            <p className="text-xs text-gray-500 mt-1 text-center">
              Loading periods...
            </p>
          )}
        </div>

        {/* Push to Tally Button */}
        <div className="w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1 text-center">
            &nbsp;
          </label>
          <button
            onClick={handlePushToTally}
            disabled={!selectedYear || !selectedPeriod || isPushingToTally}
            className={`w-full h-10 px-4 rounded-md text-sm font-medium text-white 
              ${!selectedYear || !selectedPeriod || isPushingToTally
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-primary-600 hover:bg-primary-700'}`}
          >
            {isPushingToTally ? 'Pushing...' : 'Push to Tally'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-center text-sm font-bold text-gray-700 tracking-wider">
                  Employee Name
                </th>
                <th className="px-6 py-3 text-center text-sm font-bold text-gray-700 tracking-wider">
                  Employee Code
                </th>
                {payrollHeaders.map((header, index) => (
                  <th 
                    key={index} 
                    className={`px-6 py-3 text-sm font-bold text-gray-700 tracking-wider text-center`}
                  >
                    {header.text}
                  </th>
                ))}
                {/* <th className="px-6 py-3 text-center text-sm font-bold text-gray-700 tracking-wider">
                  Actions
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoadingPayroll ? (
                <tr>
                  <td colSpan={payrollHeaders.length + 2} className="px-6 py-4 text-center text-sm text-gray-500">
                    Loading paysheet data...
                  </td>
                </tr>
              ) : payrollData.length === 0 ? (
                <tr>
                  <td colSpan={payrollHeaders.length + 2} className="px-6 py-4 text-center text-sm text-gray-500">
                    No paysheet data available
                  </td>
                </tr>
              ) : (
                payrollData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm text-gray-900 text-left">
                      {item.employee_name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-center">
                      {item.emp_number || '-'}
                    </td>
                    {payrollHeaders.map((header, colIndex) => {
                      const value = getPayValue(item, header.dataField);
                      // Format the value based on dataType
                      let displayValue = '-';
                      if (value !== '-') {
                        if (header.dataType === 'number') {
                          displayValue = new Intl.NumberFormat('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          }).format(Number(value));
                        } else {
                          displayValue = value;
                        }
                      }
                      return (
                        <td 
                          key={colIndex} 
                          className={`px-6 py-4 text-sm text-gray-900 ${header.dataType === 'number' ? 'text-right' : 'text-center'}`}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                    {/* <td className="px-6 py-4 text-sm text-gray-500 text-center">
                      <button
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => {
                          // TODO: Implement edit mapping functionality
                        }}
                      >
                        Edit
                      </button>
                    </td> */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MapForTally; 