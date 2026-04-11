import React from 'react';
import { Briefcase, MessageSquare, CheckCircle, TrendingUp } from 'lucide-react';
import type { IApplication } from '../types/application';

interface StatsProps {
  applications: IApplication[];
}

const DashboardStats: React.FC<StatsProps> = ({ applications }) => {
  const stats = [
    {
      label: 'Total Applications',
      value: applications.length,
      icon: Briefcase,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      label: 'Interviews',
      value: applications.filter(app => app.status === 'Interview' || app.status === 'Phone Screen').length,
      icon: MessageSquare,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600',
    },
    {
      label: 'Offers',
      value: applications.filter(app => app.status === 'Offer').length,
      icon: CheckCircle,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      label: 'Success Rate',
      value: applications.length > 0 
        ? `${Math.round((applications.filter(app => ['Offer', 'Interview', 'Phone Screen'].includes(app.status)).length / applications.length) * 100)}%` 
        : '0%',
      icon: TrendingUp,
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-all hover:shadow-md"
        >
          <div className={`${stat.color} bg-opacity-10 p-3 rounded-xl`}>
            <stat.icon className={stat.textColor} size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
