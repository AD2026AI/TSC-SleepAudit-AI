import React, { useState, useMemo } from 'react';
import { 
  BarChart3, Users, TrendingUp, Award, MessageSquare, 
  ChevronDown, ChevronUp, Star, Activity, Target, 
  ShieldAlert, Brain, Lightbulb, User, Store, Calendar,
  Search, Filter, ArrowUpRight, ArrowDownRight, Trash2,
  ArrowUpDown, CheckSquare, Square, X, Info, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip 
} from 'recharts';
import { generateCoachingFeedback } from '../services/gemini';

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

interface AgentStats {
  agentName: string;
  teamType: string;
  totalAudits: number;
  avgScore: number;
  avgSentiment: number;
  pitchRating: number;
  trend: 'up' | 'down' | 'stable';
  sparklineData: { score: number }[];
  recentAudits: AuditRecord[];
  radarData: any[];
  heatmapData: any[];
}

interface Props {
  history: AuditRecord[];
  onViewAudit: (audit: any) => void;
  onClearHistory: () => void;
}

export const AgentDashboard: React.FC<Props> = ({ history, onViewAudit, onClearHistory }) => {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [coachingData, setCoachingData] = useState<any>(null);
  const [isGeneratingCoaching, setIsGeneratingCoaching] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof AgentStats | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'desc' });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [comparisonAgents, setComparisonAgents] = useState<string[]>([]);
  const [isComparisonMode, setIsComparisonMode] = useState(false);

  const agentStats = useMemo(() => {
    const groups: { [key: string]: AuditRecord[] } = {};
    
    // Filter history by date range first
    const filteredHistory = (history || []).filter(record => {
      if (!record || !record.result || !record.result.audit_summary) return false;
      if (!startDate && !endDate) return true;
      
      const recordDate = new Date(record.timestamp);
      if (startDate && recordDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (recordDate > end) return false;
      }
      return true;
    });

    filteredHistory.forEach(record => {
      const name = record.agentName || record.result.audit_summary.agent_name || 'Unknown';
      if (!groups[name]) groups[name] = [];
      groups[name].push(record);
    });

    return Object.entries(groups).map(([name, audits]) => {
      const totalAudits = audits.length;
      const avgScore = audits.reduce((acc, curr) => {
        const score = parseInt(curr.result.audit_summary.overall_score) || 0;
        return acc + score;
      }, 0) / totalAudits;
      
      const avgSentiment = audits.reduce((acc, curr) => {
        const score = curr.result.key_identifiers?.customer_engagement_score;
        const numericScore = typeof score === 'number' ? score : parseInt(String(score).split('/')[0]) || 0;
        return acc + numericScore;
      }, 0) / totalAudits;

      // Pitch Rating calculation based on fatal parameters and consistency
      const fatalPassRate = audits.reduce((acc, curr) => {
        const fatalParams = ['pre_pitch_fatal', 'fatal_behavior_5', 'fatal_ownership_10'];
        const passCount = fatalParams.filter(p => curr.result.grading_sheet?.[p]?.status === 'Pass').length;
        return acc + (passCount / fatalParams.length);
      }, 0) / totalAudits;
      
      const pitchRating = Math.min(5, Math.max(1, Math.round(fatalPassRate * 5)));

      // Radar Data (6 axes)
      const axes = [
        { axis: 'Greetings', key: 'greeting_5' },
        { axis: 'Need Creation', key: 'needs_assessment_20' },
        { axis: 'Rapport', key: 'communication_10' },
        { axis: 'Product Pitch', key: 'sales_pitch_20' },
        { axis: 'Cross-selling', key: 'cross_sell' },
        { axis: 'Closing', key: 'closing_15' }
      ];

      const radarData = axes.map(ax => {
        const passCount = audits.filter(a => a.result.grading_sheet?.[ax.key]?.status === 'Pass').length;
        return { subject: ax.axis, A: (passCount / totalAudits) * 100, fullMark: 100 };
      });

      // Heatmap Data (Daily averages)
      const dailyScores: { [key: string]: number[] } = {};
      audits.forEach(a => {
        const d = a.date || 'Unknown';
        if (!dailyScores[d]) dailyScores[d] = [];
        const score = parseInt(a.result.audit_summary.overall_score) || 0;
        dailyScores[d].push(score);
      });

      const heatmapData = Object.entries(dailyScores).map(([date, scores]) => ({
        date,
        score: scores.reduce((a, b) => a + b, 0) / scores.length
      })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const sparklineData = audits
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(a => ({ score: parseInt(a.result.audit_summary.overall_score) || 0 }));

      return {
        agentName: name,
        teamType: audits[0].result.audit_summary.team_type || 'Unknown',
        totalAudits,
        avgScore: Math.round(avgScore),
        avgSentiment: parseFloat(avgSentiment.toFixed(1)),
        pitchRating,
        trend: avgScore > 80 ? 'up' : avgScore > 60 ? 'stable' : 'down',
        sparklineData,
        recentAudits: audits.sort((a, b) => b.timestamp - a.timestamp),
        radarData,
        heatmapData
      } as AgentStats;
    });
  }, [history, startDate, endDate]);

  const sortedAgents = useMemo(() => {
    let items = [...agentStats];
    
    if (searchTerm) {
      items = items.filter(a => a.agentName.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortConfig.key) {
      items.sort((a, b) => {
        const aValue = a[sortConfig.key!];
        const bValue = b[sortConfig.key!];
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return items;
  }, [agentStats, searchTerm, sortConfig]);

  const handleSort = (key: keyof AgentStats) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const toggleComparison = (name: string) => {
    setComparisonAgents(prev => 
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const handleAgentClick = async (agent: AgentStats) => {
    if (selectedAgent === agent.agentName) {
      setSelectedAgent(null);
      setCoachingData(null);
      return;
    }

    setSelectedAgent(agent.agentName);
    setIsGeneratingCoaching(true);
    setCoachingData(null);

    try {
      const feedback = await generateCoachingFeedback(agent);
      setCoachingData(feedback);
    } catch (e) {
      console.error("Coaching generation failed", e);
    } finally {
      setIsGeneratingCoaching(false);
    }
  };

  const downloadCSV = () => {
    // Filter history based on current search and date filters
    const filteredHistory = history.filter(record => {
      if (!record || !record.result || !record.result.audit_summary) return false;
      
      // Date filter
      const recordDate = new Date(record.timestamp);
      if (startDate && recordDate < new Date(startDate)) return false;
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (recordDate > end) return false;
      }
      
      // Search filter
      if (searchTerm) {
        const name = record.agentName || record.result.audit_summary.agent_name || 'Unknown';
        if (!name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      }
      
      return true;
    });

    if (filteredHistory.length === 0) return;

    const headers = [
      "Date", "Time", "Agent Name", "Store/HO", "Lead Bucket",
      "Product Category", "Model Name",
      "Greeting Score", "Greeting Feedback",
      "Pre-Pitch Status", "Pre-Pitch Feedback",
      "Needs Assessment Score", "Needs Assessment Feedback",
      "Sales Pitch Score", "Sales Pitch Feedback",
      "Cross-Sell Status", "Cross-Sell Feedback",
      "Closing Score", "Closing Feedback",
      "Communication Score", "Communication Feedback",
      "Hold/Mute Score", "Hold/Mute Feedback",
      "Overall Quality Score (%)", "Fatal Error Reasons",
      "Call Summary",
      "Areas of Improvement (AOI)",
      "Primary Pain Point",
      "Quality of Lead",
      "Customer Engagement Score",
      "Timeline to Purchase",
      "Competitors Mentioned",
      "Price Sensitivity",
      "Pincode Provided",
      "Decision Maker",
      "Call Ending Type",
      "Store Visit Scope",
      "Store Visit Insight",
      "Closure Probability",
      "Closure Sentiment",
      "Interest Factor",
      "Buying Signals",
      "Closure Blockers",
      "Closure Synopsis"
    ];

    const rows = filteredHistory.map(record => {
      const res = record.result;
      const summary = res.audit_summary || {};
      const grading = res.grading_sheet || {};
      const identifiers = res.key_identifiers || {};
      const closure = identifiers.closure_prediction || {};
      const aoi = res.aoi_feedback || [];

      return [
        record.date,
        record.time,
        record.agentName || summary.agent_name,
        summary.team_type,
        summary.lead_bucket,
        identifiers.product_category,
        identifiers.product_pitched,
        grading.greeting_5?.score || grading.greeting_5?.status,
        grading.greeting_5?.reason,
        grading.pre_pitch_fatal?.status,
        grading.pre_pitch_fatal?.reason,
        grading.needs_assessment_20?.score || grading.needs_assessment_20?.status,
        grading.needs_assessment_20?.reason,
        grading.sales_pitch_20?.score || grading.sales_pitch_20?.status,
        grading.sales_pitch_20?.reason,
        grading.cross_sell?.status,
        grading.cross_sell?.reason,
        grading.closing_15?.score || grading.closing_15?.status,
        grading.closing_15?.reason,
        grading.communication_10?.score || grading.communication_10?.status,
        grading.communication_10?.reason,
        grading.hold_mute_5?.score || grading.hold_mute_5?.status,
        grading.hold_mute_5?.reason,
        summary.overall_score,
        summary.fatal_error_reason || "",
        summary.call_summary,
        aoi.join(" | "),
        identifiers.primary_pain_point,
        identifiers.quality_of_lead,
        identifiers.customer_engagement_score,
        identifiers.timeline_to_purchase,
        (identifiers.competitors_mentioned || []).join(", "),
        identifiers.price_sensitivity,
        identifiers.pincode_provided,
        identifiers.decision_maker,
        identifiers.call_ending_type,
        identifiers.store_visit_scope,
        identifiers.store_visit_insight,
        closure.probability,
        closure.sentiment,
        closure.interest_factor,
        (closure.buying_signals || []).join(", "),
        (closure.closure_blockers || []).join(", "),
        closure.synopsis
      ].map(val => `"${String(val || "").replace(/"/g, '""')}"`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Detailed_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">Agent Dashboard</h2>
          <p className="text-slate-500 font-medium">Multi-call aggregation and specialized coaching analytics.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Date Range Filters */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs font-bold text-slate-600 focus:outline-none bg-transparent"
            />
            <span className="text-slate-300">to</span>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs font-bold text-slate-600 focus:outline-none bg-transparent"
            />
            {(startDate || endDate) && (
              <button 
                onClick={() => { setStartDate(''); setEndDate(''); }}
                className="p-1 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>

          {/* Comparison Mode Toggle */}
          <button 
            onClick={() => {
              setIsComparisonMode(!isComparisonMode);
              if (isComparisonMode) setComparisonAgents([]);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-sm border ${
              isComparisonMode 
                ? 'bg-indigo-600 text-white border-indigo-500' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            {isComparisonMode ? `Comparing (${comparisonAgents.length})` : 'Compare Agents'}
          </button>

          {showClearConfirm ? (
            <div className="flex items-center gap-2 bg-red-50 p-2 rounded-2xl border border-red-100 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-red-600 px-2">Are you sure?</span>
              <button 
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-xl font-bold text-xs transition-all"
              >
                Yes, Clear
              </button>
              <button 
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-bold text-xs transition-all"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-red-100 hover:bg-red-600 hover:text-white transition-all shadow-sm"
            >
              <ShieldAlert className="w-4 h-4" />
              Clear All Data (Admin)
            </button>
          )}
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#00D1FF] transition-colors" />
            <input 
              type="text" 
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-[#00D1FF]/20 focus:border-[#00D1FF] transition-all shadow-sm"
            />
          </div>

          <button 
            onClick={downloadCSV}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-slate-800 transition-all shadow-lg active:scale-95"
          >
            <Download className="w-4 h-4" />
            Download Detailed Audit Report (CSV)
          </button>
        </div>
      </div>

      {/* Comparison View */}
      <AnimatePresence>
        {isComparisonMode && comparisonAgents.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-[#0F172A] rounded-[2.5rem] p-8 text-white shadow-2xl overflow-hidden border border-white/10"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-xl">
                  <Users className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-widest">Agent Comparison</h3>
              </div>
              <button 
                onClick={() => setComparisonAgents([])}
                className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Clear Selection
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {comparisonAgents.map(name => {
                const agent = agentStats.find(a => a.agentName === name);
                if (!agent) return null;
                return (
                  <div key={name} className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-lg">
                        {name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-black text-lg">{name}</p>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{agent.teamType}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Quality</p>
                        <p className="text-xl font-black text-[#00D1FF]">{agent.avgScore}%</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Sentiment</p>
                        <p className="text-xl font-black text-indigo-400">{agent.avgSentiment}/10</p>
                      </div>
                    </div>

                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={agent.radarData}>
                          <PolarGrid stroke="#334155" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                          <Radar
                            name={name}
                            dataKey="A"
                            stroke="#00D1FF"
                            fill="#00D1FF"
                            fillOpacity={0.3}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agent Summary Table */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <div className="flex items-center gap-2">
                    {isComparisonMode && <CheckSquare className="w-4 h-4 text-indigo-600" />}
                    Agent & Team
                  </div>
                </th>
                <th 
                  className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('totalAudits')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Total Audits
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'totalAudits' ? 'text-indigo-600' : 'text-slate-300'}`} />
                  </div>
                </th>
                <th 
                  className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('avgScore')}
                >
                  <div className="flex items-center justify-center gap-2 group/tip relative">
                    Avg. Quality
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'avgScore' ? 'text-indigo-600' : 'text-slate-300'}`} />
                    <div className="absolute bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 normal-case font-medium">
                      Average score across all audited parameters (0-100%).
                    </div>
                  </div>
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">
                  Quality Trend
                </th>
                <th 
                  className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('avgSentiment')}
                >
                  <div className="flex items-center justify-center gap-2 group/tip relative">
                    Avg. Sentiment
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'avgSentiment' ? 'text-indigo-600' : 'text-slate-300'}`} />
                    <div className="absolute bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 normal-case font-medium">
                      Customer engagement score based on tone and responsiveness (1-10).
                    </div>
                  </div>
                </th>
                <th 
                  className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center cursor-pointer hover:text-indigo-600 transition-colors"
                  onClick={() => handleSort('pitchRating')}
                >
                  <div className="flex items-center justify-center gap-2 group/tip relative">
                    Pitch Rating
                    <ArrowUpDown className={`w-3 h-3 ${sortConfig.key === 'pitchRating' ? 'text-indigo-600' : 'text-slate-300'}`} />
                    <div className="absolute bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[9px] rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all z-50 normal-case font-medium">
                      Consistency and quality of the product pitch (1-5 Stars).
                    </div>
                  </div>
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {sortedAgents.map((agent) => (
                <React.Fragment key={agent.agentName}>
                  <tr 
                    onClick={() => isComparisonMode ? toggleComparison(agent.agentName) : handleAgentClick(agent)}
                    className={`group cursor-pointer transition-colors hover:bg-slate-50/80 ${selectedAgent === agent.agentName || comparisonAgents.includes(agent.agentName) ? 'bg-indigo-50/30' : ''}`}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        {isComparisonMode ? (
                          <div className={`p-1 rounded-md transition-colors ${comparisonAgents.includes(agent.agentName) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                            {comparisonAgents.includes(agent.agentName) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                            {agent.agentName.charAt(0)}
                          </div>
                        )}
                        <div className="relative group/synopsis">
                          <p className="font-bold text-slate-900 group-hover:text-[#00D1FF] transition-colors">{agent.agentName}</p>
                          <p className="text-xs font-medium text-slate-400">{agent.teamType}</p>
                          
                          {/* Quick Synopsis Tooltip */}
                          <div className="absolute left-0 top-full mt-2 w-64 p-4 bg-[#0F172A] text-white rounded-2xl shadow-2xl opacity-0 invisible group-hover/synopsis:opacity-100 group-hover/synopsis:visible transition-all z-50 border border-white/10 backdrop-blur-xl">
                            <p className="text-[10px] font-black text-[#00D1FF] uppercase tracking-widest mb-2">Quick Synopsis</p>
                            <p className="text-xs leading-relaxed text-slate-300">
                              {agent.agentName} shows a {agent.trend} trend with an average quality score of {agent.avgScore}%. 
                              Key strengths include {[...agent.radarData].sort((a, b) => b.A - a.A)[0]?.subject || 'N/A'}, while 
                              {[...agent.radarData].sort((a, b) => a.A - b.A)[0]?.subject || 'N/A'} may require additional coaching.
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-black text-slate-600">
                        {agent.totalAudits}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-black ${
                          agent.avgScore >= 85 ? 'text-[#00D1FF]' : agent.avgScore >= 70 ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {agent.avgScore}%
                        </span>
                        <div className="flex items-center gap-1 mt-1">
                          {agent.trend === 'up' ? <ArrowUpRight className="w-3 h-3 text-green-500" /> : <ArrowDownRight className="w-3 h-3 text-red-500" />}
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{agent.trend}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="h-10 w-24 mx-auto">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={agent.sparklineData}>
                            <Area 
                              type="monotone" 
                              dataKey="score" 
                              stroke={agent.trend === 'up' ? '#10b981' : agent.trend === 'down' ? '#ef4444' : '#6366f1'} 
                              fill={agent.trend === 'up' ? '#10b981' : agent.trend === 'down' ? '#ef4444' : '#6366f1'} 
                              fillOpacity={0.1} 
                              strokeWidth={2}
                              isAnimationActive={false}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-400" />
                        <span className="font-bold text-slate-700">{agent.avgSentiment}/10</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3 h-3 ${i < agent.pitchRating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {selectedAgent === agent.agentName ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Section */}
                  <AnimatePresence>
                    {selectedAgent === agent.agentName && (
                      <tr>
                        <td colSpan={6} className="px-8 py-0">
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="py-12 space-y-12 border-t border-slate-100">
                              {/* Deep Dive Analytics */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Radar Chart */}
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-indigo-100 rounded-xl">
                                      <Target className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    <div className="flex items-center gap-2 group/radar relative">
                                      <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Performance Radar (6 Axes)</h4>
                                      <Info className="w-3 h-3 text-slate-400 cursor-help" />
                                      <div className="absolute left-0 top-full mt-2 w-64 p-4 bg-slate-800 text-white text-[10px] rounded-xl opacity-0 invisible group-hover/radar:opacity-100 group-hover/radar:visible transition-all z-50 normal-case font-medium shadow-xl border border-white/10">
                                        <p className="font-bold text-[#00D1FF] mb-2 uppercase tracking-widest">Axis Definitions:</p>
                                        <ul className="space-y-1.5 list-disc pl-3">
                                          <li><span className="font-bold">Greetings:</span> Professional opening & brand identity.</li>
                                          <li><span className="font-bold">Need Creation:</span> Deep discovery of customer pain points.</li>
                                          <li><span className="font-bold">Rapport:</span> Tone, empathy, and active listening.</li>
                                          <li><span className="font-bold">Product Pitch:</span> SmartGRID technology & benefit explanation.</li>
                                          <li><span className="font-bold">Cross-selling:</span> Offering pillows, protectors, or accessories.</li>
                                          <li><span className="font-bold">Closing:</span> Clear CTA and professional sign-off.</li>
                                        </ul>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={agent.radarData}>
                                        <PolarGrid stroke="#e2e8f0" />
                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                        <Radar
                                          name={agent.agentName}
                                          dataKey="A"
                                          stroke="#00D1FF"
                                          fill="#00D1FF"
                                          fillOpacity={0.3}
                                        />
                                      </RadarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>

                                {/* Heatmap / Trend Chart */}
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                                  <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-[#00D1FF]/10 rounded-xl">
                                      <TrendingUp className="w-5 h-5 text-[#00D1FF]" />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Improvement Heatmap (Daily Trend)</h4>
                                  </div>
                                  <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <AreaChart data={agent.heatmapData}>
                                        <defs>
                                          <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00D1FF" stopOpacity={0.3}/>
                                            <stop offset="95%" stopColor="#00D1FF" stopOpacity={0}/>
                                          </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis 
                                          dataKey="date" 
                                          axisLine={false} 
                                          tickLine={false} 
                                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                          dy={10}
                                        />
                                        <YAxis 
                                          domain={[0, 100]} 
                                          axisLine={false} 
                                          tickLine={false} 
                                          tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                                        />
                                        <RechartsTooltip 
                                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                        />
                                        <Area 
                                          type="monotone" 
                                          dataKey="score" 
                                          stroke="#00D1FF" 
                                          strokeWidth={4}
                                          fillOpacity={1} 
                                          fill="url(#colorScore)" 
                                        />
                                      </AreaChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              </div>

                              {/* Coaching Engine */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* TL Feedback */}
                                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D1FF]/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-[#00D1FF]/10 transition-colors"></div>
                                  
                                  <div className="flex items-center gap-4 mb-8 relative z-10">
                                    <div className="p-3 bg-[#00D1FF]/10 rounded-2xl border border-[#00D1FF]/20">
                                      <Brain className="w-6 h-6 text-[#00D1FF]" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black uppercase tracking-[0.2em]">Team Leader Feedback</h4>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Focus: Sales Push & Conversion</p>
                                    </div>
                                  </div>

                                  {isGeneratingCoaching ? (
                                    <div className="space-y-4 animate-pulse">
                                      <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                                      <div className="h-4 bg-slate-800 rounded w-full"></div>
                                      <div className="h-4 bg-slate-800 rounded w-5/6"></div>
                                    </div>
                                  ) : coachingData ? (
                                    <div className="space-y-6 relative z-10">
                                      <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                                        <p className="text-sm leading-relaxed text-slate-300 italic">
                                          {coachingData?.tl_feedback?.analysis || 'Analysis unavailable.'}
                                        </p>
                                      </div>
                                      <div className="space-y-3">
                                        <p className="text-[10px] font-black text-[#00D1FF] uppercase tracking-widest flex items-center gap-2">
                                          <MessageSquare className="w-3 h-3" /> Recommended Talk-Track
                                        </p>
                                        <div className="p-5 bg-[#00D1FF]/5 rounded-2xl border border-[#00D1FF]/10 border-l-4 border-l-[#00D1FF]">
                                          <p className="text-sm font-bold text-white leading-relaxed">
                                            "{coachingData?.tl_feedback?.talk_track || 'Talk-track unavailable.'}"
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-slate-500 text-sm italic">Select an agent to generate AI coaching insights.</p>
                                  )}
                                </div>

                                {/* Trainer Feedback */}
                                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-indigo-100 transition-colors"></div>
                                  
                                  <div className="flex items-center gap-4 mb-8 relative z-10">
                                    <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                      <Lightbulb className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    <div>
                                      <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Trainer Feedback</h4>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Focus: Speil Mechanics & Knowledge</p>
                                    </div>
                                  </div>

                                  {isGeneratingCoaching ? (
                                    <div className="space-y-4 animate-pulse">
                                      <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                                      <div className="h-4 bg-slate-100 rounded w-5/6"></div>
                                    </div>
                                  ) : coachingData ? (
                                    <div className="space-y-6 relative z-10">
                                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-sm leading-relaxed text-slate-600 font-medium">
                                          {coachingData?.trainer_feedback?.analysis || 'Analysis unavailable.'}
                                        </p>
                                      </div>
                                      <div className="space-y-3">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                          <Target className="w-3 h-3" /> Roleplay Focus
                                        </p>
                                        <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 border-l-4 border-l-indigo-600">
                                          <p className="text-sm font-bold text-slate-800 leading-relaxed">
                                            {coachingData?.trainer_feedback?.roleplay_focus || 'Roleplay focus unavailable.'}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-slate-400 text-sm italic">Select an agent to generate AI coaching insights.</p>
                                  )}
                                </div>
                              </div>

                              {/* Call Log */}
                              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                                <div className="flex items-center justify-between mb-8">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-xl">
                                      <Calendar className="w-5 h-5 text-slate-600" />
                                    </div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest">Historical Call Log</h4>
                                  </div>
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{agent.totalAudits} Total Records</span>
                                </div>
                                <div className="space-y-3">
                                  {agent.recentAudits.map((audit) => (
                                    <div 
                                      key={audit.id}
                                      className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:border-[#00D1FF]/30 transition-all group"
                                    >
                                      <div className="flex items-center gap-6">
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</span>
                                          <span className="text-sm font-bold text-slate-700">{audit.date}</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200"></div>
                                        <div className="flex flex-col">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score</span>
                                          <span className={`text-sm font-black ${
                                            parseInt(audit.result.audit_summary.overall_score) >= 85 ? 'text-[#00D1FF]' : 'text-slate-700'
                                          }`}>
                                            {audit.result.audit_summary.overall_score}
                                          </span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-200 hidden sm:block"></div>
                                        <div className="hidden sm:flex flex-col">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</span>
                                          <span className="text-sm font-bold text-slate-700">{audit.result.key_identifiers?.product_pitched || 'N/A'}</span>
                                        </div>
                                      </div>
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onViewAudit(audit.result);
                                        }}
                                        className="px-6 py-2 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-xl border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm"
                                      >
                                        View Report
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
