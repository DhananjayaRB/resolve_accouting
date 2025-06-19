import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, HelpCircle, UserCircle, ChevronDown } from 'lucide-react';
import { getStoredToken } from '../../utils/auth';

interface Module {
  name: string;
  path: string;
  isActive: boolean;
}

const Header: React.FC = () => {
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Determine the title based on the current route
  const getPageTitle = () => {
    const path = location.pathname;
    
    if (path === '/') return 'Dashboard';
    if (path.startsWith('/ledgers')) return 'Ledger Management';
    if (path.startsWith('/mapping')) return 'Payroll Mapping';
    if (path.startsWith('/bank-mapping')) return 'Bank A/c Mapping';
    if (path.startsWith('/employee-mapping')) return 'Employee Mapping';
    if (path.startsWith('/transaction')) return 'Transaction Management';
    if (path.startsWith('/reports')) return 'Report Generation';
    if (path.startsWith('/configuration')) return 'Configuration Wizard';
    
    return 'Accounting Module';
  };

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const token = getStoredToken();
        if (!token) {
          console.error('No authentication token found');
          return;
        }

        const response = await fetch('https://qa-api.resolveindia.com/organization/get-client-products', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch modules');
        }

        const data = await response.json();
        console.log('Modules data:', data);

        // Transform the API response into our modules array
        const availableModules: Module[] = [
          { name: 'Payroll', path: '/payroll', isActive: data.isPayroll },
          { name: 'Attendance', path: '/attendance', isActive: data.isAttendance },
          { name: 'Leave', path: '/leave', isActive: data.isLeave },
          { name: 'Expense', path: '/expense', isActive: data.isExpense }
        ];

        // Filter out inactive modules
        setModules(availableModules.filter(module => module.isActive));
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModules();
  }, []);
  
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-primary-900">
              {getPageTitle()}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Switch To Dropdown */}
            {modules.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-1 text-gray-700 hover:text-primary-600 transition-colors px-3 py-2 rounded-md hover:bg-gray-50"
                >
                  <span>Switch To</span>
                  <ChevronDown size={16} className={`transform transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    {modules.map((module) => (
                      <a
                        key={module.name}
                        href={module.path}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                      >
                        {module.name}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button className="text-gray-500 hover:text-primary-600 transition-colors p-2">
              <Bell className="h-5 w-5" />
            </button>
            <button className="text-gray-500 hover:text-primary-600 transition-colors p-2">
              <HelpCircle className="h-5 w-5" />
            </button>
            <div className="flex items-center border-l border-gray-200 pl-4">
              <UserCircle className="h-8 w-8 text-gray-400" />
              <div className="ml-2">
                <p className="text-sm font-medium text-gray-700">Admin User</p>
                <p className="text-xs text-gray-500">Finance Dept</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;