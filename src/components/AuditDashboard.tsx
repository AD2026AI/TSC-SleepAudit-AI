import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, User, Phone, Globe, Award, MessageSquare, Activity, X, Info, Power, CheckCircle, TrendingUp, Brain, Target, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GradingItem {
  status: string;
  reason: string;
}

interface AuditData {
  audit_summary: {
    agent_name: string;
    team_type: string;
    language: string;
    overall_score: string;
    call_summary: string;
  };
  key_identifiers?: {
    product_pitched: string;
    primary_pain_point: string;
    quality_of_lead: string;
    customer_engagement_score: number | string;
    timeline_to_purchase: string;
    competitors_mentioned: string[];
    price_sensitivity: string;
    pincode_provided: string;
    decision_maker: string;
    call_ending_type?: string;
    store_visit_scope?: string;
    store_visit_insight?: string;
    closure_prediction?: {
      probability: string;
      sentiment: string;
      interest_factor: string;
      buying_signals: string[];
      closure_blockers: string[];
      synopsis: string;
    };
  };
  grading_sheet: {
    [key: string]: GradingItem;
  };
  aoi_feedback: string[];
  transcript?: {
    speaker: string;
    original: string;
    english: string;
  }[];
  call_transcript?: string;
  metadata?: {
    filename: string;
    mobile?: string;
    agentName?: string;
    date?: string;
    time?: string;
  };
}

interface Props {
  data: AuditData;
}

export const AuditDashboard: React.FC<Props> = ({ data }) => {
  const [selectedItem, setSelectedItem] = useState<{ key: string; label: string; item: GradingItem } | null>(null);

  if (!data || !data.audit_summary) {
    return (
      <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800">Invalid Audit Data</h3>
        <p className="text-slate-500">The audit report could not be generated correctly. Please try again.</p>
      </div>
    );
  }

  const scoreValue = data.audit_summary.overall_score && data.audit_summary.overall_score !== 'N/A' ? parseInt(data.audit_summary.overall_score) : 0;
  const isVoicemail = data.audit_summary.overall_score === 'N/A';
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-[#00D1FF]';
    if (score >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'Pass') return <CheckCircle2 className="w-5 h-5 text-[#00D1FF]" />;
    if (status === 'Fail') return <XCircle className="w-5 h-5 text-red-500" />;
    return <AlertCircle className="w-5 h-5 text-gray-400" />;
  };

  const parameterLabels: { [key: string]: string } = {
    greeting_5: "Greeting & Introduction (5%)",
    pre_pitch_fatal: "Mandatory Pre-Pitch (FATAL)",
    needs_assessment_20: "Needs Assessment (20%)",
    sales_pitch_20: "Sales Pitch (20%)",
    cross_sell: "Cross-Sell (Pass/Fail/NA)",
    closing_15: "Closing (15%)",
    communication_10: "Communication (10%)",
    hold_mute_5: "Hold/Mute (5%)",
    fatal_behavior_5: "Advisor Behavior (FATAL)",
    fatal_ownership_10: "Ownership/Resolution (FATAL)"
  };

  return (
    <div className="space-y-6">
      <motion.div 
        id="audit-report-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 max-w-5xl mx-auto p-4 bg-slate-50 rounded-3xl"
      >
      {/* Synopsis Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-xl">
                    <Info className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Audit Synopsis</h3>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
              <div className="p-8">
                <div className="mb-6">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Parameter</p>
                  <p className="text-lg font-bold text-slate-800">{selectedItem.label}</p>
                </div>
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                      selectedItem.item.status === 'Pass' ? 'bg-green-100 text-green-700' : 
                      selectedItem.item.status === 'Fail' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {selectedItem.item.status}
                    </span>
                    {getStatusIcon(selectedItem.item.status)}
                  </div>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-sm text-slate-600 leading-relaxed font-medium">
                      {selectedItem.item.reason}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="w-full py-4 bg-[#0F172A] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                >
                  Close Synopsis
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* File Info Section - Brand Aligned */}
      {data.metadata && (
        <div className="bg-[#0F172A] text-white p-8 rounded-3xl shadow-2xl border border-slate-800 flex flex-wrap gap-10 items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00D1FF]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-[#00D1FF]/10 rounded-2xl border border-[#00D1FF]/20">
              <Phone className="w-6 h-6 text-[#00D1FF]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Mobile Number</p>
              <p className="font-mono text-xl font-bold text-white tracking-tight">{data.metadata.mobile || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-[#00D1FF]/10 rounded-2xl border border-[#00D1FF]/20">
              <User className="w-6 h-6 text-[#00D1FF]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Agent Name</p>
              <p className="text-xl font-bold text-white tracking-tight">{data.metadata.agentName || data.audit_summary.agent_name || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-[#00D1FF]/10 rounded-2xl border border-[#00D1FF]/20">
              <Activity className="w-6 h-6 text-[#00D1FF]" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Call Date & Time</p>
              <p className="text-xl font-bold text-white tracking-tight">{data.metadata.date || 'N/A'} • {data.metadata.time || 'N/A'}</p>
            </div>
          </div>

          <div className="flex-1 min-w-[200px] relative z-10">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.2em] mb-1">Audited File</p>
            <p className="text-sm font-medium text-slate-300 truncate">{data.metadata.filename}</p>
          </div>
        </div>
      )}

      {/* Summary Header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#0F172A] p-8 rounded-3xl shadow-xl border border-slate-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#00D1FF]/5 to-transparent"></div>
          <div className={`text-6xl font-black mb-3 relative z-10 ${isVoicemail ? 'text-slate-400' : getScoreColor(scoreValue)}`}>
            {data.audit_summary.overall_score}
          </div>
          <div className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
            {isVoicemail ? 'Audit Status' : 'Overall Quality Score'}
          </div>
        </div>
        
        <div className="md:col-span-3 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Language</p>
                <p className="font-bold text-slate-800">{data.audit_summary.language}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-50 rounded-2xl">
                <Award className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Team Type</p>
                <p className="font-bold text-slate-800">{data.audit_summary.team_type}</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-slate-50">
            <h4 className="text-xs font-black text-slate-900 mb-4 flex items-center gap-2 uppercase tracking-widest">
              <MessageSquare className="w-4 h-4 text-indigo-600" /> Call Summary
            </h4>
            <div className="text-slate-600 text-sm leading-relaxed font-medium space-y-4 whitespace-pre-wrap">
              {data.audit_summary.call_summary}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grading Sheet */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <Award className="w-5 h-5 text-indigo-600" /> Grading Sheet
          </h3>
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-4 tracking-widest italic">Click any parameter to view detailed synopsis</p>
          <div className="space-y-2">
            {(Object.entries(data.grading_sheet) as [string, GradingItem][]).map(([key, item]) => (
              <button 
                key={key} 
                onClick={() => setSelectedItem({ key, label: parameterLabels[key] || key, item })}
                className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group text-left"
              >
                <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900 transition-colors">{parameterLabels[key] || key}</span>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    item.status === 'Pass' ? 'bg-green-100 text-green-700' : 
                    item.status === 'Fail' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {item.status}
                  </span>
                  {getStatusIcon(item.status)}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Areas of Improvement */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 mb-6 flex items-center gap-2 uppercase tracking-widest">
            <AlertCircle className="w-5 h-5 text-red-600" /> Areas of Improvement
          </h3>
          {data.aoi_feedback && data.aoi_feedback.length > 0 ? (
            <div className="space-y-4">
              {data.aoi_feedback.map((feedback, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-4 p-6 bg-red-50/30 rounded-2xl border border-red-100/50"
                >
                  <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 font-black text-red-600 text-xs">
                    {index + 1}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed font-medium">{feedback}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center bg-green-50/30 rounded-3xl border border-dashed border-green-200">
              <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-green-800 font-black uppercase tracking-widest text-xs">Excellent Performance!</p>
              <p className="text-green-600/70 text-xs mt-2">No critical areas of improvement identified.</p>
            </div>
          )}
        </div>
      </div>

      {/* Key Identifiers Section */}
      {data.key_identifiers && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-widest">
            <Activity className="w-5 h-5 text-indigo-600" /> Key Identifiers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Product Pitched</p>
              <p className="text-sm font-bold text-slate-800">{data.key_identifiers.product_pitched}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Primary Pain Point</p>
              <p className="text-sm font-bold text-slate-800">{data.key_identifiers.primary_pain_point}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Quality of Lead</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                  data.key_identifiers.quality_of_lead.toUpperCase() === 'HOT' ? 'bg-red-100 text-red-700' : 
                  data.key_identifiers.quality_of_lead.toUpperCase() === 'WARM' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {data.key_identifiers.quality_of_lead}
                </span>
              </div>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Customer Engagement Score</p>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-800">
                  {String(data.key_identifiers.customer_engagement_score).includes('/10') 
                    ? data.key_identifiers.customer_engagement_score 
                    : `${data.key_identifiers.customer_engagement_score}/10`}
                </span>
              </div>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Timeline to Purchase</p>
              <p className="text-sm font-bold text-slate-800">{data.key_identifiers.timeline_to_purchase}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Competitors Mentioned</p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(data.key_identifiers.competitors_mentioned) && data.key_identifiers.competitors_mentioned.length > 0 ? (
                  data.key_identifiers.competitors_mentioned.map((comp, i) => (
                    <span key={i} className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-1 rounded-md">{comp}</span>
                  ))
                ) : (
                  <span className="text-sm font-bold text-slate-800">None</span>
                )}
              </div>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Price Sensitivity</p>
              <p className="text-sm font-bold text-slate-800">{data.key_identifiers.price_sensitivity}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Pincode Provided</p>
              <p className="text-sm font-bold text-slate-800">{data.key_identifiers.pincode_provided}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Decision Maker</p>
              <p className="text-sm font-bold text-slate-800">{data.key_identifiers.decision_maker}</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 md:col-span-2 lg:col-span-3">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Store Visit Scope & Outcome</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    data.key_identifiers.store_visit_scope === 'BOOKED' ? 'bg-green-100 text-green-700' : 
                    data.key_identifiers.store_visit_scope === 'MISSED OPPORTUNITY' ? 'bg-red-100 text-red-700' : 
                    data.key_identifiers.store_visit_scope === 'ATTEMPTED & DECLINED' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {data.key_identifiers.store_visit_scope || 'N/A'}
                  </span>
                </div>
                {data.key_identifiers.store_visit_insight && (
                  <div className="p-3 bg-white/50 rounded-xl border border-slate-100">
                    <p className="text-xs font-medium text-slate-600 italic">
                      <span className="font-bold text-slate-400 uppercase mr-2">Insight:</span>
                      {data.key_identifiers.store_visit_insight}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Call Ending</p>
              <div className="flex items-center gap-2">
                {data.key_identifiers.call_ending_type?.toLowerCase() === 'abrupt' ? (
                  <>
                    <Power className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-bold text-red-600">Abrupt Ending</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-bold text-green-600">Proper Ending</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Intelligent Sale Closure Section - Separate Section */}
      {data.key_identifiers?.closure_prediction && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-100 rounded-xl">
              <Brain className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Intelligent Sale Closure Prediction & Synopsis</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Probability of Closure</p>
              </div>
              <p className="text-xl font-black text-slate-900">{data.key_identifiers?.closure_prediction?.probability || 'N/A'}</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Engagement Sentiment</p>
              </div>
              <p className="text-xl font-black text-slate-900">{data.key_identifiers?.closure_prediction?.sentiment || 'N/A'}</p>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-500" />
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Interest Factor</p>
              </div>
              <p className="text-sm font-bold text-slate-700">{data.key_identifiers?.closure_prediction?.interest_factor || 'N/A'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" /> Buying Signals
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(data.key_identifiers?.closure_prediction?.buying_signals) && data.key_identifiers.closure_prediction.buying_signals.map((signal: string, i: number) => (
                  <span key={i} className="text-[11px] font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-xl border border-green-100">
                    "{signal}"
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-3 h-3 text-red-500" /> Closure Blockers
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(data.key_identifiers?.closure_prediction?.closure_blockers) && data.key_identifiers.closure_prediction.closure_blockers.map((blocker: string, i: number) => (
                  <span key={i} className="text-[11px] font-bold bg-red-50 text-red-700 px-3 py-1.5 rounded-xl border border-red-100">
                    {blocker}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 bg-indigo-50/30 rounded-2xl border border-indigo-100">
            <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest mb-3">Intelligence Closure Synopsis</p>
            <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
              {data.key_identifiers?.closure_prediction?.synopsis || 'Synopsis unavailable.'}
            </p>
          </div>
        </div>
      )}

      {/* Transcript Section */}
      {(data.call_transcript || (data.transcript && data.transcript.length > 0)) && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-sm font-black text-slate-900 mb-8 flex items-center gap-2 uppercase tracking-widest">
            <MessageSquare className="w-5 h-5 text-indigo-600" /> Call Transcript
          </h3>
          
          {data.call_transcript ? (
            <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
              <div className="text-slate-700 text-sm leading-relaxed font-medium whitespace-pre-wrap font-mono">
                {data.call_transcript}
              </div>
            </div>
          ) : data.transcript && (
            <div className="space-y-8">
              {data.transcript.map((turn: any, index: number) => {
                const speaker = (turn.speaker || '').toLowerCase();
                const isSystem = speaker.includes('system') || speaker.includes('voicemail') || speaker.includes('ivr');
                const isAgent = speaker === 'agent';
                
                return (
                  <div key={index} className={`flex flex-col ${isSystem ? 'items-center' : isAgent ? 'items-start' : 'items-end'}`}>
                    <div className={`max-w-[85%] space-y-2 ${isSystem ? 'text-center' : isAgent ? 'text-left' : 'text-right'}`}>
                      <div className={`flex items-center gap-2 mb-1 px-1 ${isSystem ? 'justify-center' : isAgent ? 'justify-start' : 'justify-end'}`}>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isSystem ? 'text-red-400' : 'text-slate-400'}`}>
                          {turn.speaker || 'Unknown'}
                        </span>
                      </div>
                      <div className={`p-5 rounded-2xl ${
                        isSystem 
                          ? 'bg-red-50 border border-red-100 text-red-900' 
                          : isAgent 
                            ? 'bg-blue-50 border border-blue-100 text-blue-900 rounded-tl-none' 
                            : 'bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-100'
                      }`}>
                        <p className="text-sm font-medium leading-relaxed">{turn.original || ''}</p>
                        {turn.english && turn.english !== turn.original && (
                          <div className={`mt-3 pt-3 border-t text-xs italic ${
                            isSystem ? 'border-red-200 text-red-700' : isAgent ? 'border-blue-200 text-blue-700' : 'border-white/20 text-blue-100'
                          }`}>
                            {turn.english}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </motion.div>
  </div>
);
};
