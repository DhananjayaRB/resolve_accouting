import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MessageSquare, X, Play, Pause, CheckCircle2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import PromptIntentParser, { ParsedIntent } from './PromptIntentParser';
import ActionPlanner, { ActionStep, ExecutionPlan } from './ActionPlanner';
import ExecutionEngine, { ExecutionResult } from './ExecutionEngine';
import GuidedModeOverlay from './GuidedModeOverlay';
import ExecutionVisualizer from './ExecutionVisualizer';

interface GuidedAssistantProps {
  onExecutionComplete?: (results: ExecutionResult[]) => void;
}

type Mode = 'idle' | 'parsing' | 'planning' | 'explain' | 'guided' | 'executing' | 'completed';

const GuidedAssistant: React.FC<GuidedAssistantProps> = ({ onExecutionComplete }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('idle');
  const [prompt, setPrompt] = useState('');
  const [parsedIntent, setParsedIntent] = useState<ParsedIntent | null>(null);
  const [executionPlan, setExecutionPlan] = useState<ExecutionPlan | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [executionResults, setExecutionResults] = useState<ExecutionResult[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true); // Hidden by default
  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          try {
            const transcript = event.results[0][0].transcript;
            setPrompt(transcript);
            handleProcessPrompt(transcript);
            setIsListening(false);
          } catch (error) {
            console.error('Error processing speech result:', error);
            setIsListening(false);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            toast.error('Microphone access denied');
          }
        };
      }
    } catch (error) {
      console.error('Error initializing speech recognition:', error);
    }

    // Listen for navigation events
    const handleNavigate = (event: CustomEvent) => {
      try {
        navigate(event.detail.route);
      } catch (error) {
        console.error('Error navigating:', error);
      }
    };

    window.addEventListener('guided-navigate', handleNavigate as EventListener);

    return () => {
      window.removeEventListener('guided-navigate', handleNavigate as EventListener);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [navigate]);

  const handleProcessPrompt = async (inputPrompt: string) => {
    try {
      if (!inputPrompt.trim()) return;

      setMode('parsing');
      setPrompt(inputPrompt);

      // Parse intent
      const intent = PromptIntentParser.parse(inputPrompt);
      const validation = PromptIntentParser.validate(intent);

      if (!validation.valid) {
        toast.error(`Unable to understand: ${validation.errors.join(', ')}`);
        setMode('idle');
        return;
      }

      setParsedIntent(intent);

      // Create execution plan
      setMode('planning');
      const plan = ActionPlanner.createPlan(intent);
      setExecutionPlan(plan);

      // Show plan preview
      setMode('explain');
      setShowPlanPreview(true);
    } catch (error: any) {
      console.error('Error processing prompt:', error);
      toast.error(`Error processing prompt: ${error.message || 'Unknown error'}`);
      setMode('idle');
    }
  };

  const handleStartGuidedMode = () => {
    if (!executionPlan) return;
    setMode('guided');
    setShowPlanPreview(false);
    setCurrentStepIndex(0);
  };

  const handleAutoExecute = async () => {
    if (!executionPlan) return;

    setMode('executing');
    setShowPlanPreview(false);

    const results: ExecutionResult[] = [];

    try {
      for (let i = 0; i < executionPlan.steps.length; i++) {
        setCurrentStepIndex(i);
        const step = executionPlan.steps[i];

        // Skip confirmation steps (handled separately)
        if (step.type === 'confirm') {
          console.log(`[Guided] Skipping confirmation step: ${step.id}`);
          continue;
        }

        console.log(`[Guided] Executing step ${i + 1}/${executionPlan.steps.length}: ${step.description}`);
        console.log(`[Guided] Step details:`, { type: step.type, target: step.target, value: step.value });

        const result = await ExecutionEngine.executeStep(step);
        results.push(result);

        setExecutionResults([...results]);

        console.log(`[Guided] Step result:`, result);

        if (!result.success) {
          console.error(`[Guided] Step ${i + 1} failed:`, result.message);
          toast.error(`Step ${i + 1} failed: ${result.message}`);
          setMode('idle');
          return;
        }

        // Delay for visual feedback (longer delays for navigation and wait steps)
        let delay = 1000;
        if (step.type === 'navigate') {
          delay = 2000; // Navigation needs time for route change
        } else if (step.type === 'wait') {
          delay = 500; // Wait steps already have their own waiting logic
        } else if (step.type === 'select') {
          delay = 1500; // Selection needs time for API responses to populate dropdowns
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      setMode('completed');
      if (onExecutionComplete) {
        onExecutionComplete(results);
      }
      toast.success(`Execution completed successfully! ${results.length} steps executed.`);
    } catch (error: any) {
      console.error('[Guided] Auto-execute error:', error);
      toast.error(`Execution failed: ${error.message || 'Unknown error'}`);
      setMode('idle');
    }
  };

  const handleNextStep = () => {
    if (!executionPlan) return;
    if (currentStepIndex < executionPlan.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleCancel = () => {
    setMode('idle');
    setPrompt('');
    setParsedIntent(null);
    setExecutionPlan(null);
    setCurrentStepIndex(0);
    setExecutionResults([]);
    setShowPlanPreview(false);
  };

  const handleStartListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not available');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error starting recognition:', error);
      setIsListening(false);
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const currentStep = executionPlan?.steps[currentStepIndex] || null;

  return (
    <>
      {/* Floating Toggle Button - Show when minimized - Positioned in top-right to avoid overlap */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed top-20 right-[420px] z-[9997] bg-gradient-to-r from-secondary-600 to-secondary-700 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 group"
          title="Show AI Assistant"
        >
          <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
          {mode !== 'idle' && (
            <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              ●
            </span>
          )}
        </button>
      )}

      {/* Floating Prompt Bar - Positioned in top-right to avoid overlap with Next button */}
      {!isMinimized && (
      <div className="fixed top-20 right-[420px] z-[9997] w-96 max-h-[calc(100vh-120px)] transition-all duration-300">
        <div className="bg-white rounded-2xl shadow-2xl border-2 border-secondary-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-secondary-600 to-secondary-700 px-4 py-3 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} className="text-white" />
                <h3 className="text-white font-bold text-sm">AI Assistant</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white/80 hover:text-white transition-colors"
                  title="Minimize"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M9 9h6v6H9z" />
                  </svg>
                </button>
                {mode !== 'idle' && (
                  <button
                    onClick={handleCancel}
                    className="text-white/80 hover:text-white transition-colors"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            {mode === 'idle' && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && prompt.trim()) {
                      handleProcessPrompt(prompt);
                    }
                  }}
                  placeholder="Enter your command or prompt..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => prompt.trim() && handleProcessPrompt(prompt)}
                    className="flex-1 btn btn-primary text-xs py-2"
                  >
                    Process
                  </button>
                  <button
                    onClick={isListening ? handleStopListening : handleStartListening}
                    className={`px-3 py-2 rounded-lg transition-all ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Mic size={18} />
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  Example: "For payroll, current financial year, December 2025, push records to Tally"
                </p>
              </div>
            )}

            {mode === 'parsing' && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin">
                  <AlertCircle size={24} className="text-secondary-600" />
                </div>
                <span className="ml-3 text-sm text-gray-700">Parsing your request...</span>
              </div>
            )}

            {mode === 'planning' && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin">
                  <AlertCircle size={24} className="text-secondary-600" />
                </div>
                <span className="ml-3 text-sm text-gray-700">Creating execution plan...</span>
              </div>
            )}

            {mode === 'explain' && executionPlan && (
              <div className="space-y-3">
                <div className="bg-secondary-50 rounded-lg p-3 border border-secondary-200">
                  <h4 className="font-semibold text-sm text-gray-800 mb-2">Execution Plan</h4>
                  <p className="text-xs text-gray-600 mb-3">{PromptIntentParser.summarize(parsedIntent!)}</p>
                  <div className="space-y-2">
                    {executionPlan.steps.map((step, idx) => (
                      <div key={step.id} className="flex items-start gap-2 text-xs">
                        <span className="w-5 h-5 rounded-full bg-secondary-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-gray-700">{step.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleStartGuidedMode}
                    className="flex-1 btn btn-primary text-xs py-2"
                  >
                    Guide Me Step-by-Step
                  </button>
                  <button
                    onClick={handleAutoExecute}
                    className="flex-1 btn btn-secondary text-xs py-2"
                  >
                    Auto-Execute
                  </button>
                </div>
              </div>
            )}

            {mode === 'executing' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="animate-spin">
                    <Play size={18} className="text-secondary-600" />
                  </div>
                  <span className="text-sm text-gray-700">Executing step {currentStepIndex + 1} of {executionPlan?.steps.length}</span>
                </div>
                {currentStep && (
                  <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                    <p className="text-xs text-blue-800">{currentStep.description}</p>
                  </div>
                )}
              </div>
            )}

            {mode === 'completed' && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 size={20} />
                  <span className="font-semibold text-sm">Execution Completed</span>
                </div>
                <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                  <p className="text-xs text-green-800">
                    {executionResults.filter(r => r.success).length} of {executionResults.length} steps completed successfully
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-full btn btn-outline text-xs py-2"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Guided Mode Overlay */}
      {mode === 'guided' && executionPlan && (
        <GuidedModeOverlay
          isActive={true}
          currentStep={currentStep}
          totalSteps={executionPlan.steps.length}
          stepIndex={currentStepIndex}
          onNext={handleNextStep}
          onPrevious={handlePreviousStep}
          onCancel={handleCancel}
          onAutoExecute={handleAutoExecute}
        />
      )}

      {/* Execution Visualizer - Shows during auto-execution */}
      {mode === 'executing' && executionPlan && (
        <ExecutionVisualizer
          isActive={true}
          currentStep={executionPlan.steps[currentStepIndex]}
          currentStepIndex={currentStepIndex}
          totalSteps={executionPlan.steps.length}
          executionResults={executionResults}
          onClose={handleCancel}
        />
      )}
    </>
  );
};

export default GuidedAssistant;

