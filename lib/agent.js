/**
 * lib/agent.js
 * Claude API wrapper with OpenClaw-style task execution
 * 
 * OpenClaw Pattern: The agent is a thin wrapper around the model.
 * It handles API calls, retries, and token management — nothing else.
 * All intelligence lives in prompts and the orchestrator (brain.js).
 */

import Anthropic from "@anthropic-ai/sdk";
import { models } from "../config.js";

// ============================================================================
// AGENT CLASS
// ============================================================================

export class Agent {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required");
    }
    this.client = new Anthropic({ apiKey });
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
  }

  /**
   * Execute a task with the given prompt and context
   * 
   * OpenClaw Pattern: Tasks are atomic. One prompt, one response.
   * The orchestrator handles sequencing and state management.
   */
  async execute(task) {
    const {
      prompt,
      system = "",
      model = models.primary,
      maxTokens = 4096,
      temperature = 1,
      context = [],
    } = task;

    const messages = [
      ...context,
      { role: "user", content: prompt },
    ];

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages,
      });

      // Track token usage
      this.totalInputTokens += response.usage.input_tokens;
      this.totalOutputTokens += response.usage.output_tokens;

      // Extract text content
      const content = response.content
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("\n");

      return {
        success: true,
        content,
        usage: response.usage,
        stopReason: response.stop_reason,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        content: null,
      };
    }
  }

  /**
   * Execute with automatic retry on failure
   */
  async executeWithRetry(task, maxRetries = 3) {
    let lastError = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.execute(task);
      
      if (result.success) {
        return result;
      }
      
      lastError = result.error;
      
      // Don't retry on certain errors
      if (result.error.includes("invalid_api_key") || 
          result.error.includes("authentication")) {
        break;
      }
      
      // Exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      error: `Failed after ${maxRetries} attempts: ${lastError}`,
      content: null,
    };
  }

  /**
   * Execute a multi-turn conversation
   * 
   * OpenClaw Pattern: For complex tasks that require back-and-forth,
   * the orchestrator builds up the context array.
   */
  async executeConversation(turns) {
    const results = [];
    const context = [];
    
    for (const turn of turns) {
      const result = await this.execute({
        ...turn,
        context,
      });
      
      results.push(result);
      
      if (!result.success) {
        break;
      }
      
      // Add to context for next turn
      context.push({ role: "user", content: turn.prompt });
      context.push({ role: "assistant", content: result.content });
    }
    
    return results;
  }

  /**
   * Get total token usage for this session
   */
  getUsage() {
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
    };
  }

  /**
   * Estimate cost based on current Anthropic pricing
   * Sonnet: $3/MTok input, $15/MTok output
   */
  estimateCost() {
    const inputCost = (this.totalInputTokens / 1_000_000) * 3;
    const outputCost = (this.totalOutputTokens / 1_000_000) * 15;
    return {
      inputCost: inputCost.toFixed(4),
      outputCost: outputCost.toFixed(4),
      totalCost: (inputCost + outputCost).toFixed(4),
    };
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

/**
 * Create an agent instance
 */
export function createAgent(apiKey) {
  return new Agent(apiKey || process.env.ANTHROPIC_API_KEY);
}

export default { Agent, createAgent };
