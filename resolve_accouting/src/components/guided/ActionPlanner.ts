/**
 * Action Planner
 * Converts parsed intent into step-by-step execution plan
 */

import { ParsedIntent } from './PromptIntentParser';

export interface ActionStep {
  id: string;
  order: number;
  type: 'navigate' | 'select' | 'click' | 'input' | 'wait' | 'validate' | 'confirm';
  description: string;
  target: string; // CSS selector or route path
  value?: any; // Value for select/input actions
  validation?: () => boolean;
  requiresConfirmation?: boolean;
  highlight?: {
    element: string;
    message: string;
  };
}

export interface ExecutionPlan {
  intent: ParsedIntent;
  steps: ActionStep[];
  estimatedDuration: number; // in seconds
  requiresConfirmation: boolean;
  riskLevel: 'low' | 'medium' | 'high';
}

class ActionPlanner {
  static createPlan(intent: ParsedIntent): ExecutionPlan {
    const steps: ActionStep[] = [];
    let requiresConfirmation = false;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Determine risk level
    if (intent.action === 'sync' || intent.action === 'push') {
      requiresConfirmation = true;
      riskLevel = 'high';
    } else if (intent.action === 'export' || intent.action === 'report') {
      riskLevel = 'medium';
    }

    // Build steps based on module and action
    if (intent.module === 'payroll' && (intent.action === 'sync' || intent.action === 'push')) {
      steps.push(...this.getPayrollSyncSteps(intent));
    } else if (intent.module === 'expense' && (intent.action === 'sync' || intent.action === 'push')) {
      steps.push(...this.getExpenseSyncSteps(intent));
    } else if (intent.module === 'ngo' && (intent.action === 'sync' || intent.action === 'push')) {
      steps.push(...this.getNGOSyncSteps(intent));
    } else if (intent.module === 'accounting' && (intent.action === 'sync' || intent.action === 'push')) {
      steps.push(...this.getAccountingSyncSteps(intent));
    } else {
      // Generic view/export steps
      steps.push(...this.getGenericSteps(intent));
    }

    // Add confirmation step if required
    if (requiresConfirmation) {
      steps.push({
        id: 'confirm-action',
        order: steps.length + 1,
        type: 'confirm',
        description: 'Confirm the action before execution',
        target: 'confirmation-dialog',
        requiresConfirmation: true,
      });
    }

    // Calculate estimated duration (2-5 seconds per step)
    const estimatedDuration = steps.length * 3;

    return {
      intent,
      steps,
      estimatedDuration,
      requiresConfirmation,
      riskLevel,
    };
  }

  private static getPayrollSyncSteps(intent: ParsedIntent): ActionStep[] {
    const steps: ActionStep[] = [];

    // Step 1: Navigate to Payroll section
    steps.push({
      id: 'nav-payroll',
      order: 1,
      type: 'navigate',
      description: 'Open Payroll module from sidebar',
      target: '/payroll/transaction',
      highlight: {
        element: '[data-nav="payroll"]',
        message: 'Click here to open Payroll module',
      },
    });

    // Step 2: Wait for page to load after navigation (longer wait for React to render)
    steps.push({
      id: 'wait-page-load',
      order: 2,
      type: 'wait',
      description: 'Wait for Transaction Management page to load',
      target: '[data-field="financial-year"]',
    });

    // Step 3: Select Financial Year (only if we have a specific year, otherwise skip)
    if (intent.financialYear && intent.financialYear !== 'current') {
      steps.push({
        id: 'select-year',
        order: 3,
        type: 'select',
        description: `Select Financial Year: ${intent.financialYear}`,
        target: '[data-field="financial-year"]',
        value: intent.financialYear,
        highlight: {
          element: '[data-field="financial-year"]',
          message: 'Select the financial year from this dropdown',
        },
      });
      
      // Step 3.5: Wait for API to fetch pay periods after year selection
      steps.push({
        id: 'wait-periods-api',
        order: 3.5,
        type: 'wait',
        description: 'Wait for pay periods API to load after year selection',
        target: '[data-field="pay-period"]',
      });
    } else {
      // For 'current' year, we'll let the user select manually or skip this step
      steps.push({
        id: 'select-year',
        order: 3,
        type: 'wait',
        description: 'Financial year will be selected manually (current year)',
        target: '[data-field="financial-year"]',
      });
    }

    // Step 4: Wait for periods dropdown to be populated with options
    steps.push({
      id: 'wait-periods-load',
      order: 4,
      type: 'wait',
      description: 'Wait for pay periods dropdown to be populated with options',
      target: '[data-field="pay-period"]',
    });

    // Step 5: Select Pay Period
    if (intent.period) {
      steps.push({
        id: 'select-period',
        order: 5,
        type: 'select',
        description: `Select Pay Period: ${intent.period}`,
        target: '[data-field="pay-period"]',
        value: intent.period,
        highlight: {
          element: '[data-field="pay-period"]',
          message: 'Select the pay period from this dropdown',
        },
      });
    }

    // Step 6: Wait for data load
    steps.push({
      id: 'wait-data',
      order: 6,
      type: 'wait',
      description: 'Wait for payroll data to load',
      target: '.table', // Wait for table to appear
    });

    // Step 7: Click Next to go to Step 2 (Preview)
    steps.push({
      id: 'click-next-step2',
      order: 7,
      type: 'click',
      description: 'Click Next to proceed to Preview step',
      target: '[data-step="next"]',
      highlight: {
        element: '[data-step="next"]',
        message: 'Click Next to proceed to Preview step',
      },
    });

    // Step 8: Wait for Step 2 to load
    steps.push({
      id: 'wait-step2',
      order: 8,
      type: 'wait',
      description: 'Wait for Preview step to load',
      target: '[data-step="2"]',
    });

    // Step 9: Click Next to go to Step 3 (Push & Sync)
    steps.push({
      id: 'click-next-step3',
      order: 9,
      type: 'click',
      description: 'Click Next to proceed to Push & Sync step',
      target: '[data-step="next"]',
      highlight: {
        element: '[data-step="next"]',
        message: 'Click Next to proceed to Push & Sync step',
      },
    });

    // Step 10: Wait for Step 3 to load
    steps.push({
      id: 'wait-step3',
      order: 10,
      type: 'wait',
      description: 'Wait for Push & Sync step to load',
      target: '[data-step="3"]',
    });

    // Step 11: Execute sync
    steps.push({
      id: 'execute-sync',
      order: 11,
      type: 'click',
      description: `Push payroll records to ${intent.targetSystem || 'Tally'}`,
      target: '[data-action="push-to-tally"]',
      requiresConfirmation: true,
      highlight: {
        element: '[data-action="push-to-tally"]',
        message: 'Click here to start the sync process',
      },
    });

    return steps;
  }

  private static getExpenseSyncSteps(intent: ParsedIntent): ActionStep[] {
    const steps: ActionStep[] = [];

    steps.push({
      id: 'nav-expense',
      order: 1,
      type: 'navigate',
      description: 'Open Expenses module',
      target: '/expenses',
      highlight: {
        element: '[data-nav="expenses"]',
        message: 'Click here to open Expenses module',
      },
    });

    // Add expense-specific steps
    steps.push({
      id: 'select-expense-period',
      order: 2,
      type: 'select',
      description: `Select Period: ${intent.period || 'Current Period'}`,
      target: '[data-field="expense-period"]',
      value: intent.period,
    });

    return steps;
  }

  private static getNGOSyncSteps(intent: ParsedIntent): ActionStep[] {
    const steps: ActionStep[] = [];

    steps.push({
      id: 'nav-ngo',
      order: 1,
      type: 'navigate',
      description: 'Open NGO/Grants module',
      target: '/ngo',
      highlight: {
        element: '[data-nav="ngo"]',
        message: 'Click here to open NGO/Grants module',
      },
    });

    return steps;
  }

  private static getAccountingSyncSteps(intent: ParsedIntent): ActionStep[] {
    const steps: ActionStep[] = [];

    steps.push({
      id: 'nav-accounting',
      order: 1,
      type: 'navigate',
      description: 'Open Accounting module',
      target: '/accounting',
      highlight: {
        element: '[data-nav="accounting"]',
        message: 'Click here to open Accounting module',
      },
    });

    return steps;
  }

  private static getGenericSteps(intent: ParsedIntent): ActionStep[] {
    const steps: ActionStep[] = [];

    // Generic navigation based on module
    if (intent.module) {
      const routeMap: Record<string, string> = {
        payroll: '/payroll/transaction',
        expense: '/expenses',
        ngo: '/ngo',
        accounting: '/accounting',
      };

      steps.push({
        id: `nav-${intent.module}`,
        order: 1,
        type: 'navigate',
        description: `Navigate to ${intent.module} module`,
        target: routeMap[intent.module] || '/',
      });
    }

    return steps;
  }
}

export default ActionPlanner;

