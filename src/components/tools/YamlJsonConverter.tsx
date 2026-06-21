import React, { useState } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Trash2, FileText, ArrowLeftRight, AlertTriangle, CheckCircle } from 'lucide-react';
import YAML from 'yaml';

export const YamlJsonConverter: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [direction, setDirection] = useState<'yaml2json' | 'json2yaml'>('yaml2json');
  const [error, setError] = useState<string | null>(null);
  const [indent, setIndent] = useState<string>('2');

  const handleConvert = (value: string, currentDir = direction, currentIndent = indent) => {
    setInputText(value);
    setError(null);

    if (!value.trim()) {
      setOutputText('');
      return;
    }

    try {
      if (currentDir === 'yaml2json') {
        // YAML to JSON
        const parsed = YAML.parse(value);
        if (parsed === undefined || parsed === null) {
          throw new Error('Parsed YAML resulted in null or undefined value');
        }
        const space = currentIndent === 'tab' ? '\t' : parseInt(currentIndent, 10);
        setOutputText(JSON.stringify(parsed, null, space));
      } else {
        // JSON to YAML
        const parsed = JSON.parse(value);
        const space = currentIndent === 'tab' ? 4 : parseInt(currentIndent, 10);
        setOutputText(YAML.stringify(parsed, { indent: space }));
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setOutputText('');
    }
  };

  const handleDirectionToggle = () => {
    const newDir = direction === 'yaml2json' ? 'json2yaml' : 'yaml2json';
    setDirection(newDir);
    setError(null);
    
    // Swap contents and run conversion in new direction
    const prevOutput = outputText;
    const prevInput = inputText;
    if (prevOutput) {
      setInputText(prevOutput);
      handleConvert(prevOutput, newDir);
    } else {
      setInputText(prevInput);
      setOutputText('');
    }
  };

  const handleIndentChange = (newIndent: string) => {
    setIndent(newIndent);
    handleConvert(inputText, direction, newIndent);
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError(null);
  };

  const handleLoadSample = () => {
    const yamlSample = `name: Developer Utility Box
version: 1.0.0
active: true
features:
  - YAML JSON Converter
  - Cron Parser
  - QR Code Generator
settings:
  theme: dark
  allowOffline: true
  ports:
    - 5173
    - 8080`;

    const jsonSample = `{
  "name": "Developer Utility Box",
  "version": "1.0.0",
  "active": true,
  "features": [
    "YAML JSON Converter",
    "Cron Parser",
    "QR Code Generator"
  ],
  "settings": {
    "theme": "dark",
    "allowOffline": true,
    "ports": [
      5173,
      8080
    ]
  }
}`;

    if (direction === 'yaml2json') {
      handleConvert(yamlSample, 'yaml2json');
    } else {
      handleConvert(jsonSample, 'json2yaml');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>YAML ↔ JSON Converter</h1>
        <p>Convert structures between YAML format and formatted JSON strings instantly, completely client-side.</p>
      </div>

      <div className="tool-card">
        {/* Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={handleDirectionToggle} style={{ padding: '8px 12px' }}>
              <ArrowLeftRight size={14} />
              <span>{direction === 'yaml2json' ? 'YAML → JSON' : 'JSON → YAML'}</span>
            </button>
            
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Indent:</span>
              <select
                className="select-control"
                value={indent}
                onChange={(e) => handleIndentChange(e.target.value)}
                style={{ width: '110px', padding: '6px 10px', fontSize: '13px' }}
              >
                <option value="2">2 Spaces</option>
                <option value="4">4 Spaces</option>
                {direction === 'yaml2json' && <option value="tab">Tabs</option>}
              </select>
            </div>
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
          </div>
        </div>

        {/* Text Area Grid */}
        <div className="split-pane" style={{ flexGrow: 1, minHeight: '350px' }}>
          <div className="pane-half">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Input {direction === 'yaml2json' ? 'YAML' : 'JSON'}
            </label>
            <textarea
              className="textarea-control"
              placeholder={direction === 'yaml2json' ? 'Paste YAML string here...' : 'Paste JSON string here...'}
              value={inputText}
              onChange={(e) => handleConvert(e.target.value)}
              style={{ flexGrow: 1, resize: 'none' }}
            />
          </div>

          <div className="pane-half">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Converted {direction === 'yaml2json' ? 'JSON' : 'YAML'}
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
          <div className="feedback-box error" style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong>Syntax Error:</strong> {error}
            </div>
          </div>
        )}

        {outputText && !error && (
          <div className="feedback-box success" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <CheckCircle size={16} style={{ flexShrink: 0 }} />
            <span>Conversion completed with no syntax errors.</span>
          </div>
        )}
      </div>
    </div>
  );
};
