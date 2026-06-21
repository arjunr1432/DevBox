import React, { useState, useEffect } from 'react';
import { CopyButton } from '../ui/CopyButton';
import { Clock, Calendar, AlertTriangle, HelpCircle } from 'lucide-react';
import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

export const CronParser: React.FC = () => {
  const [expression, setExpression] = useState('*/5 * * * *');
  const [explanation, setExplanation] = useState('');
  const [nextRuns, setNextRuns] = useState<Date[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Form builder state
  const [buildMin, setBuildMin] = useState('*');
  const [buildHour, setBuildHour] = useState('*');
  const [buildDay, setBuildDay] = useState('*');
  const [buildMonth, setBuildMonth] = useState('*');
  const [buildDayOfWeek, setBuildDayOfWeek] = useState('*');

  // Trigger evaluation whenever expression changes
  useEffect(() => {
    evaluateCron(expression);
  }, [expression]);

  const evaluateCron = (expr: string) => {
    if (!expr.trim()) {
      setError('Please enter a cron expression.');
      setExplanation('');
      setNextRuns([]);
      return;
    }

    try {
      // 1. Generate explanation using cronstrue
      const desc = cronstrue.toString(expr, { throwExceptionOnParseError: true });
      setExplanation(desc);
      setError(null);

      // 2. Parse next execution dates using cron-parser
      const interval = CronExpressionParser.parse(expr);
      const dates: Date[] = [];
      // Get next 5 dates
      for (let i = 0; i < 5; i++) {
        dates.push(interval.next().toDate());
      }
      setNextRuns(dates);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
      setExplanation('');
      setNextRuns([]);
    }
  };

  // Preset quick selections
  const applyPreset = (presetExpr: string) => {
    setExpression(presetExpr);
    // Parse expression back into form builder
    const parts = presetExpr.split(' ');
    if (parts.length >= 5) {
      setBuildMin(parts[0]);
      setBuildHour(parts[1]);
      setBuildDay(parts[2]);
      setBuildMonth(parts[3]);
      setBuildDayOfWeek(parts[4]);
    }
  };

  // Handle builder updates
  const updateFromBuilder = (min: string, hr: string, day: string, mon: string, dow: string) => {
    const expr = `${min} ${hr} ${day} ${mon} ${dow}`;
    setExpression(expr);
  };

  const handleBuildSelect = (field: 'min' | 'hour' | 'day' | 'month' | 'dow', val: string) => {
    let m = buildMin, h = buildHour, d = buildDay, mo = buildMonth, dw = buildDayOfWeek;
    if (field === 'min') { setBuildMin(val); m = val; }
    if (field === 'hour') { setBuildHour(val); h = val; }
    if (field === 'day') { setBuildDay(val); d = val; }
    if (field === 'month') { setBuildMonth(val); mo = val; }
    if (field === 'dow') { setBuildDayOfWeek(val); dw = val; }

    updateFromBuilder(m, h, d, mo, dw);
  };

  // Split expression safely into fields for the visual badges
  const fieldsArray = expression.trim().split(/\s+/);
  const minVal = fieldsArray[0] || '*';
  const hourVal = fieldsArray[1] || '*';
  const domVal = fieldsArray[2] || '*';
  const monthVal = fieldsArray[3] || '*';
  const dowVal = fieldsArray[4] || '*';

  const badgeStyle: React.CSSProperties = {
    flex: '1 1 100px',
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.07)',
    borderRadius: '8px',
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
    transition: 'border-color 0.2s ease'
  };

  const badgeLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: '0.8px',
    marginBottom: '6px'
  };

  const badgeValueStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--accent)'
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="tool-header">
        <h1>Cron Expression Parser & Builder</h1>
        <p>Parse cron schedules into readable descriptions, predict upcoming executions, or construct expressions visually.</p>
      </div>

      <div className="tool-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'visible' }}>
        
        {/* Top Segment: Input & Visual Fields Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Cron Expression
          </label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              className="input-control"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              style={{
                height: '40px',
                fontSize: '15px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                color: 'var(--accent)',
                flexGrow: 1,
                background: 'rgba(0, 0, 0, 0.2)'
              }}
              placeholder="e.g. */15 * * * *"
            />
            <CopyButton text={expression} />
          </div>

          {/* Visual Fields Breakdown */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '4px' }}>
            <div style={badgeStyle}>
              <span style={badgeLabelStyle}>Min</span>
              <span style={badgeValueStyle}>{minVal}</span>
            </div>
            <div style={badgeStyle}>
              <span style={badgeLabelStyle}>Hour</span>
              <span style={badgeValueStyle}>{hourVal}</span>
            </div>
            <div style={badgeStyle}>
              <span style={badgeLabelStyle}>Day (Month)</span>
              <span style={badgeValueStyle}>{domVal}</span>
            </div>
            <div style={badgeStyle}>
              <span style={badgeLabelStyle}>Month</span>
              <span style={badgeValueStyle}>{monthVal}</span>
            </div>
            <div style={badgeStyle}>
              <span style={badgeLabelStyle}>Day (Week)</span>
              <span style={badgeValueStyle}>{dowVal}</span>
            </div>
          </div>
        </div>

        {/* Live Description Banner */}
        {explanation && (
          <div style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            padding: '14px 16px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(168, 85, 247, 0.02) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <HelpCircle size={20} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--accent)' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                Schedule Description
              </strong>
              <span style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                "{explanation}"
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="feedback-box error" style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', margin: 0 }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', fontSize: '13px', marginBottom: '2px' }}>Invalid Cron Expression:</strong>
              <span style={{ fontSize: '13px' }}>{error}</span>
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '16px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Presets:</span>
          <button className="btn btn-secondary" onClick={() => applyPreset('* * * * *')} style={{ padding: '6px 10px', fontSize: '11px' }}>Every Min</button>
          <button className="btn btn-secondary" onClick={() => applyPreset('*/5 * * * *')} style={{ padding: '6px 10px', fontSize: '11px' }}>Every 5 Min</button>
          <button className="btn btn-secondary" onClick={() => applyPreset('0 * * * *')} style={{ padding: '6px 10px', fontSize: '11px' }}>Hourly</button>
          <button className="btn btn-secondary" onClick={() => applyPreset('0 0 * * *')} style={{ padding: '6px 10px', fontSize: '11px' }}>Daily (Midnight)</button>
          <button className="btn btn-secondary" onClick={() => applyPreset('0 9 * * 1-5')} style={{ padding: '6px 10px', fontSize: '11px' }}>9 AM Mon-Fri</button>
          <button className="btn btn-secondary" onClick={() => applyPreset('0 0 1 * *')} style={{ padding: '6px 10px', fontSize: '11px' }}>Monthly on 1st</button>
        </div>

        {/* Main Work Area split */}
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {/* Builder controls (Left) */}
          <div style={{ flex: '1 1 380px', background: 'rgba(255, 255, 255, 0.01)', padding: '20px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'visible' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              🔧 Visual Cron Builder
            </h3>
            
            {/* Minutes */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '100px', flexShrink: 0 }}>Minute</span>
              <select
                className="select-control"
                value={buildMin}
                onChange={(e) => handleBuildSelect('min', e.target.value)}
                style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }}
              >
                <option value="*">Every Minute (*)</option>
                <option value="*/5">Every 5 Minutes (*/5)</option>
                <option value="*/10">Every 10 Minutes (*/10)</option>
                <option value="*/15">Every 15 Minutes (*/15)</option>
                <option value="*/30">Every 30 Minutes (*/30)</option>
                <option value="0">At Minute 0</option>
                <option value="30">At Minute 30</option>
              </select>
            </div>

            {/* Hours */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '100px', flexShrink: 0 }}>Hour</span>
              <select
                className="select-control"
                value={buildHour}
                onChange={(e) => handleBuildSelect('hour', e.target.value)}
                style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }}
              >
                <option value="*">Every Hour (*)</option>
                <option value="*/2">Every 2 Hours (*/2)</option>
                <option value="*/4">Every 4 Hours (*/4)</option>
                <option value="*/6">Every 6 Hours (*/6)</option>
                <option value="*/12">Every 12 Hours (*/12)</option>
                <option value="0">At Midnight (0)</option>
                <option value="9">At 9:00 AM (9)</option>
                <option value="12">At 12:00 PM (12)</option>
                <option value="18">At 6:00 PM (18)</option>
              </select>
            </div>

            {/* Day of Month */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '100px', flexShrink: 0 }}>Day of Month</span>
              <select
                className="select-control"
                value={buildDay}
                onChange={(e) => handleBuildSelect('day', e.target.value)}
                style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }}
              >
                <option value="*">Every Day (*)</option>
                <option value="*/2">Every Even Day (*/2)</option>
                <option value="1">1st of Month</option>
                <option value="15">15th of Month</option>
                <option value="L">Last day of Month (L)</option>
              </select>
            </div>

            {/* Month */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '100px', flexShrink: 0 }}>Month</span>
              <select
                className="select-control"
                value={buildMonth}
                onChange={(e) => handleBuildSelect('month', e.target.value)}
                style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }}
              >
                <option value="*">Every Month (*)</option>
                <option value="*/3">Every Quarter (*/3)</option>
                <option value="1">January (1)</option>
                <option value="6">June (6)</option>
                <option value="12">December (12)</option>
              </select>
            </div>

            {/* Day of Week */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', width: '100px', flexShrink: 0 }}>Day of Week</span>
              <select
                className="select-control"
                value={buildDayOfWeek}
                onChange={(e) => handleBuildSelect('dow', e.target.value)}
                style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }}
              >
                <option value="*">Every Day (*)</option>
                <option value="1-5">Monday through Friday (1-5)</option>
                <option value="0,6">Saturday & Sunday (0,6)</option>
                <option value="1">Monday only (1)</option>
                <option value="3">Wednesday only (3)</option>
                <option value="5">Friday only (5)</option>
              </select>
            </div>
          </div>

          {/* Schedule Prediction (Right) */}
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', display: 'flex', gap: '6px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              <Clock size={16} style={{ color: 'var(--accent)', marginRight: '4px' }} />
              <span>Upcoming Scheduled Runs</span>
            </h3>

            {nextRuns.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {nextRuns.map((date, idx) => {
                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                        borderLeft: '3px solid var(--accent)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderLeftColor: 'var(--accent)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)' }}>
                        <Calendar size={12} />
                        <span>RUN #{idx + 1}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontWeight: 600, marginTop: '2px' }}>
                        Local: {date.toString().split(' GMT')[0]}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        UTC: {date.toUTCString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ flexGrow: 1, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '13px', padding: '40px' }}>
                Enter a valid cron expression to predict runs.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
