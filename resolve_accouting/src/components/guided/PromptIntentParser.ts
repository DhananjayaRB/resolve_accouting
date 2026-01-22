/**
 * Prompt Intent Parser
 * Extracts structured actions from natural language prompts
 */

export interface ParsedIntent {
  module: 'payroll' | 'expense' | 'ngo' | 'accounting' | null;
  action: 'sync' | 'push' | 'view' | 'export' | 'report' | null;
  targetSystem: 'tally' | 'oracle' | 'other' | null;
  financialYear: string | null;
  period: string | null;
  dateRange?: { start: string; end: string };
  filters?: Record<string, any>;
  confidence: number;
  rawPrompt: string;
}

class PromptIntentParser {
  // Module keywords
  private static moduleKeywords = {
    payroll: ['payroll', 'salary', 'employee', 'pay', 'wages', 'paysheet'],
    expense: ['expense', 'expenses', 'cost', 'spending', 'expenditure'],
    ngo: ['ngo', 'grant', 'grants', 'donation', 'donations', 'fund', 'funds'],
    accounting: ['accounting', 'account', 'ledger', 'journal', 'transaction', 'transactions'],
  };

  // Action keywords
  private static actionKeywords = {
    sync: ['sync', 'synchronize', 'push', 'send', 'export', 'transfer'],
    push: ['push', 'send', 'export', 'transfer'],
    view: ['view', 'show', 'display', 'see', 'list'],
    export: ['export', 'download', 'extract'],
    report: ['report', 'generate', 'create'],
  };

  // Target system keywords
  private static targetKeywords = {
    tally: ['tally', 'tally erp', 'tally prime'],
    oracle: ['oracle', 'oracle erp', 'oracle financials'],
    other: ['erp', 'system', 'external'],
  };

  // Month names
  private static months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];

  static parse(prompt: string): ParsedIntent {
    const lowerPrompt = prompt.toLowerCase();
    const result: ParsedIntent = {
      module: null,
      action: null,
      targetSystem: null,
      financialYear: null,
      period: null,
      confidence: 0,
      rawPrompt: prompt,
    };

    let confidenceScore = 0;

    // Parse module
    for (const [module, keywords] of Object.entries(this.moduleKeywords)) {
      for (const keyword of keywords) {
        if (lowerPrompt.includes(keyword)) {
          result.module = module as any;
          confidenceScore += 0.25;
          break;
        }
      }
      if (result.module) break;
    }

    // Parse action
    for (const [action, keywords] of Object.entries(this.actionKeywords)) {
      for (const keyword of keywords) {
        if (lowerPrompt.includes(keyword)) {
          result.action = action as any;
          confidenceScore += 0.25;
          break;
        }
      }
      if (result.action) break;
    }

    // Parse target system
    for (const [target, keywords] of Object.entries(this.targetKeywords)) {
      for (const keyword of keywords) {
        if (lowerPrompt.includes(keyword)) {
          result.targetSystem = target as any;
          confidenceScore += 0.2;
          break;
        }
      }
      if (result.targetSystem) break;
    }

    // Parse financial year
    if (lowerPrompt.includes('current') && (lowerPrompt.includes('year') || lowerPrompt.includes('fy'))) {
      result.financialYear = 'current';
      confidenceScore += 0.15;
    } else {
      const yearMatch = lowerPrompt.match(/(\d{4})[\s-](\d{4})/);
      if (yearMatch) {
        result.financialYear = `${yearMatch[1]}-${yearMatch[2]}`;
        confidenceScore += 0.15;
      } else {
        const singleYearMatch = lowerPrompt.match(/\b(20\d{2})\b/);
        if (singleYearMatch) {
          const year = parseInt(singleYearMatch[1]);
          result.financialYear = `${year}-${year + 1}`;
          confidenceScore += 0.15;
        }
      }
    }

    // Parse period (month)
    for (const month of this.months) {
      if (lowerPrompt.includes(month)) {
        const monthYearMatch = lowerPrompt.match(
          new RegExp(`${month}\\s+(20\\d{2})`, 'i')
        );
        if (monthYearMatch) {
          // Format: "December 2025" -> try to match common formats in dropdown
          const year = monthYearMatch[1];
          const monthName = month.charAt(0).toUpperCase() + month.slice(1);
          // Try multiple formats that might appear in dropdown
          result.period = `${monthName}-${year}`; // Primary format
          // Also store alternative formats for matching
          result.period = `${monthName}-${year}`;
        } else {
          result.period = month.charAt(0).toUpperCase() + month.slice(1);
        }
        confidenceScore += 0.15;
        break;
      }
    }

    // Check for quarter mentions
    const quarterMatch = lowerPrompt.match(/(q[1-4]|quarter\s+[1-4])/i);
    if (quarterMatch) {
      result.period = quarterMatch[0].toUpperCase();
      confidenceScore += 0.1;
    }

    // Normalize confidence
    result.confidence = Math.min(1, confidenceScore);

    return result;
  }

  static validate(intent: ParsedIntent): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!intent.module) {
      errors.push('Module not specified');
    }

    if (!intent.action) {
      errors.push('Action not specified');
    }

    // For sync/push actions, target system is required
    if ((intent.action === 'sync' || intent.action === 'push') && !intent.targetSystem) {
      errors.push('Target system not specified for sync/push action');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static summarize(intent: ParsedIntent): string {
    const parts: string[] = [];

    if (intent.action) {
      parts.push(intent.action);
    }

    if (intent.module) {
      parts.push(`${intent.module} data`);
    }

    if (intent.period) {
      parts.push(`for ${intent.period}`);
    }

    if (intent.financialYear) {
      if (intent.financialYear === 'current') {
        parts.push('in current financial year');
      } else {
        parts.push(`in ${intent.financialYear}`);
      }
    }

    if (intent.targetSystem) {
      parts.push(`to ${intent.targetSystem}`);
    }

    return parts.join(' ') || 'Intent not fully parsed';
  }
}

export default PromptIntentParser;

