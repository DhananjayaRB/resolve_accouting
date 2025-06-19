import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Link2,
  FileSpreadsheet,
  Settings,
  Menu,
  X,
  DollarSign,
  Home,
  Link,
  Banknote,
  Users,
  FileText,
} from 'lucide-react';

const Sidebar: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  const navItems = [
    { name: 'Dashboard', to: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Ledger Heads', to: '/ledgers', icon: <BookOpen size={20} /> },
    { name: 'Payroll Mapping', to: '/mapping', icon: <Link2 size={20} /> },
    { name: 'Bank A/c Mapping', to: '/bank-mapping', icon: <Banknote size={20} /> },
    { name: 'Employee Mapping', to: '/employee-mapping', icon: <Users size={20} /> },
    { name: 'Transaction', to: '/transaction', icon: <DollarSign size={20} /> },
    { name: 'Reports', to: '/reports', icon: <FileSpreadsheet size={20} /> },
    {
      name: 'Configuration',
      to: '/configuration',
      icon: <Settings size={20} />,
    },
  ];

  const sidebarClasses = `${
    isCollapsed ? 'w-20' : 'w-64'
  } bg-primary-950 text-white fixed h-full transition-all duration-300 ease-in-out z-20 ${
    isMobileOpen ? 'translate-x-0' : '-translate-x-full'
  } md:translate-x-0`;

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none"
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

      <aside className={sidebarClasses}>
        <div className="flex flex-col h-full">
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } p-4 border-b border-primary-800`}
          >
            {!isCollapsed && (
              <div className="flex items-center">
                <span className="text-accent-400 text-2xl">₹</span>
                <span className="ml-2 font-semibold text-lg text-white">
                  Resolve Pay
                </span>
              </div>
            )}
            {isCollapsed && <span className="text-accent-400 text-2xl">₹</span>}
            <button
              className="text-gray-300 hover:text-white hidden md:block"
              onClick={toggleSidebar}
            >
              <Menu size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <NavLink
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center p-2 rounded-md transition-colors duration-200 ${
                        isActive
                          ? 'bg-primary-800 text-white'
                          : 'text-gray-300 hover:bg-primary-900 hover:text-white'
                      } ${isCollapsed ? 'justify-center' : ''}`
                    }
                  >
                    <div>{item.icon}</div>
                    {!isCollapsed && <span className="ml-3">{item.name}</span>}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-4 border-t border-primary-800">
            <div
              className={`flex items-center ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="bg-primary-800 p-2 rounded-full">
                <Settings
                  size={isCollapsed ? 20 : 16}
                  className="text-gray-300"
                />
              </div>
              {!isCollapsed && (
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">
                    Accounting Module
                  </p>
                  <p className="text-xs text-gray-400">v0.1.0</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Spacer to push content away from sidebar */}
      <div
        className={`${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        } transition-all duration-300`}
      />
    </>
  );
};

export default Sidebar;
