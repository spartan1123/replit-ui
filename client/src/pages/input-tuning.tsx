import { useState, useEffect, useRef } from "react";
import { Sliders, Zap, Users, Flame, Cpu, Eye, Network, Activity, ChevronDown, ChevronRight, Copy } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { postToHost } from "@/lib/hostBridge";

interface TuningState {
  leftStick: {
    innerDeadzone: number;
    outerDeadzone: number;
    sensitivity: number;
    responseCurve: "linear" | "cubic" | "custom";
  };
  rightStick: {
    innerDeadzone: number;
    outerDeadzone: number;
    sensitivity: number;
    responseCurve: "linear" | "cubic" | "custom";
  };
  triggers: {
    d12: number;
    s1n5: number;
    s3n3: number;
  };
  rapidFire: {
    enabled: boolean;
    mode: "combo" | "single";
    fireRate: number;
    humanizationLevel: number;
    jitterProbability: number;
    heatSimulation: number;
  };
  humanization: {
    varianceLevel: number;
    errorRate: number;
    reactionTime: number;
    inputNoiseLevel: number;
  };
  mapping: {
    invertYLeftRight: boolean;
    invertYGameOutput: boolean;
    preferAnalogTriggers: boolean;
  };
}

interface HostMessageLog {
  ts: number;
  type: string;
  summary: string;
}

function StickVisualizer({ label, innerDeadzone, outerDeadzone, inverted = false }: { label: string; innerDeadzone: number; outerDeadzone: number; inverted?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
        <Sliders className="w-4 h-4" />
        {label}
        {inverted && <Badge variant="destructive" className="text-[10px] h-4 px-1">INV</Badge>}
      </h4>
      <div className="relative w-28 h-28 rounded-full border border-emerald-500/30 bg-black/40 flex items-center justify-center">
        {/* Outer circle */}
        <div className="absolute w-full h-full rounded-full border border-emerald-500/20"></div>
        {/* Inner deadzone circle */}
        <div 
          className="absolute rounded-full border-2 border-blue-400/50 bg-blue-400/10"
          style={{ width: `${innerDeadzone * 20}px`, height: `${innerDeadzone * 20}px` }}
        ></div>
        {/* Center dot */}
        <div className="absolute w-2 h-2 rounded-full bg-emerald-400"></div>
        
        {/* Axis indicators */}
        <div className="absolute w-full h-[1px] bg-emerald-500/10"></div>
        <div className="absolute h-full w-[1px] bg-emerald-500/10"></div>
        
        {inverted && (
          <div className="absolute right-0 top-0 text-[8px] text-red-400 font-mono opacity-50 p-1">
            -Y
          </div>
        )}
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, min = 0, max = 100, displayValue, disabled = false }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; displayValue?: string; disabled?: boolean }) {
  return (
    <div className={`space-y-1 ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</label>
        <span className="text-xs font-mono text-emerald-400">{displayValue !== undefined ? displayValue : value.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={0.1}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        disabled={disabled}
        className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-emerald-500 disabled:accent-gray-600"
      />
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onChange(!enabled);
      }}
      className={`cursor-pointer relative w-10 h-6 rounded-full transition-colors ${
        enabled ? "bg-emerald-500" : "bg-gray-700"
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
          enabled ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SettingToggle({ label, description, enabled, onChange, activeStatus }: { label: string; description: string; enabled: boolean; onChange: (v: boolean) => void; activeStatus?: string }) {
  return (
    <div className="flex justify-between items-start py-3 px-4 bg-black/20 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-white text-sm">{label}</h4>
          {activeStatus && (
            <span className="text-[10px] text-emerald-400 font-mono">● {activeStatus}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}

function TimeAgo({ timestamp }: { timestamp: number }) {
  const [ago, setAgo] = useState(0);
  useEffect(() => {
    setAgo(Math.floor((Date.now() - timestamp) / 1000));
    const interval = setInterval(() => {
      setAgo(Math.floor((Date.now() - timestamp) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);
  return <span>{ago < 1 ? "just now" : `${ago}s ago`}</span>;
}

export default function InputTuning() {
  const DEFAULT_TUNING: TuningState = {
    leftStick: { innerDeadzone: 0.15, outerDeadzone: 0.95, sensitivity: 1.0, responseCurve: "linear" },
    rightStick: { innerDeadzone: 0.15, outerDeadzone: 0.95, sensitivity: 1.0, responseCurve: "linear" },
    triggers: { d12: 0.0, s1n5: 0.8, s3n3: 0.5 },
    rapidFire: {
      enabled: false,
      mode: "combo",
      fireRate: 2.0,
      humanizationLevel: 4.3,
      jitterProbability: 0.0,
      heatSimulation: 0.3,
    },
    humanization: {
      varianceLevel: 1.5,
      errorRate: 0.0,
      reactionTime: 0.3,
      inputNoiseLevel: 0.0,
    },
    mapping: {
      invertYLeftRight: false,
      invertYGameOutput: false,
      preferAnalogTriggers: true,
    }
  };

  const [tuning, setTuning] = useState<TuningState>(() => {
    try {
      const saved = localStorage.getItem("ceilpro.input.tuning");
      if (saved) {
        return { ...DEFAULT_TUNING, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.error("Failed to load tuning state", e);
    }
    return DEFAULT_TUNING;
  });

  const [livePreview, setLivePreview] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [applyPending, setApplyPending] = useState(false);
  const [applyStatus, setApplyStatus] = useState<"success" | "error" | "applying" | null>(null);
  const [lastHostStatus, setLastHostStatus] = useState<{ text: string; time: number } | null>(null);
  const [applyRequestId, setApplyRequestId] = useState<string | null>(null);
  
  // Host Link State
  const [hostConnected, setHostConnected] = useState(false);
  const [lastPongTs, setLastPongTs] = useState<number | null>(null);
  const [messageLog, setMessageLog] = useState<HostMessageLog[]>([]);
  const [isHostLinkOpen, setIsHostLinkOpen] = useState(false);

  const isFirstRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const applyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const applyRequestIdRef = useRef<string | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to generate IDs
  const generateRequestId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Heartbeat Logic
  useEffect(() => {
    const startHeartbeat = () => {
      heartbeatIntervalRef.current = setInterval(() => {
        postToHost({
          type: "CEILPRO_PING",
          ts: Date.now()
        });
        
        // Check for timeout
        setLastPongTs((prev) => {
          if (prev && Date.now() - prev > 4000) {
            setHostConnected(false);
          }
          return prev;
        });
      }, 1500);
    };

    startHeartbeat();

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };
  }, []);

  // Handle Host Messages (ACK/NACK + Pong)
  useEffect(() => {
    const handleMessage = (event: any) => {
      // Defensive parsing rules:
      // 1. raw = e?.data ?? e?.detail?.data ?? e
      // 2. If raw is string, try JSON.parse
      // 3. Accept both { type: ... } and { data: { type: ... } }
      
      let rawData = event?.data ?? event?.detail?.data ?? event;
      let data: any = rawData;
      
      if (typeof rawData === "string") {
        try {
          data = JSON.parse(rawData);
        } catch (e) {
          // Not JSON, ignore
        }
      }

      // Check for wrapped data shape { data: { type: ... } }
      if (data && data.data && typeof data.data === "object" && data.data.type) {
        data = data.data;
      }

      if (!data || typeof data !== "object") return;

      // Update message log
      const logEntry: HostMessageLog = {
        ts: Date.now(),
        type: data.type || "UNKNOWN",
        summary: JSON.stringify(data).slice(0, 100)
      };
      
      setMessageLog(prev => [logEntry, ...prev].slice(0, 20));

      // Handle Pong
      if (data.type === "CEILPRO_PONG") {
        setLastPongTs(Date.now());
        setHostConnected(true);
        return;
      }

      if (data.type !== "AXIS_CONFIG_ACK") return;

      // Normalize: Check if payload is the actual ack object (nested)
      const ack = (data.payload && typeof data.payload === "object") ? data.payload : data;
      const { ok, persisted, message, error, slot, requestId } = ack;
      
      const isApplyAck = persisted === true || ack.kind === "apply";
      
      const timestamp = Date.now();

      // Update Debug Status Line (for both preview and apply ACKs)
      let statusText = "";
      if (ok) {
        statusText = `OK ${isApplyAck ? "persisted" : "preview"}${slot !== undefined ? ` slot ${slot}` : ""}${requestId ? ` req ${requestId.slice(0,4)}` : ""}`;
      } else {
        statusText = `ERROR: ${error || message || "Unknown error"}`;
      }
      setLastHostStatus({ text: statusText, time: timestamp });

      // LOGIC BRANCHING
      
      if (isApplyAck) {
        // --- APPLY ACK HANDLING ---
        
        // 1. Check Request ID match strictly
        if (requestId && applyRequestIdRef.current && requestId !== applyRequestIdRef.current) {
          console.debug("Ignoring stale Apply ACK", { expected: applyRequestIdRef.current, got: requestId });
          return;
        }

        if (ok) {
           // Success!
           if (applyTimeoutRef.current) {
             clearTimeout(applyTimeoutRef.current);
             applyTimeoutRef.current = null;
           }
           
           setIsDirty(false);
           setApplyPending(false);
           setApplyStatus("success");
           setTimeout(() => setApplyStatus(null), 1500);
           toast.success("Configuration applied successfully");
        } else {
           // Failure (Explicit Apply Error)
           if (applyTimeoutRef.current) {
             clearTimeout(applyTimeoutRef.current);
             applyTimeoutRef.current = null;
           }
           
           setApplyPending(false);
           setApplyStatus("error");
           setTimeout(() => setApplyStatus(null), 2000);
           toast.error(error || message || "Failed to apply configuration");
        }

      } else {
        // --- PREVIEW ACK HANDLING ---
        // Do NOT touch isDirty, applyPending, or applyStatus
        // Do NOT show toasts
        // Just updated the status line above is sufficient
      }
    };

    // 1) WebView2-first listener
    const webview = (window as any).chrome?.webview;
    if (webview && typeof webview.addEventListener === "function") {
      webview.addEventListener("message", handleMessage);
    }
    
    // 2) Fallback for browser/dev (ALSO attach)
    window.addEventListener("message", handleMessage);

    return () => {
      if (webview && typeof webview.removeEventListener === "function") {
        webview.removeEventListener("message", handleMessage);
      }
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Handle changes (persistence + live preview)
  useEffect(() => {
    // Skip initial effect
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Mark as dirty on any change
    setIsDirty(true);

    // Persist to localStorage
    localStorage.setItem("ceilpro.input.tuning", JSON.stringify(tuning));

    // Handle Live Preview
    if (livePreview) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        const requestId = generateRequestId();
        postToHost({
          type: "PREVIEW_AXIS_CONFIG",
          payload: tuning,
          requestId
        });
      }, 100);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [tuning, livePreview]);

  const handleApply = () => {
    setApplyPending(true);
    setApplyStatus("applying");
    
    const requestId = generateRequestId();
    setApplyRequestId(requestId);
    applyRequestIdRef.current = requestId;

    postToHost({
      type: "APPLY_AXIS_CONFIG",
      payload: tuning,
      requestId
    });

    // Safety fallback: if no ACK within 6s (increased from 5s)
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      setApplyPending(false);
      // If we timed out, assume failure or at least stop the spinner
      if (isDirty) { 
         setApplyStatus("error");
         toast.error("No response from host (no AXIS_CONFIG_ACK). Check Host Link panel.");
         setTimeout(() => setApplyStatus(null), 2000);
      }
    }, 6000);
  };

  return (
    <Shell>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Input Tuning</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-1">Fine-tune controller responsiveness for optimal gameplay experience</p>
        </div>

        <div className="flex items-center gap-3">
           <div className="flex items-center gap-2 mr-2 px-3 py-1.5 bg-black/40 rounded-full border border-white/10">
            <Eye className={`w-3 h-3 ${livePreview ? "text-emerald-400" : "text-muted-foreground"}`} />
            <label className="text-xs font-medium text-white cursor-pointer select-none flex items-center gap-2">
              Live Preview
              <ToggleSwitch 
                enabled={livePreview} 
                onChange={setLivePreview} 
              />
            </label>
          </div>

          <input
            type="text"
            placeholder="Profile name"
            className="px-4 py-2 bg-black/40 border border-border rounded-lg text-sm text-white placeholder-muted-foreground focus:outline-none focus:border-primary"
          />
          <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold">
            💾 Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* Host Link Panel */}
        <Card className="bg-card/40 border-border/50 overflow-hidden backdrop-blur-md">
          <div 
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
            onClick={() => setIsHostLinkOpen(!isHostLinkOpen)}
          >
            <div className="flex items-center gap-2">
              <Network className={`w-4 h-4 ${hostConnected ? "text-emerald-400" : "text-red-400"}`} />
              <span className="text-sm font-semibold text-white">Host Link</span>
              <Badge variant={hostConnected ? "default" : "destructive"} className="text-[10px] h-4 px-1.5 uppercase">
                {hostConnected ? "Connected" : "Disconnected"}
              </Badge>
            </div>
            {isHostLinkOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          </div>
          
          {isHostLinkOpen && (
            <div className="p-4 pt-0 border-t border-white/5 bg-black/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-muted-foreground">Status:</span>
                     <span className={hostConnected ? "text-emerald-400 font-mono" : "text-red-400 font-mono"}>
                       {hostConnected ? "ONLINE" : "OFFLINE"}
                     </span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-muted-foreground">Last Pong:</span>
                     <span className="font-mono text-white">
                        {lastPongTs ? <TimeAgo timestamp={lastPongTs} /> : "Never"}
                     </span>
                   </div>
                   <div className="flex justify-between items-center text-xs">
                     <span className="text-muted-foreground">Last ACK:</span>
                     <span className="font-mono text-white truncate max-w-[150px]" title={lastHostStatus?.text}>
                        {lastHostStatus?.text || "None"}
                     </span>
                   </div>
                </div>
                <div className="flex flex-col gap-2 justify-center">
                   <Button 
                     size="sm" 
                     variant="outline" 
                     className="w-full text-xs h-7 gap-2"
                     onClick={(e) => {
                       e.stopPropagation();
                       postToHost({ type: "CEILPRO_PING", ts: Date.now() });
                       toast.info("Ping sent");
                     }}
                   >
                     <Activity className="w-3 h-3" />
                     Ping Host
                   </Button>
                   <Button 
                     size="sm" 
                     variant="outline" 
                     className="w-full text-xs h-7 gap-2"
                     onClick={(e) => {
                       e.stopPropagation();
                       const diagnostics = {
                         tuning,
                         applyRequestId,
                         hostConnected,
                         lastPongTs,
                         lastHostStatus,
                         messageLog
                       };
                       navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
                       toast.success("Diagnostics copied to clipboard");
                     }}
                   >
                     <Copy className="w-3 h-3" />
                     Copy Diagnostics
                   </Button>
                </div>
              </div>
              
              <div className="mt-2">
                <h4 className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Message Trace (Last 20)</h4>
                <div className="h-32 overflow-y-auto bg-black/40 rounded border border-white/5 p-2 font-mono text-[10px] space-y-1">
                  {messageLog.length === 0 ? (
                    <div className="text-muted-foreground italic text-center py-4">No messages received</div>
                  ) : (
                    messageLog.map((msg, idx) => (
                      <div key={idx} className="flex gap-2 border-b border-white/5 last:border-0 pb-1 last:pb-0">
                        <span className="text-emerald-500/70 whitespace-nowrap">
                          {new Date(msg.ts).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}.{new Date(msg.ts).getMilliseconds().toString().padStart(3, '0')}
                        </span>
                        <span className="text-blue-400 font-bold whitespace-nowrap">{msg.type}</span>
                        <span className="text-gray-400 truncate">{msg.summary}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Profile Management */}
        <Card className="bg-card/40 border-border/50 p-6 backdrop-blur-md">
          <h3 className="font-semibold text-white mb-4 text-sm uppercase tracking-wide">Profile Management</h3>
          <div className="flex gap-3">
            <select className="flex-1 px-4 py-2.5 bg-black/40 border border-border rounded-lg text-white text-sm focus:outline-none focus:border-primary">
              <option>Select profile...</option>
              <option>Default</option>
              <option>Competitive</option>
              <option>Casual</option>
            </select>
            <Button variant="outline" size="sm" className="gap-2">
              📥 Load
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-red-400 hover:text-red-300">
              🗑️ Delete
            </Button>
          </div>
        </Card>

        {/* Runtime Mapping */}
        <Card className="bg-card/40 border-border/50 p-6 backdrop-blur-md">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Runtime Mapping</h3>
              {lastHostStatus && (
                <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-2">
                  <span>Last Host:</span>
                  <span className={lastHostStatus.text.startsWith("ERROR") ? "text-red-400" : "text-emerald-400"}>
                    {lastHostStatus.text}
                  </span>
                  <span className="opacity-50">
                    <TimeAgo timestamp={lastHostStatus.time} />
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {applyStatus === "success" && (
                <span className="text-xs text-emerald-400 font-bold animate-in fade-in slide-in-from-right-2 duration-300">
                  Applied ✓
                </span>
              )}
              {applyStatus === "error" && (
                <span className="text-xs text-red-400 font-bold animate-in fade-in slide-in-from-right-2 duration-300">
                  Error
                </span>
              )}
              {applyStatus === "applying" && (
                <span className="text-xs text-muted-foreground animate-pulse">
                  Applying...
                </span>
              )}
              {isDirty && !applyStatus && (
                <span className="text-xs text-yellow-400 animate-pulse font-medium">
                  ● Unapplied changes
                </span>
              )}
              <Button 
                className={`text-black font-semibold text-xs ${
                  isDirty 
                    ? "bg-emerald-500 hover:bg-emerald-600" 
                    : "bg-emerald-500/50 hover:bg-emerald-500/60"
                }`}
                size="sm"
                onClick={handleApply}
                disabled={applyPending}
              >
                {applyPending ? "..." : "Apply"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
              <div>
                <p className="text-xs font-medium text-white">Invert Y (L/R)</p>
                <p className="text-[10px] text-muted-foreground">Flip Y-axis for L/R sticks</p>
              </div>
              <ToggleSwitch 
                enabled={tuning.mapping.invertYLeftRight} 
                onChange={(v) => setTuning({ ...tuning, mapping: { ...tuning.mapping, invertYLeftRight: v } })} 
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
              <div>
                <p className="text-xs font-medium text-white">Invert Y (Game Output)</p>
                <p className="text-[10px] text-muted-foreground">Flip Y-axis for camera output</p>
              </div>
              <ToggleSwitch 
                enabled={tuning.mapping.invertYGameOutput} 
                onChange={(v) => {
                  setTuning({ ...tuning, mapping: { ...tuning.mapping, invertYGameOutput: v } });
                  toast.success(`Game Output Y-Axis ${v ? "Inverted" : "Normal"}`);
                }} 
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
              <div>
                <p className="text-xs font-medium text-white">Prefer Analog Triggers</p>
                <p className="text-[10px] text-muted-foreground">Use analog for L2/R2 instead of binary</p>
              </div>
              <ToggleSwitch 
                enabled={tuning.mapping.preferAnalogTriggers} 
                onChange={(v) => setTuning({ ...tuning, mapping: { ...tuning.mapping, preferAnalogTriggers: v } })} 
              />
            </div>
          </div>
        </Card>

        {/* Sticks & Triggers */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Left Stick */}
          <Card className="bg-card/40 border-border/50 p-6 backdrop-blur-md">
            <StickVisualizer
              label="Left Stick"
              innerDeadzone={tuning.leftStick.innerDeadzone}
              outerDeadzone={tuning.leftStick.outerDeadzone}
              inverted={tuning.mapping.invertYLeftRight}
            />
            <div className="mt-6 space-y-4">
              <SliderControl
                label="Inner Deadzone"
                value={tuning.leftStick.innerDeadzone}
                onChange={(v) => setTuning({ ...tuning, leftStick: { ...tuning.leftStick, innerDeadzone: v } })}
                min={0}
                max={1}
                displayValue={(tuning.leftStick.innerDeadzone * 100).toFixed(0) + "%"}
              />
              <SliderControl
                label="Outer Deadzone"
                value={tuning.leftStick.outerDeadzone}
                onChange={(v) => setTuning({ ...tuning, leftStick: { ...tuning.leftStick, outerDeadzone: v } })}
                min={0}
                max={1}
                displayValue={(tuning.leftStick.outerDeadzone * 100).toFixed(0) + "%"}
              />
              <SliderControl
                label="Sensitivity"
                value={tuning.leftStick.sensitivity}
                onChange={(v) => setTuning({ ...tuning, leftStick: { ...tuning.leftStick, sensitivity: v } })}
                min={0}
                max={2}
              />
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">Response Curve</label>
                <select className="w-full px-3 py-2 bg-black/40 border border-border rounded-lg text-white text-xs focus:outline-none focus:border-primary">
                  <option>Linear</option>
                  <option>Cubic</option>
                  <option>Custom</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Right Stick */}
          <Card className="bg-card/40 border-border/50 p-6 backdrop-blur-md">
            <StickVisualizer
              label="Right Stick"
              innerDeadzone={tuning.rightStick.innerDeadzone}
              outerDeadzone={tuning.rightStick.outerDeadzone}
              inverted={tuning.mapping.invertYLeftRight}
            />
            <div className="mt-6 space-y-4">
              <SliderControl
                label="Inner Deadzone"
                value={tuning.rightStick.innerDeadzone}
                onChange={(v) => setTuning({ ...tuning, rightStick: { ...tuning.rightStick, innerDeadzone: v } })}
                min={0}
                max={1}
                displayValue={(tuning.rightStick.innerDeadzone * 100).toFixed(0) + "%"}
              />
              <SliderControl
                label="Outer Deadzone"
                value={tuning.rightStick.outerDeadzone}
                onChange={(v) => setTuning({ ...tuning, rightStick: { ...tuning.rightStick, outerDeadzone: v } })}
                min={0}
                max={1}
                displayValue={(tuning.rightStick.outerDeadzone * 100).toFixed(0) + "%"}
              />
              <SliderControl
                label="Sensitivity"
                value={tuning.rightStick.sensitivity}
                onChange={(v) => setTuning({ ...tuning, rightStick: { ...tuning.rightStick, sensitivity: v } })}
                min={0}
                max={2}
              />
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">Response Curve</label>
                <select className="w-full px-3 py-2 bg-black/40 border border-border rounded-lg text-white text-xs focus:outline-none focus:border-primary">
                  <option>Linear</option>
                  <option>Cubic</option>
                  <option>Custom</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Triggers */}
          <Card className="bg-card/40 border-border/50 p-6 backdrop-blur-md">
            <h4 className="text-sm font-semibold text-emerald-400 mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Triggers
              {!tuning.mapping.preferAnalogTriggers && <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-auto">BINARY</Badge>}
            </h4>
            <div className="space-y-4">
              {!tuning.mapping.preferAnalogTriggers && (
                <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-yellow-200/80 text-[10px] mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                  Binary Mode: Triggers act as on/off buttons.
                </div>
              )}
              <SliderControl
                label="L2 Deadzone"
                value={tuning.triggers.d12}
                onChange={(v) => setTuning({ ...tuning, triggers: { ...tuning.triggers, d12: v } })}
                min={0}
                max={100}
                displayValue={(tuning.triggers.d12 * 100).toFixed(0) + "%"}
                disabled={!tuning.mapping.preferAnalogTriggers}
              />
              <SliderControl
                label="R2 Deadzone"
                value={tuning.triggers.s1n5}
                onChange={(v) => setTuning({ ...tuning, triggers: { ...tuning.triggers, s1n5: v } })}
                min={0}
                max={100}
                displayValue={(tuning.triggers.s1n5 * 100).toFixed(0) + "%"}
                disabled={!tuning.mapping.preferAnalogTriggers}
              />
              <SliderControl
                label="Trigger Sensitivity"
                value={tuning.triggers.s3n3}
                onChange={(v) => setTuning({ ...tuning, triggers: { ...tuning.triggers, s3n3: v } })}
                min={0}
                max={100}
                displayValue={(tuning.triggers.s3n3 * 100).toFixed(0) + "%"}
                disabled={!tuning.mapping.preferAnalogTriggers}
              />
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
