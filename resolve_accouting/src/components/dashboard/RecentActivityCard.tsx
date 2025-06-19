import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecentActivityCard: React.FC = () => {
  const activities = [
    {
      id: '1',
      action: 'Generated Journal',
      description: 'January 2025 Payroll Journal was generated',
      timestamp: '2 hours ago',
      link: '/reports/1',
    },
    {
      id: '2',
      action: 'Updated Ledger',
      description: 'Modified "Professional Tax Payable" ledger',
      timestamp: '1 day ago',
      link: '/ledgers/6',
    },
    {
      id: '3',
      action: 'Created Mapping',
      description: 'Mapped "Professional Tax" to its ledger',
      timestamp: '1 day ago',
      link: '/mapping',
    },
    {
      id: '4',
      action: 'Deactivated Ledger',
      description: 'Deactivated "Bonus Expense" ledger',
      timestamp: '2 days ago',
      link: '/ledgers/7',
    },
  ];

  return (
    <div className="card col-span-1">
      <h3 className="font-semibold text-gray-800 mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start pb-3 border-b border-gray-100 last:border-0 last:pb-0">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-primary-500 mr-2"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">{activity.action}</p>
              <p className="text-xs text-gray-500">{activity.description}</p>
              <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100">
        <Link to="/reports" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
          View All Activity <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
};

export default RecentActivityCard;