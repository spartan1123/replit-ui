import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Activity, RefreshCcw, Copy, Gamepad2, Database, Power } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// --- Components ---

function StatusBadge({ active, text }: { active: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${active ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "bg-muted-foreground"}`} />
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{text}</span>
    </div>
  );
}

function StatRow({ label, value, subValue }: { label: string; value: string; subValue?: string }) {
  return (
    <div className="flex justify-between items-center py-1 group">
      <span className="text-xs text-muted-foreground font-medium group-hover:text-white transition-colors">{label}</span>
      <div className="text-right">
        <span className="text-sm font-mono text-white tracking-tight text-shadow-sm">{value}</span>
        {subValue && <span className="ml-2 text-xs text-muted-foreground font-mono">{subValue}</span>}
      </div>
    </div>
  );
}

function LiveDataStream() {
  return (
    <Card className="bg-card/40 border-border/50 p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-emerald-400">
          <Activity className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Live Data Stream</h3>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge active={true} text="Simulation" />
          <span className="text-xs text-muted-foreground font-mono">0ms latency</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 relative">
        {/* Subtle decorative line */}
        <div className="absolute inset-y-0 left-1/2 w-px bg-gradient-to-b from-transparent via-border/50 to-transparent"></div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
              <span className="w-1 h-3 bg-emerald-500/50 rounded-full"></span>
              Left Stick
            </h4>
            <div className="pl-3 space-y-1 border-l border-white/5">
              <StatRow label="X-axis" value="0.000" />
              <StatRow label="Y-axis" value="0.000" />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
              <span className="w-1 h-3 bg-emerald-500/50 rounded-full"></span>
              Right Stick
            </h4>
            <div className="pl-3 space-y-1 border-l border-white/5">
              <StatRow label="X-axis" value="0.000" />
              <StatRow label="Y-axis" value="0.000" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
              <span className="w-1 h-3 bg-blue-500/50 rounded-full"></span>
              Triggers
            </h4>
             <div className="pl-3 space-y-1 border-l border-white/5">
              <StatRow label="Left Trigger" value="0%" />
              <StatRow label="Right Trigger" value="0%" />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
               <span className="w-1 h-3 bg-orange-500/50 rounded-full"></span>
               Buttons
            </h4>
             <div className="pl-3 h-6 text-xs text-muted-foreground/60 italic flex items-center border-l border-white/5">No input</div>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/30">
        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-emerald-400 transition-colors cursor-pointer group">
          <span className="group-hover:translate-x-1 transition-transform">▶</span>
          <span>View Raw JSON Payload</span>
        </div>
      </div>
    </Card>
  );
}

function ControllerDebug() {
  return (
    <Card className="bg-card/40 border-border/50 p-5 backdrop-blur-md shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-white">Controller Debug</h3>
            <p className="text-[10px] text-muted-foreground">Snapshot + backend ...</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
           <div className="flex gap-2">
             <Button variant="outline" size="sm" className="h-6 text-[10px] bg-transparent border-border/50 hover:bg-white/5 hover:text-white px-3">Show</Button>
             <Button variant="outline" size="sm" className="h-6 text-[10px] bg-transparent border-border/50 hover:bg-white/5 hover:text-white gap-1 px-3">
               <RefreshCcw className="w-3 h-3" />
             </Button>
           </div>
           <Button variant="outline" size="sm" className="h-6 text-[10px] w-full bg-transparent border-border/50 hover:bg-white/5 hover:text-white gap-1">
             <Copy className="w-3 h-3" /> Copy State
           </Button>
        </div>
      </div>
      <div className="p-3 rounded-lg bg-black/20 border border-white/5">
        <p className="text-[10px] text-muted-foreground leading-relaxed font-mono">
          <span className="text-yellow-500/70">WARN:</span> If triggers stuck at 0.0 but L2/R2 fire, system will fallback to XInput emulation.
        </p>
      </div>
    </Card>
  );
}

function SystemStatus() {
  return (
    <Card className="bg-card/40 border-border/50 p-5 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-2 mb-4 text-orange-400">
        <Activity className="w-4 h-4" />
        <h3 className="font-semibold text-sm text-foreground">System Status</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center group">
          <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">XInput Device</span>
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20 text-[10px] font-mono">No Gamepad</Badge>
        </div>
        <div className="flex justify-between items-center group">
          <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">ViGEm Driver</span>
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 text-[10px] font-mono">Installed v1.17</Badge>
        </div>
        <div className="flex justify-between items-center group">
          <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">Data Stream</span>
          <span className="text-sm font-mono text-emerald-400">0 Hz</span>
        </div>
      </div>
    </Card>
  );
}

import controllerImage from '@assets/mylogo_1766393971658.png'

function ControllerVisualizer() {
  return (
    <Card className="h-full bg-[#0B0D14] border-border/50 p-1 flex flex-col relative overflow-hidden shadow-2xl">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none"></div>

      {/* Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <h2 className="font-semibold tracking-wide text-white">Live Controller Visualization</h2>
        </div>
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur rounded-full px-4 py-1.5 border border-white/5">
          <StatusBadge active={true} text="Simulation Active" />
          <div className="w-px h-3 bg-white/10"></div>
          <span className="text-xs text-muted-foreground">Latency <span className="text-emerald-400 font-mono font-bold">0ms</span></span>
        </div>
      </div>

      <div className="absolute top-24 right-6 z-10">
         <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 backdrop-blur-md shadow-lg">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
           ViGEm / Gamepad Connected
         </Badge>
      </div>

      {/* Visualization Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        <div className="relative w-full h-full max-h-[400px] flex items-center justify-center">
           <img 
             src={controllerImage} 
             alt="Controller Visualization"
             className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]"
           />
        </div>

        {/* Live Data Overlay on Controller */}
        <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-[10px] shadow-2xl w-full max-w-[280px] mt-4 z-20">
           <div className="text-emerald-500/70 font-bold">LX <span className="text-white ml-2">0.000</span></div>
           <div className="text-emerald-500/70 font-bold">LY <span className="text-white ml-2">0.000</span></div>
           <div className="text-blue-500/70 font-bold">RX <span className="text-white ml-2">0.000</span></div>
           <div className="text-blue-500/70 font-bold">RY <span className="text-white ml-2">0.000</span></div>
           
           <div className="col-span-2 h-px bg-white/10 my-1"></div>
           
           <div className="text-muted-foreground">LT <span className="text-white ml-2">0%</span></div>
           <div className="text-muted-foreground">RT <span className="text-white ml-2">0%</span></div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="h-24 border-t border-border/50 grid grid-cols-3 divide-x divide-border/50 bg-black/40 backdrop-blur-sm">
        <div className="p-4 flex flex-col justify-center items-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Update Rate</span>
          <span className="text-3xl font-bold text-emerald-400 tracking-tighter drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">60<span className="text-sm align-top ml-1 text-emerald-600">Hz</span></span>
        </div>
        <div className="p-4 flex flex-col justify-center items-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Input Latency</span>
          <span className="text-3xl font-bold text-blue-400 tracking-tighter drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">0<span className="text-sm align-top ml-1 text-blue-600">ms</span></span>
        </div>
        <div className="p-4 flex flex-col justify-center items-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Active Buttons</span>
          <span className="text-3xl font-bold text-orange-400 tracking-tighter drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">0</span>
        </div>
      </div>
    </Card>
  );
}

// --- Page ---

export default function Dashboard() {
  return (
    <Shell>
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-900/20 text-emerald-400 border border-emerald-500/20 shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]">
               <Gamepad2 className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
          </div>
          <p className="text-muted-foreground text-sm pl-1">Live controller telemetry and visualization</p>
        </div>
        
        {/* Top Right Control Pill */}
        <div className="flex items-center gap-0.5 bg-black/40 border border-white/10 rounded-full p-1 backdrop-blur-md shadow-lg">
           <div className="flex items-center gap-2 px-3 py-1.5 border-r border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
              <span className="text-xs font-mono font-bold text-emerald-400">0 FPS</span>
           </div>
           
           <div className="flex items-center gap-3 px-3 py-1.5 bg-orange-500/10 rounded-full border border-orange-500/20 ml-1 cursor-pointer hover:bg-orange-500/20 transition-colors">
              <div className="relative w-8 h-4 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.4)] transition-all">
                <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
              </div>
              <span className="text-xs font-bold text-orange-400 tracking-wide">SIM</span>
              <Power className="w-3 h-3 text-orange-400" />
           </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6 h-[750px]">
        {/* Left Column: Visualization (8 cols) */}
        <div className="col-span-12 lg:col-span-8 h-full">
          <ControllerVisualizer />
        </div>

        {/* Right Column: Data & Status (4 cols) */}
        <div className="col-span-12 lg:col-span-4 h-full flex flex-col gap-6">
          <LiveDataStream />
          <ControllerDebug />
          <SystemStatus />
          
          <Card className="bg-card/40 border-border/50 p-5 backdrop-blur-md flex-1 shadow-lg">
             <div className="flex items-center gap-2 mb-4 text-blue-400">
                <span className="font-mono font-bold">{"<>"}</span>
                <h3 className="font-semibold text-sm text-foreground">Development Roadmap</h3>
             </div>
             <div className="space-y-4">
               <div className="flex items-center gap-3 group">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div>
                 <span className="text-sm text-muted-foreground line-through decoration-emerald-500/50 group-hover:text-emerald-400 transition-colors">Phase 1: Core Visualization</span>
               </div>
                <div className="flex items-center gap-3 group">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                 <span className="text-sm text-white font-medium">Phase 2: Input Remapping</span>
               </div>
                <div className="flex items-center gap-3 group">
                 <div className="w-1.5 h-1.5 rounded-full bg-muted border border-white/10"></div>
                 <span className="text-sm text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">Phase 3: Macro Support</span>
               </div>
             </div>
          </Card>
        </div>
      </div>
    </Shell>
  );
}
