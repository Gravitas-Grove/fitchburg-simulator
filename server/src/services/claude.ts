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

export interface ScenarioContext {
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
  scorecard?: {
    overallGrade: string;
    overallScore: number;
    fiscal: { grade: string; score: number; costToServe: number; infraCostPerUnit: number; taxRevenue: number; debtCapacity: number };
    environmental: { grade: string; score: number; wetlandAcres: number; floodplainAcres: number; bufferViolations: number; imperviousPct: number };
    social: { grade: string; score: number; totalUnits: number; affordableUnits: number; affordablePct: number; jobsHousingRatio: number };
    transportation: { grade: string; score: number; dailyVMT: number; transitPct: number; roadMiles: number };
  };
  allScenarios?: { id: string; name: string }[];
}

function buildContextBlock(ctx: ScenarioContext): string {
  const du = ctx.density === 'low' ? 3 : ctx.density === 'high' ? 7.5 : 5;

  let block = `=== SCENARIO DATA ===
Scenario: ${ctx.scenarioName}
Description: ${ctx.description}
Growth rate: ${ctx.growthRate} ac/yr | Density: ${du} DU/ac (${ctx.density})
Through 2030: ~${ctx.acres} acres | ~${ctx.units?.toLocaleString()} units | ~$${ctx.infraM}M infra
Ag impact: ${ctx.agLand === 0 ? 'none' : ctx.agLand?.toLocaleString() + ' acres'} (${ctx.agImpact})`;

  if (ctx.scorecard) {
    const sc = ctx.scorecard;
    block += `

SCORECARD (Overall: ${sc.overallGrade}, ${Math.round(sc.overallScore)}/100):
  Fiscal: ${sc.fiscal.grade} (${Math.round(sc.fiscal.score)}) — Cost-to-serve: ${sc.fiscal.costToServe.toFixed(2)}, Infra/unit: $${Math.round(sc.fiscal.infraCostPerUnit).toLocaleString()}
  Environmental: ${sc.environmental.grade} (${Math.round(sc.environmental.score)}) — Wetlands: ${sc.environmental.wetlandAcres}ac, Buffer violations: ${sc.environmental.bufferViolations}
  Social: ${sc.social.grade} (${Math.round(sc.social.score)}) — Units: ${sc.social.totalUnits}, Affordable: ${(sc.social.affordablePct * 100).toFixed(0)}%, Jobs-housing: ${sc.social.jobsHousingRatio.toFixed(2)}
  Transport: ${sc.transportation.grade} (${Math.round(sc.transportation.score)}) — Transit: ${(sc.transportation.transitPct * 100).toFixed(0)}%, VMT: ${Math.round(sc.transportation.dailyVMT).toLocaleString()}`;
  }

  if (ctx.allScenarios && ctx.allScenarios.length > 0) {
    block += `\n\nAll available scenarios: ${ctx.allScenarios.map((s) => s.name).join(', ')}`;
  }

  block += '\n=== END SCENARIO DATA ===\n\n';
  return block;
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
        content: buildContextBlock(scenarioContext) + m.content,
      };
    }
    return { role: m.role, content: m.content };
  });

  // Trim conversation history to avoid exceeding token limits
  // Keep system prompt + last 20 messages (summarize if needed)
  const maxMessages = 20;
  const trimmedMessages = processedMessages.length > maxMessages
    ? processedMessages.slice(-maxMessages)
    : processedMessages;

  // Ensure first message is from user (required by API)
  if (trimmedMessages.length > 0 && trimmedMessages[0].role === 'assistant') {
    trimmedMessages.shift();
  }

  const stream = anthropic.messages.stream({
    model: config.aiModel,
    max_tokens: config.maxTokens,
    system: [{
      type: 'text',
      text: SYSTEM_PROMPT,
      cache_control: { type: 'ephemeral' },
    }],
    messages: trimmedMessages,
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
