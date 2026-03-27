import React, { useEffect, useState, useRef } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  ShieldCheck, 
  Settings, 
  LayoutDashboard, 
  History, 
  FileText, 
  User,
  Zap,
  Thermometer,
  Gauge,
  Wind,
  BrainCircuit,
  ChevronRight,
  Download,
  Moon,
  Sun
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { formatTimestamp } from './lib/utils';
import { SensorData, Anomaly, SystemHealth } from './types';
import { analyzeAnomaly } from './services/geminiService';

// --- Components ---

const StatCard = ({ title, value, unit, icon: Icon, trend, color }: any) => (
  <div className="bg-card-bg border border-border-ui p-5 rounded-xl shadow-lg">
    <div className="flex justify-between items-start mb-4">
      <div className={color}>
        <Icon size={24} />
      </div>
      {trend && (
        <span className={`text-xs font-mono ${trend > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trend > 0 ? '+' : ''}{trend}%
        </span>
      )}
    </div>
    <h3 className="text-text-secondary text-xs font-mono uppercase tracking-wider mb-1">{title}</h3>
    <div className="flex items-baseline gap-2">
      <span className="text-2xl font-bold text-text-primary">{value}</span>
      <span className="text-text-muted text-sm font-mono">{unit}</span>
    </div>
  </div>
);

const SensorGraph = ({ title, data, dataKey, color, unit }: any) => (
  <div className="bg-card-bg border border-border-ui p-6 rounded-xl h-[300px] flex flex-col">
    <div className="flex justify-between items-center mb-6">
      <h3 className="text-text-primary font-medium flex items-center gap-2">
        <Activity size={18} className="text-text-secondary" />
        {title}
      </h3>
      <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest">Real-time Stream</span>
    </div>
    <div className="flex-1 min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-ui)" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            hide 
          />
          <YAxis 
            stroke="var(--text-muted)" 
            fontSize={10} 
            tickLine={false} 
            axisLine={false}
            tickFormatter={(val) => `${val}${unit}`}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-ui)', borderRadius: '8px', fontSize: '12px' }}
            itemStyle={{ color: 'var(--text-primary)' }}
            labelFormatter={(label) => formatTimestamp(label)}
          />
          <Area 
            type="monotone" 
            dataKey={dataKey} 
            stroke={color} 
            strokeWidth={2}
            fillOpacity={1} 
            fill={`url(#gradient-${dataKey})`} 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default function App() {
  const [telemetry, setTelemetry] = useState<SensorData[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [health, setHealth] = useState<SystemHealth>({
    overall: 98.4,
    subsystems: { ailerons: 99, rudder: 98, elevators: 99, hydraulics: 97 }
  });
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentView, setCurrentView] = useState('Telemetry Stream');
  const [showConfig, setShowConfig] = useState(false);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws.current = new WebSocket(`${protocol}//${window.location.host}`);

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'TELEMETRY') {
        const newData = message.data;
        setTelemetry(prev => [...prev.slice(-29), newData]);
        checkAnomalies(newData);
      }
    };

    return () => ws.current?.close();
  }, []);

  const checkAnomalies = (data: SensorData) => {
    const newAnomalies: Anomaly[] = [];
    
    if (data.vibration > 2.0) {
      newAnomalies.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: data.timestamp,
        type: 'Vibration',
        severity: data.vibration > 3.0 ? 'Critical' : 'High',
        message: `Abnormal vibration detected in Actuator 4B`,
        component: 'Aileron Actuator',
        value: data.vibration
      });
    }

    if (data.hydraulicPressure < 2500) {
      newAnomalies.push({
        id: Math.random().toString(36).substr(2, 9),
        timestamp: data.timestamp,
        type: 'Pressure',
        severity: 'Critical',
        message: `Hydraulic pressure drop: ${data.hydraulicPressure.toFixed(0)} PSI`,
        component: 'Main Hydraulic Loop',
        value: data.hydraulicPressure
      });
    }

    if (newAnomalies.length > 0) {
      setAnomalies(prev => [...newAnomalies, ...prev].slice(0, 50));
      setHealth(h => ({ ...h, overall: Math.max(70, h.overall - 2) }));
    }
  };

  const runAiAnalysis = async (anomaly: Anomaly) => {
    setCurrentView('AI Diagnostics');
    setIsAnalyzing(true);
    setAiInsight(null);
    const insight = await analyzeAnomaly({
      sensorType: anomaly.type,
      value: anomaly.value,
      threshold: anomaly.type === 'Vibration' ? 0.8 : 2800,
      timestamp: new Date(anomaly.timestamp).toISOString(),
      component: anomaly.component
    });
    setAiInsight(insight);
    setIsAnalyzing(false);
    
    // Add to maintenance logs
    setMaintenanceLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      anomalyType: anomaly.type,
      component: anomaly.component,
      insight: insight,
      status: 'Analyzed'
    }, ...prev]);
  };

  const downloadReport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ telemetry, anomalies, maintenanceLogs }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `AeroGuard_Report_${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const renderView = () => {
    switch (currentView) {
      case 'Fleet Overview':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-3 gap-6">
              {[
                { id: 'FCS-737-MAX-042', status: 'Active', health: 98.4, location: 'SFO -> LHR' },
                { id: 'FCS-787-DRM-119', status: 'Maintenance', health: 64.2, location: 'Hangar 4' },
                { id: 'FCS-A350-XWB-005', status: 'Active', health: 99.1, location: 'SIN -> SYD' },
              ].map((plane) => (
                <div key={plane.id} className="bg-card-bg border border-border-ui p-6 rounded-xl">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-bold text-text-primary">{plane.id}</h4>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${plane.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {plane.status}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-secondary">System Health</span>
                      <span className={plane.health > 90 ? 'text-emerald-400' : 'text-rose-400'}>{plane.health}%</span>
                    </div>
                    <div className="w-full bg-border-ui h-1.5 rounded-full overflow-hidden">
                      <div className={`h-full ${plane.health > 90 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${plane.health}%` }}></div>
                    </div>
                    <p className="text-[10px] text-text-muted font-mono mt-4 uppercase tracking-widest">Current Sector: {plane.location}</p>
                  </div>
                  <button 
                    onClick={() => setCurrentView('Telemetry Stream')}
                    className="w-full mt-6 py-2 bg-app-bg border border-border-ui rounded-lg text-xs font-medium hover:bg-border-ui transition-colors"
                  >
                    View Telemetry
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      case 'Telemetry Stream':
        return (
          <div className="space-y-8">
            <div className="grid grid-cols-4 gap-6">
              <StatCard title="Hydraulic Pressure" value={telemetry[telemetry.length - 1]?.hydraulicPressure.toFixed(0) || '---'} unit="PSI" icon={Gauge} trend={-0.2} color="text-blue-400" />
              <StatCard title="System Vibration" value={telemetry[telemetry.length - 1]?.vibration.toFixed(2) || '---'} unit="G-RMS" icon={Zap} trend={1.4} color="text-amber-400" />
              <StatCard title="Operating Temp" value={telemetry[telemetry.length - 1]?.temperature.toFixed(1) || '---'} unit="°C" icon={Thermometer} trend={0.5} color="text-rose-400" />
              <StatCard title="Actuator Load" value="84.2" unit="%" icon={Wind} trend={-2.1} color="text-purple-400" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <SensorGraph title="Vibration Profile" data={telemetry} dataKey="vibration" color="#F59E0B" unit="" />
              <SensorGraph title="Hydraulic Pressure" data={telemetry} dataKey="hydraulicPressure" color="#3B82F6" unit="" />
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1 bg-card-bg border border-border-ui rounded-xl flex flex-col h-[400px]">
                <div className="p-5 border-bottom border-border-ui flex justify-between items-center">
                  <h3 className="font-medium flex items-center gap-2">
                    <AlertTriangle size={18} className="text-rose-400" /> Recent Anomalies
                  </h3>
                  <span className="bg-rose-500/10 text-rose-500 text-[10px] px-2 py-0.5 rounded font-bold">{anomalies.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {anomalies.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                        <ShieldCheck size={48} className="mb-2" />
                        <p className="text-xs font-mono uppercase tracking-widest">No anomalies detected</p>
                      </div>
                    ) : (
                      anomalies.slice(0, 10).map((anomaly) => (
                        <motion.div key={anomaly.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-3 bg-app-bg border border-border-ui rounded-lg cursor-pointer hover:border-blue-500/50 transition-colors group" onClick={() => runAiAnalysis(anomaly)}>
                          <div className="flex justify-between items-start mb-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${anomaly.severity === 'Critical' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'}`}>
                              {anomaly.severity}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">{formatTimestamp(anomaly.timestamp)}</span>
                          </div>
                          <p className="text-xs font-medium text-text-primary mb-1">{anomaly.message}</p>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-text-secondary">{anomaly.component}</span>
                            <ChevronRight size={14} className="text-text-muted group-hover:text-blue-400 transition-colors" />
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="col-span-2 bg-card-bg border border-border-ui rounded-xl flex flex-col h-[400px]">
                <div className="p-5 border-bottom border-border-ui flex items-center gap-2">
                  <BrainCircuit size={18} className="text-blue-400" />
                  <h3 className="font-medium">AI Diagnostic Engine</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {isAnalyzing ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4">
                      <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-sm text-text-secondary font-mono animate-pulse">Analyzing sensor patterns...</p>
                    </div>
                  ) : aiInsight ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-invert prose-sm max-w-none">
                      <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-lg mb-6">
                        <p className="text-blue-400 text-xs font-mono uppercase tracking-widest mb-2">Diagnostic Summary</p>
                        <div className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{aiInsight}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-app-bg p-4 rounded-lg border border-border-ui">
                          <p className="text-[10px] font-mono text-text-muted uppercase mb-1">Predicted RUL</p>
                          <p className="text-xl font-bold text-emerald-400">420 Flight Hours</p>
                        </div>
                        <div className="bg-app-bg p-4 rounded-lg border border-border-ui">
                          <p className="text-[10px] font-mono text-text-muted uppercase mb-1">Maintenance Urgency</p>
                          <p className="text-xl font-bold text-amber-400">NEXT CHECK</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-text-muted opacity-50">
                      <BrainCircuit size={64} className="mb-4" />
                      <p className="text-sm font-medium">Select an anomaly to generate AI-driven root cause analysis</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'Anomalies':
        return (
          <div className="bg-card-bg border border-border-ui rounded-xl overflow-hidden shadow-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-sidebar-bg border-bottom border-border-ui">
                <tr>
                  <th className="p-4 font-mono text-[10px] uppercase text-text-muted">Timestamp</th>
                  <th className="p-4 font-mono text-[10px] uppercase text-text-muted">Type</th>
                  <th className="p-4 font-mono text-[10px] uppercase text-text-muted">Component</th>
                  <th className="p-4 font-mono text-[10px] uppercase text-text-muted">Severity</th>
                  <th className="p-4 font-mono text-[10px] uppercase text-text-muted">Message</th>
                  <th className="p-4 font-mono text-[10px] uppercase text-text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {anomalies.map((anomaly) => (
                  <tr key={anomaly.id} className="border-bottom border-border-ui hover:bg-app-bg transition-colors">
                    <td className="p-4 font-mono text-xs text-text-secondary">{new Date(anomaly.timestamp).toLocaleString()}</td>
                    <td className="p-4 font-medium text-text-primary">{anomaly.type}</td>
                    <td className="p-4 text-text-secondary">{anomaly.component}</td>
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${anomaly.severity === 'Critical' ? 'bg-rose-500/20 text-rose-500' : 'bg-amber-500/20 text-amber-500'}`}>
                        {anomaly.severity}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-text-primary">{anomaly.message}</td>
                    <td className="p-4">
                      <button onClick={() => runAiAnalysis(anomaly)} className="text-blue-400 hover:text-blue-300 text-xs font-medium">Analyze</button>
                    </td>
                  </tr>
                ))}
                {anomalies.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-text-muted font-mono uppercase tracking-widest">No anomaly history found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );

      case 'Maintenance Logs':
        return (
          <div className="space-y-6">
            {maintenanceLogs.map((log) => (
              <div key={log.id} className="bg-card-bg border border-border-ui p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-text-primary mb-1">{log.anomalyType} Diagnostic Report</h4>
                    <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()} | {log.component}</p>
                  </div>
                  <span className="bg-blue-500/10 text-blue-500 text-[10px] px-2 py-0.5 rounded font-bold uppercase">{log.status}</span>
                </div>
                <div className="bg-sidebar-bg p-4 rounded-lg border border-border-ui text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {log.insight}
                </div>
              </div>
            ))}
            {maintenanceLogs.length === 0 && (
              <div className="h-64 flex flex-col items-center justify-center text-text-muted opacity-50 border border-dashed border-border-ui rounded-xl">
                <History size={48} className="mb-2" />
                <p className="text-xs font-mono uppercase tracking-widest">No maintenance logs generated</p>
              </div>
            )}
          </div>
        );

      case 'Reports':
        return (
          <div className="max-w-2xl mx-auto bg-card-bg border border-border-ui p-8 rounded-xl text-center shadow-xl">
            <FileText size={64} className="mx-auto text-blue-400 mb-6" />
            <h3 className="text-xl font-bold mb-2 text-text-primary">Generate System Report</h3>
            <p className="text-sm text-text-secondary mb-8">Export a comprehensive diagnostic report including telemetry history, anomaly logs, and AI-driven maintenance recommendations.</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={downloadReport}
                className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              >
                <Download size={18} /> Download JSON
              </button>
              <button 
                onClick={() => alert('PDF Export requires server-side PDF generation service.')}
                className="flex items-center justify-center gap-2 py-3 bg-app-bg border border-border-ui hover:bg-border-ui text-text-primary rounded-lg font-medium transition-colors"
              >
                <FileText size={18} /> Export PDF
              </button>
            </div>
          </div>
        );

      case 'AI Diagnostics':
        return (
          <div className="h-full flex flex-col">
            <div className="flex-1 bg-card-bg border border-border-ui rounded-xl overflow-hidden flex flex-col shadow-xl">
              <div className="p-5 border-bottom border-border-ui flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={18} className="text-blue-400" />
                  <h3 className="font-medium text-text-primary">Deep Diagnostic Analysis</h3>
                </div>
                <button onClick={() => setCurrentView('Telemetry Stream')} className="text-xs text-text-secondary hover:text-text-primary transition-colors">Back to Stream</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8">
                {isAnalyzing ? (
                  <div className="h-full flex flex-col items-center justify-center space-y-4">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <p className="text-lg font-medium text-text-primary animate-pulse">Running Deep Neural Diagnostic...</p>
                    <p className="text-sm text-text-muted font-mono">Cross-referencing with fleet-wide failure modes</p>
                  </div>
                ) : aiInsight ? (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-xl">
                      <h4 className="text-blue-400 text-xs font-mono uppercase tracking-widest mb-4">Engineering Insight</h4>
                      <div className="text-base text-text-primary whitespace-pre-wrap leading-relaxed font-light">
                        {aiInsight}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-app-bg p-6 rounded-xl border border-border-ui shadow-sm">
                        <p className="text-xs font-mono text-text-muted uppercase mb-2">Criticality</p>
                        <p className="text-2xl font-bold text-rose-500">HIGH</p>
                      </div>
                      <div className="bg-app-bg p-6 rounded-xl border border-border-ui shadow-sm">
                        <p className="text-xs font-mono text-text-muted uppercase mb-2">Confidence</p>
                        <p className="text-2xl font-bold text-emerald-400">94.2%</p>
                      </div>
                      <div className="bg-app-bg p-6 rounded-xl border border-border-ui shadow-sm">
                        <p className="text-xs font-mono text-text-muted uppercase mb-2">Fleet Impact</p>
                        <p className="text-2xl font-bold text-blue-400">LOCAL</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-text-muted">
                    <BrainCircuit size={80} className="mb-6 opacity-20" />
                    <p className="text-lg font-medium">No active diagnostic session</p>
                    <button onClick={() => setCurrentView('Anomalies')} className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">Select Anomaly to Analyze</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-app-bg text-text-primary font-sans overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-right border-border-ui bg-sidebar-bg flex flex-col">
        <div className="p-6 border-bottom border-border-ui flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-text-primary">AeroGuard</h1>
            <span className="text-[10px] text-text-muted font-mono uppercase tracking-widest">Enterprise AI</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: LayoutDashboard, label: 'Fleet Overview' },
            { icon: Activity, label: 'Telemetry Stream' },
            { icon: AlertTriangle, label: 'Anomalies' },
            { icon: History, label: 'Maintenance Logs' },
            { icon: FileText, label: 'Reports' },
            { icon: BrainCircuit, label: 'AI Diagnostics' },
          ].map((item, i) => (
            <button 
              key={i}
              onClick={() => setCurrentView(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === item.label ? 'bg-app-bg text-text-primary shadow-sm' : 'text-text-secondary hover:bg-card-bg hover:text-text-primary'}`}
            >
              <item.icon size={18} />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-top border-border-ui">
          <div className="bg-card-bg rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">DG</div>
              <div>
                <p className="text-xs font-medium text-text-primary">D. Ganesan</p>
                <p className="text-[10px] text-text-muted">Senior Engineer</p>
              </div>
            </div>
            <button 
              onClick={() => setShowConfig(true)}
              className="w-full py-2 text-[10px] font-mono uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Settings size={12} /> System Config
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-bottom border-border-ui bg-sidebar-bg px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="font-medium text-sm text-text-primary">{currentView}: <span className="text-blue-400">FCS-737-MAX-042</span></h2>
            <div className="flex items-center gap-2 px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-mono text-emerald-500 uppercase">Live Telemetry</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={downloadReport}
              className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              title="Download Current Report"
            >
              <Download size={20} />
            </button>
            <div className="h-8 w-[1px] bg-border-ui"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary">System Health:</span>
              <span className={`text-xs font-bold ${health.overall > 90 ? 'text-emerald-400' : 'text-rose-400'}`}>{health.overall.toFixed(1)}%</span>
            </div>
          </div>
        </header>

        {/* View Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {renderView()}
        </div>
      </main>

      {/* Config Modal */}
      <AnimatePresence>
        {showConfig && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card-bg border border-border-ui w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-bottom border-border-ui flex justify-between items-center">
                <h3 className="font-bold text-lg text-text-primary">System Configuration</h3>
                <button onClick={() => setShowConfig(false)} className="text-text-muted hover:text-text-primary">✕</button>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  {/* Theme Toggle */}
                  <div className="flex items-center justify-between p-4 bg-app-bg rounded-xl border border-border-ui">
                    <div className="flex items-center gap-3">
                      {theme === 'dark' ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-amber-500" />}
                      <div>
                        <p className="text-sm font-medium text-text-primary">Interface Theme</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest">{theme} Mode Active</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                      className="w-12 h-6 bg-border-ui rounded-full relative transition-colors"
                    >
                      <motion.div 
                        animate={{ x: theme === 'dark' ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>

                  <label className="block">
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-2">Telemetry Sampling Rate</span>
                    <select className="w-full bg-app-bg border border-border-ui rounded-lg p-3 text-sm text-text-primary focus:outline-none focus:border-blue-500">
                      <option>1000ms (Standard)</option>
                      <option>500ms (High Frequency)</option>
                      <option>2000ms (Power Save)</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-mono text-text-muted uppercase tracking-widest block mb-2">Anomaly Sensitivity</span>
                    <input type="range" className="w-full accent-blue-500" />
                  </label>
                  <div className="flex items-center justify-between p-4 bg-app-bg rounded-xl border border-border-ui">
                    <div className="flex items-center gap-3">
                      <BrainCircuit size={20} className="text-blue-400" />
                      <div>
                        <p className="text-sm font-medium text-text-primary">Auto AI Analysis</p>
                        <p className="text-[10px] text-text-muted">Automatically run Gemini diagnostics</p>
                      </div>
                    </div>
                    <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowConfig(false)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                >
                  Save Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
