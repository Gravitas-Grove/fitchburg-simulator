import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import { SYSTEM_PROMPT } from '../prompts/systemPrompt.js';
import type { Response } from 'express';

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!client) {
    if (!config.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    client = new Anthropic({ apiKey: config.anthropicApiKey });
  }
  return client;
}

interface MessageEntry {
  role: 'user' | 'assistant';
  content: string;
}

interface ScenarioContext {
  scenarioId?: string;
  scenarioName: string;
  description: string;
  growthRate: number;
  density: string;
  acres: number;
  units: number;
  infraM: number;
  agLand: number;
  agImpact: string;
}

function buildContextPrefix(ctx: ScenarioContext): string {
  const du = ctx.density === 'low' ? 3 : ctx.density === 'high' ? 7.5 : 5;
  return `[Current scenario: ${ctx.scenarioName} — ${ctx.description}. Growth: ${ctx.growthRate} ac/yr, ${du} du/ac. Through 2030: ~${ctx.acres} acres, ~${ctx.units?.toLocaleString()} units, ~$${ctx.infraM}M infra, ${ctx.agLand === 0 ? 'no' : ctx.agLand?.toLocaleString()} prime ag acres (${ctx.agImpact}).]\n\n`;
}

/**
 * Stream a chat response via SSE. Returns the full accumulated text for persistence.
 */
export async function streamChatResponse(
  res: Response,
  messages: MessageEntry[],
  scenarioContext: ScenarioContext | null
): Promise<string> {
  const anthropic = getClient();

  // Prepend scenario context to the latest user message
  const processedMessages: { role: 'user' | 'assistant'; content: string }[] = messages.map((m, i) => {
    if (i === messages.length - 1 && m.role === 'user' && scenarioContext) {
      return {
        role: m.role,
        content: buildContextPrefix(scenarioContext) + m.content,
      };
    }
    return { role: m.role, content: m.content };
  });

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: SYSTEM_PROMPT,
    messages: processedMessages,
  });

  let fullResponse = '';

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      fullResponse += event.delta.text;
      res.write(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`);
    }
  }

  return fullResponse;
}
