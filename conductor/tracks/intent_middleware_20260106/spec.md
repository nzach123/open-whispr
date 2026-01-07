# Specification: Intent-Based AI Refinement Middleware

## 1. Overview
This track implements the core "Vibe Coding" functionality for OpenWhispr. It introduces a middleware layer that analyzes dictation for specific intent triggers (e.g., "fix grammar", "summarize") and conditionally routes the text to an AI provider (Gemini 1.5 Flash) for refinement. If no intent is detected, or if the API call exceeds 3 seconds, the system falls back to the raw transcription instantly.

## 2. Goals
- **Zero-Latency Fallback:** Regular dictation incurs 0ms overhead.
- **Intent Detection:** Accurately identify commands at the start of a dictation string.
- **Reliability:** Enforce a strict 3-second timeout for AI operations.
- **Modularity:** Decouple intent logic (`intentAnalyzer`), configuration (`intentConfig`), and service execution (`ReasoningService`).

## 3. Technical Design

### 3.1. Intent Configuration (`src/config/intentConfig.ts`)
- Defines `ProcessingIntent` type: 'grammar' | 'professional' | 'summarize' | 'none'.
- Stores `triggers` (array of strings) and `systemPrompt` for each intent.
- **Key Configs:**
    - **Grammar:** "improve grammar", "fix grammar", "clean up"
    - **Professional:** "rewrite professionally", "make professional", "formal tone"
    - **Summarize:** "summarize this", "give me a summary"

### 3.2. Intent Analyzer (`src/utils/intentAnalyzer.ts`)
- **Input:** Raw string.
- **Output:** `{ intent: ProcessingIntent, cleanText: string }`.
- **Logic:**
    - Normalize input (trim, lower-case, remove leading non-alphanumeric).
    - Match against triggers.
    - Regex strip the trigger from the *original* text to preserve casing.
    - Return `none` if only the trigger exists.

### 3.3. Service Refactoring (`src/services/ReasoningService.ts`)
- Update `processText` to accept an `options` object.
- **New Interface:**
    ```typescript
    export interface ProcessTextOptions {
      model?: string;
      agentName?: string | null;
      config?: ReasoningConfig;
      systemPromptOverride?: string; // New: Supports intent-specific prompts
    }
    ```
- Ensure `gemini` provider honors the `systemPromptOverride`.

### 3.4. Middleware Hook (`src/hooks/usePostProcessing.ts`)
- **State:** `idle` | `analyzing` | `refining`
- **Logic:**
    1. Call `analyzeIntent`.
    2. If `none`, return raw text (SYNC return).
    3. If match, set state to `refining`.
    4. `Promise.race([apiCall, timeout(3000ms)])`.
    5. On timeout/error: Return `cleanText` (graceful degradation).
    6. On success: Return AI result.

### 3.5. Integration (`src/App.jsx` or equivalent)
- Integrate `usePostProcessing` into the main transcription flow.
- Display a "Refining..." visual indicator when `isRefining` is true.

## 4. Testing Strategy
- **Unit Tests:**
    - `intentAnalyzer`: Test various trigger formats (e.g., ", fix grammar", ". Fix Grammar").
    - `usePostProcessing`: Mock `ReasoningService` to test timeout fallback and intent routing.
- **Integration Tests:**
    - Verify `App.jsx` updates UI state during processing.

## 5. Security & Privacy
- **Sanitization:** Ensure regex stripping doesn't remove user content accidentally.
- **Secrets:** Use existing environment variable mechanisms for API keys.
