"use client";

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { MOCK_IG_ITEMS, MockIgItem } from '@/lib/instagramMock';
import { Automation, RewindLog, checkKeywordMatch, getRemainingQuota } from '@/lib/db';
import { 
  Play, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  ArrowRight, 
  ArrowLeft,
  ChevronRight,
  Database,
  Users,
  ShieldCheck,
  Send,
  Loader2,
  RefreshCw
} from 'lucide-react';

export default function RewindPage() {
  const { workspace, activeAccountId, automations, rewindLogs, runRewind, activeAccountPosts } = useApp();
  
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1 states
  const [selectedPostId, setSelectedPostId] = useState('');
  const [selectedAutomationId, setSelectedAutomationId] = useState('');

  // Step 2 states (Dry Run)
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResults, setScanResults] = useState<{ username: string; commentText: string; matches: boolean; reason: string }[]>([]);

  // Step 4 states (Execution)
  const [executing, setExecuting] = useState(false);
  const [execProgress, setExecProgress] = useState(0);
  const [executionResult, setExecutionResult] = useState<{
    dmsSent: number;
    skipped: number;
    quotaConsumed: number;
    details?: { username: string; commentText: string; status: 'sent' | 'skipped_duplicate' | 'skipped_no_match' | 'skipped_quota'; reason: string }[];
  } | null>(null);

  // Real comments from API
  const [realComments, setRealComments] = useState<any[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const activeAutomations = automations.filter(
    a => a.instagram_account_id === activeAccountId && a.trigger_type === 'comment'
  );

  const posts = activeAccountPosts;
  const selectedPost = posts.find(p => p.id === selectedPostId);
  const selectedAutomation = activeAutomations.find(a => a.id === selectedAutomationId);

  // Set default selection on load
  useEffect(() => {
    if (posts.length > 0 && !selectedPostId) {
      setSelectedPostId(posts[0].id);
    }
    if (activeAutomations.length > 0 && !selectedAutomationId) {
      setSelectedAutomationId(activeAutomations[0].id);
    }
  }, [activeAccountId, posts, activeAutomations]);

  // Fetch comments of selected post/reel
  useEffect(() => {
    async function fetchPostComments() {
      if (!selectedPostId || !activeAccountId) {
        setRealComments([]);
        return;
      }
      setIsLoadingComments(true);
      try {
        const res = await fetch(`/api/instagram/comments?mediaId=${selectedPostId}&accountId=${activeAccountId}`);
        const data = await res.json();
        if (data.success && data.comments) {
          setRealComments(data.comments);
        } else {
          setRealComments([]);
        }
      } catch (err) {
        console.error("Failed to fetch post comments:", err);
        setRealComments([]);
      } finally {
        setIsLoadingComments(false);
      }
    }
    fetchPostComments();
  }, [selectedPostId, activeAccountId]);

  // Run dry run simulation
  const handleStartDryRun = () => {
    if (!selectedPost || !selectedAutomation) return;
    
    setScanning(true);
    setScanProgress(0);
    setScanResults([]);

    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          
          // Generate scan matches based on comment texts
          const results = realComments.map(comment => {
            const isMatch = checkKeywordMatch(comment.text, selectedAutomation.trigger_config.keywords || []);
            let reason = 'Matches trigger keywords';
            
            if (!isMatch) {
              reason = 'Keyword mismatch';
            }
            
            return {
              username: comment.username,
              commentText: comment.text,
              matches: isMatch,
              reason
            };
          });

          setScanResults(results);
          setStep(2);
          return 100;
        }
        return prev + 20;
      });
    }, 150);
  };

  // Quota verification
  const recipientsCount = scanResults.filter(r => r.matches).length;
  const quota = workspace ? getRemainingQuota(workspace).totalRemaining : 0;
  const hasEnoughQuota = quota >= recipientsCount;

  // Execute rewind
  const handleExecuteRewind = async () => {
    if (!selectedPost || !selectedAutomation) return;
    
    setExecuting(true);
    setExecProgress(0);

    // Simulate progress animation
    for (let p = 10; p <= 100; p += 10) {
      await new Promise(resolve => setTimeout(resolve, 80));
      setExecProgress(p);
    }

    // Run logic in AppContext
    const res = await runRewind(
      selectedAutomation.id,
      selectedPost.id,
      realComments.map(c => ({
        id: c.id,
        username: c.username,
        text: c.text
      }))
    );

    setExecuting(false);

    const dmsSent = res.success ? res.dmsSent : 0;
    setExecutionResult({
      dmsSent,
      skipped: recipientsCount - dmsSent,
      quotaConsumed: dmsSent,
      details: res.results
    });
    setStep(4);
  };

  const handleReset = () => {
    setStep(1);
    setScanProgress(0);
    setScanResults([]);
    setExecutionResult(null);
  };

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Rewind Engine</h1>
        <p className="text-xs text-zinc-505">Scan older comments (up to 7 days) and run active automations retroactively.</p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-between max-w-xl bg-zinc-100 p-3 rounded-xl border border-zinc-200">
        {[
          { num: 1, label: 'Configure' },
          { num: 2, label: 'Dry Run' },
          { num: 3, label: 'Quota Check' },
          { num: 4, label: 'Execute' }
        ].map(s => (
          <div key={s.num} className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
              step === s.num ? 'bg-purple-600 text-white' : 
              step > s.num ? 'bg-green-100 text-green-755 border border-green-200' : 'bg-zinc-200 text-zinc-500'
            }`}>
              {s.num}
            </span>
            <span className={`text-[10px] font-semibold hidden sm:inline ${step === s.num ? 'text-zinc-900' : 'text-zinc-450'}`}>
              {s.label}
            </span>
            {s.num < 4 && <ChevronRight className="w-3.5 h-3.5 text-zinc-400 hidden sm:block" />}
          </div>
        ))}
      </div>

      {/* STEP 1: Select Post & Automation */}
      {step === 1 && (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 glass-panel p-6 flex flex-col gap-5 shadow-sm">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-purple-650" /> Setup Scanning Rule
            </h3>

            {/* Post picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-650">Select Post/Reel to Scan</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                {posts.map(post => (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    className={`p-2.5 rounded-lg border flex gap-3 text-left transition ${selectedPostId === post.id ? 'bg-purple-50 border-purple-500 text-purple-950' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 shadow-sm'}`}
                  >
                    <img 
                      src={post.thumbnail} 
                      alt="thumb" 
                      className="w-12 h-12 object-cover rounded border border-zinc-200 shrink-0"
                    />
                    <div className="flex flex-col justify-center min-w-0">
                      <span className="text-[10px] font-bold text-zinc-900">Post {post.id.split('_')[1]}</span>
                      <p className="text-[10px] text-zinc-505 truncate max-w-[130px] leading-relaxed">{post.caption}</p>
                      <span className="text-[9px] text-purple-605 font-bold mt-0.5">{post.commentsCount} comments available</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Automation picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-zinc-650">Select Active Automation Rule</label>
              <select
                value={selectedAutomationId}
                onChange={(e) => setSelectedAutomationId(e.target.value)}
                className="w-full glass-input text-xs bg-white text-zinc-800"
              >
                {activeAutomations.map(aut => (
                  <option key={aut.id} value={aut.id}>
                    {aut.name} ({aut.trigger_config.keywords?.join(', ') || 'all comment match'})
                  </option>
                ))}
                {activeAutomations.length === 0 && (
                  <option value="" disabled>No active comment rules found.</option>
                )}
              </select>
            </div>

            {/* Submit */}
            <div className="flex justify-end mt-2">
              <button
                type="button"
                disabled={scanning || !selectedPostId || !selectedAutomationId}
                onClick={handleStartDryRun}
                className="btn-gradient px-5 py-2.5 flex items-center gap-1.5 text-xs text-white font-bold shadow-md"
              >
                {scanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Scanning {scanProgress}%
                  </>
                ) : (
                  <>
                    Start Dry Run Scan <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Explanation */}
          <div className="glass-panel p-6 flex flex-col gap-4 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider">How Rewind works</h3>
            <ul className="flex flex-col gap-3 text-xs text-zinc-550 leading-relaxed list-decimal pl-4">
              <li>Choose a post and a rule trigger.</li>
              <li>Instantly scan all comments dropped in the last 7 days.</li>
              <li>Dry run validates keyword matches and filters already-processed users.</li>
              <li>Confirm remaining DM quota and launch retroactive message delivery.</li>
            </ul>
          </div>
        </div>
      )}

      {/* STEP 2: Dry Run Scan Results */}
      {step === 2 && (
        <div className="glass-panel p-6 flex flex-col gap-5 max-w-3xl shadow-sm">
          <div className="flex items-center justify-between border-b border-zinc-150 pb-3">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-650" /> Dry Run scan preview
            </h3>
            <span className="text-[10px] text-zinc-500">Scan found {scanResults.length} total comments</span>
          </div>

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
            {scanResults.map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-white border border-zinc-200 flex justify-between gap-3 text-xs shadow-sm">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="font-bold text-zinc-900">@{item.username}</span>
                  <span className="text-zinc-505 truncate max-w-[250px]">"{item.commentText}"</span>
                </div>
                <div className="flex flex-col items-end justify-center">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    item.matches ? 'bg-purple-50 text-purple-750 border-purple-200' : 'bg-zinc-105 text-zinc-500 border-zinc-200'
                  }`}>
                    {item.matches ? 'Will Send DM' : 'Skip'}
                  </span>
                  <span className="text-[9px] text-zinc-450 mt-0.5">{item.reason}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-3 pt-3 border-t border-zinc-150">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-650 hover:bg-zinc-50 transition shadow-sm"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="btn-gradient px-4 py-2 flex items-center gap-1 text-xs text-white font-bold shadow-md"
            >
              Continue to Quota Check <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Quota Validation & Confirmation */}
      {step === 3 && (
        <div className="glass-panel p-6 flex flex-col gap-5 max-w-xl shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider border-b border-zinc-150 pb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-purple-655" /> Quota consumption check
          </h3>

          <div className="flex flex-col gap-4 text-xs leading-relaxed text-zinc-600">
            <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Estimated DMs to Send</span>
                <span className="text-xl font-extrabold text-zinc-900">{recipientsCount}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Workspace Credit Remaining</span>
                <span className={`text-xl font-extrabold ${hasEnoughQuota ? 'text-green-650' : 'text-red-655'}`}>
                  {quota.toLocaleString()} DMs
                </span>
              </div>
            </div>

            {hasEnoughQuota ? (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-750 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-650" />
                <p>You have sufficient quota. Executing this run will leave you with {quota - recipientsCount} remaining DM credits.</p>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-750 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-655" />
                <div>
                  <span className="font-bold block">Insufficient Quota!</span>
                  <p className="mt-0.5">This run requires {recipientsCount} credits but you only have {quota}. Please upgrade your plan or purchase an add-on pack before executing.</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-3">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-650 hover:bg-zinc-50 transition shadow-sm"
            >
              Back
            </button>
            <button
              disabled={!hasEnoughQuota || executing}
              onClick={handleExecuteRewind}
              className="btn-gradient px-5 py-2.5 flex items-center gap-1.5 text-xs text-white font-bold shadow-md"
            >
              {executing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing {execProgress}%
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" /> Run Rewind Loop
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Execution Outcome & Summary */}
      {step === 4 && (
        <div className="flex flex-col gap-6 max-w-3xl">
          <div className="glass-panel p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center gap-2 text-green-750 font-bold text-sm">
              <CheckCircle className="w-5 h-5" /> Rewind Run Completed Successfully!
            </div>

            <div className="grid grid-cols-3 gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200 text-xs mt-2">
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">DMs Transmitted</span>
                <span className="text-lg font-extrabold text-zinc-900">{executionResult?.dmsSent}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Skipped / Duplicates</span>
                <span className="text-lg font-extrabold text-zinc-600">{executionResult?.skipped}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-zinc-500 font-bold uppercase">Credits Used</span>
                <span className="text-lg font-extrabold text-purple-650">{executionResult?.quotaConsumed}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <button
                onClick={handleReset}
                className="px-4 py-2.5 rounded-lg border border-zinc-200 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 transition flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Start Another Scan
              </button>
            </div>

            {executionResult?.details && executionResult.details.length > 0 && (
              <div className="flex flex-col gap-2 mt-4 border-t border-zinc-150 pt-4">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Processed Comments Detail</h4>
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                  {executionResult.details.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-zinc-50 border border-zinc-250/60 flex justify-between gap-3 text-xs shadow-sm">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-bold text-zinc-900">@{item.username}</span>
                        <span className="text-zinc-505 truncate max-w-[280px]">"{item.commentText}"</span>
                      </div>
                      <div className="flex flex-col items-end justify-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.status === 'sent' ? 'bg-green-50 text-green-750 border-green-200' :
                          item.status === 'skipped_duplicate' ? 'bg-amber-50/70 text-amber-750 border-amber-200' :
                          item.status === 'skipped_quota' ? 'bg-red-55/10 text-red-750 border-red-200' :
                          item.status === 'dm_failed' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                          {item.status === 'sent' ? 'DM Sent' :
                           item.status === 'skipped_duplicate' ? 'Duplicate (Skipped)' :
                           item.status === 'skipped_quota' ? 'Quota Exceeded' :
                           item.status === 'dm_failed' ? 'Failed' :
                           'Skipped'}
                        </span>
                        <span className="text-[9px] text-zinc-450 mt-0.5">{item.reason}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Historical Logs List */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-zinc-605 uppercase tracking-wider">Historical Rewind Logs</h3>
            <div className="glass-panel overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-150 text-[10px] text-zinc-500 font-bold uppercase bg-zinc-50">
                    <th className="p-3">Run Date</th>
                    <th className="p-3">Post ID</th>
                    <th className="p-3">Rule Name</th>
                    <th className="p-3 text-center">DMs Sent</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {rewindLogs.map(log => {
                    const matchedAuto = automations.find(a => a.id === log.automation_id);
                    return (
                      <tr key={log.id} className="hover:bg-zinc-50/50 transition text-zinc-700">
                        <td className="p-3 text-zinc-505">{new Date(log.initiated_at).toLocaleString()}</td>
                        <td className="p-3 font-semibold">Post {log.post_id.split('_')[1]}</td>
                        <td className="p-3 font-medium text-zinc-900">{matchedAuto?.name || 'Deleted Rule'}</td>
                        <td className="p-3 text-center font-bold">{log.dms_sent}</td>
                        <td className="p-3 text-right text-green-650 font-semibold">Success</td>
                      </tr>
                    );
                  })}
                  {rewindLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-zinc-600 font-medium">No previous logs.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
