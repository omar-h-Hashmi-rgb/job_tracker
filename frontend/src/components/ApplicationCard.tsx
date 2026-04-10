import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Building2, Calendar, ChevronRight, AlertCircle } from 'lucide-react';

import type { IApplication } from '../types/application';

interface ApplicationCardProps {
  application: IApplication;
  onClick?: () => void;
}

const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: application._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const isStale = (application.status === 'Applied' || application.status === 'Interview') && 
    (new Date().getTime() - new Date(application.dateApplied).getTime() > 7 * 24 * 60 * 60 * 1000);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border ${
        isStale ? 'border-red-200 dark:border-red-900 ring-2 ring-red-50 dark:ring-red-900/10' : 'border-gray-100 dark:border-gray-700/50'
      } hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-grab active:cursor-grabbing group mb-4 select-none`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 pr-4">
          <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">
            {application.role}
          </h3>
          {isStale && (
            <div className="flex items-center gap-1 mt-1 text-red-500 font-black text-[9px] uppercase tracking-tighter">
              <AlertCircle size={10} />
              Needs Follow-up
            </div>
          )}
        </div>
        <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 transition-colors shrink-0" />
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center text-sm font-semibold text-gray-600 dark:text-gray-300">
          <Building2 size={16} className="mr-2 text-blue-500/70" />
          <span>{application.company}</span>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/50">
          <div className="flex items-center text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            <Calendar size={12} className="mr-1.5" />
            {formatDate(application.dateApplied)}
          </div>
          <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter ${
            application.status === 'Rejected' ? 'bg-red-50 text-red-500' :
            application.status === 'Offer' ? 'bg-green-50 text-green-500' :
            'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          }`}>
            {application.status}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationCard;
