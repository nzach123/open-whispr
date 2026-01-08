/**
 * AgentManager Component
 * UI for managing AI agents with create, edit, delete, and toggle functionality.
 */

import { useState } from 'react';
import { useAgents } from '../hooks/useAgents';
import type { AIAgent } from '../types/agentTypes';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {
    Bot,
    Plus,
    Pencil,
    Trash2,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Sparkles,
} from 'lucide-react';
import { cn } from './lib/utils';

interface AgentEditorProps {
    agent: AIAgent | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (agent: AIAgent) => Promise<void>;
}

function AgentEditor({ agent, isOpen, onClose, onSave }: AgentEditorProps) {
    const [name, setName] = useState(agent?.name || '');
    const [triggerPhrases, setTriggerPhrases] = useState(agent?.triggerPhrases.join(', ') || '');
    const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt || '');
    const [outputMode, setOutputMode] = useState<'concise' | 'elaborate'>(agent?.outputMode || 'concise');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;

        setSaving(true);
        try {
            const updatedAgent: AIAgent = {
                ...(agent || {
                    id: `agent_${crypto.randomUUID()}`,
                    createdAt: new Date().toISOString(),
                    isBuiltIn: false,
                    enabled: true,
                }),
                name: name.trim(),
                triggerPhrases: triggerPhrases.split(',').map(p => p.trim()).filter(Boolean),
                systemPrompt,
                outputMode,
                updatedAt: new Date().toISOString(),
            } as AIAgent;

            await onSave(updatedAgent);
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        {agent ? 'Edit Agent' : 'Create New Agent'}
                    </DialogTitle>
                    <DialogDescription>
                        Configure your AI agent's personality and behavior.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="agent-name">Agent Name</Label>
                        <Input
                            id="agent-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Dev, Writer, Lawyer"
                            disabled={agent?.isBuiltIn}
                        />
                        {agent?.isBuiltIn && (
                            <p className="text-xs text-muted-foreground">Built-in agent names cannot be changed</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trigger-phrases">Trigger Phrases (comma-separated)</Label>
                        <Input
                            id="trigger-phrases"
                            value={triggerPhrases}
                            onChange={(e) => setTriggerPhrases(e.target.value)}
                            placeholder="e.g., Hey Dev, Developer, Code"
                        />
                        <p className="text-xs text-muted-foreground">
                            Say these phrases to activate this agent during dictation
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="output-mode">Output Mode</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={outputMode === 'concise' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setOutputMode('concise')}
                            >
                                Concise
                            </Button>
                            <Button
                                type="button"
                                variant={outputMode === 'elaborate' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setOutputMode('elaborate')}
                            >
                                Elaborate
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="system-prompt">System Prompt</Label>
                        <textarea
                            id="system-prompt"
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            placeholder="Describe how this agent should behave..."
                            className="w-full min-h-[200px] px-3 py-2 text-sm rounded-md border border-input bg-background resize-y"
                        />
                        <p className="text-xs text-muted-foreground">
                            Use <code className="bg-muted px-1 rounded">{"{{text}}"}</code> as placeholder for the dictated text
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={saving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving || !name.trim()}>
                        {saving ? 'Saving...' : agent ? 'Save Changes' : 'Create Agent'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface AgentCardProps {
    agent: AIAgent;
    onEdit: (agent: AIAgent) => void;
    onDelete: (agent: AIAgent) => void;
    onToggle: (agent: AIAgent) => void;
}

function AgentCard({ agent, onEdit, onDelete, onToggle }: AgentCardProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className={cn(
            "border rounded-lg p-4 transition-all",
            agent.enabled ? "bg-card" : "bg-muted/50 opacity-75"
        )}>
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        agent.isBuiltIn ? "bg-primary/10 text-primary" : "bg-secondary text-secondary-foreground"
                    )}>
                        <Bot className="w-5 h-5" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-medium">{agent.name}</h3>
                            {agent.isBuiltIn && (
                                <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    <Sparkles className="w-3 h-3" />
                                    Built-in
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {agent.triggerPhrases.map(p => `"${p}"`).join(', ')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggle(agent)}
                        className={cn(
                            "text-xs",
                            agent.enabled ? "text-green-600" : "text-muted-foreground"
                        )}
                    >
                        {agent.enabled ? 'Enabled' : 'Disabled'}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(agent)}>
                        <Pencil className="w-4 h-4" />
                    </Button>
                    {!agent.isBuiltIn && (
                        <Button variant="ghost" size="icon" onClick={() => onDelete(agent)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                </div>
            </div>

            {expanded && (
                <div className="mt-4 pt-4 border-t">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Output Mode:</span>
                            <span className="capitalize">{agent.outputMode}</span>
                        </div>
                        <div className="text-sm">
                            <span className="text-muted-foreground">System Prompt:</span>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                                {agent.systemPrompt}
                            </pre>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function AgentManager() {
    const { agents, loading, error, saveAgent, deleteAgent, resetToDefaults, loadAgents } = useAgents();
    const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<AIAgent | null>(null);

    const handleSave = async (agent: AIAgent) => {
        const result = await saveAgent(agent);
        if (!result.success) {
            console.error('Failed to save agent:', result.error);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirm) return;
        const result = await deleteAgent(deleteConfirm.id);
        if (!result.success) {
            console.error('Failed to delete agent:', result.error);
        }
        setDeleteConfirm(null);
    };

    const handleToggle = async (agent: AIAgent) => {
        await saveAgent({ ...agent, enabled: !agent.enabled });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                <p>Failed to load agents: {error}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={loadAgents}>
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Bot className="w-5 h-5" />
                        AI Agents
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Say trigger phrases to activate specialized AI assistants
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={resetToDefaults}>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset
                    </Button>
                    <Button size="sm" onClick={() => setIsCreating(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Agent
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {agents.map((agent) => (
                    <AgentCard
                        key={agent.id}
                        agent={agent}
                        onEdit={setEditingAgent}
                        onDelete={setDeleteConfirm}
                        onToggle={handleToggle}
                    />
                ))}
            </div>

            {agents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No agents configured</p>
                    <Button variant="link" onClick={() => setIsCreating(true)}>
                        Create your first agent
                    </Button>
                </div>
            )}

            {/* Edit Dialog */}
            <AgentEditor
                agent={editingAgent}
                isOpen={!!editingAgent}
                onClose={() => setEditingAgent(null)}
                onSave={handleSave}
            />

            {/* Create Dialog */}
            <AgentEditor
                agent={null}
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                onSave={handleSave}
            />

            {/* Delete Confirmation */}
            <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Agent</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{deleteConfirm?.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default AgentManager;
