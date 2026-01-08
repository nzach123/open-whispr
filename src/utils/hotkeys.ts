/**
 * Hotkey utilities for parsing, formatting, and validating Electron accelerator strings.
 * 
 * Electron accelerator format: "Modifier+Modifier+Key" (e.g., "Ctrl+Shift+Space")
 * See: https://www.electronjs.org/docs/latest/api/accelerator
 */

/** Valid modifier keys in Electron accelerator format */
export type ModifierKey = 'Ctrl' | 'Shift' | 'Alt' | 'Cmd' | 'CommandOrControl' | 'CmdOrCtrl';

/** Structured representation of a hotkey combination */
export interface HotkeyCombo {
  modifiers: ModifierKey[];
  key: string;
}

/** All recognized modifier strings (case-insensitive matching) */
const MODIFIER_ALIASES: Record<string, ModifierKey> = {
  'ctrl': 'Ctrl',
  'control': 'Ctrl',
  'shift': 'Shift',
  'alt': 'Alt',
  'option': 'Alt',
  'cmd': 'Cmd',
  'command': 'Cmd',
  'meta': 'Cmd',
  'commandorcontrol': 'CommandOrControl',
  'cmdorctrl': 'CmdOrCtrl',
};

/** Keys that are modifiers only and cannot be the primary key */
const MODIFIER_ONLY_KEYS = new Set([
  'ctrl', 'control', 'shift', 'alt', 'option', 'cmd', 'command', 'meta',
  'commandorcontrol', 'cmdorctrl',
]);

/** Map browser event.code values to Electron key names */
const CODE_TO_KEY: Record<string, string> = {
  'Space': 'Space',
  'Backquote': '`',
  'Backslash': '\\',
  'BracketLeft': '[',
  'BracketRight': ']',
  'Comma': ',',
  'Period': '.',
  'Slash': '/',
  'Semicolon': ';',
  'Quote': "'",
  'Minus': '-',
  'Equal': '=',
  'Enter': 'Enter',
  'Tab': 'Tab',
  'Escape': 'Escape',
  'Backspace': 'Backspace',
  'Delete': 'Delete',
  'Insert': 'Insert',
  'Home': 'Home',
  'End': 'End',
  'PageUp': 'PageUp',
  'PageDown': 'PageDown',
  'ArrowUp': 'Up',
  'ArrowDown': 'Down',
  'ArrowLeft': 'Left',
  'ArrowRight': 'Right',
};

/**
 * Convert a structured HotkeyCombo to an Electron accelerator string.
 * 
 * @example
 * toAcceleratorString({ modifiers: ['Ctrl', 'Shift'], key: 'Space' })
 * // Returns: "Ctrl+Shift+Space"
 */
export function toAcceleratorString(combo: HotkeyCombo): string {
  const parts = [...combo.modifiers, combo.key];
  return parts.join('+');
}

/**
 * Parse an Electron accelerator string into a structured HotkeyCombo.
 * 
 * @example
 * parseAcceleratorString("Ctrl+Shift+Space")
 * // Returns: { modifiers: ['Ctrl', 'Shift'], key: 'Space' }
 */
export function parseAcceleratorString(accelerator: string): HotkeyCombo {
  const parts = accelerator.split('+').map(p => p.trim()).filter(Boolean);
  const modifiers: ModifierKey[] = [];
  let key = '';

  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    const normalizedModifier = MODIFIER_ALIASES[lowerPart];

    if (normalizedModifier) {
      modifiers.push(normalizedModifier);
    } else {
      // Last non-modifier part is the key
      key = part;
    }
  }

  return { modifiers, key };
}

/**
 * Normalize an accelerator string to consistent format.
 * Handles case variations and aliases.
 * 
 * @example
 * normalizeAccelerator("ctrl+SHIFT+space")
 * // Returns: "Ctrl+Shift+Space"
 */
export function normalizeAccelerator(accelerator: string): string {
  const parts = accelerator.split('+').map(p => p.trim()).filter(Boolean);
  const normalized: string[] = [];

  for (const part of parts) {
    const lowerPart = part.toLowerCase();
    const modifier = MODIFIER_ALIASES[lowerPart];

    if (modifier) {
      normalized.push(modifier);
    } else {
      // Capitalize first letter for key names (e.g., "space" -> "Space", "f1" -> "F1")
      const key = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      // Handle special cases like F1-F12
      if (/^f\d+$/i.test(part)) {
        normalized.push(part.toUpperCase());
      } else if (part.length === 1) {
        // Single character keys stay uppercase
        normalized.push(part.toUpperCase());
      } else {
        normalized.push(key);
      }
    }
  }

  return normalized.join('+');
}

/**
 * Validate an accelerator string format.
 * Returns true if the accelerator has at least one non-modifier key.
 * 
 * @example
 * isValidAccelerator("Ctrl+Shift")  // false - no primary key
 * isValidAccelerator("Ctrl+Space")  // true
 * isValidAccelerator("F1")          // true - single key is valid
 */
export function isValidAccelerator(accelerator: string): boolean {
  if (!accelerator || typeof accelerator !== 'string') {
    return false;
  }

  const trimmed = accelerator.trim();
  if (trimmed === '') {
    return false;
  }

  // Special case for GLOBE (macOS Globe key)
  if (trimmed === 'GLOBE') {
    return true;
  }

  const parts = trimmed.split('+').map(p => p.trim().toLowerCase()).filter(Boolean);

  if (parts.length === 0) {
    return false;
  }

  // Check that at least one part is NOT a modifier
  const hasNonModifier = parts.some(part => !MODIFIER_ONLY_KEYS.has(part));

  return hasNonModifier;
}

/**
 * Convert a keyboard event to an accelerator string.
 * Used by the "Press to Record" hotkey capture UI.
 * 
 * @example
 * // User presses Ctrl+Shift+Space
 * keyboardEventToAccelerator(event)
 * // Returns: "Ctrl+Shift+Space"
 */
export function keyboardEventToAccelerator(event: KeyboardEvent, platform?: string): string {
  const modifiers: string[] = [];
  const os = platform || (typeof navigator !== 'undefined' ?
    (navigator.platform.includes('Mac') ? 'darwin' : 'win32') : 'win32');

  // Build modifier list
  if (event.ctrlKey) {
    modifiers.push(os === 'darwin' ? 'Ctrl' : 'Ctrl');
  }
  if (event.metaKey) {
    modifiers.push('Cmd');
  }
  if (event.altKey) {
    modifiers.push('Alt');
  }
  if (event.shiftKey) {
    modifiers.push('Shift');
  }

  // Get the primary key from event.code
  let key = '';
  const code = event.code;

  // Check if this is a modifier-only key press
  if (['ControlLeft', 'ControlRight', 'ShiftLeft', 'ShiftRight',
    'AltLeft', 'AltRight', 'MetaLeft', 'MetaRight'].includes(code)) {
    // Return modifiers only (will be marked invalid during save)
    return modifiers.join('+');
  }

  // Map code to key name
  if (CODE_TO_KEY[code]) {
    key = CODE_TO_KEY[code];
  } else if (code.startsWith('Key')) {
    // KeyA, KeyB, etc. -> A, B, etc.
    key = code.slice(3);
  } else if (code.startsWith('Digit')) {
    // Digit1, Digit2, etc. -> 1, 2, etc.
    key = code.slice(5);
  } else if (code.startsWith('Numpad')) {
    // NumpadAdd, Numpad1, etc.
    key = 'num' + code.slice(6);
  } else if (code.startsWith('F') && /^F\d+$/.test(code)) {
    // F1, F2, etc.
    key = code;
  } else {
    // Fallback to the key value
    key = event.key.length === 1 ? event.key.toUpperCase() : event.key;
  }

  if (modifiers.length > 0) {
    return [...modifiers, key].join('+');
  }

  return key;
}

/**
 * Platform-specific symbol mapping for display
 */
const PLATFORM_SYMBOLS: Record<string, Record<string, string>> = {
  darwin: {
    'Ctrl': '⌃',
    'Cmd': '⌘',
    'Alt': '⌥',
    'Shift': '⇧',
    'CommandOrControl': '⌘',
    'CmdOrCtrl': '⌘',
    'Enter': '↩',
    'Backspace': '⌫',
    'Delete': '⌦',
    'Escape': '⎋',
    'Tab': '⇥',
    'Space': '␣',
    'Up': '↑',
    'Down': '↓',
    'Left': '←',
    'Right': '→',
  },
  win32: {
    'CommandOrControl': 'Ctrl',
    'CmdOrCtrl': 'Ctrl',
    'Cmd': 'Win',
  },
  linux: {
    'CommandOrControl': 'Ctrl',
    'CmdOrCtrl': 'Ctrl',
    'Cmd': 'Super',
  },
};

/**
 * Format a hotkey accelerator for display, with platform-aware symbols.
 * 
 * @example
 * formatHotkeyLabel("Cmd+Shift+Space", "darwin")
 * // Returns: "⌘+⇧+␣"
 * 
 * formatHotkeyLabel("Ctrl+Space", "win32")
 * // Returns: "Ctrl+Space"
 */
export function formatHotkeyLabel(hotkey?: string | null, platform?: string): string {
  if (!hotkey || hotkey.trim() === "") {
    return "`";
  }

  if (hotkey === "GLOBE") {
    return "🌐 Globe";
  }

  const os = platform || (typeof navigator !== 'undefined' ?
    (navigator.platform.includes('Mac') ? 'darwin' : 'win32') : 'win32');

  const symbols = PLATFORM_SYMBOLS[os] || PLATFORM_SYMBOLS.win32;

  // If it's a simple single character or no + separator, return as-is (or mapped)
  if (!hotkey.includes('+')) {
    return symbols[hotkey] || hotkey;
  }

  const parts = hotkey.split('+').map(part => {
    const trimmed = part.trim();
    return symbols[trimmed] || trimmed;
  });

  // On macOS, join modifiers without separator for cleaner display
  if (os === 'darwin') {
    return parts.join('');
  }

  return parts.join('+');
}

/**
 * Check if a hotkey is a single key (no modifiers).
 */
export function isSingleKey(accelerator: string): boolean {
  return !accelerator.includes('+');
}

/**
 * Get a cross-platform accelerator using CommandOrControl.
 * Converts Ctrl or Cmd to CommandOrControl for portability.
 */
export function toCrossplatformAccelerator(accelerator: string): string {
  return accelerator
    .replace(/\bCtrl\b/gi, 'CommandOrControl')
    .replace(/\bCmd\b/gi, 'CommandOrControl')
    .replace(/\bCommand\b/gi, 'CommandOrControl');
}
