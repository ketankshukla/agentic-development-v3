/**
 * lib/agent.js
 * Claude API wrapper with dry-run support
 */

import Anthropic from "@anthropic-ai/sdk";
import { models } from "../config.js";

export class Agent {
  constructor(apiKey, options = {}) {
    this.dryRun = options.dryRun || false;
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;

    if (!this.dryRun) {
      if (!apiKey) {
        throw new Error("ANTHROPIC_API_KEY is required");
      }
      this.client = new Anthropic({ apiKey });
    } else {
      this.client = null;
    }
  }

  async execute(task) {
    const {
      prompt,
      system = "",
      model = models.primary,
      maxTokens = 4096,
      temperature = 1,
      context = [],
    } = task;

    if (this.dryRun) {
      return {
        success: true,
        content: "<DRY_RUN>Agent call bypassed. Dry-run content is generated in brain.js.</DRY_RUN>",
        usage: { input_tokens: 0, output_tokens: 0 },
        stopReason: "dry_run",
      };
    }

    const messages = [...context, { role: "user", content: prompt }];

    try {
      const response = await this.client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages,
      });

      this.totalInputTokens += response.usage.input_tokens;
      this.totalOutputTokens += response.usage.output_tokens;

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

  async executeWithRetry(task, maxRetries = 3) {
    let lastError = null;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const result = await this.execute(task);
      if (result.success) return result;
      lastError = result.error;
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return { success: false, error: `Failed after ${maxRetries} attempts: ${lastError}`, content: null };
  }

  getUsage() {
    return {
      inputTokens: this.totalInputTokens,
      outputTokens: this.totalOutputTokens,
      totalTokens: this.totalInputTokens + this.totalOutputTokens,
    };
  }

  estimateCost() {
    const inputCostPerMillion = 3.0;
    const outputCostPerMillion = 15.0;
    const inputCost = (this.totalInputTokens / 1_000_000) * inputCostPerMillion;
    const outputCost = (this.totalOutputTokens / 1_000_000) * outputCostPerMillion;
    return {
      inputCost: inputCost.toFixed(4),
      outputCost: outputCost.toFixed(4),
      totalCost: (inputCost + outputCost).toFixed(4),
    };
  }

  resetUsage() {
    this.totalInputTokens = 0;
    this.totalOutputTokens = 0;
  }
}

export function createAgent(apiKey, options = {}) {
  return new Agent(apiKey, options);
}

export default { Agent, createAgent };
