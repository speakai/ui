# Media Components Plan — speak-ui Export

**Purpose**: Extract MediaPlayer, TranscriptViewer, TranscriptEditor, and supporting utilities from speak-embed-player + speak-client (Angular) into `@speakai/ui` as reusable components.

**Consumers**: speak-embed-player, speak-client, and any future Speak app.
**Created**: 2026-03-31

**Status Legend**:
- `[ ]` — Not started
- `[~]` — In progress
- `[x]` — Done
- `[R]` — Review needed

---

## Architecture Overview

```
@speakai/shared                          (types & enums — already exists)
├── ITranscriptSegment, ITranscriptInstance, IWordEntity, ISpeaker
├── MediaType, MediaState
└── NEW: Paragraph, ITranscriptSegment, ContextMenuInfo, CopyOptions

@speakai/ui                              (components — this plan)
├── MediaPlayer                          HTML5 audio/video player
├── TranscriptViewer                     Read-only ProseMirror (editable: false)
├── TranscriptEditor                     Editable ProseMirror (editable: true)
├── LiveTranscript                       Streaming transcript (no ProseMirror)
├── useMediaSync()                       Time-sync hook
├── transcript-schema                    ProseMirror schema
├── TranscriptBlockView                  ProseMirror NodeView
├── transcript-highlight plugin          Active word/sentence highlighting
├── transcript-find-replace plugin       Search & replace with decorations
├── transcript-speakers plugin           Speaker filter decorations
└── transcript-utils                     Sentence extraction, time formatting

speak-embed-player                       (consumer)
├── import { MediaPlayer, TranscriptViewer, LiveTranscript, useMediaSync } from "@speakai/ui"
└── TranscriptEditor with editable={false} by default, optionally true

speak-client                             (consumer)
├── import { MediaPlayer, TranscriptViewer, TranscriptEditor, useMediaSync } from "@speakai/ui"
├── SpeakerEditDialog (local — speak-client only)
├── ClipCreateDialog (local)
├── RevisionSelector (local)
└── TranscriptToolbar (local — save/cancel/edit/fullscreen buttons)
```

---

## Phase 1: Types & Shared Interfaces → @speakai/shared

### Full Type Audit (2026-03-31)

**Methodology**: Field-by-field comparison across `@speakai/shared`, Angular speak-client (`core/types/`), speak-embed-player (`types/`), and Next.js speak-client (`types/`).

**Key decisions**:
- No "Unified" wrapper types — use `IParagraph` directly as the display model
- ProseMirror works with `ITranscriptSegment` (what the API returns)
- `IParagraph` groups them by speaker for rendering
- `domRange` fields excluded from shared types (DOM-only, not serializable)
- Angular's `Sentence` = `ITranscriptSegment` (shared already has `score?`)
- Embed-player's `UnifiedParagraph`/`UnifiedSegment` go away

### 1.0 What @speakai/shared ALREADY has (no changes needed)

| Type | File | Notes |
|---|---|---|
| `ITranscriptInstance` | `interfaces/transcript.ts` | Complete — start, end, startInSec, endInSec, startChar, endChar |
| `ITranscriptSegment` | `interfaces/transcript.ts` | Has score? already — needs 3 optional fields added (see 1.1) |
| `IWordEntity` | `interfaces/transcript.ts` | Complete — needs `id` type widened (see 1.1) |
| `ISpeaker` | `interfaces/transcript.ts` | Complete |
| `IMedia`, `ISentiment`, `ISentenceSentiment`, `IInsightItem` | `interfaces/media.ts` | Complete |
| `IEmbedSettings`, `IEmbed` | `interfaces/embed.ts` | Complete |
| `ClipState`, `ClipGenerationSource` | `enums/clip.ts` | Complete |
| `MediaType`, `MediaState`, `MediaPrivacyMode` | `enums/media.ts` | Complete |
| `TranscriptionJobState`, `TranscriptionJobRevisionState` | `enums/transcription.ts` | Complete |
| `TranscriptionLanguages` | `enums/transcription.ts` | Complete — 60+ languages |

### 1.1 Extend existing interfaces (non-breaking — optional fields only)

**`ITranscriptSegment`** — Angular's `Sentence` is this + 3 fields. `score?` already exists.

| Status | Field to add | Type | Why |
|---|---|---|---|
| [x] | `isEntity?` | `boolean` | Angular marks entity-type segments |
| [x] | `email?` | `string \| null` | Speaker email from user matching |
| [x] | `userId?` | `string \| null` | Speaker user ID from user matching |

**`IWordEntity`** — Angular uses string IDs, shared uses number.

| Status | Field to change | From | To | Why |
|---|---|---|---|---|
| [x] | `id` | `number?` | `string \| number` | Angular word entities use string IDs |

### 1.2 Add transcript types (`interfaces/transcript.ts`)

| Status | Type | Fields | Source | Notes |
|---|---|---|---|---|
| [x] | `IParagraph` | `id?, isEntity?, sentences: {id, text, start, end, confidence, entities?}[], speakerId, speakerImg?, speaker?: {userId?, name?, email?}, language?, start, end, isFinal?` | Angular `Paragraph` in `media-transcription.ts` | Display grouping by speaker. `isFinal?` added for live mode. Replaces embed-player's `UnifiedParagraph`. |
| [x] | `IJobRevision` | `jobRevisionId, title, createdAt, isOriginal?` | Angular `JobRevision` | Transcript revision history entry |
| [x] | `ITranscriptEditState` | `isEditing, isDirty, originalSentences?: ITranscriptSegment[], currentSentences?: ITranscriptSegment[]` | Angular `TranscriptEditState` | Editor dirty tracking |
| [x] | `IFindReplaceState` | `searchQuery, replaceQuery, caseSensitive, useRegex, isActive, matches: {from: number, to: number}[], currentMatchIndex, matchCount` | Angular `FindReplaceState` | Search/replace plugin state |
| [x] | `IContextMenuInfo` | `type: 'selection' \| 'word' \| 'sentence' \| 'block', text, selectionRange?, event?, start?, end?, speakerId?, paragraphId?, wordIndex?, node?, domTarget?` | Angular `ContextMenuInfo` in `clips.ts` | Right-click context from transcript. `selectionRange/event/domTarget` optional — only populated in browser. |
| [x] | `ICopyOptions` | `includeSpeakers: boolean, includeTimestamps: boolean` | New | Transcript copy formatting options |
| [x] | `ITranscriptState` | `mediaId: string \| null, words: IWordEntity[], lastApiCall: number, wordId: number, mediaCreated: boolean, mediaCreationInProgress: boolean, isConnectionClosed: boolean, pendingWords: IWordEntity[]` | Angular `TranscriptState` in `transcript.ts` | Live recording session state |

### 1.3 Add clip types (new file `interfaces/clip.ts`)

| Status | Type | Fields | Source | Notes |
|---|---|---|---|---|
| [x] | `IClipTranscript` | `id: number, startTime: number, endTime: number, text: string, language: string, speakerId: string` | Angular `ClipTranscriptInterface` | Transcript segment within a clip |
| [x] | `ITimeRange` | `mediaId: string, mediaType: MediaType, startTime: number, endTime: number, duration?: number, order?: number, name?: string, url?: string, transcript?: IClipTranscript, type?: 'fine' \| 'paragraph', paragraphId?: string` | Angular `TimeRangesInterface` | Time range for clip creation |
| [x] | `IFineSegment` | `start: number, end: number, text: string, order: number` | Angular `FineSegment` | Fine-grained text selection. No `domRange` — DOM objects don't belong in shared types. |
| [x] | `IFineSegmentEvent` | `start: number, end: number, action: 'add' \| 'remove' \| 'create', text?: string, order?: number` | Angular `FineSegmentEvent` | Selection event. No `domRange`. |
| [x] | Export barrel | `interfaces/index.ts` | — | Added `export * from './clip.js'` |

### 1.4 Add transcript mode

| Status | Item | File | Notes |
|---|---|---|---|
| [x] | `TranscriptMode` type | `enums/transcription.ts` | `export type TranscriptMode = 'static' \| 'live'` |

### 1.5 Converter utility + publish

| Status | Item | File | Notes |
|---|---|---|---|
| [x] | `groupSegmentsByParagraph()` | `utils/transcript.ts` | `(segments: ITranscriptSegment[], speakers?: ISpeaker[]) → IParagraph[]` — groups consecutive sentences by same speakerId, merges speaker metadata. Replaces embed-player `transcript-processor.ts` and Angular manual grouping. |
| [x] | `formatTranscriptTime()` | `utils/transcript.ts` | Seconds → `H:MM:SS` string |
| [x] | `parseTranscriptTime()` | `utils/transcript.ts` | `H:MM:SS` string → seconds |
| [ ] | Publish | `npm publish` | Bump minor version — awaiting review |

### 1.6 Types NOT being added (duplicates / unnecessary)

| Type | Where it exists | Why skip |
|---|---|---|
| `Sentence` | embed-player alias `= ITranscriptSegment` | Already covered — keep as local alias if consumers want short name |
| `TranscriptSegment` (live) | Angular `transcript.ts` | Same shape as `ITranscriptSegment` + `words[]` which is already `entities[]`. Use `ITranscriptSegment`. |
| `WordEntityInterface` | Angular `transcript.ts` | Identical to `IWordEntity` |
| `UnifiedParagraph` | embed-player | Replaced by `IParagraph` |
| `UnifiedSegment` | embed-player | Not needed — `IParagraph.sentences` is the segment array |
| `Instance` | Angular `media-insights.ts` | Extends `ITranscriptInstance` — just use `ITranscriptInstance` |
| `SpeakerObj` | Angular `media-insights.ts` | speak-client UI-only type (firstName, lastName, picture) |
| `MediaSpeaker` | Angular `media-insights.ts` | speak-client UI-only type (speakerImg, userId, email) |
| `MediaInsightActions` enum | Angular `media-insights.ts` | speak-client UI navigation enum — not a data type |
| `Sentiment` | Angular `media-insights.ts` | Already `ISentiment` in shared — same shape |
| `Insight` | Angular `media-insights.ts` | Already `IInsightItem` in shared — Angular adds extra fields locally |
| `domRange` on FineSegment | Angular `clips.ts` | DOM `Range` object — not serializable, stays in UI layer |

### 1.7 Consumer migration after shared publish

| Consumer | What changes |
|---|---|
| **speak-embed-player** | Delete `types/unified-transcript.ts`. Replace `UnifiedParagraph` → `IParagraph`. Import `groupSegmentsByParagraph` from `@speakai/shared` instead of local `transcript-processor.ts`. |
| **speak-client (Next.js)** | Import `IParagraph`, `IJobRevision`, `IFindReplaceState`, `IContextMenuInfo`, `IFineSegment`, `IFineSegmentEvent`, `IClipTranscript`, `ITimeRange` from `@speakai/shared`. No local duplicates needed. |
| **speak-client (Angular)** | No immediate changes. Local types remain until migration completes. Angular `Sentence` maps 1:1 to `ITranscriptSegment`. |
| **speak-ui** | Import all types from `@speakai/shared` for TranscriptViewer/Editor/LiveTranscript props. Zero local type definitions for domain types. |

**Improvement over Angular**: Angular has `Sentence` locally that duplicates `ITranscriptSegment`, `Instance` that duplicates `ITranscriptInstance`, `WordEntity` that duplicates `IWordEntity`, and `Sentiment` that duplicates `ISentiment`. Four duplicate type hierarchies across two packages. After this, one source of truth.

---

## Phase 2: MediaPlayer → @speakai/ui

Port from speak-embed-player's `MediaPlayer.tsx`. Decouple from EmbedContext.

| Status | Item | File | Notes |
|---|---|---|---|
| [x] | `MediaPlayer` component (675 lines) | `src/components/MediaPlayer.tsx` | Props-driven, no context dependency, inline SVG icons |
| [x] | `useMediaSync()` hook (35 lines) | `src/hooks/useMediaSync.ts` | Standalone time-sync state |
| [x] | Export from index | `src/index.ts` | `MediaPlayer`, `MediaPlayerProps`, `MediaPlayerCaption`, `useMediaSync`, `UseMediaSyncReturn` |
| [x] | Build passes | `npm run build` | ESM 202KB, CJS 212KB, DTS 37KB |
| [x] | Linked locally | `npm link` | speak-embed-player + speak-client consuming local build |
| [x] | README updated | `README.md` | Media Components section with full props table + usage examples |
| [x] | Demo page updated | `demo/app/page.tsx` | Audio, video, and docked mode demos with sample media |
| [ ] | Tests | `tests/components/MediaPlayer.test.tsx` | Render, play/pause, seek, keyboard |

### MediaPlayer Props
```typescript
interface MediaPlayerProps {
  /** Media source URL */
  src: string;
  /** Poster/thumbnail image */
  poster?: string;
  /** Audio or video */
  mediaType: "audio" | "video";
  /** Media title (shown in audio mode) */
  title?: string;
  /** External time — player seeks to this when changed */
  seekTarget?: number | null;
  /** Called when seek completes */
  onSeekComplete?: () => void;
  /** Called on every timeupdate (~250ms) */
  onTimeUpdate?: (time: number) => void;
  /** Called when playback state changes */
  onPlayStateChange?: (playing: boolean) => void;
  /** Caption tracks */
  captions?: Array<{ src: string; label: string; language: string }>;
  /** "default" = full player, "dock" = compact bottom bar */
  mode?: "default" | "dock";
  /** Playback rates to show (default: [0.5, 0.75, 1, 1.25, 1.5, 2]) */
  playbackRates?: number[];
  className?: string;
}
```

**Improvement over Angular**: Angular uses Video.js (500KB+ bundle). speak-embed-player already proved native HTML5 works perfectly. Smaller bundle, fewer dependencies, same features.

---

## Phase 3: ProseMirror Foundation → @speakai/ui (internal)

Port the ProseMirror infrastructure. These are internal to speak-ui — not exported directly, used by TranscriptViewer and TranscriptEditor.

| Status | Item | File | Source | Notes |
|---|---|---|---|---|
| [ ] | ProseMirror schema | `src/transcript/schema.ts` | Angular `transcript.schema.ts` | `doc → paragraph_container → transcript_block → sentence → text`, `word` mark |
| [ ] | `TranscriptBlockView` NodeView | `src/transcript/BlockView.tsx` | Angular `transcript-block-view.ts` | Speaker avatar, timestamp, actions (copy/clip), context menu, click-to-seek. React-ified with Tailwind instead of imperative DOM |
| [ ] | Highlight plugin | `src/transcript/plugins/highlight.ts` | Angular `transcript-highlight.ts` | Decorations for active word/sentence based on currentTime |
| [ ] | Find & replace plugin | `src/transcript/plugins/find-replace.ts` | Angular `transcript-find-replace.ts` | Search decorations, match navigation, replace/replace-all |
| [ ] | Speaker filter plugin | `src/transcript/plugins/speaker-filter.ts` | Angular `transcript-speakers.ts` | Hide/show paragraphs by speaker via decorations |
| [ ] | Entity extraction util | `src/transcript/utils/entities.ts` | Angular `transcript-entities.ts` | Extract `ITranscriptSegment[]` from ProseMirror doc |
| [ ] | Time formatting util | `src/transcript/utils/time.ts` | Angular `TypesUtilsService` (partial) | `formatTranscriptTime()`, `findSeconds()`, `convertDisplayTime()` |
| [ ] | ProseMirror deps | `package.json` | — | `prosemirror-state`, `prosemirror-view`, `prosemirror-model`, `prosemirror-keymap`, `prosemirror-commands`, `prosemirror-history` |

**Improvement over Angular**: The Angular `TranscriptBlockView` is 850 lines of imperative DOM manipulation. In React, we can use a hybrid approach — ProseMirror for the document model + React portals for the NodeView UI (speaker avatar, timestamp, actions). This keeps the rich editing capability while making the UI composable with Tailwind and speak-ui components.

### Key Architecture Decision: React NodeViews
Instead of creating DOM elements imperatively (`document.createElement`), we use `createRoot()` to mount React components inside ProseMirror NodeViews. This lets us:
- Use speak-ui `Button`, `Badge`, `Avatar` inside transcript blocks
- Use Tailwind classes instead of custom CSS
- Respond to theme changes (dark/light mode) automatically
- Keep the context menu as a React component with portals

---

## Phase 4: TranscriptViewer → @speakai/ui

Read-only transcript. ProseMirror with `editable: false`. Used in both embed-player and speak-client (view mode).

| Status | Item | File | Notes |
|---|---|---|---|
| [ ] | `TranscriptViewer` component | `src/components/TranscriptViewer.tsx` | Props-driven, creates ProseMirror view with editable: false |
| [ ] | Search bar (built-in) | Part of TranscriptViewer | Toggle via `searchEnabled` prop |
| [ ] | Speaker filter (built-in) | Part of TranscriptViewer | Toggle via `speakerFilterEnabled` prop |
| [ ] | Auto-scroll behavior | Part of TranscriptViewer | Toggle via `autoScroll` prop |
| [ ] | Export from index | `src/index.ts` | |
| [ ] | Tests | `tests/components/TranscriptViewer.test.tsx` | Render, click-to-seek, search, speaker filter |

### TranscriptViewer Props
```typescript
interface TranscriptViewerProps {
  /** Transcript data — array of sentences from API */
  sentences: ITranscriptSegment[];
  /** Current playback time in seconds (drives active highlighting) */
  currentTime?: number;
  /** Called when user clicks a word/timestamp to seek */
  onSeek?: (timeInSeconds: number) => void;

  // — Display options —
  searchEnabled?: boolean;
  autoScroll?: boolean;
  speakerFilterEnabled?: boolean;
  /** Available speakers for filter dropdown */
  speakers?: ISpeaker[];

  // — Interaction hooks (extend in speak-client, ignore in embed-player) —
  /** Right-click / long-press on word, sentence, or selection */
  onContextMenu?: (info: ContextMenuInfo) => void;
  /** Copy paragraph text */
  onCopyParagraph?: (text: string, paragraphId: number) => void;
  /** Click on speaker name/avatar */
  onSpeakerClick?: (speakerId: string, paragraphId: number, event: MouseEvent) => void;

  // — Clip selection mode —
  clipMode?: boolean;
  selectedParagraphs?: Set<number>;
  onParagraphSelect?: (paragraphId: number, selected: boolean) => void;
  onClipCreate?: (start: number, end: number, text: string) => void;

  // — Styling —
  className?: string;
}
```

The component internally groups `sentences` into `Paragraph[]` using `groupSentencesByParagraph()` from `@speakai/shared`. Consumers pass flat sentences (what the API returns), the component handles grouping.

**Improvement over Angular**: The Angular version rebuilds the entire ProseMirror state on prop changes (clip mode toggle, speaker filter change). With React, we use plugins with meta-driven state updates — toggling clip mode dispatches a transaction with metadata instead of destroying/recreating the editor.

---

## Phase 5: TranscriptEditor → @speakai/ui

Full editing mode. ProseMirror with `editable: true`. Extends TranscriptViewer with editing capabilities. Save/cancel/revision UI is **external** (rendered by the consuming app).

| Status | Item | File | Notes |
|---|---|---|---|
| [ ] | `TranscriptEditor` component | `src/components/TranscriptEditor.tsx` | Extends TranscriptViewer internally, adds editing plugins |
| [ ] | Inline text editing | Part of TranscriptEditor | ProseMirror contentEditable |
| [ ] | Inline timestamp editing | Part of BlockView | Click timestamp → input field |
| [ ] | Find & replace integration | Part of TranscriptEditor | Toggle via `findReplaceEnabled` prop |
| [ ] | Keyboard shortcuts | Part of TranscriptEditor | Mod-z undo, Mod-y redo, Mod-j merge, Mod-Shift-d duplicate, Tab jump, Enter split |
| [ ] | Paragraph operations | Part of TranscriptEditor | Insert, delete, merge, duplicate, split |
| [ ] | Speaker rename in doc | Part of TranscriptEditor | `updateSpeaker()` method via ref |
| [ ] | Export from index | `src/index.ts` | |
| [ ] | Tests | `tests/components/TranscriptEditor.test.tsx` | Edit, undo/redo, find-replace, speaker rename |

### TranscriptEditor Props
```typescript
interface TranscriptEditorProps extends Omit<TranscriptViewerProps, 'clipMode' | 'selectedParagraphs' | 'onParagraphSelect' | 'onClipCreate'> {
  /** Enable editing (controls ProseMirror editable flag, default true) */
  editable?: boolean;
  /** Called when document content changes (debounced 300ms) */
  onContentChange?: (sentences: ITranscriptSegment[]) => void;
  /** Called when dirty state changes */
  onDirtyChange?: (isDirty: boolean) => void;

  // — Find & replace —
  findReplaceEnabled?: boolean;
  /** External search query (controlled mode) */
  searchQuery?: string;
  /** External replace query (controlled mode) */
  replaceQuery?: string;
  /** Called when match count changes */
  onMatchCountChange?: (count: number, currentIndex: number) => void;

  // — Speaker editing —
  /** Available speakers for autocomplete */
  availableSpeakers?: string[];

  // — Keyboard shortcuts —
  /** Additional custom shortcuts */
  shortcuts?: Array<{ key: string; handler: () => void }>;

  // — Imperative methods via ref (TranscriptEditorHandle) —
  // ref.current.getContent() → ITranscriptSegment[]
  // ref.current.undo() / redo()
  // ref.current.findNext() / findPrev()
  // ref.current.replaceMatch(text) / replaceAll(text)
  // ref.current.updateSpeaker(oldId, newId, speakerInfo, updateAll, paragraphId)
  // ref.current.insertParagraphAt(index)
  // ref.current.deleteParagraphAt(index)
  // ref.current.mergeParagraphs(startIndex, endIndex)
}
```

**Improvement over Angular**: Angular's editor component is 600+ lines that mix UI chrome (save button, revision dropdown, unsaved indicator, fullscreen toggle) with the actual editor. By keeping all chrome external, the editor component is purely focused on the editing experience. The consuming app decides what buttons to show, where to put them, and how to handle save/cancel/revisions.

### Imperative API via `ref`
The editor exposes methods via `React.forwardRef` + `useImperativeHandle` for operations the parent needs to trigger:
```tsx
const editorRef = useRef<TranscriptEditorHandle>(null);

// Parent triggers save
<Button onClick={() => {
  const content = editorRef.current?.getContent();
  if (content) saveToServer(content);
}}>Save</Button>

<TranscriptEditor ref={editorRef} ... />
```

---

## Phase 6: LiveTranscript → @speakai/ui

Streaming transcript (no ProseMirror — direct React render for performance). Already well-implemented in embed-player.

| Status | Item | File | Notes |
|---|---|---|---|
| [ ] | `LiveTranscript` component | `src/components/LiveTranscript.tsx` | From embed-player's live portion of UnifiedTranscript |
| [ ] | Stick-to-bottom auto-scroll | Part of LiveTranscript | Scroll if user at bottom, pause if scrolled up |
| [ ] | Word stream animation | Part of LiveTranscript | CSS `word-stream-in` keyframe |
| [ ] | Connection status badge | Part of LiveTranscript | Connecting/Live/Ended/Error |
| [ ] | Translation side-by-side | Part of LiveTranscript | Optional, via `translationEnabled` prop |
| [ ] | Export from index | `src/index.ts` | |

### LiveTranscript Props
```typescript
interface LiveTranscriptProps {
  /** Live transcript paragraphs — built from streaming socket data */
  paragraphs: Paragraph[];
  /** Whether the socket connection is active */
  isConnected: boolean;
  /** Whether the transcription session has ended */
  isComplete: boolean;
  error?: string;
  /** Enable side-by-side translation panel */
  translationEnabled?: boolean;
  translatedParagraphs?: Paragraph[];
  onTranslationStart?: (targetLanguage: string) => void;
  onTranslationStop?: () => void;
  /** Available translation languages */
  translationLanguages?: Array<{ code: string; label: string }>;
  className?: string;
}
```

Note: `Paragraph` here uses the same interface from `@speakai/shared` but with `isFinal: boolean` to distinguish interim vs finalized paragraphs in live mode. The `groupSentencesByParagraph()` util handles this when building from socket data.

---

## Phase 7: Integration into Consumers

### 7.1 speak-embed-player refactor
Replace internal components with speak-ui imports.

| Status | Item | Notes |
|---|---|---|
| [ ] | Replace `MediaPlayer.tsx` with `import { MediaPlayer } from "@speakai/ui"` | Map EmbedContext → props |
| [ ] | Replace `UnifiedTranscript.tsx` (static part) with `TranscriptViewer` | Map EmbedContext → props |
| [ ] | Replace `UnifiedTranscript.tsx` (live part) with `LiveTranscript` | Map socket data → props |
| [ ] | Replace `EmbedProvider` time-sync with `useMediaSync` hook | |
| [ ] | Add optional `TranscriptEditor` with `editable` prop from embed settings | Default false |
| [ ] | Remove duplicated types (use `@speakai/shared`) | |
| [ ] | Delete old component files | |
| [ ] | Verify all features still work | Manual + Playwright tests |

### 7.2 speak-client integration (media insight page)
Use speak-ui components for the new media insight page (Phase 4 / GAP 14.1).

| Status | Item | Notes |
|---|---|---|
| [ ] | Create media insight page shell | `(dashboard)/folder/[fid]/insight/[id]/page.tsx` |
| [ ] | Wire `MediaPlayer` from speak-ui | Audio/video based on mediaType |
| [ ] | Wire `TranscriptViewer` from speak-ui (view mode) | With onContextMenu, onSpeakerClick, onCopyParagraph |
| [ ] | Wire `TranscriptEditor` from speak-ui (edit mode) | With onContentChange, onSave |
| [ ] | Build `SpeakerEditDialog` (speak-client only) | Popover with search, add, rename — matches Angular edit-speakers |
| [ ] | Build `ClipCreateDialog` (speak-client only) | Clip from selection, from paragraph |
| [ ] | Build `TranscriptToolbar` (speak-client only) | Edit/Save/Cancel/Fullscreen/Revisions/Copy/Clip mode toggle |
| [ ] | Build `RevisionSelector` (speak-client only) | Dropdown with server + local revisions |
| [ ] | Build `TranscriptContextMenu` (speak-client only) | Right-click: Copy, Create clip, Share, Play from here |
| [ ] | Connect player ↔ transcript via `useMediaSync` | Bidirectional time sync |

---

## Phase 8: Tests & Documentation

| Status | Item | Notes |
|---|---|---|
| [ ] | Unit tests for ProseMirror schema | Create doc from segments, serialize back |
| [ ] | Unit tests for highlight plugin | Mock time, verify decorations |
| [ ] | Unit tests for find-replace plugin | Search, navigate, replace |
| [ ] | Component test: TranscriptViewer | Render, click-to-seek, search, filter |
| [ ] | Component test: TranscriptEditor | Edit text, undo, speaker rename |
| [ ] | Component test: MediaPlayer | Render, play/pause, seek |
| [ ] | Component test: LiveTranscript | Render, auto-scroll, streaming animation |
| [ ] | Storybook stories for all components | Interactive demo |
| [ ] | Demo page in speak-ui demo app | Showcase all media components together |

---

## Improvements Over Angular Implementation

| Area | Angular (current) | speak-ui (new) | Benefit |
|---|---|---|---|
| **Video player** | Video.js (500KB) | Native HTML5 `<audio>/<video>` | ~500KB smaller bundle |
| **NodeView rendering** | 850 lines imperative DOM (`document.createElement`) | React portals + Tailwind | Theme-aware, composable, maintainable |
| **Editor state** | BehaviorSubject + manual change detection | React state + ProseMirror transactions | No `detectChanges()` calls, no memory leaks |
| **Save/revision UI** | Baked into editor component (600 lines mixed) | External — consuming app owns the chrome | Editor reusable in different contexts (client, embed, mobile) |
| **Type safety** | Local `Sentence` type duplicates shared `ITranscriptSegment` | Single source: `@speakai/shared` | No type drift |
| **Find & replace** | Separate Angular dialog component | ProseMirror plugin with React UI overlay | Decorations update in real-time, no DOM querying |
| **Clip selection** | Imperative DOM highlighting with `Map<string, HTMLElement>` | ProseMirror decorations + React state | No manual DOM manipulation |
| **Context menu** | Imperative DOM positioning, manual click-away | React portal with `onContextMenu` callback | Theme-aware, accessible, composable |
| **Speaker editing** | Tightly coupled to editor component | External dialog via `onSpeakerClick` callback | Reusable dialog, editor doesn't know about the dialog |
| **Theme support** | SCSS mixins + Material theme | Tailwind + CSS variables | Works with speak-ui B&W theme, any custom theme |
| **Auto-save** | `setInterval` in component with localStorage | `onAutoSave` callback — parent decides storage strategy | More flexible, testable |
| **ProseMirror rebuild** | Destroys/recreates editor on mode change | Plugin meta-transactions + `editable` prop update | Smoother transitions, preserves scroll position |

---

## Dependencies to Add to speak-ui

```json
{
  "prosemirror-state": "^1.4.3",
  "prosemirror-view": "^1.33.0",
  "prosemirror-model": "^1.22.0",
  "prosemirror-keymap": "^1.2.2",
  "prosemirror-commands": "^1.5.2",
  "prosemirror-history": "^1.4.0"
}
```

These are peer dependencies — consumers don't need to install them separately since speak-ui bundles its components.

**Total added bundle size**: ~45KB minified+gzipped (ProseMirror core). This is tree-shakeable — if a consumer only imports `MediaPlayer`, ProseMirror is not included.

---

## Execution Order

```
Phase 1 (shared types)     ──────▶ Phase 2 (MediaPlayer)
                                        │
                                        ▼
Phase 3 (ProseMirror core) ──────▶ Phase 4 (TranscriptViewer)
                                        │
                                        ▼
                                   Phase 5 (TranscriptEditor)
                                        │
                           Phase 6 (LiveTranscript) ── parallel with 4/5
                                        │
                                        ▼
                           Phase 7 (Consumer integration)
                                        │
                                        ▼
                           Phase 8 (Tests & docs)
```

Phases 1-2 can start immediately. Phase 3 can start in parallel with Phase 2. Phases 4-6 depend on Phase 3. Phase 7 depends on 4-6. Phase 8 runs continuously.

---

## Estimated Component Sizes

| Component | Est. Lines | Priority |
|---|---|---|
| Shared types (Phase 1) | ~80 | P0 |
| MediaPlayer (Phase 2) | ~450 | P0 |
| useMediaSync hook | ~30 | P0 |
| ProseMirror schema | ~200 | P0 |
| TranscriptBlockView | ~500 | P0 |
| Highlight plugin | ~150 | P0 |
| Find & replace plugin | ~200 | P1 |
| Speaker filter plugin | ~100 | P1 |
| Entity extraction util | ~100 | P1 |
| Time formatting util | ~60 | P0 |
| TranscriptViewer | ~350 | P0 |
| TranscriptEditor | ~400 | P1 |
| LiveTranscript | ~300 | P0 |
| **Total** | **~2,920** | |

---

*Last updated: 2026-03-31*
