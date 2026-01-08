export interface ReasoningConfig {
  maxTokens?: number;
  temperature?: number;
  contextSize?: number;
  /** Agent-specific system prompt that overrides the default */
  agentSystemPrompt?: string;
  /** Agent output mode: concise or elaborate */
  outputMode?: 'concise' | 'elaborate';
}

export abstract class BaseReasoningService {
  protected isProcessing = false;

  /**
   * Get reasoning prompt
   * Priority: agentSystemPrompt > custom localStorage prompts > defaults
   */
  protected getReasoningPrompt(
    text: string,
    agentName: string | null,
    config: ReasoningConfig = {}
  ): string {
    // If agent-specific system prompt is provided, use it directly
    if (config.agentSystemPrompt) {
      let prompt = config.agentSystemPrompt
        .replace(/\{\{text\}\}/g, text)
        .replace(/\{\{agentName\}\}/g, agentName || '');

      // Add output mode instruction if specified
      if (config.outputMode === 'concise') {
        prompt += '\n\nBe concise and direct in your response.';
      } else if (config.outputMode === 'elaborate') {
        prompt += '\n\nProvide thorough, detailed explanations.';
      }

      return prompt;
    }

    // Default prompts
    const DEFAULT_AGENT_PROMPT = `You are {{agentName}}, a helpful AI assistant. Clean up the following dictated text by fixing grammar, punctuation, and formatting. Remove any reference to your name. Output ONLY the cleaned text without explanations or options:\n\n{{text}}`;
    const DEFAULT_REGULAR_PROMPT = `Clean up the following dictated text by fixing grammar, punctuation, and formatting. Output ONLY the cleaned text without any explanations, options, or commentary:\n\n{{text}}`;

    // Get custom prompts from localStorage if available
    let agentPrompt = DEFAULT_AGENT_PROMPT;
    let regularPrompt = DEFAULT_REGULAR_PROMPT;

    if (typeof window !== 'undefined' && window.localStorage) {
      const customPrompts = window.localStorage.getItem('customPrompts');
      if (customPrompts) {
        try {
          const parsed = JSON.parse(customPrompts);
          agentPrompt = parsed.agent || DEFAULT_AGENT_PROMPT;
          regularPrompt = parsed.regular || DEFAULT_REGULAR_PROMPT;
        } catch (error) {
          console.error('Failed to parse custom prompts:', error);
        }
      }
    }

    // Simple prompt construction
    if (agentName && text.toLowerCase().includes(agentName.toLowerCase())) {
      // Agent-based prompt - replace placeholders
      return agentPrompt
        .replace(/\{\{agentName\}\}/g, agentName)
        .replace(/\{\{text\}\}/g, text);
    }

    // Regular prompt - replace placeholders
    return regularPrompt.replace(/\{\{text\}\}/g, text);
  }

  /**
   * Calculate optimal max tokens based on input length
   */
  protected calculateMaxTokens(
    textLength: number,
    minTokens = 100,
    maxTokens = 2048,
    multiplier = 2
  ): number {
    return Math.max(minTokens, Math.min(textLength * multiplier, maxTokens));
  }

  /**
   * Check if service is available
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Process text with reasoning
   */
  abstract processText(
    text: string,
    modelId: string,
    agentName?: string | null,
    config?: ReasoningConfig
  ): Promise<string>;
}