import React, { useState } from 'react';
import { Search, Sparkles, Settings, X } from 'lucide-react';

export default function Dashboard({ activeProject }) {
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const projectName = activeProject?.repo_name || 'Select a Project';

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

            <button className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition">
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Logs Table (Mocked Structure) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Commits</th>
                <th className="p-4 font-medium">AI Summary</th>
                <th className="p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
              {/* Row 1 */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td className="p-4 whitespace-nowrap">Oct 24, 2025</td>
                <td className="p-4"><span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">a1b2c3d</span></td>
                <td className="p-4">Refactored the authentication state management.</td>
                <td className="p-4"><button className="text-blue-500 hover:underline">View</button></td>
              </tr>
              {/* Row 2 */}
              <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td className="p-4 whitespace-nowrap">Oct 23, 2025</td>
                <td className="p-4"><span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">f9e8d7c</span></td>
                <td className="p-4">Updated Tailwind configurations for dark mode.</td>
                <td className="p-4"><button className="text-blue-500 hover:underline">View</button></td>
              </tr>
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
    </div>
  );
}