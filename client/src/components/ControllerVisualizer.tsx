import { useEffect, useRef, type MutableRefObject } from "react";
import { Gamepad2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ControllerTelemetry, DeviceStatus, SystemStats } from "@/lib/telemetryTypes";
import controllerImage from "/assets/controller.png";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const formatAxis = (value: number) => value.toFixed(3);
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;
const debug = false;

const BUTTON_BITS = {
  cross: 1 << 0,
  circle: 1 << 1,
  square: 1 << 2,
  triangle: 1 << 3,
  l1: 1 << 4,
  r1: 1 << 5,
  l2: 1 << 6,
  r2: 1 << 7,
  share: 1 << 8,
  options: 1 << 9,
  l3: 1 << 10,
  r3: 1 << 11,
  ps: 1 << 12,
  touch: 1 << 13,
  dpadUp: 1 << 14,
  dpadDown: 1 << 15,
  dpadLeft: 1 << 16,
  dpadRight: 1 << 17,
  mute: 1 << 18,
  touch1: 1 << 19,
  touch2: 1 << 20,
  capture: 1 << 21,
  sideL: 1 << 22,
  sideR: 1 << 23,
  fnL: 1 << 24,
  fnR: 1 << 25,
  blp: 1 << 26,
  brp: 1 << 27,
} as const;

type ButtonKey = keyof typeof BUTTON_BITS;

type StickLayout = {
  xPercent: number;
  yPercent: number;
  radiusPx: number;
};

type TriggerLayout = {
  xPercent: number;
  yPercent: number;
  widthPx: number;
  heightPx: number;
};

type ButtonLayout = {
  xPercent: number;
  yPercent: number;
  sizePx?: number;
  widthPx?: number;
  heightPx?: number;
};

// TODO: Adjust xPercent/yPercent values to fine-tune overlay alignment with controller.png.
const controllerLayout: {
  sticks: { left: StickLayout; right: StickLayout };
  triggers: { left: TriggerLayout; right: TriggerLayout };
  buttons: Record<ButtonKey, ButtonLayout>;
} = {
  sticks: {
    left: { xPercent: 0.338, yPercent: 0.614, radiusPx: 22 },
    right: { xPercent: 0.658, yPercent: 0.614, radiusPx: 22 },
  },
  triggers: {
    left: { xPercent: 0.275, yPercent: 0.13, widthPx: 16, heightPx: 70 },
    right: { xPercent: 0.885, yPercent: 0.13, widthPx: 16, heightPx: 70 },
  },
  buttons: {
    cross: { xPercent: 0.796, yPercent: 0.459, sizePx: 14 },
    circle: { xPercent: 0.84, yPercent: 0.399, sizePx: 14 },
    square: { xPercent: 0.752, yPercent: 0.399, sizePx: 14 },
    triangle: { xPercent: 0.796, yPercent: 0.339, sizePx: 14 },
    l1: { xPercent: 0.265, yPercent: 0.29, sizePx: 18 },
    r1: { xPercent: 0.875, yPercent: 0.29, sizePx: 18 },
    l2: { xPercent: 0.275, yPercent: 0.19, sizePx: 18 },
    r2: { xPercent: 0.885, yPercent: 0.19, sizePx: 18 },
    share: { xPercent: 0.46, yPercent: 0.40, sizePx: 10 },
    options: { xPercent: 0.54, yPercent: 0.40, sizePx: 10 },
    l3: { xPercent: 0.338, yPercent: 0.614, sizePx: 22 },
    r3: { xPercent: 0.658, yPercent: 0.614, sizePx: 22 },
    ps: { xPercent: 0.5, yPercent: 0.58, sizePx: 12 },
    touch: { xPercent: 0.5, yPercent: 0.33, widthPx: 300, heightPx: 80 },
    dpadUp: { xPercent: 0.227, yPercent: 0.49, sizePx: 12 },
    dpadDown: { xPercent: 0.227, yPercent: 0.61, sizePx: 12 },
    dpadLeft: { xPercent: 0.187, yPercent: 0.551, sizePx: 12 },
    dpadRight: { xPercent: 0.267, yPercent: 0.551, sizePx: 12 },
    mute: { xPercent: 0.5, yPercent: 0.53, sizePx: 8 },
    touch1: { xPercent: 0.47, yPercent: 0.33, sizePx: 8 },
    touch2: { xPercent: 0.53, yPercent: 0.33, sizePx: 8 },
    capture: { xPercent: 0.43, yPercent: 0.40, sizePx: 8 },
    sideL: { xPercent: 0.08, yPercent: 0.66, sizePx: 8 },
    sideR: { xPercent: 0.92, yPercent: 0.66, sizePx: 8 },
    fnL: { xPercent: 0.45, yPercent: 0.78, sizePx: 8 },
    fnR: { xPercent: 0.55, yPercent: 0.78, sizePx: 8 },
    blp: { xPercent: 0.28, yPercent: 0.86, sizePx: 8 },
    brp: { xPercent: 0.72, yPercent: 0.86, sizePx: 8 },
  },
};

const buttonEntries = Object.entries(controllerLayout.buttons) as [ButtonKey, ButtonLayout][];

const debugLabels: Partial<Record<ButtonKey, string>> = {
  cross: "X",
  circle: "O",
  square: "SQ",
  triangle: "TRI",
  l1: "L1",
  r1: "R1",
  l2: "L2",
  r2: "R2",
  share: "SH",
  options: "OP",
  l3: "L3",
  r3: "R3",
  ps: "PS",
  touch: "TP",
  dpadUp: "DU",
  dpadDown: "DD",
  dpadLeft: "DL",
  dpadRight: "DR",
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

const applyStickTransform = (
  element: HTMLDivElement | null,
  x: number,
  y: number,
  layout: StickLayout,
) => {
  if (!element) return;
  const clampedX = clamp(x, -1, 1);
  const clampedY = clamp(y, -1, 1);
  const length = Math.hypot(clampedX, clampedY);
  const scale = length > 1 ? 1 / length : 1;
  const offsetX = clampedX * layout.radiusPx * scale;
  const offsetY = clampedY * layout.radiusPx * scale;
  element.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;
};

const applyTriggerFill = (element: HTMLDivElement | null, value: number) => {
  if (!element) return;
  const clamped = clamp(value, 0, 1);
  element.style.transform = `scaleY(${clamped})`;
};

const applyButtonState = (element: HTMLDivElement | null, pressed: boolean) => {
  if (!element) return;
  element.style.opacity = pressed ? "1" : "0.25";
  element.style.boxShadow = pressed ? "0 0 14px rgba(16, 185, 129, 0.65)" : "none";
  element.style.transform = pressed ? "translate(-50%, -50%) scale(1.1)" : "translate(-50%, -50%)";
};

function StatusBadge({ active, text }: { active: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${active ? "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" : "bg-muted-foreground"}`} />
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{text}</span>
    </div>
  );
}

export type ControllerVisualizerProps = {
  controllerDataRef: MutableRefObject<ControllerTelemetry>;
  systemStats: SystemStats | null;
  deviceStatus: DeviceStatus | null;
  waitingForInput: boolean;
  engineActive: boolean;
};

export function ControllerVisualizer({
  controllerDataRef,
  systemStats,
  deviceStatus,
  waitingForInput,
  engineActive,
}: ControllerVisualizerProps) {
  const stickDotRefs = useRef<{ left: HTMLDivElement | null; right: HTMLDivElement | null }>({
    left: null,
    right: null,
  });
  const triggerFillRefs = useRef<{ left: HTMLDivElement | null; right: HTMLDivElement | null }>({
    left: null,
    right: null,
  });
  const buttonRefs = useRef<Record<ButtonKey, HTMLDivElement | null>>({
    cross: null,
    circle: null,
    square: null,
    triangle: null,
    l1: null,
    r1: null,
    l2: null,
    r2: null,
    share: null,
    options: null,
    l3: null,
    r3: null,
    ps: null,
    touch: null,
    dpadUp: null,
    dpadDown: null,
    dpadLeft: null,
    dpadRight: null,
    mute: null,
    touch1: null,
    touch2: null,
    capture: null,
    sideL: null,
    sideR: null,
    fnL: null,
    fnR: null,
    blp: null,
    brp: null,
  });
  const axisValueRefs = useRef<{
    lx: HTMLSpanElement | null;
    ly: HTMLSpanElement | null;
    rx: HTMLSpanElement | null;
    ry: HTMLSpanElement | null;
    lt: HTMLSpanElement | null;
    rt: HTMLSpanElement | null;
  }>({
    lx: null,
    ly: null,
    rx: null,
    ry: null,
    lt: null,
    rt: null,
  });
  const activeButtonsRef = useRef<HTMLSpanElement | null>(null);
  const lastButtonsRef = useRef<number | null>(null);

  useEffect(() => {
    let rafId = 0;

    const tick = () => {
      const telemetry = controllerDataRef.current;
      const sticks = telemetry.sticks;
      const triggers = telemetry.triggers;
      const buttons = telemetry.buttons;

      applyStickTransform(stickDotRefs.current.left, sticks.left.x, sticks.left.y, controllerLayout.sticks.left);
      applyStickTransform(stickDotRefs.current.right, sticks.right.x, sticks.right.y, controllerLayout.sticks.right);

      applyTriggerFill(triggerFillRefs.current.left, triggers.left);
      applyTriggerFill(triggerFillRefs.current.right, triggers.right);

      if (axisValueRefs.current.lx) {
        axisValueRefs.current.lx.textContent = formatAxis(sticks.left.x);
      }
      if (axisValueRefs.current.ly) {
        axisValueRefs.current.ly.textContent = formatAxis(sticks.left.y);
      }
      if (axisValueRefs.current.rx) {
        axisValueRefs.current.rx.textContent = formatAxis(sticks.right.x);
      }
      if (axisValueRefs.current.ry) {
        axisValueRefs.current.ry.textContent = formatAxis(sticks.right.y);
      }
      if (axisValueRefs.current.lt) {
        axisValueRefs.current.lt.textContent = formatPercent(triggers.left);
      }
      if (axisValueRefs.current.rt) {
        axisValueRefs.current.rt.textContent = formatPercent(triggers.right);
      }

      if (lastButtonsRef.current !== buttons) {
        for (const [key] of buttonEntries) {
          const element = buttonRefs.current[key];
          const pressed = (buttons & BUTTON_BITS[key]) !== 0;
          applyButtonState(element, pressed);
        }
        if (activeButtonsRef.current) {
          activeButtonsRef.current.textContent = `${countSetBits(buttons)}`;
        }
        lastButtonsRef.current = buttons;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [controllerDataRef]);

  const latencyValue = systemStats?.latency?.input;
  const latencyText = `${Math.round(latencyValue ?? 0)}ms`;
  const updateRate = systemStats?.pollingRate;
  const updateRateDisplay = Math.round(updateRate ?? 0);
  const streamActive = (systemStats?.pollingRate ?? 0) > 0;
  const resolvedEngineActive = engineActive ?? (systemStats?.engineRunning ?? streamActive);

  const deviceConnected = deviceStatus?.connected ?? false;
  const deviceName = deviceStatus?.name || deviceStatus?.type || "Gamepad";
  const deviceStateText = deviceConnected ? "Connected" : "Disconnected";
  const deviceBadgeText = deviceName ? `${deviceName} ${deviceStateText}` : deviceStateText;
  const deviceBadgeClass = deviceConnected
    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20";

  return (
    <Card className="h-full bg-[#0B0D14] border-border/50 p-1 flex flex-col relative overflow-hidden shadow-2xl">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.03),transparent_70%)] pointer-events-none"></div>

      <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-10">
        <div className="flex items-center gap-3 text-emerald-400">
          <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-[0_0_15px_-5px_rgba(16,185,129,0.3)]">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <h2 className="font-semibold tracking-wide text-white">Live Controller Visualization</h2>
        </div>
        <div className="flex items-center gap-4 bg-black/40 backdrop-blur rounded-full px-4 py-1.5 border border-white/5">
          <StatusBadge active={resolvedEngineActive} text={resolvedEngineActive ? "Engine Active" : "Engine Idle"} />
          <div className="w-px h-3 bg-white/10"></div>
          <span className="text-xs text-muted-foreground">
            Latency <span className="text-emerald-400 font-mono font-bold">{latencyText}</span>
          </span>
        </div>
      </div>

      <div className="absolute top-24 right-6 z-10">
        <Badge className={`${deviceBadgeClass} backdrop-blur-md shadow-lg`}>
          <div
            className={`w-1.5 h-1.5 rounded-full mr-2 ${deviceConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-yellow-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]"} ${deviceConnected ? "animate-pulse" : ""}`}
          />
          {deviceBadgeText}
        </Badge>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative p-8">
        <div className="relative w-full max-w-[760px]">
          <div className="relative w-full" style={{ aspectRatio: "25006 / 16614" }}>
            <img
              src={controllerImage}
              alt="Controller Visualization"
              className="absolute inset-0 w-full h-full object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.2)]"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
            <div className="absolute inset-0 pointer-events-none">
              <div
                className="absolute rounded-full border border-white/15"
                style={{
                  left: `${controllerLayout.sticks.left.xPercent * 100}%`,
                  top: `${controllerLayout.sticks.left.yPercent * 100}%`,
                  width: `${controllerLayout.sticks.left.radiusPx * 2}px`,
                  height: `${controllerLayout.sticks.left.radiusPx * 2}px`,
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div
                className="absolute rounded-full border border-white/15"
                style={{
                  left: `${controllerLayout.sticks.right.xPercent * 100}%`,
                  top: `${controllerLayout.sticks.right.yPercent * 100}%`,
                  width: `${controllerLayout.sticks.right.radiusPx * 2}px`,
                  height: `${controllerLayout.sticks.right.radiusPx * 2}px`,
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div
                ref={(el) => {
                  stickDotRefs.current.left = el;
                }}
                className="absolute w-3 h-3 rounded-full bg-emerald-400/90 shadow-[0_0_12px_rgba(16,185,129,0.7)] will-change-transform"
                style={{
                  left: `${controllerLayout.sticks.left.xPercent * 100}%`,
                  top: `${controllerLayout.sticks.left.yPercent * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div
                ref={(el) => {
                  stickDotRefs.current.right = el;
                }}
                className="absolute w-3 h-3 rounded-full bg-blue-400/90 shadow-[0_0_12px_rgba(59,130,246,0.7)] will-change-transform"
                style={{
                  left: `${controllerLayout.sticks.right.xPercent * 100}%`,
                  top: `${controllerLayout.sticks.right.yPercent * 100}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />

              <div
                className="absolute"
                style={{
                  left: `${controllerLayout.triggers.left.xPercent * 100}%`,
                  top: `${controllerLayout.triggers.left.yPercent * 100}%`,
                  width: `${controllerLayout.triggers.left.widthPx}px`,
                  height: `${controllerLayout.triggers.left.heightPx}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5"></div>
                <div
                  ref={(el) => {
                    triggerFillRefs.current.left = el;
                  }}
                  className="absolute bottom-0 left-0 right-0 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.6)] origin-bottom will-change-transform"
                  style={{ transform: "scaleY(0)" }}
                />
              </div>
              <div
                className="absolute"
                style={{
                  left: `${controllerLayout.triggers.right.xPercent * 100}%`,
                  top: `${controllerLayout.triggers.right.yPercent * 100}%`,
                  width: `${controllerLayout.triggers.right.widthPx}px`,
                  height: `${controllerLayout.triggers.right.heightPx}px`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="absolute inset-0 rounded-full border border-white/10 bg-white/5"></div>
                <div
                  ref={(el) => {
                    triggerFillRefs.current.right = el;
                  }}
                  className="absolute bottom-0 left-0 right-0 rounded-full bg-emerald-400/80 shadow-[0_0_10px_rgba(16,185,129,0.6)] origin-bottom will-change-transform"
                  style={{ transform: "scaleY(0)" }}
                />
              </div>

              {buttonEntries.map(([key, layout]) => {
                const width = layout.widthPx ?? layout.sizePx ?? 10;
                const height = layout.heightPx ?? layout.sizePx ?? 10;
                return (
                  <div
                    key={key}
                    ref={(el) => {
                      buttonRefs.current[key] = el;
                    }}
                    className="absolute rounded-full border border-white/15 bg-emerald-400/20 opacity-25 transition-[opacity,box-shadow,transform] duration-75"
                    style={{
                      left: `${layout.xPercent * 100}%`,
                      top: `${layout.yPercent * 100}%`,
                      width: `${width}px`,
                      height: `${height}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                );
              })}

              {debug && (
                <>
                  <div
                    className="absolute rounded-full border border-cyan-400/60"
                    style={{
                      left: `${controllerLayout.sticks.left.xPercent * 100}%`,
                      top: `${controllerLayout.sticks.left.yPercent * 100}%`,
                      width: `${controllerLayout.sticks.left.radiusPx * 2}px`,
                      height: `${controllerLayout.sticks.left.radiusPx * 2}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-cyan-200 font-mono">
                      LS
                    </div>
                  </div>
                  <div
                    className="absolute rounded-full border border-cyan-400/60"
                    style={{
                      left: `${controllerLayout.sticks.right.xPercent * 100}%`,
                      top: `${controllerLayout.sticks.right.yPercent * 100}%`,
                      width: `${controllerLayout.sticks.right.radiusPx * 2}px`,
                      height: `${controllerLayout.sticks.right.radiusPx * 2}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-cyan-200 font-mono">
                      RS
                    </div>
                  </div>
                  <div
                    className="absolute border border-fuchsia-400/60 rounded-md"
                    style={{
                      left: `${controllerLayout.triggers.left.xPercent * 100}%`,
                      top: `${controllerLayout.triggers.left.yPercent * 100}%`,
                      width: `${controllerLayout.triggers.left.widthPx}px`,
                      height: `${controllerLayout.triggers.left.heightPx}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-fuchsia-300 font-mono">
                      L2
                    </div>
                  </div>
                  <div
                    className="absolute border border-fuchsia-400/60 rounded-md"
                    style={{
                      left: `${controllerLayout.triggers.right.xPercent * 100}%`,
                      top: `${controllerLayout.triggers.right.yPercent * 100}%`,
                      width: `${controllerLayout.triggers.right.widthPx}px`,
                      height: `${controllerLayout.triggers.right.heightPx}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-fuchsia-300 font-mono">
                      R2
                    </div>
                  </div>
                  {buttonEntries.map(([key, layout]) => {
                    const width = layout.widthPx ?? layout.sizePx ?? 10;
                    const height = layout.heightPx ?? layout.sizePx ?? 10;
                    const label = debugLabels[key];
                    return (
                      <div
                        key={`debug-${key}`}
                        className="absolute border border-yellow-400/60 rounded-full"
                        style={{
                          left: `${layout.xPercent * 100}%`,
                          top: `${layout.yPercent * 100}%`,
                          width: `${width}px`,
                          height: `${height}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        {label && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-yellow-200 font-mono">
                            {label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {waitingForInput && (
              <div className="absolute inset-0 flex items-center justify-center z-20">
                <div className="px-4 py-2 rounded-lg bg-black/70 border border-white/10 text-xs text-muted-foreground">
                  Waiting for controller input...
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-black/80 backdrop-blur-md rounded-xl p-4 border border-white/10 grid grid-cols-2 gap-x-8 gap-y-2 font-mono text-[10px] shadow-2xl w-full max-w-[280px] mt-4 z-20">
          <div className="text-emerald-500/70 font-bold">
            LX{" "}
            <span className="text-white ml-2" ref={(el) => (axisValueRefs.current.lx = el)}>
              0.000
            </span>
          </div>
          <div className="text-emerald-500/70 font-bold">
            LY{" "}
            <span className="text-white ml-2" ref={(el) => (axisValueRefs.current.ly = el)}>
              0.000
            </span>
          </div>
          <div className="text-blue-500/70 font-bold">
            RX{" "}
            <span className="text-white ml-2" ref={(el) => (axisValueRefs.current.rx = el)}>
              0.000
            </span>
          </div>
          <div className="text-blue-500/70 font-bold">
            RY{" "}
            <span className="text-white ml-2" ref={(el) => (axisValueRefs.current.ry = el)}>
              0.000
            </span>
          </div>

          <div className="col-span-2 h-px bg-white/10 my-1"></div>

          <div className="text-muted-foreground">
            LT{" "}
            <span className="text-white ml-2" ref={(el) => (axisValueRefs.current.lt = el)}>
              0%
            </span>
          </div>
          <div className="text-muted-foreground">
            RT{" "}
            <span className="text-white ml-2" ref={(el) => (axisValueRefs.current.rt = el)}>
              0%
            </span>
          </div>
        </div>
      </div>

      <div className="h-24 border-t border-border/50 grid grid-cols-3 divide-x divide-border/50 bg-black/40 backdrop-blur-sm">
        <div className="p-4 flex flex-col justify-center items-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Update Rate</span>
          <span className="text-3xl font-bold text-emerald-400 tracking-tighter drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            {updateRateDisplay}
            <span className="text-sm align-top ml-1 text-emerald-600">Hz</span>
          </span>
        </div>
        <div className="p-4 flex flex-col justify-center items-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Input Latency</span>
          <span className="text-3xl font-bold text-blue-400 tracking-tighter drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]">
            {Math.round(latencyValue ?? 0)}
            <span className="text-sm align-top ml-1 text-blue-600">ms</span>
          </span>
        </div>
        <div className="p-4 flex flex-col justify-center items-center">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-1">Active Buttons</span>
          <span
            className="text-3xl font-bold text-orange-400 tracking-tighter drop-shadow-[0_0_10px_rgba(249,115,22,0.3)]"
            ref={activeButtonsRef}
          >
            0
          </span>
        </div>
      </div>
    </Card>
  );
}
