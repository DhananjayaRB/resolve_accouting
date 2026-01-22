import React from 'react';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ 
  title = 'Coming Soon', 
  description = 'This feature is under development and will be available soon.' 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="bg-secondary-100 p-6 rounded-full">
        <Construction size={48} className="text-secondary-600" />
      </div>
      <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      <p className="text-gray-600 max-w-md text-center">{description}</p>
    </div>
  );
};

export default ComingSoon;

