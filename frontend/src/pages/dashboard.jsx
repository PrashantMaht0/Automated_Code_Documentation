import React, { useState } from 'react';
import { Search, Sparkles, Settings, X } from 'lucide-react';

const mockCommitRows = [
  {
    commitId: 'a1b2c3d4e5f678901234567890abcdef12345678',
    author: 'octocat',
    message: 'Refactored the authentication state management and cleaned up the session handling flow.',
    date: 'Oct 24, 2025',
    aiSummary: '',
  },
  {
    commitId: 'f9e8d7c6b5a432109876543210fedcba98765432',
    author: 'dev-team',
    message: 'Updated Tailwind configurations for dark mode support across the dashboard layout.',
    date: 'Oct 23, 2025',
    aiSummary: '',
  },
];

export default function Dashboard({ activeProject }) {
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const projectName = activeProject?.repo_name || 'Select a Project';
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  const [isUpdatingSecret, setIsUpdatingSecret] = useState(false);

  const truncateMessage = (message, maxLength = 72) => {
    if (!message) return '';
    return message.length > maxLength ? `${message.slice(0, maxLength).trimEnd()}...` : message;
  };

  const handleUpdateSecret = async () => {
    if (!newSecret.trim() || !activeProject) return;
    setIsUpdatingSecret(true);

    try {
      const response = await fetch(`http://localhost:8080/api/projects/${activeProject.id}/secret`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain' }, // Using text/plain since we are just sending a string
        body: newSecret
      });

      if (!response.ok) throw new Error("Failed to update secret");
      
      alert("Webhook secret updated successfully!");
      setIsSettingsOpen(false);
      setNewSecret('');
      
      // Note: In a full app, you might want to trigger a re-fetch of the projects here
      // so the activeProject state gets the updated secret.
    } catch (error) {
      console.error("Error updating secret:", error);
      alert("Failed to update webhook secret.");
    } finally {
      setIsUpdatingSecret(false);
    }
  };

  return (
    <div className="relative h-full flex">
      {/* MAIN DASHBOARD CONTENT */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {projectName}
          </h1>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <Search size={16} />
              Smart Search
            </button>
            
            <button 
              onClick={() => setIsAiSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
            >
              <Sparkles size={16} />
              Generate
            </button>

            <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Logs Table (Mocked Structure) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                <th className="p-4 font-medium">Commit ID</th>
                <th className="p-4 font-medium">Author</th>
                <th className="p-4 font-medium">Message</th>
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">AI Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
              {mockCommitRows.map((row) => (
                <tr key={row.commitId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td className="p-4 whitespace-nowrap">
                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                      {row.commitId.slice(0, 7)}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">{row.author}</td>
                  <td className="p-4">
                    <span className="block max-w-xl truncate" title={row.message}>
                      {truncateMessage(row.message)}
                    </span>
                  </td>
                  <td className="p-4 whitespace-nowrap">{row.date}</td>
                  <td className="p-4 whitespace-nowrap text-gray-400 dark:text-gray-500">
                    {row.aiSummary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT AI SLIDEBAR (Hidden by default) */}
      {isAiSidebarOpen && (
        <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20">
            <h3 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Sparkles size={16} /> Gemini Assistant
            </h3>
            <button onClick={() => setIsAiSidebarOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 p-4 overflow-y-auto text-gray-600 dark:text-gray-300 text-sm">
            AI Chat interface will go here...
          </div>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <input 
              type="text" 
              placeholder="Ask Gemini to summarize..." 
              className="w-full bg-gray-100 dark:bg-gray-900 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
            />
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Project Settings</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Update Webhook Secret
              </label>
              <input
                type="password"
                placeholder="Enter new GitHub webhook secret"
                value={newSecret}
                onChange={(e) => setNewSecret(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button 
                onClick={handleUpdateSecret}
                disabled={isUpdatingSecret}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {isUpdatingSecret ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}