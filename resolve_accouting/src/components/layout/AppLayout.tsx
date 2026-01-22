import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import VoiceSync from '../voicesync/VoiceSync';
import GuidedAssistant from '../guided/GuidedAssistant';
import { getUISettings, UISettings } from '../../utils/settings';

// Error Boundary Component
class ComponentErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null; // Silently fail - don't break the entire app
    }
    return this.props.children;
  }
}

const AppLayout: React.FC = () => {
  const [uiSettings, setUISettings] = useState<UISettings>(getUISettings());

  useEffect(() => {
    // Load settings on mount
    setUISettings(getUISettings());

    // Listen for settings changes
    const handleSettingsChange = (event: CustomEvent<UISettings>) => {
      setUISettings(event.detail);
    };

    window.addEventListener('ui-settings-changed', handleSettingsChange as EventListener);

    return () => {
      window.removeEventListener('ui-settings-changed', handleSettingsChange as EventListener);
    };
  }, []);

  const handleSyncInitiated = (command: any) => {
    console.log('VoiceSync initiated:', command);
    // This will be handled by the specific sync components
  };

  const handleExecutionComplete = (results: any[]) => {
    console.log('Guided execution completed:', results);
    // Log to audit system
  };

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#F7F8FA' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden" style={{ backgroundColor: '#F7F8FA' }}>
        <Header />
        <main className="flex-1 overflow-hidden p-4" style={{ backgroundColor: '#F7F8FA', minHeight: 0 }}>
          <div style={{ height: '100%', width: '100%' }}>
            <Outlet />
          </div>
        </main>
      </div>
      {/* VoiceSync - Controlled by settings */}
      {uiSettings.showVoiceSync && (
        <ComponentErrorBoundary>
          <VoiceSync onSyncInitiated={handleSyncInitiated} />
        </ComponentErrorBoundary>
      )}
      {/* Guided Assistant - Controlled by settings */}
      {uiSettings.showAIAssistant && (
        <ComponentErrorBoundary>
          <GuidedAssistant onExecutionComplete={handleExecutionComplete} />
        </ComponentErrorBoundary>
      )}
    </div>
  );
};

export default AppLayout;