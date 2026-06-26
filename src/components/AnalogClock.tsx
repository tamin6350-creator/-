import React, { useEffect, useState } from "react";

export const AnalogClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // 100ms interval for smooth sweeping seconds hand
    const timer = setInterval(() => {
      setTime(new Date());
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const ms = time.getMilliseconds();
  const secs = time.getSeconds() + ms / 1000;
  const mins = time.getMinutes() + secs / 60;
  const hours = (time.getHours() % 12) + mins / 60;

  const secDeg = secs * 6; // 360 / 60
  const minDeg = mins * 6;
  const hourDeg = hours * 30; // 360 / 12

  // Shamsi Date formatting
  const shamsiDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(time);

  // Gregorian Date formatting (Persian style)
  const gregorianPersianDate = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(time);

  // Gregorian Date formatting (English style)
  const gregorianEngDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(time);

  return (
    <div id="analog-clock-container" className="flex items-center gap-4 bg-slate-900/40 hover:bg-slate-900/60 transition-colors border border-slate-800/80 p-3 rounded-2xl">
      {/* SVG Clock Face */}
      <div className="relative w-14 h-14 rounded-full bg-[#121215] border-2 border-slate-800 flex items-center justify-center shadow-inner">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Hour markers */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
            <line
              key={deg}
              x1="50"
              y1="8"
              x2="50"
              y2="13"
              className="stroke-slate-700"
              strokeWidth="2"
              strokeLinecap="round"
              transform={`rotate(${deg} 50 50)`}
            />
          ))}

          {/* Hour hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="28"
            className="stroke-slate-100"
            strokeWidth="3.5"
            strokeLinecap="round"
            transform={`rotate(${hourDeg} 50 50)`}
          />

          {/* Minute hand */}
          <line
            x1="50"
            y1="50"
            x2="50"
            y2="18"
            className="stroke-slate-300"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${minDeg} 50 50)`}
          />

          {/* Smooth Sweeping Second hand */}
          <line
            x1="50"
            y1="52"
            x2="50"
            y2="12"
            className="stroke-amber-500"
            strokeWidth="1.5"
            strokeLinecap="round"
            transform={`rotate(${secDeg} 50 50)`}
          />

          {/* Center cap */}
          <circle cx="50" cy="50" r="3.5" className="fill-amber-500 stroke-slate-950" strokeWidth="1" />
        </svg>
      </div>

      {/* Stacked Dates */}
      <div className="flex flex-col text-right justify-center">
        <span className="text-[11px] font-extrabold text-amber-500 tracking-normal leading-tight">
          {shamsiDate}
        </span>
        <span className="text-[9px] font-bold text-slate-300 mt-0.5 leading-tight">
          {gregorianPersianDate} (میلادی)
        </span>
        <span className="text-[9px] font-mono text-slate-500 mt-0.5 leading-none font-bold">
          {gregorianEngDate}
        </span>
      </div>
    </div>
  );
};
