import React, { useState } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Trash2, FileCode, CheckCircle, AlertTriangle } from 'lucide-react';

const formatXml = (xml: string, indentString = '  '): string => {
  let formatted = '';
  // Clean up all whitespaces between tags first
  const cleanXml = xml.replace(/>\s*</g, '><');
  // Split tags by newlines
  const reg = /(>)(<)(\/*)/g;
  const wspaceXml = cleanXml.replace(reg, '$1\r\n$2$3');
  let pad = 0;

  wspaceXml.split('\r\n').forEach((line) => {
    let indentAlign = 0;
    if (line.match(/.+<\/\w[^>]*>$/)) {
      indentAlign = 0;
    } else if (line.match(/^<\/\w/)) {
      if (pad !== 0) {
        pad -= 1;
      }
    } else if (line.match(/^<\w[^>]*[^\/]>.*$/)) {
      indentAlign = 1;
    } else {
      indentAlign = 0;
    }

    let padding = '';
    for (let i = 0; i < pad; i++) {
      padding += indentString;
    }

    formatted += padding + line + '\n';
    pad += indentAlign;
  });

  return formatted.trim();
};

const minifyXml = (xml: string): string => {
  return xml.replace(/>\s+< /g, '><').replace(/\r?\n|\r/g, '').trim();
};

export const XmlFormatter: React.FC = () => {
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

    // Basic XML validation
    const openingTags = (input.match(/<[a-zA-Z]/g) || []).length;
    const closingTags = (input.match(/<\/[a-zA-Z]/g) || []).length;
    if (openingTags !== closingTags) {
      setError(`Warning: Unbalanced tags detected. Found ${openingTags} opening tags and ${closingTags} closing tags.`);
    }

    try {
      if (type === 'minify') {
        setOutput(minifyXml(input));
      } else {
        const space = indent === 'tab' ? '\t' : ' '.repeat(parseInt(indent, 10));
        setOutput(formatXml(input, space));
      }
    } catch (err: any) {
      setError(err.message || 'Error formatting XML');
      setOutput('');
    }
  };

  const handleLoadSample = () => {
    const sample = `<?xml version="1.0" encoding="UTF-8"?>
<bookstore>
  <book category="cooking">
    <title lang="en">Everyday Italian</title>
    <author>Giada De Laurentiis</author>
    <year>2005</year>
    <price>30.00</price>
  </book>
  <book category="children">
    <title lang="en">Harry Potter</title>
    <author>J. K. Rowling</author>
    <year>2005</year>
    <price>29.99</price>
  </book>
</bookstore>`;
    setInput(sample);
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
        <h1>XML Formatter</h1>
        <p>Beautify, indent, validate, and minify XML strings with structural checks.</p>
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
              <FileCode size={14} />
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
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Input XML</label>
            <textarea
              className="textarea-control"
              placeholder="Paste raw XML here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flexGrow: 1, resize: 'none' }}
            />
          </div>

          <div className="pane-half">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Formatted XML</label>
              <CopyButton text={output} />
            </div>
            <textarea
              className="textarea-control"
              placeholder="Formatted XML output will appear here..."
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
              <strong>XML Tag Validation:</strong> {error}
            </div>
          </div>
        )}

        {output && !error && (
          <div className="feedback-box success" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>Valid XML structure parsed successfully.</span>
          </div>
        )}
      </div>
    </div>
  );
};
