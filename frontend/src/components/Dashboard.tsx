'use client';

import React, { useEffect, useState } from 'react';
import { DataTable } from './DataTable';

// Types matching the backend API
interface SystemStateSummary {
  net_total: number;
  processed_events: number;
  pending_void: number;
  unresolved: number;
  duplicates: number;
  conflicts: number;
}

interface PendingEvent {
  source_id: string;
  event_id: string;
  type: string;
  quantity?: number;
  status: string;
  event_time: string;
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SystemStateSummary | null>(null);
  const [tableData, setTableData] = useState<PendingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBackendState = async () => {
      try {
        setIsLoading(true);
        // Connect to the actual backend Express server
        const response = await fetch('http://localhost:8080/api/state');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch state: ${response.statusText}`);
        }

        const data = await response.json();
        
        setSummary(data.summary);
        
        // For demonstration, let's display pending events in the data table
        // (You could also include exceptions here or create a separate table)
        setTableData(data.pending || []);
        setError(null);
      } catch (err: any) {
        console.error("Dashboard fetch error:", err);
        setError("Could not connect to the backend server. Is it running on port 3001?");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBackendState();
    
    // Optional: Setup polling every 5 seconds to keep the dashboard real-time
    const interval = setInterval(fetchBackendState, 5000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    { header: 'Source ID', accessor: 'source_id' as keyof PendingEvent },
    { header: 'Event ID', accessor: 'event_id' as keyof PendingEvent },
    { 
      header: 'Type', 
      accessor: 'type' as keyof PendingEvent,
      render: (val: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          val === 'COUNT' ? 'bg-green-100 text-green-700' : 
          val === 'VOID' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {val || 'N/A'}
        </span>
      )
    },
    { 
      header: 'Status', 
      accessor: 'status' as keyof PendingEvent,
      render: (val: string) => (
        <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          {val || 'PENDING'}
        </span>
      )
    },
    { 
      header: 'Event Time', 
      accessor: 'event_time' as keyof PendingEvent,
      render: (val: string) => val ? new Date(val).toLocaleString() : 'N/A'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <MetricCard title="Net Total Count" value={summary?.net_total} color="indigo" isLoading={isLoading && !summary} />
        <MetricCard title="Processed Events" value={summary?.processed_events} color="blue" isLoading={isLoading && !summary} />
        <MetricCard title="Pending Voids" value={summary?.pending_void} color="orange" isLoading={isLoading && !summary} />
        <MetricCard title="Unresolved Issues" value={summary?.unresolved} color="red" isLoading={isLoading && !summary} />
        <MetricCard title="Duplicate Attempts" value={summary?.duplicates} color="gray" isLoading={isLoading && !summary} />
        <MetricCard title="Conflicts" value={summary?.conflicts} color="rose" isLoading={isLoading && !summary} />
      </div>

      {/* Paginated Data Table */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 drop-shadow-sm flex items-center justify-between">
          <span>Pending Acknowledgements</span>
          {isLoading && <span className="text-sm font-normal text-gray-400 animate-pulse">Syncing...</span>}
        </h2>
        <DataTable data={tableData} columns={columns} pageSize={8} isLoading={isLoading && tableData.length === 0} />
      </div>

    </div>
  );
}

// Simple internal component for the cards
function MetricCard({ title, value, color, isLoading }: { title: string, value: any, color: string, isLoading: boolean }) {
  // Tailwind classes mapping for dynamic colors
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-purple-600 shadow-indigo-200',
    blue: 'from-blue-500 to-cyan-500 shadow-blue-200',
    orange: 'from-orange-400 to-amber-500 shadow-orange-200',
    red: 'from-red-500 to-rose-600 shadow-red-200',
    gray: 'from-gray-500 to-slate-600 shadow-gray-200',
    rose: 'from-rose-400 to-pink-500 shadow-rose-200',
  };

  const gradient = colorMap[color] || colorMap.indigo;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl`}>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white opacity-10 blur-xl"></div>
      <h3 className="text-sm font-medium opacity-90 tracking-wide uppercase">{title}</h3>
      <div className="mt-2 text-4xl font-extrabold tracking-tight">
        {isLoading ? (
          <div className="h-10 w-24 bg-white/20 animate-pulse rounded-md mt-1"></div>
        ) : (
          value?.toLocaleString() ?? '0'
        )}
      </div>
    </div>
  );
}
