import React from 'react';
import { useApp } from '../../context/AppContext';
import { PieChart, BarChart2, BookOpen, FileCog, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { Link } from 'react-router-dom';
import DashboardCard from './DashboardCard';
import RecentActivityCard from './RecentActivityCard';

const DashboardPage: React.FC = () => {
  const { 
    ledgerHeads, 
    payrollMappings, 
    payrollJournals 
  } = useApp();

  const activeLedgerCount = ledgerHeads.filter(ledger => ledger.isActive).length;
  const mappedItemsCount = payrollMappings.length;
  const generatedJournalsCount = payrollJournals.length;

  const ledgersByCategory = ledgerHeads.reduce((acc, ledger) => {
    if (!acc[ledger.category]) {
      acc[ledger.category] = 0;
    }
    if (ledger.isActive) {
      acc[ledger.category]++;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Accounting Dashboard</h2>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard 
          title="Active Ledger Heads"
          value={activeLedgerCount.toString()}
          icon={<BookOpen className="h-8 w-8 text-primary-600" />}
          change={+2}
          linkTo="/ledgers"
        />
        
        <DashboardCard 
          title="Mapped Payroll Items"
          value={mappedItemsCount.toString()}
          icon={<FileCog className="h-8 w-8 text-primary-600" />}
          change={+5}
          linkTo="/mapping"
        />
        
        <DashboardCard 
          title="Generated Journals"
          value={generatedJournalsCount.toString()}
          icon={<FileSpreadsheet className="h-8 w-8 text-primary-600" />}
          change={+1}
          linkTo="/reports"
        />
        
        <DashboardCard 
          title="Ledger Categories"
          value={Object.keys(ledgersByCategory).length.toString()}
          icon={<PieChart className="h-8 w-8 text-primary-600" />}
          linkTo="/ledgers"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ledger Distribution */}
        <div className="card col-span-1">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-800">Ledger Distribution</h3>
            <BarChart2 className="h-5 w-5 text-gray-500" />
          </div>
          
          <div className="space-y-4">
            {Object.entries(ledgersByCategory).map(([category, count]) => (
              <div key={category} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  category === 'Asset' ? 'bg-success-500' : 
                  category === 'Liability' ? 'bg-warning-500' :
                  category === 'Expense' ? 'bg-error-500' : 'bg-primary-500'
                }`} />
                <span className="text-sm text-gray-600 flex-grow">{category}</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <Link to="/ledgers" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
              View All Ledgers <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card col-span-1">
          <h3 className="font-semibold text-gray-800 mb-4">Quick Actions</h3>
          
          <div className="space-y-3">
            <Link 
              to="/ledgers/new" 
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <BookOpen className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Add New Ledger Head</p>
                <p className="text-xs text-gray-500">Create a new accounting ledger</p>
              </div>
            </Link>
            
            <Link 
              to="/mapping" 
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <FileCog className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Map Payroll Items</p>
                <p className="text-xs text-gray-500">Link payroll items to ledgers</p>
              </div>
            </Link>
            
            <Link 
              to="/reports/new" 
              className="flex items-center p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                <FileSpreadsheet className="h-4 w-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Generate Journal</p>
                <p className="text-xs text-gray-500">Create a new payroll journal</p>
              </div>
            </Link>
          </div>
        </div>
        
        {/* Recent Activity */}
        <RecentActivityCard />
      </div>
    </div>
  );
};

export default DashboardPage;