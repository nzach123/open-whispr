# Initial Concept
The user wants to build a hands-free transcription tool to input prompts for "vibe coding" in an IDE (specifically Antigravity IDE). The tool should detect intent (e.g., "fix grammar", "summarize") and use Gemini 1.5 Flash to refine the text, with a strict fallback to raw text if no intent is found or if processing takes too long (>3s).

# Product Guide: OpenWhispr

## Vision
OpenWhispr is a privacy-first, ultra-low-latency dictation tool designed for developers and "vibe coders." It bridges the gap between spoken thought and structured code/prompts, allowing for hands-free interaction with AI-powered IDEs.

## Target Users
- **Vibe Coders:** Developers who use natural language prompts to generate code and need a fluid, voice-driven interface.
- **Power Users:** Individuals who require fast, accurate transcription with local privacy and optional AI refinement.
- **Hands-Free Dictators:** Professionals needing to input text across any application without manual typing.

## Core Goals
- **Zero-Latency Fallback:** Regular dictation must be instantaneous. AI refinement only triggers when a specific intent is detected.
- **Clean Service Contracts:** Maintain a modular architecture where intent logic, UI, and AI services are strictly decoupled.
- **Reliability:** Ensure that even if AI services are slow or unavailable, the user always receives their transcribed text within a strict 3-second window.
- **Privacy:** Prioritize local processing for transcription, using cloud services only for requested refinements.

## Key Features
- **Global Hotkey (Backtick):** Toggle dictation from anywhere in the OS.
- **Intent-Based Refinement:** Automatically detect commands like "fix grammar," "rewrite professionally," or "summarize" at the start of a dictation.
- **Multi-Provider AI:** Support for OpenAI, Anthropic, and Google Gemini (primary for fast refinement).
- **Local Whisper Support:** Run transcription entirely on-device for maximum privacy.
- **Agent Naming:** Personalize the assistant for more natural "Hey [Agent], ..." interactions.
- **Automatic Pasting:** Seamlessly insert transcribed and refined text into the active window (e.g., Antigravity IDE).
