"use client";
import dynamic from 'next/dynamic';

// Implementing lazy loading architecture for the main dashboard component
// This optimizes initial payload by only loading the dashboard when needed
const Dashboard = dynamic(() => import('../components/Dashboard'), {
  ssr: false, // Disabling SSR here to demonstrate client-side lazy loading & hydration, though Next.js Server Components are generally preferred when possible
  loading: () => (
    <div className="w-full h-96 flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
      <p className="text-gray-500 font-medium animate-pulse">Loading system architecture...</p>
    </div>
  )
});

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Premium Header Design */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/70 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
            <div className="h-10 w-10 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              Garments Factory 
              <span className="font-light text-indigo-600 ml-1">Event Monitor</span>
            </h1>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-medium text-gray-600">Systems Operational</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative">
        {/* Decorative background blob */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 left-0 -ml-20 -mt-20 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <div className="mb-10">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
              Production <span className="text-indigo-600">Overview</span>
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl">
              Monitor real-time events, acknowledgements, and system states across the entire manufacturing floor.
            </p>
          </div>

          {/* Lazy loaded Dashboard Component */}
          <Dashboard />
        </div>
      </div>
    </main>
  );
}
