'use client';

import React, { useMemo, useState } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T;
  render?: (value: any, item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  isLoading?: boolean;
}

export function DataTable<T>({ data, columns, pageSize = 10, isLoading = false }: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Optimization: useMemo to prevent unnecessary sorting/filtering on every render
  const processedData = useMemo(() => {
    let result = [...data];

    // Handle sorting
    if (sortKey) {
      result.sort((a, b) => {
        const aValue = a[sortKey];
        const bValue = b[sortKey];
        
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedData.length / pageSize);
  
  // Optimization: useMemo for pagination slicing
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return processedData.slice(startIndex, startIndex + pageSize);
  }, [processedData, currentPage, pageSize]);

  const handleSort = (key: keyof T) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden border border-white/20 transition-all duration-300 hover:shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-50 to-purple-50 text-gray-700 uppercase text-xs font-semibold tracking-wider">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className="p-4 cursor-pointer hover:bg-indigo-100 transition-colors"
                  onClick={() => handleSort(col.accessor)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{col.header}</span>
                    {sortKey === col.accessor && (
                      <span className="text-indigo-600">
                        {sortOrder === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100/50">
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className="hover:bg-white/80 transition-colors duration-200"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="p-4 text-sm text-gray-600">
                      {col.render 
                        ? col.render(item[col.accessor], item) 
                        : String(item[col.accessor] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-gray-500">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white/30 border-t border-white/20">
          <span className="text-sm text-gray-600">
            Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, processedData.length)} of {processedData.length} entries
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white/50 border border-gray-200 text-gray-700 hover:bg-white disabled:opacity-50 transition-all"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white/50 border border-gray-200 text-gray-700 hover:bg-white disabled:opacity-50 transition-all"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
