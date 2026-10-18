import { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  BookOpen,
  Sparkles,
  Terminal,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import { ArxivPaper } from './lib/db';
import { MOCK_PAPERS, MOCK_DAILY_METRICS } from './lib/mockData';
import MetricsChart from './components/MetricsChart';
import PaperList from './components/PaperList';

export default function App() {
  const [loading, setLoading] = useState<boolean>(false);
  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [totalPapers, setTotalPapers] = useState<number>(0);
  const [papers, setPapers] = useState<ArxivPaper[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'papers'>('metrics');

  const fetchMetricsAndPapers = async () => {
    try {
      const resMetrics = await fetch('/.netlify/functions/get-metrics');
      const dataMetrics = await resMetrics.json();

      if (dataMetrics.connected && dataMetrics.metrics?.length > 0) {
        setDbConnected(true);
        setMetrics(dataMetrics.metrics);
        setTotalPapers(dataMetrics.totalPapers || 0);

        const resPapers = await fetch('/.netlify/functions/get-papers');
        const dataPapers = await resPapers.json();
        if (dataPapers.papers) {
          setPapers(dataPapers.papers);
        }
      } else {
        setDbConnected(dataMetrics.connected || false);
        setMetrics(MOCK_DAILY_METRICS);
        setTotalPapers(MOCK_PAPERS.length + 149);
        setPapers(MOCK_PAPERS);
      }
    } catch (err) {
      console.warn('API error, relying on mock fallback dataset', err);
      setDbConnected(false);
      setMetrics(MOCK_DAILY_METRICS);
      setTotalPapers(189);
      setPapers(MOCK_PAPERS);
    }
  };

  useEffect(() => {
    fetchMetricsAndPapers();
  }, []);

  const triggerArxivIngestion = async () => {
    setLoading(true);
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] Triggering ArXiv background ingestion function...`]);

    try {
      const res = await fetch('/.netlify/functions/fetch-arxiv-background', {
        method: 'POST',
      });
      const data = await res.json();

      if (data.logs) {
        setLogs((prev) => [...prev, ...data.logs]);
      } else {
        setLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] Background function launched: ${data.message || 'Accepted'}`
        ]);
      }

      setLastSync(new Date().toLocaleTimeString());

      setTimeout(() => {
        fetchMetricsAndPapers();
      }, 2000);
    } catch (error: any) {
      const msg = error?.message || 'Error executing background ingestion function';
      setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()} ERROR] ${msg}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                LLM-Metrics <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">arXiv cs.AI</span>
              </h1>
              <p className="text-xs text-gray-400">Educational Dataset & Language Metrics for Abstract Synthesis</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 text-xs px-3 py-1.5 rounded-lg border ${
              dbConnected
                ? 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50'
                : 'bg-amber-950/50 text-amber-300 border-amber-800/50'
            }`}>
              <Database className="w-3.5 h-3.5" />
              <span>{dbConnected ? 'Mongo Atlas Connected' : 'Demo / Mock Data Mode'}</span>
              {dbConnected ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              )}
            </div>

            <button
              onClick={triggerArxivIngestion}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all cursor-pointer active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Fetching ArXiv Papers...' : 'Fetch Last Day Papers'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {dbConnected === false && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start space-x-3 text-amber-200 text-sm">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-amber-300">Notice: MongoDB Atlas connection not detected.</span> Displaying simulated paper metrics and abstracts. Configure your <code className="bg-amber-900/40 px-1.5 py-0.5 rounded text-amber-100">MONGODB_URI</code> in Netlify Environment Variables to connect your Mongo Atlas cluster.
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl bg-gray-900/90 border border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Papers Stored</p>
              <p className="text-2xl font-bold text-white mt-1">{totalPapers.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-indigo-950/50 text-indigo-400 border border-indigo-800/30 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-gray-900/90 border border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Subject Field</p>
              <p className="text-lg font-bold text-white mt-1">Artificial Intelligence</p>
              <p className="text-xs text-gray-400">Category cs.AI</p>
            </div>
            <div className="p-3 bg-blue-950/50 text-blue-400 border border-blue-800/30 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-gray-900/90 border border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ingestion Pipeline</p>
              <p className="text-lg font-bold text-white mt-1">Netlify Background</p>
              <p className="text-xs text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ready
              </p>
            </div>
            <div className="p-3 bg-emerald-950/50 text-emerald-400 border border-emerald-800/30 rounded-lg">
              <Terminal className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-xl bg-gray-900/90 border border-gray-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Last Sync Attempt</p>
              <p className="text-lg font-bold text-white mt-1">{lastSync || 'Just now'}</p>
              <p className="text-xs text-gray-400">Daily automated batch</p>
            </div>
            <div className="p-3 bg-purple-950/50 text-purple-400 border border-purple-800/30 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="flex border-b border-gray-800 space-x-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'metrics'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Daily Collection Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('papers')}
            className={`pb-3 flex items-center space-x-2 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'papers'
                ? 'border-indigo-500 text-indigo-400 font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Abstract Dataset ({papers.length})</span>
          </button>
        </div>

        {activeTab === 'metrics' ? (
          <div className="space-y-6">
            <MetricsChart metrics={metrics} />
          </div>
        ) : (
          <div className="space-y-6">
            <PaperList papers={papers} />
          </div>
        )}

        <div className="rounded-xl border border-gray-800 bg-gray-900/90 overflow-hidden shadow-md">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="w-full px-5 py-3 flex justify-between items-center bg-gray-900 hover:bg-gray-800/80 transition-colors text-left cursor-pointer"
          >
            <div className="flex items-center space-x-2 text-sm font-semibold text-gray-300">
              <Terminal className="w-4 h-4 text-indigo-400" />
              <span>Background Function Logs & Execution Trace ({logs.length})</span>
            </div>
            {showLogs ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </button>

          {showLogs && (
            <div className="p-4 bg-gray-950 font-mono text-xs text-gray-300 space-y-1.5 max-h-60 overflow-y-auto border-t border-gray-800">
              {logs.length === 0 ? (
                <p className="text-gray-500 italic">No logs captured yet. Click "Fetch Last Day Papers" to trigger execution traces.</p>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="leading-relaxed border-b border-gray-900/50 pb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </main>

      <footer className="border-t border-gray-900 py-6 mt-12 bg-gray-950 text-center text-xs text-gray-500">
        <p>LLM-Metrics Educational Abstract Analysis Pipeline &bull; Deployed on Netlify &bull; MongoDB Atlas</p>
      </footer>
    </div>
  );
}
