/**
 * Voice Command Parser for VoiceSync
 * Extracts intent from natural language commands
 */

export interface ParsedCommand {
  module: 'payroll' | 'expense' | 'ngo' | 'accounting' | null;
  financialYear: string | null;
  period: string | null;
  targetSystem: 'tally' | 'oracle' | null;
  confidence: number;
  rawCommand: string;
}

class VoiceCommandParser {
  // Module keywords
  private static moduleKeywords = {
    payroll: ['payroll', 'salary', 'employee', 'pay', 'wages'],
    expense: ['expense', 'expenses', 'cost', 'spending', 'expenditure'],
    ngo: ['ngo', 'grant', 'grants', 'donation', 'donations', 'fund', 'funds'],
    accounting: ['accounting', 'account', 'ledger', 'journal', 'transaction', 'transactions'],
  };

  // Target system keywords
  private static targetKeywords = {
    tally: ['tally', 'tally erp', 'tally prime'],
    oracle: ['oracle', 'oracle erp', 'oracle financials'],
  };

  // Month names
  private static months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december',
  ];

  // Financial year patterns
  private static yearPatterns = [
    /(\d{4})[\s-](\d{4})/, // 2024-2025
    /(\d{4})/, // 2024
    /current[\s]+year/i,
    /this[\s]+year/i,
  ];

  static parse(command: string): ParsedCommand {
    const lowerCommand = command.toLowerCase();
    const result: ParsedCommand = {
      module: null,
      financialYear: null,
      period: null,
      targetSystem: null,
      confidence: 0,
      rawCommand: command,
    };

    let confidenceScore = 0;

    // Parse module
    for (const [module, keywords] of Object.entries(this.moduleKeywords)) {
      for (const keyword of keywords) {
        if (lowerCommand.includes(keyword)) {
          result.module = module as any;
          confidenceScore += 0.3;
          break;
        }
      }
      if (result.module) break;
    }

    // Parse target system
    for (const [target, keywords] of Object.entries(this.targetKeywords)) {
      for (const keyword of keywords) {
        if (lowerCommand.includes(keyword)) {
          result.targetSystem = target as any;
          confidenceScore += 0.3;
          break;
        }
      }
      if (result.targetSystem) break;
    }

    // Parse financial year
    if (lowerCommand.includes('current') && lowerCommand.includes('year')) {
      result.financialYear = 'current';
      confidenceScore += 0.2;
    } else {
      const yearMatch = lowerCommand.match(/(\d{4})[\s-](\d{4})/);
      if (yearMatch) {
        result.financialYear = `${yearMatch[1]}-${yearMatch[2]}`;
        confidenceScore += 0.2;
      } else {
        const singleYearMatch = lowerCommand.match(/\b(20\d{2})\b/);
        if (singleYearMatch) {
          const year = parseInt(singleYearMatch[1]);
          result.financialYear = `${year}-${year + 1}`;
          confidenceScore += 0.2;
        }
      }
    }

    // Parse period (month)
    for (const month of this.months) {
      if (lowerCommand.includes(month)) {
        // Try to extract year if mentioned with month
        const monthYearMatch = lowerCommand.match(
          new RegExp(`${month}\\s+(20\\d{2})`, 'i')
        );
        if (monthYearMatch) {
          result.period = `${month.charAt(0).toUpperCase() + month.slice(1)}-${monthYearMatch[1]}`;
        } else {
          result.period = month.charAt(0).toUpperCase() + month.slice(1);
        }
        confidenceScore += 0.2;
        break;
      }
    }

    // Check for quarter mentions
    const quarterMatch = lowerCommand.match(/(q[1-4]|quarter\s+[1-4])/i);
    if (quarterMatch) {
      result.period = quarterMatch[0].toUpperCase();
      confidenceScore += 0.15;
    }

    // Normalize confidence (0-1 scale)
    result.confidence = Math.min(1, confidenceScore);

    return result;
  }

  /**
   * Validate parsed command
   * Returns true if command has minimum required fields
   */
  static validate(command: ParsedCommand): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!command.module) {
      errors.push('Module not specified');
    }

    if (!command.targetSystem) {
      errors.push('Target system not specified');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generate human-readable summary of parsed command
   */
  static summarize(command: ParsedCommand): string {
    const parts: string[] = [];

    if (command.module) {
      parts.push(`${command.module} data`);
    }

    if (command.period) {
      parts.push(`for ${command.period}`);
    }

    if (command.financialYear) {
      if (command.financialYear === 'current') {
        parts.push('in current financial year');
      } else {
        parts.push(`in ${command.financialYear}`);
      }
    }

    if (command.targetSystem) {
      parts.push(`to ${command.targetSystem}`);
    }

    return parts.join(' ') || 'Command not fully parsed';
  }
}

export default VoiceCommandParser;
export type { ParsedCommand };

