# Product Guidelines: OpenWhispr

## Prose Style & Tone
- **Professional & Direct:** The assistant should be concise and efficient, avoiding unnecessary fluff or conversational filler.
- **Developer-Centric:** Use terminology familiar to developers (e.g., "transcription," "refinement," "intent").
- **Clarity Over Personality:** While agent naming is supported, the focus remains on high-utility output rather than creating a "buddy" persona.

## Visual Identity & UX
- **Minimalist Overlay:** The dictation panel should be small, draggable, and unobtrusive, fitting naturally into a coding workspace.
- **Actionable Feedback:** Provide clear visual indicators for "Recording," "Processing," and "Refining" so the user knows exactly what the app is doing.
- **Non-Interruptive:** The app should stay out of the way until summoned, ensuring it doesn't break the user's "flow."

## Refinement Logic (Intents)
- **Strict Matching:** Use normalized regex to detect triggers. Handle common Whisper artifacts (leading punctuation or spaces) gracefully.
- **Preservation of Content:** Refinement should only strip the trigger and modify the text according to the intent. It must never "hallucinate" additional content outside the user's spoken words.
- **Fail-Safe Processing:** If a refinement service (like Gemini) fails or exceeds 3 seconds, the system MUST fallback to the cleaned raw text.

## Privacy & Security
- **Local First:** Default to local Whisper processing whenever possible.
- **Credential Safety:** Never log or expose API keys. Use secure OS-level storage for secrets.
- **Transparency:** Clearly indicate when audio data is being sent to a cloud provider for processing.
