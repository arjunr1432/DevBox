import React, { useState, useEffect } from 'react';
import { diffLines, diffWords } from 'diff';
import type { Change } from 'diff';
import { GitCompare, Trash2, HelpCircle } from 'lucide-react';

export const TextDiff: React.FC = () => {
  const [original, setOriginal] = useState('{\n  "name": "DevBox",\n  "version": "1.0.0",\n  "offline": false,\n  "tools": [\n    "JSON Formatter",\n    "Base64"\n  ]\n}');
  const [modified, setModified] = useState('{\n  "name": "DevBox",\n  "version": "1.1.0",\n  "offline": true,\n  "tools": [\n    "JSON Formatter",\n    "Base64",\n    "Text Diff Checker"\n  ]\n}');
  const [diffMode, setDiffMode] = useState<'line' | 'word'>('line');
  const [diffResult, setDiffResult] = useState<Change[]>([]);

  useEffect(() => {
    if (diffMode === 'line') {
      setDiffResult(diffLines(original, modified));
    } else {
      setDiffResult(diffWords(original, modified));
    }
  }, [original, modified, diffMode]);

  const handleClear = () => {
    setOriginal('');
    setModified('');
  };

  const handleLoadSample = () => {
    setOriginal('// Step 1: Initialize values\nlet x = 10;\nlet y = 20;\n\n// Step 2: Sum values\nlet sum = x + y;\nconsole.log("Sum is:", sum);');
    setModified('// Step 1: Initialize constant values\nconst x = 15;\nconst y = 30;\n\n// Step 2: Compute product\nconst product = x * y;\nconsole.log("Product is:", product);');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>Text Diff Checker</h1>
        <p>Compare two text snippets side-by-side or inline to check for character, word, or line differences.</p>
      </div>

      <div className="tool-card" style={{ gap: '16px' }}>
        {/* Top Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${diffMode === 'line' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDiffMode('line')}
            >
              Line-by-line
            </button>
            <button
              className={`btn ${diffMode === 'word' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setDiffMode('word')}
            >
              Word-by-word
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleLoadSample}>
              Load Sample
            </button>
            <button className="btn btn-secondary" onClick={handleClear}>
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Input Pane Grid */}
        <div className="split-pane" style={{ height: '220px', minHeight: '200px', flexGrow: 0 }}>
          <div className="pane-half">
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>ORIGINAL TEXT</label>
            <textarea
              className="textarea-control"
              placeholder="Paste original text here..."
              value={original}
              onChange={(e) => setOriginal(e.target.value)}
              style={{ flexGrow: 1, resize: 'none', fontSize: '12px' }}
            />
          </div>

          <div className="pane-half">
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>MODIFIED TEXT</label>
            <textarea
              className="textarea-control"
              placeholder="Paste modified text here..."
              value={modified}
              onChange={(e) => setModified(e.target.value)}
              style={{ flexGrow: 1, resize: 'none', fontSize: '12px' }}
            />
          </div>
        </div>

        {/* Diff Result Render */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1, minHeight: '250px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <GitCompare size={14} />
            COMPARISON OUTPUT
          </label>
          
          <div className="diff-viewer" style={{ flexGrow: 1, maxHeight: '350px' }}>
            {diffMode === 'line' ? (
              // Line diff rendering
              diffResult.map((part, index) => {
                const lines = part.value.split('\n');
                // Remove last empty line split element
                if (lines[lines.length - 1] === '') {
                  lines.pop();
                }

                return lines.map((line, lineIdx) => {
                  const className = part.added ? 'added' : part.removed ? 'removed' : 'normal';
                  const prefix = part.added ? '+' : part.removed ? '-' : ' ';
                  return (
                    <div key={`diff-l-${index}-${lineIdx}`} className={`diff-line ${className}`}>
                      <span className="diff-prefix">{prefix}</span>
                      <span className="diff-text">{line}</span>
                    </div>
                  );
                });
              })
            ) : (
              // Word diff inline rendering
              <div style={{ padding: '12px', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {diffResult.map((part, index) => {
                  let colorStyle: React.CSSProperties = {};
                  if (part.added) {
                    colorStyle = { background: 'rgba(16, 185, 129, 0.25)', color: 'var(--success)', borderRadius: '2px', padding: '0 2px' };
                  } else if (part.removed) {
                    colorStyle = { background: 'rgba(244, 63, 94, 0.25)', color: 'var(--error)', textDecoration: 'line-through', borderRadius: '2px', padding: '0 2px' };
                  }
                  return (
                    <span key={`diff-w-${index}`} style={colorStyle}>
                      {part.value}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
          <HelpCircle size={14} />
          <span>Line diffs compare complete lines. Word diffs compare character clusters inside lines.</span>
        </div>
      </div>
    </div>
  );
};
