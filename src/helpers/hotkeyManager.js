const { globalShortcut } = require("electron");

/**
 * Modifier aliases for normalization (case-insensitive).
 */
const MODIFIER_ALIASES = {
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

/**
 * Keys that are modifiers only and cannot be the primary key.
 */
const MODIFIER_ONLY_KEYS = new Set([
  'ctrl', 'control', 'shift', 'alt', 'option', 'cmd', 'command', 'meta',
  'commandorcontrol', 'cmdorctrl',
]);

class HotkeyManager {
  constructor() {
    this.currentHotkey = "`";
    this.isInitialized = false;
  }

  /**
   * Normalize an accelerator string to Electron's expected format.
   * Handles case variations and modifier aliases.
   * 
   * @param {string} accelerator - The accelerator string to normalize
   * @returns {string} Normalized accelerator string
   * 
   * @example
   * normalizeAccelerator("ctrl+SHIFT+space") // Returns: "Ctrl+Shift+Space"
   */
  normalizeAccelerator(accelerator) {
    if (!accelerator || typeof accelerator !== 'string') {
      return accelerator;
    }

    const parts = accelerator.split('+').map(p => p.trim()).filter(Boolean);
    const normalized = [];

    for (const part of parts) {
      const lowerPart = part.toLowerCase();
      const modifier = MODIFIER_ALIASES[lowerPart];

      if (modifier) {
        normalized.push(modifier);
      } else {
        // Handle function keys (F1-F12)
        if (/^f\d+$/i.test(part)) {
          normalized.push(part.toUpperCase());
        } else if (part.length === 1) {
          // Single character keys stay uppercase
          normalized.push(part.toUpperCase());
        } else {
          // Capitalize first letter for key names (e.g., "space" -> "Space")
          const key = part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
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
   * @param {string} accelerator - The accelerator string to validate
   * @returns {boolean} True if valid
   */
  isValidAccelerator(accelerator) {
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
   * Get a human-readable error message for registration failures.
   * 
   * @param {string} hotkey - The hotkey that failed
   * @param {string} reason - Optional reason for failure
   * @returns {string} User-friendly error message
   */
  getRegistrationErrorMessage(hotkey, reason = '') {
    const commonReserved = [
      'Ctrl+C', 'Ctrl+V', 'Ctrl+X', 'Ctrl+Z', 'Ctrl+A',
      'Cmd+C', 'Cmd+V', 'Cmd+X', 'Cmd+Z', 'Cmd+A', 'Cmd+Q',
      'Alt+F4', 'Alt+Tab',
    ];

    const normalizedHotkey = this.normalizeAccelerator(hotkey);

    if (commonReserved.some(reserved =>
      this.normalizeAccelerator(reserved) === normalizedHotkey
    )) {
      return `"${hotkey}" is a system-reserved shortcut and cannot be used. Please choose a different combination.`;
    }

    if (reason) {
      return `Failed to register "${hotkey}": ${reason}`;
    }

    return `Failed to register "${hotkey}". This shortcut may be in use by another application or reserved by the system.`;
  }

  setupShortcuts(hotkey = "`", callback) {
    if (!callback) {
      throw new Error("Callback function is required for hotkey setup");
    }

    // Normalize the accelerator
    const normalized = this.normalizeAccelerator(hotkey);

    // Validate the accelerator format
    if (!this.isValidAccelerator(normalized)) {
      return {
        success: false,
        error: "Invalid hotkey format. Please include at least one non-modifier key (e.g., 'Ctrl+Space', not 'Ctrl+Shift').",
        code: 'INVALID_FORMAT',
      };
    }

    // Unregister current hotkey if it exists
    if (this.currentHotkey && this.currentHotkey !== "GLOBE") {
      try {
        globalShortcut.unregister(this.currentHotkey);
      } catch (err) {
        // Ignore unregister errors
      }
    }

    try {
      // Handle GLOBE key (macOS only, uses separate GlobeKeyManager)
      if (normalized === "GLOBE") {
        if (process.platform !== "darwin") {
          return {
            success: false,
            error: "The Globe key is only available on macOS.",
            code: 'PLATFORM_UNSUPPORTED',
          };
        }
        this.currentHotkey = normalized;
        return { success: true, hotkey: normalized };
      }

      // Register the new hotkey
      const success = globalShortcut.register(normalized, callback);

      if (success) {
        this.currentHotkey = normalized;
        console.log(`Hotkey registered successfully: ${normalized}`);
        return { success: true, hotkey: normalized };
      } else {
        const errorMessage = this.getRegistrationErrorMessage(normalized);
        console.error(`Failed to register hotkey: ${normalized}`);
        return {
          success: false,
          error: errorMessage,
          code: 'REGISTRATION_FAILED',
        };
      }
    } catch (error) {
      console.error("Error setting up shortcuts:", error);
      return {
        success: false,
        error: error.message,
        code: 'EXCEPTION',
      };
    }
  }

  async initializeHotkey(mainWindow, callback) {
    if (!mainWindow || !callback) {
      throw new Error("mainWindow and callback are required");
    }

    // Set up default hotkey first
    this.setupShortcuts("`", callback);

    // Listen for window to be ready, then get saved hotkey
    mainWindow.webContents.once("did-finish-load", () => {
      setTimeout(() => {
        this.loadSavedHotkey(mainWindow, callback);
      }, 1000);
    });

    this.isInitialized = true;
  }

  async loadSavedHotkey(mainWindow, callback) {
    try {
      const savedHotkey = await mainWindow.webContents.executeJavaScript(`
        localStorage.getItem("dictationKey") || "\`"
      `);

      if (savedHotkey && savedHotkey !== "`") {
        const result = this.setupShortcuts(savedHotkey, callback);
        if (result.success) {
          console.log(`Loaded saved hotkey: ${savedHotkey}`);
        } else {
          console.warn(`Could not load saved hotkey "${savedHotkey}": ${result.error}`);
        }
      }
    } catch (err) {
      console.error("Failed to get saved hotkey:", err);
    }
  }

  async updateHotkey(hotkey, callback) {
    if (!callback) {
      throw new Error("Callback function is required for hotkey update");
    }

    try {
      const result = this.setupShortcuts(hotkey, callback);
      if (result.success) {
        return {
          success: true,
          message: `Hotkey updated to: ${result.hotkey}`,
          hotkey: result.hotkey,
        };
      } else {
        return {
          success: false,
          message: result.error,
          code: result.code,
        };
      }
    } catch (error) {
      console.error("Failed to update hotkey:", error);
      return {
        success: false,
        message: `Failed to update hotkey: ${error.message}`,
        code: 'EXCEPTION',
      };
    }
  }

  getCurrentHotkey() {
    return this.currentHotkey;
  }

  unregisterAll() {
    globalShortcut.unregisterAll();
  }

  isHotkeyRegistered(hotkey) {
    return globalShortcut.isRegistered(hotkey);
  }
}

module.exports = HotkeyManager;
