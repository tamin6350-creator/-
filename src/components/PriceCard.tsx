import React, { useEffect, useState, useRef } from "react";
import { PriceItem } from "../types";
import { TrendingUp, TrendingDown, Minus, Clock, ArrowUpRight, ArrowDownRight, Award } from "lucide-react";

interface PriceCardProps {
  item: PriceItem;
  history: number[];
  onClickAlert: () => void;
  hasActiveAlert: boolean;
}

export const PriceCard: React.FC<PriceCardProps> = ({ item, history, onClickAlert, hasActiveAlert }) => {
  const [flash, setFlash] = useState<"up" | "down" | null>(null);
  const prevPriceRef = useRef<string>(item.price);

  useEffect(() => {
    if (prevPriceRef.current !== item.price) {
      const prev = parseFloat(prevPriceRef.current.replace(/,/g, ""));
      const curr = parseFloat(item.price.replace(/,/g, ""));

      if (!isNaN(prev) && !isNaN(curr)) {
        if (curr > prev) {
          setFlash("up");
        } else if (curr < prev) {
          setFlash("down");
        }
      }
      prevPriceRef.current = item.price;

      const timer = setTimeout(() => {
        setFlash(null);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [item.price]);

  const isPositive = !item.percent.includes("-") && item.percent !== "0" && item.percent !== "0.00%" && item.percent !== "0%";
  const isZero = item.percent === "0" || item.percent === "0.00%" || item.percent === "0%" || item.change === "0";

  // Determine icon and color based on the item key
  const getItemTheme = (key: string) => {
    if (key.includes("gold") || key.includes("geram") || key === "mithqal" || key === "ons") {
      return {
        bg: "bg-slate-900/50 border-slate-800 hover:border-amber-500/35 hover:bg-slate-900/80",
        iconBg: "bg-amber-500/10 text-amber-400 border border-amber-500/15",
        textColor: "text-amber-500",
        priceColor: "text-amber-500"
      };
    }
    if (key.includes("silver") || key.includes("ons_silver")) {
      return {
        bg: "bg-slate-900/50 border-slate-800 hover:border-slate-400/35 hover:bg-slate-900/80",
        iconBg: "bg-slate-400/10 text-slate-300 border border-slate-400/15",
        textColor: "text-slate-300",
        priceColor: "text-slate-100"
      };
    }
    if (key.includes("sekke") || key === "bahar" || key === "nim" || key === "rob") {
      return {
        bg: "bg-slate-900/50 border-slate-800 hover:border-yellow-500/35 hover:bg-slate-900/80",
        iconBg: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/15",
        textColor: "text-yellow-400",
        priceColor: "text-slate-100"
      };
    }
    // Default currency theme
    return {
      bg: "bg-slate-900/50 border-slate-800 hover:border-emerald-500/35 hover:bg-slate-900/80",
      iconBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15",
      textColor: "text-emerald-400",
      priceColor: "text-slate-100"
    };
  };

  const theme = getItemTheme(item.key);

  // Render SVG sparkline from history values
  const renderSparkline = () => {
    if (!history || history.length < 2) return null;

    const width = 140;
    const height = 44;
    const padding = 2;

    const min = Math.min(...history);
    const max = Math.max(...history);
    const range = max - min === 0 ? 1 : max - min;

    const points = history.map((val, index) => {
      const x = (index / (history.length - 1)) * (width - padding * 2) + padding;
      const y = height - ((val - min) / range) * (height - padding * 2) - padding;
      return `${x},${y}`;
    });

    const pathData = `M ${points.join(" L ")}`;

    const lineColor = isZero ? "#64748b" : isPositive ? "#22c55e" : "#f43f5e";

    return (
      <svg width={width} height={height} className="opacity-80">
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Subtle glow effect */}
        <path
          d={pathData}
          fill="none"
          stroke={lineColor}
          strokeWidth="5"
          strokeOpacity="0.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div
      id={`card-${item.key}`}
      className={`relative overflow-hidden rounded-[32px] border p-7 transition-all duration-300 flex flex-col justify-between ${theme.bg} ${
        flash === "up"
          ? "bg-emerald-950/40 border-emerald-500/50 scale-[1.01]"
          : flash === "down"
          ? "bg-rose-950/40 border-rose-500/50 scale-[1.01]"
          : ""
      }`}
    >
      {/* Alert status indicator */}
      {hasActiveAlert && (
        <span className="absolute top-4 left-4 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" title="دارای هشدار فعال"></span>
        </span>
      )}

      {/* Top row: Title and Icon */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`px-2.5 py-1.5 rounded-2xl ${theme.iconBg} font-bold text-[10px] tracking-wider flex items-center justify-center min-w-[40px] uppercase font-mono`}>
            {item.key.slice(0, 4)}
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm md:text-base tracking-normal">{item.title}</h3>
            <span className="text-[9px] text-slate-500 font-mono tracking-tight block mt-0.5">{item.key}</span>
          </div>
        </div>

        {/* Set Alarm Button */}
        <button
          onClick={onClickAlert}
          className={`px-3 py-1.5 text-[10px] rounded-xl font-bold transition-all duration-200 border cursor-pointer ${
            hasActiveAlert
              ? "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
              : "bg-slate-800/60 text-slate-300 border-slate-700/60 hover:bg-slate-800 hover:text-white"
          }`}
        >
          {hasActiveAlert ? "ویرایش هشدار" : "+ هشدار"}
        </button>
      </div>

      {/* Middle row: Price and Unit */}
      <div className="my-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-slate-500 font-medium">آخرین نرخ بازار</span>
          <div className="flex items-baseline gap-2 justify-start flex-wrap">
            <span className={`text-4xl md:text-5xl font-black font-mono tracking-tight ${theme.priceColor || "text-white"}`}>
              {item.price}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {item.key === "ons" || item.key === "silver_ons" ? "دلار آمریکا" : "ریال"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom row: Trend/Sparkline, Change rates & Time */}
      <div className="flex items-end justify-between mt-6 pt-4 border-t border-slate-800/50">
        {/* Trend Sparkline */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">روند لحظه‌ای</span>
          <div className="h-11 flex items-center">
            {history && history.length > 1 ? (
              renderSparkline()
            ) : (
              <span className="text-[10px] text-slate-600 italic">در حال دریافت داده...</span>
            )}
          </div>
        </div>

        {/* Changes */}
        <div className="flex flex-col items-end gap-2">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black font-mono dir-ltr ${
              isZero
                ? "bg-slate-800 text-slate-400"
                : isPositive
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                : "bg-rose-500/10 text-rose-400 border border-rose-500/10"
            }`}
          >
            {isZero ? (
              <Minus className="w-3.5 h-3.5" />
            ) : isPositive ? (
              <ArrowUpRight className="w-3.5 h-3.5" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5" />
            )}
            <span>{item.percent}</span>
          </div>

          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
            <Clock className="w-3 h-3 text-slate-600" />
            <span>{item.time}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
