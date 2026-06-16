import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Sun, Moon, Clock, Sunrise, Sunset } from 'lucide-react';

// Helper functions
const getWeekNumber = (date: Date): number => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

const getWeekDates = (date: Date): Date[] => {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday start
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

const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
};

export const WeekCalendar: React.FC = () => {
  const [today] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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
    // Adjust for Monday start (0=Mon, 6=Sun)
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const prevMonthDays = getDaysInMonth(calendarYear, calendarMonth - 1);
    
    const cells: { day: number; month: 'prev' | 'current' | 'next'; date: Date }[] = [];
    
    // Previous month days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const month = calendarMonth === 0 ? 11 : calendarMonth - 1;
      const year = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
      cells.push({ day: d, month: 'prev', date: new Date(year, month, d) });
    }
    
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      cells.push({ day: i, month: 'current', date: new Date(calendarYear, calendarMonth, i) });
    }
    
    // Next month days
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const month = calendarMonth === 11 ? 0 : calendarMonth + 1;
      const year = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
      cells.push({ day: i, month: 'next', date: new Date(year, month, i) });
    }
    
    return cells;
  };

  const calendarCells = generateCalendarGrid();

  // Group into weeks for week number display
  const calendarWeeks: { weekNum: number; cells: typeof calendarCells }[] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    const weekCells = calendarCells.slice(i, i + 7);
    // Use Thursday of that week for ISO week number
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

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

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

  // Check if a date is in the current week
  const isInCurrentWeek = (date: Date): boolean => {
    return weekDates.some(wd => isSameDay(wd, date));
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '20px' }}>
      {/* Greeting Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            {getGreetingIcon()}
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {getGreeting()}
            </h1>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
            {today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          background: 'rgba(168, 85, 247, 0.1)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          borderRadius: '10px'
        }}>
          <Clock size={16} style={{ color: 'var(--accent)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '1px' }}>
            {formatTime(currentTime)}
          </span>
        </div>
      </div>

      {/* Current Week Strip */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(99, 102, 241, 0.08) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.2)',
        borderRadius: '14px',
        padding: '20px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative glow */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-10%',
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>This Week</span>
          </div>
          <div style={{
            padding: '5px 14px',
            background: 'var(--accent)',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '0.5px'
          }}>
            WEEK {weekNumber}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', position: 'relative' }}>
          {weekDates.map((date, idx) => {
            const isToday = isSameDay(date, today);
            const isWeekend = idx >= 5;
            return (
              <div key={idx} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '12px 8px',
                borderRadius: '12px',
                background: isToday
                  ? 'var(--accent)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: isToday ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'all 0.2s ease',
                cursor: 'default',
                boxShadow: isToday ? '0 4px 20px rgba(168, 85, 247, 0.4)' : 'none'
              }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isToday ? 'rgba(255,255,255,0.8)' : isWeekend ? 'var(--error)' : 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px'
                }}>
                  {DAY_NAMES_SHORT[idx]}
                </span>
                <span style={{
                  fontSize: '20px',
                  fontWeight: 800,
                  color: isToday ? '#ffffff' : 'var(--text-primary)',
                  lineHeight: 1
                }}>
                  {date.getDate()}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: isToday ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)',
                  marginTop: '4px'
                }}>
                  {MONTH_NAMES[date.getMonth()].slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Section: Calendar + Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px', flexGrow: 1, minHeight: 0 }}>
        {/* Navigatable Calendar */}
        <div className="tool-card" style={{ padding: '18px', overflow: 'hidden' }}>
          {/* Calendar Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => navigateMonth(-1)}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', borderRadius: '8px' }}
              >
                <ChevronLeft size={16} />
              </button>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, minWidth: '160px', textAlign: 'center' }}>
                {MONTH_NAMES[calendarMonth]} {calendarYear}
              </h2>
              <button
                onClick={() => navigateMonth(1)}
                className="btn btn-secondary"
                style={{ padding: '6px 8px', borderRadius: '8px' }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <button onClick={goToToday} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '12px' }}>
              Today
            </button>
          </div>

          {/* Calendar Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '36px repeat(7, 1fr)', gap: '2px' }}>
            {/* Header Row */}
            <div style={{ padding: '6px 2px', textAlign: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>
              WK
            </div>
            {DAY_NAMES_SHORT.map(day => (
              <div key={day} style={{
                padding: '6px 2px',
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 700,
                color: (day === 'Sat' || day === 'Sun') ? 'var(--error)' : 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {day}
              </div>
            ))}

            {/* Calendar Rows */}
            {calendarWeeks.map((week, weekIdx) => (
              <React.Fragment key={weekIdx}>
                {/* Week Number */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: week.weekNum === weekNumber ? 'var(--accent)' : 'var(--text-muted)',
                  background: week.weekNum === weekNumber ? 'rgba(168, 85, 247, 0.12)' : 'transparent',
                  borderRadius: '6px'
                }}>
                  {week.weekNum}
                </div>
                {/* Days */}
                {week.cells.map((cell, dayIdx) => {
                  const isCurrentDay = isSameDay(cell.date, today);
                  const inCurrentWeek = isInCurrentWeek(cell.date);
                  const isWeekend = dayIdx >= 5;
                  const isOtherMonth = cell.month !== 'current';

                  return (
                    <div key={dayIdx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '8px 4px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: isCurrentDay ? 800 : 500,
                      cursor: 'default',
                      position: 'relative',
                      color: isCurrentDay
                        ? '#ffffff'
                        : isOtherMonth
                          ? 'var(--text-muted)'
                          : isWeekend
                            ? 'rgba(244, 63, 94, 0.8)'
                            : 'var(--text-primary)',
                      background: isCurrentDay
                        ? 'var(--accent)'
                        : inCurrentWeek && !isOtherMonth
                          ? 'rgba(168, 85, 247, 0.08)'
                          : 'transparent',
                      border: inCurrentWeek && !isCurrentDay && !isOtherMonth
                        ? '1px solid rgba(168, 85, 247, 0.15)'
                        : '1px solid transparent',
                      boxShadow: isCurrentDay ? '0 2px 12px rgba(168, 85, 247, 0.4)' : 'none',
                      transition: 'all 0.15s ease'
                    }}>
                      {cell.day}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Stats Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Year Progress */}
          <div className="tool-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
              Year Progress
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)' }}>{yearProgress}%</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{today.getFullYear()}</span>
            </div>
            <div style={{
              height: '6px',
              background: 'var(--border-color)',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${yearProgress}%`,
                background: 'linear-gradient(90deg, var(--accent), #818cf8)',
                borderRadius: '3px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="tool-card" style={{ padding: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Quick Stats
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Day of Year</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{dayOfYear}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Days Remaining</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{Math.ceil(daysLeft)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Week Number</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>W{weekNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Quarter</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>Q{Math.ceil((today.getMonth() + 1) / 3)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Leap Year</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {(today.getFullYear() % 4 === 0 && (today.getFullYear() % 100 !== 0 || today.getFullYear() % 400 === 0)) ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Today Details */}
          <div className="tool-card" style={{ padding: '16px', flexGrow: 1 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
              Today
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                padding: '10px 12px',
                background: 'rgba(168, 85, 247, 0.08)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--accent)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Full Date</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {DAY_NAMES_FULL[today.getDay() === 0 ? 6 : today.getDay() - 1]}, {MONTH_NAMES[today.getMonth()]} {today.getDate()}, {today.getFullYear()}
                </div>
              </div>
              <div style={{
                padding: '10px 12px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--success)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Week Range</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {MONTH_NAMES[weekDates[0].getMonth()].slice(0, 3)} {weekDates[0].getDate()} – {MONTH_NAMES[weekDates[6].getMonth()].slice(0, 3)} {weekDates[6].getDate()}
                </div>
              </div>
              <div style={{
                padding: '10px 12px',
                background: 'rgba(251, 191, 36, 0.08)',
                borderRadius: '8px',
                borderLeft: '3px solid var(--warning)'
              }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '2px' }}>Unix Epoch</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {Math.floor(currentTime.getTime() / 1000)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
