import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sun, Moon, Clock, Sunrise, Sunset } from 'lucide-react';

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
const DAY_NAMES_FULL = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const isSameDay = (d1: Date, d2: Date): boolean =>
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();

export const WeekCalendar: React.FC = () => {
  const [today] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const weekDates = getWeekDates(today);
  const weekNumber = getWeekNumber(today);
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const daysLeft = (new Date(today.getFullYear(), 11, 31).getTime() - today.getTime()) / 86400000;
  const yearProgress = ((dayOfYear / 365) * 100).toFixed(1);

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

  const goToToday = () => { setCalendarMonth(today.getMonth()); setCalendarYear(today.getFullYear()); };
  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getGreetingIcon = () => {
    const hour = currentTime.getHours();
    if (hour < 6) return <Moon size={18} style={{ color: '#818cf8' }} />;
    if (hour < 12) return <Sunrise size={18} style={{ color: '#fbbf24' }} />;
    if (hour < 17) return <Sun size={18} style={{ color: '#f97316' }} />;
    return <Sunset size={18} style={{ color: '#f472b6' }} />;
  };

  const isInCurrentWeek = (date: Date): boolean => weekDates.some(wd => isSameDay(wd, date));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            {getGreetingIcon()}
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{getGreeting()}</h1>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.25)', borderRadius: '10px' }}>
          <Clock size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '1px' }}>{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Week Strip */}
      <div style={{ background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '12px', padding: '12px 16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-50%', right: '-10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>This Week</span>
          </div>
          <div style={{ padding: '3px 10px', background: 'var(--accent)', borderRadius: '14px', fontSize: '10px', fontWeight: 700, color: '#fff', letterSpacing: '0.5px' }}>WEEK {weekNumber}</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', position: 'relative' }}>
          {weekDates.map((date, idx) => {
            const isToday = isSameDay(date, today);
            const isWeekend = idx >= 5;
            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 4px', borderRadius: '10px', background: isToday ? 'var(--accent)' : 'rgba(255, 255, 255, 0.04)', border: isToday ? 'none' : '1px solid rgba(255, 255, 255, 0.06)', boxShadow: isToday ? '0 4px 16px rgba(168, 85, 247, 0.4)' : 'none' }}>
                <span style={{ fontSize: '10px', fontWeight: 600, color: isToday ? 'rgba(255,255,255,0.8)' : isWeekend ? 'var(--error)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>{DAY_NAMES_SHORT[idx]}</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: isToday ? '#ffffff' : 'var(--text-primary)', lineHeight: 1 }}>{date.getDate()}</span>
                <span style={{ fontSize: '9px', color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '2px' }}>{MONTH_NAMES[date.getMonth()].slice(0, 3)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Middle: Calendar + Stats side by side — content-sized, no flex-grow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px' }}>
        {/* Calendar */}
        <div className="tool-card" style={{ padding: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button onClick={() => navigateMonth(-1)} className="btn btn-secondary" style={{ padding: '4px 6px', borderRadius: '6px' }}><ChevronLeft size={14} /></button>
              <h2 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, minWidth: '130px', textAlign: 'center' }}>{MONTH_NAMES[calendarMonth]} {calendarYear}</h2>
              <button onClick={() => navigateMonth(1)} className="btn btn-secondary" style={{ padding: '4px 6px', borderRadius: '6px' }}><ChevronRight size={14} /></button>
            </div>
            <button onClick={goToToday} className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>Today</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(7, 1fr)', gap: '1px' }}>
            <div style={{ padding: '3px 2px', textAlign: 'center', fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)' }}>WK</div>
            {DAY_NAMES_SHORT.map(day => (
              <div key={day} style={{ padding: '3px 2px', textAlign: 'center', fontSize: '9px', fontWeight: 700, color: (day === 'Sat' || day === 'Sun') ? 'var(--error)' : 'var(--text-muted)', textTransform: 'uppercase' }}>{day}</div>
            ))}
            {calendarWeeks.map((week, weekIdx) => (
              <React.Fragment key={weekIdx}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: week.weekNum === weekNumber ? 'var(--accent)' : 'var(--text-muted)', background: week.weekNum === weekNumber ? 'rgba(168, 85, 247, 0.12)' : 'transparent', borderRadius: '4px' }}>{week.weekNum}</div>
                {week.cells.map((cell, dayIdx) => {
                  const isCurrentDay = isSameDay(cell.date, today);
                  const inCurrentWeek = isInCurrentWeek(cell.date);
                  const isWeekend = dayIdx >= 5;
                  const isOtherMonth = cell.month !== 'current';
                  return (
                    <div key={dayIdx} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 2px', borderRadius: '5px', fontSize: '11px', fontWeight: isCurrentDay ? 800 : 500, cursor: 'default',
                      color: isCurrentDay ? '#ffffff' : isOtherMonth ? 'var(--text-muted)' : isWeekend ? 'rgba(244, 63, 94, 0.8)' : 'var(--text-primary)',
                      background: isCurrentDay ? 'var(--accent)' : inCurrentWeek && !isOtherMonth ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                      border: inCurrentWeek && !isCurrentDay && !isOtherMonth ? '1px solid rgba(168, 85, 247, 0.15)' : '1px solid transparent',
                      boxShadow: isCurrentDay ? '0 2px 8px rgba(168, 85, 247, 0.4)' : 'none'
                    }}>{cell.day}</div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Right Stats — Year Progress + Quick Stats only */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="tool-card" style={{ padding: '10px 12px' }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '5px' }}>Year Progress</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{yearProgress}%</span>
              <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{today.getFullYear()}</span>
            </div>
            <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${yearProgress}%`, background: 'linear-gradient(90deg, var(--accent), #818cf8)', borderRadius: '2px' }} />
            </div>
          </div>
          <div className="tool-card" style={{ padding: '10px 12px', flex: 1 }}>
            <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>Quick Stats</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Day of Year</span><span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{dayOfYear}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Days Remaining</span><span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{Math.ceil(daysLeft)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Week Number</span><span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>W{weekNumber}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Quarter</span><span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Q{Math.ceil((today.getMonth() + 1) / 3)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer — Today info as a horizontal bar pinned to bottom */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 'auto' }}>
        <div style={{ flex: 1, minWidth: '140px', padding: '8px 12px', background: 'rgba(168, 85, 247, 0.08)', borderRadius: '8px', borderLeft: '3px solid var(--accent)' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>TODAY</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {DAY_NAMES_FULL[today.getDay() === 0 ? 6 : today.getDay() - 1]}, {MONTH_NAMES[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', borderLeft: '3px solid var(--success)' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>WEEK RANGE</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
            {MONTH_NAMES[weekDates[0].getMonth()].slice(0, 3)} {weekDates[0].getDate()} – {MONTH_NAMES[weekDates[6].getMonth()].slice(0, 3)} {weekDates[6].getDate()}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: '140px', padding: '8px 12px', background: 'rgba(251, 191, 36, 0.08)', borderRadius: '8px', borderLeft: '3px solid var(--warning)' }}>
          <div style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>UNIX EPOCH</div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
            {Math.floor(currentTime.getTime() / 1000)}
          </div>
        </div>
      </div>
    </div>
  );
};
