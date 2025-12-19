import { useState } from "react";
import { Sliders, Zap, Users, Flame, Cpu } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
}

function StickVisualizer({ label, innerDeadzone, outerDeadzone }: { label: string; innerDeadzone: number; outerDeadzone: number }) {
  return (
    <div className="flex flex-col items-center">
      <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
        <Sliders className="w-4 h-4" />
        {label}
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
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, min = 0, max = 100, displayValue }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; displayValue?: string }) {
  return (
    <div className="space-y-1">
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
        className="w-full h-1.5 bg-gray-800 rounded-full appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative w-10 h-6 rounded-full transition-colors ${
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

export default function InputTuning() {
  const [tuning, setTuning] = useState<TuningState>({
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
  });

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
            <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Runtime Mapping</h3>
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold text-xs" size="sm">
              Apply
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
              <div>
                <p className="text-xs font-medium text-white">Invert Y (L/R)</p>
                <p className="text-[10px] text-muted-foreground">Flip Y-axis for L/R sticks</p>
              </div>
              <ToggleSwitch enabled={false} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
              <div>
                <p className="text-xs font-medium text-white">Invert Y (Game Output)</p>
                <p className="text-[10px] text-muted-foreground">Flip Y-axis for camera output</p>
              </div>
              <ToggleSwitch enabled={false} onChange={() => {}} />
            </div>
            <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
              <div>
                <p className="text-xs font-medium text-white">Prefer Analog Triggers</p>
                <p className="text-[10px] text-muted-foreground">Use analog for L2/R2 instead of binary</p>
              </div>
              <ToggleSwitch enabled={true} onChange={() => {}} />
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
            </h4>
            <div className="space-y-4">
              <SliderControl
                label="L2 Deadzone"
                value={tuning.triggers.d12}
                onChange={(v) => setTuning({ ...tuning, triggers: { ...tuning.triggers, d12: v } })}
                min={0}
                max={100}
                displayValue={(tuning.triggers.d12 * 100).toFixed(0) + "%"}
              />
              <SliderControl
                label="R2 Deadzone"
                value={tuning.triggers.s1n5}
                onChange={(v) => setTuning({ ...tuning, triggers: { ...tuning.triggers, s1n5: v } })}
                min={0}
                max={100}
                displayValue={(tuning.triggers.s1n5 * 100).toFixed(0) + "%"}
              />
              <SliderControl
                label="Trigger Sensitivity"
                value={tuning.triggers.s3n3}
                onChange={(v) => setTuning({ ...tuning, triggers: { ...tuning.triggers, s3n3: v } })}
                min={0}
                max={100}
                displayValue={(tuning.triggers.s3n3 * 100).toFixed(0) + "%"}
              />
            </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
