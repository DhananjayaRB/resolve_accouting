// Ledger Types
export type LedgerCategory = 'Asset' | 'Liability' | 'Expense' | 'Income';

export interface LedgerHead {
  id: string;
  name: string;
  code?: string; // Optional accounting code
  category: LedgerCategory;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  financialYear?: string; // For tracking year-specific ledgers
}

// Payroll Types
export type PayrollItemType = 'Earning' | 'Deduction' | 'Asset' | 'Liability';

export interface PayrollItem {
  id: string;
  name: string;
  type: PayrollItemType;
  description?: string;
}

// Mapping Types
export interface PayrollMapping {
  id: string;
  payrollItemId: string;
  payrollItemName: string;
  ledgerHeadId: string;
  ledgerHeadName: string;
  financialYear: string;
  createdAt: string;
  updatedAt: string;
}

// Report Types
export type ReportFormat = 'Excel' | 'TallyXML';
export type ReportDetailLevel = 'Detailed' | 'Summary';

export interface ReportConfiguration {
  id: string;
  name: string;
  format: ReportFormat;
  detailLevel: ReportDetailLevel;
  includeInactive: boolean;
  filters?: {
    dateRange?: {
      startDate: string;
      endDate: string;
    };
    payrollItems?: string[]; // IDs of payroll items to include
    ledgerHeads?: string[]; // IDs of ledger heads to include
  };
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  ledgerId: string;
  ledgerName: string;
  description: string;
  debit?: number;
  credit?: number;
  reference?: string;
}

export interface PayrollJournal {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  entries: JournalEntry[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
  status: 'Draft' | 'Generated' | 'Exported';
}

export interface PayrollData {
  employee_name: string;
  emp_number: string;
  pay_value_data?: Array<{
    data_field_name: string;
    pay_value: string;
    pay_head_name: string;
    is_pay_head: string;
    is_total: string | null;
  }>;
  [key: string]: any;
}

export interface PayrollHeader {
  text: string;
  dataField: string;
  is_pay_head: string | null;
  is_total: string | null;
  pay_category_id: string | null;
  sequence_number: number;
  pay_group_id: string | null;
  main_title: string;
  sub_header: string;
  footer: string;
  footerAlign: string;
  footerClasses: string;
  align: string;
  classes: string;
  dataType: string;
}