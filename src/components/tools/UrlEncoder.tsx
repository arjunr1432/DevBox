import React, { useState } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Trash2, ArrowLeftRight, ShieldAlert } from 'lucide-react';

export const UrlEncoder: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  const [error, setError] = useState<string | null>(null);

  const handleProcess = (value: string, currentDir = direction) => {
    setInputText(value);
    setError(null);

    if (!value) {
      setOutputText('');
      return;
    }

    try {
      if (currentDir === 'encode') {
        setOutputText(encodeURIComponent(value));
      } else {
        setOutputText(decodeURIComponent(value));
      }
    } catch (err: any) {
      setError(currentDir === 'decode' ? 'Malformed URI sequence. Could not decode.' : 'Encoding error: ' + err.message);
      setOutputText('');
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
    setError(null);
  };

  const handleLoadSample = () => {
    if (direction === 'encode') {
      handleProcess('https://google.com/search?q=developer utility box&lang=en#heading-1');
    } else {
      handleProcess('https%3A%2F%2Fgoogle.com%2Fsearch%3Fq%3Ddeveloper%2520utility%2520box%26lang%3Den%23heading-1');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>URL Encoder & Decoder</h1>
        <p>Encode query parameters safely for URL usage, or decode URI percent-encoded strings back to standard text.</p>
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
              {direction === 'encode' ? 'Standard URL / Text (Input)' : 'Encoded URI Percentages (Input)'}
            </label>
            <textarea
              className="textarea-control"
              placeholder={direction === 'encode' ? 'Enter standard text or URL query parameters...' : 'Enter percent-encoded URL (e.g. %20 for space)...'}
              value={inputText}
              onChange={(e) => handleProcess(e.target.value)}
              style={{ flexGrow: 1, resize: 'none' }}
            />
          </div>

          <div className="pane-half">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {direction === 'encode' ? 'Encoded URI Output' : 'Decoded Text Output'}
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

        {error && (
          <div className="feedback-box error" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};
