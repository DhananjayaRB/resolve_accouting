import React, { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  command?: string;
  parsed?: any;
  status: string;
}

interface VoiceAuditLogProps {
  logs: AuditLog[];
}

const VoiceAuditLog: React.FC<VoiceAuditLogProps> = ({ logs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'executing':
        return <CheckCircle2 size={14} className="text-green-600" />;
      case 'cancelled':
        return <XCircle size={14} className="text-red-600" />;
      case 'pending_confirmation':
        return <AlertCircle size={14} className="text-yellow-600" />;
      default:
        return <Clock size={14} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'executing':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending_confirmation':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (logs.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 w-80">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-2xl transition-colors"
        >
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-gray-600" />
            <span className="font-semibold text-gray-800">Audit Log</span>
            <span className="bg-secondary-600 text-white text-xs px-2 py-0.5 rounded-full">
              {logs.length}
            </span>
          </div>
          {isExpanded ? (
            <ChevronDown size={18} className="text-gray-600" />
          ) : (
            <ChevronUp size={18} className="text-gray-600" />
          )}
        </button>

        {/* Logs List */}
        {isExpanded && (
          <div className="max-h-96 overflow-y-auto p-2">
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    {getStatusIcon(log.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-800 capitalize">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {formatTimestamp(log.timestamp)}
                      </div>
                      {log.command && (
                        <div className="text-xs text-gray-700 bg-white rounded p-2 border border-gray-200 mb-2">
                          <span className="font-medium">Command:</span> "{log.command}"
                        </div>
                      )}
                      {log.parsed && (
                        <div className="text-xs text-gray-600 space-y-1">
                          {log.parsed.module && (
                            <div>
                              <span className="font-medium">Module:</span> {log.parsed.module}
                            </div>
                          )}
                          {log.parsed.targetSystem && (
                            <div>
                              <span className="font-medium">Target:</span> {log.parsed.targetSystem}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceAuditLog;

