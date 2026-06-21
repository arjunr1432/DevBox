import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Copy, Wifi, User, Globe, CheckCircle, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';

type QrTab = 'text' | 'wifi' | 'vcard';

export const QrCodeGenerator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<QrTab>('text');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // General Text/URL State
  const [textInput, setTextInput] = useState('https://github.com/arjunr1432/DevBox');

  // Wi-Fi State
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);

  // vCard State
  const [vcardFirst, setVcardFirst] = useState('');
  const [vcardLast, setVcardLast] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');
  const [vcardUrl, setVcardUrl] = useState('');

  // Styling options
  const [fgColor, setFgColor] = useState('#000000');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [size, setSize] = useState<number>(256);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');

  // Helper to compile the raw text to encode
  const getPayload = useCallback((): string => {
    if (activeTab === 'text') {
      return textInput;
    } else if (activeTab === 'wifi') {
      if (!wifiSsid) return '';
      // WIFI:S:SSID;T:WPA;P:PASSWORD;H:true;;
      return `WIFI:S:${wifiSsid};T:${wifiSecurity};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
    } else if (activeTab === 'vcard') {
      if (!vcardFirst && !vcardLast) return '';
      return `BEGIN:VCARD
VERSION:3.0
N:${vcardLast};${vcardFirst};;;
FN:${vcardFirst} ${vcardLast}
${vcardOrg ? `ORG:${vcardOrg}\n` : ''}TEL;TYPE=CELL:${vcardPhone}
EMAIL;TYPE=PREF,INTERNET:${vcardEmail}
${vcardUrl ? `URL:${vcardUrl}\n` : ''}END:VCARD`;
    }
    return '';
  }, [activeTab, textInput, wifiSsid, wifiPassword, wifiSecurity, wifiHidden, vcardFirst, vcardLast, vcardPhone, vcardEmail, vcardOrg, vcardUrl]);

  const generateQrCode = useCallback(() => {
    // Reset state asynchronously to avoid react-hooks/set-state-in-effect error
    Promise.resolve().then(() => {
      setError(null);
      setSuccess(false);
    });

    const payload = getPayload();
    if (!payload.trim()) {
      // Clear canvas if payload is empty
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    if (!canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      payload,
      {
        width: size,
        margin: 2,
        errorCorrectionLevel: errorLevel,
        color: {
          dark: fgColor,
          light: bgColor
        }
      },
      (err) => {
        if (err) {
          setError(err.message || 'Failed to generate QR Code');
        } else {
          setSuccess(true);
        }
      }
    );
  }, [getPayload, size, errorLevel, fgColor, bgColor]);

  // Re-generate QR whenever states change
  useEffect(() => {
    generateQrCode();
  }, [generateQrCode]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    try {
      const filename = `qrcode-${activeTab}-${Date.now()}.png`;
      const dataUrl = canvasRef.current.toDataURL('image/png');

      const win = window as unknown as {
        electronAPI?: {
          saveFile: (filename: string, dataUrl: string) => void;
        };
      };

      if (win.electronAPI) {
        // Use Electron IPC for safe native download dialog
        win.electronAPI.saveFile(filename, dataUrl);
      } else {
        // Fallback for standard browser environments
        canvasRef.current.toBlob((blob) => {
          if (!blob) {
            setError('Failed to create image blob');
            return;
          }
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = filename;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 10000);
        }, 'image/png');
      }
    } catch (err: unknown) {
      setError('Could not download image: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCopy = async () => {
    if (!canvasRef.current) return;
    try {
      const url = canvasRef.current.toDataURL('image/png');
      await navigator.clipboard.writeText(url);
      alert('Data URL copied to clipboard!');
    } catch (err: unknown) {
      setError('Failed to copy data url: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleLoadSample = () => {
    if (activeTab === 'text') {
      setTextInput('https://github.com/arjunr1432/DevBox');
    } else if (activeTab === 'wifi') {
      setWifiSsid('DevBox_Secure_5G');
      setWifiPassword('super_secret_developer_pass');
      setWifiSecurity('WPA');
      setWifiHidden(false);
    } else if (activeTab === 'vcard') {
      setVcardFirst('John');
      setVcardLast('Doe');
      setVcardOrg('DevBox Software LLC');
      setVcardPhone('+1-555-0199');
      setVcardEmail('john.doe@devbox.local');
      setVcardUrl('https://devbox.local');
    }
  };

  const handleClear = () => {
    if (activeTab === 'text') {
      setTextInput('');
    } else if (activeTab === 'wifi') {
      setWifiSsid('');
      setWifiPassword('');
      setWifiSecurity('WPA');
      setWifiHidden(false);
    } else if (activeTab === 'vcard') {
      setVcardFirst('');
      setVcardLast('');
      setVcardOrg('');
      setVcardPhone('');
      setVcardEmail('');
      setVcardUrl('');
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>QR Code Generator</h1>
        <p>Generate high-quality, customized QR codes offline for URLs, raw texts, Wi-Fi networks, and contact cards.</p>
      </div>

      <div className="tool-card" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '2px', gap: '8px' }}>
          <button
            className={`btn ${activeTab === 'text' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('text')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            <Globe size={14} />
            <span>URL / Text</span>
          </button>
          <button
            className={`btn ${activeTab === 'wifi' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('wifi')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            <Wifi size={14} />
            <span>Wi-Fi Network</span>
          </button>
          <button
            className={`btn ${activeTab === 'vcard' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('vcard')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
          >
            <User size={14} />
            <span>Contact Card</span>
          </button>
        </div>

        {/* Builder Area & Canvas Area */}
        <div style={{ display: 'flex', gap: '20px', flexGrow: 1, flexWrap: 'wrap' }}>
          {/* Builder Form (Left) */}
          <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            {/* Form Fields based on tab */}
            {activeTab === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexGrow: 1 }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Standard Text or URL</label>
                <textarea
                  className="textarea-control"
                  placeholder="Enter URL or text to encode..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  style={{ flexGrow: 1, minHeight: '160px', resize: 'none' }}
                />
              </div>
            )}

            {activeTab === 'wifi' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>SSID (Network Name)</label>
                  <input
                    type="text"
                    className="textarea-control"
                    placeholder="SSID name"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    style={{ height: '36px', padding: '0 8px', fontSize: '13px', width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Password</label>
                  <input
                    type="password"
                    className="textarea-control"
                    placeholder="WPA/WPA2/WEP Password"
                    value={wifiPassword}
                    onChange={(e) => setWifiPassword(e.target.value)}
                    style={{ height: '36px', padding: '0 8px', fontSize: '13px', width: '100%' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '4px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Security</label>
                    <select
                      className="select-control"
                      value={wifiSecurity}
                      onChange={(e) => setWifiSecurity(e.target.value as 'WPA' | 'WEP' | 'nopass')}
                      style={{ padding: '6px 10px', fontSize: '13px', width: '120px' }}
                    >
                      <option value="WPA">WPA/WPA2</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">Unencrypted</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '100%', alignSelf: 'flex-end', paddingBottom: '6px' }}>
                    <input
                      type="checkbox"
                      id="wifi-hidden"
                      checked={wifiHidden}
                      onChange={(e) => setWifiHidden(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <label htmlFor="wifi-hidden" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', cursor: 'pointer' }}>Hidden SSID</label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'vcard' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>First Name</label>
                  <input
                    type="text"
                    className="textarea-control"
                    value={vcardFirst}
                    onChange={(e) => setVcardFirst(e.target.value)}
                    style={{ height: '32px', padding: '0 8px', fontSize: '12px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Last Name</label>
                  <input
                    type="text"
                    className="textarea-control"
                    value={vcardLast}
                    onChange={(e) => setVcardLast(e.target.value)}
                    style={{ height: '32px', padding: '0 8px', fontSize: '12px', width: '100%' }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Company</label>
                  <input
                    type="text"
                    className="textarea-control"
                    value={vcardOrg}
                    onChange={(e) => setVcardOrg(e.target.value)}
                    style={{ height: '32px', padding: '0 8px', fontSize: '12px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Phone Number</label>
                  <input
                    type="text"
                    className="textarea-control"
                    value={vcardPhone}
                    onChange={(e) => setVcardPhone(e.target.value)}
                    style={{ height: '32px', padding: '0 8px', fontSize: '12px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Email</label>
                  <input
                    type="email"
                    className="textarea-control"
                    value={vcardEmail}
                    onChange={(e) => setVcardEmail(e.target.value)}
                    style={{ height: '32px', padding: '0 8px', fontSize: '12px', width: '100%' }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '2px' }}>Website URL</label>
                  <input
                    type="url"
                    className="textarea-control"
                    value={vcardUrl}
                    onChange={(e) => setVcardUrl(e.target.value)}
                    style={{ height: '32px', padding: '0 8px', fontSize: '12px', width: '100%' }}
                  />
                </div>
              </div>
            )}

            {/* Customization Details */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Foreground Color</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, width: '28px', height: '28px' }}
                  />
                  <input
                    type="text"
                    className="textarea-control"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    style={{ height: '28px', width: '70px', padding: '2px 4px', fontSize: '11px', textAlign: 'center', fontFamily: 'monospace' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Background Color</label>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={bgColor === 'transparent' ? '#ffffff' : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    disabled={bgColor === 'transparent'}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, width: '28px', height: '28px' }}
                  />
                  <select
                    className="select-control"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    style={{ height: '28px', padding: '0 4px', fontSize: '11px' }}
                  >
                    <option value="#ffffff">White (#fff)</option>
                    <option value="#f3f4f6">Light Gray</option>
                    <option value="#a855f7">Purple</option>
                    <option value="transparent">Transparent</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Error Correction</label>
                <select
                  className="select-control"
                  value={errorLevel}
                  onChange={(e) => setErrorLevel(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                  style={{ height: '28px', padding: '0 4px', fontSize: '11px', width: '80px' }}
                >
                  <option value="L">L (7%)</option>
                  <option value="M">M (15%)</option>
                  <option value="Q">Q (25%)</option>
                  <option value="H">H (30%)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Size</label>
                <select
                  className="select-control"
                  value={size}
                  onChange={(e) => setSize(parseInt(e.target.value, 10))}
                  style={{ height: '28px', padding: '0 4px', fontSize: '11px', width: '80px' }}
                >
                  <option value={128}>128 px</option>
                  <option value={256}>256 px</option>
                  <option value={512}>512 px</option>
                </select>
              </div>
            </div>

            {/* Utility buttons */}
            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
              <button className="btn btn-secondary" onClick={handleLoadSample} style={{ padding: '8px 12px', fontSize: '12px' }}>
                Load Sample
              </button>
              <button className="btn btn-secondary" onClick={handleClear} style={{ padding: '8px 12px', fontSize: '12px' }}>
                Clear Form
              </button>
            </div>

          </div>

          {/* Canvas Preview Area (Right) */}
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.01)', padding: '20px', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.06)' }}>
            
            {/* Canvas Container */}
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <canvas ref={canvasRef} style={{ maxWidth: '100%', height: 'auto', display: getPayload() ? 'block' : 'none' }} />
              {!getPayload() && (
                <div style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '12px', textAlign: 'center' }}>
                  Awaiting input data to generate QR...
                </div>
              )}
            </div>

            {getPayload() && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', width: '100%', justifyContent: 'center' }}>
                <button className="btn btn-primary" onClick={handleDownload} style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Download size={14} />
                  <span>Download PNG</span>
                </button>
                <button className="btn btn-secondary" onClick={handleCopy} style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Copy size={14} />
                  <span>Copy URL</span>
                </button>
              </div>
            )}

            {error && (
              <div className="feedback-box error" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px', width: '100%' }}>
                <AlertTriangle size={14} />
                <span style={{ fontSize: '11px' }}>{error}</span>
              </div>
            )}

            {success && getPayload() && (
              <div className="feedback-box success" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px', width: '100%', padding: '6px 12px' }}>
                <CheckCircle size={14} style={{ color: '#10B981' }} />
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>QR Code generated offline.</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
