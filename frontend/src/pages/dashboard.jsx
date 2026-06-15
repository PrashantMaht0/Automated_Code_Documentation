import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Settings, X, Loader2 } from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function Dashboard({ activeProject ,session}) {
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const projectName = activeProject?.repo_name || 'Select a Project';
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [newSecret, setNewSecret] = useState('');
  const [isUpdatingSecret, setIsUpdatingSecret] = useState(false);

  const [logs, setLogs] = useState([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const [selectedCommit, setSelectedCommit] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const isSearchingRef = React.useRef(false);

  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatScrollRef = React.useRef(null); 

  useEffect(() => {
    setSearchQuery('');
    isSearchingRef.current = false;
    setSelectedCommit(null);

    let intervalId = null;

    const fetchLogs = async (isBackground = false) => {
      if (!activeProject) return;
      if (isBackground && isSearchingRef.current) return;
      
      if (!isBackground) {
        setLogs([]); 
        setIsLoadingLogs(true);
      }

      try {
        const response = await fetch(`http://localhost:8080/api/logs/project/${activeProject.id}`, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            }
          });
        if (response.ok) {
          const data = await response.json();
          setLogs(data);

          const hasPendingSummaries = data.some(log => !log.aiSummary);

          if (hasPendingSummaries && !intervalId) {
            intervalId = setInterval(() => {
              fetchLogs(true); 
            }, 3000); 
          } 
          else if (!hasPendingSummaries && intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
        } else {
          console.error("Failed to fetch logs");
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        if (!isBackground) setIsLoadingLogs(false);
      }
    };

    fetchLogs();

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeProject]);

  const handleUpdateSecret = async () => {
    if (!newSecret.trim() || !activeProject) return;
    setIsUpdatingSecret(true);

    try {
      const response = await fetch(`http://localhost:8080/api/projects/${activeProject.id}/secret`, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/plain',
          'Authorization': `Bearer ${session.access_token}`
         },
        body: newSecret
      });

      if (!response.ok) throw new Error("Failed to update secret");
      
      alert("Webhook secret updated successfully!");
      setIsSettingsOpen(false);
      setNewSecret('');
    } catch (error) {
      console.error("Error updating secret:", error);
      alert("Failed to update webhook secret.");
    } finally {
      setIsUpdatingSecret(false);
    }
  };

  const handleSmartSearch = async (e) => {
    e.preventDefault();
    if (!activeProject) return;
    
    if (!searchQuery.trim()) {
      clearSearch();
      return;
    }

    isSearchingRef.current = true; 
    setIsLoadingLogs(true);
    setLogs([]); 
    try {
      const response = await fetch(`http://localhost:8080/api/logs/project/${activeProject.id}/search?query=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLogs(data); 
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const clearSearch = async () => {
    setSearchQuery('');
    isSearchingRef.current = false;
    setIsLoadingLogs(true);
    try {
      const response = await fetch(`http://localhost:8080/api/logs/project/${activeProject.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (response.ok) {
        setLogs(await response.json());
      }
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (isAiSidebarOpen && activeProject) {
      fetch(`http://localhost:8080/api/chat/project/${activeProject.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })
        .then(res => res.json())
        .then(data => setChatMessages(data))
        .catch(err => console.error("Failed to load chat history:", err));
    }
  }, [isAiSidebarOpen, activeProject]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isChatLoading]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeProject) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'USER', content: userText }]);
    setIsChatLoading(true);

    try {
      const response = await fetch(`http://localhost:8080/api/chat/project/${activeProject.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' ,
          'Authorization': `Bearer ${session.access_token}`
        },
        body: userText
      });
      
      if (response.ok) {
        const aiResponseText = await response.text();
        setChatMessages(prev => [...prev, { role: 'ASSISTANT', content: aiResponseText }]);
      }
    } catch (error) {
      console.error("Chat failed:", error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleDownloadReport = (content) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AI-Report-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = (content) => {
    const doc = new jsPDF();
    doc.setFont("helvetica");
    doc.setFontSize(11);
    
    const splitText = doc.splitTextToSize(content, 180);
    
    let yPosition = 15; 
    for (let i = 0; i < splitText.length; i++) {
      if (yPosition > 280) { 
        doc.addPage();
        yPosition = 15; 
      }
      doc.text(splitText[i], 15, yPosition);
      yPosition += 6; 
    }
    
    doc.save(`AI-Report-${new Date().toISOString().split('T')[0]}.pdf`);
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
            {/* NEW: Smart Search Form */}
            <form onSubmit={handleSmartSearch} className="flex items-center relative">
              <input 
                type="text"
                placeholder="Semantic search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 py-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
              <Search size={16} className="absolute left-3 text-gray-400" />
              {searchQuery && (
                <button 
                  type="button" 
                  onClick={() => { setSearchQuery(''); window.location.reload(); }} 
                  className="absolute right-3 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </form>
            
            <button 
              onClick={() => setIsAiSidebarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition shadow-sm"
            >
              <Sparkles size={16} />
              Generate
            </button>

            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Dynamic Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                <th className="p-4 font-medium w-24">Hash</th>
                <th className="p-4 font-medium w-32">Author</th>
                <th className="p-4 font-medium w-48">Commit Message</th>
                <th className="p-4 font-medium">AI Summary</th>
                <th className="p-4 font-medium w-40">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-gray-800 dark:text-gray-200">
              {isLoadingLogs ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                    Fetching repository logs...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-400">
                    No commit logs recorded yet. Push code to GitHub to see it here!
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const dateObj = new Date(log.commitTimestamp);
                  const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => setSelectedCommit(log)}
                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700/50 transition"
                    >
                      <td className="p-4 whitespace-nowrap">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                          {log.commitHash.slice(0, 7)}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap font-medium text-sm">
                        {log.author}
                      </td>
                      <td className="p-4">
                        <span className="block max-w-[200px] truncate text-sm text-gray-600 dark:text-gray-300" title={log.message}>
                          {log.message}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="block max-w-sm text-sm font-medium text-gray-600 dark:text-gray-300" title={log.aiSummary}>
                          {log.aiSummary || "Generating..."}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formattedDate}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RIGHT AI SLIDEBAR */}
      {isAiSidebarOpen && (
        <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col absolute right-0 top-0 bottom-0 z-40 transition-transform transform translate-x-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20">
            <h3 className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-2">
              <Sparkles size={16} /> Gemini
            </h3>
            <button onClick={() => setIsAiSidebarOpen(false)} className="text-gray-500 hover:text-gray-800 dark:hover:text-white transition">
              <X size={20} />
            </button>
          </div>
          
          {/* Chat Messages Area */}
          <div ref={chatScrollRef} className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
            {chatMessages.length === 0 && !isChatLoading && (
              <div className="text-center text-sm text-gray-500 mt-10">
                Ask Gemini to generate a weekly summary, explain a commit, or write documentation based on your code!
              </div>
            )}
            
            {chatMessages.map((msg, index) => (
              <div key={index} className={`flex flex-col ${msg.role === 'USER' ? 'items-end' : 'items-start'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm shadow-sm ${msg.role === 'USER' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                  <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                </div>
                {/* Show Download Buttons for AI Reports */}
                {msg.role === 'ASSISTANT' && msg.content.length > 100 && (
                  <div className="flex gap-4 mt-2 ml-1">
                    <button 
                      onClick={() => handleDownloadReport(msg.content)}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition"
                    >
                      ↓ Download .md
                    </button>
                    <button 
                      onClick={() => handleDownloadPdf(msg.content)}
                      className="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium transition"
                    >
                      ↓ Download .pdf
                    </button>
                  </div>
                )}
              </div>
            ))}

            {isChatLoading && (
              <div className="flex items-start">
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex gap-2 items-center text-gray-500">
                  <Loader2 size={16} className="animate-spin" />
                  <span className="text-sm">Analyzing commits...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input 
                type="text" 
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about your codebase..." 
                disabled={isChatLoading}
                className="flex-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white disabled:opacity-50 transition"
              />
              <button 
                type="submit"
                disabled={isChatLoading || !chatInput.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition disabled:opacity-50"
              >
                Send
              </button>
            </form>
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

      {/* --- NEW: VIEW COMMIT MODAL --- */}
      {selectedCommit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col border border-gray-200 dark:border-gray-700 overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex justify-between items-start p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Commit Details
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                  <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded font-mono">
                    {selectedCommit.commitHash.slice(0, 7)}
                  </span>
                  <span>by <span className="font-medium text-gray-700 dark:text-gray-300">{selectedCommit.author}</span></span>
                  <span>•</span>
                  <span>{new Date(selectedCommit.commitTimestamp).toLocaleString()}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCommit(null)} 
                className="p-2 text-gray-500 hover:text-gray-800 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Scrollable Content Body */}
            <div className="flex-1 p-6 overflow-y-auto">

              {/* NEW: AI Summary Highlight Box */}
              {selectedCommit.aiSummary && (
                <div className="mb-8">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-400 mb-2 uppercase tracking-wider flex items-center gap-2">
                     AI Generated Summary
                  </h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                    <p className="text-blue-800 dark:text-blue-300 font-medium text-sm">
                      {selectedCommit.aiSummary}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">Commit Message</h4>
                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-100 dark:border-gray-800">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm">
                    {selectedCommit.message}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 uppercase tracking-wider">File Changes</h4>
                
                {/* Syntax Highlighted Raw Diff */}
                <div className="bg-gray-900 rounded-lg p-4 font-mono text-xs md:text-sm text-gray-300 shadow-inner border border-gray-700 overflow-x-auto">
                  {selectedCommit.rawDiff && selectedCommit.rawDiff !== "Diff unavailable or repository is private." ? (
                    <pre className="whitespace-pre-wrap">
                      {selectedCommit.rawDiff.split('\n').map((line, index) => {
                        let textColor = "text-gray-300";
                        if (line.startsWith('+') && !line.startsWith('+++')) textColor = "text-green-400";
                        if (line.startsWith('-') && !line.startsWith('---')) textColor = "text-red-400";
                        if (line.startsWith('@@')) textColor = "text-blue-400";
                        
                        return (
                          <div key={index} className={textColor}>
                            {line}
                          </div>
                        );
                      })}
                    </pre>
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      <p>Raw code diffs are not available for this commit.</p>
                      <p className="text-xs mt-2">Make sure your repo is public, or supply a GitHub token in the backend.</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}