import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Send, Trash2, User, Loader2, AlertTriangle,
  Zap, Brain, Shield, Copy, Check, Plus, Clock, ChevronLeft,
  MessageSquare, Cpu, Gauge
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('nx_token'); }

function relativeTime(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="fa-code-block"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="fa-inline-code">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^### (.+)$/gm, '<h4 class="fa-h4">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="fa-h3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="fa-h2">$1</h2>')
    .replace(/^[-•] (.+)$/gm, '<li class="fa-li">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="fa-li-ordered">$1</li>')
    .replace(/^---$/gm, '<hr class="fa-hr"/>')
    .replace(/\n\n/g, '</p><p class="fa-p">')
    .replace(/\n/g, '<br/>');
  html = html.replace(/((<li class="fa-li">.*?<\/li>\s*)+)/g, '<ul class="fa-ul">$1</ul>');
  html = html.replace(/((<li class="fa-li-ordered">.*?<\/li>\s*)+)/g, '<ol class="fa-ol">$1</ol>');
  return `<p class="fa-p">${html}</p>`;
}

// ── Model label ───────────────────────────────────────────────────────────────
function modelLabel(model) {
  if (!model) return null;
  if (model.includes('gemini') || model.includes('flash')) return '⚡ Gemini Flash';
  if (model.includes('nvidia') || model.includes('nemotron')) return '🧠 Nemotron Ultra';
  if (model.includes('gemma')) return '🔄 Gemma Backup';
  return model.split('/').pop();
}

// ── Typing dots ───────────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="fa-typing"><span /><span /><span /></div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const [copied, setCopied] = useState(false);
  const isBot = msg.role === 'assistant';

  function handleCopy() {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div
      className={`fa-msg ${isBot ? 'fa-msg-bot' : 'fa-msg-user'}`}
      initial={{ opacity: 0, y: 14, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className={`fa-msg-avatar ${isBot ? 'fa-avatar-bot' : 'fa-avatar-user'}`}>
        {isBot ? <Brain size={15} /> : <User size={15} />}
      </div>

      <div className="fa-msg-body">
        {/* ONE header row — no duplication */}
        <div className="fa-msg-header">
          <span className="fa-msg-sender">{isBot ? 'FinAgent' : 'You'}</span>
          {isBot && msg.model && (
            <span className="fa-msg-model">{modelLabel(msg.model)}</span>
          )}
          {isBot && msg.mode && (
            <span className={`fa-mode-chip fa-mode-${msg.mode}`}>
              {msg.mode === 'fast' ? <Gauge size={9} /> : <Cpu size={9} />}
              {msg.mode}
            </span>
          )}
        </div>

        {/* Content */}
        {isBot ? (
          <div
            className="fa-msg-content fa-markdown"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
          />
        ) : (
          <div className="fa-msg-content">{msg.content}</div>
        )}

        {isBot && msg.content && (
          <div className="fa-msg-actions">
            <button className="fa-action-btn" onClick={handleCopy}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── History Sidebar ────────────────────────────────────────────────────────────
function HistorySidebar({ sessions, activeId, onSelect, onDelete, onNew, loading }) {
  return (
    <div className="fa-history-sidebar glass-card">
      <div className="fa-hist-header">
        <span className="fa-hist-title"><Clock size={14} /> History</span>
        <motion.button
          className="fa-hist-new"
          onClick={onNew}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="New conversation"
        >
          <Plus size={14} />
        </motion.button>
      </div>

      <div className="fa-hist-list">
        {loading ? (
          <div className="fa-hist-empty">
            <Loader2 size={16} className="spin" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="fa-hist-empty">
            <MessageSquare size={20} />
            <span>No conversations yet</span>
          </div>
        ) : (
          sessions.map(s => (
            <motion.div
              key={s.id}
              className={`fa-hist-item ${s.id === activeId ? 'active' : ''}`}
              onClick={() => onSelect(s)}
              whileHover={{ x: 3 }}
            >
              <div className="fa-hist-item-top">
                <span className={`fa-hist-mode ${s.mode}`}>
                  {s.mode === 'fast' ? <Gauge size={9} /> : <Cpu size={9} />}
                  {s.mode}
                </span>
                <span className="fa-hist-time">{relativeTime(s.updatedAt)}</span>
                <button
                  className="fa-hist-delete"
                  onClick={e => { e.stopPropagation(); onDelete(s.id); }}
                  title="Delete"
                >×</button>
              </div>
              <div className="fa-hist-item-title">{s.title}</div>
              {s.preview && (
                <div className="fa-hist-preview">{s.preview}…</div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Mode Toggle ───────────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange, disabled }) {
  return (
    <div className="fa-mode-toggle">
      <button
        className={`fa-mode-btn ${mode === 'fast' ? 'active fast' : ''}`}
        onClick={() => onChange('fast')}
        disabled={disabled}
        title="Fast — Gemini Flash (instant responses)"
      >
        <Gauge size={13} />
        Fast
      </button>
      <button
        className={`fa-mode-btn ${mode === 'thinking' ? 'active thinking' : ''}`}
        onClick={() => onChange('thinking')}
        disabled={disabled}
        title="Thinking — Nemotron Ultra (deep reasoning)"
      >
        <Cpu size={13} />
        Thinking
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────
export default function FinAgentPage() {
  const [mode, setMode]               = useState('thinking');
  const [messages, setMessages]       = useState([]);
  const [input, setInput]             = useState('');
  const [isStreaming, setIsStreaming]  = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError]             = useState('');
  const [sessions, setSessions]       = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(true);

  const scrollRef = useRef(null);
  const inputRef  = useRef(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Load suggestions + sessions
  useEffect(() => {
    loadSuggestions();
    loadSessions();
  }, []);

  async function loadSuggestions() {
    try {
      const r = await fetch(`${API_BASE}/finagent/suggestions`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      setSuggestions(d.suggestions || []);
    } catch { /* ignore */ }
  }

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const r = await fetch(`${API_BASE}/finagent/sessions`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      setSessions(d.sessions || []);
    } catch { /* ignore */ } finally {
      setSessionsLoading(false);
    }
  }

  async function loadSession(session) {
    try {
      const r = await fetch(`${API_BASE}/finagent/sessions/${session.id}`, { headers: { Authorization: `Bearer ${getToken()}` } });
      const d = await r.json();
      setMessages(d.messages || []);
      setMode(d.mode || 'thinking');
      setActiveSessionId(session.id);
      setError('');
    } catch {
      setError('Failed to load conversation.');
    }
  }

  async function deleteSession(id) {
    try {
      await fetch(`${API_BASE}/finagent/sessions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) startNewChat();
    } catch { /* ignore */ }
  }

  function startNewChat() {
    setMessages([]);
    setActiveSessionId(null);
    setError('');
    inputRef.current?.focus();
  }

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;

    setInput('');
    setError('');
    setMessages(prev => [
      ...prev,
      { role: 'user', content: msg, mode },
      { role: 'assistant', content: '', model: '', mode, streaming: true },
    ]);
    setIsStreaming(true);

    try {
      const response = await fetch(`${API_BASE}/finagent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ message: msg, mode, sessionId: activeSessionId }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let currentModel = '';
      let newSessionId = activeSessionId;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data: ')) continue;
          const raw = t.slice(6);
          if (raw === '[DONE]') continue;

          try {
            const p = JSON.parse(raw);

            if (p.error) { setError(p.error); break; }
            if (p.fallback) continue;
            if (p.sessionId) { newSessionId = p.sessionId; setActiveSessionId(p.sessionId); }
            if (p.model) currentModel = p.model;
            if (p.content) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant') {
                  updated[updated.length - 1] = {
                    ...last,
                    content: last.content + p.content,
                    model: currentModel,
                  };
                }
                return updated;
              });
            }
          } catch { /* ignore */ }
        }
      }

      // Finalise streaming flag
      setMessages(prev => {
        const u = [...prev];
        const last = u[u.length - 1];
        if (last?.role === 'assistant') u[u.length - 1] = { ...last, streaming: false };
        return u;
      });

      // Refresh session list
      loadSessions();

    } catch (err) {
      if (err.name !== 'AbortError') {
        setError('Connection lost. Please try again.');
        setMessages(prev => prev.filter(m => !m.streaming || m.content));
      }
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, isStreaming, mode, activeSessionId]);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="fa-root">

      {/* ── History Sidebar ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: -20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 260 }}
            exit={{ opacity: 0, x: -20, width: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            style={{ flexShrink: 0, overflow: 'hidden' }}
          >
            <HistorySidebar
              sessions={sessions}
              activeId={activeSessionId}
              onSelect={loadSession}
              onDelete={deleteSession}
              onNew={startNewChat}
              loading={sessionsLoading}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Chat Panel ──────────────────────────────────────────────────── */}
      <div className="fa-main">

        {/* Header */}
        <motion.div
          className="fa-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="fa-header-left">
            <button
              className={`fa-hist-toggle ${showHistory ? 'active' : ''}`}
              onClick={() => setShowHistory(v => !v)}
              title="Toggle history"
            >
              <ChevronLeft size={16} style={{ transform: showHistory ? 'rotate(0deg)' : 'rotate(180deg)', transition: '0.3s' }} />
            </button>

            <div className="fa-header-icon">
              <Brain size={18} />
              <div className="fa-header-pulse" />
            </div>

            <div>
              <h1 className="fa-title">
                FinAgent <span className="fa-title-accent">Cortex</span>
              </h1>
              <p className="fa-subtitle">
                {mode === 'fast'
                  ? '⚡ Fast Mode — Gemini Flash'
                  : '🧠 Thinking Mode — Nemotron Ultra'}
              </p>
            </div>
          </div>

          <div className="fa-header-right">
            <ModeToggle mode={mode} onChange={setMode} disabled={isStreaming} />
            <div className="fa-status-chip">
              <span className="fa-status-dot" />
              Online
            </div>
            {messages.length > 0 && (
              <motion.button
                className="fa-clear-btn"
                onClick={startNewChat}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="New chat"
              >
                <Plus size={14} />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Chat area */}
        <div className="fa-chat-area" ref={scrollRef}>
          <AnimatePresence mode="wait">
            {isEmpty ? (
              <motion.div
                className="fa-welcome"
                key="welcome"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.35 }}
              >
                <div className="fa-welcome-glow" />
                <div className="fa-welcome-icon"><Sparkles size={30} /></div>

                <h2 className="fa-welcome-title">
                  Welcome to <span className="gradient-text">FinAgent Cortex</span>
                </h2>
                <p className="fa-welcome-sub">
                  Your autonomous AI financial co-pilot. Choose <strong>Fast</strong> for instant answers
                  or <strong>Thinking</strong> for deep financial reasoning.
                </p>

                {/* Mode info cards */}
                <div className="fa-mode-info-row">
                  <div className={`fa-mode-info-card ${mode === 'fast' ? 'selected' : ''}`} onClick={() => setMode('fast')}>
                    <div className="fa-mode-info-icon fast"><Gauge size={18} /></div>
                    <div className="fa-mode-info-name">Fast</div>
                    <div className="fa-mode-info-desc">Gemini Flash • Instant responses</div>
                  </div>
                  <div className={`fa-mode-info-card ${mode === 'thinking' ? 'selected' : ''}`} onClick={() => setMode('thinking')}>
                    <div className="fa-mode-info-icon thinking"><Cpu size={18} /></div>
                    <div className="fa-mode-info-name">Thinking</div>
                    <div className="fa-mode-info-desc">Nemotron Ultra • Deep reasoning</div>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="fa-trust-row">
                  {[
                    { icon: <Shield size={13} />, label: 'Zero Hallucination' },
                    { icon: <Zap size={13} />, label: 'Real-Time Analysis' },
                    { icon: <Brain size={13} />, label: 'Neural Reasoning' },
                  ].map(b => (
                    <div className="fa-trust-badge" key={b.label}>{b.icon}<span>{b.label}</span></div>
                  ))}
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="fa-suggestions">
                    {suggestions.map((s, i) => (
                      <motion.button
                        key={i}
                        className="fa-suggestion glass-card"
                        onClick={() => sendMessage(s.prompt)}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.08 + i * 0.05 }}
                      >
                        <span className="fa-sug-icon">{s.icon}</span>
                        <span className="fa-sug-label">{s.label}</span>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div className="fa-messages" key="msgs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {messages.map((msg, i) =>
                  /* Skip empty streaming placeholder — TypingDots handles it */
                  msg.streaming && !msg.content ? null : (
                    <MessageBubble key={i} msg={msg} />
                  )
                )}

                {/* Typing indicator — only when last message is being streamed with no content yet */}
                {isStreaming && messages[messages.length - 1]?.content === '' && (
                  <motion.div className="fa-msg fa-msg-bot" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="fa-msg-avatar fa-avatar-bot"><Brain size={15} /></div>
                    <div className="fa-msg-body">
                      <div className="fa-msg-header">
                        <span className="fa-msg-sender">FinAgent</span>
                        <span className={`fa-mode-chip fa-mode-${mode}`}>
                          {mode === 'fast' ? <Gauge size={9} /> : <Cpu size={9} />}
                          {mode}
                        </span>
                      </div>
                      <TypingDots />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div className="fa-error" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}>
              <AlertTriangle size={13} />
              {error}
              <button onClick={() => setError('')} className="fa-error-close">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <motion.div
          className="fa-input-bar glass-card"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <div className="fa-input-glow" />
          <textarea
            ref={inputRef}
            className="fa-input"
            placeholder={mode === 'fast' ? 'Ask anything — instant answer...' : 'Ask anything — deep reasoning mode...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isStreaming}
          />
          <motion.button
            className={`fa-send-btn ${input.trim() ? 'active' : ''}`}
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
          >
            {isStreaming ? <Loader2 size={17} className="spin" /> : <Send size={17} />}
          </motion.button>
        </motion.div>

        {/* Footer */}
        <div className="fa-footer">
          <Shield size={10} />
          FinAgent does not offer legally binding financial advice. Always consult a qualified CA.
        </div>
      </div>
    </div>
  );
}
