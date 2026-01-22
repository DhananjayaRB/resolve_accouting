import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './components/dashboard/DashboardPage';
import LedgersPage from './components/ledgers/LedgersPage';
import MappingPage from './components/mapping/MappingPage';
import MapBankPage from './components/mapping/MapBankPage';
import MapEmpPage from './components/mapping/MapEmpPage';
import ExpenseMappingPage from './components/mapping/ExpenseMappingPage';
import MapForTally from './components/mapping/MapForTally';
import ReportsPage from './components/reports/ReportsPage';
import ConfigurationPage from './components/configuration/ConfigurationPage';
import TallyConfigPage from './components/configuration/TallyConfigPage';
import ComingSoon from './components/common/ComingSoon';
import OracleConnectionPage from './components/oracle/OracleConnectionPage';
import OracleMappingPage from './components/oracle/OracleMappingPage';
import OracleLogsPage from './components/oracle/OracleLogsPage';
import SAPIntegrationPage from './components/erp/SAPIntegrationPage';
import CustomAPIPage from './components/erp/CustomAPIPage';
import ZohoIntegrationPage from './components/integrations/ZohoIntegrationPage';
import ZohoConnectionPage from './components/integrations/ZohoConnectionPage';
import ZohoMappingPage from './components/integrations/ZohoMappingPage';
import ZohoLogsPage from './components/integrations/ZohoLogsPage';
import DarwinBoxIntegrationPage from './components/integrations/DarwinBoxIntegrationPage';
import DarwinBoxConnectionPage from './components/integrations/DarwinBoxConnectionPage';
import DarwinBoxMappingPage from './components/integrations/DarwinBoxMappingPage';
import DarwinBoxLogsPage from './components/integrations/DarwinBoxLogsPage';
import SAPConnectionPage from './components/integrations/SAPConnectionPage';
import SAPMappingPage from './components/integrations/SAPMappingPage';
import SAPLogsPage from './components/integrations/SAPLogsPage';
import PayrollSyncStatusPage from './components/payroll/PayrollSyncStatusPage';
import ExpenseCategoriesPage from './components/expenses/ExpenseCategoriesPage';
import ExpenseApprovalPage from './components/expenses/ExpenseApprovalPage';
import ExpenseSyncLogsPage from './components/expenses/ExpenseSyncLogsPage';
import { FundMappingPage, DonorLedgersPage, UtilizationReportsPage, ComplianceExportPage } from './components/ngo/NGOPages';
import { JournalsPage, TrialBalancePage } from './components/accounting/AccountingPages';
import { SyncSummaryPage, ErrorReportsPage, AuditLogsPage, ExportReportsPage } from './components/reports/ReportsPages';
import { OrganizationSettingsPage, UsersRolesPage, PermissionsPage, NotificationsPage, APIKeysPage, UIPreferencesPage } from './components/settings/SettingsPages';
import { Toaster } from 'react-hot-toast';
import { storeTokenFromUrl } from './utils/auth';

function App() {
  useEffect(() => {
    // Store token from URL if present
    storeTokenFromUrl();
  }, []);

  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            
            {/* Integrations - Tally */}
            <Route path="tally-config" element={<TallyConfigPage />} />
            <Route path="ledgers" element={<LedgersPage />} />
            
            {/* Integrations - Oracle */}
            <Route path="oracle/connection" element={<OracleConnectionPage />} />
            <Route path="oracle/mapping" element={<OracleMappingPage />} />
            <Route path="oracle/logs" element={<OracleLogsPage />} />
            
            {/* Integrations - Zoho */}
            <Route path="zoho/connection" element={<ZohoConnectionPage />} />
            <Route path="zoho/mapping" element={<ZohoMappingPage />} />
            <Route path="zoho/logs" element={<ZohoLogsPage />} />
            
            {/* Integrations - DarwinBox */}
            <Route path="darwinbox/connection" element={<DarwinBoxConnectionPage />} />
            <Route path="darwinbox/mapping" element={<DarwinBoxMappingPage />} />
            <Route path="darwinbox/logs" element={<DarwinBoxLogsPage />} />
            
            {/* Integrations - SAP */}
            <Route path="sap/connection" element={<SAPConnectionPage />} />
            <Route path="sap/mapping" element={<SAPMappingPage />} />
            <Route path="sap/logs" element={<SAPLogsPage />} />
            
            {/* Integrations - Other ERPs */}
            <Route path="erp/sap" element={<SAPIntegrationPage />} />
            <Route path="erp/custom" element={<CustomAPIPage />} />
            
            {/* Payroll */}
            <Route path="mapping" element={<MappingPage />} />
            <Route path="employee-mapping" element={<MapEmpPage />} />
            <Route path="payroll/sync-status" element={<PayrollSyncStatusPage />} />
            
            {/* Expenses */}
            <Route path="expenses/categories" element={<ExpenseCategoriesPage />} />
            <Route path="expense-mapping" element={<ExpenseMappingPage />} />
            <Route path="expenses/approval" element={<ExpenseApprovalPage />} />
            <Route path="expenses/logs" element={<ExpenseSyncLogsPage />} />
            
            {/* NGO / Grants */}
            <Route path="ngo/fund-mapping" element={<FundMappingPage />} />
            <Route path="ngo/donor-ledgers" element={<DonorLedgersPage />} />
            <Route path="ngo/utilization" element={<UtilizationReportsPage />} />
            <Route path="ngo/compliance" element={<ComplianceExportPage />} />
            
            {/* Payroll - Transaction Management */}
            <Route path="payroll/transaction" element={<MapForTally />} />
            {/* Accounting */}
            <Route path="transaction" element={<MapForTally />} />
            <Route path="accounting/journals" element={<JournalsPage />} />
            <Route path="accounting/trial-balance" element={<TrialBalancePage />} />
            
            {/* Reports */}
            <Route path="reports" element={<ReportsPage />} />
            <Route path="reports/sync-summary" element={<SyncSummaryPage />} />
            <Route path="reports/errors" element={<ErrorReportsPage />} />
            <Route path="reports/audit" element={<AuditLogsPage />} />
            
            {/* Settings */}
            <Route path="settings/organization" element={<OrganizationSettingsPage />} />
            <Route path="settings/users" element={<UsersRolesPage />} />
            <Route path="settings/permissions" element={<PermissionsPage />} />
            <Route path="settings/notifications" element={<NotificationsPage />} />
            <Route path="settings/ui-preferences" element={<UIPreferencesPage />} />
            <Route path="settings/api-keys" element={<APIKeysPage />} />
            
            {/* Legacy routes for backward compatibility */}
            <Route path="configuration" element={<ConfigurationPage />} />
            <Route path="bank-mapping" element={<MapBankPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AppProvider>
  );
}

export default App;