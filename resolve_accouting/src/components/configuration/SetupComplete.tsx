import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle, ArrowLeft, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SetupCompleteProps {
  onFinish: () => void;
  onBack: () => void;
}

const SetupComplete: React.FC<SetupCompleteProps> = ({ onFinish, onBack }) => {
  const { ledgerHeads, payrollMappings, reportConfigurations } = useApp();
  
  const activeLedgers = ledgerHeads.filter(ledger => ledger.isActive).length;
  const mappedItems = payrollMappings.length;
  const templates = reportConfigurations.length;
  
  return (
    <div className="space-y-6 text-center">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-success-100 flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-success-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900">Setup Complete!</h3>
        <p className="text-gray-600 mt-2 max-w-md mx-auto">
          You've successfully configured the accounting module. You're now ready to generate payroll journals.
        </p>
      </div>
      
      {/* Setup Summary */}
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 max-w-md mx-auto">
        <h4 className="font-medium text-gray-800 mb-4 text-left">Your Setup Summary</h4>
        
        <div className="space-y-3 text-left">
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-success-500 mr-2"></div>
            <span className="text-gray-700 flex-grow">Ledger Heads Created</span>
            <span className="font-medium">{activeLedgers}</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-success-500 mr-2"></div>
            <span className="text-gray-700 flex-grow">Payroll Items Mapped</span>
            <span className="font-medium">{mappedItems}</span>
          </div>
          
          <div className="flex items-center">
            <div className="w-2 h-2 rounded-full bg-success-500 mr-2"></div>
            <span className="text-gray-700 flex-grow">Report Templates</span>
            <span className="font-medium">{templates}</span>
          </div>
        </div>
      </div>
      
      {/* Next Steps */}
      <div className="space-y-2 max-w-md mx-auto text-left">
        <h4 className="font-medium text-gray-800">Next Steps</h4>
        <ul className="list-disc pl-5 text-gray-600">
          <li>Generate your first payroll journal from the Reports section</li>
          <li>Export the journal to your preferred format</li>
          <li>Fine-tune your ledger mappings as needed</li>
          <li>Create additional report templates for different scenarios</li>
        </ul>
      </div>
      
      {/* Navigation */}
      <div className="flex justify-center space-x-4 mt-6">
        <button
          onClick={onBack}
          className="btn btn-secondary flex items-center"
        >
          <ArrowLeft size={18} className="mr-1" /> Back
        </button>
        
        <Link to="/" className="btn btn-primary flex items-center" onClick={onFinish}>
          <Home size={18} className="mr-1" /> Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default SetupComplete;