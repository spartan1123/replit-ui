import { useState, useEffect, useRef } from "react";
import { Sliders, Zap, Users, Flame, Cpu, Eye } from "lucide-react";
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
  
  const isFirstRender = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const applyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle Host Messages (ACK/NACK)
  useEffect(() => {
    const handleMessage = (event: any) => {
      // Defensive parsing: event can be object or string, source varies (WebView2 vs window)
      // Prefer e?.data ?? e?.detail?.data ?? e
      let rawData = event?.data ?? event?.detail?.data ?? event;
      
      let data: any = rawData;
      if (typeof rawData === "string") {
        try {
          data = JSON.parse(rawData);
        } catch (e) {
          // If it's a string but not JSON, we might ignore it or check if it's a simple string command
          // For this specific requirement, we just want to parse it if possible
        }
      }

      if (!data || typeof data !== "object") return;
      if (data.type !== "AXIS_CONFIG_ACK") return;

      const { ok, persisted, message, error, slot } = data;
      const timestamp = Date.now();

      // Clear the safety timeout since we got a response
      if (applyTimeoutRef.current && persisted) {
        clearTimeout(applyTimeoutRef.current);
        applyTimeoutRef.current = null;
      }

      // Update Debug Status Line
      let statusText = "";
      if (ok) {
        statusText = `OK ${persisted ? "persisted" : "preview"}${slot !== undefined ? ` slot ${slot}` : ""}`;
      } else {
        statusText = `ERROR: ${error || message || "Unknown error"}`;
      }
      setLastHostStatus({ text: statusText, time: timestamp });

      if (ok) {
        if (persisted) {
          // Full Apply Success
          setIsDirty(false);
          setApplyPending(false);
          setApplyStatus("success");
          
          // Show small "Applied ✓" for 1.5s
          setTimeout(() => setApplyStatus(null), 1500);
        } else {
          // Preview ACK - do NOT clear dirty
          // Optionally debug log
        }
      } else {
        // Error / NACK
        setApplyPending(false);
        setApplyStatus("error");
        toast.error(error || message || "Failed to apply configuration");
        
        // Clear error status after 2s
        setTimeout(() => setApplyStatus(null), 2000);
      }
    };

    // Prioritize WebView2 channel if available
    const webview = (window as any).chrome?.webview;
    if (webview && typeof webview.addEventListener === "function") {
      webview.addEventListener("message", handleMessage);
    }
    
    // Fallback for browser/dev
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
        postToHost({
          type: "PREVIEW_AXIS_CONFIG",
          payload: tuning
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
    
    postToHost({
      type: "APPLY_AXIS_CONFIG",
      payload: tuning
    });

    // Safety fallback: if no ACK within 2.5s
    if (applyTimeoutRef.current) clearTimeout(applyTimeoutRef.current);
    applyTimeoutRef.current = setTimeout(() => {
      setApplyPending(false);
      // If we timed out, assume failure or at least stop the spinner
      if (isDirty) { 
         setApplyStatus("error");
         toast.error("No response from host");
         setTimeout(() => setApplyStatus(null), 2000);
      }
    }, 2500);
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
                  <span>Last Host Status:</span>
                  <span className={lastHostStatus.text.startsWith("ERROR") ? "text-red-400" : "text-emerald-400"}>
                    {lastHostStatus.text}
                  </span>
                  <span className="opacity-50">
                    (<TimeAgo timestamp={lastHostStatus.time} />)
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
