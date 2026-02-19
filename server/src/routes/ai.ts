import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb } from '../db/index.js';
import { chatSessions, chatMessages } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { streamChatResponse } from '../services/claude.js';
import { detectIntent } from '../services/promptService.js';
import { config } from '../config.js';

export const aiRouter = Router();

// POST /api/ai/chat — SSE streaming response
aiRouter.post('/chat', async (req, res) => {
  const { sessionId, message, scenarioContext } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  if (message.length > 5000) {
    return res.status(400).json({ error: 'message too long (max 5000 characters)' });
  }

  // Set SSE headers early
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!config.anthropicApiKey) {
    res.write(`data: ${JSON.stringify({ delta: 'AI service not configured. Set ANTHROPIC_API_KEY in server/.env to enable AI analysis.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const db = getDb();
    const now = new Date().toISOString();

    // Detect intent for logging
    const intent = detectIntent(message);

    // Get or create session
    let sid = sessionId;
    if (!sid) {
      sid = uuid();
      db.insert(chatSessions).values({
        id: sid,
        scenarioId: scenarioContext?.scenarioId || null,
        growthRate: scenarioContext?.growthRate || 75,
        density: scenarioContext?.density || 'med',
        title: scenarioContext?.scenarioName
          ? `${scenarioContext.scenarioName} Analysis`
          : 'New Chat',
        createdAt: now,
        updatedAt: now,
      }).run();

      // Send session ID as first event
      res.write(`data: ${JSON.stringify({ sessionId: sid })}\n\n`);
    } else {
      db.update(chatSessions)
        .set({ updatedAt: now })
        .where(eq(chatSessions.id, sid))
        .run();
    }

    // Save user message with intent metadata
    db.insert(chatMessages).values({
      id: uuid(),
      sessionId: sid,
      role: 'user',
      content: message,
      metadata: { ...((scenarioContext || {}) as Record<string, unknown>), intent },
      createdAt: now,
    }).run();

    // Load full conversation history
    const history = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sid))
      .orderBy(chatMessages.createdAt)
      .all();

    const apiMessages = history
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // Stream response and collect full text
    const fullResponse = await streamChatResponse(res, apiMessages, scenarioContext || null);

    // Save assistant response
    db.insert(chatMessages).values({
      id: uuid(),
      sessionId: sid,
      role: 'assistant',
      content: fullResponse,
      createdAt: new Date().toISOString(),
    }).run();

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[ai] Stream error:', err.message);
    res.write(`data: ${JSON.stringify({ delta: `\n\nError: ${err.message}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// POST /api/ai/analyze — deep single-scenario analysis
aiRouter.post('/analyze', async (req, res) => {
  const { message, scenarioContext } = req.body;

  if (!scenarioContext?.scenarioName) {
    return res.status(400).json({ error: 'scenarioContext with scenarioName is required' });
  }

  // Rewrite as analysis request and stream
  const analysisMessage = message || `Provide a detailed analysis of the ${scenarioContext.scenarioName} scenario.`;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!config.anthropicApiKey) {
    res.write(`data: ${JSON.stringify({ delta: 'AI service not configured.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const fullResponse = await streamChatResponse(
      res,
      [{ role: 'user', content: analysisMessage }],
      scenarioContext
    );

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[ai] Analysis error:', err.message);
    res.write(`data: ${JSON.stringify({ delta: `\n\nError: ${err.message}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// POST /api/ai/compare — multi-scenario comparison
aiRouter.post('/compare', async (req, res) => {
  const { message, scenarioContext } = req.body;

  const compareMessage = message || 'Compare all growth scenarios and identify the optimal tradeoffs.';

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  if (!config.anthropicApiKey) {
    res.write(`data: ${JSON.stringify({ delta: 'AI service not configured.' })}\n\n`);
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const fullResponse = await streamChatResponse(
      res,
      [{ role: 'user', content: compareMessage }],
      scenarioContext || null
    );

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('[ai] Compare error:', err.message);
    res.write(`data: ${JSON.stringify({ delta: `\n\nError: ${err.message}` })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// GET /api/ai/sessions — list sessions
aiRouter.get('/sessions', (_req, res) => {
  try {
    const db = getDb();
    const sessions = db
      .select()
      .from(chatSessions)
      .orderBy(desc(chatSessions.updatedAt))
      .all();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/ai/sessions/:id — get session with messages
aiRouter.get('/sessions/:id', (req, res) => {
  try {
    const db = getDb();
    const session = db
      .select()
      .from(chatSessions)
      .where(eq(chatSessions.id, req.params.id))
      .get();

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const messages = db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, req.params.id))
      .orderBy(chatMessages.createdAt)
      .all();

    res.json({ ...session, messages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// DELETE /api/ai/sessions/:id
aiRouter.delete('/sessions/:id', (req, res) => {
  try {
    const db = getDb();
    db.delete(chatMessages).where(eq(chatMessages.sessionId, req.params.id)).run();
    db.delete(chatSessions).where(eq(chatSessions.id, req.params.id)).run();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});
