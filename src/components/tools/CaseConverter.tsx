import React, { useState, useEffect } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Trash2, BarChart2 } from 'lucide-react';

const toCamelCase = (str: string): string => {
  return str
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase())
    .replace(/^[A-Z]/, (chr) => chr.toLowerCase());
};

const toSnakeCase = (str: string): string => {
  return str
    .replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const toKebabCase = (str: string): string => {
  return str
    .replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const toPascalCase = (str: string): string => {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
};

export const CaseConverter: React.FC = () => {
  const [input, setInput] = useState('hello world program');
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState({ chars: 0, words: 0, lines: 0 });

  const handleConvert = (type: 'camel' | 'snake' | 'kebab' | 'pascal' | 'upper' | 'lower') => {
    if (!input.trim()) {
      setOutput('');
      return;
    }
    
    switch (type) {
      case 'camel':
        setOutput(toCamelCase(input));
        break;
      case 'snake':
        setOutput(toSnakeCase(input));
        break;
      case 'kebab':
        setOutput(toKebabCase(input));
        break;
      case 'pascal':
        setOutput(toPascalCase(input));
        break;
      case 'upper':
        setOutput(input.toUpperCase());
        break;
      case 'lower':
        setOutput(input.toLowerCase());
        break;
      default:
        setOutput(input);
    }
  };

  useEffect(() => {
    const chars = input.length;
    const words = input.trim() ? input.trim().split(/\s+/).length : 0;
    const lines = input ? input.split('\n').length : 0;
    setStats({ chars, words, lines });
  }, [input]);

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>String Case Converter & Cleaner</h1>
        <p>Convert inputs between camelCase, snake_case, kebab-case, PascalCase, UPPERCASE, and lowercase formats.</p>
      </div>

      <div className="tool-card">
        {/* Buttons Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => handleConvert('camel')}>camelCase</button>
            <button className="btn btn-secondary" onClick={() => handleConvert('snake')}>snake_case</button>
            <button className="btn btn-secondary" onClick={() => handleConvert('kebab')}>kebab-case</button>
            <button className="btn btn-secondary" onClick={() => handleConvert('pascal')}>PascalCase</button>
            <button className="btn btn-secondary" onClick={() => handleConvert('upper')}>UPPERCASE</button>
            <button className="btn btn-secondary" onClick={() => handleConvert('lower')}>lowercase</button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={handleClear} style={{ padding: '8px 12px' }}>
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Text Pane Grid */}
        <div className="split-pane" style={{ flexGrow: 1, minHeight: '320px' }}>
          <div className="pane-half">
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Input String</label>
            <textarea
              className="textarea-control"
              placeholder="Type or paste text here to convert..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flexGrow: 1, resize: 'none' }}
            />
          </div>

          <div className="pane-half">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Converted Output</label>
              <CopyButton text={output} />
            </div>
            <textarea
              className="textarea-control"
              placeholder="Converted output will appear here..."
              value={output}
              readOnly
              style={{ flexGrow: 1, resize: 'none', background: 'rgba(14, 11, 22, 0.4)' }}
            />
          </div>
        </div>

        {/* Stats Banner */}
        <div style={{
          display: 'flex',
          gap: '24px',
          padding: '12px 16px',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <BarChart2 size={14} style={{ color: 'var(--accent)' }} />
            <span>TEXT STATISTICS:</span>
          </div>
          <div style={{ fontSize: '13px' }}>
            Characters: <strong style={{ color: 'var(--text-primary)' }}>{stats.chars}</strong>
          </div>
          <div style={{ fontSize: '13px' }}>
            Words: <strong style={{ color: 'var(--text-primary)' }}>{stats.words}</strong>
          </div>
          <div style={{ fontSize: '13px' }}>
            Lines: <strong style={{ color: 'var(--text-primary)' }}>{stats.lines}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
