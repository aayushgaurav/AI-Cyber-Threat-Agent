import { useRef, useState } from 'react';
import { askQuestion } from '../lib/api.js';
import { field } from '../lib/utils.js';
import { Icon, ShieldLogo } from '../components/Icons.jsx';
import { ErrorBanner, EmptyState, RansomwareBadge, Spinner, Unavailable } from '../components/Feedback.jsx';

const EXAMPLES = [
  'What is the required action for CVE-2022-27593?',
  'Which Microsoft vulnerabilities are known to be used in ransomware campaigns?',
  'Show recent vulnerabilities affecting Cisco products.',
  'What vulnerabilities affect Apache products and what should I do about them?',
];

function EvidenceCard({ item, rank }) {
  const score = item?.relevance_score ?? item?.score;
  return (
    <article className="card evidence">
      <header className="evidence-head">
        <span className="evidence-rank">#{rank}</span>
        <h4 className="mono">{field(item, 'cve') || <Unavailable>CVE not provided</Unavailable>}</h4>
        {typeof score === 'number' && (
          <span className="badge badge-info" title="Relevance score reported by the backend">
            Relevance {score.toFixed(3)}
          </span>
        )}
      </header>
      <dl className="evidence-grid">
        <div><dt>Vendor</dt><dd>{field(item, 'vendor') || <Unavailable>—</Unavailable>}</dd></div>
        <div><dt>Product</dt><dd>{field(item, 'product') || <Unavailable>—</Unavailable>}</dd></div>
        <div><dt>Ransomware use</dt><dd><RansomwareBadge value={field(item, 'ransomware')} /></dd></div>
        <div className="full"><dt>Required action</dt><dd>{field(item, 'action') || <Unavailable>Not provided</Unavailable>}</dd></div>
      </dl>
    </article>
  );
}

export default function ThreatAnalyst() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [askedQuestion, setAskedQuestion] = useState('');
  const runningRef = useRef(false);
  const inputRef = useRef(null);

  const submit = async (event) => {
    event?.preventDefault();
    const q = question.trim();
    if (!q || runningRef.current) return;
    runningRef.current = true;
    setLoading(true);
    setError(null);
    try {
      const data = await askQuestion(q);
      setResult(data);
      setAskedQuestion(q);
    } catch (err) {
      setError(err);
    } finally {
      runningRef.current = false;
      setLoading(false);
    }
  };

  const onKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') submit(event);
  };

  const useExample = (text) => {
    setQuestion(text);
    inputRef.current?.focus();
  };

  const evidence = Array.isArray(result?.evidence) ? result.evidence : [];

  return (
    <div className="page">
      <div className="page-head">
        <h1>AI Threat Analyst</h1>
        <p>Ask a question about known exploited vulnerabilities. Answers are generated from records retrieved from the local database.</p>
      </div>

      <form className="card panel" onSubmit={submit}>
        <label htmlFor="question" className="field-label">Your question</label>
        <textarea
          id="question"
          ref={inputRef}
          className="textarea"
          rows={4}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="e.g. What is the required action for CVE-2022-27593?"
        />
        <div className="form-row">
          <span className="muted hint">Press Ctrl/⌘ + Enter to submit</span>
          <button type="submit" className="btn btn-primary" disabled={loading || !question.trim()} aria-busy={loading}>
            {loading ? <><Spinner label="Analysing" /> Analysing…</> : <><Icon name="send" size={18} /> Ask analyst</>}
          </button>
        </div>

        <div className="examples">
          <p className="field-label">Example questions</p>
          <div className="chips">
            {EXAMPLES.map((text) => (
              <button key={text} type="button" className="chip" onClick={() => useExample(text)} disabled={loading}>
                {text}
              </button>
            ))}
          </div>
        </div>
      </form>

      <div aria-live="polite">
        {error && <ErrorBanner title="The analyst could not answer" error={error} onRetry={!loading ? submit : undefined} />}

        {!result && !error && !loading && (
          <div className="card panel">
            <EmptyState icon="analyst" title="No questions asked yet">
              Enter a question above or pick an example to get started. The answer and the evidence it was based on will appear here.
            </EmptyState>
          </div>
        )}

        {loading && !result && (
          <div className="card panel state-block" role="status">
            <Spinner label="Waiting for answer" />
            <p>The analyst is searching the database and drafting an answer…</p>
          </div>
        )}

        {result && (
          <div className={`results ${loading ? 'stale' : ''}`}>
            <section className="card panel answer" aria-labelledby="answer-heading">
              <div className="answer-head">
                <ShieldLogo size={28} />
                <div>
                  <h2 id="answer-heading">Analyst answer</h2>
                  <p className="muted">In response to: “{result.question || askedQuestion}”</p>
                </div>
              </div>
              <div className="answer-body">
                {result.answer
                  ? String(result.answer).split(/\n{2,}/).map((p, i) => <p key={i} className="pre-line">{p}</p>)
                  : <Unavailable>The backend returned no answer text.</Unavailable>}
              </div>
              <p className="disclaimer">AI-generated. Verify against the evidence below before acting.</p>
            </section>

            <section aria-labelledby="evidence-heading">
              <h2 id="evidence-heading" className="section-title">
                Retrieved evidence <span className="count">{evidence.length}</span>
              </h2>
              {evidence.length === 0 ? (
                <div className="card panel">
                  <EmptyState icon="info" title="No evidence returned">
                    The backend did not include any supporting records with this answer.
                  </EmptyState>
                </div>
              ) : (
                <div className="grid evidence-list">
                  {evidence.map((item, i) => (
                    <EvidenceCard key={`${field(item, 'cve') || 'item'}-${i}`} item={item} rank={i + 1} />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
