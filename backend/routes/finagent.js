const router      = require('express').Router();
const axios       = require('axios');
const auth        = require('../middleware/auth');
const ChatSession = require('../models/ChatSession');

// ── Model Config ──────────────────────────────────────────────────────────────
const OPENROUTER_URL  = 'https://openrouter.ai/api/v1/chat/completions';
const API_KEY         = process.env.OPENROUTER_API_KEY;

// Thinking mode models (heavy reasoning)
const THINK_PRIMARY  = 'nvidia/nemotron-3-super-120b-a12b:free';
const THINK_FALLBACK = 'google/gemma-4-26b-a4b-it:free';

// Fast mode model (Gemini Flash via OpenRouter)
const FAST_MODEL     = 'google/gemini-3.1-flash-lite-preview';

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `**ROLE AND IDENTITY**
You are FinAgent, the core AI intelligence and autonomous financial co-pilot of 'Nexus', a next-generation Fintech Super-App. Your primary objective is to maximize the user's financial health by analyzing their aggregated open banking data, identifying wealth-building opportunities, and preventing passive wealth leaks.

**TONE AND STYLE**
- Be professional, highly objective, and trustworthy.
- Be encouraging but financially prudent and risk-aware.
- Explain complex financial concepts (e.g., Debt-to-Income ratios, SIPs, algorithmic trading metrics) in plain, accessible language suitable for a beginner.
- Always structure your responses using clean Markdown (bullet points, bold text for key metrics, short paragraphs) for optimal rendering on a React dashboard.

**CORE RESPONSIBILITIES & ECOSYSTEM INTEGRATION**
1. **Expense Optimization (Sunscribe):** When analyzing cash flow, actively identify redundant or "vampire" subscriptions and recommend immediate cancellation to free up liquidity.
2. **Wealth Generation (InvestPro & SIP Guide):** Detect idle cash in checking accounts and recommend deploying it into optimal Systematic Investment Plans (SIPs) or suggest algorithmic micro-investments based on current market data.
3. **Credit Management:** Before approving hypotheticals (e.g., "Can I afford this loan?"), logically calculate the Debt-to-Income (DTI) ratio.
4. **Advisory Routing (CA Contacts):** For any queries involving complex tax filing, legal compliance, or high-net-worth structuring, provide a brief mathematical summary and immediately route the user to book an expert via the "CA Contacts" module.

**STRICT CONSTRAINTS & GUARDRAILS (CRITICAL)**
- **ZERO HALLUCINATION:** Never invent, guess, or fabricate bank balances, transaction histories, market tickers, or interest rates. If you lack the required data to run a calculation, explicitly ask the user for it or state that you need the relevant API tool.
- **NO DIRECT EXECUTION:** You simulate and analyze. You do not autonomously execute trades or move money without prompting the user for final explicit confirmation.
- **NO BINDING ADVICE:** You are a highly advanced analytical engine, not a fiduciary or Chartered Accountant. Provide mathematical realities and projections, but state clearly that you do not offer legally binding tax or legal advice.
- **BOUNDARY ENFORCEMENT:** You exist exclusively within the Nexus financial ecosystem. Politely decline any user requests that fall outside the domains of personal finance, banking, economics, or app navigation.`;

// ── Helper: OpenRouter streaming call ────────────────────────────────────────
async function streamOpenRouter(model, messages, extraParams = {}) {
  return axios.post(OPENROUTER_URL, {
    model,
    messages,
    stream: true,
    max_tokens: 2048,
    temperature: 0.7,
    ...extraParams,
  }, {
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type':  'application/json',
      'HTTP-Referer':  'http://localhost:5173',
      'X-Title':       'Nexus FinAgent',
    },
    responseType: 'stream',
    timeout: 90000,
  });
}

// ── Helper: consume SSE stream → pipe content chunks to res ──────────────────
function pipeStream(axiosResponse, res, usedModel) {
  return new Promise((resolve, reject) => {
    let buffer = '';
    let accumulated = '';

    axiosResponse.data.on('data', (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const payload = trimmed.slice(6);
        if (payload === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }

        try {
          const parsed = JSON.parse(payload);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            accumulated += content;
            res.write(`data: ${JSON.stringify({ content, model: usedModel })}\n\n`);
          }
        } catch { /* skip malformed */ }
      }
    });

    axiosResponse.data.on('end', () => resolve(accumulated));
    axiosResponse.data.on('error', reject);
  });
}

// ── 1. CHAT (streaming SSE) ───────────────────────────────────────────────────
router.post('/chat', auth, async (req, res) => {
  const { message, mode = 'thinking', sessionId } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  // SSE headers
  res.setHeader('Content-Type',      'text/event-stream');
  res.setHeader('Cache-Control',     'no-cache');
  res.setHeader('Connection',        'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');

  const userMsg = message.trim();

  // ── Load or create chat session ─────────────────────────────────────────────
  let session;
  if (sessionId) {
    session = await ChatSession.findOne({ _id: sessionId, userId: req.userId });
  }
  if (!session) {
    session = new ChatSession({ userId: req.userId, mode });
  }

  // Add user message to session
  session.messages.push({ role: 'user', content: userMsg, mode });

  // Build context (last 40 messages for memory)
  const historySlice = session.messages
    .slice(-40)
    .map(m => ({ role: m.role, content: m.content }));

  const payload = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historySlice,
  ];

  let fullResponse = '';
  let usedModel    = '';

  try {
    if (mode === 'fast') {
      // ── FAST MODE: Gemini Flash ─────────────────────────────────────────────
      usedModel = FAST_MODEL;
      const axRes = await streamOpenRouter(FAST_MODEL, payload);
      fullResponse = await pipeStream(axRes, res, FAST_MODEL);

    } else {
      // ── THINKING MODE: Nemotron → Gemma fallback ────────────────────────────
      usedModel = THINK_PRIMARY;
      try {
        const axRes = await streamOpenRouter(THINK_PRIMARY, payload);
        fullResponse = await pipeStream(axRes, res, THINK_PRIMARY);
      } catch (primaryErr) {
        const status = primaryErr.response?.status;
        console.warn(`⚡ Nemotron failed (${status}), switching to Gemma…`);

        usedModel = THINK_FALLBACK;
        res.write(`data: ${JSON.stringify({ fallback: true })}\n\n`);

        const axRes = await streamOpenRouter(THINK_FALLBACK, payload);
        fullResponse = await pipeStream(axRes, res, THINK_FALLBACK);
      }
    }

    // Persist assistant reply
    if (fullResponse) {
      session.messages.push({ role: 'assistant', content: fullResponse, model: usedModel, mode });
    }

    // Auto-title from first user message
    if (session.messages.filter(m => m.role === 'user').length === 1) {
      session.generateTitle();
    }

    await session.save();

    // Send session id back so frontend can track it
    res.write(`data: ${JSON.stringify({ sessionId: session._id.toString() })}\n\n`);

  } catch (err) {
    console.error('FinAgent chat error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'AI is temporarily unavailable. Please try again.' })}\n\n`);
    res.write('data: [DONE]\n\n');
  }

  res.end();
});

// ── 2. List sessions (history sidebar) ────────────────────────────────────────
router.get('/sessions', auth, async (req, res) => {
  try {
    const sessions = await ChatSession.find({ userId: req.userId })
      .select('_id title mode createdAt updatedAt messages')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    res.json({
      sessions: sessions.map(s => ({
        id:           s._id,
        title:        s.title,
        mode:         s.mode,
        messageCount: s.messages.length,
        updatedAt:    s.updatedAt,
        createdAt:    s.createdAt,
        preview:      s.messages.filter(m => m.role === 'assistant').slice(-1)[0]?.content?.slice(0, 80) || '',
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load sessions' });
  }
});

// ── 3. Get single session (load history) ──────────────────────────────────────
router.get('/sessions/:id', auth, async (req, res) => {
  try {
    const session = await ChatSession.findOne({ _id: req.params.id, userId: req.userId }).lean();
    if (!session) return res.status(404).json({ error: 'Session not found' });

    res.json({
      id:       session._id,
      title:    session.title,
      mode:     session.mode,
      messages: session.messages.map(m => ({
        role:    m.role,
        content: m.content,
        model:   m.model,
        mode:    m.mode,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session' });
  }
});

// ── 4. Delete session ─────────────────────────────────────────────────────────
router.delete('/sessions/:id', auth, async (req, res) => {
  try {
    await ChatSession.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

// ── 5. Quick suggestions ──────────────────────────────────────────────────────
router.get('/suggestions', auth, (req, res) => {
  res.json({
    suggestions: [
      { icon: '📊', label: 'Analyze my spending',  prompt: 'Analyze my spending patterns from the last 30 days and identify areas where I can cut costs.' },
      { icon: '💰', label: 'Wealth strategy',       prompt: 'Create a personalized wealth-building strategy based on my current financial situation.' },
      { icon: '📈', label: 'SIP recommendations',  prompt: 'Recommend the best SIP plans for me based on my risk profile and monthly surplus.' },
      { icon: '🏦', label: 'Debt-to-Income ratio',  prompt: 'Calculate my Debt-to-Income ratio and tell me if I can afford a ₹50L home loan.' },
      { icon: '🔍', label: 'Subscription audit',   prompt: 'Audit all my recurring subscriptions and identify vampire charges I should cancel.' },
      { icon: '⚡', label: 'Market pulse',          prompt: 'Give me a quick market pulse — crypto, forex, and equity overview for today.' },
    ],
  });
});

module.exports = router;
