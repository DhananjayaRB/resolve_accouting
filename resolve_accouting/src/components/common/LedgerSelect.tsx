import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';
import { LedgerHead } from '../../types';

interface LedgerSelectProps {
  ledgers: LedgerHead[];
  value: string;
  onChange: (ledgerId: string) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeLedgerIds?: string[];
  showCode?: boolean;
}

const LedgerSelect: React.FC<LedgerSelectProps> = ({
  ledgers,
  value,
  onChange,
  placeholder = 'Select Ledger',
  disabled = false,
  excludeLedgerIds = [],
  showCode = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLedger = ledgers.find(l => l.id === value);

  // Group ledgers by category (not used in filtered version, but kept for consistency)

  // Filter ledgers based on search term and exclusions
  const filteredLedgers = ledgers.filter(ledger => {
    const matchesSearch = 
      ledger.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ledger.code && ledger.code.toLowerCase().includes(searchTerm.toLowerCase()));
    const notExcluded = !excludeLedgerIds.includes(ledger.id);
    return matchesSearch && notExcluded;
  });

  // Group filtered ledgers
  const filteredGroupedLedgers = filteredLedgers.reduce((acc, ledger) => {
    const category = ledger.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(ledger);
    return acc;
  }, {} as Record<string, LedgerHead[]>);

  const categoryOrder = ['Asset', 'Liability', 'Expense', 'Income', 'Other'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus search input when dropdown opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (ledgerId: string) => {
    onChange(ledgerId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Asset':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Liability':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Expense':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'Income':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-3 py-2 text-left text-sm rounded-lg border transition-all duration-200
          ${disabled 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' 
            : selectedLedger
            ? 'bg-white border-secondary-300 text-gray-900 hover:border-secondary-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500'
            : 'bg-white border-gray-300 text-gray-500 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500'
          }
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            {selectedLedger ? (
              <>
                <span className="truncate font-light">{selectedLedger.name}</span>
                {showCode && selectedLedger.code && (
                  <span className="ml-2 text-xs text-gray-500 font-light">({selectedLedger.code})</span>
                )}
              </>
            ) : (
              <span className="text-gray-400 font-light">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center ml-2 flex-shrink-0">
            {selectedLedger && !disabled && (
              <button
                onClick={handleClear}
                className="mr-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear selection"
              >
                <X size={14} />
              </button>
            )}
            <ChevronDown 
              size={16} 
              className={`text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} 
            />
          </div>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search ledgers..."
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 font-light"
              />
            </div>
          </div>

          {/* Dropdown Options */}
          <div className="overflow-y-auto max-h-64 custom-scrollbar">
            {Object.keys(filteredGroupedLedgers).length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500 text-sm font-light">
                {searchTerm ? 'No ledgers found matching your search' : 'No ledgers available'}
              </div>
            ) : (
              categoryOrder
                .filter(category => filteredGroupedLedgers[category])
                .map(category => (
                  <div key={category}>
                    {/* Category Header */}
                    <div className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider border-b ${getCategoryColor(category)}`}>
                      {category}
                    </div>
                    {/* Category Items */}
                    {filteredGroupedLedgers[category]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((ledger) => (
                        <button
                          key={ledger.id}
                          type="button"
                          onClick={() => handleSelect(ledger.id)}
                          className={`
                            w-full px-4 py-2.5 text-left text-sm transition-colors duration-150
                            ${value === ledger.id
                              ? 'bg-secondary-50 text-secondary-900 font-light'
                              : 'text-gray-700 hover:bg-gray-50 font-light'
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <span className="truncate">{ledger.name}</span>
                                {showCode && ledger.code && (
                                  <span className="ml-2 text-xs text-gray-500">({ledger.code})</span>
                                )}
                              </div>
                            </div>
                            {value === ledger.id && (
                              <Check size={16} className="text-secondary-600 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        </button>
                      ))}
                  </div>
                ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LedgerSelect;

