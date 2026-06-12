import React, { useState } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Trash2, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

export const JsonFormatter: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<string>('2');

  const handleFormat = (type: 'beautify' | 'minify') => {
    setError(null);
    if (!input.trim()) {
      setOutput('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      if (type === 'minify') {
        setOutput(JSON.stringify(parsed));
      } else {
        const space = indent === 'tab' ? '\t' : parseInt(indent, 10);
        setOutput(JSON.stringify(parsed, null, space));
      }
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format');
      setOutput('');
    }
  };

  const handleLoadSample = () => {
    const sample = {
      name: "Developer Utility Box",
      version: "1.0.0",
      active: true,
      features: ["JSON Formatter", "Base64", "Epoch Converter", "JWT Decoder", "RegEx Tester", "Hash Generator", "Color Tool", "URL Encoder"],
      settings: {
        theme: "dark",
        fontSize: 14,
        allowOffline: true
      }
    };
    setInput(JSON.stringify(sample, null, 2));
    setError(null);
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>JSON Formatter & Validator</h1>
        <p>Beautify, minify, validate and format JSON strings with instant syntax check.</p>
      </div>

      <div className="tool-card">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Spacing:</span>
            <select
              className="select-control"
              value={indent}
              onChange={(e) => setIndent(e.target.value)}
              style={{ width: '110px', padding: '6px 10px', fontSize: '13px' }}
            >
              <option value="2">2 Spaces</option>
              <option value="4">4 Spaces</option>
              <option value="tab">Tabs</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleLoadSample} style={{ padding: '8px 12px' }}>
              <FileText size={14} />
              <span>Sample</span>
            </button>
            <button className="btn btn-secondary" onClick={handleClear} style={{ padding: '8px 12px' }}>
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
            <button className="btn btn-primary" onClick={() => handleFormat('beautify')} style={{ padding: '8px 16px' }}>
              Beautify
            </button>
            <button className="btn btn-primary" onClick={() => handleFormat('minify')} style={{ padding: '8px 16px' }}>
              Minify
            </button>
          </div>
        </div>

        <div className="split-pane" style={{ flexGrow: 1, minHeight: '350px' }}>
          <div className="pane-half">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Input JSON</label>
            </div>
            <textarea
              className="textarea-control"
              placeholder="Paste raw JSON here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flexGrow: 1, resize: 'none' }}
            />
          </div>

          <div className="pane-half">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Formatted JSON</label>
              <CopyButton text={output} />
            </div>
            <textarea
              className="textarea-control"
              placeholder="Output will appear here..."
              value={output}
              readOnly
              style={{ flexGrow: 1, resize: 'none', background: 'rgba(14, 11, 22, 0.4)' }}
            />
          </div>
        </div>

        {error && (
          <div className="feedback-box error" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Validation Error:</strong> {error}
            </div>
          </div>
        )}

        {output && !error && (
          <div className="feedback-box success" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>Valid JSON structure parsed successfully.</span>
          </div>
        )}
      </div>
    </div>
  );
};
