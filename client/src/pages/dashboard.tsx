import { useState, useEffect, useRef, type MutableRefObject } from "react";
import { motion } from "framer-motion";
import { Activity, Gamepad2, Power } from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { postToHost } from "@/lib/hostBridge";

type Stick = { x: number; y: number };

type ControllerTelemetry = {
  sticks: {
    left: Stick;
    right: Stick;
  };
  triggers: {
    left: number;
    right: number;
  };
  buttons: number;
};

type SystemStats = {
  latency?: {
    input?: number;
    processing?: number;
  };
  pollingRate?: number;
  drivers?: {
    vigem?: boolean;
    version?: string;
  };
};

type DeviceStatus = {
  connected?: boolean;
  name?: string;
  type?: string;
  battery?: number;
  batteryLevel?: number;
  batteryPercent?: number;
  batteryStatus?: string;
  charging?: boolean;
};

const DEFAULT_CONTROLLER_TELEMETRY: ControllerTelemetry = {
  sticks: {
    left: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
  },
  triggers: {
    left: 0,
    right: 0,
  },
  buttons: 0,
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const toNumber = (value: unknown): number | undefined => {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};
const toSlotNumber = (value: unknown): number | undefined => {
  const num = toNumber(value);
  if (num === undefined) return undefined;
  return Math.max(0, Math.trunc(num));
};

const normalizeSlotList = (value: unknown): number[] | null => {
  if (Array.isArray(value)) {
    const slots = value
      .map((slot) => toSlotNumber(slot))
      .filter((slot): slot is number => slot !== undefined);
    return slots;
  }
  return null;
};

const parseMaybeJson = (value: unknown) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const parseHostMessage = (event: any): { type: string; payload?: any } | null => {
  let data = parseMaybeJson(event?.data ?? event?.detail?.data ?? event);
  data = parseMaybeJson(data?.data ?? data?.detail?.data ?? data);

  if (data && typeof data === "object" && data.data && typeof data.data === "object" && data.data.type) {
    data = data.data;
  }

  if (
    (!data || typeof data !== "object" || typeof data.type !== "string") &&
    data &&
    typeof data === "object" &&
    data.payload &&
    typeof data.payload === "object" &&
    typeof data.payload.type === "string"
  ) {
    data = data.payload;
  }

  if (!data || typeof data !== "object" || typeof data.type !== "string") return null;

  const payload = typeof data.payload === "string" ? parseMaybeJson(data.payload) : data.payload;
  return { type: data.type, payload };
};

const normalizeControllerData = (payload: any): ControllerTelemetry | null => {
  if (!payload || typeof payload !== "object") return null;
  const source = payload.controller ?? payload.controllerData ?? payload.input ?? payload;
  if (!source || typeof source !== "object") return null;

  const sticksPayload = source.sticks ?? source.stick ?? {};
  const leftStick =
    sticksPayload.left ??
    source.leftStick ??
    (source.lx !== undefined || source.ly !== undefined ? { x: source.lx, y: source.ly } : undefined);
  const rightStick =
    sticksPayload.right ??
    source.rightStick ??
    (source.rx !== undefined || source.ry !== undefined ? { x: source.rx, y: source.ry } : undefined);

  const triggersPayload = source.triggers ?? {};
  const leftTriggerRaw = triggersPayload.left ?? source.leftTrigger ?? source.l2;
  const rightTriggerRaw = triggersPayload.right ?? source.rightTrigger ?? source.r2;

  const buttonsRaw = source.buttons ?? source.buttonMask ?? source.buttonsMask;

  const hasAny =
    leftStick !== undefined ||
    rightStick !== undefined ||
    leftTriggerRaw !== undefined ||
    rightTriggerRaw !== undefined ||
    typeof buttonsRaw === "number";

  if (!hasAny) return null;

  return {
    sticks: {
      left: {
        x: clamp(toNumber(leftStick?.x) ?? 0, -1, 1),
        y: clamp(toNumber(leftStick?.y) ?? 0, -1, 1),
      },
      right: {
        x: clamp(toNumber(rightStick?.x) ?? 0, -1, 1),
        y: clamp(toNumber(rightStick?.y) ?? 0, -1, 1),
      },
    },
    triggers: {
      left: clamp(toNumber(leftTriggerRaw) ?? 0, 0, 1),
      right: clamp(toNumber(rightTriggerRaw) ?? 0, 0, 1),
    },
    buttons: typeof buttonsRaw === "number" ? buttonsRaw : 0,
  };
};

const normalizeSystemStats = (payload: any): SystemStats | null => {
  if (!payload || typeof payload !== "object") return null;
  const source = payload.system ?? payload.systemStats ?? payload.stats ?? payload;
  if (!source || typeof source !== "object") return null;

  const latencySource = source.latency && typeof source.latency === "object" ? source.latency : {};
  const driversSource = source.drivers && typeof source.drivers === "object" ? source.drivers : {};

  const latencyInput = toNumber(latencySource.input);
  const latencyProcessing = toNumber(latencySource.processing);
  const pollingRate = toNumber(source.pollingRateHz ?? source.pollingRate);
  const vigemInstalled = typeof driversSource.vigem === "boolean" ? driversSource.vigem : undefined;
  const vigemVersion = typeof driversSource.version === "string" ? driversSource.version : undefined;

  const hasAny =
    latencyInput !== undefined ||
    latencyProcessing !== undefined ||
    pollingRate !== undefined ||
    vigemInstalled !== undefined ||
    vigemVersion !== undefined;

  if (!hasAny) return null;

  return {
    latency: {
      input: latencyInput,
      processing: latencyProcessing,
    },
    pollingRate,
    drivers: {
      vigem: vigemInstalled,
      version: vigemVersion,
    },
  };
};

const normalizeDeviceStatus = (payload: any): DeviceStatus | null => {
  if (!payload || typeof payload !== "object") return null;
  const source = payload.device ?? payload.deviceStatus ?? payload;
  if (!source || typeof source !== "object") return null;

  const next: DeviceStatus = {};
  if (typeof source.connected === "boolean") next.connected = source.connected;
  if (typeof source.name === "string") next.name = source.name;
  if (typeof source.type === "string") next.type = source.type;
  if (typeof source.battery === "number") next.battery = source.battery;
  if (typeof source.batteryLevel === "number") next.batteryLevel = source.batteryLevel;
  if (typeof source.batteryPercent === "number") next.batteryPercent = source.batteryPercent;
  if (typeof source.batteryStatus === "string") next.batteryStatus = source.batteryStatus;
  if (typeof source.charging === "boolean") next.charging = source.charging;
  if (typeof source.isCharging === "boolean") next.charging = source.isCharging;

  if (Object.keys(next).length === 0) return null;
  if (next.connected === undefined && (next.name || next.type)) {
    next.connected = true;
  }

  return next;
};

const countSetBits = (value: number) => {
  let count = 0;
  let mask = value >>> 0;
  while (mask) {
    mask &= mask - 1;
    count += 1;
  }
  return count;
};

const BUTTON_LABELS = [
  { mask: 1 << 0, label: "A" },
  { mask: 1 << 1, label: "B" },
  { mask: 1 << 2, label: "X" },
  { mask: 1 << 3, label: "Y" },
  { mask: 1 << 4, label: "LB" },
  { mask: 1 << 5, label: "RB" },
  { mask: 1 << 6, label: "Back" },
  { mask: 1 << 7, label: "Start" },
  { mask: 1 << 8, label: "LS" },
  { mask: 1 << 9, label: "RS" },
];

const summarizeButtons = (buttons: number) => {
  const total = countSetBits(buttons);
  if (total === 0) return "No input";
  const pressed = BUTTON_LABELS.filter((button) => (buttons & button.mask) !== 0).map((button) => button.label);
  if (pressed.length === 0) return `${total} pressed`;
  const shown = pressed.slice(0, 3);
  const extra = pressed.length - shown.length;
  return extra > 0
    ? `${total} pressed - ${shown.join(", ")} +${extra}`
    : `${total} pressed - ${shown.join(", ")}`;
};

const formatAxis = (value: number) => value.toFixed(3);
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

const getBatteryPercent = (deviceStatus: DeviceStatus | null) => {
  const raw = deviceStatus?.batteryPercent ?? deviceStatus?.batteryLevel ?? deviceStatus?.battery;
  if (typeof raw !== "number" || Number.isNaN(raw)) return undefined;
  const normalized = raw <= 1 ? raw * 100 : raw;
  return Math.max(0, Math.min(100, Math.round(normalized)));
};

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

function LiveDataStream({
  controllerDataRef,
  systemStats,
}: {
  controllerDataRef: MutableRefObject<ControllerTelemetry>;
  systemStats: SystemStats | null;
}) {
  const [telemetry, setTelemetry] = useState<ControllerTelemetry>(controllerDataRef.current);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry(controllerDataRef.current);
    }, 200);

    return () => clearInterval(interval);
  }, [controllerDataRef]);

  const leftStick = telemetry.sticks.left;
  const rightStick = telemetry.sticks.right;
  const triggers = telemetry.triggers;
  const buttonsCount = countSetBits(telemetry.buttons);
  const buttonsSummary = summarizeButtons(telemetry.buttons);
  const streamActive = (systemStats?.pollingRate ?? 0) > 0;
  const latencyValue = systemStats?.latency?.input;
  const latencyText = `${Math.round(latencyValue ?? 0)}ms latency`;
  const buttonsClass = buttonsCount > 0 ? "text-emerald-400 font-mono" : "text-muted-foreground/60 italic";

  return (
    <Card className="bg-card/40 border-border/50 p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 text-emerald-400">
          <Activity className="w-4 h-4" />
          <h3 className="font-semibold text-sm">Live Data Stream</h3>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge active={streamActive} text={streamActive ? "Stream" : "Idle"} />
          <span className="text-xs text-muted-foreground font-mono">{latencyText}</span>
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
              <StatRow label="X-axis" value={formatAxis(leftStick.x)} />
              <StatRow label="Y-axis" value={formatAxis(leftStick.y)} />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
              <span className="w-1 h-3 bg-emerald-500/50 rounded-full"></span>
              Right Stick
            </h4>
            <div className="pl-3 space-y-1 border-l border-white/5">
              <StatRow label="X-axis" value={formatAxis(rightStick.x)} />
              <StatRow label="Y-axis" value={formatAxis(rightStick.y)} />
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
              <StatRow label="Left Trigger" value={formatPercent(triggers.left)} />
              <StatRow label="Right Trigger" value={formatPercent(triggers.right)} />
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-2">
               <span className="w-1 h-3 bg-orange-500/50 rounded-full"></span>
               Buttons
            </h4>
             <div className={`pl-3 h-6 text-xs flex items-center border-l border-white/5 ${buttonsClass}`}>{buttonsSummary}</div>
          </div>
        </div>
      </div>

    </Card>
  );
}

function SystemStatus({
  systemStats,
  deviceStatus,
}: {
  systemStats: SystemStats | null;
  deviceStatus: DeviceStatus | null;
}) {
  const deviceConnected = deviceStatus?.connected ?? false;
  const deviceName = deviceStatus?.name || deviceStatus?.type || "Gamepad";
  const batteryPercent = getBatteryPercent(deviceStatus);
  const isCharging =
    deviceStatus?.charging ??
    (typeof deviceStatus?.batteryStatus === "string" ? /charg/i.test(deviceStatus.batteryStatus) : false);
  const deviceStateText = deviceConnected ? "Connected" : "Disconnected";
  const deviceBadgeText = deviceName ? `${deviceName} ${deviceStateText}` : deviceStateText;
  const batteryText =
    batteryPercent !== undefined
      ? `Battery ${batteryPercent}%${isCharging ? " (Charging)" : ""}`
      : isCharging
        ? "Charging"
        : undefined;
  const deviceBadgeClass = deviceConnected
    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20";

  const vigemInstalled = systemStats?.drivers?.vigem;
  const vigemVersion = systemStats?.drivers?.version;
  const vigemLabel =
    vigemInstalled === undefined ? "Unknown" : vigemInstalled ? "Installed" : "Missing";
  const vigemText = vigemVersion ? `${vigemLabel} v${vigemVersion}` : vigemLabel;
  const vigemClass =
    vigemInstalled === true
      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
      : vigemInstalled === false
        ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
        : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20";

  const pollingRate = systemStats?.pollingRate;
  const pollingRateText = `${pollingRate ?? 0} Hz`;
  const dataStreamClass = (pollingRate ?? 0) > 0 ? "text-emerald-400" : "text-muted-foreground";

  return (
    <Card className="bg-card/40 border-border/50 p-5 backdrop-blur-md shadow-lg">
      <div className="flex items-center gap-2 mb-4 text-orange-400">
        <Activity className="w-4 h-4" />
        <h3 className="font-semibold text-sm text-foreground">System Status</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center group">
          <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">XInput Device</span>
          <div className="flex items-center">
            <Badge variant="outline" className={`${deviceBadgeClass} text-[10px] font-mono`}>{deviceBadgeText}</Badge>
            {batteryText && (
              <span className="ml-2 text-[10px] text-muted-foreground font-mono">{batteryText}</span>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center group">
          <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">ViGEm Driver</span>
          <Badge variant="outline" className={`${vigemClass} text-[10px] font-mono`}>{vigemText}</Badge>
        </div>
        <div className="flex justify-between items-center group">
          <span className="text-sm text-muted-foreground group-hover:text-white transition-colors">Data Stream</span>
          <span className={`text-sm font-mono ${dataStreamClass}`}>{pollingRateText}</span>
        </div>
      </div>
    </Card>
  );
}

import controllerImage from '/assets/controller.png'

function ControllerVisualizer({
  controllerDataRef,
  systemStats,
  deviceStatus,
  waitingForInput,
}: {
  controllerDataRef: MutableRefObject<ControllerTelemetry>;
  systemStats: SystemStats | null;
  deviceStatus: DeviceStatus | null;
  waitingForInput: boolean;
}) {
  const [telemetry, setTelemetry] = useState<ControllerTelemetry>(controllerDataRef.current);

  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      setTelemetry(controllerDataRef.current);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [controllerDataRef]);

  const latencyValue = systemStats?.latency?.input;
  const latencyText = `${Math.round(latencyValue ?? 0)}ms`;
  const updateRate = systemStats?.pollingRate;
  const updateRateDisplay = updateRate !== undefined ? updateRate : 0;
  const buttonsCount = countSetBits(telemetry.buttons);
  const streamActive = (systemStats?.pollingRate ?? 0) > 0;

  const deviceConnected = deviceStatus?.connected ?? false;
  const deviceName = deviceStatus?.name || deviceStatus?.type || "Gamepad";
  const deviceStateText = deviceConnected ? "Connected" : "Disconnected";
  const deviceBadgeText = deviceName ? `${deviceName} ${deviceStateText}` : deviceStateText;
  const deviceBadgeClass = deviceConnected
    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20";

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
          <StatusBadge active={streamActive} text={streamActive ? "Stream Active" : "Stream Idle"} />
          <div className="w-px h-3 bg-white/10"></div>
          <span className="text-xs text-muted-foreground">Latency <span className="text-emerald-400 font-mono font-bold">{latencyText}</span></span>
        </div>
      </div>

      <div className="absolute top-24 right-6 z-10">
         <Badge className={`${deviceBadgeClass} backdrop-blur-md shadow-lg`}>
           <div className={`w-1.5 h-1.5 rounded-full mr-2 ${deviceConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"} ${deviceConnected ? "animate-pulse" : ""}`} />
           {deviceBadgeText}
         </Badge>
      </div>

      {/* Visualization Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        <div className="relative w-full h-full max-h-[400px] flex items-center justify-center">
           <img 
             src={controllerImage} 
             alt="Controller Visualization"
             className="w-full h-full object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]"
             loading="eager"
             fetchPriority="high"
             decoding="async"
             style={{ aspectRatio: "16/9" }}
           />
           {waitingForInput && (
             <div className="absolute inset-0 flex items-center justify-center z-20">
               <div className="px-4 py-2 rounded-lg bg-black/70 border border-white/10 text-xs text-muted-foreground">
                 Waiting for controller input...
               </div>
             </div>
           )}
        </div>

        {/* Live Data Overlay on Controller */}
        <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-[10px] shadow-2xl w-full max-w-[280px] mt-4 z-20">
           <div className="text-emerald-500/70 font-bold">LX <span className="text-white ml-2">{formatAxis(telemetry.sticks.left.x)}</span></div>
           <div className="text-emerald-500/70 font-bold">LY <span className="text-white ml-2">{formatAxis(telemetry.sticks.left.y)}</span></div>
           <div className="text-blue-500/70 font-bold">RX <span className="text-white ml-2">{formatAxis(telemetry.sticks.right.x)}</span></div>
           <div className="text-blue-500/70 font-bold">RY <span className="text-white ml-2">{formatAxis(telemetry.sticks.right.y)}</span></div>
           
           <div className="col-span-2 h-px bg-white/10 my-1"></div>
           
           <div className="text-muted-foreground">LT <span className="text-white ml-2">{formatPercent(telemetry.triggers.left)}</span></div>
           <div className="text-muted-foreground">RT <span className="text-white ml-2">{formatPercent(telemetry.triggers.right)}</span></div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="h-24 border-t border-border/50 grid grid-cols-3 divide-x divide-border/50 bg-black/40 backdrop-blur-sm">
        <div className="p-4 flex flex-col justify-center items-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Update Rate</span>
          <span className="text-3xl font-bold text-emerald-400 tracking-tighter drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">{updateRateDisplay}<span className="text-sm align-top ml-1 text-emerald-600">Hz</span></span>
        </div>
        <div className="p-4 flex flex-col justify-center items-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Input Latency</span>
          <span className="text-3xl font-bold text-blue-400 tracking-tighter drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">{Math.round(latencyValue ?? 0)}<span className="text-sm align-top ml-1 text-blue-600">ms</span></span>
        </div>
        <div className="p-4 flex flex-col justify-center items-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Active Buttons</span>
          <span className="text-3xl font-bold text-orange-400 tracking-tighter drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]">{buttonsCount}</span>
        </div>
      </div>
    </Card>
  );
}

// --- Page ---

export default function Dashboard() {
  const controllerDataRef = useRef<ControllerTelemetry>(DEFAULT_CONTROLLER_TELEMETRY);
  const waitingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resubscribeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastControllerDataRef = useRef<number | null>(null);
  const subscribedSlotRef = useRef<number | null>(null);
  const pendingSlotRef = useRef<number | null>(null);
  const activeSlotRef = useRef<number | null>(null);
  const connectedSlotsRef = useRef<number[] | null>(null);

  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [waitingForInput, setWaitingForInput] = useState(false);

  const scheduleWaitingNotice = () => {
    if (waitingTimerRef.current) {
      clearTimeout(waitingTimerRef.current);
    }
    const last = lastControllerDataRef.current;
    const elapsed = last ? Date.now() - last : 0;
    const delay = Math.max(0, 2000 - elapsed);
    waitingTimerRef.current = setTimeout(() => setWaitingForInput(true), delay);
  };

  const markControllerDataReceived = () => {
    lastControllerDataRef.current = Date.now();
    setWaitingForInput(false);
    scheduleWaitingNotice();
  };

  const subscribeToSlot = (slot: number | null) => {
    if (typeof slot === "number" && subscribedSlotRef.current !== null && subscribedSlotRef.current !== slot) {
      postToHost({ type: "UNSUBSCRIBE_DASHBOARD_STREAM", payload: { slot: subscribedSlotRef.current } });
      subscribedSlotRef.current = null;
    }

    if (typeof slot === "number") {
      postToHost({ type: "SUBSCRIBE_DASHBOARD_STREAM", payload: { slot } });
      subscribedSlotRef.current = slot;
    } else {
      postToHost({ type: "SUBSCRIBE_DASHBOARD_STREAM" });
      subscribedSlotRef.current = null;
    }
    scheduleWaitingNotice();
  };

  const scheduleResubscribe = (slot: number) => {
    if (!Number.isFinite(slot)) return;
    if (subscribedSlotRef.current === slot || pendingSlotRef.current === slot) return;
    if (resubscribeTimerRef.current) {
      clearTimeout(resubscribeTimerRef.current);
    }
    pendingSlotRef.current = slot;
      resubscribeTimerRef.current = setTimeout(() => {
        resubscribeTimerRef.current = null;
        const nextSlot = pendingSlotRef.current;
        pendingSlotRef.current = null;
        if (nextSlot === null || subscribedSlotRef.current === nextSlot) return;
        const previousSlot = subscribedSlotRef.current;
        if (typeof previousSlot === "number") {
          postToHost({ type: "UNSUBSCRIBE_DASHBOARD_STREAM", payload: { slot: previousSlot } });
        } else {
          postToHost({ type: "UNSUBSCRIBE_DASHBOARD_STREAM" });
        }
        subscribedSlotRef.current = null;
        subscribeToSlot(nextSlot);
      }, 250);
  };

  const applyControllerData = (payload: any) => {
    const next = normalizeControllerData(payload);
    if (!next) return;
    controllerDataRef.current = next;
    markControllerDataReceived();
  };

  const applySystemStats = (payload: any) => {
    const next = normalizeSystemStats(payload);
    if (!next) return;
    setSystemStats((prev) => ({
      latency: {
        input: next.latency?.input ?? prev?.latency?.input,
        processing: next.latency?.processing ?? prev?.latency?.processing,
      },
      pollingRate: next.pollingRate ?? prev?.pollingRate,
      drivers: {
        vigem: next.drivers?.vigem ?? prev?.drivers?.vigem,
        version: next.drivers?.version ?? prev?.drivers?.version,
      },
    }));
  };

  const applyDeviceStatus = (payload: any) => {
    const next = normalizeDeviceStatus(payload);
    if (!next) return;
    setDeviceStatus((prev) => ({ ...(prev ?? {}), ...next }));
  };

  const applySnapshot = (payload: any) => {
    if (!payload || typeof payload !== "object") return;
    const activeSlot = toSlotNumber(payload.activeSlot);
    const connectedSlots = normalizeSlotList(payload.connectedSlots);

    if (typeof activeSlot === "number") {
      if (activeSlotRef.current !== activeSlot && subscribedSlotRef.current !== activeSlot) {
        scheduleResubscribe(activeSlot);
      }
      activeSlotRef.current = activeSlot;
    }

    if (connectedSlots) {
      connectedSlotsRef.current = connectedSlots;
      if (
        subscribedSlotRef.current !== null &&
        !connectedSlots.includes(subscribedSlotRef.current)
      ) {
        const fallbackSlot = typeof activeSlotRef.current === "number" ? activeSlotRef.current : 0;
        scheduleResubscribe(fallbackSlot);
      }
      if (subscribedSlotRef.current === null && typeof activeSlot !== "number" && connectedSlots.length > 0) {
        scheduleResubscribe(connectedSlots[0]);
      }
    }

    if (payload.controllerData ?? payload.controller) {
      applyControllerData(payload.controllerData ?? payload.controller);
    }
    if (payload.systemStats ?? payload.system ?? payload.stats) {
      applySystemStats(payload.systemStats ?? payload.system ?? payload.stats);
    }
    if (payload.deviceStatus ?? payload.device) {
      applyDeviceStatus(payload.deviceStatus ?? payload.device);
    }
  };

  useEffect(() => {
    postToHost({ type: "GET_DASHBOARD_SNAPSHOT" });
    subscribeToSlot(subscribedSlotRef.current);
    scheduleWaitingNotice();

    return () => {
      if (waitingTimerRef.current) {
        clearTimeout(waitingTimerRef.current);
        waitingTimerRef.current = null;
      }
      if (resubscribeTimerRef.current) {
        clearTimeout(resubscribeTimerRef.current);
        resubscribeTimerRef.current = null;
      }
      pendingSlotRef.current = null;
      const currentSlot = subscribedSlotRef.current;
      if (typeof currentSlot === "number") {
        postToHost({ type: "UNSUBSCRIBE_DASHBOARD_STREAM", payload: { slot: currentSlot } });
      } else {
        postToHost({ type: "UNSUBSCRIBE_DASHBOARD_STREAM" });
      }
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: any) => {
      const message = parseHostMessage(event);
      if (!message) return;

      switch (message.type) {
        case "DASHBOARD_SNAPSHOT":
          applySnapshot(message.payload);
          break;
        case "CONTROLLER_DATA":
          applyControllerData(message.payload);
          break;
        case "SYSTEM_STATS":
          applySystemStats(message.payload);
          break;
        case "DEVICE_STATUS":
          applyDeviceStatus(message.payload);
          break;
        default:
          break;
      }
    };

    const webview = (window as any).chrome?.webview;
    if (webview && typeof webview.addEventListener === "function") {
      webview.addEventListener("message", handleMessage);
      return () => {
        if (typeof webview.removeEventListener === "function") {
          webview.removeEventListener("message", handleMessage);
        }
      };
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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
          <ControllerVisualizer
            controllerDataRef={controllerDataRef}
            systemStats={systemStats}
            deviceStatus={deviceStatus}
            waitingForInput={waitingForInput}
          />
        </div>

        {/* Right Column: Data & Status (4 cols) */}
        <div className="col-span-12 lg:col-span-4 h-full flex flex-col gap-6">
          <LiveDataStream controllerDataRef={controllerDataRef} systemStats={systemStats} />
          <SystemStatus systemStats={systemStats} deviceStatus={deviceStatus} />
          
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
