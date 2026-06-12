import React, { useState, useEffect } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Play, Pause, RefreshCw, Clock } from 'lucide-react';

export const EpochConverter: React.FC = () => {
  // Live ticker state
  const [tickerTime, setTickerTime] = useState(Math.floor(Date.now() / 1000));
  const [tickerMs, setTickerMs] = useState(Date.now());
  const [isLive, setIsLive] = useState(true);

  // Epoch to Date state
  const [epochInput, setEpochInput] = useState(Math.floor(Date.now() / 1000).toString());
  const [epochOutput, setEpochOutput] = useState<{
    local: string;
    utc: string;
    relative: string;
    iso: string;
  } | null>(null);
  const [epochError, setEpochError] = useState<string | null>(null);

  // Date to Epoch state
  const [dateInput, setDateInput] = useState(new Date().toISOString().substring(0, 16)); // YYYY-MM-DDTHH:MM
  const [dateOutputSec, setDateOutputSec] = useState('');
  const [dateOutputMs, setDateOutputMs] = useState('');

  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        const now = Date.now();
        setTickerTime(Math.floor(now / 1000));
        setTickerMs(now);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  // Convert Epoch to Date
  const handleEpochConvert = (value: string) => {
    setEpochInput(value);
    setEpochError(null);
    if (!value.trim()) {
      setEpochOutput(null);
      return;
    }

    const num = Number(value.trim());
    if (isNaN(num)) {
      setEpochError('Invalid number format');
      setEpochOutput(null);
      return;
    }

    try {
      // Auto-detect seconds vs milliseconds
      // Numbers less than 50,000,000,000 are usually treated as seconds
      const isSeconds = num < 50000000000;
      const date = new Date(isSeconds ? num * 1000 : num);

      if (isNaN(date.getTime())) {
        setEpochError('Invalid date range');
        setEpochOutput(null);
        return;
      }

      setEpochOutput({
        local: date.toString(),
        utc: date.toUTCString(),
        iso: date.toISOString(),
        relative: getRelativeTime(date)
      });
    } catch (err) {
      setEpochError('Error parsing timestamp');
      setEpochOutput(null);
    }
  };

  // Run on mount once to initialize
  useEffect(() => {
    handleEpochConvert(epochInput);
    handleDateConvert(dateInput);
  }, []);

  // Convert Date to Epoch
  const handleDateConvert = (value: string) => {
    setDateInput(value);
    if (!value) {
      setDateOutputSec('');
      setDateOutputMs('');
      return;
    }
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        setDateOutputSec('Invalid date');
        setDateOutputMs('Invalid date');
        return;
      }
      setDateOutputSec(Math.floor(date.getTime() / 1000).toString());
      setDateOutputMs(date.getTime().toString());
    } catch (err) {
      setDateOutputSec('Error');
      setDateOutputMs('Error');
    }
  };

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const absSec = Math.abs(diffSec);

    if (absSec < 5) return 'just now';

    const suffix = diffSec < 0 ? 'ago' : 'from now';
    if (absSec < 60) return `${absSec} seconds ${suffix}`;
    
    const diffMin = Math.floor(absSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ${suffix}`;
    
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ${suffix}`;
    
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ${suffix}`;
  };

  const handleUseCurrentEpoch = () => {
    const nowSec = Math.floor(Date.now() / 1000).toString();
    handleEpochConvert(nowSec);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="tool-header">
        <h1>Epoch Timestamp Converter</h1>
        <p>Convert Unix timestamps to human-readable dates, or convert human-readable dates back to Unix epoch representation.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flexGrow: 1 }}>
        {/* Live Ticker Banner */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(168, 85, 247, 0.12)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          borderRadius: '12px',
          padding: '16px 20px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Clock size={20} style={{ color: 'var(--accent)' }} />
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Current Unix Timestamp {isLive ? '(Live)' : '(Paused)'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                  {tickerTime}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  .{tickerMs.toString().slice(-3)} ms
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setIsLive(!isLive)} style={{ padding: '8px 12px' }}>
              {isLive ? <Pause size={14} /> : <Play size={14} />}
              <span style={{ marginLeft: '4px' }}>{isLive ? 'Pause' : 'Resume'}</span>
            </button>
            <CopyButton text={tickerTime.toString()} label="Copy Seconds" />
            <CopyButton text={tickerMs.toString()} label="Copy Milliseconds" />
          </div>
        </div>

        {/* Converter Panes */}
        <div className="split-pane">
          {/* Epoch to Date */}
          <div className="tool-card">
            <h2 style={{ fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Epoch to Date
            </h2>

            <div className="form-group">
              <label>Unix Timestamp (Seconds or Milliseconds)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Enter epoch timestamp (e.g. 1778644338)"
                  value={epochInput}
                  onChange={(e) => handleEpochConvert(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button className="btn btn-secondary" onClick={handleUseCurrentEpoch} style={{ whiteSpace: 'nowrap' }}>
                  <RefreshCw size={14} />
                  <span>Current</span>
                </button>
              </div>
            </div>

            {epochError && (
              <div className="feedback-box error" style={{ fontSize: '12px' }}>
                {epochError}
              </div>
            )}

            {epochOutput && (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>LOCAL TIME</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '3px', wordBreak: 'break-all' }}>{epochOutput.local}</div>
                </div>

                <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>UTC TIME</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '3px', wordBreak: 'break-all' }}>{epochOutput.utc}</div>
                </div>

                <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>ISO 8601</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '3px', wordBreak: 'break-all', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>{epochOutput.iso}</span>
                    <CopyButton text={epochOutput.iso} style={{ padding: '4px 8px', border: 'none', background: 'none' }} />
                  </div>
                </div>

                <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--success)' }}>RELATIVE TIME</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '3px', color: 'var(--text-primary)' }}>{epochOutput.relative}</div>
                </div>
              </div>
            )}
          </div>

          {/* Date to Epoch */}
          <div className="tool-card">
            <h2 style={{ fontSize: '15px', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              Date to Epoch
            </h2>

            <div className="form-group">
              <label>Human Readable Date / Time</label>
              <input
                type="datetime-local"
                className="input-control"
                value={dateInput}
                onChange={(e) => handleDateConvert(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>EPOCH (SECONDS)</label>
                  <CopyButton text={dateOutputSec} label="Copy Sec" />
                </div>
                <input
                  type="text"
                  className="input-control"
                  readOnly
                  value={dateOutputSec}
                  style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', marginTop: '4px' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>EPOCH (MILLISECONDS)</label>
                  <CopyButton text={dateOutputMs} label="Copy Ms" />
                </div>
                <input
                  type="text"
                  className="input-control"
                  readOnly
                  value={dateOutputMs}
                  style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', marginTop: '4px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
