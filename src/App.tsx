import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { AuditDashboard } from './components/AuditDashboard';
import { AgentDashboard } from './components/AgentDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Logo, LogoMark } from './components/Logo';
import { analyzeCall } from './services/gemini';
import { Moon, Sun, ShieldCheck, Activity, History, Search, Trash2, Calendar, Clock, Phone as PhoneIcon, ChevronRight, AlertCircle, User, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditRecord {
  id: string;
  timestamp: number;
  filename: string;
  mobile: string;
  agentName: string;
  date: string;
  time: string;
  result: any;
}

export default function App() {
  const [view, setView] = useState<'audit' | 'history' | 'dashboard'>('audit');
  const [auditResult, setAuditResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("Initializing Auditor...");
  const [history, setHistory] = useState<AuditRecord[]>([]);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('audit_history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
          // AUTO-LOAD ON START: If there is a previous audit, display the most recent one
          if (parsed.length > 0 && !auditResult) {
            setAuditResult(parsed[0].result);
          }
        }
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('audit_history', JSON.stringify(history));
    }
  }, [history]);

  const loadingMessages = [
    "Identifying Agent and Customer...",
    "Detecting Language...",
    "Verifying Playbook Introduction...",
    "Checking Zero-Tolerance Pre-Pitch Logic...",
    "Evaluating Sales Pitch Parameters...",
    "Analyzing Communication Quality...",
    "Finalizing Quality Score...",
    "Generating Audit Report..."
  ];

  useEffect(() => {
    let interval: any;
    if (isProcessing) {
      let i = 0;
      interval = setInterval(() => {
        setLoadingMessage(loadingMessages[i % loadingMessages.length]);
        i++;
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isProcessing]);

  const parseFilename = (filename: string) => {
    const cleanName = filename.replace(/\.[^/.]+$/, "");
    
    let mobile = 'Unknown';
    let agentName = 'Unknown';
    let date = 'Unknown';
    let time = 'Unknown';

    // Extract 10-digit mobile number
    const mobileMatch = cleanName.match(/\d{10}/);
    if (mobileMatch) mobile = mobileMatch[0];

    // Agent Name List provided by user
    const agents = [
      "Rubiay", "Manjusha", "Sneha", "Vikram", "Saif", "Anirban", "Rakshitha", "Gaurav", "Ashith", 
      "Sameer M", "Shraddha S", "Sahil Sayyed", "Shavez", "Dravid Shekar", "Saloni Shinde", 
      "Sara Kupe", "Huned Shaikh", "Aditya Bhatkar", "Zirgham Raza", "Aakash Rajbhar", 
      "Hamza Agha", "Apurva Bhendekar", "Sandeep Khandzode", "Mahesh Patil", "Shreyash Panchal", 
      "Neha Misal", "Manorama Lanke", "Shahrukh Pathan", "Kajal Panwar", "Darshan Lotankar", 
      "Ramsha Khan", "Tarun Chopra", "Deepak Mishra", "Kiran Ramchandra", "Darshan Shirke", 
      "Swet Singh", "Prateek Katkar", "Kaif Khan", "Rohit Jadhav", "Azman Chaudhary", 
      "Karishma Kamble", "Kedar Kadam", "Santharaj G", "Abhishek Gajbhiye", "Twinkle Sajan", 
      "Noor Mahammad", "Jawaz Pasha", "Vamsi Krishna", "Kamalesh G", "Jasmine Agashiya", 
      "Abilash Immanuel", "Bijith Babuji", "Ganesh Munkamuthaka", "Kaviya Varshini", 
      "Sham Berni", "Praveena C", "Koushik VS", "Agashiya Jasmine"
    ];

    // Check for Store Pattern first
    // Example: kesavadasapuramstore_thesleepcompany_in__Store_Inbound...
    const storeMatch = cleanName.match(/^([a-z]+store)_thesleepcompany_in/i);
    if (storeMatch) {
      agentName = storeMatch[1];
    } else {
      // Check against agent list
      const lowerCleanName = cleanName.toLowerCase().replace(/_/g, ' ');
      for (const agent of agents) {
        const lowerAgent = agent.toLowerCase();
        // Check if agent name (or parts of it) exists in the filename
        if (lowerCleanName.includes(lowerAgent) || (agent === "Ashith" && lowerCleanName.includes("talib"))) {
          // Normalize Jasmine Agashiya
          if (agent === "Agashiya Jasmine") {
            agentName = "Jasmine Agashiya";
          } else {
            agentName = agent;
          }
          break;
        }
      }

      // If still unknown, try to extract the first significant part of the filename
      if (agentName === 'Unknown') {
        const parts = cleanName.split('_').filter(p => 
          p.length > 2 && 
          !p.match(/^\d+$/) && 
          !['thesleepcompany', 'in', 'store', 'inbound', 'outbound'].includes(p.toLowerCase())
        );
        if (parts.length > 0) {
          agentName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        }
      }
    }

    // Extract Date (YYYY-MM-DD)
    const dateMatch = cleanName.match(/\d{4}-\d{2}-\d{2}/);
    if (dateMatch) {
      const dateObj = new Date(dateMatch[0]);
      date = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Extract Time (HH-MM-SS at the end)
    const timeMatch = cleanName.match(/(\d{2}-\d{2}-\d{2})$/);
    if (timeMatch) {
      const timeParts = timeMatch[1].split('-');
      const hr = parseInt(timeParts[0]);
      const ampm = hr >= 12 ? 'PM' : 'AM';
      const displayHr = hr % 12 || 12;
      time = `${displayHr}:${timeParts[1]} ${ampm}`;
    }

    return { mobile, agentName, date, time };
  };

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setError(null);
    setAuditResult(null);

    const { mobile, agentName, date, time } = parseFilename(file.name);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const result = await analyzeCall(base64, file.type);
          
          const enrichedResult = {
            ...result,
            metadata: {
              filename: file.name,
              mobile,
              agentName,
              date,
              time
            }
          };

          setAuditResult(enrichedResult);

          const newRecord: AuditRecord = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: Date.now(),
            filename: file.name,
            mobile,
            agentName,
            date,
            time,
            result: enrichedResult
          };
          
          // AUDIT HISTORY LOG: Add new audit to the history list array
          const updatedHistory = [newRecord, ...history];
          setHistory(updatedHistory);
          
          // AUTO-SAVE FEATURE: Immediately save to browser's permanent memory
          localStorage.setItem('audit_history', JSON.stringify(updatedHistory));

        } catch (err: any) {
          setError(err.message || "Failed to analyze the call. Please try again.");
        } finally {
          setIsProcessing(false);
        }
      };
    } catch (err) {
      setError("Error reading file.");
      setIsProcessing(false);
    }
  };

  const deleteRecord = (id: string) => {
    setHistory(prev => prev.filter(r => r.id !== id));
  };

  const clearAuditHistory = () => {
    // "CLEAR ALL" BUTTON: Clear the history list and the browser's memory
    setHistory([]);
    setAuditResult(null);
    localStorage.removeItem('audit_history');
    setShowClearHistoryConfirm(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="fixed left-0 top-0 h-full w-20 bg-[#0F172A] flex flex-col items-center py-8 gap-8 z-50 hidden md:flex">
        <LogoMark className="w-12 h-12 shadow-2xl" />
        <nav className="flex flex-col gap-6">
          <button 
            onClick={() => setView('audit')}
            className={`p-3 rounded-xl transition-all ${view === 'audit' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <Activity className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setView('history')}
            className={`p-3 rounded-xl transition-all ${view === 'history' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <History className="w-6 h-6" />
          </button>
          <button 
            onClick={() => setView('dashboard')}
            className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            <BarChart3 className="w-6 h-6" />
          </button>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-20 min-h-screen pb-20">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-100 px-8 py-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <Logo />
            <div className="hidden sm:flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Active</span>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <div className="max-w-6xl mx-auto px-8 pt-12">
          <ErrorBoundary>
            {view === 'audit' ? (
              <>
                <div className="mb-12">
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Top Notch Q Auditor</h2>
                  <p className="text-slate-500 font-medium">Perform high-precision, sentiment-aware audits on executives call recordings of The Sleep Company Sales Team.</p>
                </div>

                <AnimatePresence mode="wait">
                  {!auditResult && !isProcessing && (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                    >
                      <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />
                      
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 max-w-2xl mx-auto"
                        >
                          <AlertCircle className="w-5 h-5" />
                          <p className="text-sm font-bold">{error}</p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}

                  {isProcessing && (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-20 text-center"
                    >
                      <div className="relative mb-8">
                        <div className="w-24 h-24 border-4 border-indigo-100 rounded-full"></div>
                        <div className="w-24 h-24 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
                        <ShieldCheck className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 mb-2">Analyzing Call Recording</h3>
                      <p className="text-indigo-600 font-bold tracking-wide animate-pulse">{loadingMessage}</p>
                      <p className="text-slate-400 text-sm mt-8 max-w-xs">
                        Our AI is processing the audio using speaker diarization and evaluating performance against company playbooks.
                      </p>
                    </motion.div>
                  )}

                  {auditResult && (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex items-center justify-between mb-8 max-w-5xl mx-auto px-4">
                        <h3 className="text-xl font-bold text-slate-800">Audit Result</h3>
                        <button 
                          onClick={() => setAuditResult(null)}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2"
                        >
                          Analyze Another Call
                        </button>
                      </div>
                      <AuditDashboard data={auditResult} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : view === 'history' ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-5xl mx-auto"
              >
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 mb-2">Audit History</h2>
                    <p className="text-slate-500 font-medium">Review and manage your previous call audits.</p>
                  </div>
                  {history.length > 0 && (
                    showClearHistoryConfirm ? (
                      <div className="flex items-center gap-2 bg-red-50 p-2 rounded-2xl border border-red-100 shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600 px-2">Are you sure?</span>
                        <button 
                          onClick={clearAuditHistory}
                          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold text-xs transition-all"
                        >
                          Yes, Clear
                        </button>
                        <button 
                          onClick={() => setShowClearHistoryConfirm(false)}
                          className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold text-xs transition-all"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowClearHistoryConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-all"
                      >
                        <Trash2 className="w-4 h-4" /> Clear All
                      </button>
                    )
                  )}
                </div>

                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-slate-200">
                    <History className="w-16 h-16 text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">No audit history found.</p>
                    <button 
                      onClick={() => setView('audit')}
                      className="mt-4 text-indigo-600 font-bold hover:underline"
                    >
                      Start your first audit
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {history.map((record) => (
                      <motion.div 
                        key={record.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-wrap items-center gap-6"
                      >
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-lg">
                          {record.result?.audit_summary?.overall_score || '0'}
                        </div>
                        
                        <div className="flex-1 min-w-[200px]">
                          <div className="flex items-center gap-2 mb-1">
                            <PhoneIcon className="w-3 h-3 text-slate-400" />
                            <span className="text-sm font-bold text-slate-800">{record.mobile}</span>
                          </div>
                          <p className="text-xs text-slate-400 truncate max-w-xs">{record.filename}</p>
                        </div>

                        <div className="flex items-center gap-6 text-slate-500">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span className="text-xs font-medium">{record.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs font-medium">{record.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => {
                              setAuditResult(record.result);
                              setView('audit');
                            }}
                            className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg font-bold text-xs transition-all flex items-center gap-2"
                          >
                            View Report <ChevronRight className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => deleteRecord(record.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-6xl mx-auto"
              >
                <AgentDashboard 
                  history={history} 
                  onViewAudit={(audit) => {
                    setAuditResult(audit);
                    setView('audit');
                  }} 
                  onClearHistory={clearAuditHistory}
                />
              </motion.div>
            )}
          </ErrorBoundary>
        </div>
      </main>

      {/* Footer */}
      <footer className="md:ml-20 py-12 px-8 border-t border-slate-100 text-center">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          WORK IN PROGRESS BY AD:)
        </p>
      </footer>
    </div>
  );
}
