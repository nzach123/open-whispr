import { describe, test, expect } from 'vitest';
import {
    toAcceleratorString,
    parseAcceleratorString,
    normalizeAccelerator,
    isValidAccelerator,
    formatHotkeyLabel,
    isSingleKey,
    toCrossplatformAccelerator,
    type HotkeyCombo,
} from '../utils/hotkeys';

describe('hotkey utilities', () => {
    describe('toAcceleratorString', () => {
        test('builds correct format with multiple modifiers', () => {
            const combo: HotkeyCombo = { modifiers: ['Ctrl', 'Shift'], key: 'Space' };
            expect(toAcceleratorString(combo)).toBe('Ctrl+Shift+Space');
        });

        test('works with single modifier', () => {
            const combo: HotkeyCombo = { modifiers: ['Alt'], key: 'F1' };
            expect(toAcceleratorString(combo)).toBe('Alt+F1');
        });

        test('works with no modifiers', () => {
            const combo: HotkeyCombo = { modifiers: [], key: 'F1' };
            expect(toAcceleratorString(combo)).toBe('F1');
        });

        test('handles CommandOrControl', () => {
            const combo: HotkeyCombo = { modifiers: ['CommandOrControl', 'Shift'], key: 'A' };
            expect(toAcceleratorString(combo)).toBe('CommandOrControl+Shift+A');
        });
    });

    describe('parseAcceleratorString', () => {
        test('parses standard accelerator', () => {
            const result = parseAcceleratorString('Ctrl+Shift+Space');
            expect(result.modifiers).toEqual(['Ctrl', 'Shift']);
            expect(result.key).toBe('Space');
        });

        test('handles single key', () => {
            const result = parseAcceleratorString('F1');
            expect(result.modifiers).toEqual([]);
            expect(result.key).toBe('F1');
        });

        test('normalizes modifier aliases', () => {
            const result = parseAcceleratorString('control+option+A');
            expect(result.modifiers).toEqual(['Ctrl', 'Alt']);
            expect(result.key).toBe('A');
        });

        test('handles CommandOrControl', () => {
            const result = parseAcceleratorString('CommandOrControl+Alt+R');
            expect(result.modifiers).toEqual(['CommandOrControl', 'Alt']);
            expect(result.key).toBe('R');
        });
    });

    describe('normalizeAccelerator', () => {
        test('normalizes case variations', () => {
            expect(normalizeAccelerator('ctrl+SHIFT+space')).toBe('Ctrl+Shift+Space');
        });

        test('handles function keys', () => {
            expect(normalizeAccelerator('ctrl+f1')).toBe('Ctrl+F1');
        });

        test('handles single character keys', () => {
            expect(normalizeAccelerator('ctrl+a')).toBe('Ctrl+A');
        });

        test('preserves valid format', () => {
            expect(normalizeAccelerator('Ctrl+Shift+Space')).toBe('Ctrl+Shift+Space');
        });
    });

    describe('isValidAccelerator', () => {
        test('rejects modifier-only combinations', () => {
            expect(isValidAccelerator('Ctrl+Shift')).toBe(false);
            expect(isValidAccelerator('Ctrl')).toBe(false);
            expect(isValidAccelerator('Alt+Cmd')).toBe(false);
        });

        test('accepts valid combinations', () => {
            expect(isValidAccelerator('Ctrl+Space')).toBe(true);
            expect(isValidAccelerator('Ctrl+Shift+A')).toBe(true);
        });

        test('accepts single keys', () => {
            expect(isValidAccelerator('F1')).toBe(true);
            expect(isValidAccelerator('`')).toBe(true);
            expect(isValidAccelerator('A')).toBe(true);
        });

        test('handles GLOBE special case', () => {
            expect(isValidAccelerator('GLOBE')).toBe(true);
        });

        test('rejects empty/invalid input', () => {
            expect(isValidAccelerator('')).toBe(false);
            expect(isValidAccelerator('   ')).toBe(false);
            expect(isValidAccelerator(null as any)).toBe(false);
            expect(isValidAccelerator(undefined as any)).toBe(false);
        });
    });

    describe('formatHotkeyLabel', () => {
        test('formats with macOS symbols', () => {
            expect(formatHotkeyLabel('Cmd+Shift+Space', 'darwin')).toBe('⌘⇧␣');
            expect(formatHotkeyLabel('Ctrl+A', 'darwin')).toBe('⌃A');
        });

        test('formats for Windows without special symbols', () => {
            expect(formatHotkeyLabel('Ctrl+Shift+A', 'win32')).toBe('Ctrl+Shift+A');
        });

        test('handles CommandOrControl per platform', () => {
            expect(formatHotkeyLabel('CommandOrControl+A', 'darwin')).toBe('⌘A');
            expect(formatHotkeyLabel('CommandOrControl+A', 'win32')).toBe('Ctrl+A');
        });

        test('handles single keys', () => {
            expect(formatHotkeyLabel('F1', 'win32')).toBe('F1');
            expect(formatHotkeyLabel('`', 'win32')).toBe('`');
        });

        test('handles GLOBE key', () => {
            expect(formatHotkeyLabel('GLOBE', 'darwin')).toBe('🌐 Globe');
        });

        test('returns default for empty input', () => {
            expect(formatHotkeyLabel('')).toBe('`');
            expect(formatHotkeyLabel(null)).toBe('`');
            expect(formatHotkeyLabel(undefined)).toBe('`');
        });
    });

    describe('isSingleKey', () => {
        test('identifies single keys', () => {
            expect(isSingleKey('F1')).toBe(true);
            expect(isSingleKey('`')).toBe(true);
            expect(isSingleKey('Space')).toBe(true);
        });

        test('identifies combinations', () => {
            expect(isSingleKey('Ctrl+Space')).toBe(false);
            expect(isSingleKey('Cmd+Shift+A')).toBe(false);
        });
    });

    describe('toCrossplatformAccelerator', () => {
        test('converts Ctrl to CommandOrControl', () => {
            expect(toCrossplatformAccelerator('Ctrl+A')).toBe('CommandOrControl+A');
        });

        test('converts Cmd to CommandOrControl', () => {
            expect(toCrossplatformAccelerator('Cmd+A')).toBe('CommandOrControl+A');
        });

        test('preserves other modifiers', () => {
            expect(toCrossplatformAccelerator('Ctrl+Shift+A')).toBe('CommandOrControl+Shift+A');
        });
    });
});
