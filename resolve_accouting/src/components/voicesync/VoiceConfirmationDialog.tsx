import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Mic, Volume2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ParsedCommand } from './VoiceCommandParser';

interface VoiceConfirmationDialogProps {
  command: ParsedCommand;
  onConfirm: () => void;
  onCancel: () => void;
  onVoiceCommand: (command: string) => void;
  isListening: boolean;
}

const VoiceConfirmationDialog: React.FC<VoiceConfirmationDialogProps> = ({
  command,
  onConfirm,
  onCancel,
  onVoiceCommand,
  isListening,
}) => {
  const [voiceResponse, setVoiceResponse] = useState('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);

  useEffect(() => {
    // Listen for voice confirmation when dialog is open
    if (isListening) {
      const handleVoiceInput = (event: any) => {
        if (event.detail && event.detail.transcript) {
          const transcript = event.detail.transcript.toLowerCase();
          setVoiceResponse(transcript);
          setIsProcessingVoice(true);
          
          setTimeout(() => {
            onVoiceCommand(transcript);
            setIsProcessingVoice(false);
            setVoiceResponse('');
          }, 500);
        }
      };

      window.addEventListener('voiceInput', handleVoiceInput);
      return () => {
        window.removeEventListener('voiceInput', handleVoiceInput);
      };
    }
  }, [isListening, onVoiceCommand]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600';
    if (confidence >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.7) return 'bg-green-100 text-green-800';
    if (confidence >= 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-secondary-200 max-w-2xl w-full animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Confirmation Required</h3>
              <p className="text-white/90 text-sm">Please confirm this action before proceeding</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Command Summary */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 size={18} className="text-secondary-600" />
              <h4 className="font-semibold text-gray-800">Voice Command Summary</h4>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
              <p className="text-sm text-gray-700 italic mb-3">"{command.rawCommand}"</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Module:</span>
                  <span className="font-semibold text-gray-800 capitalize">{command.module || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Financial Year:</span>
                  <span className="font-semibold text-gray-800">
                    {command.financialYear === 'current' ? 'Current Year' : command.financialYear || 'Not specified'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Period:</span>
                  <span className="font-semibold text-gray-800">{command.period || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Target System:</span>
                  <span className="font-semibold text-gray-800 capitalize">{command.targetSystem || 'Not specified'}</span>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200">
                  <span className="text-gray-600">Confidence:</span>
                  <span className={`font-semibold px-2 py-1 rounded ${getConfidenceBadge(command.confidence)}`}>
                    {Math.round(command.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-900 mb-1">
                  This action will synchronize financial data to an external system.
                </p>
                <p className="text-xs text-amber-700">
                  All voice actions are logged for audit purposes. Please confirm only if the details above are correct.
                </p>
              </div>
            </div>
          </div>

          {/* Voice Response Indicator */}
          {isListening && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Mic size={16} className="text-secondary-600 animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Listening for confirmation...</span>
              </div>
              {voiceResponse && (
                <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">"{voiceResponse}"</p>
                </div>
              )}
              {isProcessingVoice && (
                <div className="mt-2 text-xs text-gray-500 flex items-center gap-2">
                  <div className="animate-spin">⏳</div>
                  Processing voice command...
                </div>
              )}
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 font-medium mb-2">Voice Confirmation Commands:</p>
            <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
              <li>Say <strong>"Confirm sync"</strong> or <strong>"Yes"</strong> to proceed</li>
              <li>Say <strong>"Cancel"</strong> or <strong>"No"</strong> to abort</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 btn btn-outline flex items-center justify-center gap-2 py-3"
            >
              <XCircle size={18} />
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 btn btn-primary flex items-center justify-center gap-2 py-3 shadow-lg"
            >
              <CheckCircle2 size={18} />
              Confirm Sync
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VoiceConfirmationDialog;

