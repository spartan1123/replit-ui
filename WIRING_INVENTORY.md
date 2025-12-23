# Ceil Pro UI - Host Wiring Inventory

## 1. Dashboard (`dashboard.tsx`)
*High-frequency telemetry and system status.*

| Page | UI Element | Type | Current Data Source | Desired Host Data Source | Direction | Message Type | Payload Shape | Update Cadence | Persistence Key | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Dash** | **Controller Vis** (LX/LY, RX/RY) | Visualizer | Mock / Static | Raw Input Stream | Host→UI | `CONTROLLER_DATA` | `{ sticks: { left: {x,y}, right: {x,y} }, ... }` | High (60Hz+) | - | **P0** |
| **Dash** | **Triggers** (L2/R2) | Visualizer | Mock / Static | Raw Input Stream | Host→UI | `CONTROLLER_DATA` | `{ triggers: { left: float, right: float } }` | High (60Hz+) | - | **P0** |
| **Dash** | **Active Buttons** | Text/Badge | Mock | Raw Input Stream | Host→UI | `CONTROLLER_DATA` | `{ buttons: number (bitmask) }` | High (60Hz+) | - | **P1** |
| **Dash** | **Latency (Input)** | Metric | Static "0ms" | Host Metrics | Host→UI | `SYSTEM_STATS` | `{ latency: { input: number, processing: number } }` | 1s | - | **P1** |
| **Dash** | **Update Rate (Hz)** | Metric | Static "60Hz" | Host Metrics | Host→UI | `SYSTEM_STATS` | `{ pollingRate: number }` | 1s | - | **P2** |
| **Dash** | **ViGEm Driver** | Status | Static "v1.17" | Driver Check | Host→UI | `SYSTEM_STATS` | `{ drivers: { vigem: boolean, version: string } }` | On Load | - | **P1** |
| **Dash** | **XInput Device** | Status | Static "No Gamepad" | Device Enum | Host→UI | `DEVICE_STATUS` | `{ connected: boolean, name: string, type: string }` | Event | - | **P0** |
| **Dash** | **SIM Power Toggle** | Toggle | UI State | Simulation State | UI→Host | `SET_SIMULATION` | `{ enabled: boolean }` | Event | `ceilpro.sim.active` | **P2** |

## 2. Input Tuning (`input-tuning.tsx`)
*Axis remapping and response curves. (Already partially implemented)*

| Page | UI Element | Type | Current Data Source | Desired Host Data Source | Direction | Message Type | Payload Shape | Update Cadence | Persistence Key | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Tuning** | **Live Preview** | Toggle | UI State | Host Preview Mode | UI→Host | `PREVIEW_AXIS_CONFIG` | `{ ...TuningState }` | ~100ms (Debounced) | - | **P0** |
| **Tuning** | **Apply Button** | Button | UI State | Host Config Write | UI→Host | `APPLY_AXIS_CONFIG` | `{ ...TuningState }` | Event | - | **P0** |
| **Tuning** | **Status/ACK** | Status | UI State | Host Confirmation | Host→UI | `AXIS_CONFIG_ACK` | `{ ok: bool, persisted: bool, error?: string }` | Event | - | **P0** |
| **Tuning** | **Deadzone (Inner/Outer)** | Slider | LocalStorage | Host Profile Data | Both | `GET_PROFILE` / `APPLY...` | `{ leftStick: { inner: float, outer: float }, ... }` | Load/Save | `ceilpro.input.tuning` | **P0** |
| **Tuning** | **Response Curve** | Select | LocalStorage | Host Profile Data | Both | `GET_PROFILE` / `APPLY...` | `{ curve: "linear" \| "cubic" \| "custom" }` | Load/Save | `ceilpro.input.tuning` | **P1** |
| **Tuning** | **Invert Y** | Toggle | LocalStorage | Host Profile Data | Both | `GET_PROFILE` / `APPLY...` | `{ mapping: { invertY: bool } }` | Load/Save | `ceilpro.input.tuning` | **P1** |
| **Tuning** | **Triggers (Analog/Binary)** | Toggle | LocalStorage | Host Profile Data | Both | `GET_PROFILE` / `APPLY...` | `{ triggers: { analog: bool } }` | Load/Save | `ceilpro.input.tuning` | **P1** |

## 3. Enhancements (`enhancements.tsx`)
*Advanced game-specific modifiers.*

| Page | UI Element | Type | Current Data Source | Desired Host Data Source | Direction | Message Type | Payload Shape | Update Cadence | Persistence Key | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Enhance** | **Slot Selector** | Select | LocalStorage | Host Slot State | UI→Host | `UPDATE_ENHANCEMENTS` | `{ slot: number, ...config }` | Event | `ceilpro.enhancements.slot.N` | **P0** |
| **Enhance** | **Aim Assist Strength** | Slider | LocalStorage | Host Logic | UI→Host | `UPDATE_ENHANCEMENTS` | `{ aim: { strength: float } }` | ~100ms | `ceilpro.enhancements.slot.N` | **P0** |
| **Enhance** | **Recoil (Vert/Horiz)** | Slider | LocalStorage | Host Logic | UI→Host | `UPDATE_ENHANCEMENTS` | `{ recoil: { vertical: float, horizontal: float } }` | ~100ms | `ceilpro.enhancements.slot.N` | **P0** |
| **Enhance** | **Rapid Fire Mode** | Toggle | LocalStorage | Host Logic | UI→Host | `UPDATE_ENHANCEMENTS` | `{ rapidFire: { enabled: bool, mode: string } }` | Event | `ceilpro.enhancements.slot.N` | **P1** |
| **Enhance** | **Reset Override** | Button | - | Host State Clear | UI→Host | `CLEAR_ENHANCEMENTS_OVERRIDE` | `{ slot: number }` | Event | - | **P2** |
| **Enhance** | **Global Enable** | Status | Static | Host Master Switch | Host→UI | `ENHANCEMENT_STATUS` | `{ active: boolean, currentSlot: number }` | Event | - | **P1** |

## 4. Profiles (`profiles.tsx`)
*Library management (Mocked).*

| Page | UI Element | Type | Current Data Source | Desired Host Data Source | Direction | Message Type | Payload Shape | Update Cadence | Persistence Key | Priority |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Profiles** | **Profile List** | List | Mock Data | Host File System | Host→UI | `PROFILE_LIST_SYNC` | `[{ id, name, game, modified }, ...]` | On Load | - | **P1** |
| **Profiles** | **Apply Profile** | Button | - | Host Load | UI→Host | `LOAD_PROFILE` | `{ profileId: string }` | Event | `ceilpro.currentProfile` | **P0** |
| **Profiles** | **Import/Export** | Button | - | Host File Dialog | UI→Host | `IMPORT_PROFILE` / `EXPORT` | - | Event | - | **P2** |

## Summary of Message Protocol

*   **Host→UI Stream**: `CONTROLLER_DATA` (60Hz), `SYSTEM_STATS` (1Hz)
*   **UI→Host Config**: `APPLY_AXIS_CONFIG`, `PREVIEW_AXIS_CONFIG`, `UPDATE_ENHANCEMENTS`
*   **Command/Control**: `LOAD_PROFILE`, `SET_SIMULATION`, `CLEAR_ENHANCEMENTS_OVERRIDE`
*   **Handshake/Ack**: `AXIS_CONFIG_ACK`, `DEVICE_STATUS`

**Immediate Action Items:**
1.  **Dashboard**: Wire up `window.addEventListener("message", ...)` to consume `CONTROLLER_DATA` and animate the visualizer.
2.  **Enhancements**: Ensure `UPDATE_ENHANCEMENTS` payload matches the host's expected flat/nested structure (currently sending deep nested object).
3.  **Profiles**: Replace mock array with a `useEffect` that requests the profile list from the host.
