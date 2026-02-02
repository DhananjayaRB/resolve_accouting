import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Search,
  Folder,
  FileText,
  Layers,
  RefreshCw,
  Download,
  Expand,
  Minimize2,
  X,
  Info,
  CheckCircle2,
  XCircle,
  FolderTree
} from 'lucide-react';
import { getStoredUserInfo } from '../../utils/auth';
import toast from 'react-hot-toast';
import Loader from '../common/Loader';

// API Response Types
interface Ledger {
  ledger_id: number;
  ledger_name: string;
  is_active: boolean;
}

interface Group {
  group_id: number;
  group_name: string;
  parent_group_id: number | null;
  child_groups: Group[];
  ledgers: Ledger[];
}

interface Category {
  category: string;
  groups: Group[];
}

interface ApiResponse {
  success: boolean;
  data: Category[];
  meta?: {
    total_categories?: number;
    total_groups?: number;
    total_ledgers?: number;
  };
}

// Node types for tree rendering
type TreeNodeType = 'category' | 'group' | 'ledger';

interface TreeNode {
  id: string;
  type: TreeNodeType;
  name: string;
  depth: number;
  category?: string;
  group_id?: number;
  ledger_id?: number;
  is_active?: boolean;
  parent_group_id?: number | null;
  children: TreeNode[];
  childCount?: number;
  ledgerCount?: number;
}

const ChartOfAccountsPage: React.FC = () => {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch data from new API
  const fetchChartOfAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { org_id, token } = getStoredUserInfo();
      
      if (!org_id) {
        throw new Error('Organization ID is required');
      }

      if (!token) {
        throw new Error('JWT token is required. Please login again.');
      }

      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      const port = import.meta.env.VITE_API_PORT || '3001';
      const apiUrl = hostname !== 'localhost' && hostname !== '127.0.0.1'
        ? `${protocol}//${hostname}:${port}/api/v1/sync-tally-master`
        : `http://localhost:${port}/api/v1/sync-tally-master`;

      console.log('Fetching from:', apiUrl);

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Org-Id': org_id
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.error?.message || `Failed to fetch: ${response.status}`);
      }

      const result: ApiResponse = await response.json();
      
      if (result.success && result.data) {
        setData(result.data);
        
        // Auto-expand all categories initially
        const allCategoryIds = new Set(result.data.map(cat => `category-${cat.category}`));
        setExpandedCategories(allCategoryIds);
        
        // Auto-expand first level groups
        const firstLevelGroupIds = new Set<string>();
        result.data.forEach(cat => {
          cat.groups.forEach(group => {
            firstLevelGroupIds.add(`group-${group.group_id}`);
          });
        });
        setExpandedNodes(firstLevelGroupIds);
        
        setError(null);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: any) {
      console.error('Error fetching chart of accounts:', err);
      const errorMsg = err.message || 'Failed to fetch chart of accounts';
      setError(errorMsg);
      toast.error(errorMsg);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChartOfAccounts();
  }, [fetchChartOfAccounts]);

  // Convert API data to tree nodes
  const buildTreeNodes = useCallback((categories: Category[]): TreeNode[] => {
    const nodes: TreeNode[] = [];

    categories.forEach(category => {
      const categoryNode: TreeNode = {
        id: `category-${category.category}`,
        type: 'category',
        name: category.category,
        depth: 0,
        category: category.category,
        children: []
      };

      const buildGroupNode = (group: Group, depth: number): TreeNode => {
        const groupNode: TreeNode = {
          id: `group-${group.group_id}`,
          type: 'group',
          name: group.group_name,
          depth,
          category: category.category,
          group_id: group.group_id,
          parent_group_id: group.parent_group_id,
          children: [],
          childCount: group.child_groups.length,
          ledgerCount: group.ledgers.length
        };

        // Add child groups
        group.child_groups.forEach(childGroup => {
          groupNode.children.push(buildGroupNode(childGroup, depth + 1));
        });

        // Add ledgers
        group.ledgers.forEach(ledger => {
          groupNode.children.push({
            id: `ledger-${ledger.ledger_id}`,
            type: 'ledger',
            name: ledger.ledger_name,
            depth: depth + 1,
            category: category.category,
            ledger_id: ledger.ledger_id,
            is_active: ledger.is_active,
            group_id: group.group_id,
            children: []
          });
        });

        return groupNode;
      };

      category.groups.forEach(group => {
        categoryNode.children.push(buildGroupNode(group, 1));
      });

      nodes.push(categoryNode);
    });

    return nodes;
  }, []);

  const treeNodes = useMemo(() => buildTreeNodes(data), [data, buildTreeNodes]);

  // Filter tree based on search
  const filteredTreeNodes = useMemo(() => {
    if (!searchTerm.trim()) return treeNodes;

    const filterNode = (node: TreeNode): TreeNode | null => {
      const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const filteredChildren = node.children
        .map(child => filterNode(child))
        .filter((child): child is TreeNode => child !== null);

      if (matchesSearch || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }

      return null;
    };

    return treeNodes
      .map(node => filterNode(node))
      .filter((node): node is TreeNode => node !== null);
  }, [treeNodes, searchTerm]);

  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Toggle category expansion
  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }, []);

  // Expand/Collapse all
  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type !== 'ledger') {
          allIds.add(node.id);
        }
        if (node.children.length > 0) {
          collectIds(node.children);
        }
      });
    };
    collectIds(filteredTreeNodes);
    setExpandedNodes(allIds);
    setExpandedCategories(new Set(filteredTreeNodes.map(n => n.id)));
  }, [filteredTreeNodes]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
    setExpandedCategories(new Set());
  }, []);

  // Get breadcrumb path for selected node
  const getBreadcrumb = useCallback((node: TreeNode, nodes: TreeNode[]): string[] => {
    const path: string[] = [node.name];
    
    const findParent = (targetId: string, currentNodes: TreeNode[], currentPath: string[]): string[] | null => {
      for (const n of currentNodes) {
        const newPath = [...currentPath, n.name];
        
        if (n.id === targetId) {
          return newPath;
        }
        
        if (n.children.length > 0) {
          const found = findParent(targetId, n.children, newPath);
          if (found) return found;
        }
      }
      return null;
    };

    const fullPath = findParent(node.id, nodes, []);
    return fullPath || path;
  }, []);

  // Render tree node recursively
  const renderTreeNode = useCallback((node: TreeNode): React.ReactNode => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;
    const indent = node.depth * 24;

    let icon;
    if (node.type === 'category') {
      icon = <Layers size={18} className="text-blue-600" />;
    } else if (node.type === 'group') {
      icon = <Folder size={18} className="text-green-600" />;
    } else {
      icon = <FileText size={16} className="text-purple-600" />;
    }

    const handleClick = () => {
      if (node.type !== 'ledger' && hasChildren) {
        toggleNode(node.id);
      }
      setSelectedNode(node);
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className={`
            flex items-center py-2 px-4 cursor-pointer transition-colors
            ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
            ${node.type === 'category' ? 'font-semibold bg-gray-50 sticky top-0 z-10' : ''}
          `}
          style={{ paddingLeft: `${12 + indent}px` }}
          onClick={handleClick}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {node.type !== 'ledger' && hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
                className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? (
                  <ChevronDown size={16} className="text-gray-600" />
                ) : (
                  <ChevronRight size={16} className="text-gray-600" />
                )}
              </button>
            ) : (
              <div className="w-4" />
            )}

            <div className="flex-shrink-0">{icon}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 truncate">{node.name}</span>
                {node.type === 'group' && (
                  <span className="text-xs text-gray-500">
                    ({node.childCount || 0} groups, {node.ledgerCount || 0} ledgers)
                  </span>
                )}
                {node.type === 'ledger' && (
                  <span className={`inline-flex items-center gap-1 text-xs ${
                    node.is_active ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {node.is_active ? (
                      <CheckCircle2 size={12} />
                    ) : (
                      <XCircle size={12} />
                    )}
                    {node.is_active ? 'Active' : 'Inactive'}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  }, [expandedNodes, selectedNode, toggleNode]);

  // Render details panel
  const renderDetailsPanel = () => {
    if (!selectedNode) {
      return (
        <div className="h-full flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Info size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No item selected</p>
            <p className="text-sm mt-2">Click on a group or ledger to view details</p>
          </div>
        </div>
      );
    }

    const breadcrumb = getBreadcrumb(selectedNode, filteredTreeNodes);

    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-800">Details</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600 flex-wrap">
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                <span className="truncate max-w-[150px]">{item}</span>
                {index < breadcrumb.length - 1 && <ChevronRight size={14} className="text-gray-400" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</label>
              <p className="mt-1 text-lg font-medium text-gray-900">{selectedNode.name}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
              <p className="mt-1 text-sm text-gray-700 capitalize">{selectedNode.type}</p>
            </div>

            {selectedNode.category && (
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</label>
                <p className="mt-1 text-sm text-gray-700">{selectedNode.category}</p>
              </div>
            )}

            {selectedNode.type === 'group' && selectedNode.group_id && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Group ID</label>
                  <p className="mt-1 text-sm text-gray-700">{selectedNode.group_id}</p>
                </div>
                {selectedNode.childCount !== undefined && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Child Groups</label>
                    <p className="mt-1 text-sm text-gray-700">{selectedNode.childCount}</p>
                  </div>
                )}
                {selectedNode.ledgerCount !== undefined && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ledgers</label>
                    <p className="mt-1 text-sm text-gray-700">{selectedNode.ledgerCount}</p>
                  </div>
                )}
              </>
            )}

            {selectedNode.type === 'ledger' && selectedNode.ledger_id && (
              <>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ledger ID</label>
                  <p className="mt-1 text-sm text-gray-700">{selectedNode.ledger_id}</p>
                </div>
                {selectedNode.group_id && (
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Group ID</label>
                    <p className="mt-1 text-sm text-gray-700">{selectedNode.group_id}</p>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</label>
                  <p className="mt-1">
                    <span className={`inline-flex items-center gap-1 text-sm ${
                      selectedNode.is_active ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {selectedNode.is_active ? (
                        <>
                          <CheckCircle2 size={16} />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle size={16} />
                          Inactive
                        </>
                      )}
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

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

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <FolderTree size={24} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-800">Chart of Accounts</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="btn btn-secondary flex items-center gap-2"
              title="Expand All"
            >
              <Expand size={18} />
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="btn btn-secondary flex items-center gap-2"
              title="Collapse All"
            >
              <Minimize2 size={18} />
              Collapse All
            </button>
            <button
              onClick={fetchChartOfAccounts}
              className="btn btn-secondary flex items-center gap-2"
              title="Refresh"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center bg-white rounded-lg border border-gray-300 px-4 py-2 max-w-md">
          <Search size={18} className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search groups or ledgers..."
            className="flex-1 focus:outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="ml-2 p-1 hover:bg-gray-100 rounded"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tree View */}
        <div className="flex-1 overflow-y-auto bg-white border-r border-gray-200">
          {filteredTreeNodes.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <FolderTree size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No accounts found</p>
              <p className="text-sm">
                {searchTerm
                  ? 'No accounts match your search. Try a different term.'
                  : 'No chart of accounts data available. Please sync from Tally first.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredTreeNodes.map(node => {
                const isCategoryExpanded = expandedCategories.has(node.id);
                
                return (
                  <div key={node.id}>
                    {/* Category Header */}
                    <div
                      className={`
                        flex items-center py-3 px-4 cursor-pointer transition-colors
                        bg-gray-50 hover:bg-gray-100 font-semibold sticky top-0 z-10
                      `}
                      onClick={() => toggleCategory(node.id)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(node.id);
                        }}
                        className="flex-shrink-0 p-0.5 hover:bg-gray-200 rounded mr-2"
                      >
                        {isCategoryExpanded ? (
                          <ChevronDown size={16} className="text-gray-600" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-600" />
                        )}
                      </button>
                      <Layers size={18} className="text-blue-600 mr-2" />
                      <span className="text-gray-900">{node.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        ({node.children.length} groups)
                      </span>
                    </div>

                    {/* Category Groups */}
                    {isCategoryExpanded && (
                      <div>
                        {node.children.map(child => renderTreeNode(child))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Panel - Details View */}
        <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
          {renderDetailsPanel()}
        </div>
      </div>

      {/* Footer Stats */}
      {data.length > 0 && (
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-6 py-3">
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span>Categories: <strong className="text-gray-900">{data.length}</strong></span>
            <span>Groups: <strong className="text-gray-900">
              {data.reduce((sum, cat) => {
                const countGroups = (groups: Group[]): number => {
                  return groups.reduce((count, group) => {
                    return count + 1 + countGroups(group.child_groups);
                  }, 0);
                };
                return sum + countGroups(cat.groups);
              }, 0)}
            </strong></span>
            <span>Ledgers: <strong className="text-gray-900">
              {data.reduce((sum, cat) => {
                const countLedgers = (groups: Group[]): number => {
                  return groups.reduce((count, group) => {
                    return count + group.ledgers.length + countLedgers(group.child_groups);
                  }, 0);
                };
                return sum + countLedgers(cat.groups);
              }, 0)}
            </strong></span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChartOfAccountsPage;
