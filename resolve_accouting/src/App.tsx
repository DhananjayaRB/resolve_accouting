import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';
import DashboardPage from './components/dashboard/DashboardPage';
import LedgersPage from './components/ledgers/LedgersPage';
import MappingPage from './components/mapping/MappingPage';
import MapBankPage from './components/mapping/MapBankPage';
import MapEmpPage from './components/mapping/MapEmpPage';
import MapForTally from './components/mapping/MapForTally';
import ReportsPage from './components/reports/ReportsPage';
import ConfigurationPage from './components/configuration/ConfigurationPage';
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
            <Route path="ledgers" element={<LedgersPage />} />
            <Route path="mapping" element={<MappingPage />} />
            <Route path="bank-mapping" element={<MapBankPage />} />
            <Route path="employee-mapping" element={<MapEmpPage />} />
            <Route path="transaction" element={<MapForTally />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="configuration" element={<ConfigurationPage />} />
          </Route>
        </Routes>
      </Router>
      <Toaster position="top-right" />
    </AppProvider>
  );
}

export default App;