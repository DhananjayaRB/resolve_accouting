import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  Settings,
  Link2,
  BookOpen,
  FileSpreadsheet,
  DollarSign,
  FileText,
  Users,
  Database,
  Building2,
  Receipt,
  HeartHandshake,
  BarChart3,
  Shield,
  Key,
  Bell,
  UserCog,
  FolderTree,
  RefreshCw,
  FileCheck,
  AlertCircle,
  Download,
  Plug,
  Server,
  Code,
  Wallet,
  TrendingUp,
  FileBarChart,
  CheckCircle2,
  XCircle,
  Monitor,
  User,
} from 'lucide-react';
import { getStoredUserInfo } from '../../utils/auth';

interface MenuItem {
  name: string;
  to?: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  badge?: string;
}

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['integrations', 'payroll', 'expenses', 'accounting', 'reports', 'settings'])
  );
  const location = useLocation();

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const menuStructure: MenuItem[] = [
    {
      name: 'Dashboard',
      to: '/',
      icon: <LayoutDashboard size={20} />,
    },
    {
      name: 'Integrations',
      icon: <Link2 size={20} />,
      children: [
        {
          name: 'Tally',
          icon: <Plug size={18} />,
          children: [
            { name: 'Tally Profiles', to: '/tally-config', icon: <Server size={16} /> },
            { name: 'Ledgers', to: '/ledgers', icon: <BookOpen size={16} /> },
            { name: 'Sync Settings', to: '/tally-config', icon: <Settings size={16} /> },
            { name: 'Sync Logs', to: '/reports', icon: <FileBarChart size={16} /> },
          ],
        },
        {
          name: 'Oracle',
          icon: <Database size={18} />,
          children: [
            { name: 'Connection Setup', to: '/oracle/connection', icon: <Plug size={16} /> },
            { name: 'Data Mapping', to: '/oracle/mapping', icon: <FolderTree size={16} /> },
            { name: 'Sync Logs', to: '/oracle/logs', icon: <FileBarChart size={16} /> },
          ],
        },
        {
          name: 'Other ERPs',
          icon: <Building2 size={18} />,
          children: [
            { name: 'SAP', to: '/erp/sap', icon: <Server size={16} /> },
            { name: 'Custom API', to: '/erp/custom', icon: <Code size={16} /> },
          ],
        },
      ],
    },
    {
      name: 'Payroll',
      icon: <Wallet size={20} />,
      children: [
        { name: 'Payroll Mapping', to: '/mapping', icon: <Link2 size={16} /> },
        // { name: 'Employee Mapping', to: '/employee-mapping', icon: <Users size={16} /> }, // Hidden per user request
        { name: 'Transaction Management', to: '/transaction', icon: <DollarSign size={16} /> },
        { name: 'Payroll Sync Status', to: '/payroll/sync-status', icon: <CheckCircle2 size={16} /> },
      ],
    },
    {
      name: 'Expenses',
      icon: <Receipt size={20} />,
      children: [
        { name: 'Expense Categories', to: '/expenses/categories', icon: <FolderTree size={16} /> },
        { name: 'Expense Mapping', to: '/expense-mapping', icon: <Link2 size={16} /> },
        { name: 'Approval Status', to: '/expenses/approval', icon: <FileCheck size={16} /> },
        { name: 'Expense Sync Logs', to: '/expenses/logs', icon: <FileBarChart size={16} /> },
      ],
    },
    {
      name: 'NGO / Grants',
      icon: <HeartHandshake size={20} />,
      children: [
        { name: 'Fund Mapping', to: '/ngo/fund-mapping', icon: <Link2 size={16} /> },
        { name: 'Donor Ledgers', to: '/ngo/donor-ledgers', icon: <BookOpen size={16} /> },
        { name: 'Utilization Reports', to: '/ngo/utilization', icon: <BarChart3 size={16} /> },
        { name: 'Compliance Export', to: '/ngo/compliance', icon: <Download size={16} /> },
      ],
    },
    {
      name: 'Accounting',
      icon: <BookOpen size={20} />,
      children: [
        { name: 'Ledger Heads', to: '/ledgers', icon: <BookOpen size={16} /> },
        { name: 'Journals', to: '/accounting/journals', icon: <FileText size={16} /> },
        { name: 'Trial Balance', to: '/accounting/trial-balance', icon: <BarChart3 size={16} /> },
      ],
    },
    {
      name: 'Reports',
      icon: <FileSpreadsheet size={20} />,
      children: [
        { name: 'Sync Summary', to: '/reports/sync-summary', icon: <BarChart3 size={16} /> },
        { name: 'Error Reports', to: '/reports/errors', icon: <AlertCircle size={16} /> },
        { name: 'Audit Logs', to: '/reports/audit', icon: <FileBarChart size={16} /> },
        { name: 'Export Reports', to: '/reports', icon: <Download size={16} /> },
      ],
    },
    {
      name: 'Settings',
      icon: <Settings size={20} />,
      children: [
        { name: 'Organization', to: '/settings/organization', icon: <Building2 size={16} /> },
        { name: 'Users & Roles', to: '/settings/users', icon: <UserCog size={16} /> },
        { name: 'Permissions', to: '/settings/permissions', icon: <Shield size={16} /> },
        { name: 'Notifications', to: '/settings/notifications', icon: <Bell size={16} /> },
        { name: 'UI Preferences', to: '/settings/ui-preferences', icon: <Monitor size={16} /> },
        { name: 'API Keys', to: '/settings/api-keys', icon: <Key size={16} /> },
      ],
    },
  ];

  const isRouteActive = (path?: string): boolean => {
    if (!path) return false;
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const hasActiveChild = (item: MenuItem): boolean => {
    if (item.to && isRouteActive(item.to)) return true;
    if (item.children) {
      return item.children.some((child) => hasActiveChild(child));
    }
    return false;
  };

  const renderMenuItem = (item: MenuItem, level: number = 0, parentKey?: string): React.ReactNode => {
    const key = parentKey ? `${parentKey}-${item.name}` : item.name.toLowerCase().replace(/\s+/g, '-');
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.has(key);
    const isActive = item.to ? isRouteActive(item.to) : false;
    const hasActive = hasActiveChild(item);

    if (level === 0) {
      // Top-level items
      if (hasChildren) {
        return (
          <li key={key}>
            <button
              onClick={() => toggleSection(key)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 ${
                hasActive
                  ? 'bg-secondary-500/20 text-white shadow-sm'
                  : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className="flex items-center">
                <div className="opacity-80">{item.icon}</div>
                {!isCollapsed && <span className="ml-3 text-sm font-light">{item.name}</span>}
              </div>
              {!isCollapsed && (
                <div className="ml-auto">
                  {isExpanded ? (
                    <ChevronDown size={14} className="text-gray-400" />
                  ) : (
                    <ChevronRight size={14} className="text-gray-400" />
                  )}
                </div>
              )}
            </button>
            {!isCollapsed && isExpanded && (
              <ul className="mt-1 ml-3 space-y-0.5 border-l border-gray-700/50 pl-3">
                {item.children?.map((child) => renderMenuItem(child, level + 1, key))}
              </ul>
            )}
          </li>
        );
      } else {
        // Top-level item without children
        return (
          <li key={key}>
            <NavLink
              to={item.to || '#'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-secondary-500 text-white shadow-sm'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
            >
              <div className="opacity-80">{item.icon}</div>
              {!isCollapsed && <span className="ml-3 text-sm font-light">{item.name}</span>}
            </NavLink>
          </li>
        );
      }
    } else if (level === 1) {
      // Second-level items (like "Tally", "Oracle", etc.)
      if (hasChildren) {
        return (
          <li key={key}>
            <button
              onClick={() => toggleSection(key)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
                hasActive
                  ? 'bg-secondary-500/10 text-white'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <div className="flex items-center">
                <div className="opacity-70">{item.icon}</div>
                <span className="ml-2 text-sm font-light">{item.name}</span>
              </div>
              {isExpanded ? (
                <ChevronDown size={12} className="text-gray-500" />
              ) : (
                <ChevronRight size={12} className="text-gray-500" />
              )}
            </button>
            {isExpanded && (
              <ul className="mt-1 ml-3 space-y-0.5 border-l border-gray-700/50 pl-3">
                {item.children?.map((child) => renderMenuItem(child, level + 1, key))}
              </ul>
            )}
          </li>
        );
      } else {
        return (
          <li key={key}>
            <NavLink
              to={item.to || '#'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-secondary-500 text-white shadow-sm'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
                }`
              }
            >
              <div className="opacity-70">{item.icon}</div>
              <span className="ml-2 text-sm font-light">{item.name}</span>
            </NavLink>
          </li>
        );
      }
    } else {
      // Third-level items (leaf nodes)
      return (
        <li key={key}>
          <NavLink
            to={item.to || '#'}
            className={({ isActive }) =>
              `flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-secondary-500 text-white shadow-sm'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`
            }
          >
            <div className="opacity-70">{item.icon}</div>
            <span className="ml-2 text-sm font-light">{item.name}</span>
            {item.badge && (
              <span className="ml-auto text-xs bg-secondary-500 text-white px-1.5 py-0.5 rounded font-light">
                {item.badge}
              </span>
            )}
          </NavLink>
        </li>
      );
    }
  };

  const userInfo = getStoredUserInfo();
  const userName = userInfo.role_name || 'Admin User';
  const userId = userInfo.user_id || '1001';

  const sidebarClasses = `${
    isCollapsed ? 'w-20' : 'w-72'
  } text-white fixed h-full transition-all duration-300 ease-in-out z-20 shadow-2xl ${
    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
  } md:translate-x-0`;
  const sidebarStyle = { 
    backgroundColor: '#0A1A33',
    background: 'linear-gradient(180deg, #0A1A33 0%, #081429 100%)'
  }; // MProfit Navy with gradient

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none bg-white shadow-md"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      <aside className={sidebarClasses} style={sidebarStyle}>
        <div className="flex flex-col h-full">
          {/* Header with Logo */}
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } p-5 border-b border-gray-700/50`}
          >
            {!isCollapsed && (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-secondary-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-lg font-light">₹</span>
                </div>
                <div className="ml-3">
                  <div className="text-white text-lg font-light tracking-wide">Resolve Pay</div>
                  <div className="text-gray-400 text-xs font-light">Accounting Module</div>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-8 h-8 bg-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-light">₹</span>
              </div>
            )}
            <button
              className="text-gray-400 hover:text-white hidden md:block transition-colors"
              onClick={toggleSidebar}
            >
              <Menu size={18} />
            </button>
          </div>

          {/* User Info Section */}
          {!isCollapsed && (
            <div className="px-5 py-4 bg-secondary-500/10 border-b border-gray-700/30">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-secondary-500/20 rounded-full flex items-center justify-center border border-secondary-500/30">
                  <User size={18} className="text-secondary-400" />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                  <div className="text-white text-sm font-light truncate">{userName}</div>
                  <div className="text-gray-400 text-xs font-light">ID: {userId}</div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto custom-scrollbar">
            <ul className="space-y-0.5">
              {menuStructure.map((item) => renderMenuItem(item))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700/50">
            {!isCollapsed && (
              <div className="text-gray-400 text-xs font-light text-center">
                Accounting Module v0.1.0
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Spacer to push content away from sidebar */}
      <div
        className={`${
          isCollapsed ? 'md:ml-20' : 'md:ml-72'
        } transition-all duration-300`}
      />
    </>
  );
};

export default Sidebar;
