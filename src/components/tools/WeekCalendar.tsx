import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Globe, Sliders, RefreshCw } from 'lucide-react';

const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getDaysInMonth = (year: number, month: number): number => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number): number => new Date(year, month, 1).getDay();

const getWeekDates = (date: Date): Date[] => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setDate(date.getDate() + diff);
  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const isSameDay = (d1: Date, d2: Date): boolean =>
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

const TIMEZONE_MAPPING: Record<string, string> = {
  'Etc/GMT+12': 'Baker Island (AoE)',
  'Pacific/Pago_Pago': 'Samoa (SST)',
  'Pacific/Honolulu': 'Hawaii (HST)',
  'America/Anchorage': 'Alaska (AKST/AKDT)',
  'America/Los_Angeles': 'Los Angeles (PST/PDT)',
  'America/Tijuana': 'Tijuana (PST/PDT)',
  'America/Phoenix': 'Phoenix (MST)',
  'America/Denver': 'Denver (MST/MDT)',
  'America/Chicago': 'Chicago (CST/CDT)',
  'America/Mexico_City': 'Mexico City (CST/CDT)',
  'America/New_York': 'New York (EST/EDT)',
  'America/Bogota': 'Bogota (EST)',
  'America/Halifax': 'Halifax (AST/ADT)',
  'America/St_Johns': 'Newfoundland (NST/NDT)',
  'America/Sao_Paulo': 'São Paulo (BRT/BRST)',
  'America/Argentina/Buenos_Aires': 'Buenos Aires (ART)',
  'Atlantic/South_Georgia': 'South Georgia (GST)',
  'Atlantic/Azores': 'Azores (AZOT/AZODT)',
  'Atlantic/Cape_Verde': 'Cape Verde (CVT)',
  'Europe/London': 'London (GMT/BST)',
  'Europe/Paris': 'Paris (CET/CEST)',
  'Europe/Berlin': 'Berlin (CET/CEST)',
  'Europe/Athens': 'Athens (EET/EEST)',
  'Africa/Cairo': 'Cairo (EET/EEST)',
  'Africa/Johannesburg': 'Johannesburg (SAST)',
  'Europe/Moscow': 'Moscow (MSK)',
  'Asia/Riyadh': 'Riyadh (AST)',
  'Africa/Nairobi': 'Nairobi (EAT)',
  'Asia/Tehran': 'Tehran (IRST/IRDT)',
  'Asia/Dubai': 'Dubai (GST)',
  'Asia/Kabul': 'Kabul (AFT)',
  'Asia/Karachi': 'Karachi (PKT)',
  'Asia/Kolkata': 'Mumbai / Kolkata (IST)',
  'Asia/Kathmandu': 'Kathmandu (NPT)',
  'Asia/Dhaka': 'Dhaka (BST)',
  'Asia/Yangon': 'Yangon (MMT)',
  'Asia/Bangkok': 'Bangkok (ICT)',
  'Asia/Singapore': 'Singapore (SGT)',
  'Asia/Shanghai': 'Shanghai / Beijing (CST)',
  'Asia/Hong_Kong': 'Hong Kong (HKT)',
  'Asia/Taipei': 'Taipei (CST)',
  'Asia/Tokyo': 'Tokyo (JST)',
  'Asia/Seoul': 'Seoul (KST)',
  'Australia/Perth': 'Perth (AWST)',
  'Australia/Adelaide': 'Adelaide (ACST/ACDT)',
  'Australia/Sydney': 'Sydney (AEST/AEDT)',
  'Pacific/Guadalcanal': 'Solomon Islands (SBT)',
  'Pacific/Auckland': 'Auckland (NZST/NZDT)',
  'Pacific/Fiji': 'Fiji (FJT)',
  'Pacific/Tongatapu': 'Tonga (TOT)',
  'Pacific/Apia': 'Samoa (WST)',
  'Pacific/Kiritimati': 'Line Islands (LINT)'
};

const getTimezoneOptions = (date: Date) => {
  const options = Object.entries(TIMEZONE_MAPPING).map(([tz, displayName]) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'longOffset'
      });
      const parts = formatter.formatToParts(date);
      const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
      return { value: tz, label: `${displayName} (${offsetPart})` };
    } catch {
      return { value: tz, label: displayName };
    }
  });

  const getOffsetMinutes = (tz: string) => {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'longOffset'
      });
      const parts = formatter.formatToParts(date);
      const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value || '';
      if (offsetStr === 'GMT') return 0;
      const match = offsetStr.match(/GMT([+-])(\d{1,2}):(\d{2})/);
      if (!match) return 0;
      const [_, sign, hours, minutes] = match;
      const val = Number(hours) * 60 + Number(minutes);
      return sign === '+' ? val : -val;
    } catch {
      return 0;
    }
  };

  return options.sort((a, b) => getOffsetMinutes(a.value) - getOffsetMinutes(b.value));
};

// Helper to parse YYYY-MM-DDTHH:mm in a specific timezone to a UTC Date
const tzStringToDate = (dateTimeStr: string, timeZone: string): Date => {
  if (!dateTimeStr) return new Date();
  if (timeZone === 'local') {
    return new Date(dateTimeStr);
  }

  try {
    const [datePart, timePart] = dateTimeStr.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);

    const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false
    });

    const parts = formatter.formatToParts(utcDate);
    const getPart = (type: string) => Number(parts.find(p => p.type === type)?.value);

    const fYear = getPart('year');
    const fMonth = getPart('month');
    const fDay = getPart('day');
    const fHour = getPart('hour') % 24;
    const fMinute = getPart('minute');

    const formattedUtc = Date.UTC(fYear, fMonth - 1, fDay, fHour, fMinute);
    const diff = utcDate.getTime() - formattedUtc;

    return new Date(utcDate.getTime() + diff);
  } catch (e) {
    console.error('Error in tzStringToDate, falling back to local parsing:', e);
    return new Date(dateTimeStr);
  }
};

// Helper to format Date into YYYY-MM-DDTHH:mm in a target timezone
const toTzISOString = (date: Date, timeZone: string): string => {
  const toLocalISOString = (d: Date): string => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  if (timeZone === 'local') {
    return toLocalISOString(date);
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(date);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';

    const year = getPart('year');
    const month = getPart('month');
    const day = getPart('day');
    let hour = getPart('hour');
    if (hour === '24') hour = '00';
    const minute = getPart('minute');

    return `${year}-${month}-${day}T${hour}:${minute}`;
  } catch {
    return toLocalISOString(date);
  }
};

const formatTimeInTimeZone = (date: Date, timeZone: string) => {
  if (timeZone === 'local') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }
  return date.toLocaleTimeString([], { timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};

const formatDateInTimeZone = (date: Date, timeZone: string) => {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  if (timeZone !== 'local') {
    options.timeZone = timeZone;
  }
  return date.toLocaleDateString('en-US', options);
};

const getTzOffsetLabel = (date: Date, timeZone: string) => {
  if (timeZone === 'local') {
    const offsetMin = -date.getTimezoneOffset();
    const sign = offsetMin >= 0 ? '+' : '-';
    const hours = String(Math.floor(Math.abs(offsetMin) / 60)).padStart(2, '0');
    const mins = String(Math.abs(offsetMin) % 60).padStart(2, '0');
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return `GMT${sign}${hours}:${mins} (${tzName})`;
  }

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset'
    });
    const parts = formatter.formatToParts(date);
    const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
    return `${offsetPart} (${timeZone})`;
  } catch {
    return timeZone;
  }
};

export const WeekCalendar: React.FC = () => {
  const [today] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());

  // Calendar view state
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  // Timezone clock timezones
  const [clockTimezones, setClockTimezones] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('devbox-clock-timezones');
      return saved ? JSON.parse(saved) : ['UTC', 'America/New_York', 'Asia/Kolkata'];
    } catch {
      return ['UTC', 'America/New_York', 'Asia/Kolkata'];
    }
  });

  // Time converter state
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customTimeStr, setCustomTimeStr] = useState('');
  const [customTimeTz, setCustomTimeTz] = useState('local');

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const weekDates = getWeekDates(today);
  const weekNumber = getWeekNumber(today);

  // Calendar grid generation
  const generateCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const prevMonthDays = getDaysInMonth(calendarYear, calendarMonth - 1);
    const cells: { day: number; month: 'prev' | 'current' | 'next'; date: Date }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const month = calendarMonth === 0 ? 11 : calendarMonth - 1;
      const year = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
      cells.push({ day: d, month: 'prev', date: new Date(year, month, d) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ day: i, month: 'current', date: new Date(calendarYear, calendarMonth, i) });
    }
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const month = calendarMonth === 11 ? 0 : calendarMonth + 1;
      const year = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
      cells.push({ day: i, month: 'next', date: new Date(year, month, i) });
    }
    return cells;
  };

  const calendarCells = generateCalendarGrid();
  const calendarWeeks: { weekNum: number; cells: typeof calendarCells }[] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    const weekCells = calendarCells.slice(i, i + 7);
    const thursday = weekCells[3].date;
    calendarWeeks.push({ weekNum: getWeekNumber(thursday), cells: weekCells });
  }

  const navigateMonth = (dir: -1 | 1) => {
    let newMonth = calendarMonth + dir;
    let newYear = calendarYear;
    if (newMonth < 0) { newMonth = 11; newYear--; }
    if (newMonth > 11) { newMonth = 0; newYear++; }
    setCalendarMonth(newMonth);
    setCalendarYear(newYear);
  };

  const goToToday = () => {
    setCalendarMonth(today.getMonth());
    setCalendarYear(today.getFullYear());
  };

  const isInCurrentWeek = (date: Date): boolean => weekDates.some(wd => isSameDay(wd, date));

  // Determine the active date for the clocks based on mode
  const activeDate = isCustomMode && customTimeStr
    ? tzStringToDate(customTimeStr, customTimeTz)
    : currentTime;

  const updateClockTz = (index: number, val: string) => {
    const updated = [...clockTimezones];
    updated[index] = val;
    setClockTimezones(updated);
    try {
      localStorage.setItem('devbox-clock-timezones', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomTimeChange = (val: string) => {
    setCustomTimeStr(val);
    setIsCustomMode(true);
  };

  const handleCustomTzChange = (val: string) => {
    setCustomTimeTz(val);
    setCustomTimeStr(toTzISOString(activeDate, val));
    setIsCustomMode(true);
  };

  const handleResetTime = () => {
    setIsCustomMode(false);
    setCustomTimeStr('');
    setCustomTimeTz('local');
  };

  const adjustCustomTime = (hours: number) => {
    const currentMoment = activeDate;
    const newMoment = new Date(currentMoment.getTime() + hours * 3600000);
    setIsCustomMode(true);
    setCustomTimeStr(toTzISOString(newMoment, customTimeTz));
  };

  // Get what to display in the datetime-local input
  const displayInputVal = isCustomMode ? customTimeStr : toTzISOString(currentTime, customTimeTz);

  const renderCustomClockCard = (index: number) => {
    const tz = clockTimezones[index];
    return (
      <div className="tool-card" style={{ padding: '12px', minHeight: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%' }}>
          <Globe size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <select
            value={tz}
            onChange={(e) => updateClockTz(index, e.target.value)}
            className="select-control"
            style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '6px',
              width: '100%',
              height: '26px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            {getTimezoneOptions(activeDate).map(t => (
              <option key={t.value} value={t.value} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
            {formatTimeInTimeZone(activeDate, tz)}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {formatDateInTimeZone(activeDate, tz)}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {getTzOffsetLabel(activeDate, tz)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', overflow: 'hidden' }}>
      {/* Page Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Calendar & Time</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Interactive local calendar and multi-timezone converter</p>
        </div>
      </div>

      {/* Main Two-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', flex: 1, minHeight: 0 }}>
        {/* Left Column: Calendar & Stats Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
          {/* Date Info Card */}
          <div className="tool-card" style={{ padding: '16px', flexGrow: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date Information</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Today</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Week</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                    W{weekNumber}
                  </div>
                </div>

                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Week Range</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {MONTH_NAMES[weekDates[0].getMonth()].slice(0, 3)} {weekDates[0].getDate()} – {MONTH_NAMES[weekDates[6].getMonth()].slice(0, 3)} {weekDates[6].getDate()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Calendar Card */}
          <div className="tool-card" style={{ padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button onClick={() => navigateMonth(-1)} className="btn btn-secondary" style={{ padding: '4px 6px', borderRadius: '6px' }}><ChevronLeft size={14} /></button>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', minWidth: '95px', textAlign: 'center' }}>
                  {MONTH_NAMES[calendarMonth]} {calendarYear}
                </span>
                <button onClick={() => navigateMonth(1)} className="btn btn-secondary" style={{ padding: '4px 6px', borderRadius: '6px' }}><ChevronRight size={14} /></button>
              </div>
              <button onClick={goToToday} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '6px' }}>Today</button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '26px repeat(7, 1fr)', gap: '2px', flex: 1, alignContent: 'start', overflowY: 'auto' }}>
              {/* Header Days */}
              <div style={{ padding: '4px 0', textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)' }}>WK</div>
              {DAY_NAMES_SHORT.map(day => (
                <div key={day} style={{ padding: '4px 0', textAlign: 'center', fontSize: '9px', fontWeight: 700, color: (day === 'Sat' || day === 'Sun') ? 'var(--error)' : 'var(--text-muted)' }}>
                  {day.slice(0, 2)}
                </div>
              ))}

              {/* Grid Cells */}
              {calendarWeeks.map((week, weekIdx) => (
                <React.Fragment key={weekIdx}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700,
                    color: week.weekNum === weekNumber ? 'var(--accent)' : 'var(--text-muted)',
                    background: week.weekNum === weekNumber ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                    borderRadius: '4px',
                    height: '24px'
                  }}>
                    {week.weekNum}
                  </div>
                  {week.cells.map((cell, dayIdx) => {
                    const isCurrentDay = isSameDay(cell.date, today);
                    const isCustomDay = isCustomMode && isSameDay(cell.date, activeDate);
                    const inCurrentWeek = isInCurrentWeek(cell.date);
                    const isWeekend = dayIdx >= 5;
                    const isOtherMonth = cell.month !== 'current';

                    let cellBg = 'transparent';
                    let cellBorder = '1px solid transparent';
                    let cellColor = 'var(--text-primary)';
                    let cellShadow = 'none';

                    if (isCurrentDay) {
                      cellBg = 'var(--accent)';
                      cellColor = '#ffffff';
                      cellShadow = '0 1px 4px rgba(168, 85, 247, 0.4)';
                    } else if (isCustomDay) {
                      cellBg = 'rgba(251, 191, 36, 0.15)';
                      cellBorder = '1px dashed var(--warning)';
                      cellColor = 'var(--warning)';
                    } else if (inCurrentWeek && !isOtherMonth) {
                      cellBg = 'rgba(168, 85, 247, 0.08)';
                      cellBorder = '1px solid rgba(168, 85, 247, 0.15)';
                      cellColor = isWeekend ? 'rgba(244, 63, 94, 0.9)' : 'var(--text-primary)';
                    } else {
                      cellColor = isOtherMonth ? 'var(--text-muted)' : isWeekend ? 'rgba(244, 63, 94, 0.8)' : 'var(--text-primary)';
                    }

                    return (
                      <div
                        key={dayIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: (isCurrentDay || isCustomDay) ? 800 : 500,
                          height: '24px',
                          cursor: 'default',
                          color: cellColor,
                          background: cellBg,
                          border: cellBorder,
                          boxShadow: cellShadow
                        }}
                      >
                        {cell.day}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Clocks & Timezone Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0, overflowY: 'auto' }}>
          {/* Main Digital Clock Card */}
          <div className="tool-card" style={{
            padding: '16px 20px',
            flexGrow: 0,
            background: isCustomMode ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(217, 119, 6, 0.04) 100%)' : 'linear-gradient(135deg, rgba(168, 85, 247, 0.08) 0%, rgba(99, 102, 241, 0.04) 100%)',
            border: isCustomMode ? '1px solid rgba(251, 191, 36, 0.25)' : '1px solid rgba(168, 85, 247, 0.2)',
            boxShadow: isCustomMode ? '0 4px 20px rgba(251, 191, 36, 0.05)' : 'none',
            position: 'relative'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} style={{ color: isCustomMode ? 'var(--warning)' : 'var(--accent)' }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: isCustomMode ? 'var(--warning)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  {isCustomMode ? 'Timezone Converter (Paused)' : 'System Clock (Live)'}
                </span>
              </div>
              {isCustomMode && (
                <span style={{ fontSize: '10px', background: 'rgba(251, 191, 36, 0.15)', color: 'var(--warning)', padding: '2px 8px', borderRadius: '10px', fontWeight: 700 }}>
                  CUSTOM TIME
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '38px',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '1px',
                lineHeight: 1
              }}>
                {formatTimeInTimeZone(activeDate, 'local')}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {formatDateInTimeZone(activeDate, 'local')}
              </div>
            </div>
          </div>

          {/* 4 clocks grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', flexShrink: 0 }}>
            {/* System Time Card */}
            <div className="tool-card" style={{ padding: '12px', minHeight: '130px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', height: '26px' }}>
                <Globe size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span>Local System Time</span>
              </div>
              <div style={{ marginTop: 'auto' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.5px' }}>
                  {formatTimeInTimeZone(activeDate, 'local')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {formatDateInTimeZone(activeDate, 'local')}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {getTzOffsetLabel(activeDate, 'local')}
                </div>
              </div>
            </div>

            {/* Custom Timezones */}
            {renderCustomClockCard(0)}
            {renderCustomClockCard(1)}
            {renderCustomClockCard(2)}
          </div>

          {/* Timezone Converter Panel */}
          <div className="tool-card" style={{ padding: '16px', flexGrow: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Timezone Converter</span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {/* Custom Time Picker */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Set Base Date & Time</label>
                <input
                  type="datetime-local"
                  className="input-control"
                  value={displayInputVal}
                  onChange={(e) => handleCustomTimeChange(e.target.value)}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                />
              </div>

              {/* Base Timezone */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>Base Timezone</label>
                <select
                  className="select-control"
                  value={customTimeTz}
                  onChange={(e) => handleCustomTzChange(e.target.value)}
                  style={{ fontSize: '13px', padding: '8px 10px' }}
                >
                  <option value="local">Local (System Time) ({getTzOffsetLabel(activeDate, 'local')})</option>
                  {getTimezoneOptions(activeDate).map(t => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick adjustment buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => adjustCustomTime(-1)}
                  className="btn btn-secondary"
                  title="Subtract 1 Hour"
                  style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700 }}
                >
                  -1h
                </button>
                <button
                  onClick={() => adjustCustomTime(1)}
                  className="btn btn-secondary"
                  title="Add 1 Hour"
                  style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700 }}
                >
                  +1h
                </button>
                <button
                  onClick={() => adjustCustomTime(-24)}
                  className="btn btn-secondary"
                  title="Subtract 1 Day"
                  style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700 }}
                >
                  -1d
                </button>
                <button
                  onClick={() => adjustCustomTime(24)}
                  className="btn btn-secondary"
                  title="Add 1 Day"
                  style={{ padding: '8px 12px', fontSize: '12px', fontWeight: 700 }}
                >
                  +1d
                </button>
              </div>

              {/* Reset to live button */}
              {isCustomMode && (
                <button
                  onClick={handleResetTime}
                  className="btn btn-primary"
                  style={{ padding: '8px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', height: '37px' }}
                >
                  <RefreshCw size={12} /> Reset to Live
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
