import React, { useState } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Trash2, ArrowLeftRight } from 'lucide-react';

const escapeHtml = (str: string): string => {
  return str.replace(/[&<>'"]/g, (tag) => {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
    };
    return map[tag] || tag;
  });
};

const unescapeHtml = (str: string): string => {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.documentElement.textContent || '';
  } catch (err) {
    // Basic fallback replacement
    return str
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }
};

export const HtmlEncoder: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');

  const handleProcess = (value: string, currentDir = direction) => {
    setInputText(value);

    if (!value) {
      setOutputText('');
      return;
    }

    if (currentDir === 'encode') {
      setOutputText(escapeHtml(value));
    } else {
      setOutputText(unescapeHtml(value));
    }
  };

  const handleDirectionToggle = () => {
    const newDir = direction === 'encode' ? 'decode' : 'encode';
    setDirection(newDir);
    // Swap contents
    const tempOutput = outputText;
    setInputText(tempOutput);
    handleProcess(tempOutput, newDir);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
  };

  const handleLoadSample = () => {
    if (direction === 'encode') {
      handleProcess('<div class="premium-app">\n  <h1>DevBox & "Utility Suite"</h1>\n  <p>Offline & safe!</p>\n</div>');
    } else {
      handleProcess('&lt;div class=&quot;premium-app&quot;&gt;\n  &lt;h1&gt;DevBox &amp; &quot;Utility Suite&quot;&lt;/h1&gt;\n  &lt;p&gt;Offline &amp; safe!&lt;/p&gt;\n&lt;/div&gt;');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>HTML Entity Encoder & Decoder</h1>
        <p>Escape special HTML control characters to entity strings, or decode HTML entities back to raw text markup.</p>
      </div>

      <div className="tool-card">
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={handleDirectionToggle}>
            <ArrowLeftRight size={14} />
            <span>Switch to {direction === 'encode' ? 'Decode' : 'Encode'}</span>
          </button>

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

        {/* Text Area Grid */}
        <div className="split-pane" style={{ flexGrow: 1, minHeight: '350px' }}>
          <div className="pane-half">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {direction === 'encode' ? 'Raw HTML / Text (Input)' : 'Encoded HTML Entities (Input)'}
            </label>
            <textarea
              className="textarea-control"
              placeholder={direction === 'encode' ? 'Enter raw text containing HTML brackets (<, >, ", etc)...' : 'Enter HTML entity entities (&lt;, &gt;, etc)...'}
              value={inputText}
              onChange={(e) => handleProcess(e.target.value)}
              style={{ flexGrow: 1, resize: 'none' }}
            />
          </div>

          <div className="pane-half">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {direction === 'encode' ? 'Encoded HTML Output' : 'Decoded Text Output'}
              </label>
              <CopyButton text={outputText} />
            </div>
            <textarea
              className="textarea-control"
              placeholder="Output will appear here..."
              value={outputText}
              readOnly
              style={{ flexGrow: 1, resize: 'none', background: 'rgba(14, 11, 22, 0.4)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
