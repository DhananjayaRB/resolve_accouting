import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  change?: number;
  linkTo?: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ 
  title, 
  value, 
  icon,
  change,
  linkTo 
}) => {
  return (
    <div className="card hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="text-primary-600">
          {icon}
        </div>
      </div>
      
      <div className="flex items-baseline">
        <span className="text-2xl font-semibold text-gray-900">{value}</span>
        
        {change !== undefined && (
          <span className={`ml-2 flex items-center text-sm font-medium ${
            change >= 0 ? 'text-success-600' : 'text-error-600'
          }`}>
            {change >= 0 ? (
              <>
                <TrendingUp className="h-3 w-3 mr-1" />
                +{change}
              </>
            ) : (
              <>
                <TrendingDown className="h-3 w-3 mr-1" />
                {change}
              </>
            )}
          </span>
        )}
      </div>
      
      {linkTo && (
        <div className="mt-4">
          <Link 
            to={linkTo}
            className="flex items-center text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            View details <ArrowUpRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default DashboardCard;