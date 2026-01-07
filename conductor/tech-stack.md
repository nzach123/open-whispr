# Tech Stack: OpenWhispr

## Desktop Application
- **Runtime:** Electron (v33+)
- **Process Management:** IPC Bridge with context isolation for security.
- **Installer/Build:** electron-builder (supports DMG, NSIS, DEB, RPM, AppImage).

## Frontend (Renderer)
- **Framework:** React 19
- **Build Tool:** Vite
- **Styling:** Tailwind CSS v4 (CSS-first configuration)
- **UI Components:** shadcn/ui + Radix Primitives + Lucide React (Icons)
- **State Management:** React Hooks + Transcription Store

## Backend & Services
- **Language:** Node.js (Main Process) + TypeScript (Service Layer)
- **Local Database:** better-sqlite3 (Transcription history)
- **Speech-to-Text:** 
  - **Local:** Python-based Whisper bridge (using OpenAI Whisper package)
  - **Cloud:** OpenAI Whisper API
- **AI Refinement (Cloud):**
  - **Primary:** Google Gemini 1.5 Flash (for low-latency intent processing)
  - **Secondary:** OpenAI (GPT-4o series), Anthropic (Claude 3.5 series)

## Utility & Tooling
- **Audio Management:** ffmpeg-static for processing
- **Environment Variables:** dotenv
- **Formatting:** Prettier / ESLint
- **Git Hooks:** (Optional) Commit-based workflow for task tracking
