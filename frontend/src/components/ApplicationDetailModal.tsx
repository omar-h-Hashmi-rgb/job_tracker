import React, { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Save, ExternalLink, Calendar, Building2, Briefcase, DollarSign, StickyNote, AlertTriangle } from 'lucide-react';
import { updateApplication, deleteApplication } from '../services/api';
import toast from 'react-hot-toast';

import type { IApplication } from '../types/application';

interface ApplicationDetailModalProps {
  application: IApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({ application, isOpen, onClose, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<Partial<IApplication>>({});

  useEffect(() => {
    if (application) {
      setFormData(application);
      setIsEditing(false);
      setShowDeleteConfirm(false);
    }
  }, [application]);

  if (!isOpen || !application) return null;

  const handleUpdate = async () => {
    setIsLoading(true);
    try {
      await updateApplication(application._id, formData);
      toast.success('Application updated successfully');
      setIsEditing(false);
      onUpdate();
    } catch (error: unknown) {
      const err = error as any;
      toast.error(err.response?.data?.message || 'Failed to update application');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await deleteApplication(application._id);
      toast.success('Application deleted');
      onClose();
      onUpdate();
    } catch (error: unknown) {
      toast.error('Failed to delete application');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Application' : 'Application Details'}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Applied on {formatDate(application.dateApplied)}
              </p>
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
                  >
                    <Edit2 size={20} />
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              )}
              <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-8">
            {showDeleteConfirm ? (
              <div className="text-center py-8">
                <div className="bg-red-100 dark:bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Are you sure?</h4>
                <p className="text-gray-500 dark:text-gray-400 mb-8 px-8">
                  This action cannot be undone. All data for <strong>{application.company}</strong> will be permanently removed.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-6 py-2 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                  >
                    {isLoading ? 'Deleting...' : 'Delete Permanently'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Company */}
                  <div className="space-y-1">
                    <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <Building2 size={12} className="mr-1" /> Company
                    </label>
                    {isEditing ? (
                      <input
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{application.company}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <Briefcase size={12} className="mr-1" /> Role
                    </label>
                    {isEditing ? (
                      <input
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      />
                    ) : (
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{application.role}</p>
                    )}
                  </div>

                  {/* Status */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status</label>
                    {isEditing ? (
                      <select
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      >
                        <option>Applied</option>
                        <option>Phone Screen</option>
                        <option>Interview</option>
                        <option>Offer</option>
                        <option>Rejected</option>
                      </select>
                    ) : (
                      <div>
                        <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-bold rounded-full">
                          {application.status}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Salary */}
                  <div className="space-y-1">
                    <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <DollarSign size={12} className="mr-1" /> Salary Range
                    </label>
                    {isEditing ? (
                      <input
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                        placeholder="e.g. $120k - $150k"
                        value={formData.salaryRange}
                        onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white font-medium">{application.salaryRange || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                {/* JD Link */}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <Calendar size={12} className="mr-1" /> Job URL
                  </label>
                  {isEditing ? (
                    <input
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      value={formData.jdLink}
                      onChange={(e) => setFormData({ ...formData, jdLink: e.target.value })}
                    />
                  ) : (
                    application.jdLink ? (
                      <a href={application.jdLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium transition">
                        View Job Description <ExternalLink size={14} />
                      </a>
                    ) : (
                      <p className="text-gray-500 italic">No link provided</p>
                    )
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <StickyNote size={12} className="mr-1" /> Notes & Requirements
                  </label>
                  {isEditing ? (
                    <textarea
                      rows={5}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-50 dark:border-gray-700">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">
                        {application.notes || 'No notes added yet.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Save/Cancel Buttons */}
                {isEditing && (
                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-6 py-2 border border-gray-200 dark:border-gray-700 rounded-xl font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={isLoading}
                      className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg hover:shadow-blue-200 flex items-center gap-2 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicationDetailModal;
