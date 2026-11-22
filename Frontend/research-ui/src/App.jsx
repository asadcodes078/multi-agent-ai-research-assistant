// App.jsx  -> replace src/App.jsx in a Vite React project
// Needs:  npm install react-markdown
// Backend: api.py running on http://localhost:8000

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

const STEPS = [
  { id: "search", name: "Search agent", hint: "Finds recent, reliable sources", tab: "Sources" },
  { id: "reader", name: "Reader agent", hint: "Scrapes the best URL for detail", tab: "Scraped page" },
  { id: "writer", name: "Writer", hint: "Drafts the report", tab: "Report" },
  { id: "critic", name: "Critic", hint: "Reviews the draft", tab: "Feedback" },
];

const EXAMPLES = [
  "Solid-state batteries in 2026",
  "How RAG pipelines are evaluated",
  "State of open-weight LLMs",
];

const initialStatus = () => Object.fromEntries(STEPS.map((s) => [s.id, "idle"]));

export default function App() {
  const [topic, setTopic] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [results, setResults] = useState({});
  const [activeTab, setActiveTab] = useState("writer");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const sourceRef = useRef(null);

  const finished = STEPS.every((s) => status[s.id] === "done");
  const started = running || finished || Object.values(status).some((v) => v !== "idle");

  // elapsed-time counter while running
  useEffect(() => {
    if (!running) return;
    const t0 = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [running]);

  // close the stream if the component unmounts
  useEffect(() => () => sourceRef.current?.close(), []);

  function start(e) {
    e?.preventDefault();
    const clean = topic.trim();
    if (!clean || running) return;

    setStatus(initialStatus());
    setResults({});
    setError("");
    setElapsed(0);
    setActiveTab("search");
    setRunning(true);

    const es = new EventSource(`${API_BASE}/api/research?topic=${encodeURIComponent(clean)}`);
    sourceRef.current = es;

    es.onmessage = (ev) => {
      const data = JSON.parse(ev.data);

      if (data.step === "complete") {
        es.close();
        setRunning(false);
        setActiveTab("writer");
        return;
      }
      if (data.step === "error") {
        es.close();
        setRunning(false);
        setError(data.content || "The pipeline failed.");
        setStatus((prev) => {
          const next = { ...prev };
          for (const s of STEPS) if (next[s.id] === "running") next[s.id] = "error";
          return next;
        });
        return;
      }

      setStatus((prev) => ({ ...prev, [data.step]: data.status }));
      if (data.status === "running") setActiveTab(data.step);
      if (data.status === "done") setResults((prev) => ({ ...prev, [data.step]: data.content }));
    };

    es.onerror = () => {
      es.close();
      setRunning(false);
      setError(`Can't reach the API at ${API_BASE}. Start it with: uvicorn api:app --reload --port 8000`);
      setStatus((prev) => {
        const next = { ...prev };
        for (const s of STEPS) if (next[s.id] === "running") next[s.id] = "error";
        return next;
      });
    };
  }

  function stop() {
    sourceRef.current?.close();
    setRunning(false);
    setStatus((prev) => {
      const next = { ...prev };
      for (const s of STEPS) if (next[s.id] === "running") next[s.id] = "idle";
      return next;
    });
  }

  async function copyReport() {
    if (!results.writer) return;
    try {
      await navigator.clipboard.writeText(results.writer);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked - ignore */
    }
  }

  function downloadReport() {
    if (!results.writer) return;
    const blob = new Blob([results.writer], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic.trim().replace(/\s+/g, "-").toLowerCase() || "report"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const activeStep = STEPS.find((s) => s.id === activeTab);
  const activeContent = results[activeTab];

  return (
    <div className="app">
      <style>{css}</style>

      <header className="top">
        <h1>Research desk</h1>
        <p>Four agents search, read, write and review a report on any topic.</p>
      </header>

      <form className="ask" onSubmit={start}>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What do you want researched?"
          aria-label="Research topic"
          disabled={running}
        />
        {running ? (
          <button type="button" className="btn ghost" onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="submit" className="btn" disabled={!topic.trim()}>
            Run research
          </button>
        )}
      </form>

      {!started && (
        <div className="examples">
          <span>Try:</span>
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" className="chip" onClick={() => setTopic(ex)}>
              {ex}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          <strong>Something went wrong.</strong> {error}
        </div>
      )}

      {started && (
        <main className="grid">
          <aside className="rail" aria-label="Pipeline progress">
            <ol>
              {STEPS.map((s) => (
                <li key={s.id} className={`step ${status[s.id]}`}>
                  <span className="dot" aria-hidden="true">
                    {status[s.id] === "done" ? "✓" : status[s.id] === "error" ? "!" : ""}
                  </span>
                  <div>
                    <div className="step-name">{s.name}</div>
                    <div className="step-hint">
                      {status[s.id] === "running"
                        ? "Working…"
                        : status[s.id] === "done"
                        ? "Done"
                        : status[s.id] === "error"
                        ? "Failed"
                        : s.hint}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            <div className="clock">
              {running ? `Running for ${elapsed}s` : finished ? `Finished in ${elapsed}s` : ""}
            </div>
          </aside>

          <section className="panel">
            <div className="tabs" role="tablist">
              {STEPS.map((s) => (
                <button
                  key={s.id}
                  role="tab"
                  aria-selected={activeTab === s.id}
                  className={`tab ${activeTab === s.id ? "on" : ""}`}
                  onClick={() => setActiveTab(s.id)}
                >
                  {s.tab}
                  {status[s.id] === "running" && <span className="pulse" />}
                </button>
              ))}
            </div>

            <div className="body">
              {activeContent ? (
                <>
                  {activeTab === "writer" && (
                    <div className="actions">
                      <button className="btn small ghost" onClick={copyReport}>
                        {copied ? "Copied" : "Copy"}
                      </button>
                      <button className="btn small ghost" onClick={downloadReport}>
                        Download .md
                      </button>
                    </div>
                  )}
                  <article className="md">
                    <ReactMarkdown>{typeof activeContent === "string"
      ? activeContent
      : JSON.stringify(activeContent, null, 2)}</ReactMarkdown>
                  </article>
                </>
              ) : status[activeTab] === "running" ? (
                <div className="waiting">
                  <div className="bar" />
                  <p>{activeStep.name} is working. This can take a minute.</p>
                </div>
              ) : (
                <p className="empty">Output from the {activeStep.name.toLowerCase()} will show up here.</p>
              )}
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400&display=swap');

:root {
  --bg: #eef1ee;
  --surface: #ffffff;
  --ink: #17262b;
  --muted: #5d6b70;
  --line: #d3dad6;
  --accent: #2b3fd6;
  --accent-ink: #ffffff;
  --run: #b86e00;
  --ok: #2c7a58;
  --bad: #b3261e;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #12191c;
    --surface: #1a2428;
    --ink: #e6ecea;
    --muted: #93a2a7;
    --line: #2b383d;
    --accent: #7d8cff;
    --accent-ink: #0f1530;
    --run: #e0a040;
    --ok: #5cc596;
    --bad: #ff8a80;
  }
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); }

.app {
  min-height: 100vh;
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 20px 64px;
  color: var(--ink);
  font-family: 'IBM Plex Sans', system-ui, sans-serif;
  font-size: 15px;
  line-height: 1.5;
}

.top h1 {
  margin: 0 0 6px;
  font-family: 'Newsreader', Georgia, serif;
  font-weight: 600;
  font-size: 40px;
  letter-spacing: -0.02em;
}
.top p { margin: 0 0 28px; color: var(--muted); max-width: 52ch; }

.ask { display: flex; gap: 10px; }
.ask input {
  flex: 1;
  min-width: 0;
  padding: 14px 16px;
  font: inherit;
  font-size: 16px;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.ask input:focus-visible, .btn:focus-visible, .tab:focus-visible, .chip:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.ask input:disabled { opacity: 0.7; }

.btn {
  padding: 0 22px;
  font: inherit;
  font-weight: 600;
  color: var(--accent-ink);
  background: var(--accent);
  border: 1px solid var(--accent);
  border-radius: 8px;
  cursor: pointer;
}
.btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn.ghost { color: var(--ink); background: transparent; border-color: var(--line); }
.btn.small { padding: 6px 12px; font-size: 13px; font-weight: 500; }

.examples { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; color: var(--muted); }
.chip {
  padding: 5px 12px; font: inherit; font-size: 13px; color: var(--ink);
  background: transparent; border: 1px solid var(--line); border-radius: 999px; cursor: pointer;
}
.chip:hover { border-color: var(--accent); }

.error {
  margin-top: 18px; padding: 12px 14px; border: 1px solid var(--bad);
  border-radius: 8px; color: var(--bad); background: var(--surface);
}

.grid { display: grid; grid-template-columns: 240px 1fr; gap: 24px; margin-top: 32px; align-items: start; }

.rail ol { list-style: none; margin: 0; padding: 0; }
.step { position: relative; display: flex; gap: 12px; padding-bottom: 26px; }
.step:last-child { padding-bottom: 0; }
.step:not(:last-child)::before {
  content: ""; position: absolute; left: 10px; top: 24px; bottom: 2px; width: 2px; background: var(--line);
}
.step.done:not(:last-child)::before { background: var(--ok); }
.dot {
  flex: none; width: 22px; height: 22px; border-radius: 50%;
  display: grid; place-items: center; font-size: 12px; font-weight: 700;
  color: var(--surface); background: var(--surface); border: 2px solid var(--line);
}
.step.running .dot { border-color: var(--run); animation: ring 1.4s ease-in-out infinite; }
.step.done .dot { background: var(--ok); border-color: var(--ok); }
.step.error .dot { background: var(--bad); border-color: var(--bad); }
.step-name { font-weight: 600; }
.step-hint { font-size: 13px; color: var(--muted); }
.step.running .step-hint { color: var(--run); }
.step.error .step-hint { color: var(--bad); }
.clock { margin-top: 22px; font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; }

@keyframes ring {
  0%, 100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--run) 45%, transparent); }
  50% { box-shadow: 0 0 0 6px transparent; }
}

.panel { background: var(--surface); border: 1px solid var(--line); border-radius: 10px; overflow: hidden; min-width: 0; }
.tabs { display: flex; border-bottom: 1px solid var(--line); overflow-x: auto; }
.tab {
  display: inline-flex; align-items: center; gap: 8px; padding: 13px 18px;
  font: inherit; color: var(--muted); background: none; border: 0;
  border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap;
}
.tab.on { color: var(--ink); font-weight: 600; border-bottom-color: var(--accent); }
.pulse { width: 7px; height: 7px; border-radius: 50%; background: var(--run); animation: blink 1s ease-in-out infinite; }
@keyframes blink { 50% { opacity: 0.25; } }

.body { padding: 26px 30px 34px; min-height: 320px; }
.actions { display: flex; gap: 8px; justify-content: flex-end; margin-bottom: 10px; }
.empty { color: var(--muted); }
.waiting p { color: var(--muted); }
.bar { height: 3px; border-radius: 3px; background: var(--line); overflow: hidden; position: relative; margin-bottom: 14px; }
.bar::after {
  content: ""; position: absolute; inset: 0 auto 0 0; width: 30%; background: var(--run);
  animation: slide 1.4s ease-in-out infinite;
}
@keyframes slide { from { transform: translateX(-100%); } to { transform: translateX(340%); } }

.md { font-family: 'Newsreader', Georgia, serif; font-size: 18px; line-height: 1.7; max-width: 70ch; overflow-wrap: anywhere; }
.md h1, .md h2, .md h3 { font-family: 'Newsreader', Georgia, serif; line-height: 1.25; letter-spacing: -0.01em; }
.md h1 { font-size: 30px; margin: 0 0 14px; }
.md h2 { font-size: 23px; margin: 30px 0 8px; }
.md h3 { font-size: 19px; margin: 22px 0 6px; }
.md p, .md ul, .md ol { margin: 0 0 14px; }
.md a { color: var(--accent); }
.md code { font-family: ui-monospace, Menlo, monospace; font-size: 0.85em; padding: 1px 5px; background: var(--bg); border-radius: 4px; }
.md pre { overflow-x: auto; padding: 14px; background: var(--bg); border-radius: 8px; }
.md blockquote { margin: 0 0 14px; padding-left: 16px; border-left: 3px solid var(--line); color: var(--muted); }

@media (max-width: 760px) {
  .grid { grid-template-columns: 1fr; }
  .rail ol { display: flex; gap: 18px; overflow-x: auto; }
  .step { padding-bottom: 0; flex: none; }
  .step::before { display: none; }
  .body { padding: 20px; }
  .ask { flex-direction: column; }
  .btn { padding: 12px 22px; }
}

@media (prefers-reduced-motion: reduce) {
  .step.running .dot, .pulse, .bar::after { animation: none; }
}
`;
