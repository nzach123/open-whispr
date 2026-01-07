# Plan: Intent-Based AI Refinement Middleware

## Phase 1: Foundation & Pure Logic
This phase establishes the configuration and pure functions for intent detection, ensuring logic is testable and isolated from the UI.

- [ ] Task: Create Intent Configuration
    - Create `src/config/intentConfig.ts`.
    - Define `ProcessingIntent` type and `INTENT_CONFIG` object with Grammar, Professional, and Summarize definitions.
    - **Deliverable:** `intentConfig.ts` with type definitions and constants.

- [ ] Task: Create Intent Analyzer Utility
    - Create `src/utils/intentAnalyzer.ts`.
    - Implement `analyzeIntent` function with normalization and regex stripping.
    - **Test Requirement:** Write unit tests covering edge cases (leading punctuation, capitalization, empty strings).
    - **Deliverable:** Tested `intentAnalyzer` utility.

- [ ] Task: Conductor - User Manual Verification 'Phase 1: Foundation & Pure Logic' (Protocol in workflow.md)

## Phase 2: Service Refactoring
Refactor the existing `ReasoningService` to support the new `options` pattern and system prompt overrides without breaking existing functionality.

- [ ] Task: Update ReasoningService Interface
    - Modify `src/services/ReasoningService.ts` to export `ProcessTextOptions`.
    - Refactor `processText` method signature to accept the options object (maintaining backward compatibility if possible, or updating call sites).
    - **Deliverable:** Updated `ReasoningService` class definition.

- [ ] Task: Implement System Prompt Override
    - Update `processWithGemini` (and other providers if needed) to prioritize `systemPromptOverride` from the options.
    - **Test Requirement:** Verify that passing a custom prompt actually changes the behavior/context sent to the API.
    - **Deliverable:** Functional prompt override in `ReasoningService`.

- [ ] Task: Conductor - User Manual Verification 'Phase 2: Service Refactoring' (Protocol in workflow.md)

## Phase 3: Middleware Hook & Safety
Implement the React hook that manages the logic flow, specifically the zero-latency fallback and strict timeout.

- [ ] Task: Create usePostProcessing Hook Shell
    - Create `src/hooks/usePostProcessing.ts`.
    - Define the state machine (`idle`, `refining`).
    - **Deliverable:** Basic hook structure.

- [ ] Task: Implement Zero-Latency & Timeout Logic
    - Integrate `analyzeIntent` into `usePostProcessing`.
    - Implement the `Promise.race` logic with a 3000ms timeout.
    - Ensure fallback to `cleanText` on error/timeout.
    - **Test Requirement:** Write a component test or hook test that simulates a slow API response (>3s) and asserts that the raw text is returned.
    - **Deliverable:** Fully functional `usePostProcessing` hook.

- [ ] Task: Conductor - User Manual Verification 'Phase 3: Middleware Hook & Safety' (Protocol in workflow.md)

## Phase 4: Integration
Connect the new hook to the main application UI.

- [ ] Task: Integrate into App Component
    - Update `src/App.jsx` (or the relevant container) to use `usePostProcessing`.
    - Pass the transcription result through the `processTranscription` function.
    - **Deliverable:** Wired-up application logic.

- [ ] Task: Add Visual Feedback
    - Implement the "Refining..." UI indicator in `src/App.jsx` or `ControlPanel`.
    - Ensure it only shows when `isRefining` is true.
    - **Deliverable:** Visual feedback for the user.

- [ ] Task: Conductor - User Manual Verification 'Phase 4: Integration' (Protocol in workflow.md)
