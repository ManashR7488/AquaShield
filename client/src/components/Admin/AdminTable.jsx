import React, { useState, useMemo } from 'react';
import { FiEdit, FiTrash2, FiEye, FiSearch, FiChevronLeft, FiChevronRight, FiMoreVertical, FiArrowUp, FiArrowDown, FiCheck, FiX } from 'react-icons/fi';
import ConfirmDialog from './ConfirmDialog';

/**
 * AdminTable Component
 * A reusable data table component for admin interfaces with sorting, pagination, search, and actions
 */
const AdminTable = ({
  columns = [],
  data = [],
  loading = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  onEdit,
  onDelete,
  onView,
  searchable = true,
  sortable = true,
  selectable = false,
  actions = ['view', 'edit', 'delete'],
  emptyMessage = 'No data available',
  className = '',
  rowsPerPage = 10,
  showRowCount = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, item: null });

  // Filter and sort data based on search term and sort configuration
  const processedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm && searchable) {
      filtered = data.filter(item =>
        columns.some(column => {
          const value = column.accessor ? item[column.accessor] : '';
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply sorting
    if (sortConfig.key && sortable) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchTerm, sortConfig, columns, searchable, sortable]);

  const handleSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedRows(processedData.map(item => item.id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, id]);
    } else {
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));
    }
  };

  const handleDeleteClick = (item) => {
    setDeleteConfirmation({ isOpen: true, item });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.item && onDelete) {
      onDelete(deleteConfirmation.item);
    }
    setDeleteConfirmation({ isOpen: false, item: null });
  };

  const renderSortIcon = (key) => {
    if (!sortable || sortConfig.key !== key) {
      return null;
    }
    return sortConfig.direction === 'asc' ? (
      <FiArrowUp className="w-3 h-3" />
    ) : (
      <FiArrowDown className="w-3 h-3" />
    );
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: rowsPerPage }).map((_, index) => (
      <tr key={`skeleton-${index}`} className="border-b border-gray-100">
        {selectable && (
          <td className="px-4 py-3">
            <div className="w-4 h-4 bg-gray-200 rounded animate-pulse"></div>
          </td>
        )}
        {columns.map((column, colIndex) => (
          <td key={colIndex} className="px-4 py-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
          </td>
        ))}
        {actions.length > 0 && (
          <td className="px-4 py-3">
            <div className="flex space-x-2">
              {actions.map((_, actionIndex) => (
                <div key={actionIndex} className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </td>
        )}
      </tr>
    ));
  };

  const renderEmptyState = () => (
    <tr>
      <td colSpan={columns.length + (selectable ? 1 : 0) + (actions.length > 0 ? 1 : 0)} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center justify-center text-gray-500">
          <FiSearch className="w-12 h-12 mb-4 text-gray-300" />
          <p className="text-lg font-medium">{emptyMessage}</p>
          <p className="text-sm">Try adjusting your search or filter criteria</p>
        </div>
      </td>
    </tr>
  );

  const renderCellContent = (column, item) => {
    if (column.render) {
      return column.render(item);
    }
    
    const value = column.accessor ? item[column.accessor] : '';
    
    if (column.type === 'badge') {
      const badgeClass = column.getBadgeClass ? column.getBadgeClass(value) : 'bg-gray-100 text-gray-800';
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
          {value}
        </span>
      );
    }
    
    if (column.type === 'boolean') {
      return value ? (
        <FiCheck className="w-4 h-4 text-green-500" />
      ) : (
        <FiX className="w-4 h-4 text-red-500" />
      );
    }
    
    return value;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header with search */}
      {searchable && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            {showRowCount && (
              <div className="text-sm text-gray-500">
                {processedData.length} of {data.length} items
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === processedData.length && processedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.accessor)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {renderSortIcon(column.accessor)}
                  </div>
                </th>
              ))}
              {actions.length > 0 && (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              renderSkeletonRows()
            ) : processedData.length === 0 ? (
              renderEmptyState()
            ) : (
              processedData.map((item, rowIndex) => (
                <tr key={item.id || rowIndex} className="hover:bg-gray-50">
                  {selectable && (
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(item.id)}
                        onChange={(e) => handleSelectRow(item.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {renderCellContent(column, item)}
                    </td>
                  ))}
                  {actions.length > 0 && (
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        {actions.includes('view') && onView && (
                          <button
                            onClick={() => onView(item)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="View"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        )}
                        {actions.includes('edit') && onEdit && (
                          <button
                            onClick={() => onEdit(item)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Edit"
                          >
                            <FiEdit className="w-4 h-4" />
                          </button>
                        )}
                        {actions.includes('delete') && onDelete && (
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminTable;