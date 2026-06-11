import React from 'react';
import { supabase } from '../services/supabase';
import { LogIn } from 'lucide-react';

export default function Login() {
  const handleGithubLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
    });
    if (error) console.error('Login failed:', error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Dev Logger</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Sign in to manage your automated documentation.</p>
        
        <button 
          onClick={handleGithubLogin}
          className="w-full flex items-center justify-center gap-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition font-medium"
        >
          <LogIn size={20} />
          Continue with GitHub
        </button>
      </div>
    </div>
  );
}