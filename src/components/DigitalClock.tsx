import React, { useEffect, useState } from "react";
import { Clock, Calendar } from "lucide-react";

export const DigitalClock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Extract time parts in Asia/Tehran timezone
  const tehranTimeParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(time);

  const hours = tehranTimeParts.find(p => p.type === "hour")?.value || "00";
  const minutes = tehranTimeParts.find(p => p.type === "minute")?.value || "00";
  const seconds = tehranTimeParts.find(p => p.type === "second")?.value || "00";

  // Shamsi Date formatting in Asia/Tehran timezone
  const shamsiDate = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(time);

  // Year in Shamsi in Asia/Tehran timezone
  const shamsiYear = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
  }).format(time);

  return (
    <div 
      id="digital-clock-container" 
      className="flex items-center gap-3 bg-[#121215]/90 hover:bg-[#16161a] transition-all duration-300 border border-slate-800 px-4 py-2.5 rounded-2xl shadow-lg shadow-black/40 backdrop-blur-md"
    >
      {/* Clock icon and glowing dot */}
      <div className="relative flex items-center justify-center">
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></div>
        <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
        <Clock className="w-5 h-5 text-amber-500" />
      </div>

      {/* Main Time Display */}
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-0.5 font-mono text-base md:text-lg font-black text-white tracking-wider leading-none" dir="ltr">
          <span className="text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">
            {hours}
          </span>
          <span className="text-slate-600 animate-pulse">:</span>
          <span className="text-white">
            {minutes}
          </span>
          <span className="text-slate-600 animate-pulse">:</span>
          <span className="text-slate-400 text-xs md:text-sm self-end pb-0.5">
            {seconds}
          </span>
        </div>

        {/* Shamsi Date */}
        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold mt-1 leading-none">
          <Calendar className="w-2.5 h-2.5 text-slate-500" />
          <span>{shamsiDate}</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-500/90">{shamsiYear}</span>
        </div>
      </div>
    </div>
  );
};
