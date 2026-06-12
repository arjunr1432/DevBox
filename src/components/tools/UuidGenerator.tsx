import React, { useState, useEffect } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { KeyRound, RefreshCw, Layers } from 'lucide-react';

const generateUUID = (uppercase = false, hyphens = true): string => {
  let uuid = '';
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

const generatePassword = (
  length: number,
  config: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }
): string => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const num = '0123456789';
  const sym = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let pool = '';
  let pwd = '';

  // Ensure at least one character from each selected set is included
  if (config.uppercase) {
    pool += upper;
    pwd += upper[Math.floor(Math.random() * upper.length)];
  }
  if (config.lowercase) {
    pool += lower;
    pwd += lower[Math.floor(Math.random() * lower.length)];
  }
  if (config.numbers) {
    pool += num;
    pwd += num[Math.floor(Math.random() * num.length)];
  }
  if (config.symbols) {
    pool += sym;
    pwd += sym[Math.floor(Math.random() * sym.length)];
  }

  if (pool.length === 0) return '';

  const remainingLength = length - pwd.length;
  for (let i = 0; i < remainingLength; i++) {
    pwd += pool[Math.floor(Math.random() * pool.length)];
  }

  // Shuffle the password
  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

export const UuidGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'uuid' | 'password'>('uuid');

  // UUID States
  const [uuidCount, setUuidCount] = useState(5);
  const [uuidUppercase, setUuidUppercase] = useState(false);
  const [uuidHyphens, setUuidHyphens] = useState(true);
  const [uuidOutput, setUuidOutput] = useState('');

  // Password States
  const [passLength, setPassLength] = useState(16);
  const [passConfig, setPassConfig] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [passwordOutput, setPasswordOutput] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    label: string;
    class: 'weak' | 'medium' | 'strong';
  }>({ score: 0, label: 'Weak', class: 'weak' });

  // Generate UUID batch
  const handleGenerateUUIDs = () => {
    const list: string[] = [];
    const count = Math.max(1, Math.min(100, uuidCount));
    for (let i = 0; i < count; i++) {
      list.push(generateUUID(uuidUppercase, uuidHyphens));
    }
    setUuidOutput(list.join('\n'));
  };

  // Generate Password
  const handleGeneratePassword = () => {
    const pwd = generatePassword(passLength, passConfig);
    setPasswordOutput(pwd);
  };

  // Run on mount
  useEffect(() => {
    handleGenerateUUIDs();
    handleGeneratePassword();
  }, []);

  // Update password strength
  useEffect(() => {
    if (!passwordOutput) {
      setPasswordStrength({ score: 0, label: 'Weak', class: 'weak' });
      return;
    }

    let score = 0;
    const len = passwordOutput.length;

    // Length points
    if (len >= 8) score += 1;
    if (len >= 12) score += 1;
    if (len >= 16) score += 1;

    // Diversity points
    let typesCount = 0;
    if (/[A-Z]/.test(passwordOutput)) typesCount++;
    if (/[a-z]/.test(passwordOutput)) typesCount++;
    if (/[0-9]/.test(passwordOutput)) typesCount++;
    if (/[^A-Za-z0-9]/.test(passwordOutput)) typesCount++;

    score += typesCount;

    let label = 'Weak';
    let labelClass: 'weak' | 'medium' | 'strong' = 'weak';

    if (score >= 6) {
      label = 'Strong';
      labelClass = 'strong';
    } else if (score >= 4) {
      label = 'Moderate';
      labelClass = 'medium';
    }

    setPasswordStrength({
      score,
      label,
      class: labelClass,
    });
  }, [passwordOutput]);

  const handleConfigChange = (key: 'uppercase' | 'lowercase' | 'numbers' | 'symbols') => {
    const nextConfig = { ...passConfig, [key]: !passConfig[key] };
    // Prevent deselecting all configs
    const activeCount = Object.values(nextConfig).filter(Boolean).length;
    if (activeCount > 0) {
      setPassConfig(nextConfig);
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>UUID & Random Password Generator</h1>
        <p>Batch generate cryptographically secure UUID v4 tokens, or construct customizable password keys.</p>
      </div>

      <div className="tool-card" style={{ gap: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '2px', gap: '4px' }}>
          <button
            onClick={() => setActiveTab('uuid')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'uuid' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'uuid' ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={14} />
            <span>UUID Generator</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'password' ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === 'password' ? 'var(--text-primary)' : 'var(--text-secondary)',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <KeyRound size={14} />
            <span>Password Generator</span>
          </button>
        </div>

        {/* UUID Generator Panel */}
        {activeTab === 'uuid' && (
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
        )}

        {/* Password Generator Panel */}
        {activeTab === 'password' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px', flexGrow: 1 }}>
            <div className="split-pane">
              {/* Configuration panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Password Length: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>{passLength}</span></label>
                  <input
                    type="range"
                    min="6"
                    max="64"
                    value={passLength}
                    onChange={(e) => setPassLength(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: '6px', borderRadius: '3px', background: 'var(--border-color)', outline: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label>Characters</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                      <input type="checkbox" checked={passConfig.uppercase} onChange={() => handleConfigChange('uppercase')} />
                      <span>Uppercase Letters (A-Z)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                      <input type="checkbox" checked={passConfig.lowercase} onChange={() => handleConfigChange('lowercase')} />
                      <span>Lowercase Letters (a-z)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                      <input type="checkbox" checked={passConfig.numbers} onChange={() => handleConfigChange('numbers')} />
                      <span>Numbers (0-9)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                      <input type="checkbox" checked={passConfig.symbols} onChange={() => handleConfigChange('symbols')} />
                      <span>Symbols (!@#$%^...)</span>
                    </label>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={handleGeneratePassword} style={{ marginTop: '4px' }}>
                  <RefreshCw size={14} />
                  <span>Generate Password</span>
                </button>
              </div>

              {/* Output & Strength panel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label>Generated Password</label>
                    <CopyButton text={passwordOutput} />
                  </div>
                  <input
                    type="text"
                    className="input-control"
                    readOnly
                    value={passwordOutput}
                    style={{
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(14, 11, 22, 0.4)',
                      border: '1px solid var(--border-color)',
                      marginTop: '4px',
                      fontSize: '15px',
                    }}
                    placeholder="Click generate"
                  />
                </div>

                {passwordOutput && (
                  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Password Strength</span>
                      <span style={{
                        fontWeight: 700,
                        color: passwordStrength.class === 'strong' ? 'var(--success)' : passwordStrength.class === 'medium' ? 'var(--warning)' : 'var(--error)'
                      }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    {/* Strength Bar */}
                    <div className="strength-bar-container">
                      <div
                        className={`strength-bar ${passwordStrength.class}`}
                        style={{ width: `${(passwordStrength.score / 7) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
