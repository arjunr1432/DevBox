import React, { useState, useEffect } from 'react';
import {
  RefreshCw,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  Lock,
  Unlock,
  Plus,
  Search,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Shield,
  AlertTriangle
} from 'lucide-react';

// Web Crypto Encryption Helpers
const getBytes = (str: string) => new TextEncoder().encode(str);

const arrayBufferToBase64 = (buf: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buf);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = window.atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    getBytes(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

const encryptData = async (plainText: string, password: string): Promise<string> => {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    getBytes(plainText)
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherTextB64 = arrayBufferToBase64(encrypted);
  return `${saltHex}.${ivHex}.${cipherTextB64}`;
};

const decryptData = async (cipherTextWithMeta: string, password: string): Promise<string> => {
  const parts = cipherTextWithMeta.split('.');
  if (parts.length !== 3) throw new Error('Invalid ciphertext format');
  const [saltHex, ivHex, cipherTextB64] = parts;
  const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const key = await deriveKey(password, salt);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    base64ToArrayBuffer(cipherTextB64)
  );
  return new TextDecoder().decode(decrypted);
};

// Password Generation
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

  if (config.uppercase) { pool += upper; pwd += upper[Math.floor(Math.random() * upper.length)]; }
  if (config.lowercase) { pool += lower; pwd += lower[Math.floor(Math.random() * lower.length)]; }
  if (config.numbers)   { pool += num;   pwd += num[Math.floor(Math.random() * num.length)]; }
  if (config.symbols)   { pool += sym;   pwd += sym[Math.floor(Math.random() * sym.length)]; }

  if (pool.length === 0) return '';

  const remainingLength = length - pwd.length;
  for (let i = 0; i < remainingLength; i++) {
    pwd += pool[Math.floor(Math.random() * pool.length)];
  }

  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

interface VaultItem {
  id: string;
  website: string;
  username: string;
  password: string;
  timestamp: number;
}

const createVaultItem = (website: string, username: string, password: string): VaultItem => {
  const randomId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
  return {
    id: randomId,
    website: website.trim(),
    username: username.trim(),
    password: password,
    timestamp: Date.now()
  };
};

const calculateStrength = (password: string) => {
  if (!password) return { score: 0, label: 'Weak', class: 'weak' as const };

  let score = 0;
  const len = password.length;
  if (len >= 8)  score += 1;
  if (len >= 12) score += 1;
  if (len >= 16) score += 1;

  let typesCount = 0;
  if (/[A-Z]/.test(password))      typesCount++;
  if (/[a-z]/.test(password))      typesCount++;
  if (/[0-9]/.test(password))      typesCount++;
  if (/[^A-Za-z0-9]/.test(password)) typesCount++;
  score += typesCount;

  let label = 'Weak';
  let labelClass: 'weak' | 'medium' | 'strong' = 'weak';
  if (score >= 6) { label = 'Strong';   labelClass = 'strong'; }
  else if (score >= 4) { label = 'Moderate'; labelClass = 'medium'; }

  return { score, label, class: labelClass };
};

// Vault modal modes
type VaultModalMode = 'none' | 'setup' | 'unlock' | 'reset';

export const PasswordManager: React.FC = () => {
  // ─── Generator State ───────────────────────────────────────────────────────
  const [passLength, setPassLength] = useState(16);
  const [passConfig, setPassConfig] = useState({
    uppercase: true, lowercase: true, numbers: true, symbols: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState(() =>
    generatePassword(16, { uppercase: true, lowercase: true, numbers: true, symbols: true })
  );
  const [copyFeedbackGen, setCopyFeedbackGen] = useState(false);

  // ─── Vault State ───────────────────────────────────────────────────────────
  const [isVaultSetup, setIsVaultSetup] = useState(() => {
    try { return !!localStorage.getItem('devbox-password-verification'); }
    catch { return false; }
  });
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState('');
  const [savedPasswords, setSavedPasswords] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Modal State ──────────────────────────────────────────────────────────
  const [modalMode, setModalMode] = useState<VaultModalMode>('none');
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // ─── Save Form State ───────────────────────────────────────────────────────
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [websiteName, setWebsiteName] = useState('');
  const [username, setUsername] = useState('');
  const [savePassword, setSavePassword] = useState('');

  // ─── Item UI State ─────────────────────────────────────────────────────────
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<Record<string, 'username' | 'password' | null>>({});
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Seed save password with generated password when save form opens
  useEffect(() => {
    if (showSaveForm) {
      setSavePassword(generatedPassword);
    }
  }, [showSaveForm, generatedPassword]);

  const handleGenerate = () => {
    const pwd = generatePassword(passLength, passConfig);
    setGeneratedPassword(pwd);
  };

  const handleConfigChange = (key: 'uppercase' | 'lowercase' | 'numbers' | 'symbols') => {
    const nextConfig = { ...passConfig, [key]: !passConfig[key] };
    const activeCount = Object.values(nextConfig).filter(Boolean).length;
    if (activeCount > 0) {
      setPassConfig(nextConfig);
      setGeneratedPassword(generatePassword(passLength, nextConfig));
    }
  };

  const copyGenerated = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopyFeedbackGen(true);
    setTimeout(() => setCopyFeedbackGen(false), 2000);
  };

  // ─── Vault Auth ────────────────────────────────────────────────────────────
  const openVaultModal = () => {
    setAuthError('');
    setSetupPassword('');
    setConfirmPassword('');
    setUnlockPassword('');
    setModalMode(isVaultSetup ? 'unlock' : 'setup');
  };

  const closeModal = () => {
    setModalMode('none');
    setAuthError('');
    setSetupPassword('');
    setConfirmPassword('');
    setUnlockPassword('');
  };

  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!setupPassword) { setAuthError('Master Password is required.'); return; }
    if (setupPassword.length < 8) { setAuthError('Must be at least 8 characters.'); return; }
    if (setupPassword !== confirmPassword) { setAuthError('Passwords do not match.'); return; }

    setAuthLoading(true);
    try {
      const encryptedVerification = await encryptData('devbox-verification-token', setupPassword);
      localStorage.setItem('devbox-password-verification', encryptedVerification);
      const encryptedEmptyList = await encryptData(JSON.stringify([]), setupPassword);
      localStorage.setItem('devbox-saved-passwords', encryptedEmptyList);

      setVaultKey(setupPassword);
      setSavedPasswords([]);
      setIsVaultUnlocked(true);
      setIsVaultOpen(true);
      closeModal();
    } catch {
      setAuthError('Failed to initialize the secure vault.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!unlockPassword) { setAuthError('Please enter your Master Password.'); return; }

    setAuthLoading(true);
    try {
      const encryptedVerification = localStorage.getItem('devbox-password-verification');
      if (!encryptedVerification) { setAuthError('Vault verification missing.'); setAuthLoading(false); return; }

      const verifiedToken = await decryptData(encryptedVerification, unlockPassword);
      if (verifiedToken !== 'devbox-verification-token') {
        setAuthError('Incorrect Master Password. Please try again.');
        setAuthLoading(false);
        return;
      }

      const encryptedPasswords = localStorage.getItem('devbox-saved-passwords');
      if (encryptedPasswords) {
        const decryptedListStr = await decryptData(encryptedPasswords, unlockPassword);
        setSavedPasswords(JSON.parse(decryptedListStr));
      } else {
        setSavedPasswords([]);
      }

      setVaultKey(unlockPassword);
      setIsVaultUnlocked(true);
      setIsVaultOpen(true);
      closeModal();
    } catch {
      setAuthError('Incorrect Master Password. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLockVault = () => {
    setVaultKey('');
    setSavedPasswords([]);
    setIsVaultUnlocked(false);
    setSearchQuery('');
    setShowSaveForm(false);
  };

  // ─── Reset Vault ──────────────────────────────────────────────────────────
  const handleResetVault = () => {
    try {
      localStorage.removeItem('devbox-password-verification');
      localStorage.removeItem('devbox-saved-passwords');
    } catch { /* ignore */ }

    // Reset all vault state
    setVaultKey('');
    setSavedPasswords([]);
    setIsVaultUnlocked(false);
    setIsVaultOpen(false);
    setIsVaultSetup(false);
    setSearchQuery('');
    setShowSaveForm(false);
    setResetConfirmText('');
    closeModal();
  };


  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteName.trim()) { alert('Please enter a website name.'); return; }
    if (!savePassword)       { alert('Please enter a password to save.'); return; }

    const newItem = createVaultItem(websiteName, username, savePassword);
    const updatedList = [newItem, ...savedPasswords];

    try {
      const encryptedDataStr = await encryptData(JSON.stringify(updatedList), vaultKey);
      localStorage.setItem('devbox-saved-passwords', encryptedDataStr);
      setSavedPasswords(updatedList);
      setWebsiteName('');
      setUsername('');
      setSavePassword(generatedPassword);
      setShowSaveForm(false);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch {
      alert('Failed to securely save password to vault.');
    }
  };

  // ─── Delete Password ───────────────────────────────────────────────────────
  const handleDeletePassword = async (id: string) => {
    const updatedList = savedPasswords.filter(item => item.id !== id);
    try {
      const encryptedDataStr = await encryptData(JSON.stringify(updatedList), vaultKey);
      localStorage.setItem('devbox-saved-passwords', encryptedDataStr);
      setSavedPasswords(updatedList);
      setPendingDeleteId(null);
    } catch {
      setPendingDeleteId(null);
    }
  };

  const handleCopyToClipboard = (text: string, id: string, fieldType: 'username' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(prev => ({ ...prev, [id]: fieldType }));
    setTimeout(() => setCopyFeedback(prev => ({ ...prev, [id]: null })), 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredPasswords = savedPasswords.filter(
    item =>
      item.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const passwordStrength = calculateStrength(generatedPassword);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', overflow: 'hidden' }}>
      {/* Header */}
      <div className="tool-header" style={{ flexGrow: 0, flexShrink: 0 }}>
        <h1>Password Generator</h1>
        <p>Generate cryptographically secure passwords. Optionally save credentials to your encrypted local vault.</p>
      </div>

      {/* ── Generator Card ── */}
      <div className="tool-card" style={{ gap: '16px', flexGrow: 0, flexShrink: 0 }}>
        {/* Length Slider */}
        <div className="form-group">
          <label htmlFor="password-length">
            Length:&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>
              {passLength}
            </span>
          </label>
          <input
            id="password-length"
            type="range"
            min="8"
            max="64"
            value={passLength}
            onChange={(e) => {
              const len = parseInt(e.target.value, 10);
              setPassLength(len);
              setGeneratedPassword(generatePassword(len, passConfig));
            }}
            style={{
              width: '100%',
              accentColor: 'var(--accent)',
              cursor: 'pointer',
              height: '6px',
              borderRadius: '3px',
              background: 'var(--border-color)',
              outline: 'none'
            }}
          />
        </div>

        {/* Character Options */}
        <div className="form-group">
          <label>Character Types</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 24px', marginTop: '6px' }}>
            {(['uppercase', 'lowercase', 'numbers', 'symbols'] as const).map(key => (
              <label
                key={key}
                htmlFor={`checkbox-${key}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', fontSize: '13px',
                  color: 'var(--text-primary)', textTransform: 'none', fontWeight: 'normal'
                }}
              >
                <input
                  id={`checkbox-${key}`}
                  type="checkbox"
                  checked={passConfig[key]}
                  onChange={() => handleConfigChange(key)}
                />
                <span>
                  {key === 'uppercase' ? 'Uppercase (A–Z)' :
                   key === 'lowercase' ? 'Lowercase (a–z)' :
                   key === 'numbers'   ? 'Numbers (0–9)' :
                                         'Symbols (!@#$…)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Generated Password Output */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flexGrow: 1, margin: 0 }}>
            <label htmlFor="generated-password">Generated Password</label>
            <div style={{ display: 'flex', position: 'relative', marginTop: '6px' }}>
              <input
                id="generated-password"
                type="text"
                className="input-control"
                readOnly
                value={generatedPassword}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '15px',
                  paddingRight: '44px',
                  letterSpacing: '0.04em',
                  background: 'rgba(14, 11, 22, 0.4)'
                }}
              />
              <button
                type="button"
                onClick={copyGenerated}
                style={{
                  position: 'absolute', right: '8px', top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: copyFeedbackGen ? 'var(--success)' : 'var(--text-secondary)',
                  cursor: 'pointer', padding: '4px'
                }}
                title="Copy to clipboard"
              >
                {copyFeedbackGen
                  ? <Check size={15} className="fade-in" />
                  : <Copy size={15} />}
              </button>
            </div>
          </div>
          <button
            className="btn btn-secondary"
            onClick={handleGenerate}
            style={{ height: '40px', padding: '10px 14px', flexShrink: 0 }}
            title="Regenerate"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Strength Bar */}
        {generatedPassword && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Security Strength</span>
              <span style={{
                fontWeight: 700,
                color: passwordStrength.class === 'strong'
                  ? 'var(--success)'
                  : passwordStrength.class === 'medium'
                  ? 'var(--warning)'
                  : 'var(--error)'
              }}>
                {passwordStrength.label}
              </span>
            </div>
            <div className="strength-bar-container">
              <div
                className={`strength-bar ${passwordStrength.class}`}
                style={{ width: `${(passwordStrength.score / 7) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Vault Section ── */}
      <div className="tool-card" style={{ gap: 0, padding: 0, overflow: 'hidden', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Vault Header / Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            cursor: 'pointer',
            borderBottom: isVaultOpen ? '1px solid var(--border-color)' : 'none',
            userSelect: 'none'
          }}
          onClick={() => {
            if (!isVaultUnlocked) {
              if (isVaultOpen) {
                setIsVaultOpen(false);
              } else {
                openVaultModal();
              }
            } else {
              setIsVaultOpen(prev => !prev);
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: isVaultUnlocked ? 'rgba(34, 197, 94, 0.12)' : 'rgba(168, 85, 247, 0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isVaultUnlocked ? 'var(--success)' : 'var(--accent)'
            }}>
              {isVaultUnlocked ? <Unlock size={15} /> : <Lock size={15} />}
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                Encrypted Vault
                {isVaultUnlocked && (
                  <span style={{
                    marginLeft: '8px', fontSize: '11px', fontWeight: 600,
                    color: 'var(--success)', background: 'rgba(34,197,94,0.1)',
                    padding: '2px 8px', borderRadius: '20px'
                  }}>
                    Unlocked • {savedPasswords.length} {savedPasswords.length === 1 ? 'entry' : 'entries'}
                  </span>
                )}
                {!isVaultUnlocked && !isVaultSetup && (
                  <span style={{
                    marginLeft: '8px', fontSize: '11px', fontWeight: 600,
                    color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)',
                    padding: '2px 8px', borderRadius: '20px'
                  }}>
                    Not set up
                  </span>
                )}
                {!isVaultUnlocked && isVaultSetup && (
                  <span style={{
                    marginLeft: '8px', fontSize: '11px', fontWeight: 600,
                    color: 'var(--accent)', background: 'rgba(168,85,247,0.1)',
                    padding: '2px 8px', borderRadius: '20px'
                  }}>
                    Locked
                  </span>
                )}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                {isVaultUnlocked
                  ? 'Click to expand / collapse'
                  : 'AES-256 encrypted • Click to unlock'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isVaultUnlocked && (
              <button
                className="btn btn-secondary"
                onClick={(e) => { e.stopPropagation(); handleLockVault(); }}
                style={{ fontSize: '12px', padding: '5px 10px', gap: '5px', height: 'auto' }}
              >
                <Lock size={12} />
                <span>Lock</span>
              </button>
            )}
            {isVaultOpen ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
          </div>
        </div>

        {/* Vault Body (visible when open & unlocked) */}
        {isVaultOpen && isVaultUnlocked && (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>

            {/* ── Toolbar Row: Search + Add button ── */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderBottom: '1px solid var(--border-color)',
              background: 'rgba(0,0,0,0.1)',
              flexShrink: 0
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: 1 }}>
                <Search
                  size={13}
                  style={{ position: 'absolute', left: '9px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}
                />
                <input
                  type="text"
                  placeholder="Search…"
                  className="input-control"
                  style={{ paddingLeft: '28px', height: '32px', fontSize: '12px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Add / Saved feedback button */}
              <button
                className={saveFeedback ? 'btn btn-secondary' : 'btn btn-primary'}
                onClick={() => setShowSaveForm(prev => !prev)}
                style={{ height: '32px', fontSize: '12px', gap: '5px', flexShrink: 0, padding: '0 12px' }}
              >
                {saveFeedback
                  ? <><Check size={12} style={{ color: 'var(--success)' }} /><span>Saved!</span></>
                  : showSaveForm
                  ? <><X size={12} /><span>Cancel</span></>
                  : <><Plus size={12} /><span>Add</span></>}
              </button>
            </div>

            {/* ── Inline Save Form (slides in under toolbar) ── */}
            {showSaveForm && (
              <form
                onSubmit={handleSavePassword}
                style={{
                  padding: '12px 18px',
                  borderBottom: '1px solid var(--border-color)',
                  background: 'rgba(168, 85, 247, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  flexShrink: 0
                }}
              >
                {/* Row 1: Website + Username */}
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                      Website *
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="e.g. github.com"
                      value={websiteName}
                      onChange={(e) => setWebsiteName(e.target.value)}
                      required
                      autoFocus
                      style={{ height: '34px', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                      Username / Email
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Optional"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{ height: '34px', fontSize: '13px' }}
                    />
                  </div>
                </div>

                {/* Row 2: Password + Save button */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '4px' }}>
                      Password
                    </label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Password"
                      value={savePassword}
                      onChange={(e) => setSavePassword(e.target.value)}
                      required
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', height: '34px' }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ height: '34px', fontSize: '13px', gap: '6px', flexShrink: 0, padding: '0 16px' }}
                  >
                    <ShieldCheck size={13} />
                    <span>Save</span>
                  </button>
                </div>
              </form>
            )}

            {/* ── Password List ── */}
            <div style={{
              overflowY: 'auto',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0'
            }}>
              {filteredPasswords.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                  <Shield size={26} style={{ opacity: 0.25, display: 'block', margin: '0 auto 8px' }} />
                  {searchQuery ? 'No matches found.' : 'No saved passwords yet. Hit Add to save one!'}
                </div>
              ) : (
                filteredPasswords.map((item, idx) => {
                  const isVisible = visiblePasswords[item.id] || false;
                  const cFeedback = copyFeedback[item.id];
                  return (
                    <div
                      key={item.id}
                      className="vault-item"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto auto',
                        alignItems: 'center',
                        gap: '0 8px',
                        padding: '10px 18px',
                        borderBottom: idx < filteredPasswords.length - 1
                          ? '1px solid var(--border-color)'
                          : 'none',
                        transition: 'background 0.15s'
                      }}
                    >
                      {/* Site + Username */}
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.website}
                        </div>
                        {item.username && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                            {item.username}
                          </div>
                        )}
                      </div>

                      {/* Masked password */}
                      <div style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '13px',
                        letterSpacing: isVisible ? 'normal' : '3px',
                        color: isVisible ? 'var(--text-secondary)' : 'var(--text-muted)',
                        maxWidth: '160px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        background: 'rgba(0,0,0,0.15)',
                        padding: '3px 8px',
                        borderRadius: '5px',
                        border: '1px solid rgba(255,255,255,0.04)',
                        userSelect: isVisible ? 'text' : 'none'
                      }}>
                        {isVisible ? item.password : '••••••••'}
                      </div>

                      {/* Action icons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        {/* Copy username (if exists) */}
                        {item.username && (
                          <button
                            type="button"
                            onClick={() => handleCopyToClipboard(item.username, item.id, 'username')}
                            style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', borderRadius: '4px' }}
                            title="Copy username"
                          >
                            {cFeedback === 'username' ? <Check size={12} style={{ color: 'var(--success)' }} /> : <Copy size={12} />}
                          </button>
                        )}
                        {/* Show/hide */}
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility(item.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--text-muted)', display: 'flex', borderRadius: '4px' }}
                          title={isVisible ? 'Hide password' : 'Show password'}
                        >
                          {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                        {/* Copy password */}
                        <button
                          type="button"
                          onClick={() => handleCopyToClipboard(item.password, item.id, 'password')}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '5px', color: 'var(--text-muted)', display: 'flex', borderRadius: '4px' }}
                          title="Copy password"
                        >
                          {cFeedback === 'password' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                        </button>
                        {/* Delete / Inline Confirm */}
                        {pendingDeleteId === item.id ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPendingDeleteId(null)}
                              style={{
                                background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                                cursor: 'pointer', padding: '3px 8px', color: 'var(--text-muted)',
                                display: 'flex', borderRadius: '4px', fontSize: '11px', alignItems: 'center', gap: '3px'
                              }}
                              title="Cancel"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePassword(item.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239,68,68,0.4)',
                                cursor: 'pointer', padding: '3px 8px', color: 'var(--error)',
                                display: 'flex', borderRadius: '4px', fontSize: '11px', alignItems: 'center', gap: '3px',
                                fontWeight: 600
                              }}
                              title="Confirm delete"
                            >
                              <Trash2 size={11} />
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingDeleteId(item.id)}
                            style={{ background: 'none', border: 'none', padding: '5px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', borderRadius: '4px' }}
                            className="favorite-action-btn"
                            title="Delete"
                          >
                            <Trash2 size={13} style={{ color: 'var(--error)' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── Auth Modal ── */}
      {modalMode !== 'none' && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px'
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: modalMode === 'reset'
                    ? 'rgba(239, 68, 68, 0.12)'
                    : 'rgba(168, 85, 247, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: modalMode === 'reset' ? 'var(--error)' : 'var(--accent)'
                }}>
                  {modalMode === 'setup'
                    ? <Shield size={20} />
                    : modalMode === 'reset'
                    ? <AlertTriangle size={20} />
                    : <Lock size={20} />}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {modalMode === 'setup'
                      ? 'Create Vault'
                      : modalMode === 'reset'
                      ? 'Reset Vault'
                      : 'Unlock Vault'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {modalMode === 'setup'
                      ? 'Protect your passwords with a master key'
                      : modalMode === 'reset'
                      ? 'This action is permanent and irreversible'
                      : 'Enter your master password to continue'}
                  </div>
                </div>
              </div>
              <button
                onClick={closeModal}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Setup Form */}
            {modalMode === 'setup' && (
              <form onSubmit={handleSetupVault} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Master Password</label>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="Min. 8 characters"
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Confirm Master Password</label>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                {authError && (
                  <div className="feedback-box error">{authError}</div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '42px', marginTop: '4px', gap: '8px' }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Creating…' : <><ShieldCheck size={15} /><span>Create Secure Vault</span></>}
                </button>
              </form>
            )}

            {/* Unlock Form */}
            {modalMode === 'unlock' && (
              <form onSubmit={handleUnlockVault} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Master Password</label>
                  <input
                    type="password"
                    className="input-control"
                    placeholder="Enter Master Password"
                    value={unlockPassword}
                    onChange={(e) => setUnlockPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                {authError && (
                  <div className="feedback-box error">{authError}</div>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', height: '42px', marginTop: '4px', gap: '8px' }}
                  disabled={authLoading}
                >
                  {authLoading ? 'Decrypting…' : <><Unlock size={15} /><span>Unlock Vault</span></>}
                </button>
                <div style={{ textAlign: 'center', paddingTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => { setAuthError(''); setResetConfirmText(''); setModalMode('reset'); }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '12px', color: 'var(--text-muted)',
                      textDecoration: 'underline', textUnderlineOffset: '3px'
                    }}
                  >
                    Forgot password? Reset vault
                  </button>
                </div>
              </form>
            )}

            {/* Reset Vault Form */}
            {modalMode === 'reset' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <AlertTriangle size={18} style={{ color: 'var(--error)', flexShrink: 0, marginTop: '1px' }} />
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <strong style={{ color: 'var(--error)', display: 'block', marginBottom: '4px' }}>This will permanently delete your vault.</strong>
                    All saved passwords will be erased and cannot be recovered. You will be able to create a new vault afterwards.
                  </div>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label style={{ fontSize: '12px' }}>Type <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--error)', letterSpacing: '0.05em' }}>RESET</strong> to confirm</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Type RESET here"
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    autoFocus
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => { setModalMode('unlock'); setResetConfirmText(''); }}
                    style={{ flex: 1, height: '40px', fontSize: '13px' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleResetVault}
                    disabled={resetConfirmText !== 'RESET'}
                    style={{
                      flex: 1, height: '40px', fontSize: '13px',
                      background: resetConfirmText === 'RESET' ? 'var(--error)' : 'rgba(239,68,68,0.2)',
                      color: resetConfirmText === 'RESET' ? '#fff' : 'rgba(239,68,68,0.5)',
                      border: 'none', borderRadius: '8px',
                      cursor: resetConfirmText === 'RESET' ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      transition: 'all 0.2s',
                      fontWeight: 600
                    }}
                  >
                    <Trash2 size={14} />
                    Delete & Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
