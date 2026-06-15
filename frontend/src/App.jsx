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

  const [projects, setProjects] = useState([]);
  
  const [activeProject, setActiveProject] = useState(() => {
    const saved = localStorage.getItem('activeProject');
    return saved ? JSON.parse(saved) : null;
  });

  const handleSetActiveProject = (project) => {
    setActiveProject(project);
    if (project) {
      localStorage.setItem('activeProject', JSON.stringify(project));
    } else {
      localStorage.removeItem('activeProject');
    }
  };
  
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
      if (session && session.user) {
        try {
          const response = await fetch(`http://localhost:8080/api/projects/user/${session.user.id}`,{
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}` 
          }
        });
          if (response.ok) {
            const data = await response.json();
            setProjects(data);
          }
        } catch (error) {
          console.error("Error communicating with Spring Boot:", error);
        }
      } else {
        setProjects([]);
      }
    };
    fetchProjects();
  }, [session]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={session ? <Navigate to="/home" replace /> : <Login />} />
        
        {/* Pass the new handler down instead of the raw setActiveProject */}
        <Route element={
          <AppLayout 
            session={session} 
            projects={projects} 
            activeProject={activeProject} 
            setActiveProject={handleSetActiveProject} 
          />
        }>
          <Route path="/home" element={
            <Home 
              projects={projects} 
              setProjects={setProjects} 
              setActiveProject={handleSetActiveProject} 
            />
          } />
          <Route path="/dashboard" element={
            activeProject ? <Dashboard key={activeProject.id} activeProject={activeProject} session={session} /> : <Navigate to="/home" replace />
          } />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;