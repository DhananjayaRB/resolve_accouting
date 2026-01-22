import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, CheckCircle2, XCircle, AlertCircle, Clock, FileText, X } from 'lucide-react';
import toast from 'react-hot-toast';
import VoiceCommandParser, { ParsedCommand } from './VoiceCommandParser';
import VoiceConfirmationDialog from './VoiceConfirmationDialog';
import VoiceAuditLog from './VoiceAuditLog';

interface VoiceSyncProps {
  onSyncInitiated?: (command: ParsedCommand) => void;
}

const VoiceSync: React.FC<VoiceSyncProps> = ({ onSyncInitiated }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [parsedCommand, setParsedCommand] = useState<ParsedCommand | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isSupported, setIsSupported] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Hidden by default
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isListeningRef = useRef(false);

  // Update ref when state changes
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const handleCommandParsed = (command: ParsedCommand) => {
    // Log the command for audit
    const auditEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'command_parsed',
      command: command.rawCommand,
      parsed: command,
      status: 'pending_confirmation',
    };
    setAuditLogs(prev => [auditEntry, ...prev]);

    // Read back confirmation
    const confirmationText = `I understood: ${command.module} data for ${command.period || 'selected period'} in ${command.financialYear || 'current year'}, push to ${command.targetSystem}. Please confirm by saying "Confirm sync" or "Cancel".`;
    speak(confirmationText);

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  useEffect(() => {
    // Check browser support
    const hasSupport = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    setIsSupported(hasSupport);

    if (!hasSupport) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    // Initialize Web Speech API only once
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        let maxConfidence = 0;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence || 0.5;
          maxConfidence = Math.max(maxConfidence, confidence);

          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const fullTranscript = finalTranscript || interimTranscript;
        setTranscript(fullTranscript.trim());
        setConfidence(maxConfidence);

        // Parse command when we have a final result
        if (finalTranscript.trim()) {
          console.log('Final transcript received:', finalTranscript.trim());
          const parsed = VoiceCommandParser.parse(finalTranscript.trim());
          console.log('Parsed command:', parsed);
          
          // Validate parsed command
          const validation = VoiceCommandParser.validate(parsed);
          console.log('Validation result:', validation);
          
          if (validation.valid && parsed.module && parsed.targetSystem) {
            console.log('Command is valid, showing confirmation');
            setParsedCommand(parsed);
            // Use setTimeout to ensure state updates happen
            setTimeout(() => {
              handleCommandParsed(parsed);
            }, 100);
          } else {
            console.log('Command validation failed:', validation.errors);
            if (parsed.confidence < 0.4) {
              speak('I did not understand the command clearly. Please repeat with module and target system specified.');
            }
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Don't show error for no-speech, it's normal
        } else if (event.error === 'not-allowed') {
          toast.error('Microphone access denied. Please enable microphone permissions.');
          setIsListening(false);
        } else if (event.error === 'aborted') {
          // User stopped, don't show error
        } else {
          toast.error(`Speech recognition error: ${event.error}`);
          setIsListening(false);
        }
      };

      recognitionRef.current.onend = () => {
        // Only restart if we're still supposed to be listening
        if (isListeningRef.current && recognitionRef.current) {
          try {
            recognitionRef.current.start();
          } catch (e) {
            console.log('Recognition restart prevented:', e);
            setIsListening(false);
          }
        }
      };

      recognitionRef.current.onstart = () => {
        console.log('Speech recognition started');
      };
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
      setIsSupported(false);
    }

    // Initialize Speech Synthesis
    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []); // Only run once on mount

  const speak = (text: string) => {
    if (synthRef.current) {
      synthRef.current.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      synthRef.current.speak(utterance);
    }
  };

  const handleStartListening = async () => {
    if (!isSupported) {
      toast.error('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (!recognitionRef.current) {
      toast.error('Speech recognition not initialized. Please refresh the page.');
      return;
    }

    // Request microphone permission first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      toast.error('Microphone access is required for voice commands. Please allow microphone access.');
      return;
    }

    try {
      setTranscript('');
      setParsedCommand(null);
      setIsListening(true);
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          console.log('Speech recognition started');
          speak('Listening for voice commands. You can say commands like: For payroll, current financial year, December 2025, push records to Tally.');
        }
      }, 100);
      
      const auditEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: 'listening_started',
        status: 'active',
      };
      setAuditLogs(prev => [auditEntry, ...prev]);
    } catch (error: any) {
      console.error('Error starting speech recognition:', error);
      setIsListening(false);
      if (error.message && error.message.includes('already started')) {
        // Already started, just update state
        console.log('Recognition already started');
        setIsListening(true);
      } else {
        toast.error(`Failed to start voice recognition: ${error.message || 'Unknown error'}`);
      }
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.log('Error stopping recognition:', e);
      }
    }
    setIsListening(false);
    
    const auditEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'listening_stopped',
      status: 'stopped',
    };
    setAuditLogs(prev => [auditEntry, ...prev]);
  };

  const handleConfirmSync = () => {
    if (!parsedCommand) return;

    setIsProcessing(true);
    setShowConfirmation(false);
    
    speak('Sync confirmed. Starting synchronization process.');

    const auditEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'sync_confirmed',
      command: parsedCommand.rawCommand,
      parsed: parsedCommand,
      status: 'executing',
    };
    setAuditLogs(prev => [auditEntry, ...prev]);

    // Call the sync initiation callback
    if (onSyncInitiated) {
      onSyncInitiated(parsedCommand);
    }

    // Simulate sync completion (replace with actual sync logic)
    setTimeout(() => {
      setIsProcessing(false);
      speak('Synchronization completed successfully.');
      
      const completionEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: 'sync_completed',
        command: parsedCommand.rawCommand,
        status: 'success',
      };
      setAuditLogs(prev => [completionEntry, ...prev]);
      
      toast.success('Sync completed successfully!');
      setParsedCommand(null);
      setTranscript('');
    }, 2000);
  };

  const handleCancelSync = () => {
    setShowConfirmation(false);
    setParsedCommand(null);
    speak('Sync cancelled.');
    
    const auditEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action: 'sync_cancelled',
      command: parsedCommand?.rawCommand || '',
      status: 'cancelled',
    };
    setAuditLogs(prev => [auditEntry, ...prev]);
  };

  const handleVoiceConfirmation = (command: string) => {
    const lowerCommand = command.toLowerCase();
    if (lowerCommand.includes('confirm') || lowerCommand.includes('yes') || lowerCommand.includes('proceed')) {
      handleConfirmSync();
    } else if (lowerCommand.includes('cancel') || lowerCommand.includes('no') || lowerCommand.includes('abort')) {
      handleCancelSync();
    }
  };

  return (
    <>
      {/* Floating Toggle Button - Show when minimized - Positioned in top-right to avoid overlap */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed top-20 right-6 z-[9996] bg-gradient-to-r from-secondary-600 to-secondary-700 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
          title="Show VoiceSync"
        >
          <Mic size={24} className="group-hover:scale-110 transition-transform" />
          {isListening && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              ●
            </span>
          )}
        </button>
      )}

      {/* Floating Voice Panel - Positioned in top-right to avoid overlap with Next button */}
      {!isMinimized && (
      <div className="fixed top-20 right-6 z-[9996] w-96 max-h-[calc(100vh-120px)] transition-all duration-300">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-secondary-200 w-96 max-h-[600px] flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 px-4 py-3 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic size={20} className="text-white" />
                <h3 className="text-white font-bold text-sm">VoiceSync</h3>
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
                  onClick={isListening ? handleStopListening : handleStartListening}
                  className={`p-2 rounded-lg transition-all ${
                    isListening
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Start Listening'}
                >
                  {isListening ? (
                    <MicOff size={18} className="text-white" />
                  ) : (
                    <Mic size={18} className="text-white" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Content - Hide when minimized */}
          {!isMinimized && (
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Status Indicator */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">Status</span>
                <span className={`text-xs font-semibold px-2 py-1 rounded ${
                  isListening
                    ? 'bg-green-100 text-green-700'
                    : isProcessing
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {isListening ? 'Listening' : isProcessing ? 'Processing' : 'Idle'}
                </span>
              </div>
              
              {/* Confidence Indicator */}
              {isListening && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Confidence</span>
                    <span className="text-xs font-semibold text-gray-700">{Math.round(confidence * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        confidence > 0.7 ? 'bg-green-500' : confidence > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Live Transcript */}
            {transcript && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Volume2 size={14} className="text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Live Transcript</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-800 leading-relaxed">{transcript}</p>
                </div>
              </div>
            )}

            {/* Parsed Command Preview */}
            {parsedCommand && !showConfirmation && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={14} className="text-secondary-600" />
                  <span className="text-xs font-medium text-gray-600">Parsed Command</span>
                </div>
                <div className="bg-secondary-50 rounded-lg p-3 border border-secondary-200">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Module:</span>
                      <span className="font-semibold text-gray-800 capitalize">{parsedCommand.module}</span>
                    </div>
                    {parsedCommand.financialYear && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Financial Year:</span>
                        <span className="font-semibold text-gray-800">{parsedCommand.financialYear}</span>
                      </div>
                    )}
                    {parsedCommand.period && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Period:</span>
                        <span className="font-semibold text-gray-800">{parsedCommand.period}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Target:</span>
                      <span className="font-semibold text-gray-800 capitalize">{parsedCommand.targetSystem}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Processing Indicator */}
            {isProcessing && (
              <div className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin">
                      <Clock size={16} className="text-blue-600" />
                    </div>
                    <span className="text-sm text-blue-800 font-medium">Synchronizing data...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Browser Support Warning */}
            {!isSupported && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-900 mb-1">Browser Not Supported</p>
                    <p className="text-xs text-red-700">
                      Voice recognition requires Chrome, Edge, or Safari. Please use a supported browser.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Help Text */}
            {!isListening && !parsedCommand && isSupported && (
              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium mb-2">Example commands:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>"For payroll, current financial year, December 2025, push records to Tally"</li>
                  <li>"Sync expense data for April 2025 to Oracle"</li>
                  <li>"Push NGO grants for 2024-2025 to Tally"</li>
                </ul>
              </div>
            )}

            {/* Footer - Quick Actions */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 rounded-b-2xl">
              <div className="flex gap-2">
                <button
                  onClick={() => setAuditLogs([])}
                  className="flex-1 btn btn-outline text-xs py-2"
                  disabled={auditLogs.length === 0}
                >
                  Clear Logs
                </button>
                <button
                  onClick={() => {
                    const logsWindow = window.open('', '_blank');
                    if (logsWindow) {
                      logsWindow.document.write(`
                        <html>
                          <head><title>VoiceSync Audit Logs</title></head>
                          <body>
                            <h1>VoiceSync Audit Logs</h1>
                            <pre>${JSON.stringify(auditLogs, null, 2)}</pre>
                          </body>
                        </html>
                      `);
                    }
                  }}
                  className="flex-1 btn btn-secondary text-xs py-2"
                  disabled={auditLogs.length === 0}
                >
                  Export Logs
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmation && parsedCommand && (
        <VoiceConfirmationDialog
          command={parsedCommand}
          onConfirm={handleConfirmSync}
          onCancel={handleCancelSync}
          onVoiceCommand={handleVoiceConfirmation}
          isListening={isListening}
        />
      )}

      {/* Audit Log Panel (Collapsible) */}
      <VoiceAuditLog logs={auditLogs} />
    </>
  );
};

export default VoiceSync;

