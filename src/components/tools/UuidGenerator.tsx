import React, { useState } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { RefreshCw, Layers } from 'lucide-react';

const generateUUID = (uppercase = false, hyphens = true): string => {
  let uuid: string;
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    uuid = crypto.randomUUID();
  } else {
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
  if (!hyphens) {
    uuid = uuid.replace(/-/g, '');
  }
  return uppercase ? uuid.toUpperCase() : uuid.toLowerCase();
};

export const UuidGenerator: React.FC = () => {
  // UUID States
  const [uuidCount, setUuidCount] = useState(5);
  const [uuidUppercase, setUuidUppercase] = useState(false);
  const [uuidHyphens, setUuidHyphens] = useState(true);
  
  // Initialize with 5 UUIDs directly to avoid useEffect mount warning
  const [uuidOutput, setUuidOutput] = useState(() => {
    const list: string[] = [];
    for (let i = 0; i < 5; i++) {
      list.push(generateUUID(false, true));
    }
    return list.join('\n');
  });

  // Generate UUID batch
  const handleGenerateUUIDs = () => {
    const list: string[] = [];
    const count = Math.max(1, Math.min(100, uuidCount));
    for (let i = 0; i < count; i++) {
      list.push(generateUUID(uuidUppercase, uuidHyphens));
    }
    setUuidOutput(list.join('\n'));
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>UUID Generator</h1>
        <p>Batch generate cryptographically secure UUID v4 tokens.</p>
      </div>

      <div className="tool-card" style={{ gap: '16px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px', gap: '4px' }}>
          <div
            style={{
              borderBottom: '2px solid var(--accent)',
              color: 'var(--text-primary)',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} />
            <span>UUID Generator</span>
          </div>
        </div>

        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ width: '120px' }}>
              <label>Batch Count</label>
              <input
                type="number"
                className="input-control"
                value={uuidCount}
                onChange={(e) => setUuidCount(parseInt(e.target.value, 10) || 1)}
                min="1"
                max="100"
              />
            </div>

            {/* Toggles */}
            <div className="form-group" style={{ flexGrow: 1, minWidth: '200px' }}>
              <label>Options</label>
              <div style={{ display: 'flex', gap: '16px', height: '40px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                  <input type="checkbox" checked={uuidUppercase} onChange={() => setUuidUppercase(!uuidUppercase)} />
                  <span>Uppercase</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                  <input type="checkbox" checked={uuidHyphens} onChange={() => setUuidHyphens(!uuidHyphens)} />
                  <span>Use Hyphens</span>
                </label>
              </div>
            </div>

            <button className="btn btn-primary" onClick={handleGenerateUUIDs} style={{ height: '40px' }}>
              <RefreshCw size={14} />
              <span>Generate</span>
            </button>
          </div>

          {/* Output */}
          <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Generated UUIDs</label>
              <CopyButton text={uuidOutput} />
            </div>
            <textarea
              className="textarea-control"
              readOnly
              value={uuidOutput}
              placeholder="No UUIDs generated yet."
              style={{ flexGrow: 1, resize: 'none', height: '220px', minHeight: '180px', background: 'rgba(14, 11, 22, 0.4)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
