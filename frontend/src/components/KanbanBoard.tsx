import React, { useState, useEffect } from 'react';
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
import { getApplications, updateApplication } from '../services/api';
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
  searchQuery: string;
  onAppsFetched?: (apps: IApplication[]) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ searchQuery, onAppsFetched }) => {
  const [applications, setApplications] = useState<IApplication[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
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

  const fetchApps = async () => {
    try {
      const response = await getApplications();
      setApplications(response.data);
      if (onAppsFetched) onAppsFetched(response.data);
    } catch (error) {
      console.error('Failed to fetch applications', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveInColumn = COLUMNS.some((col) => col.id === overId);
    
    if (isActiveInColumn) {
      setApplications((prev) => {
        const activeApp = prev.find((app) => app._id === activeId);
        if (activeApp && activeApp.status !== (overId as string)) {
          return prev.map((app) =>
            app._id === activeId ? { ...app, status: overId as ApplicationStatus } : app
          );
        }
        return prev;
      });
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeApp = applications.find((app) => app._id === active.id);
    if (!activeApp) return;

    const overColumn = COLUMNS.find(c => c.id === over.id) || 
                       COLUMNS.find(c => c.id === (over.data.current?.sortable?.containerId));
    
    const finalStatus = overColumn ? overColumn.id : activeApp.status;

    if (activeApp.status !== finalStatus) {
      // Optimistic update
      setApplications(prev => prev.map(app => 
        app._id === activeApp._id ? { ...app, status: finalStatus } : app
      ));

      try {
        await updateApplication(activeApp._id, { status: finalStatus });
        if (onAppsFetched) {
          const updatedApps = applications.map(app => 
            app._id === activeApp._id ? { ...app, status: finalStatus } : app
          );
          onAppsFetched(updatedApps);
        }
      } catch (error) {
        console.error('Failed to update application status', error);
        fetchApps(); // Rollback
      }
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

  if (loading) {
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
          Don't wait for the right time. Start tracking your applications and use Gemini AI to give you a competitive edge.
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
        onUpdate={() => fetchApps()}
      />
    </>
  );
};

export default KanbanBoard;
