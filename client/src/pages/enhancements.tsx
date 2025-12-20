import { useState } from "react";
import { Target, Zap, Users, Flame, Cpu, Shield, Crosshair, RefreshCcw } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EnhancementsState {
  aimAssist: {
    strength: number;
    radius: number;
    stickiness: number;
    mode: "Magnetic" | "Sticky" | "Dynamic";
    prediction: boolean;
    enabled: boolean;
  };
  recoil: {
    vertical: number;
    horizontal: number;
    strength: number;
    adaptationRate: number;
    weaponPreset: string;
    prediction: boolean;
    patternLearning: boolean;
    enabled: boolean;
  };
  rapidFire: {
    fireRateMultiplier: number;
    humanizationLevel: number;
    heatSimulation: number;
    burstMode: boolean;
    adaptiveTiming: boolean;
    enabled: boolean;
  };
  humanization: {
    varianceLevel: number;
    errorRate: number;
    reactionTime: number;
    inputNoise: number;
    fatigueSimulation: boolean;
    enabled: boolean;
  };
}

function SliderControl({ label, value, onChange, min = 0, max = 100, displayValue }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; displayValue?: string }) {
  return (
    <div className="space-y-2">
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
      <div className="flex-1 pr-4">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium text-white text-sm">{label}</h4>
          {activeStatus && enabled && (
            <span className="text-[10px] text-emerald-400 font-mono animate-pulse">● {activeStatus}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <ToggleSwitch enabled={enabled} onChange={onChange} />
    </div>
  );
}

export default function Enhancements() {
  const [state, setState] = useState<EnhancementsState>({
    aimAssist: {
      strength: 0.8,
      radius: 50.0,
      stickiness: 0.6,
      mode: "Magnetic",
      prediction: true,
      enabled: true
    },
    recoil: {
      vertical: 75.0,
      horizontal: 35.0,
      strength: 1.2,
      adaptationRate: 0.5,
      weaponPreset: "Custom",
      prediction: true,
      patternLearning: true,
      enabled: true
    },
    rapidFire: {
      fireRateMultiplier: 1.8,
      humanizationLevel: 4.5,
      heatSimulation: 0.5,
      burstMode: false,
      adaptiveTiming: true,
      enabled: true
    },
    humanization: {
      varianceLevel: 3.5,
      errorRate: 0.0,
      reactionTime: 0.3,
      inputNoise: 0.0,
      fatigueSimulation: true,
      enabled: true
    }
  });

  return (
    <Shell>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Enhancements</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-1">Tune aim assist, recoil shaping, rapid fire and movement layers. All systems integrated.</p>
        </div>
        <div className="flex items-center gap-4 bg-black/40 border border-white/10 rounded-full py-1.5 px-4 backdrop-blur-md">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-xs font-mono font-bold text-white">SYSTEM ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Aim Assist Card */}
        <Card className="bg-card/40 border-border/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-pink-400">
              <Crosshair className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wide">Aim Assist Tuner</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">{state.aimAssist.strength.toFixed(1)}</span>
          </div>

          <div className="p-3 bg-black/20 rounded-lg border border-white/5 mb-6">
            <p className="text-xs text-muted-foreground">Shape subtle magnetic pull around targets while keeping motion human.</p>
            <div className="mt-2 text-xs font-mono text-pink-400">Targets: 0  |  Accuracy: 0.0%</div>
          </div>

          <div className="space-y-6">
            <SliderControl
              label="Strength"
              value={state.aimAssist.strength}
              onChange={(v) => setState({ ...state, aimAssist: { ...state.aimAssist, strength: v } })}
              min={0}
              max={1}
            />
            <SliderControl
              label="Radius"
              value={state.aimAssist.radius}
              onChange={(v) => setState({ ...state, aimAssist: { ...state.aimAssist, radius: v } })}
              min={0}
              max={100}
              displayValue={state.aimAssist.radius.toFixed(1) + "px"}
            />
            <SliderControl
              label="Stickiness"
              value={state.aimAssist.stickiness}
              onChange={(v) => setState({ ...state, aimAssist: { ...state.aimAssist, stickiness: v } })}
              min={0}
              max={1}
            />

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">Mode</label>
              <select className="w-full px-3 py-2.5 bg-black/40 border border-border rounded-lg text-white text-xs focus:outline-none focus:border-primary">
                <option>Magnetic</option>
                <option>Sticky</option>
                <option>Dynamic</option>
              </select>
            </div>

            <div className="pt-2 space-y-3">
              <SettingToggle
                label="Prediction"
                description="Predict target movement for better tracking"
                enabled={state.aimAssist.prediction}
                onChange={(v) => setState({ ...state, aimAssist: { ...state.aimAssist, prediction: v } })}
              />
              <SettingToggle
                label="Enable Aim Assist"
                description="Keeps motion bounded to human levels while tracking targets"
                enabled={state.aimAssist.enabled}
                onChange={(v) => setState({ ...state, aimAssist: { ...state.aimAssist, enabled: v } })}
                activeStatus="System: Active"
              />
            </div>
          </div>
        </Card>

        {/* Recoil Control Card */}
        <Card className="bg-card/40 border-border/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-yellow-400">
              <RefreshCcw className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wide">Recoil Control</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">75%</span>
          </div>

          <div className="p-3 bg-black/20 rounded-lg border border-white/5 mb-6">
             <p className="text-xs text-muted-foreground">Counter vertical and horizontal kick for burst and spray patterns.</p>
             <div className="mt-2 text-xs font-mono text-yellow-400">Shots: 0  |  Accuracy: 0.0%</div>
          </div>

          <div className="space-y-6">
            <SliderControl
              label="Vertical Compensation"
              value={state.recoil.vertical}
              onChange={(v) => setState({ ...state, recoil: { ...state.recoil, vertical: v } })}
              min={0}
              max={100}
              displayValue={state.recoil.vertical.toFixed(1) + "%"}
            />
            <SliderControl
              label="Horizontal Compensation"
              value={state.recoil.horizontal}
              onChange={(v) => setState({ ...state, recoil: { ...state.recoil, horizontal: v } })}
              min={0}
              max={100}
              displayValue={state.recoil.horizontal.toFixed(1) + "%"}
            />
            <SliderControl
              label="Strength"
              value={state.recoil.strength}
              onChange={(v) => setState({ ...state, recoil: { ...state.recoil, strength: v } })}
              min={0}
              max={2}
            />
            <SliderControl
              label="Adaptation Rate"
              value={state.recoil.adaptationRate}
              onChange={(v) => setState({ ...state, recoil: { ...state.recoil, adaptationRate: v } })}
              min={0}
              max={1}
            />

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide block mb-2">Weapon Preset</label>
              <select className="w-full px-3 py-2.5 bg-black/40 border border-border rounded-lg text-white text-xs focus:outline-none focus:border-primary">
                <option>Custom</option>
                <option>AR-Platform</option>
                <option>SMG-Rapid</option>
              </select>
            </div>

            <div className="pt-2 space-y-3">
               <SettingToggle
                label="Prediction"
                description="Anticipate recoil patterns for smoother compensation"
                enabled={state.recoil.prediction}
                onChange={(v) => setState({ ...state, recoil: { ...state.recoil, prediction: v } })}
              />
               <SettingToggle
                label="Pattern Learning"
                description="Adapt to spray timing and cadence automatically"
                enabled={state.recoil.patternLearning}
                onChange={(v) => setState({ ...state, recoil: { ...state.recoil, patternLearning: v } })}
              />
               <SettingToggle
                label="Enable Recoil Control"
                description="Counter weapon kick while maintaining human-like movement"
                enabled={state.recoil.enabled}
                onChange={(v) => setState({ ...state, recoil: { ...state.recoil, enabled: v } })}
                activeStatus="System: Active"
              />
            </div>
          </div>
        </Card>

        {/* Rapid Fire Card */}
        <Card className="bg-card/40 border-border/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-orange-400">
              <Flame className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wide">Rapid Fire</h3>
            </div>
            <span className="text-xs font-mono text-emerald-400">{state.rapidFire.fireRateMultiplier.toFixed(1)}x</span>
          </div>

          <div className="p-3 bg-black/20 rounded-lg border border-white/5 mb-6">
             <p className="text-xs text-muted-foreground">Convert semi-auto clicks into stable, human-like burst fire.</p>
             <div className="mt-2 text-xs font-mono text-orange-400">Shots: 0  |  Rate: 0.0</div>
          </div>

          <div className="space-y-6">
             <SliderControl
              label="Fire Rate Multiplier"
              value={state.rapidFire.fireRateMultiplier}
              onChange={(v) => setState({ ...state, rapidFire: { ...state.rapidFire, fireRateMultiplier: v } })}
              min={1}
              max={5}
              displayValue={state.rapidFire.fireRateMultiplier.toFixed(1) + "x"}
            />
            <SliderControl
              label="Humanization Level"
              value={state.rapidFire.humanizationLevel}
              onChange={(v) => setState({ ...state, rapidFire: { ...state.rapidFire, humanizationLevel: v } })}
              min={0}
              max={10}
            />
            <SliderControl
              label="Heat Simulation"
              value={state.rapidFire.heatSimulation}
              onChange={(v) => setState({ ...state, rapidFire: { ...state.rapidFire, heatSimulation: v } })}
              min={0}
              max={1}
            />

            <div className="pt-2 space-y-3">
               <SettingToggle
                label="Burst Mode"
                description="Fire in controlled bursts instead of continuous fire"
                enabled={state.rapidFire.burstMode}
                onChange={(v) => setState({ ...state, rapidFire: { ...state.rapidFire, burstMode: v } })}
              />
               <SettingToggle
                label="Adaptive Timing"
                description="Adjust fire rate based on heat and performance"
                enabled={state.rapidFire.adaptiveTiming}
                onChange={(v) => setState({ ...state, rapidFire: { ...state.rapidFire, adaptiveTiming: v } })}
              />
               <SettingToggle
                label="Enable Rapid Fire"
                description="Keeps click timing inside realistic human windows"
                enabled={state.rapidFire.enabled}
                onChange={(v) => setState({ ...state, rapidFire: { ...state.rapidFire, enabled: v } })}
                activeStatus="System: Active"
              />
            </div>
          </div>
        </Card>

        {/* Humanization & Movement Card */}
        <Card className="bg-card/40 border-border/50 p-6 backdrop-blur-md">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-cyan-400">
              <Users className="w-5 h-5" />
              <h3 className="font-bold text-sm uppercase tracking-wide">Humanization & Movement</h3>
            </div>
          </div>

          <div className="p-3 bg-black/20 rounded-lg border border-white/5 mb-6">
             <p className="text-xs text-muted-foreground">Add realistic imperfections and smooth movement for undetectable enhancements.</p>
             <div className="mt-2 text-xs font-mono text-cyan-400">Variation: 0.00  |  Fatigue: 0.0%</div>
          </div>

          <div className="space-y-6">
            <SliderControl
              label="Variance Level"
              value={state.humanization.varianceLevel}
              onChange={(v) => setState({ ...state, humanization: { ...state.humanization, varianceLevel: v } })}
              min={0}
              max={5}
            />
            <SliderControl
              label="Error Rate"
              value={state.humanization.errorRate}
              onChange={(v) => setState({ ...state, humanization: { ...state.humanization, errorRate: v } })}
              min={0}
              max={1}
            />
            <SliderControl
              label="Reaction Time Variation"
              value={state.humanization.reactionTime}
              onChange={(v) => setState({ ...state, humanization: { ...state.humanization, reactionTime: v } })}
              min={0}
              max={1}
            />
            <SliderControl
              label="Input Noise Level"
              value={state.humanization.inputNoise}
              onChange={(v) => setState({ ...state, humanization: { ...state.humanization, inputNoise: v } })}
              min={0}
              max={1}
            />

            <div className="pt-2 space-y-3">
               <SettingToggle
                label="Fatigue Simulation"
                description="Gradually reduce performance over time for realism"
                enabled={state.humanization.fatigueSimulation}
                onChange={(v) => setState({ ...state, humanization: { ...state.humanization, fatigueSimulation: v } })}
              />
               <SettingToggle
                label="Enable Humanization"
                description="Add realistic imperfections to all enhancement systems"
                enabled={state.humanization.enabled}
                onChange={(v) => setState({ ...state, humanization: { ...state.humanization, enabled: v } })}
                activeStatus="System: Active"
              />
            </div>
          </div>
        </Card>

      </div>
    </Shell>
  );
}
