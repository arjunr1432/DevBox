import React, { useState } from 'react';
import {
  KeyRound,
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
  Check
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

  return pwd.split('').sort(() => Math.random() - 0.5).join('');
};

interface VaultItem {
  id: string;
  website: string;
  username: string;
  password: string;
  timestamp: number;
}

// Factory helper outside the component to keep rendering pure from Date/Math.random (resolves react-hooks/purity lint)
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

// Password strength calculator outside the component (resolves react-hooks/set-state-in-effect lint)
const calculateStrength = (password: string) => {
  if (!password) {
    return { score: 0, label: 'Weak', class: 'weak' as const };
  }

  let score = 0;
  const len = password.length;

  if (len >= 8) score += 1;
  if (len >= 12) score += 1;
  if (len >= 16) score += 1;

  let typesCount = 0;
  if (/[A-Z]/.test(password)) typesCount++;
  if (/[a-z]/.test(password)) typesCount++;
  if (/[0-9]/.test(password)) typesCount++;
  if (/[^A-Za-z0-9]/.test(password)) typesCount++;

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

  return {
    score,
    label,
    class: labelClass,
  };
};

export const PasswordManager: React.FC = () => {
  // Vault state
  const [isVaultSetup, setIsVaultSetup] = useState(() => {
    try {
      return !!localStorage.getItem('devbox-password-verification');
    } catch {
      return false;
    }
  });
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [vaultKey, setVaultKey] = useState('');
  
  // Input fields for unlock / setup
  const [setupPassword, setSetupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Unlocked state variables
  const [savedPasswords, setSavedPasswords] = useState<VaultItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Generator State
  const [passLength, setPassLength] = useState(16);
  const [passConfig, setPassConfig] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Save State
  const [websiteName, setWebsiteName] = useState('');
  const [username, setUsername] = useState('');
  const [customPassword, setCustomPassword] = useState('');

  // UI state feedback
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});
  const [copyFeedback, setCopyFeedback] = useState<Record<string, 'username' | 'password' | 'general' | null>>({});

  const handleGenerate = () => {
    const pwd = generatePassword(passLength, passConfig);
    setGeneratedPassword(pwd);
    setCustomPassword(pwd);
  };

  const handleConfigChange = (key: 'uppercase' | 'lowercase' | 'numbers' | 'symbols') => {
    const nextConfig = { ...passConfig, [key]: !passConfig[key] };
    const activeCount = Object.values(nextConfig).filter(Boolean).length;
    if (activeCount > 0) {
      setPassConfig(nextConfig);
      const pwd = generatePassword(passLength, nextConfig);
      setGeneratedPassword(pwd);
      setCustomPassword(pwd);
    }
  };

  // Master password setup
  const handleSetupVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!setupPassword) {
      setAuthError('Master Password is required.');
      return;
    }
    if (setupPassword.length < 8) {
      setAuthError('Master Password must be at least 8 characters long.');
      return;
    }
    if (setupPassword !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    try {
      // Encrypt verification token using master password
      const verificationVal = 'devbox-verification-token';
      const encryptedVerification = await encryptData(verificationVal, setupPassword);
      localStorage.setItem('devbox-password-verification', encryptedVerification);

      // Create an empty encrypted passwords list
      const encryptedEmptyList = await encryptData(JSON.stringify([]), setupPassword);
      localStorage.setItem('devbox-saved-passwords', encryptedEmptyList);

      setVaultKey(setupPassword);
      setSavedPasswords([]);
      setIsVaultUnlocked(true);
      setIsVaultSetup(true);
      setSetupPassword('');
      setConfirmPassword('');
      
      // Seed initial password
      const pwd = generatePassword(passLength, passConfig);
      setGeneratedPassword(pwd);
      setCustomPassword(pwd);
    } catch {
      setAuthError('Failed to initialize the secure vault.');
    }
  };

  // Master password unlock
  const handleUnlockVault = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!unlockPassword) {
      setAuthError('Please enter your Master Password.');
      return;
    }

    try {
      const encryptedVerification = localStorage.getItem('devbox-password-verification');
      if (!encryptedVerification) {
        setAuthError('Vault verification missing. Resetting vault is required.');
        return;
      }

      // Verify master password
      const verifiedToken = await decryptData(encryptedVerification, unlockPassword);
      if (verifiedToken !== 'devbox-verification-token') {
        setAuthError('Incorrect Master Password. Please try again.');
        return;
      }

      // Load and decrypt passwords
      const encryptedPasswords = localStorage.getItem('devbox-saved-passwords');
      if (encryptedPasswords) {
        const decryptedListStr = await decryptData(encryptedPasswords, unlockPassword);
        setSavedPasswords(JSON.parse(decryptedListStr));
      } else {
        setSavedPasswords([]);
      }

      setVaultKey(unlockPassword);
      setIsVaultUnlocked(true);
      setUnlockPassword('');

      // Seed initial password
      const pwd = generatePassword(passLength, passConfig);
      setGeneratedPassword(pwd);
      setCustomPassword(pwd);
    } catch {
      setAuthError('Incorrect Master Password. Please try again.');
    }
  };

  // Lock vault
  const handleLockVault = () => {
    setVaultKey('');
    setSavedPasswords([]);
    setIsVaultUnlocked(false);
    setSearchQuery('');
    setWebsiteName('');
    setUsername('');
    setCustomPassword('');
    setGeneratedPassword('');
  };

  // Save new password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteName.trim()) {
      alert('Please enter a website name.');
      return;
    }
    if (!customPassword) {
      alert('Please enter or generate a password to save.');
      return;
    }

    const newItem = createVaultItem(websiteName, username, customPassword);
    const updatedList = [newItem, ...savedPasswords];

    try {
      const encryptedDataStr = await encryptData(JSON.stringify(updatedList), vaultKey);
      localStorage.setItem('devbox-saved-passwords', encryptedDataStr);
      setSavedPasswords(updatedList);

      // Reset form fields
      setWebsiteName('');
      setUsername('');
      handleGenerate(); // Generate a new one for next usage
      
      // Temporary success animation feedback
      showCopyFeedback('save-btn', 'general');
    } catch {
      alert('Failed to securely save password to vault.');
    }
  };

  // Delete password
  const handleDeletePassword = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this saved password?')) {
      return;
    }

    const updatedList = savedPasswords.filter(item => item.id !== id);

    try {
      const encryptedDataStr = await encryptData(JSON.stringify(updatedList), vaultKey);
      localStorage.setItem('devbox-saved-passwords', encryptedDataStr);
      setSavedPasswords(updatedList);
    } catch {
      alert('Failed to update vault after deletion.');
    }
  };

  // Copy to clipboard with success check mark
  const handleCopyToClipboard = (text: string, id: string, fieldType: 'username' | 'password' | 'general') => {
    navigator.clipboard.writeText(text);
    showCopyFeedback(id, fieldType);
  };

  const showCopyFeedback = (id: string, fieldType: 'username' | 'password' | 'general') => {
    setCopyFeedback(prev => ({ ...prev, [id]: fieldType }));
    setTimeout(() => {
      setCopyFeedback(prev => ({ ...prev, [id]: null }));
    }, 2000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter passwords
  const filteredPasswords = savedPasswords.filter(
    item =>
      item.website.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute password strength on the fly (pure rendering)
  const currentPassword = customPassword || generatedPassword;
  const passwordStrength = calculateStrength(currentPassword);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Password Generator & Vault</h1>
          <p>Generate highly secure keys and store credentials locally with military-grade AES-256 encryption.</p>
        </div>
        {isVaultUnlocked && (
          <button className="btn btn-secondary" onClick={handleLockVault} style={{ gap: '6px' }}>
            <Lock size={14} />
            <span>Lock Vault</span>
          </button>
        )}
      </div>

      {/* 1. Setup Master Password Screen */}
      {!isVaultUnlocked && !isVaultSetup && (
        <div className="tool-card" style={{ maxWidth: '480px', margin: '40px auto 0', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent)', marginBottom: '12px' }}>
              <ShieldCheck size={36} />
            </div>
            <h2>Create Your Master Password</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.4 }}>
              To securely lock your passwords, choose a strong master password. All vault items will be encrypted on your device. Without this password, your vault cannot be recovered.
            </p>
          </div>

          <form onSubmit={handleSetupVault} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label>Master Password</label>
              <input
                type="password"
                className="input-control"
                placeholder="Enter strong password (min 8 chars)"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
              />
            </div>
            <div className="form-group">
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
              <div className="feedback-box error">
                {authError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '40px', marginTop: '4px' }}>
              Create Secure Vault
            </button>
          </form>
        </div>
      )}

      {/* 2. Unlock Vault Screen */}
      {!isVaultUnlocked && isVaultSetup && (
        <div className="tool-card" style={{ maxWidth: '440px', margin: '60px auto 0', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--accent)', marginBottom: '12px' }}>
              <Lock size={32} />
            </div>
            <h2>Vault is Locked</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Enter your Master Password to decrypt and view saved credentials.
            </p>
          </div>

          <form onSubmit={handleUnlockVault} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
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
              <div className="feedback-box error">
                {authError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '40px', marginTop: '4px', gap: '8px' }}>
              <Unlock size={15} />
              <span>Unlock Vault</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. Unlocked Workspace */}
      {isVaultUnlocked && (
        <div className="tool-card" style={{ gap: '16px', flexGrow: 1, overflow: 'hidden' }}>
          <div className="split-pane" style={{ height: '100%' }}>
            
            {/* Left Pane - Generator and Save Form */}
            <div className="pane-half" style={{ borderRight: '1px solid var(--border-color)', paddingRight: '20px', overflowY: 'auto' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                <KeyRound size={16} style={{ color: 'var(--accent)' }} />
                <span>Password Generator</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label>Length: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)' }}>{passLength}</span></label>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={passLength}
                    onChange={(e) => {
                      const len = parseInt(e.target.value, 10);
                      setPassLength(len);
                      const pwd = generatePassword(len, passConfig);
                      setGeneratedPassword(pwd);
                      setCustomPassword(pwd);
                    }}
                    style={{ width: '100%', accentColor: 'var(--accent)', cursor: 'pointer', height: '6px', borderRadius: '3px', background: 'var(--border-color)', outline: 'none' }}
                  />
                </div>

                <div className="form-group">
                  <label>Characters</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 20px', marginTop: '4px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                      <input type="checkbox" checked={passConfig.uppercase} onChange={() => handleConfigChange('uppercase')} />
                      <span>Uppercase (A-Z)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                      <input type="checkbox" checked={passConfig.lowercase} onChange={() => handleConfigChange('lowercase')} />
                      <span>Lowercase (a-z)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                      <input type="checkbox" checked={passConfig.numbers} onChange={() => handleConfigChange('numbers')} />
                      <span>Numbers (0-9)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)', textTransform: 'none' }}>
                      <input type="checkbox" checked={passConfig.symbols} onChange={() => handleConfigChange('symbols')} />
                      <span>Symbols (!@#$...)</span>
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '4px' }}>
                  <div className="form-group" style={{ flexGrow: 1 }}>
                    <label>Generated Password</label>
                    <div style={{ display: 'flex', position: 'relative', marginTop: '4px' }}>
                      <input
                        type="text"
                        className="input-control"
                        readOnly
                        value={generatedPassword}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', paddingRight: '40px', background: 'rgba(14, 11, 22, 0.4)' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyToClipboard(generatedPassword, 'gen-pwd', 'general')}
                        style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px' }}
                        title="Copy to clipboard"
                      >
                        {copyFeedback['gen-pwd'] === 'general' ? <Check size={14} className="fade-in" style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <button className="btn btn-secondary" onClick={handleGenerate} style={{ height: '40px', padding: '10px 12px' }} title="Generate new password">
                    <RefreshCw size={14} />
                  </button>
                </div>

                {generatedPassword && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Security Strength</span>
                      <span style={{ fontWeight: 700, color: passwordStrength.class === 'strong' ? 'var(--success)' : passwordStrength.class === 'medium' ? 'var(--warning)' : 'var(--error)' }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="strength-bar-container">
                      <div className={`strength-bar ${passwordStrength.class}`} style={{ width: `${(passwordStrength.score / 7) * 100}%` }}></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Save Form */}
              <form onSubmit={handleSavePassword} style={{ borderTop: '1px solid var(--border-color)', marginTop: '20px', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Plus size={14} />
                  <span>Save Password to Vault</span>
                </h4>

                <div className="form-group">
                  <label>Website Name / Service</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. github.com, google.com"
                    value={websiteName}
                    onChange={(e) => setWebsiteName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Username / Email (Optional)</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. user@email.com, user14"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Password to Save</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="Password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', height: '40px', marginTop: '6px', gap: '8px' }}>
                  {copyFeedback['save-btn'] === 'general' ? (
                    <>
                      <Check size={14} />
                      <span>Saved Successfully!</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} />
                      <span>Save Password Securely</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Pane - Saved Passwords Vault */}
            <div className="pane-half" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                  <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
                  <span>Encrypted Vault ({savedPasswords.length})</span>
                </h3>
              </div>

              {/* Vault Search */}
              <div style={{ position: 'relative', marginBottom: '12px' }}>
                <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                <input
                  type="text"
                  placeholder="Search websites or usernames..."
                  className="input-control"
                  style={{ paddingLeft: '32px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Vault Items List */}
              <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                {filteredPasswords.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    {searchQuery ? 'No matching vault items found.' : 'Your secure password vault is empty.'}
                  </div>
                ) : (
                  filteredPasswords.map(item => {
                    const isVisible = visiblePasswords[item.id] || false;
                    const cFeedback = copyFeedback[item.id];
                    return (
                      <div
                        key={item.id}
                        className="vault-item"
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '8px',
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{item.website}</div>
                            {item.username && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>{item.username}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyToClipboard(item.username, item.id, 'username')}
                                  style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center' }}
                                  title="Copy username"
                                >
                                  {cFeedback === 'username' ? <Check size={11} style={{ color: 'var(--success)' }} /> : <Copy size={11} />}
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <button
                            onClick={() => handleDeletePassword(item.id)}
                            style={{ background: 'none', border: 'none', padding: '4px', cursor: 'pointer', color: 'var(--text-muted)' }}
                            className="favorite-action-btn"
                            title="Delete credentials"
                          >
                            <Trash2 size={13} style={{ color: 'var(--error)' }} />
                          </button>
                        </div>

                        {/* Password block */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(0, 0, 0, 0.15)',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            border: '1px solid rgba(255,255,255,0.03)'
                          }}
                        >
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', letterSpacing: isVisible ? 'normal' : '4px', color: isVisible ? 'var(--text-primary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                            {isVisible ? item.password : '••••••••••••'}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(item.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-secondary)' }}
                              title={isVisible ? 'Hide password' : 'View password'}
                            >
                              {isVisible ? <EyeOff size={13} /> : <Eye size={13} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyToClipboard(item.password, item.id, 'password')}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', color: 'var(--text-secondary)' }}
                              title="Copy password"
                            >
                              {cFeedback === 'password' ? <Check size={13} style={{ color: 'var(--success)' }} /> : <Copy size={13} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
