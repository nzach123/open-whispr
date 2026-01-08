/**
 * AI Agent Types
 * Defines the data model for voice-activated AI agents with distinct personas.
 */

export interface AIAgent {
    id: string;                              // UUID
    name: string;                            // Display name (e.g., "Dev", "Lawyer")
    triggerPhrases: string[];                // Activation phrases ["Hey Dev", "Developer"]
    systemPrompt: string;                    // Agent-specific system instructions
    outputMode: 'concise' | 'elaborate';     // Response style
    enabled: boolean;                        // Toggle agent on/off
    isBuiltIn: boolean;                      // True for pre-seeded agents
    createdAt: string;                       // ISO timestamp
    updatedAt: string;                       // ISO timestamp
}

export interface AgentProcessingResult {
    agentId: string | null;
    agentName: string | null;
    wasTriggered: boolean;
    processedText: string;
}

export interface AgentMatch {
    agent: AIAgent;
    matchedPhrase: string;
    matchIndex: number;
}

/**
 * Default agents pre-seeded on first launch.
 * Three senior developers specialized in Electron/React/TypeScript/Python stack.
 */
export const DEFAULT_AGENTS: Omit<AIAgent, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
        name: 'Archie',
        triggerPhrases: ['Hey Archie', 'Architect'],
        systemPrompt: `You are Archie, a senior Electron architect for OpenWhispr. Your expertise:

- IPC patterns: ipcMain.handle ↔ ipcRenderer.invoke ↔ preload.js context bridge
- Process boundaries: Main (Node.js/CommonJS) vs Renderer (React/TypeScript/Vite)
- electron.ts: The source of truth for IPC types — always update when adding handlers
- Binary safety: Never hardcode paths; use app.getPath(), app.asar.unpacked patterns
- Cross-platform: Windows (PowerShell, .exe) and macOS (Homebrew, .app bundles)

When reviewing code, check:
1. Is the IPC handler defined in ipcHandlers.js?
2. Is it exposed in preload.js?
3. Are types updated in src/types/electron.ts?

Process the following dictated text and provide precise, actionable guidance. Include file paths and code snippets when relevant.

{{text}}`,
        outputMode: 'elaborate',
        enabled: true,
        isBuiltIn: true,
    },
    {
        name: 'Rex',
        triggerPhrases: ['Hey Rex', 'React'],
        systemPrompt: `You are Rex, a senior React/TypeScript developer for OpenWhispr. Your expertise:

- React 19 with Vite 6 and TailwindCSS 4 (using @tailwindcss/vite)
- shadcn/ui components (Radix primitives) — Dialog, Select, Tabs, Progress
- Custom hooks: useSettings, useLocalStorage, useLocalModels, useSyncExternalStore
- Type safety: Always consume window.electronAPI through typed interfaces
- State: Push persistent data to Main process; use localStorage for settings

When writing UI code:
1. Use existing cn() utility from lib/utils for className merging
2. Follow existing component patterns in src/components/
3. Keep components focused — split large files into sub-components

Process the following dictated text. Output clean, idiomatic TypeScript. Prefer brevity over verbosity.

{{text}}`,
        outputMode: 'concise',
        enabled: true,
        isBuiltIn: true,
    },
    {
        name: 'Py',
        triggerPhrases: ['Hey Py', 'Python'],
        systemPrompt: `You are Py, a senior Python/ML engineer for OpenWhispr. Your expertise:

- whisper_bridge.py: Model loading, transcription, FFmpeg path resolution
- Dual-context execution: Development (source files) vs Production (ASAR/MEIPASS)
- Path safety: Check sys._MEIPASS, then app.asar.unpacked, then fallback
- Output protocol: JSON to stdout (results), text to stderr (progress/debug)
- Dependencies: Minimize pip requirements; prefer standard library

When modifying Python code:
1. Wrap subprocess/file ops in try/except with meaningful error codes
2. Return structured JSON: {"success": bool, "error"?: string, "data"?: any}
3. Log debug info to stderr, not stdout

Process the following dictated text. Output practical, defensive code. Assume binaries may be missing.

{{text}}`,
        outputMode: 'elaborate',
        enabled: true,
        isBuiltIn: true,
    },
];

/**
 * Generate a UUID for new agents
 */
export function generateAgentId(): string {
    return 'agent_' + crypto.randomUUID();
}

/**
 * Create a new agent with default values
 */
export function createAgent(partial: Partial<AIAgent> = {}): AIAgent {
    const now = new Date().toISOString();
    return {
        id: generateAgentId(),
        name: '',
        triggerPhrases: [],
        systemPrompt: 'Process the following text:\n\n{{text}}',
        outputMode: 'concise',
        enabled: true,
        isBuiltIn: false,
        createdAt: now,
        updatedAt: now,
        ...partial,
    };
}

/**
 * Find matching agent from text based on trigger phrases
 */
export function findMatchingAgent(text: string, agents: AIAgent[]): AgentMatch | null {
    const lowerText = text.toLowerCase();

    for (const agent of agents) {
        if (!agent.enabled) continue;

        for (const phrase of agent.triggerPhrases) {
            const lowerPhrase = phrase.toLowerCase();
            const matchIndex = lowerText.indexOf(lowerPhrase);

            if (matchIndex !== -1) {
                return {
                    agent,
                    matchedPhrase: phrase,
                    matchIndex,
                };
            }
        }
    }

    return null;
}

/**
 * Storage key for agents in localStorage
 */
export const AGENTS_STORAGE_KEY = 'openwhispr_agents';
