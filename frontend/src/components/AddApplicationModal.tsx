import React, { useState } from 'react';
import { X, Sparkles, Copy, Check } from 'lucide-react';
import { parseJobDescription, createApplication } from '../services/api';
import toast from 'react-hot-toast';
import type { ApplicationFormData, GeminiParsedJD } from '../types/application';

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddApplicationModal: React.FC<AddApplicationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [jdText, setJdText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Form states
  const [formData, setFormData] = useState<ApplicationFormData>({
    company: '',
    role: '',
    status: 'Applied',
    jdLink: '',
    salaryRange: '',
    notes: '',
  });
  const [resumeBullets, setResumeBullets] = useState<string[]>([]);

  const handleAIParse = async () => {
    if (!jdText.trim()) return;
    setIsParsing(true);
    setResumeBullets([]); // Clear old bullets
    try {
      // 1. Standard JSON Parse for details
      const response = await parseJobDescription(jdText);
      const parsedData = response.data.parsedData as GeminiParsedJD;
      
      setFormData({
        ...formData,
        company: parsedData.companyName || '',
        role: parsedData.role || '',
        jdLink: parsedData.jdLink || formData.jdLink,
      });
      setFormData(prev => ({ 
        ...prev, 
        notes: `Required Skills: ${parsedData.requiredSkills?.join(', ')}\n\nLocation: ${parsedData.location}` 
      }));

      // 2. Stream Resume Bullets
      const token = localStorage.getItem('token');
      const fetchResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/applications/stream-bullets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: parsedData.role, jdText })
      });

      if (!fetchResponse.body) return;
      const reader = fetchResponse.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                // Update bullets array - split by newlines or dashes as they arrive
                const bullets = fullText
                  .split('\n')
                  .filter(b => b.trim().length > 0)
                  .map(b => b.replace(/^[*-]\s*/, '').trim());
                setResumeBullets(bullets);
              }
            } catch (e) {
              // Partial JSON or format error, ignore
            }
          }
        }
      }
    } catch (error) {
      console.error('AI Parsing failed', error);
      toast.error('AI Parsing failed. Please try again.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await createApplication(formData);
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        company: '',
        role: '',
        status: 'Applied',
        jdLink: '',
        salaryRange: '',
        notes: '',
      });
      setJdText('');
      setResumeBullets([]);
    } catch (error) {
      console.error('Failed to save application', error);
      alert('Failed to save application.');
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl bg-white/90 dark:bg-gray-950/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-gray-800 overflow-hidden transform transition-all">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Add New Application</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Track your next career move with Gemini AI insights.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Parsing Section */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Paste Job Description
                </label>
                <textarea
                  rows={8}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-all resize-none"
                  placeholder="Paste the full job description to generate AI insights and resume bullets..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={handleAIParse}
                disabled={isParsing || !jdText.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg shadow-purple-200 dark:shadow-none disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isParsing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Analyzing with Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>Parse with AI</span>
                  </>
                )}
              </button>

              {resumeBullets.length > 0 && (
                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Sparkles size={16} className="text-purple-500" />
                    Tailored Resume Bullets
                  </h4>
                  <div className="space-y-3">
                    {resumeBullets.map((bullet, index) => (
                      <div 
                        key={index} 
                        className="bg-purple-50/50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30 flex justify-between items-start group hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                      >
                        <p className="text-sm text-purple-900 dark:text-purple-300 leading-relaxed pr-6">{bullet}</p>
                        <button
                          onClick={() => copyToClipboard(bullet, index)}
                          className="text-purple-600 dark:text-purple-400 hover:bg-white dark:hover:bg-purple-900/50 p-1.5 rounded-lg transition-all"
                          title="Copy to clipboard"
                        >
                          {copiedIndex === index ? <Check size={14} /> : <Copy size={14} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Application Data Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Company</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all"
                    placeholder="e.g. Google"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Role</label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all"
                    placeholder="e.g. Senior Frontend Engineer"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Status</label>
                    <select
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all appearance-none"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option>Applied</option>
                      <option>Phone Screen</option>
                      <option>Interview</option>
                      <option>Offer</option>
                      <option>Rejected</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Salary Range</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all"
                      placeholder="e.g. $120k - $150k"
                      value={formData.salaryRange}
                      onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">JD Link (Optional)</label>
                  <input
                    type="url"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all"
                    placeholder="https://company.com/jobs/..."
                    value={formData.jdLink}
                    onChange={(e) => setFormData({ ...formData, jdLink: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
                  <textarea
                    rows={4}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-all resize-none"
                    placeholder="Key highlights or requirements..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200 dark:shadow-none disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddApplicationModal;
