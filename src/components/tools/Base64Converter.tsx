import React, { useState, useRef } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Trash2, ShieldAlert, ArrowLeftRight, Upload } from 'lucide-react';

export const Base64Converter: React.FC = () => {
  const [mode, setMode] = useState<'text' | 'file'>('text');
  const [direction, setDirection] = useState<'encode' | 'decode'>('encode');
  
  // Text state
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // File state
  const [fileData, setFileData] = useState<{
    name: string;
    size: number;
    type: string;
    base64: string;
    dataUrl: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (value: string, currentDir = direction) => {
    setInputText(value);
    setError(null);

    if (!value) {
      setOutputText('');
      return;
    }

    try {
      if (currentDir === 'encode') {
        // Handle Unicode characters correctly
        const bytes = new TextEncoder().encode(value);
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
        setOutputText(btoa(binString));
      } else {
        const binString = atob(value);
        const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
        setOutputText(new TextDecoder().decode(bytes));
      }
    } catch (err: any) {
      setError(currentDir === 'decode' ? 'Invalid Base64 string for decoding' : 'Encoding error: ' + err.message);
      setOutputText('');
    }
  };

  const handleDirectionToggle = () => {
    const newDir = direction === 'encode' ? 'decode' : 'encode';
    setDirection(newDir);
    // Swap inputs
    const tempOutput = outputText;
    setInputText(tempOutput);
    handleTextChange(tempOutput, newDir);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      setFileData({
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        base64,
        dataUrl
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError(null);
    setFileData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>Base64 Encoder & Decoder</h1>
        <p>Encode plain text or binary files to Base64 representation, or decode Base64 back into readable text.</p>
      </div>

      <div className="tool-card">
        {/* Top Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className={`btn ${mode === 'text' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('text')}
            >
              Text mode
            </button>
            <button
              className={`btn ${mode === 'file' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setMode('file')}
            >
              File mode
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {mode === 'text' && (
              <button className="btn btn-secondary" onClick={handleDirectionToggle}>
                <ArrowLeftRight size={14} />
                <span>Switch to {direction === 'encode' ? 'Decode' : 'Encode'}</span>
              </button>
            )}
            <button className="btn btn-secondary" onClick={handleClear}>
              <Trash2 size={14} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Text Mode Grid */}
        {mode === 'text' && (
          <div className="split-pane" style={{ flexGrow: 1, minHeight: '350px' }}>
            <div className="pane-half">
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {direction === 'encode' ? 'Plain Text Input' : 'Base64 Input'}
              </label>
              <textarea
                className="textarea-control"
                placeholder={direction === 'encode' ? 'Type or paste plain text here...' : 'Paste Base64 string here...'}
                value={inputText}
                onChange={(e) => handleTextChange(e.target.value)}
                style={{ flexGrow: 1, resize: 'none' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Size: {inputText.length} chars ({formatSize(new TextEncoder().encode(inputText).length)})
              </div>
            </div>

            <div className="pane-half">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {direction === 'encode' ? 'Base64 Output' : 'Plain Text Output'}
                </label>
                <CopyButton text={outputText} />
              </div>
              <textarea
                className="textarea-control"
                placeholder="Result will appear here..."
                value={outputText}
                readOnly
                style={{ flexGrow: 1, resize: 'none', background: 'rgba(14, 11, 22, 0.4)' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Size: {outputText.length} chars ({formatSize(new TextEncoder().encode(outputText).length)})
              </div>
            </div>
          </div>
        )}

        {/* File Mode */}
        {mode === 'file' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: '2px dashed var(--border-color)',
                borderRadius: '8px',
                padding: '40px',
                textAlign: 'center',
                cursor: 'pointer',
                background: 'rgba(0, 0, 0, 0.15)',
                transition: 'border-color var(--transition-speed)'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Upload size={36} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Drag and drop any file here, or click to browse</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Images, documents, icons - maximum recommended size 5MB</p>
            </div>

            {fileData && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  padding: '12px 16px',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>{fileData.name}</strong>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      {fileData.type} • {formatSize(fileData.size)}
                    </div>
                  </div>
                  {fileData.type.startsWith('image/') && (
                    <img
                      src={fileData.dataUrl}
                      alt="Preview"
                      style={{ maxHeight: '48px', maxWidth: '80px', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                    />
                  )}
                </div>

                <div className="split-pane">
                  <div className="pane-half">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>RAW BASE64</label>
                      <CopyButton text={fileData.base64} label="Copy Raw" />
                    </div>
                    <textarea
                      className="textarea-control"
                      readOnly
                      value={fileData.base64}
                      style={{ height: '140px', fontSize: '12px', resize: 'none' }}
                    />
                  </div>

                  <div className="pane-half">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>DATA URL (HTML / CSS source)</label>
                      <CopyButton text={fileData.dataUrl} label="Copy Data URL" />
                    </div>
                    <textarea
                      className="textarea-control"
                      readOnly
                      value={fileData.dataUrl}
                      style={{ height: '140px', fontSize: '12px', resize: 'none' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Validation Errors */}
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
