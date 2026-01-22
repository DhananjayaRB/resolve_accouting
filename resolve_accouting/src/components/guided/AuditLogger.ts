/**
 * Audit Logger for Guided Actions
 * Logs all guided mode actions for compliance and audit purposes
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  trigger: 'prompt' | 'voice' | 'guided' | 'auto';
  intent?: any;
  steps?: any[];
  results?: any[];
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  confirmationRequired: boolean;
  confirmed: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

class AuditLogger {
  private static logs: AuditLogEntry[] = [];

  static log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): string {
    const logEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.push(logEntry);
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[Audit Log]', logEntry);
    }

    // In production, send to backend API
    this.sendToBackend(logEntry);

    return logEntry.id;
  }

  private static async sendToBackend(entry: AuditLogEntry) {
    try {
      // TODO: Implement backend API call
      // await fetch('/api/audit/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      console.error('Failed to send audit log to backend:', error);
    }
  }

  static getLogs(): AuditLogEntry[] {
    return [...this.logs];
  }

  static getLogById(id: string): AuditLogEntry | undefined {
    return this.logs.find(log => log.id === id);
  }

  static getLogsByUser(user: string): AuditLogEntry[] {
    return this.logs.filter(log => log.user === user);
  }

  static getLogsByAction(action: string): AuditLogEntry[] {
    return this.logs.filter(log => log.action === action);
  }

  static exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else {
      // CSV format
      const headers = ['ID', 'Timestamp', 'User', 'Action', 'Trigger', 'Status', 'Risk Level', 'Confirmed'];
      const rows = this.logs.map(log => [
        log.id,
        log.timestamp,
        log.user,
        log.action,
        log.trigger,
        log.status,
        log.riskLevel,
        log.confirmed ? 'Yes' : 'No',
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }

  static clearLogs() {
    this.logs = [];
  }
}

export default AuditLogger;

