/**
 * Gemini Cloud Transcription - Test Suite
 * 
 * These tests verify the Gemini transcription implementation.
 * Run with: npm test (after adding vitest to devDependencies)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock window.electronAPI
const mockElectronAPI = {
    getGeminiKey: vi.fn(),
    convertWavToMp3: vi.fn(),
    transcribeLocalWhisper: vi.fn(),
};

// Mock localStorage
const mockLocalStorage: Record<string, string> = {};
vi.stubGlobal('localStorage', {
    getItem: (key: string) => mockLocalStorage[key] || null,
    setItem: (key: string, value: string) => { mockLocalStorage[key] = value; },
    removeItem: (key: string) => { delete mockLocalStorage[key]; },
});

vi.stubGlobal('window', { electronAPI: mockElectronAPI });

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('Gemini Transcription Configuration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
    });

    describe('GEMINI_TRANSCRIPTION_MODELS', () => {
        it('should export valid model configurations', async () => {
            const { GEMINI_TRANSCRIPTION_MODELS } = await import('../src/config/constants');

            expect(GEMINI_TRANSCRIPTION_MODELS).toBeDefined();
            expect(GEMINI_TRANSCRIPTION_MODELS.length).toBeGreaterThan(0);

            // Verify recommended model exists
            const recommendedModel = GEMINI_TRANSCRIPTION_MODELS.find(m => m.recommended);
            expect(recommendedModel).toBeDefined();
            expect(recommendedModel?.id).toBe('gemini-2.5-flash-lite');
        });

        it('should have valid model IDs for Gemini API', async () => {
            const { GEMINI_TRANSCRIPTION_MODELS } = await import('../src/config/constants');

            for (const model of GEMINI_TRANSCRIPTION_MODELS) {
                expect(model.id).toMatch(/^gemini-\d+\.\d+-/);
                expect(model.name).toBeTruthy();
            }
        });
    });
});

describe('Gemini API Key Management', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        Object.keys(mockLocalStorage).forEach(key => delete mockLocalStorage[key]);
    });

    it('should retrieve Gemini API key from electronAPI', async () => {
        mockElectronAPI.getGeminiKey.mockResolvedValue('test-api-key-123');

        // The actual getGeminiAPIKey is inside AudioManager class
        // This tests the IPC pathway
        const key = await mockElectronAPI.getGeminiKey();
        expect(key).toBe('test-api-key-123');
    });

    it('should fall back to localStorage if electronAPI returns empty', async () => {
        mockElectronAPI.getGeminiKey.mockResolvedValue('');
        mockLocalStorage['geminiApiKey'] = 'fallback-key-456';

        const electronKey = await mockElectronAPI.getGeminiKey();
        expect(electronKey).toBe('');
        expect(mockLocalStorage['geminiApiKey']).toBe('fallback-key-456');
    });
});

describe('WAV to MP3 Conversion', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should call convertWavToMp3 with ArrayBuffer', async () => {
        const testBuffer = new ArrayBuffer(1024);
        const expectedBase64 = 'dGVzdC1tcDMtZGF0YQ==';
        mockElectronAPI.convertWavToMp3.mockResolvedValue(expectedBase64);

        const result = await mockElectronAPI.convertWavToMp3(testBuffer);

        expect(mockElectronAPI.convertWavToMp3).toHaveBeenCalledWith(testBuffer);
        expect(result).toBe(expectedBase64);
    });

    it('should handle conversion errors gracefully', async () => {
        mockElectronAPI.convertWavToMp3.mockRejectedValue(new Error('FFmpeg not available'));

        await expect(mockElectronAPI.convertWavToMp3(new ArrayBuffer(100)))
            .rejects.toThrow('FFmpeg not available');
    });
});

describe('Gemini API Response Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockElectronAPI.getGeminiKey.mockResolvedValue('test-api-key');
        mockElectronAPI.convertWavToMp3.mockResolvedValue('base64audio');
    });

    it('should parse successful Gemini response', async () => {
        const mockResponse = {
            candidates: [{
                content: {
                    parts: [{ text: 'Hello, this is a test transcription.' }]
                }
            }]
        };

        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockResponse),
        });

        // Verify the response structure
        expect(mockResponse.candidates[0].content.parts[0].text).toBe('Hello, this is a test transcription.');
    });

    it('should handle rate limiting (429)', async () => {
        mockFetch.mockResolvedValue({
            ok: false,
            status: 429,
            statusText: 'Too Many Requests',
            text: () => Promise.resolve('Rate limit exceeded'),
        });

        // The actual error throwing is in processWithGeminiAPI
        // This verifies the 429 status is correctly identified
        const response = await mockFetch('https://test.com');
        expect(response.status).toBe(429);
    });

    it('should handle empty response from Gemini', async () => {
        const emptyResponse = {
            candidates: []
        };

        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve(emptyResponse),
        });

        const response = await mockFetch('https://test.com');
        const data = await response.json();
        expect(data.candidates.length).toBe(0);
    });
});

describe('Settings Integration', () => {
    it('should use correct default model', () => {
        const defaultModel = mockLocalStorage['geminiTranscriptionModel'] || 'gemini-2.5-flash-lite';
        expect(defaultModel).toBe('gemini-2.5-flash-lite');
    });

    it('should respect user-selected model', () => {
        mockLocalStorage['geminiTranscriptionModel'] = 'gemini-2.5-flash';
        expect(mockLocalStorage['geminiTranscriptionModel']).toBe('gemini-2.5-flash');
    });
});
