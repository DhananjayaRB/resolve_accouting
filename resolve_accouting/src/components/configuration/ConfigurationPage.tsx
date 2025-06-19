import React, { useState } from 'react';
import { CheckCircle, Circle, CheckCheck } from 'lucide-react';
import SetupLedgers from './SetupLedgers';
import SetupMapping from './SetupMapping';
import SetupReports from './SetupReports';
import SetupComplete from './SetupComplete';

const ConfigurationPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completed, setCompleted] = useState<number[]>([]);
  
  const steps = [
    { id: 1, name: 'Setup Ledgers' },
    { id: 2, name: 'Map Payroll Items' },
    { id: 3, name: 'Configure Reports' },
    { id: 4, name: 'Complete Setup' },
  ];
  
  const handleNext = () => {
    if (!completed.includes(currentStep)) {
      setCompleted([...completed, currentStep]);
    }
    setCurrentStep(currentStep + 1);
  };
  
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const handleStepClick = (stepId: number) => {
    // Only allow going to completed steps or the next incomplete step
    if (completed.includes(stepId) || stepId === currentStep) {
      setCurrentStep(stepId);
    }
  };
  
  return (
    <div className="space-y-8 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800">Configuration Wizard</h2>
      
      <p className="text-gray-600">
        Follow this step-by-step guide to set up your accounting module. You'll configure ledgers, 
        map payroll items, and set up your report preferences.
      </p>
      
      {/* Step Progress */}
      <div className="relative">
        <div className="step-connector"></div>
        <div 
          className="step-connector step-connector-active"
          style={{ width: `${(Math.max(0, currentStep - 1) / (steps.length - 1)) * 100}%` }}
        ></div>
        
        <div className="grid grid-cols-4 relative">
          {steps.map((step) => (
            <div 
              key={step.id} 
              className="flex flex-col items-center"
              onClick={() => handleStepClick(step.id)}
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-colors duration-300 ${
                  completed.includes(step.id)
                    ? 'bg-primary-600 text-white'
                    : step.id === currentStep
                    ? 'bg-white border-2 border-primary-600 text-primary-600'
                    : 'bg-white border-2 border-gray-300 text-gray-400'
                } ${completed.includes(step.id) || step.id === currentStep ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                {completed.includes(step.id) ? (
                  <CheckCircle size={24} />
                ) : (
                  step.id <= currentStep ? (
                    step.id
                  ) : (
                    <Circle size={24} />
                  )
                )}
              </div>
              <p className={`mt-2 text-sm ${
                step.id === currentStep 
                  ? 'font-semibold text-primary-900' 
                  : completed.includes(step.id)
                  ? 'font-medium text-primary-700'
                  : 'font-medium text-gray-500'
              }`}>
                {step.name}
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* Step Content */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-sm border border-gray-100">
        {currentStep === 1 && (
          <SetupLedgers onNext={handleNext} />
        )}
        {currentStep === 2 && (
          <SetupMapping onNext={handleNext} onBack={handlePrevious} />
        )}
        {currentStep === 3 && (
          <SetupReports onNext={handleNext} onBack={handlePrevious} />
        )}
        {currentStep === 4 && (
          <SetupComplete onFinish={() => console.log('Setup complete')} onBack={handlePrevious} />
        )}
      </div>
    </div>
  );
};

export default ConfigurationPage;