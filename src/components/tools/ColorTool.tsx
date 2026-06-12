import React, { useState, useEffect } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Palette, Eye, CheckCircle2, XCircle } from 'lucide-react';

// Color Helper Functions
const hexToRgb = (hex: string) => {
  const cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length !== 6 && cleanHex.length !== 3) return null;
  let fullHex = cleanHex;
  if (cleanHex.length === 3) {
    fullHex = cleanHex.split('').map(char => char + char).join('');
  }
  const num = parseInt(fullHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

const rgbToHex = (r: number, g: number, b: number) => {
  const clamp = (val: number) => Math.max(0, Math.min(255, val));
  const hexPart = (val: number) => clamp(val).toString(16).padStart(2, '0');
  return `#${hexPart(r)}${hexPart(g)}${hexPart(b)}`;
};

const rgbToHsl = (r: number, g: number, b: number) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
};

// WCAG relative luminance
const getLuminance = (r: number, g: number, b: number) => {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
};

const getContrast = (rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }) => {
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
};

export const ColorTool: React.FC = () => {
  // Main Color Picker states
  const [hexColor, setHexColor] = useState('#8b5cf6');
  const [rgbColor, setRgbColor] = useState({ r: 139, g: 92, b: 246 });
  const [hslColor, setHslColor] = useState({ h: 258, s: 91, l: 66 });

  // Contrast states
  const [textColor, setTextColor] = useState('#ffffff');
  const [bgColor, setBgColor] = useState('#7c3aed');
  const [contrastRatio, setContrastRatio] = useState(4.5);

  // Synchronize picker color changes
  const handleHexChange = (hexVal: string) => {
    setHexColor(hexVal);
    const rgb = hexToRgb(hexVal);
    if (rgb) {
      setRgbColor(rgb);
      const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
      setHslColor(hsl);
    }
  };

  const handleRgbChange = (key: 'r' | 'g' | 'b', val: string) => {
    const num = Math.max(0, Math.min(255, parseInt(val, 10) || 0));
    const newRgb = { ...rgbColor, [key]: num };
    setRgbColor(newRgb);
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHexColor(hex);
    const hsl = rgbToHsl(newRgb.r, newRgb.g, newRgb.b);
    setHslColor(hsl);
  };

  // Recalculate contrast
  useEffect(() => {
    const textRgb = hexToRgb(textColor);
    const bgRgb = hexToRgb(bgColor);
    if (textRgb && bgRgb) {
      const ratio = getContrast(textRgb, bgRgb);
      setContrastRatio(parseFloat(ratio.toFixed(2)));
    }
  }, [textColor, bgColor]);

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>Color Converter & WCAG Contrast Calculator</h1>
        <p>Inspect colors, convert formats between HEX, RGB, HSL and evaluate readability using accessibility contrast ratios.</p>
      </div>

      <div className="split-pane" style={{ flexGrow: 1 }}>
        {/* Color Palette Panel */}
        <div className="tool-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <Palette size={16} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600 }}>Color Space Inspector</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
            <div className="color-swatch" style={{ background: hexColor }}>
              <span style={{ background: 'rgba(0,0,0,0.5)', padding: '6px 12px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
                {hexColor.toUpperCase()}
              </span>
            </div>

            {/* Picker Row */}
            <div className="form-group">
              <label>Select Base Color</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={hexColor}
                  onChange={(e) => handleHexChange(e.target.value)}
                  style={{ width: '50px', height: '40px', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', background: 'none', padding: '0' }}
                />
                <input
                  type="text"
                  className="input-control"
                  value={hexColor}
                  onChange={(e) => handleHexChange(e.target.value)}
                  placeholder="#000000"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>

            {/* Outputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>RGB FORMAT</label>
                  <CopyButton text={`rgb(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b})`} label="Copy RGB" />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <input type="number" className="input-control" value={rgbColor.r} onChange={(e) => handleRgbChange('r', e.target.value)} style={{ textAlign: 'center' }} placeholder="R" />
                  <input type="number" className="input-control" value={rgbColor.g} onChange={(e) => handleRgbChange('g', e.target.value)} style={{ textAlign: 'center' }} placeholder="G" />
                  <input type="number" className="input-control" value={rgbColor.b} onChange={(e) => handleRgbChange('b', e.target.value)} style={{ textAlign: 'center' }} placeholder="B" />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>HSL FORMAT</label>
                  <CopyButton text={`hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`} label="Copy HSL" />
                </div>
                <input
                  type="text"
                  className="input-control"
                  readOnly
                  value={`hsl(${hslColor.h}, ${hslColor.s}%, ${hslColor.l}%)`}
                  style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* WCAG Contrast Panel */}
        <div className="tool-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <Eye size={16} style={{ color: 'var(--accent)' }} />
            <h2 style={{ fontSize: '15px', fontWeight: 600 }}>WCAG Readability Calculator</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '4px' }}>
            {/* Preview Swatch */}
            <div style={{
              height: '80px',
              borderRadius: '8px',
              background: bgColor,
              color: textColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 500,
              border: '1px solid var(--border-color)',
              textAlign: 'center',
              padding: '10px'
            }}>
              Example Text on Background Preview
            </div>

            {/* Inputs */}
            <div className="form-row">
              <div className="form-group">
                <label>Text Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ width: '40px', height: '38px', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', background: 'none', padding: '0' }} />
                  <input type="text" className="input-control" value={textColor} onChange={(e) => setTextColor(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>

              <div className="form-group">
                <label>Background Color</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ width: '40px', height: '38px', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', background: 'none', padding: '0' }} />
                  <input type="text" className="input-control" value={bgColor} onChange={(e) => setBgColor(e.target.value)} style={{ fontFamily: 'var(--font-mono)' }} />
                </div>
              </div>
            </div>

            {/* Contrast output */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px'
            }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contrast Ratio</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: contrastRatio >= 4.5 ? 'var(--success)' : 'var(--error)', fontFamily: 'var(--font-mono)' }}>
                {contrastRatio} : 1
              </span>
            </div>

            {/* Badges Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>Normal Text (AA) <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>- Reqd 4.5:1</span></span>
                {contrastRatio >= 4.5 ? (
                  <span className="contrast-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Pass
                  </span>
                ) : (
                  <span className="contrast-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#ff6b8b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={12} /> Fail
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>Normal Text (AAA) <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>- Reqd 7:1</span></span>
                {contrastRatio >= 7.0 ? (
                  <span className="contrast-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Pass
                  </span>
                ) : (
                  <span className="contrast-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#ff6b8b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={12} /> Fail
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>Large Text (AA) <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>- Reqd 3:1</span></span>
                {contrastRatio >= 3.0 ? (
                  <span className="contrast-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Pass
                  </span>
                ) : (
                  <span className="contrast-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#ff6b8b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={12} /> Fail
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.1)', borderRadius: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 500 }}>Large Text (AAA) <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>- Reqd 4.5:1</span></span>
                {contrastRatio >= 4.5 ? (
                  <span className="contrast-badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={12} /> Pass
                  </span>
                ) : (
                  <span className="contrast-badge" style={{ background: 'rgba(244, 63, 94, 0.15)', color: '#ff6b8b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle size={12} /> Fail
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
