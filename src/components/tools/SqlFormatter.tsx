import React, { useState } from 'react';
import { format } from 'sql-formatter';
import { CopyButton } from '../ui/CopyButton';
import { Trash2, Database, AlertCircle } from 'lucide-react';

type SqlDialect = 'sql' | 'postgresql' | 'mysql' | 'sqlite';

export const SqlFormatter: React.FC = () => {
  const [input, setInput] = useState('select id, name, email from users where active = 1 group by department order by created_at desc;');
  const [output, setOutput] = useState('');
  const [dialect, setDialect] = useState<SqlDialect>('sql');
  const [tabWidth, setTabWidth] = useState<number>(2);
  const [uppercase, setUppercase] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleFormat = () => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const formatted = format(input, {
        language: dialect,
        tabWidth: tabWidth,
        keywordCase: uppercase ? 'upper' : 'preserve',
      });
      setOutput(formatted);
    } catch (err: any) {
      setError(err.message || 'Error parsing SQL syntax');
      setOutput('');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const handleLoadSample = () => {
    const sample = `SELECT a.id, b.name, sum(c.amount) as total FROM orders o JOIN accounts a ON o.account_id = a.id JOIN users b ON a.owner_id = b.id JOIN transactions c ON o.id = c.order_id WHERE c.status = 'completed' AND o.created_at >= '2026-01-01' GROUP BY a.id, b.name HAVING sum(c.amount) > 1000 ORDER BY total DESC LIMIT 50;`;
    setInput(sample);
    setError(null);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>SQL Formatter</h1>
        <p>Format raw and unstructured SQL queries into clean, readable SQL queries with dialect support.</p>
      </div>

      <div className="tool-card">
        {/* Configurations Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Dialect */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Dialect:</span>
              <select
                className="select-control"
                value={dialect}
                onChange={(e) => setDialect(e.target.value as SqlDialect)}
                style={{ width: '130px', padding: '6px 10px', fontSize: '13px' }}
              >
                <option value="sql">Standard SQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>

            {/* Indent */}
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Indent:</span>
              <select
                className="select-control"
                value={tabWidth}
                onChange={(e) => setTabWidth(parseInt(e.target.value, 10))}
                style={{ width: '100px', padding: '6px 10px', fontSize: '13px' }}
              >
                <option value={2}>2 Spaces</option>
                <option value={4}>4 Spaces</option>
              </select>
            </div>

            {/* Uppercase Keywords */}
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={uppercase} onChange={() => setUppercase(!uppercase)} />
              <span>UPPERCASE keywords</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleLoadSample} style={{ padding: '8px 12px' }}>
              <Database size={14} />
              <span>Sample</span>
            </button>
            <button className="btn btn-secondary" onClick={handleClear} style={{ padding: '8px 12px' }}>
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
            <button className="btn btn-primary" onClick={handleFormat} style={{ padding: '8px 16px' }}>
              Format SQL
            </button>
          </div>
        </div>

        {/* Panes Grid */}
        <div className="split-pane" style={{ flexGrow: 1, minHeight: '320px' }}>
          <div className="pane-half">
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Raw SQL Query</label>
            <textarea
              className="textarea-control"
              placeholder="Paste raw SQL query here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flexGrow: 1, resize: 'none' }}
            />
          </div>

          <div className="pane-half">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Formatted SQL</label>
              <CopyButton text={output} />
            </div>
            <textarea
              className="textarea-control"
              placeholder="Formatted output will appear here..."
              value={output}
              readOnly
              style={{ flexGrow: 1, resize: 'none', background: 'rgba(14, 11, 22, 0.4)' }}
            />
          </div>
        </div>

        {error && (
          <div className="feedback-box error" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
