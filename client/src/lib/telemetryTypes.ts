export type Stick = { x: number; y: number };

export type ControllerTelemetry = {
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

export type SystemStats = {
  latency?: {
    input?: number;
    processing?: number;
  };
  pollingRate?: number;
  engineRunning?: boolean;
  drivers?: {
    vigem?: boolean;
    version?: string;
  };
};

export type DeviceStatus = {
  connected?: boolean;
  name?: string;
  type?: string;
  battery?: number;
  batteryLevel?: number;
  batteryPercent?: number;
  batteryStatus?: string;
  charging?: boolean;
};
