import React, { useState } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { AlertCircle, CheckCircle2, ShieldAlert, Key } from 'lucide-react';

export const JwtDecoder: React.FC = () => {
  const [token, setToken] = useState('');
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [signature, setSignature] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [expiryInfo, setExpiryInfo] = useState<{
    exp: number | null;
    iat: number | null;
    status: 'valid' | 'expired' | 'no-exp';
    expDate: string;
    iatDate: string;
  } | null>(null);

  const base64UrlDecode = (str: string) => {
    // Replace non-url compatible chars
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    // Decode base64
    const binString = atob(base64);
    const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  };

  const handleDecode = (jwtToken: string) => {
    setToken(jwtToken);
    setError(null);
    setHeader('');
    setPayload('');
    setSignature('');
    setExpiryInfo(null);

    if (!jwtToken.trim()) return;

    const parts = jwtToken.split('.');
    if (parts.length !== 3) {
      setError('A JWT must contain exactly 3 dot-separated parts: Header, Payload, and Signature.');
      return;
    }

    try {
      const decodedHeader = base64UrlDecode(parts[0]);
      const decodedPayload = base64UrlDecode(parts[1]);
      
      const parsedHeader = JSON.parse(decodedHeader);
      const parsedPayload = JSON.parse(decodedPayload);

      setHeader(JSON.stringify(parsedHeader, null, 2));
      setPayload(JSON.stringify(parsedPayload, null, 2));
      setSignature(parts[2]);

      // Handle expiration claims
      let exp: number | null = null;
      let iat: number | null = null;
      let status: 'valid' | 'expired' | 'no-exp' = 'no-exp';
      let expDate = '';
      let iatDate = '';

      if (parsedPayload.exp) {
        exp = Number(parsedPayload.exp);
        const date = new Date(exp * 1000);
        expDate = date.toString();
        status = Date.now() > date.getTime() ? 'expired' : 'valid';
      }

      if (parsedPayload.iat) {
        iat = Number(parsedPayload.iat);
        const date = new Date(iat * 1000);
        iatDate = date.toString();
      }

      setExpiryInfo({
        exp,
        iat,
        status,
        expDate,
        iatDate
      });

    } catch (err: any) {
      setError('Failed to parse JWT parts. Ensure it is a valid base64-encoded token.');
    }
  };

  const handleLoadSample = () => {
    // Generate a mock JWT for demonstration: HS256 algorithm
    const headerMock = { alg: "HS256", typ: "JWT" };
    const payloadMock = {
      sub: "1234567890",
      name: "John Doe",
      admin: true,
      iat: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      exp: Math.floor(Date.now() / 1000) + 86400 * 7 // 7 days from now
    };
    
    const encode = (obj: object) => {
      const str = JSON.stringify(obj);
      const bytes = new TextEncoder().encode(str);
      const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
      return btoa(binString).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    };

    const mockToken = `${encode(headerMock)}.${encode(payloadMock)}.s0mE-M0cK-siGnaTurE-ValuE-heRe`;
    handleDecode(mockToken);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>JWT Decoder</h1>
        <p>Decode JSON Web Token header, payload, and signature with claim verification.</p>
      </div>

      <div className="tool-card" style={{ gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Encoded JWT Token</label>
          <button className="btn btn-secondary" onClick={handleLoadSample} style={{ padding: '6px 12px', fontSize: '12px' }}>
            Load Sample Token
          </button>
        </div>

        <textarea
          className="textarea-control"
          placeholder="Paste your encoded JWT string here (starts with ey...)"
          value={token}
          onChange={(e) => handleDecode(e.target.value)}
          style={{ height: '80px', minHeight: '80px', resize: 'none' }}
        />

        {error && (
          <div className="feedback-box error" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {expiryInfo && (
          <div className="fade-in" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {expiryInfo.status === 'valid' && (
              <div className="feedback-box success" style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 200px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                <span>Token Active. Expires: {expiryInfo.expDate}</span>
              </div>
            )}
            {expiryInfo.status === 'expired' && (
              <div className="feedback-box error" style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 200px' }}>
                <AlertCircle size={16} style={{ color: 'var(--error)' }} />
                <span>Token Expired! Expiry: {expiryInfo.expDate}</span>
              </div>
            )}
            {expiryInfo.status === 'no-exp' && (
              <div className="feedback-box" style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 200px', background: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <AlertCircle size={16} style={{ color: 'var(--text-secondary)' }} />
                <span>No expiration claim (`exp`) found in payload.</span>
              </div>
            )}
          </div>
        )}

        {header && payload && (
          <div className="split-pane fade-in" style={{ flexGrow: 1, minHeight: '300px' }}>
            {/* Header Column */}
            <div className="pane-half">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#f97316' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
                  HEADER: ALGORITHM & TOKEN TYPE
                </span>
                <CopyButton text={header} />
              </div>
              <textarea
                className="textarea-control"
                readOnly
                value={header}
                style={{ flexGrow: 1, resize: 'none', borderLeft: '3px solid #f97316', background: 'rgba(14, 11, 22, 0.4)' }}
              />
            </div>

            {/* Payload Column */}
            <div className="pane-half">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                  PAYLOAD: DATA / CLAIMS
                </span>
                <CopyButton text={payload} />
              </div>
              <textarea
                className="textarea-control"
                readOnly
                value={payload}
                style={{ flexGrow: 1, resize: 'none', borderLeft: '3px solid #3b82f6', background: 'rgba(14, 11, 22, 0.4)' }}
              />
            </div>
          </div>
        )}

        {signature && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 600, color: '#10b981' }}>
              <Key size={12} />
              SIGNATURE HASH
            </span>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              padding: '12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderLeft: '3px solid #10b981',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              wordBreak: 'break-all'
            }}>
              {signature}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
