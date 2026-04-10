import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import AddApplicationModal from '../components/AddApplicationModal';
import DashboardStats from '../components/DashboardStats';
import { Plus, LogOut, Layout, Search, Moon, Sun, Download } from 'lucide-react';
import { getApplications } from '../services/api';
import toast from 'react-hot-toast';
import type { IApplication } from '../types/application';

const Dashboard: React.FC = () => {
  const { user, logout, isDarkMode, toggleDarkMode } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [applications, setApplications] = useState<IApplication[]>([]);

  const fetchApps = async () => {
    try {
      const response = await getApplications();
      setApplications(response.data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [refreshKey]);

  const handleSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  const exportToCSV = () => {
    if (applications.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Company', 'Role', 'Status', 'Date Applied', 'Salary', 'Link', 'Notes'];
    const csvRows = [
      headers.join(','),
      ...applications.map(app => [
        `"${app.company}"`,
        `"${app.role}"`,
        `"${app.status}"`,
        `"${new Date(app.dateApplied).toLocaleDateString()}"`,
        `"${app.salaryRange || ''}"`,
        `"${app.jdLink || ''}"`,
        `"${(app.notes || '').replace(/"/g, '""')}"`
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `applications_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Exported to CSV');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Navigation */}
      <nav className="border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-20 transition-colors">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-200 dark:shadow-none">
            <Layout className="text-white" size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">JobTracker AI</span>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-6">
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors bg-gray-50 dark:bg-gray-800 rounded-full"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="hidden md:block text-right">
            <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user?.email?.split('@')[0]}</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest">Premium AI</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors text-sm font-medium bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-xl"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto py-10 px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-10 gap-6">
          <div className="flex-1 w-full">
            <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Active Pipeline</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-lg font-medium">
              Manage your future. Use Gemini AI to optimize your strategy and track every milestone.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <div className="relative group flex-1 sm:min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600 transition-colors" size={20} />
              <input
                type="text"
                placeholder="Search by company or role..."
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm focus:ring-4 focus:ring-blue-100 dark:focus:ring-blue-900/30 outline-none transition-all dark:text-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-100 dark:border-gray-800 rounded-2xl font-bold transition-all hover:bg-gray-50 dark:hover:bg-gray-900"
              title="Export to CSV"
            >
              <Download size={20} className="text-blue-600" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-blue-200 dark:shadow-none hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
            >
              <Plus size={22} />
              Add New Application
            </button>
          </div>
        </div>

        {/* Stats Section */}
        <DashboardStats applications={applications} />

        {/* Kanban Board */}
        <div className="bg-transparent">
          <KanbanBoard 
            key={refreshKey} 
            searchQuery={searchQuery} 
            onAppsFetched={(apps) => setApplications(apps)}
          />
        </div>
      </div>

      {/* Modals */}
      <AddApplicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />

      {/* Background Decor */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-blue-50 dark:bg-blue-900/10 rounded-full blur-[150px] opacity-40 translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-purple-50 dark:bg-indigo-900/10 rounded-full blur-[120px] opacity-40 -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
    </div>
  );
};

export default Dashboard;
