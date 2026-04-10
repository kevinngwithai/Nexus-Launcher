/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Terminal, ExternalLink, RefreshCw, Settings, Combine, Puzzle, Network, Atom, Wrench } from 'lucide-react';

interface AppInfo {
  id: string;
  name: string;
  description: string;
  type: 'docker' | 'conda' | 'npm';
  command: string;
  cwd: string;
  port?: number;
  status: 'running' | 'stopped';
}

export default function App() {
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showConfig, setShowConfig] = useState(false);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/apps');
      const data = await res.json();
      setApps(data);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
    const interval = setInterval(fetchApps, 5000); // Poll status every 5s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!activeLogId) return;
    
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/apps/${activeLogId}/logs`);
        const data = await res.json();
        setLogs(data.logs);
      } catch (error) {
        console.error('Failed to fetch logs:', error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 2000);
    return () => clearInterval(interval);
  }, [activeLogId]);

  const handleRestart = async (id: string) => {
    setApps(currentApps => currentApps.map(app => 
      app.id === id ? { ...app, status: 'stopped' } : app
    ));
    
    try {
      await fetch(`/api/apps/${id}/stop`, { method: 'POST' });
      await fetch(`/api/apps/${id}/start`, { method: 'POST' });
      fetchApps();
    } catch (error) {
      console.error('Failed to restart app:', error);
      fetchApps();
    }
  };

  const getAppIcon = (id: string) => {
    switch (id) {
      case 'fusiondesign': return <Combine className="w-10 h-10 text-cyan-400" strokeWidth={1.5} />;
      case 'gramm_web': 
      case 'gramm-app': return <Puzzle className="w-10 h-10 text-purple-400" strokeWidth={1.5} />;
      case 'receptorligandanalyzer': return <Network className="w-10 h-10 text-emerald-400" strokeWidth={1.5} />;
      case 'grotop-modify': return <Wrench className="w-10 h-10 text-amber-400" strokeWidth={1.5} />;
      default: return <Atom className="w-10 h-10 text-slate-400" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-300 p-8 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 relative overflow-hidden">
      {/* Tech Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-cyan-500 opacity-20 blur-[100px]"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 flex items-center gap-4">
              <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Atom className="w-8 h-8 text-cyan-400" />
              </div>
              NEXUS_CONTROL
            </h1>
            <p className="text-slate-400 mt-3 text-sm font-mono uppercase tracking-widest">Unified telemetry & module orchestration</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowConfig(!showConfig)}
              className={`p-2.5 rounded-xl transition-all duration-300 border ${showConfig ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'}`}
              title="Toggle Setup Instructions"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={fetchApps}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-all duration-300"
              title="Refresh Status"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </header>

        {showConfig && (
          <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
            <div className="flex items-start gap-4">
              <Settings className="w-6 h-6 text-cyan-400 mt-0.5 flex-shrink-0 animate-[spin_4s_linear_infinite]" />
              <div className="text-sm text-slate-300 w-full font-mono">
                <p className="font-bold mb-4 text-lg text-white tracking-wider uppercase">System Configuration</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-1 text-cyan-300 uppercase tracking-wider text-xs">1. Create Conda Environment:</p>
                      <div className="bg-black/60 border border-white/10 text-cyan-50 p-3 rounded-lg text-xs overflow-x-auto shadow-inner">
                        conda create -n app -c conda-forge nodejs=20 -y<br/>
                        conda activate app
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold mb-1 text-cyan-300 uppercase tracking-wider text-xs">2. Prepare Launcher:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-400">
                        <li>Extract the downloaded ZIP to <code>~/app-launcher</code></li>
                        <li>Navigate: <code className="bg-white/10 text-cyan-200 px-1.5 py-0.5 rounded">cd ~/app-launcher</code></li>
                        <li>Install: <code className="bg-white/10 text-cyan-200 px-1.5 py-0.5 rounded">npm install</code></li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold mb-1 text-cyan-300 uppercase tracking-wider text-xs">3. Verify Paths:</p>
                      <p className="mb-1 text-slate-400">Ensure <code>apps.config.ts</code> matches your local directories:</p>
                      <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
                        <li>/Users/kevin/fusiondesign</li>
                        <li>/Users/kevin/gramm_web</li>
                        <li>/Users/kevin/receptorligandanalyzer</li>
                        <li>/Users/kevin/grotop</li>
                      </ul>
                    </div>

                    <div>
                      <p className="font-semibold mb-1 text-rose-400 uppercase tracking-wider text-xs">Troubleshooting Docker:</p>
                      <div className="bg-rose-500/10 text-rose-300 p-3 rounded-lg text-xs border border-rose-500/20">
                        <p>If you see <code>failed to connect to the docker API</code> in the logs, <strong>Docker Desktop</strong> is not running. Please launch Docker Desktop from your Mac Applications folder before starting GRAMM Dock.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-32">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500 border-t-transparent shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {apps.map((app) => (
              <div key={app.id} className="relative group bg-black/40 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 rounded-2xl overflow-hidden transition-all duration-500 shadow-[0_0_0_rgba(0,0,0,0)] hover:shadow-[0_0_30px_rgba(6,182,212,0.15)]">
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="relative p-6 flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-cyan-500/30 transition-colors">
                      {getAppIcon(app.id)}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest ${
                        app.status === 'running' ? 'text-emerald-400' : 'text-slate-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          app.status === 'running' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-slate-600'
                        }`}></span>
                        {app.status === 'running' ? 'System Active' : 'Offline'}
                      </span>
                      <span className="px-2 py-1 text-[9px] font-mono uppercase tracking-widest rounded bg-white/5 text-slate-400 border border-white/10">
                        {app.type} Engine
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 tracking-wide">{app.name}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{app.description}</p>
                </div>
                
                <div className="relative border-t border-white/10 p-4 bg-black/20 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (app.status === 'running' && app.port) {
                          window.open(`http://localhost:${app.port}`, '_blank');
                        }
                      }}
                      disabled={app.status !== 'running' || !app.port}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-300 ${
                        app.status === 'running'
                          ? 'bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 hover:bg-cyan-500 hover:text-black hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                          : 'bg-white/5 border border-white/5 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" /> 
                      {app.status === 'running' ? 'Initialize Link' : 'Booting...'}
                    </button>
                    
                    <button
                      onClick={() => setActiveLogId(activeLogId === app.id ? null : app.id)}
                      className={`flex items-center gap-2 px-3 py-2 text-xs font-mono uppercase tracking-wider rounded-lg transition-all duration-300 ${
                        activeLogId === app.id 
                          ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300' 
                          : 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <Terminal className="w-4 h-4" /> Logs
                    </button>
                  </div>
                  
                  <button
                    onClick={() => handleRestart(app.id)}
                    className="p-2 text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-lg transition-colors border border-transparent hover:border-cyan-500/30"
                    title="Reboot Sequence"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Logs Modal/Panel */}
        {activeLogId && (
          <div className="mt-8 bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex flex-col h-96 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="bg-white/5 px-5 py-3 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3 text-cyan-400 font-mono text-xs uppercase tracking-widest">
                <Terminal className="w-4 h-4" />
                System Console // {apps.find(a => a.id === activeLogId)?.name}
              </div>
              <button 
                onClick={() => setActiveLogId(null)}
                className="text-slate-400 hover:text-rose-400 transition-colors text-xs font-mono uppercase tracking-wider bg-white/5 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 px-3 py-1.5 rounded-md"
              >
                Terminate
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-grow font-mono text-xs text-slate-300 space-y-1.5">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic flex items-center gap-2">
                  <span className="animate-pulse">_</span> Awaiting telemetry...
                </div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`${log.includes('ERROR') ? 'text-rose-400 font-semibold' : 'text-emerald-400/80'}`}>
                    <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
