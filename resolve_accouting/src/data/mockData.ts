import { LedgerHead, PayrollItem, PayrollMapping, ReportConfiguration, PayrollJournal, JournalEntry } from '../types';

// Mock Ledger Heads
export const mockLedgerHeads: LedgerHead[] = [
  {
    id: '1',
    name: 'Salary Expense',
    code: 'EXP001',
    category: 'Expense',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Employee Salary Payable',
    code: 'LIA001',
    category: 'Liability',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Employee PF Payable',
    code: 'LIA002',
    category: 'Liability',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '4',
    name: 'TDS Payable',
    code: 'LIA003',
    category: 'Liability',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'Bank Account',
    code: 'AST001',
    category: 'Asset',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '6',
    name: 'Professional Tax Payable',
    code: 'LIA004',
    category: 'Liability',
    isActive: true,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '7',
    name: 'Bonus Expense',
    code: 'EXP002',
    category: 'Expense',
    isActive: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-02-15T00:00:00Z',
    financialYear: '2024-2025',
  },
];

// Mock Payroll Items
export const mockPayrollItems: PayrollItem[] = [
  {
    id: '1',
    name: 'Basic Salary',
    type: 'Earning',
    description: 'Base salary component',
  },
  {
    id: '2',
    name: 'House Rent Allowance',
    type: 'Earning',
    description: 'HRA component',
  },
  {
    id: '3',
    name: 'Special Allowance',
    type: 'Earning',
    description: 'Special allowance component',
  },
  {
    id: '4',
    name: 'Employee PF',
    type: 'Deduction',
    description: 'Employee contribution to PF',
  },
  {
    id: '5',
    name: 'Income Tax',
    type: 'Deduction',
    description: 'TDS deduction',
  },
  {
    id: '6',
    name: 'HDFC Bank',
    type: 'Asset',
    description: 'Bank account for salary disbursement',
  },
  {
    id: '7',
    name: 'Professional Tax',
    type: 'Deduction',
    description: 'Professional tax deduction',
  },
];

// Mock Payroll Mappings
export const mockPayrollMappings: PayrollMapping[] = [
  {
    id: '1',
    payrollItemId: '1', // Basic Salary
    ledgerHeadId: '1', // Salary Expense
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    payrollItemId: '2', // HRA
    ledgerHeadId: '1', // Salary Expense
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '3',
    payrollItemId: '3', // Special Allowance
    ledgerHeadId: '1', // Salary Expense
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '4',
    payrollItemId: '4', // Employee PF
    ledgerHeadId: '3', // Employee PF Payable
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '5',
    payrollItemId: '5', // Income Tax
    ledgerHeadId: '4', // TDS Payable
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '6',
    payrollItemId: '6', // HDFC Bank
    ledgerHeadId: '5', // Bank Account
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '7',
    payrollItemId: '7', // Professional Tax
    ledgerHeadId: '6', // Professional Tax Payable
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// Mock Report Configurations
export const mockReportConfigurations: ReportConfiguration[] = [
  {
    id: '1',
    name: 'Monthly Summary Journal',
    format: 'Excel',
    detailLevel: 'Summary',
    includeInactive: false,
    filters: {
      dateRange: {
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      },
    },
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Detailed Tally Export',
    format: 'TallyXML',
    detailLevel: 'Detailed',
    includeInactive: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
];

// Mock Journal Entries
export const mockJournalEntries: JournalEntry[] = [
  {
    id: '1',
    date: '2025-01-31',
    ledgerId: '1',
    ledgerName: 'Salary Expense',
    description: 'Basic Salary for Jan 2025',
    debit: 2500000,
    reference: 'JAN2025-BASIC',
  },
  {
    id: '2',
    date: '2025-01-31',
    ledgerId: '1',
    ledgerName: 'Salary Expense',
    description: 'HRA for Jan 2025',
    debit: 1000000,
    reference: 'JAN2025-HRA',
  },
  {
    id: '3',
    date: '2025-01-31',
    ledgerId: '1',
    ledgerName: 'Salary Expense',
    description: 'Special Allowance for Jan 2025',
    debit: 750000,
    reference: 'JAN2025-SA',
  },
  {
    id: '4',
    date: '2025-01-31',
    ledgerId: '3',
    ledgerName: 'Employee PF Payable',
    description: 'Employee PF for Jan 2025',
    credit: 300000,
    reference: 'JAN2025-PF',
  },
  {
    id: '5',
    date: '2025-01-31',
    ledgerId: '4',
    ledgerName: 'TDS Payable',
    description: 'TDS for Jan 2025',
    credit: 400000,
    reference: 'JAN2025-TDS',
  },
  {
    id: '6',
    date: '2025-01-31',
    ledgerId: '6',
    ledgerName: 'Professional Tax Payable',
    description: 'Professional Tax for Jan 2025',
    credit: 50000,
    reference: 'JAN2025-PT',
  },
  {
    id: '7',
    date: '2025-01-31',
    ledgerId: '5',
    ledgerName: 'Bank Account',
    description: 'Net Salary for Jan 2025',
    credit: 3500000,
    reference: 'JAN2025-NET',
  },
];

// Mock Payroll Journals
export const mockPayrollJournals: PayrollJournal[] = [
  {
    id: '1',
    name: 'January 2025 Payroll Journal',
    periodStart: '2025-01-01',
    periodEnd: '2025-01-31',
    entries: mockJournalEntries,
    totalDebit: 4250000,
    totalCredit: 4250000,
    createdAt: '2025-01-31T00:00:00Z',
    status: 'Generated',
  }
];