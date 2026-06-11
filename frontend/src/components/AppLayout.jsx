import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Moon, Sun, Folder, Plus, LogOut, Home as HomeIcon } from 'lucide-react';
import { supabase } from '../services/supabase';

export default function AppLayout({ session, projects, activeProject, setActiveProject }) {
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Extract real GitHub profile details from the OAuth session
  const userMetadata = session?.user?.user_metadata || {};
  const avatarUrl = userMetadata.avatar_url || '';
  const username = userMetadata.user_name || 'Developer';

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [darkMode]);

  const handleProjectClick = (proj) => {
    setActiveProject(proj);
    navigate('/dashboard');
  };

  const handleLogoutConfirm = async () => {
    await supabase.auth.signOut();
    setShowLogoutConfirm(false);
    navigate('/', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">AI Dev Logger</h2>
        </div>
        
        <div className="flex-1 px-4 space-y-1 overflow-y-auto">
          {/* Main Home Navigation Shortcut */}
          <Link 
            to="/home" 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm transition ${
              location.pathname === '/home' 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white' 
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
            }`}
          >
            <HomeIcon size={16} />
            Hub Overview
          </Link>

          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6 px-3">Projects</p>
          
          {/* Loop over reactive project list */}
          {projects.map((proj) => (
            <button
              key={proj.id}
              onClick={() => handleProjectClick(proj)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-sm w-full text-left transition ${
                activeProject?.id === proj.id && location.pathname === '/dashboard'
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              }`}
            >
              <Folder size={16} />
              <span className="truncate">{proj.repo_name}</span>
            </button>
          ))}

          <Link to="/home" className="flex items-center gap-3 px-3 py-2 text-dashed text-gray-400 hover:text-blue-500 rounded-lg w-full text-left text-sm mt-2">
            <Plus size={16} />
            Add New Repository
          </Link>
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg w-full text-left text-sm"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>

      {/* VIEWPORT CONTROLLER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* UPPER BANNER INTERFACE */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
          <div className="flex-1" />
          
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="flex items-center gap-2 border-l pl-4 border-gray-200 dark:border-gray-700">
              {avatarUrl && <img src={avatarUrl} alt="GitHub Profile" className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-600" />}
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{username}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Outlet />
        </main>
      </div>

      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 dark:border dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm logout</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Are you sure you want to log out?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleLogoutConfirm}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}