import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, PlusCircle, Search, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../services/supabase'; 

export default function Home({ projects, setProjects, setActiveProject }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); 
  
  const [newRepoName, setNewRepoName] = useState('');
  const [newSecret, setNewSecret] = useState('');

  const filteredProjects = projects.filter(p => 
    p.repo_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenProject = (proj) => {
    setActiveProject(proj);
    navigate('/dashboard');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found.");
      }

      const payload = {
        userId: user.id,
        email: user.email,
        repoName: newRepoName,
        webhookSecret: newSecret || 'wh_generated_' + Math.random().toString(36).substring(7)
      };

      const response = await fetch('http://localhost:8080/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 409) {
        alert("You are already tracking this repository.");
        setIsSubmitting(false);
        return; 
      }

      if (!response.ok) {
        throw new Error('Failed to create project on the server.');
      }

      const savedProject = await response.json();

      setProjects([...projects, savedProject]);
      setActiveProject(savedProject);
      navigate('/dashboard');

    } catch (error) {
      console.error("Error saving project:", error);
      alert("Failed to save pipeline configuration. Check console for details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 mt-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2">
          Documentation Hub
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Select an active tracking repository or configure a fresh pipeline instance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* PANEL A: CHOOSE CURRENT PROJECT */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-4 text-blue-600 dark:text-blue-400">
            <FolderOpen size={24} />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Pipelines</h2>
          </div>
          
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search working repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto max-h-60 space-y-2 pr-1">
            {filteredProjects.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-6">No matching tracked pipelines found.</p>
            ) : (
              filteredProjects.map(proj => (
                <button
                  key={proj.id}
                  onClick={() => handleOpenProject(proj)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-100 dark:border-gray-700/80 rounded-lg group transition"
                >
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate pr-2">
                    {proj.repo_name}
                  </span>
                  <ArrowRight size={14} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* PANEL B: INTEGRATE FRESH WORKSPACE */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
          {!isCreating ? (
            <div className="flex flex-col items-center justify-center flex-1 py-8 text-center">
              <PlusCircle size={48} className="text-gray-300 dark:text-gray-600 mb-3" />
              <h3 className="font-bold text-gray-900 dark:text-white mb-1">Track New Repository</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mb-6">
                Establish a direct incoming payload hook linking database summaries directly to a repository layout.
              </p>
              <button
                onClick={() => setIsCreating(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition"
              >
                Launch Provisioner Setup
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-4 flex flex-col h-full justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <PlusCircle size={18} className="text-blue-500" /> Pipeline Configuration
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">GitHub Target Repository Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., organization/repo-name"
                      value={newRepoName}
                      onChange={(e) => setNewRepoName(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Webhook Listening Secret (Optional)</label>
                    <input
                      type="password"
                      placeholder="Leave blank to auto-generate hash token"
                      value={newSecret}
                      onChange={(e) => setNewSecret(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  disabled={isSubmitting}
                  className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isSubmitting ? 'Provisioning...' : 'Confirm Hook'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}