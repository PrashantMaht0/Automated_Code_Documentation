import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './services/supabase';
import Login from './pages/Login';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/dashboard';
import Home from './pages/Home';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Shared App State
  const [projects, setProjects] = useState([
    { id: '1', repo_name: 'Frontend Migration', webhook_secret: 'wh_abc123' },
    { id: '2', repo_name: 'AI Integration Core', webhook_secret: 'wh_xyz789' }
  ]);
  const [activeProject, setActiveProject] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      // Only attempt to fetch if we have a securely authenticated user
      if (session && session.user) {
        try {
          const response = await fetch(`http://localhost:8080/api/projects/user/${session.user.id}`);
          
          if (response.ok) {
            const data = await response.json();
            setProjects(data); // Populate the sidebar!
          } else {
            console.error("Failed to fetch projects from the server.");
          }
        } catch (error) {
          console.error("Error communicating with Spring Boot:", error);
        }
      } else {
        // If the user logs out, clear the sidebar
        setProjects([]);
      }
    };

    fetchProjects();
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-500">
        Authenticating...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/home" replace /> : <Login />} />
        
        {/* Protected Dashboard Shell */}
        <Route element={
          <AppLayout 
            session={session} 
            projects={projects} 
            activeProject={activeProject} 
            setActiveProject={setActiveProject} 
          />
        }>
          <Route path="/home" element={
            <Home 
              projects={projects} 
              setProjects={setProjects} 
              setActiveProject={setActiveProject} 
            />
          } />
          <Route path="/dashboard" element={
            activeProject ? <Dashboard activeProject={activeProject} /> : <Navigate to="/home" replace />
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;