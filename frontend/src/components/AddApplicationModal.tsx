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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Add New Application</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* AI Section */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Paste Job Description</label>
                <textarea
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Paste the full job description here to have AI parse details and generate resume bullets..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAIParse}
                  disabled={isParsing || !jdText.trim()}
                  className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isParsing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Parsing JD...
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Sparkles size={18} className="mr-2" />
                      Parse with Gemini AI
                    </span>
                  )}
                </button>

                {resumeBullets.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center">
                      <Sparkles size={16} className="text-purple-600 mr-2" />
                      Tailored Resume Bullets
                    </h4>
                    <div className="space-y-3">
                      {resumeBullets.map((bullet, index) => (
                        <div key={index} className="bg-purple-50 p-3 rounded-lg border border-purple-100 flex justify-between items-start group">
                          <p className="text-sm text-purple-900 leading-relaxed pr-8">{bullet}</p>
                          <button
                            onClick={() => copyToClipboard(bullet, index)}
                            className="text-purple-600 hover:text-purple-800 p-1"
                          >
                            {copiedIndex === index ? <Check size={16} /> : <Copy size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Form Section */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <input
                    type="text"
                    required
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
                    <label className="block text-sm font-medium text-gray-700">Salary Range</label>
                    <input
                      type="text"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g. $100k - $120k"
                      value={formData.salaryRange}
                      onChange={(e) => setFormData({ ...formData, salaryRange: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">JD Link (Optional)</label>
                  <input
                    type="url"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    value={formData.jdLink}
                    onChange={(e) => setFormData({ ...formData, jdLink: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    rows={4}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>

                <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 shadow-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddApplicationModal;
