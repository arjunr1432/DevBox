import React, { useState, useEffect } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { ShieldCheck, CaseSensitive } from 'lucide-react';

// Pure TS MD5 implementation to keep utility fully offline with zero packages
const md5 = (str: string): string => {
  const rotateLeft = (n: number, s: number) => (n << s) | (n >>> (32 - s));
  
  const k = [
    0xd76aa478, 0xe8c7b756, 0x242070db, 0xc1bdceee, 0xf57c0faf, 0x4787c62a, 0xa8304613, 0xfd469501,
    0x698098d8, 0x8b44f7af, 0xffff5bb1, 0x895cd7be, 0x6b901122, 0xfd987193, 0xa679438e, 0x49b40821,
    0xf61e2562, 0xc040b340, 0x265e5a51, 0xe9b6c7aa, 0xd62f105d, 0x02441453, 0xd8a1e681, 0xe7d3fbc8,
    0x21e1cde6, 0xc33707d6, 0xf4d50d87, 0x455a14ed, 0xa9e3e905, 0xfcefa3f8, 0x676f02d9, 0x8d2a4c8a,
    0xfffa3942, 0x8771f681, 0x6d9d6122, 0xfde5380c, 0xa4beea44, 0x4bdecfa9, 0xf6bb4b60, 0xbebfbc70,
    0x289b7ec6, 0xeaa127fa, 0xd4ef3085, 0x04881d05, 0xd9d4d039, 0xe6db99e5, 0x1fa27cf8, 0xc4ac5665,
    0xf4292244, 0x432aff97, 0xab9423a7, 0xfc93a039, 0x655b59c3, 0x8f0ccc92, 0xffeff47d, 0x85845dd1,
    0x6fa87e4f, 0xfe2ce6e0, 0xa3014314, 0x4e0811a1, 0xf7537e82, 0xbd3af235, 0x2ad7d2bb, 0xeb86d391
  ];

  const r = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20, 5,  9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21
  ];

  const utf8 = unescape(encodeURIComponent(str));
  const txt = utf8 + String.fromCharCode(128);
  const l = txt.length;
  const n = ((l + 8) >> 6) + 1;
  const m = new Array(n * 16).fill(0);
  for (let i = 0; i < l; i++) {
    m[i >> 2] |= txt.charCodeAt(i) << ((i % 4) << 3);
  }
  m[n * 16 - 2] = (l - 1) * 8;

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;

  for (let i = 0; i < n; i++) {
    let a = h0, b = h1, c = h2, d = h3;
    const offset = i * 16;
    for (let j = 0; j < 64; j++) {
      let f, g;
      if (j < 16) {
        f = (b & c) | (~b & d);
        g = j;
      } else if (j < 32) {
        f = (d & b) | (~d & c);
        g = (5 * j + 1) % 16;
      } else if (j < 48) {
        f = b ^ c ^ d;
        g = (3 * j + 5) % 16;
      } else {
        f = c ^ (b | ~d);
        g = (7 * j) % 16;
      }
      const temp = d;
      d = c;
      c = b;
      b = (b + rotateLeft((a + f + k[j] + m[offset + g]) | 0, r[j])) | 0;
      a = temp;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
  }

  const toHex = (n: number) => {
    let out = '';
    for (let i = 0; i < 4; i++) {
      out += ((n >> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    }
    return out;
  };

  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3);
};

export const HashGenerator: React.FC = () => {
  const [inputText, setInputText] = useState('HelloWorld');
  const [uppercase, setUppercase] = useState(false);
  const [hashes, setHashes] = useState({
    md5: '',
    sha1: '',
    sha256: '',
    sha512: '',
  });

  const generateHashes = async (text: string) => {
    if (!text) {
      setHashes({ md5: '', sha1: '', sha256: '', sha512: '' });
      return;
    }

    try {
      // MD5
      const md5Result = md5(text);

      // Web Crypto hashes
      const encoder = new TextEncoder();
      const data = encoder.encode(text);

      const runCryptoHash = async (algo: 'SHA-1' | 'SHA-256' | 'SHA-512') => {
        const buffer = await crypto.subtle.digest(algo, data);
        const hashArray = Array.from(new Uint8Array(buffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      };

      const sha1Result = await runCryptoHash('SHA-1');
      const sha256Result = await runCryptoHash('SHA-256');
      const sha512Result = await runCryptoHash('SHA-512');

      setHashes({
        md5: md5Result,
        sha1: sha1Result,
        sha256: sha256Result,
        sha512: sha512Result,
      });
    } catch (err) {
      console.error('Error generating hashes:', err);
    }
  };

  useEffect(() => {
    generateHashes(inputText);
  }, [inputText]);

  const toggleCase = () => setUppercase(!uppercase);

  const formatHash = (hashStr: string) => {
    return uppercase ? hashStr.toUpperCase() : hashStr.toLowerCase();
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>Hash Generator</h1>
        <p>Generate cryptographic checksums instantly using common hash algorithms locally in your browser.</p>
      </div>

      <div className="tool-card" style={{ gap: '20px' }}>
        {/* Input Text Area */}
        <div className="form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Input Text</label>
            <button className="btn btn-secondary" onClick={toggleCase} style={{ padding: '6px 12px', fontSize: '12px' }}>
              <CaseSensitive size={14} />
              <span style={{ marginLeft: '4px' }}>Toggle Uppercase</span>
            </button>
          </div>
          <textarea
            className="textarea-control"
            placeholder="Type text to generate hashes..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ height: '100px', minHeight: '100px', resize: 'none' }}
          />
        </div>

        {/* Output Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* MD5 Row */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>MD5 (Message Digest)</label>
              <CopyButton text={formatHash(hashes.md5)} label="Copy MD5" />
            </div>
            <input
              type="text"
              className="input-control"
              readOnly
              value={formatHash(hashes.md5)}
              style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', marginTop: '4px' }}
            />
          </div>

          {/* SHA-1 Row */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>SHA-1 (Secure Hash Algorithm 1)</label>
              <CopyButton text={formatHash(hashes.sha1)} label="Copy SHA-1" />
            </div>
            <input
              type="text"
              className="input-control"
              readOnly
              value={formatHash(hashes.sha1)}
              style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', marginTop: '4px' }}
            />
          </div>

          {/* SHA-256 Row */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>SHA-256 (Recommended for integrity)</label>
              <CopyButton text={formatHash(hashes.sha256)} label="Copy SHA-256" />
            </div>
            <input
              type="text"
              className="input-control"
              readOnly
              value={formatHash(hashes.sha256)}
              style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', marginTop: '4px' }}
            />
          </div>

          {/* SHA-512 Row */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>SHA-512 (High security)</label>
              <CopyButton text={formatHash(hashes.sha512)} label="Copy SHA-512" />
            </div>
            <textarea
              className="textarea-control"
              readOnly
              value={formatHash(hashes.sha512)}
              style={{
                fontFamily: 'var(--font-mono)',
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                marginTop: '4px',
                minHeight: '60px',
                height: '60px',
                resize: 'none',
                padding: '10px 12px'
              }}
            />
          </div>
        </div>

        <div className="feedback-box success" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <ShieldCheck size={16} style={{ color: 'var(--success)' }} />
          <span>Hashes calculated entirely locally on your CPU. None of your input strings are sent online.</span>
        </div>
      </div>
    </div>
  );
};
