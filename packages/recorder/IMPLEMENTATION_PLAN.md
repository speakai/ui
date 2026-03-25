# @speakai/recorder — Library Implementation Plan

## What This Library Is

A **pure React recording library**. It handles the mechanics of browser-based media recording and hands back the recorded file. It has no opinions about what you do with the file afterward — no API calls, no S3 uploads, no socket connections, no authentication.

**Install it → start recording → get back a file. That is the contract.**

---

## What It Does

- Requests microphone / camera / screen permissions
- Enumerates and lets the user switch audio/video devices
- Records using RecordRTC (handles cross-browser + Safari compatibility)
- Visualizes live audio waveform during recording (WaveSurfer v3 with microphone plugin)
- Plays back the recorded waveform after recording completes
- Returns `RecordingResult` when recording stops

## What It Does NOT Do

- No API calls
- No file upload (S3, presigned URL, or otherwise)
- No authentication or tokens
- No socket / live transcription
- No theming injection — consuming app controls its own styles
- No React Native — web (browser) only

---

## Recording Result

Based on usage in both `speak-embed-recorder` and `speak-client`, the minimum needed output is:

```ts
interface RecordingResult {
  blob: Blob          // the raw recorded file
  mimeType: string    // 'video/webm', 'audio/webm', 'audio/wav', 'video/mp4', etc.
  duration: number    // seconds — both apps send this to the backend
  size: number        // bytes — speak-client sends this in upload metadata
  url: string         // object URL (URL.createObjectURL(blob)) for local playback/preview
}
```

`url` is included because both apps immediately do `player.src = URL.createObjectURL(blob)` after recording. The library creates it once to avoid duplicate blob URLs leaking in the consuming app.

---

## Supported Recording Types

| Type | Browser API | Notes |
|---|---|---|
| Audio | `getUserMedia({ audio })` | Always supported |
| Video (camera) | `getUserMedia({ audio, video })` | Falls back gracefully if camera denied |
| Screen share | `getDisplayMedia()` + optional camera PIP | speak-client uses a camera-in-corner PIP overlay |

---

## Package Structure

```
ui/packages/recorder/src/
│
├── index.ts                      # Public API — everything the consuming app needs
│
├── types/
│   └── index.ts                  # All exported types and enums
│
├── utils/
│   ├── browser.ts                # isSafari, isFirefox, isChrome, isIOS, isMobile
│   ├── mime.ts                   # getSupportedAudioMimeType, getSupportedVideoMimeType
│   └── format.ts                 # formatDuration(seconds), formatFileSize(bytes)
│
├── hooks/
│   ├── useRecorder.ts            # PRIMARY HOOK — composes all others
│   ├── useDevices.ts             # Device enumeration and selection
│   ├── usePermissions.ts         # Permission request and status tracking
│   └── useWaveform.ts            # WaveSurfer live + playback waveform
│
└── components/
    ├── DeviceSelector/
    │   ├── DeviceSelector.tsx    # Mic + camera + speaker dropdowns
    │   └── index.ts
    ├── Waveform/
    │   ├── Waveform.tsx          # Live recording waveform + post-recording playback
    │   └── index.ts
    ├── RecordingControls/
    │   ├── RecordingControls.tsx # Start / Pause / Resume / Stop buttons
    │   └── index.ts
    └── RecordingTimer/
        ├── RecordingTimer.tsx    # MM:SS / HH:MM:SS elapsed time display
        └── index.ts
```

---

## Types (`src/types/index.ts`)

```ts
export type RecordingType = 'audio' | 'video' | 'screen'

// Render prop types — must be exported so consuming apps can type their render functions
export interface SelectRenderProps {
  value: string | null
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
  label: string
}

export interface ButtonRenderProps {
  onClick: () => void
  disabled: boolean
  label: string    // accessible label e.g. 'Start recording', 'Stop recording'
}

export interface RecordingResult {
  blob: Blob
  mimeType: string
  duration: number    // seconds
  size: number        // bytes
  url: string         // object URL for immediate playback
}

export interface DeviceInfo {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput' | 'videoinput'
}

export interface RecorderConfig {
  type: RecordingType
  // Audio constraints — matches speak-client WebRecordingService
  audio?: {
    echoCancellation?: boolean   // default true
    noiseSuppression?: boolean   // default true
    sampleRate?: number          // default 44100
    deviceId?: string
  }
  // Video constraints (only for 'video' type)
  video?: {
    width?: number               // default 1280
    height?: number              // default 720
    frameRate?: number           // default 30
    deviceId?: string
  }
  // Screen share options (only for 'screen' type)
  screen?: {
    includeAudio?: boolean       // capture system audio alongside screen
    includeCameraOverlay?: boolean  // PIP camera in corner (speak-client feature)
  }
  // Optional limits
  maxDurationSeconds?: number    // auto-stop at this point
  minDurationSeconds?: number    // used to block stop before this
}

export interface RecordingState {
  status: 'idle' | 'requesting-permission' | 'permission-denied' | 'ready' | 'recording' | 'paused' | 'stopped' | 'error'
  duration: number          // seconds elapsed
  result: RecordingResult | null   // populated when status === 'stopped'
  error: string | null
}

export interface DeviceState {
  audioInputDevices: DeviceInfo[]
  audioOutputDevices: DeviceInfo[]
  videoInputDevices: DeviceInfo[]
  selectedAudioInput: string | null
  selectedAudioOutput: string | null
  selectedVideoInput: string | null
  isOutputSelectionSupported: boolean   // false on Firefox/Safari
}

export interface PermissionState {
  microphone: 'granted' | 'denied' | 'prompt' | 'unknown'
  camera: 'granted' | 'denied' | 'prompt' | 'unknown'
}
```

---

## Hooks

### `useRecorder` — Primary hook

This is the only hook most consumers need. It composes `usePermissions`, `useDevices`, and `useWaveform` internally.

```ts
function useRecorder(config: RecorderConfig): {
  // State
  state: RecordingState
  devices: DeviceState
  permissions: PermissionState
  stream: MediaStream | null    // live stream — wire to <video>.srcObject for preview

  // Recording actions
  requestPermissions(): Promise<void>
  start(): Promise<void>
  stop(): Promise<RecordingResult>
  pause(): void
  resume(): void
  reset(): void    // clears result, revokes object URL, releases stream

  // Device selection actions — exposed at top level (not buried in DeviceState)
  // DeviceState itself is a plain data object; actions live here
  selectAudioInput(deviceId: string): void
  selectAudioOutput(deviceId: string): void
  selectVideoInput(deviceId: string): void
  refreshDevices(): Promise<void>

  // Waveform ref — attach to the container element
  waveformRef: React.RefObject<HTMLDivElement>
}
```

**Behavior:**

1. `requestPermissions()` — calls `getUserMedia` / `getDisplayMedia` based on `config.type`. Populates `stream`. Sets `status = 'ready'`
2. `start()` — creates RecordRTC instance from stream, starts recording, starts waveform live visualization, begins duration timer. Sets `status = 'recording'`
3. `pause()` — pauses RecordRTC, pauses waveform. Sets `status = 'paused'`
4. `resume()` — resumes both. Sets `status = 'recording'`
5. `stop()` — stops RecordRTC, stops waveform, builds `RecordingResult`, switches waveform to playback mode. Sets `status = 'stopped'`. Returns the `RecordingResult`
6. `reset()` — revokes the object URL (`URL.revokeObjectURL`), releases all stream tracks, destroys waveform instance. Sets `status = 'idle'`

**Automatic behaviors:**
- If `maxDurationSeconds` is set: auto-calls `stop()` when timer hits the limit
- If `minDurationSeconds` is set and `stop()` is called before the minimum: sets `state.error` to a human-readable message (e.g. `"Recording must be at least 10 seconds"`) and keeps `state.status` as `'recording'`. Does **not** throw or reject the Promise — the hook communicates all errors through `state.error` for consistent React state management.

---

### `useDevices` — Device enumeration

Used internally by `useRecorder`. Can also be used standalone.

```ts
function useDevices(): {
  devices: DeviceState
  refreshDevices(): Promise<void>
  selectAudioInput(deviceId: string): void
  selectAudioOutput(deviceId: string): void
  selectVideoInput(deviceId: string): void
}
```

**Notes:**
- `refreshDevices()` calls `navigator.mediaDevices.enumerateDevices()`
- Device labels are only populated after permission is granted (browser security)
- `isOutputSelectionSupported` checks `'sinkId' in HTMLMediaElement.prototype` — false on Firefox and Safari
- Devices list auto-refreshes on `devicechange` event via `navigator.mediaDevices.addEventListener('devicechange', refreshDevices)`
- **Cleanup required:** The `devicechange` listener must be removed in the `useEffect` return function to prevent memory leaks when the hook unmounts: `return () => navigator.mediaDevices.removeEventListener('devicechange', refreshDevices)`

---

### `usePermissions` — Permission tracking

Used internally by `useRecorder`. Can also be used standalone.

```ts
function usePermissions(): {
  permissions: PermissionState
  checkPermissions(): Promise<PermissionState>
  requestMicPermission(): Promise<'granted' | 'denied'>
  requestCameraPermission(): Promise<'granted' | 'denied'>
}
```

**Notes:**
- Uses `navigator.permissions.query({ name: 'microphone' })` where supported
- Falls back to attempting `getUserMedia` on browsers that don't support Permissions API
- `requestMicPermission` / `requestCameraPermission` are for checking only — actual stream acquisition happens in `useRecorder`

---

### `useWaveform` — Waveform visualization

Used internally by `useRecorder`. The `waveformRef` from `useRecorder` is the result of this hook. Can also be used standalone.

```ts
function useWaveform(options?: WaveformOptions): {
  containerRef: React.RefObject<HTMLDivElement>
  isReady: boolean
  isPlaying: boolean
  currentTime: number
  duration: number

  startLiveVisualization(stream: MediaStream): void
  stopLiveVisualization(): void
  loadRecording(blob: Blob): void   // switches to playback mode
  play(): void
  pause(): void
  destroy(): void
}

interface WaveformOptions {
  waveColor?: string      // default '#4F46E5'
  progressColor?: string  // default '#818CF8'
  cursorColor?: string    // default '#312E81'
  height?: number         // default 80
  barWidth?: number       // default 3
  barHeight?: number      // default 10 (scale factor)
  barRadius?: number      // default 3
  barGap?: number         // default 3
}
```

**Two modes:**
- **Live mode** (during recording): `startLiveVisualization(stream)` uses WaveSurfer's microphone plugin to draw real-time audio from the stream
- **Playback mode** (after recording): `loadRecording(blob)` loads the blob for scrubbing/playback

**WaveSurfer version:** Pin to **v3.x** — this is the version used in both `speak-client` and `speak-embed-recorder`. The microphone plugin (`wavesurfer.js/dist/plugin/wavesurfer.microphone.js`) is only available in v3.

---

## Components

All components are **headless-first** — they accept a `className` prop and apply no default visual styles. Visual appearance comes from the consuming app (via `@speakai/ui` or the app's own styles). This means `@speakai/ui` is an optional peer, not a required dependency.

---

### `<DeviceSelector />`

```ts
interface DeviceSelectorProps {
  devices: DeviceState
  onAudioInputChange: (deviceId: string) => void
  onAudioOutputChange?: (deviceId: string) => void
  onVideoInputChange?: (deviceId: string) => void
  showVideoDevices?: boolean       // default false — only show when recording video
  className?: string
  // Render props for full customization
  renderSelect?: (props: SelectRenderProps) => React.ReactNode
}
```

Renders up to three `<select>` elements (mic, speaker, camera). Hides speaker selector when `isOutputSelectionSupported` is false. Consuming app styles the selects or passes `renderSelect` to use their own select component (e.g. `@speakai/ui` `Select`).

---

### `<Waveform />`

```ts
interface WaveformProps {
  containerRef: React.RefObject<HTMLDivElement>   // from useRecorder or useWaveform
  height?: number       // default 80
  className?: string
}
```

A thin wrapper that renders a `<div ref={containerRef} />` for WaveSurfer to mount into. All waveform logic lives in `useWaveform`.

---

### `<RecordingControls />`

```ts
interface RecordingControlsProps {
  state: RecordingState
  onStart: () => void
  onStop: () => void
  onPause: () => void
  onResume: () => void
  onReset?: () => void
  disabled?: boolean
  className?: string
  // Render props for full button customization
  renderStartButton?: (props: ButtonRenderProps) => React.ReactNode
  renderStopButton?: (props: ButtonRenderProps) => React.ReactNode
  renderPauseButton?: (props: ButtonRenderProps) => React.ReactNode
  renderResumeButton?: (props: ButtonRenderProps) => React.ReactNode
}
```

Renders start/pause/resume/stop buttons. Button visibility is driven by `state.status` — only renders the buttons relevant to the current state. Consuming app styles via `className` or replaces buttons via render props.

---

### `<RecordingTimer />`

```ts
interface RecordingTimerProps {
  duration: number        // seconds — from RecordingState.duration
  maxDuration?: number    // shows countdown if provided
  className?: string
  format?: 'mm:ss' | 'hh:mm:ss'   // default 'mm:ss', auto-switches to hh:mm:ss if > 60min
}
```

Displays elapsed or remaining time. Pure display component — no internal timer, just formats the `duration` number it receives.

---

## Dependencies

```json
{
  "dependencies": {
    "recordrtc": "^5.6.2",
    "wavesurfer.js": "^5.2.0",
    "audio-recorder-polyfill": "^0.4.1",
    "detect-browser": "^5.3.0"
  },
  "peerDependencies": {
    "react": ">=18",
    "react-dom": ">=18"
  },
  "devDependencies": {
    "@types/recordrtc": "^5.6.14",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "typescript": "^5.4.0",
    "tsup": "^8.4.0"
  }
}
```

**Why these versions:**
- `wavesurfer.js@5.2.0` — both `speak-client` and `speak-embed-recorder` run exactly `5.2.0`. The microphone plugin path `wavesurfer.js/dist/plugin/wavesurfer.microphone.js` exists in v3–v5 and was removed in v7. Pinned to `^5.2.0` to match production.
- `audio-recorder-polyfill` — patches `window.MediaRecorder` for Firefox/Safari. Must also configure the mpeg encoder — see implementation notes below.
- `detect-browser` — consistent browser detection matching both existing apps, including Chrome-on-iOS (`crios`) detection.
- `recordrtc@5.6.x` — same version used in both apps.
- `@types/react@^19.1.0` — matches the version already in the current `package.json`.

**No** `@speakai/ui` dependency — components are styled by the consuming app.

> **Phase 1 action required:** Remove the existing `"@speakai/ui": "*"` entry from `dependencies` in `package.json`. It is currently present and will cause a build failure since no `@speakai/ui` components exist in this package's source tree.

---

## Build Config Updates

### `tsup.config.ts`

```ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    'react',
    'react-dom',
  ],
  // RecordRTC, WaveSurfer, etc. are bundled — they are not peer deps
})
```

### `tsconfig.json` — no changes needed from current config

---

## Public API (`src/index.ts`)

```ts
// Types
export type {
  RecordingType,
  RecordingResult,
  RecordingState,
  DeviceInfo,
  DeviceState,
  PermissionState,
  RecorderConfig,
  WaveformOptions,
  SelectRenderProps,    // needed by consumers implementing custom DeviceSelector
  ButtonRenderProps,   // needed by consumers implementing custom RecordingControls
} from './types'

// Hooks
export { useRecorder } from './hooks/useRecorder'
export { useDevices } from './hooks/useDevices'
export { usePermissions } from './hooks/usePermissions'
export { useWaveform } from './hooks/useWaveform'

// Components
export { DeviceSelector } from './components/DeviceSelector'
export { Waveform } from './components/Waveform'
export { RecordingControls } from './components/RecordingControls'
export { RecordingTimer } from './components/RecordingTimer'

// Utils
export { formatDuration, formatFileSize } from './utils/format'
export { getSupportedAudioMimeType, getSupportedVideoMimeType } from './utils/mime'
export { isSafari, isFirefox, isChrome, isIOS, isMobile } from './utils/browser'
```

---

## Usage Examples

### Minimal — audio recorder with one hook

```tsx
function AudioRecorderPage() {
  const { state, start, stop, reset, waveformRef, requestPermissions } = useRecorder({
    type: 'audio',
    audio: { echoCancellation: true, noiseSuppression: true, sampleRate: 44100 },
  })

  async function handleStop() {
    const result = await stop()
    // result.blob — upload this to S3, play it back, do whatever
    // result.duration, result.mimeType, result.size — use for your upload metadata
    console.log(result)
  }

  return (
    <div>
      <div ref={waveformRef} style={{ height: 80 }} />
      {state.status === 'idle' && (
        <button onClick={() => requestPermissions().then(start)}>Start</button>
      )}
      {state.status === 'recording' && (
        <button onClick={handleStop}>Stop</button>
      )}
      {state.result && (
        <audio src={state.result.url} controls />
      )}
    </div>
  )
}
```

### Full — using all components

```tsx
function VideoRecorderPage() {
  const {
    state, devices, permissions,
    stream, waveformRef,
    requestPermissions, start, stop, pause, resume, reset,
    selectAudioInput, selectVideoInput,
  } = useRecorder({
    type: 'video',
    video: { width: 1280, height: 720, frameRate: 30 },
    audio: { echoCancellation: true, noiseSuppression: true },
    maxDurationSeconds: 300,   // 5 minute limit
  })

  // Wire camera preview
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  async function handleStop() {
    const result = await stop()
    // hand the result to your upload function
    onRecordingComplete(result)
  }

  return (
    <div>
      {/* Camera preview */}
      <video ref={videoRef} autoPlay muted playsInline />

      {/* Device selection */}
      <DeviceSelector
        devices={devices}
        showVideoDevices
        onAudioInputChange={selectAudioInput}
        onVideoInputChange={selectVideoInput}
      />

      {/* Waveform */}
      <Waveform containerRef={waveformRef} height={80} />

      {/* Timer */}
      <RecordingTimer
        duration={state.duration}
        maxDuration={300}
      />

      {/* Controls */}
      <RecordingControls
        state={state}
        onStart={() => requestPermissions().then(start)}
        onStop={handleStop}
        onPause={pause}
        onResume={resume}
        onReset={reset}
      />

      {/* Post-recording playback */}
      {state.result && (
        <video src={state.result.url} controls />
      )}
    </div>
  )
}
```

---

## Internal Implementation Notes

### Browser compatibility handling in `useRecorder`

```
On start():
1. Detect browser (detect-browser)
2. Determine mimeType:
   - Safari → audio/mp4 or video/mp4
   - Firefox → audio/ogg or video/webm
   - Chrome/Edge → audio/webm or video/webm
3. Apply audio-recorder-polyfill if window.MediaRecorder is absent
4. Initialize RecordRTC with the correct mimeType
```

### Screen share + camera PIP (`type: 'screen'` with `includeCameraOverlay: true`)

This is a speak-client feature. The library uses **RecordRTC's built-in multi-stream recording** — not manual canvas compositing. This matches exactly how `speak-client` `WebRecordingService` (lines 826–810) handles it today:

```ts
// 1. Get screen stream
const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: includeAudio })

// 2. Get camera stream
const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })

// 3. Set RecordRTC multi-stream properties on each stream
;(screenStream as any).width  = window.screen.width
;(screenStream as any).height = window.screen.height
;(screenStream as any).fullcanvas = true   // this stream fills the canvas

;(cameraStream as any).width  = 320
;(cameraStream as any).height = 240
;(cameraStream as any).top    = 20         // PIP position
;(cameraStream as any).right  = 20

// 4. Pass both streams to RecordRTC — it handles compositing internally
const recorder = RecordRTC([screenStream, cameraStream], {
  type: 'video',
  mimeType: getSupportedVideoMimeType(),
})
```

RecordRTC's internal `MultiStreamsMixer` handles the PIP compositing. Do not implement manual canvas + `requestAnimationFrame` — it has well-known Safari `captureStream()` bugs and is more complex without benefit.

This is encapsulated inside `useRecorder` — the consumer just sets `screen.includeCameraOverlay: true`.

### `audio-recorder-polyfill` application

Applied once at module initialization with the mpeg encoder, not per-hook-instance. Both `speak-client` (`web-recording.service.ts` lines 13–14, 24–25) and the Angular embed recorder apply this pattern:

```ts
// Applied at top of useRecorder.ts, before any MediaRecorder usage
import AudioRecorderPolyfill from 'audio-recorder-polyfill'
import mpegEncoder from 'audio-recorder-polyfill/mpeg-encoder'

if (typeof window !== 'undefined') {
  // Configure mpeg encoder on the polyfill before installing it
  AudioRecorderPolyfill.encoder = mpegEncoder
  AudioRecorderPolyfill.prototype.mimeType = 'audio/mpeg'

  if (!window.MediaRecorder) {
    // @ts-ignore — polyfill typing does not match MediaRecorder exactly
    window.MediaRecorder = AudioRecorderPolyfill
  }
}
```

> **Note:** `audio-recorder-polyfill/mpeg-encoder` does not ship with type definitions. Add a local shim `src/types/audio-recorder-polyfill-mpeg.d.ts`:
> ```ts
> declare module 'audio-recorder-polyfill/mpeg-encoder'
> ```
> Without the mpeg encoder, Safari recordings produce unplayable output — this is the exact bug both existing apps guard against.

### Object URL lifecycle

The library creates the object URL in `stop()` and stores it in `result.url`. The library revokes it in `reset()`. This means:
- The consuming app must not call `URL.revokeObjectURL(result.url)` itself
- The consuming app should call `reset()` when navigating away or unmounting to prevent memory leaks
- `useRecorder` also calls `reset()` in its `useEffect` cleanup to handle unmounting

### WaveSurfer v5 initialization pattern

Reference: `speak-client` `media-recorder.component.ts` lines 359–400 and `speak-embed-recorder` `media-recorder.component.ts`.

```ts
import * as WaveSurfer from 'wavesurfer.js'
import * as MicrophonePlugin from 'wavesurfer.js/dist/plugin/wavesurfer.microphone.js'
WaveSurfer.microphone = MicrophonePlugin

// Live mode (during recording)
wavesurfer = WaveSurfer.create({
  container: containerRef.current,
  waveColor: options.waveColor    ?? '#4F46E5',
  progressColor: options.progressColor ?? '#818CF8',
  cursorColor: options.cursorColor ?? '#312E81',
  height: options.height          ?? 80,
  barWidth: options.barWidth      ?? 3,
  barHeight: options.barHeight    ?? 10,   // amplitude scale factor, not pixels
  barRadius: options.barRadius    ?? 3,
  barGap: options.barGap          ?? 3,
  backend: 'WebAudio',
  plugins: [
    WaveSurfer.microphone.create({
      constraints: { audio: true, video: false }
    })
  ],
})
wavesurfer.microphone.start()   // → startLiveVisualization()
wavesurfer.microphone.pause()   // → called on pause
wavesurfer.microphone.stop()    // → stopLiveVisualization()

// Playback mode (after recording)
// Destroy the live instance and recreate without the microphone plugin
wavesurfer.destroy()
wavesurfer = WaveSurfer.create({
  container: containerRef.current,
  waveColor: options.waveColor ?? '#4F46E5',
  // ... same options, no plugins array
})
wavesurfer.loadBlob(blob)   // → loadRecording(blob) — loadBlob() exists in v5
```

> **v5-specific note:** `loadBlob()` exists in WaveSurfer v5. Do not use `load(url)` with an object URL here — pass the `Blob` directly to avoid a second URL allocation.

---

## Implementation Phases

### Phase 1 — Types and utilities (no browser APIs)

1. Write `src/types/index.ts` — all types defined above, including `SelectRenderProps` and `ButtonRenderProps`
2. Write `src/types/audio-recorder-polyfill-mpeg.d.ts` — type shim: `declare module 'audio-recorder-polyfill/mpeg-encoder'`
3. Write `src/utils/browser.ts` — use `detect-browser`. **Reference implementation:** copy the detection logic from `speak-embed-recorder/src/app/core/services/recorder.service.ts` lines 40–51 exactly. Key cases to handle: `crios` + iOS for Chrome-on-iOS, `navigator.maxTouchPoints > 1` for iPad-on-Mac:
   ```ts
   // isSafari must also catch Chrome-on-iOS ('crios' + os='iOS')
   // isIOS must catch M1/M2 iPad: platform='MacIntel' + maxTouchPoints > 1
   ```
4. Write `src/utils/mime.ts` — **reference implementation:** `speak-client/src/app/core/services/shared/web-recording.service.ts` lines 1037–1107. Contains the production-tested codec priority ordering for Safari/Firefox/Chrome branches.
5. Write `src/utils/format.ts` — `formatDuration(seconds): string`, `formatFileSize(bytes): string`
6. Update `package.json`: add all planned dependencies, **remove** the existing `"@speakai/ui": "*"` from dependencies

### Phase 2 — Permission and device hooks

6. Write `src/hooks/usePermissions.ts`
7. Write `src/hooks/useDevices.ts` — including `devicechange` listener and `isOutputSelectionSupported`

### Phase 3 — Waveform hook

8. Write `src/hooks/useWaveform.ts` — live mode and playback mode, v5 API. **Reference:** `speak-client` `media-recorder.component.ts` lines 359–400 for the `WaveSurfer.create()` config block (waveColor, barWidth, barHeight, barRadius, barGap, backend: 'WebAudio', microphone plugin constraints).

### Phase 4 — Core recorder hook

9. Write `src/hooks/useRecorder.ts` — composes the three hooks above, RecordRTC integration, screen share PIP, audio polyfill, duration timer, min/max enforcement, object URL lifecycle

### Phase 5 — UI components

10. Write `src/components/Waveform/Waveform.tsx` — thin `<div ref>` wrapper
11. Write `src/components/RecordingTimer/RecordingTimer.tsx` — pure display, no logic
12. Write `src/components/RecordingControls/RecordingControls.tsx` — state-driven buttons with render props
13. Write `src/components/DeviceSelector/DeviceSelector.tsx` — device dropdowns with render props

### Phase 6 — Wire up and publish

14. Write `src/index.ts` barrel export
15. Run `npm run build` — verify `dist/` output, types, and tree-shaking
16. Publish to GitHub Packages
17. Install in `speak-embed-recorder` as `@speakai/recorder`
18. Install in `speak-client` as `@speakai/recorder`

---

## Integration Guide for Consuming Apps

### speak-embed-recorder

Replace `RecorderService` + `S3uploadService` split:
- Use `useRecorder` for everything up to and including getting `RecordingResult`
- Pass `result.blob`, `result.duration`, `result.size`, `result.mimeType` to your existing API/S3 layer

### speak-client

Replace `WebRecordingService` recording section:
- Use `useRecorder` for permission, device selection, recording, waveform
- Keep native recording (`NativeRecordingService` / Capacitor) as-is — that is mobile-only and stays in speak-client
- After `stop()` returns `RecordingResult`, pass it to your existing S3 upload and backend API logic

---

## What Stays in Each Consuming App (Not in Library)

| Responsibility | speak-embed-recorder | speak-client |
|---|---|---|
| S3 upload | app layer | app layer |
| Backend API calls | app layer | app layer |
| Auth / token management | app layer | app layer |
| Live transcription (Socket.IO) | app layer | app layer |
| Native mobile recording | N/A | app layer (Capacitor) |
| Branding / theming | app layer | app layer |
| Survey questions / feedback forms | app layer | app layer |
| Post-recording UI (thank you screen) | app layer | app layer |
