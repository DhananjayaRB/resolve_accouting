import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, Loader2, AlertCircle, X } from 'lucide-react';
import { ActionStep } from './ActionPlanner';
import { ExecutionResult } from './ExecutionEngine';

interface ExecutionVisualizerProps {
  isActive: boolean;
  currentStep: ActionStep | null;
  currentStepIndex: number;
  totalSteps: number;
  executionResults: ExecutionResult[];
  onClose: () => void;
}

type VisualizerPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

const ExecutionVisualizer: React.FC<ExecutionVisualizerProps> = ({
  isActive,
  currentStep,
  currentStepIndex,
  totalSteps,
  executionResults,
  onClose,
}) => {
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const highlightRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !currentStep) {
      setHighlightedElement(null);
      return;
    }

    // Find and highlight the target element
    const findAndHighlight = () => {
      const targetElement = document.querySelector(currentStep!.target) as HTMLElement;
      if (targetElement) {
        setHighlightedElement(targetElement);
        
        // Scroll element into view
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Update highlight position
        const updateHighlight = () => {
          if (highlightRef.current && targetElement) {
            const rect = targetElement.getBoundingClientRect();
            highlightRef.current.style.width = `${rect.width + 16}px`;
            highlightRef.current.style.height = `${rect.height + 16}px`;
            highlightRef.current.style.left = `${rect.left - 8 + window.scrollX}px`;
            highlightRef.current.style.top = `${rect.top - 8 + window.scrollY}px`;
          }
        };
        
        updateHighlight();
        
        // Re-check position periodically
        const interval = setInterval(updateHighlight, 100);
        
        return () => {
          clearInterval(interval);
        };
      } else {
        setHighlightedElement(null);
      }
    };

    // Initial highlight
    findAndHighlight();
    
    // Also try again after a short delay (for elements that load later)
    const timeout = setTimeout(findAndHighlight, 500);
    
    // Update on scroll/resize
    const updateOnScroll = () => {
      if (highlightedElement && highlightRef.current) {
        const rect = highlightedElement.getBoundingClientRect();
        if (highlightRef.current) {
          highlightRef.current.style.left = `${rect.left - 8 + window.scrollX}px`;
          highlightRef.current.style.top = `${rect.top - 8 + window.scrollY}px`;
        }
      }
    };
    
    window.addEventListener('scroll', updateOnScroll);
    window.addEventListener('resize', updateOnScroll);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('scroll', updateOnScroll);
      window.removeEventListener('resize', updateOnScroll);
    };
  }, [isActive, currentStep, currentStepIndex, highlightedElement]);

  if (!isActive) return null;

  const progress = ((currentStepIndex + 1) / totalSteps) * 100;
  const completedSteps = executionResults.filter(r => r.success).length;
  const failedSteps = executionResults.filter(r => !r.success).length;

  return createPortal(
    <>
      {/* Dimmed Background */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] transition-opacity duration-300" />

      {/* Spotlight Highlight on Active Element */}
      {highlightedElement && currentStep && (
        <div
          ref={highlightRef}
          className="fixed z-[9999] pointer-events-none transition-all duration-500"
          style={{
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(0, 184, 169, 0.9), 0 0 20px rgba(0, 184, 169, 0.7)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Execution Progress Panel */}
      <div className={`fixed top-4 right-4 z-[10000] bg-white rounded-2xl shadow-2xl border-2 border-secondary-200 ${isMinimized ? 'w-64' : 'w-96'} max-h-[80vh] overflow-hidden flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Loader2 size={20} className="text-white animate-spin" />
              <h3 className="text-white font-bold text-sm">Auto-Executing</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white/80 hover:text-white transition-colors"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6v6H9z" />
                  </svg>
                )}
              </button>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1 text-xs text-white/90">
            <span>Step {currentStepIndex + 1} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {/* Content - Hide when minimized */}
        {!isMinimized && (
        <div className="flex-1 p-4 overflow-y-auto">
          {/* Current Step */}
          {currentStep && (
            <div className="mb-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-secondary-100 flex items-center justify-center flex-shrink-0">
                  <Loader2 size={16} className="text-secondary-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{currentStep.description}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-medium px-2 py-1 rounded bg-secondary-100 text-secondary-700 capitalize">
                      {currentStep.type}
                    </span>
                    <span className="text-xs text-gray-500">
                      {currentStep.target}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Execution Results */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-gray-600 mb-2">Execution Log:</h5>
            {executionResults.map((result, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 p-2 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                {result.success ? (
                  <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-medium ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {result.message}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {result.duration}ms
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          {executionResults.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-800">{completedSteps}</div>
                  <div className="text-xs text-gray-500">Completed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{failedSteps}</div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-800">{totalSteps - executionResults.length}</div>
                  <div className="text-xs text-gray-500">Remaining</div>
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 0 4px rgba(0, 184, 169, 0.9), 0 0 20px rgba(0, 184, 169, 0.7);
          }
          50% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4), 0 0 0 6px rgba(0, 184, 169, 1), 0 0 30px rgba(0, 184, 169, 0.9);
          }
        }
      `}</style>
    </>,
    document.body
  );
};

export default ExecutionVisualizer;

