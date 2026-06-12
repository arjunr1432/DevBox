import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';

export const RegExTester: React.FC = () => {
  const [pattern, setPattern] = useState('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
  const [flags, setFlags] = useState({
    g: true,
    i: true,
    m: false,
  });
  const [testText, setTestText] = useState(
    'Please contact us at support@example.com or sales.dept@company.org for further details. You can also reach our developer relations at dev-rel@sub.domain.io!'
  );
  
  const [error, setError] = useState<string | null>(null);
  const [matchesCount, setMatchesCount] = useState(0);
  const [highlightedNodes, setHighlightedNodes] = useState<React.ReactNode[]>([]);
  const [matchList, setMatchList] = useState<string[]>([]);

  const toggleFlag = (flag: 'g' | 'i' | 'm') => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  useEffect(() => {
    setError(null);
    if (!pattern) {
      setHighlightedNodes([testText]);
      setMatchesCount(0);
      setMatchList([]);
      return;
    }

    try {
      const activeFlags = `${flags.g ? 'g' : ''}${flags.i ? 'i' : ''}${flags.m ? 'm' : ''}`;
      
      // Pre-compile validation
      const regexTest = new RegExp(pattern, activeFlags);
      
      // Safety: Prevent regexes that match empty strings from executing, as they will cause infinite loops in global matching.
      if (regexTest.test('')) {
        setError('Regex pattern matches empty strings. Please refine your pattern to avoid infinite loops.');
        setHighlightedNodes([testText]);
        setMatchesCount(0);
        setMatchList([]);
        return;
      }

      if (!testText) {
        setHighlightedNodes([]);
        setMatchesCount(0);
        setMatchList([]);
        return;
      }

      if (flags.g) {
        const matches = [...testText.matchAll(regexTest)];
        setMatchesCount(matches.length);
        setMatchList(matches.map(m => m[0]));

        let lastIndex = 0;
        const nodes: React.ReactNode[] = [];

        matches.forEach((match, idx) => {
          const start = match.index!;
          const end = start + match[0].length;

          if (start > lastIndex) {
            nodes.push(testText.substring(lastIndex, start));
          }

          nodes.push(
            <span key={`m-${idx}`} className="regex-match">
              {match[0]}
            </span>
          );
          lastIndex = end;
        });

        if (lastIndex < testText.length) {
          nodes.push(testText.substring(lastIndex));
        }

        setHighlightedNodes(nodes);
      } else {
        const match = testText.match(regexTest);
        if (match) {
          setMatchesCount(1);
          setMatchList([match[0]]);

          const start = match.index!;
          const end = start + match[0].length;
          const nodes: React.ReactNode[] = [];

          if (start > 0) {
            nodes.push(testText.substring(0, start));
          }
          nodes.push(
            <span key="single-m" className="regex-match">
              {match[0]}
            </span>
          );
          if (end < testText.length) {
            nodes.push(testText.substring(end));
          }
          setHighlightedNodes(nodes);
        } else {
          setHighlightedNodes([testText]);
          setMatchesCount(0);
          setMatchList([]);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Invalid Regular Expression');
      setHighlightedNodes([testText]);
      setMatchesCount(0);
      setMatchList([]);
    }
  }, [pattern, flags, testText]);

  const handleLoadSample = (type: 'email' | 'url' | 'date') => {
    setError(null);
    if (type === 'email') {
      setPattern('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
      setTestText('Reach out to us at admin@website.co.uk or support@service.net.');
      setFlags({ g: true, i: true, m: false });
    } else if (type === 'url') {
      setPattern('https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)');
      setTestText('Explore Google at https://www.google.com and GitHub at https://github.com/trending.');
      setFlags({ g: true, i: true, m: false });
    } else if (type === 'date') {
      setPattern('\\b\\d{4}-\\d{2}-\\d{2}\\b');
      setTestText('The project started on 2026-04-12 and will conclude by 2026-06-30.');
      setFlags({ g: true, i: true, m: false });
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>RegEx Match Tester</h1>
        <p>Test and build regular expressions in real-time with highlighted match nodes and flags.</p>
      </div>

      <div className="tool-card" style={{ gap: '16px' }}>
        {/* Pattern input and flags */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flexGrow: 1, minWidth: '280px' }}>
            <label>Regular Expression Pattern</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>/</span>
              <input
                type="text"
                className="input-control"
                value={pattern}
                onChange={(e) => setPattern(e.target.value)}
                style={{ paddingLeft: '24px', fontFamily: 'var(--font-mono)' }}
                placeholder="Enter regex pattern (e.g. \b\d{4}\b)"
              />
              <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                /{`${flags.g ? 'g' : ''}${flags.i ? 'i' : ''}${flags.m ? 'm' : ''}`}
              </span>
            </div>
          </div>

          {/* Flags Selector */}
          <div className="form-group">
            <label>Flags</label>
            <div style={{ display: 'flex', gap: '8px', height: '40px', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', textTransform: 'none', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={flags.g} onChange={() => toggleFlag('g')} />
                <span>global (g)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', textTransform: 'none', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={flags.i} onChange={() => toggleFlag('i')} />
                <span>ignoreCase (i)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', textTransform: 'none', color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={flags.m} onChange={() => toggleFlag('m')} />
                <span>multiline (m)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Load Preset Samples */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Presets:</span>
          <button className="btn btn-secondary" onClick={() => handleLoadSample('email')} style={{ padding: '4px 10px', fontSize: '12px' }}>Email Address</button>
          <button className="btn btn-secondary" onClick={() => handleLoadSample('url')} style={{ padding: '4px 10px', fontSize: '12px' }}>URL</button>
          <button className="btn btn-secondary" onClick={() => handleLoadSample('date')} style={{ padding: '4px 10px', fontSize: '12px' }}>Date (YYYY-MM-DD)</button>
        </div>

        {/* Text areas split pane */}
        <div className="split-pane" style={{ flexGrow: 1, minHeight: '300px' }}>
          {/* Test text input */}
          <div className="pane-half">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Test Subject Text</label>
            <textarea
              className="textarea-control"
              placeholder="Enter text to test the regex against..."
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              style={{ flexGrow: 1, resize: 'none' }}
            />
          </div>

          {/* Highlighted output */}
          <div className="pane-half">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Highlight Results</label>
            <div className="regex-highlighted" style={{ flexGrow: 1 }}>
              {highlightedNodes.length > 0 ? highlightedNodes : <span style={{ color: 'var(--text-muted)' }}>Waiting for match input...</span>}
            </div>
          </div>
        </div>

        {/* Feedback / Validation Status */}
        {error ? (
          <div className="feedback-box error" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        ) : (
          <div className="feedback-box success" style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
              <span>Regex compiles successfully.</span>
            </div>
            <span style={{ fontWeight: 700 }}>{matchesCount} {matchesCount === 1 ? 'match' : 'matches'} found</span>
          </div>
        )}

        {/* Match Details List */}
        {matchList.length > 0 && !error && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Sparkles size={12} />
              EXTRACTED MATCH DETAILS
            </span>
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              maxHeight: '100px',
              overflowY: 'auto',
              padding: '10px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}>
              {matchList.map((match, idx) => (
                <span key={`match-val-${idx}`} style={{
                  padding: '4px 8px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '12px'
                }}>
                  {match}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
