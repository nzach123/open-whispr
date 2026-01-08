/**
 * useAgents Hook
 * React hook for managing AI agents with IPC persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import type { AIAgent } from '../types/agentTypes';
import { findMatchingAgent, createAgent } from '../types/agentTypes';

export interface UseAgentsResult {
    agents: AIAgent[];
    loading: boolean;
    error: string | null;

    // CRUD operations
    loadAgents: () => Promise<void>;
    saveAgent: (agent: AIAgent) => Promise<{ success: boolean; error?: string }>;
    deleteAgent: (id: string) => Promise<{ success: boolean; error?: string }>;
    resetToDefaults: () => Promise<void>;

    // Helper functions
    findAgentByTrigger: (text: string) => AIAgent | null;
    getEnabledAgents: () => AIAgent[];
    createNewAgent: (partial?: Partial<AIAgent>) => AIAgent;
}

export function useAgents(): UseAgentsResult {
    const [agents, setAgents] = useState<AIAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadAgents = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await window.electronAPI.getAgents();

            if (result.success) {
                setAgents(result.agents);
            } else {
                setError(result.error || 'Failed to load agents');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load agents');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveAgent = useCallback(async (agent: AIAgent): Promise<{ success: boolean; error?: string }> => {
        try {
            const result = await window.electronAPI.saveAgent(agent);

            if (result.success) {
                // Refresh agents list
                await loadAgents();
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to save agent' };
        }
    }, [loadAgents]);

    const deleteAgent = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const result = await window.electronAPI.deleteAgent(id);

            if (result.success) {
                // Refresh agents list
                await loadAgents();
                return { success: true };
            } else {
                return { success: false, error: result.error };
            }
        } catch (err) {
            return { success: false, error: err instanceof Error ? err.message : 'Failed to delete agent' };
        }
    }, [loadAgents]);

    const resetToDefaults = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await window.electronAPI.resetAgentsToDefaults();

            if (result.success && result.agents) {
                setAgents(result.agents);
            } else {
                setError(result.error || 'Failed to reset agents');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to reset agents');
        } finally {
            setLoading(false);
        }
    }, []);

    const findAgentByTrigger = useCallback((text: string): AIAgent | null => {
        const match = findMatchingAgent(text, agents);
        return match?.agent || null;
    }, [agents]);

    const getEnabledAgents = useCallback((): AIAgent[] => {
        return agents.filter(agent => agent.enabled);
    }, [agents]);

    const createNewAgent = useCallback((partial?: Partial<AIAgent>): AIAgent => {
        return createAgent(partial);
    }, []);

    // Load agents on mount
    useEffect(() => {
        loadAgents();
    }, [loadAgents]);

    return {
        agents,
        loading,
        error,
        loadAgents,
        saveAgent,
        deleteAgent,
        resetToDefaults,
        findAgentByTrigger,
        getEnabledAgents,
        createNewAgent,
    };
}

export default useAgents;
