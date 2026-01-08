import React, { useState, useCallback, useRef, useEffect } from "react";
import { keyboardEventToAccelerator, formatHotkeyLabel, isValidAccelerator } from "../../utils/hotkeys";

interface HotkeyRecorderProps {
    /** Current hotkey value (accelerator string) */
    value: string;
    /** Callback when a new hotkey is captured */
    onChange: (accelerator: string) => void;
    /** Placeholder text when no hotkey is selected */
    placeholder?: string;
    /** Whether the input is disabled */
    disabled?: boolean;
    /** Additional CSS classes */
    className?: string;
}

/**
 * A "Press to Record" hotkey capture component.
 * 
 * When focused, captures keyboard events and builds an Electron accelerator string
 * from the modifiers and key pressed.
 * 
 * @example
 * <HotkeyRecorder
 *   value={hotkey}
 *   onChange={setHotkey}
 *   placeholder="Press your shortcut..."
 * />
 */
export default function HotkeyRecorder({
    value,
    onChange,
    placeholder = "Click to record shortcut...",
    disabled = false,
    className = "",
}: HotkeyRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [pendingAccelerator, setPendingAccelerator] = useState("");
    const inputRef = useRef<HTMLDivElement>(null);

    const isMac = typeof navigator !== "undefined" && /Mac|Darwin/.test(navigator.platform);
    const platform = isMac ? "darwin" : "win32";

    const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isRecording) return;

        // Prevent default browser behavior
        event.preventDefault();
        event.stopPropagation();

        // Convert the keyboard event to an accelerator string
        const accelerator = keyboardEventToAccelerator(event.nativeEvent, platform);

        // Update the pending accelerator (shows what's being pressed)
        setPendingAccelerator(accelerator);

        // If it's a valid accelerator (has a non-modifier key), finalize it
        if (isValidAccelerator(accelerator)) {
            onChange(accelerator);
            setIsRecording(false);
            setPendingAccelerator("");
            inputRef.current?.blur();
        }
    }, [isRecording, onChange, platform]);

    const handleKeyUp = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
        if (!isRecording) return;

        event.preventDefault();
        event.stopPropagation();

        // If user releases all keys without a valid combination, clear the pending state
        // (but only if no modifiers are still held)
        if (!event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey) {
            // Check if pending is modifier-only (invalid)
            if (pendingAccelerator && !isValidAccelerator(pendingAccelerator)) {
                setPendingAccelerator("");
            }
        }
    }, [isRecording, pendingAccelerator]);

    const handleFocus = useCallback(() => {
        if (!disabled) {
            setIsRecording(true);
            setPendingAccelerator("");
        }
    }, [disabled]);

    const handleBlur = useCallback(() => {
        setIsRecording(false);
        setPendingAccelerator("");
    }, []);

    const handleClick = useCallback(() => {
        if (!disabled) {
            setIsRecording(true);
            inputRef.current?.focus();
        }
    }, [disabled]);

    // Handle escape to cancel recording
    useEffect(() => {
        const handleGlobalKeyDown = (event: KeyboardEvent) => {
            if (isRecording && event.key === "Escape") {
                setIsRecording(false);
                setPendingAccelerator("");
                inputRef.current?.blur();
            }
        };

        if (isRecording) {
            window.addEventListener("keydown", handleGlobalKeyDown);
        }

        return () => {
            window.removeEventListener("keydown", handleGlobalKeyDown);
        };
    }, [isRecording]);

    // Display value: pending while recording, otherwise the saved value
    const displayValue = isRecording
        ? (pendingAccelerator ? formatHotkeyLabel(pendingAccelerator, platform) : "")
        : (value ? formatHotkeyLabel(value, platform) : "");

    return (
        <div className={`relative ${className}`}>
            <div
                ref={inputRef}
                tabIndex={disabled ? -1 : 0}
                role="button"
                aria-label="Record hotkey"
                onClick={handleClick}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onKeyUp={handleKeyUp}
                className={`
          w-full px-4 py-3 text-center text-lg font-mono
          border-2 rounded-lg cursor-pointer
          transition-all duration-200
          outline-none
          ${disabled
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                        : isRecording
                            ? "bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200 text-indigo-900"
                            : "bg-white border-gray-300 hover:border-gray-400 text-gray-800"
                    }
        `}
            >
                {displayValue || (
                    <span className={isRecording ? "text-indigo-500 animate-pulse" : "text-gray-400"}>
                        {isRecording ? "Press your shortcut..." : placeholder}
                    </span>
                )}
            </div>

            {/* Recording indicator */}
            {isRecording && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-500">Recording</span>
                </div>
            )}

            {/* Helper text */}
            <p className="text-xs text-gray-500 mt-2 text-center">
                {isRecording
                    ? "Press a key combination (e.g., Ctrl+Space). Press Escape to cancel."
                    : "Click to record a new shortcut"
                }
            </p>
        </div>
    );
}
