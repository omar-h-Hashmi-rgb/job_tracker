import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import ApplicationCard from './ApplicationCard';
import ApplicationDetailModal from './ApplicationDetailModal';
import { Ghost, Sparkles } from 'lucide-react';
import type { IApplication, ApplicationStatus } from '../types/application';

const COLUMNS = [
  { id: 'Applied' as const, title: 'Applied' },
  { id: 'Phone Screen' as const, title: 'Phone Screen' },
  { id: 'Interview' as const, title: 'Interview' },
  { id: 'Offer' as const, title: 'Offer' },
  { id: 'Rejected' as const, title: 'Rejected' },
];

interface KanbanBoardProps {
  applications: IApplication[];
  searchQuery: string;
  isLoading: boolean;
  onUpdate: (id: string, newStatus: string) => Promise<void>;
  onAppsFetched: () => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ applications, searchQuery, isLoading, onUpdate, onAppsFetched }) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedApp, setSelectedApp] = useState<IApplication | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (!over) return;
    
    // We only update locally for smooth animation during hover (Dnd-kit internal)
    // The final source of truth remains the parent's applications prop
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeApp = applications.find((app) => app._id === active.id);
    if (!activeApp) return;

    // Resolve target status: check if over.id is a column or if we dropped on a card in a column
    let finalStatus = activeApp.status;
    
    // 1. Check if dropped directly on a column container
    const isColumn = COLUMNS.some(col => col.id === over.id);
    if (isColumn) {
      finalStatus = over.id as ApplicationStatus;
    } else {
      // 2. Check if dropped on a card within a column
      const overApp = applications.find(app => app._id === over.id);
      if (overApp) {
        finalStatus = overApp.status;
      }
    }

    if (activeApp.status !== finalStatus) {
      await onUpdate(activeApp._id, finalStatus);
    }
  };

  const filteredApps = applications.filter(app => 
    app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCardClick = (app: IApplication) => {
    setSelectedApp(app);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-gray-50/50 dark:bg-gray-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
          <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" size={20} />
        </div>
        <p className="mt-6 text-gray-500 dark:text-gray-400 font-bold tracking-wide animate-pulse uppercase text-xs">Syncing Pipeline...</p>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-center bg-gray-50 dark:bg-gray-900/30 rounded-[3rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-full shadow-2xl shadow-blue-100 dark:shadow-none mb-8">
          <Ghost size={64} className="text-blue-500 dark:text-blue-400 animate-bounce" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Your pipeline is empty</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm font-medium mb-8">
          Don't wait for the right time. Start tracking your applications and use AI to give you a competitive edge.
        </p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-12 pt-2 scrollbar-hide">
          {COLUMNS.map((col) => {
            const columnApps = filteredApps.filter((app) => app.status === col.id);
            return (
              <KanbanColumn
                key={col.id}
                id={col.id}
                title={col.title}
                applications={columnApps}
                onCardClick={handleCardClick}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={{
          sideEffects: defaultDropAnimationSideEffects({
            styles: {
              active: {
                opacity: '0.5',
              },
            },
          }),
        }}>
          {activeId ? (() => {
            const activeApp = applications.find((app) => app._id === activeId);
            return activeApp ? <ApplicationCard application={activeApp} /> : null;
          })() : null}
        </DragOverlay>
      </DndContext>

      <ApplicationDetailModal
        application={selectedApp}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onUpdate={onAppsFetched}
      />
    </>
  );
};

export default KanbanBoard;
