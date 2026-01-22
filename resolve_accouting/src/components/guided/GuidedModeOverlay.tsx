import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Info } from 'lucide-react';
import { ActionStep } from './ActionPlanner';

interface GuidedModeOverlayProps {
  isActive: boolean;
  currentStep: ActionStep | null;
  totalSteps: number;
  stepIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onCancel: () => void;
  onAutoExecute: () => void;
}

const GuidedModeOverlay: React.FC<GuidedModeOverlayProps> = ({
  isActive,
  currentStep,
  totalSteps,
  stepIndex,
  onNext,
  onPrevious,
  onCancel,
  onAutoExecute,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      if (!isActive || !currentStep || !currentStep.highlight) return;

      // Find and highlight the target element
      const targetElement = document.querySelector(currentStep.highlight.element);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        
        if (highlightRef.current) {
          highlightRef.current.style.width = `${rect.width + 16}px`;
          highlightRef.current.style.height = `${rect.height + 16}px`;
          highlightRef.current.style.left = `${rect.left - 8 + window.scrollX}px`;
          highlightRef.current.style.top = `${rect.top - 8 + window.scrollY}px`;
        }

        // Scroll element into view
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch (error) {
      console.error('Error in GuidedModeOverlay effect:', error);
    }
  }, [isActive, currentStep, stepIndex]);

  if (!isActive || !currentStep) return null;

  const progress = ((stepIndex + 1) / totalSteps) * 100;

  return createPortal(
    <>
      {/* Dimmed Background */}
      <div
        ref={overlayRef}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9998] transition-opacity duration-300"
        onClick={(e) => {
          // Prevent closing on background click during guided mode
          e.stopPropagation();
        }}
      />

      {/* Spotlight Highlight */}
      {currentStep.highlight && (
        <div
          ref={highlightRef}
          className="fixed z-[9999] pointer-events-none transition-all duration-500"
          style={{
            borderRadius: '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(0, 184, 169, 0.8), 0 0 20px rgba(0, 184, 169, 0.6)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Tooltip/Instruction Panel */}
      <div
        className="fixed z-[10000] bg-white rounded-2xl shadow-2xl border-2 border-secondary-200 min-w-[400px] max-w-[500px]"
        style={{
          left: currentStep.highlight
            ? `${(document.querySelector(currentStep.highlight.element)?.getBoundingClientRect().left || 0) + window.scrollX}px`
            : '50%',
          top: currentStep.highlight
            ? `${(document.querySelector(currentStep.highlight.element)?.getBoundingClientRect().bottom || 0) + window.scrollY + 20}px`
            : '50%',
          transform: currentStep.highlight ? 'none' : 'translate(-50%, -50%)',
        }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Info size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">Guided Mode</h3>
                <p className="text-white/90 text-sm">Step {stepIndex + 1} of {totalSteps}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white transition-colors"
              aria-label="Cancel guided mode"
            >
              <XCircle size={24} />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step Description */}
          <div className="mb-6">
            <div className="flex items-start gap-3 mb-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                currentStep.type === 'navigate' ? 'bg-blue-100 text-blue-700' :
                currentStep.type === 'select' ? 'bg-purple-100 text-purple-700' :
                currentStep.type === 'click' ? 'bg-green-100 text-green-700' :
                currentStep.type === 'validate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {stepIndex + 1}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-800 mb-2">{currentStep.description}</h4>
                {currentStep.highlight && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-200">
                    {currentStep.highlight.message}
                  </p>
                )}
              </div>
            </div>

            {/* Step Type Badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium px-2 py-1 rounded bg-secondary-100 text-secondary-700 capitalize">
                {currentStep.type}
              </span>
              {currentStep.requiresConfirmation && (
                <span className="text-xs font-medium px-2 py-1 rounded bg-amber-100 text-amber-700">
                  Requires Confirmation
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {stepIndex > 0 && (
              <button
                onClick={onPrevious}
                className="flex-1 btn btn-outline flex items-center justify-center gap-2 py-3"
              >
                <ArrowLeft size={18} />
                Previous
              </button>
            )}
            <button
              onClick={onCancel}
              className="btn btn-outline flex items-center justify-center gap-2 py-3 px-4"
            >
              <XCircle size={18} />
              Cancel
            </button>
            {stepIndex < totalSteps - 1 ? (
              <button
                onClick={onNext}
                className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-3 shadow-lg"
              >
                Next
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                onClick={onAutoExecute}
                className="flex-1 btn btn-secondary flex items-center justify-center gap-2 py-3 shadow-lg"
              >
                <CheckCircle2 size={18} />
                Auto-Execute
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 4px rgba(0, 184, 169, 0.8), 0 0 20px rgba(0, 184, 169, 0.6);
          }
          50% {
            box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5), 0 0 0 6px rgba(0, 184, 169, 1), 0 0 30px rgba(0, 184, 169, 0.8);
          }
        }
      `}</style>
    </>,
    document.body
  );
};

export default GuidedModeOverlay;

