import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  Search, 
  Filter, 
  Download,
  RefreshCw,
  FolderTree,
  BookOpen,
  Layers,
  FileText
} from 'lucide-react';
import { getStoredUserInfo } from '../../utils/auth';
import toast from 'react-hot-toast';
import InfoIcon from '../common/InfoIcon';
import Loader from '../common/Loader';
import * as XLSX from 'xlsx-js-style';
import { createStyledWorksheet } from '../../utils/excelStyles';

interface TreeNode {
  id: string;
  type: 'category' | 'subgroup' | 'ledger';
  name: string;
  code?: string | null;
  alias?: string | null;
  category?: string;
  group_type?: string | null;
  parent_group?: string | null;
  is_active?: boolean;
  financial_year?: string | null;
  children: TreeNode[];
}

interface ChartOfAccountsData {
  success: boolean;
  data: TreeNode[];
  counts: {
    categories: number;
    subGroups: number;
    ledgers: number;
  };
}

const ChartOfAccountsPage: React.FC = () => {
  // Force render test - this should always show
  console.log('ChartOfAccountsPage: Component function called');
  
  const [data, setData] = useState<TreeNode[]>([]);
  const [filteredData, setFilteredData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterGroup, setFilterGroup] = useState<string>('All');
  const [filterSubGroup, setFilterSubGroup] = useState<string>('All');
  const [filterName, setFilterName] = useState<string>('All');
  
  // Add render error state
  const [renderError, setRenderError] = useState<string | null>(null);

  // Debug: Log component mount
  useEffect(() => {
    console.log('ChartOfAccountsPage component mounted');
    return () => {
      console.log('ChartOfAccountsPage component unmounted');
    };
  }, []);

  useEffect(() => {
    fetchChartOfAccounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [data, searchTerm, filterCategory, filterGroup, filterSubGroup, filterName]);

  const fetchChartOfAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const { org_id } = getStoredUserInfo();
      if (!org_id) {
        const errorMsg = 'Organization ID is required';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = import.meta.env.VITE_API_PORT || '3001';
      const apiUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
        ? `${protocol}//${hostname}:${port}/api/tally/chart-of-accounts`
        : `http://localhost:${port}/api/tally/chart-of-accounts`;

      console.log('Fetching chart of accounts from:', `${apiUrl}?org_id=${org_id}`);

      const response = await fetch(`${apiUrl}?org_id=${org_id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Org-Id': org_id
        },
        cache: 'no-cache' // Force fresh data
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        const errorMsg = `Failed to fetch chart of accounts: ${response.status}`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }

      const result: ChartOfAccountsData = await response.json();
      console.log('Chart of accounts data:', result);
      
      if (result && result.success !== false) {
        const accountsData = result.data || result || [];
        const safeData = Array.isArray(accountsData) ? accountsData : [];
        
        // Validate and clean data structure
        const validatedData = safeData.filter(node => {
          return node && typeof node === 'object' && node.id && node.name;
        }).map(node => ({
          ...node,
          children: Array.isArray(node.children) ? node.children : []
        }));
        
        setData(validatedData);
        
        // Expand all by default
        const allIds = new Set<string>();
        const collectIds = (nodes: TreeNode[]) => {
          if (!Array.isArray(nodes)) return;
          nodes.forEach(node => {
            if (node && node.id && typeof node.id === 'string') {
              allIds.add(node.id);
              if (node.children && Array.isArray(node.children) && node.children.length > 0) {
                collectIds(node.children);
              }
            }
          });
        };
        collectIds(validatedData);
        setExpandedNodes(allIds);
        setError(null);
      } else {
        console.warn('API returned unsuccessful response:', result);
        setData([]);
        setError(result?.error || result?.details || 'Failed to load chart of accounts');
      }
    } catch (error: any) {
      console.error('Error fetching chart of accounts:', error);
      const errorMsg = error.message || 'Unknown error';
      setError(errorMsg);
      toast.error(`Failed to fetch chart of accounts: ${errorMsg}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const applyFilters = () => {
    let filtered = [...data];

    // Filter by search term
    if (searchTerm) {
      filtered = filterTreeBySearch(filtered, searchTerm.toLowerCase());
    }

    // Filter by category
    if (filterCategory !== 'All') {
      filtered = filterTreeByCategory(filtered, filterCategory);
    }

    // Filter by group
    if (filterGroup !== 'All') {
      filtered = filterTreeByGroup(filtered, filterGroup);
    }

    // Filter by sub-group
    if (filterSubGroup !== 'All') {
      filtered = filterTreeBySubGroup(filtered, filterSubGroup);
    }

    // Filter by name
    if (filterName !== 'All') {
      filtered = filterTreeByName(filtered, filterName);
    }

    setFilteredData(filtered);
  };

  const filterTreeBySearch = (nodes: TreeNode[], term: string): TreeNode[] => {
    return nodes
      .map(node => {
        const matches = 
          node.name.toLowerCase().includes(term) ||
          (node.code && node.code.toLowerCase().includes(term)) ||
          (node.alias && node.alias.toLowerCase().includes(term));
        
        const filteredChildren = filterTreeBySearch(node.children, term);
        
        if (matches || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter((node): node is TreeNode => node !== null);
  };

  const filterTreeByCategory = (nodes: TreeNode[], category: string): TreeNode[] => {
    return nodes
      .map(node => {
        const matches = node.type === 'ledger' && node.category === category;
        const filteredChildren = filterTreeByCategory(node.children, category);
        
        if (matches || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter((node): node is TreeNode => node !== null);
  };

  const filterTreeByGroup = (nodes: TreeNode[], group: string): TreeNode[] => {
    return nodes
      .map(node => {
        const matches = node.type === 'category' && node.name === group;
        const filteredChildren = filterTreeByGroup(node.children, group);
        
        if (matches || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter((node): node is TreeNode => node !== null);
  };

  const filterTreeBySubGroup = (nodes: TreeNode[], subGroup: string): TreeNode[] => {
    return nodes
      .map(node => {
        const matches = node.type === 'subgroup' && node.name === subGroup;
        const filteredChildren = filterTreeBySubGroup(node.children, subGroup);
        
        if (matches || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter((node): node is TreeNode => node !== null);
  };

  const filterTreeByName = (nodes: TreeNode[], name: string): TreeNode[] => {
    return nodes
      .map(node => {
        const matches = node.name === name;
        const filteredChildren = filterTreeByName(node.children, name);
        
        if (matches || filteredChildren.length > 0) {
          return { ...node, children: filteredChildren };
        }
        return null;
      })
      .filter((node): node is TreeNode => node !== null);
  };

  // Get unique values for filters
  const getAllCategories = (nodes: TreeNode[]): string[] => {
    const categories = new Set<string>();
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'ledger' && node.category) {
          categories.add(node.category);
        }
        traverse(node.children);
      });
    };
    traverse(nodes);
    return Array.from(categories).sort();
  };

  const getAllGroups = (nodes: TreeNode[]): string[] => {
    const groups = new Set<string>();
    nodes.forEach(node => {
      if (node.type === 'category') {
        groups.add(node.name);
      }
    });
    return Array.from(groups).sort();
  };

  const getAllSubGroups = (nodes: TreeNode[]): string[] => {
    const subGroups = new Set<string>();
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'subgroup') {
          subGroups.add(node.name);
        }
        traverse(node.children);
      });
    };
    traverse(nodes);
    return Array.from(subGroups).sort();
  };

  const getAllNames = (nodes: TreeNode[]): string[] => {
    const names = new Set<string>();
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        names.add(node.name);
        traverse(node.children);
      });
    };
    traverse(nodes);
    return Array.from(names).sort().slice(0, 100);
  };

  const handleDownloadExcel = () => {
    try {
      const exportData: any[] = [];
      
      const flattenTree = (nodes: TreeNode[], level = 0, parentPath = '') => {
        nodes.forEach(node => {
          const currentPath = parentPath ? `${parentPath} > ${node.name}` : node.name;
          
          exportData.push({
            'Level': level === 0 ? 'Category' : level === 1 ? 'Sub Group' : 'Ledger',
            'Name': node.name,
            'Code': node.code || '',
            'Category': node.category || '',
            'Group Type': node.group_type || '',
            'Parent Group': node.parent_group || '',
            'Status': node.is_active !== undefined ? (node.is_active ? 'Active' : 'Inactive') : '',
            'Financial Year': node.financial_year || '',
            'Full Path': currentPath
          });
          
          if (node.children.length > 0) {
            flattenTree(node.children, level + 1, currentPath);
          }
        });
      };
      
      flattenTree(filteredData);
      
      if (exportData.length === 0) {
        toast.error('No data to export');
        return;
      }

      const wb = XLSX.utils.book_new();
      const ws = createStyledWorksheet(exportData, 'Chart of Accounts', {
        columnWidths: [15, 30, 20, 15, 15, 20, 10, 15, 50],
        freezeHeader: true,
      });

      XLSX.utils.book_append_sheet(wb, ws, 'Chart of Accounts');
      
      const fileName = `chart_of_accounts_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      toast.success(`Exported ${exportData.length} items to Excel`);
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('Failed to export Excel file');
    }
  };

  const renderTreeNode = (node: TreeNode, level: number = 0): React.ReactNode => {
    if (!node || !node.id || !node.name) {
      console.warn('Invalid node in renderTreeNode:', node);
      return null;
    }
    
    try {
      const hasChildren = Array.isArray(node.children) && node.children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const indent = level * 24;

    let icon;
    let badgeColor;
    
    if (node.type === 'category') {
      icon = <Layers size={18} className="text-blue-600" />;
      badgeColor = 'bg-blue-100 text-blue-800';
    } else if (node.type === 'subgroup') {
      icon = <FolderTree size={18} className="text-green-600" />;
      badgeColor = 'bg-green-100 text-green-800';
    } else {
      icon = <BookOpen size={18} className="text-purple-600" />;
      if (node.category === 'Asset') badgeColor = 'bg-secondary-100 text-secondary-800';
      else if (node.category === 'Liability') badgeColor = 'bg-warning-100 text-warning-800';
      else if (node.category === 'Income') badgeColor = 'bg-green-100 text-green-800';
      else badgeColor = 'bg-error-100 text-error-800';
    }

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-2 px-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 ${
            level === 0 ? 'bg-gray-50 font-semibold' : ''
          }`}
          style={{ paddingLeft: `${12 + indent}px` }}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasChildren ? (
              <button className="flex-shrink-0">
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-500" />
                ) : (
                  <ChevronRight size={16} className="text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}
            
            <div className="flex-shrink-0">{icon}</div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">{node.name}</span>
                {node.code && node.code !== node.name && (
                  <span className="text-xs text-gray-500">({node.code})</span>
                )}
                {node.type === 'ledger' && node.category && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                    {node.category}
                  </span>
                )}
                {node.type === 'category' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Category
                  </span>
                )}
                {node.type === 'subgroup' && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Sub Group
                  </span>
                )}
              </div>
              {node.alias && node.alias !== node.name && (
                <div className="text-xs text-gray-500 mt-0.5">Alias: {node.alias}</div>
              )}
            </div>
            
            {node.type === 'ledger' && (
              <div className="flex items-center gap-3 text-sm text-gray-500 flex-shrink-0">
                {node.is_active !== undefined && (
                  <span className={node.is_active ? 'text-green-600' : 'text-gray-400'}>
                    {node.is_active ? 'Active' : 'Inactive'}
                  </span>
                )}
                {node.financial_year && (
                  <span>{node.financial_year}</span>
                )}
              </div>
            )}
          </div>
        </div>
        
        {hasChildren && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
    } catch (error) {
      console.error('Error rendering tree node:', error, node);
      return null;
    }
  };

  // Debug logging
  console.log('ChartOfAccountsPage render - loading:', loading);
  console.log('ChartOfAccountsPage render - error:', error);
  console.log('ChartOfAccountsPage render - data length:', data.length);
  console.log('ChartOfAccountsPage render - filteredData length:', filteredData.length);

  // Always render something - even if there's an error
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Loader />
          <p className="mt-4 text-gray-600">Loading Chart of Accounts...</p>
        </div>
      </div>
    );
  }

  // If there's an error and no data, show error immediately
  if (error && data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md w-full">
          <h3 className="text-red-800 font-bold text-lg mb-2">Error Loading Chart of Accounts</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={fetchChartOfAccounts}
            className="btn btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Safely get unique values
  let uniqueCategories: string[] = [];
  let uniqueGroups: string[] = [];
  let uniqueSubGroups: string[] = [];
  let uniqueNames: string[] = [];

  try {
    uniqueCategories = getAllCategories(data);
    uniqueGroups = getAllGroups(data);
    uniqueSubGroups = getAllSubGroups(data);
    uniqueNames = getAllNames(data);
  } catch (err) {
    console.error('Error getting unique values:', err);
  }

  return (
    <div className="h-full flex flex-col animate-fade-in" style={{ minHeight: '100%' }}>
      <div className="flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800">Chart of Accounts</h2>
          <InfoIcon
            title="Chart of Accounts"
            content="Complete hierarchical view of all account categories, groups, sub-groups, and ledgers. Similar to Tally's Chart of Accounts display."
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchChartOfAccounts}
            className="btn btn-secondary flex items-center"
          >
            <RefreshCw size={18} className="mr-1" />
            Refresh
          </button>
          <button
            onClick={handleDownloadExcel}
            className="btn btn-secondary flex items-center"
            disabled={filteredData.length === 0}
          >
            <Download size={18} className="mr-1" />
            Export Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center flex-shrink-0">
        <div className="flex items-center bg-white rounded-lg border border-gray-200 px-3 py-2 flex-grow max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search by name, code, or alias..."
            className="flex-grow focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center">
          <Filter size={18} className="text-gray-500 mr-2" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="select text-sm py-2 min-w-[200px]"
          >
            <option value="All">All Categories</option>
            {uniqueCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="select text-sm py-2 min-w-[200px]"
          >
            <option value="All">All Groups</option>
            {uniqueGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <select
            value={filterSubGroup}
            onChange={(e) => setFilterSubGroup(e.target.value)}
            className="select text-sm py-2 min-w-[200px]"
          >
            <option value="All">All Sub Groups</option>
            {uniqueSubGroups.map(subGroup => (
              <option key={subGroup} value={subGroup}>{subGroup}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center">
          <select
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            className="select text-sm py-2 min-w-[200px]"
          >
            <option value="All">All Names</option>
            {uniqueNames.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error: {error}</p>
          <button
            onClick={fetchChartOfAccounts}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Tree View - Scrollable */}
      <div className="table-container custom-scrollbar flex-1">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <FolderTree size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No accounts found</p>
              <p className="text-sm mb-4">
                {data.length === 0 
                  ? 'No chart of accounts data available. Please sync from Tally first using "Sync All Masters".' 
                  : 'No accounts match your current filters. Try adjusting your search or filter criteria.'}
              </p>
              {data.length === 0 && (
                <button
                  onClick={() => window.location.href = '/tally/sync-all-masters'}
                  className="mt-4 btn btn-primary"
                >
                  Go to Sync All Masters
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredData
                .filter(node => node && node.id && node.name)
                .map(node => {
                  try {
                    return renderTreeNode(node);
                  } catch (error) {
                    console.error('Error rendering node:', node, error);
                    return null;
                  }
                })}
            </div>
          )}
        </div>
      </div>

      {filteredData.length > 0 && (
        <div className="text-sm text-gray-600 flex-shrink-0">
          Showing {countNodes(filteredData)} items
        </div>
      )}
    </div>
  );
};

// Helper function to count all nodes in tree
const countNodes = (nodes: TreeNode[]): number => {
  let count = 0;
  const traverse = (nodes: TreeNode[]) => {
    nodes.forEach(node => {
      count++;
      if (node.children.length > 0) {
        traverse(node.children);
      }
    });
  };
  traverse(nodes);
  return count;
};

export default ChartOfAccountsPage;

