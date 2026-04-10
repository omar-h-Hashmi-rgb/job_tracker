import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import ApplicationCard from './ApplicationCard';
import type { IApplication } from '../types/application';

interface ColumnProps {
  id: string;
  title: string;
  applications: IApplication[];
  onCardClick?: (app: IApplication) => void;
}

const KanbanColumn: React.FC<ColumnProps> = ({ id, title, applications, onCardClick }) => {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full bg-gray-50/50 dark:bg-gray-900/40 rounded-[2rem] p-4 min-w-[320px] border border-gray-100 dark:border-gray-800/50 transition-colors">
      <div className="flex items-center justify-between mb-5 px-3">
        <h2 className="font-extrabold text-gray-500 dark:text-gray-400 uppercase text-[10px] tracking-[0.2em]">
          {title} <span className="ml-2 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-600 dark:text-gray-500 font-bold">{applications.length}</span>
        </h2>
      </div>
      
      <div
        ref={setNodeRef}
        className="flex-1 overflow-y-auto min-h-[500px] scrollbar-hide"
      >
        <SortableContext
          items={applications.map(app => app._id)}
          strategy={verticalListSortingStrategy}
        >
          {applications.map((app) => (
            <ApplicationCard 
              key={app._id} 
              application={app} 
              onClick={() => onCardClick && onCardClick(app)} 
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
};

export default KanbanColumn;
