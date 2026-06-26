import React, { useState } from "react";
import { PriceItem } from "../types";
import { Filter, Check, Plus, RefreshCw, Layers } from "lucide-react";

interface DashboardFiltersProps {
  allItems: PriceItem[];
  selectedKeys: string[];
  onToggleKey: (key: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onAddCustomKey: (title: string, key: string) => void;
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  allItems,
  selectedKeys,
  onToggleKey,
  onSelectAll,
  onSelectNone,
  onAddCustomKey
}) => {
  const [customTitle, setCustomTitle] = useState("");
  const [customKey, setCustomKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!customTitle.trim() || !customKey.trim()) {
      setErrorMsg("لطفاً هم نام و هم کلید را وارد کنید.");
      return;
    }

    const cleanKey = customKey.trim().toLowerCase();
    
    // Check if key already exists in all items
    if (allItems.some(item => item.key === cleanKey)) {
      // Key exists, just make sure it's checked/toggled on
      if (!selectedKeys.includes(cleanKey)) {
        onToggleKey(cleanKey);
      }
      setCustomTitle("");
      setCustomKey("");
      return;
    }

    onAddCustomKey(customTitle.trim(), cleanKey);
    setCustomTitle("");
    setCustomKey("");
  };

  // Group items by categories for a structured bento-style checkbox grid
  const getCategory = (key: string) => {
    if (key.includes("gold") || key.includes("geram") || key === "mithqal" || key === "ons") {
      return "طلا و انس جهانی";
    }
    if (key.includes("sekke") || key === "bahar" || key === "nim" || key === "rob") {
      return "انواع مسکوکات (سکه)";
    }
    if (key.includes("dollar") || key.includes("eur") || key.includes("try") || key.includes("aed") || key.includes("currency") || key.includes("price_")) {
      return "ارزهای خارجی";
    }
    return "سایر متغیرها / سفارشی";
  };

  const categories: Record<string, PriceItem[]> = {};
  allItems.forEach(item => {
    const cat = getCategory(item.key);
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(item);
  });

  return (
    <div className="bg-[#121215] border border-slate-800 rounded-[32px] p-8 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="text-sm md:text-base font-bold text-white">مدیریت نمایش متغیرها و شخصی‌سازی</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">آیتم‌های دلخواه خود را با چک‌باکس فعال یا غیرفعال کنید.</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSelectAll}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            انتخاب همه
          </button>
          <button
            onClick={onSelectNone}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            پاک کردن همه
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Checkbox Categories column */}
        <div className="md:col-span-8 space-y-5">
          {Object.entries(categories).map(([catName, catItems]) => (
            <div key={catName} className="space-y-2">
              <h3 className="text-xs font-bold text-amber-500/80 bg-amber-500/5 py-1 px-2.5 rounded-md inline-block">
                {catName}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {catItems.map((item) => {
                  const isChecked = selectedKeys.includes(item.key);
                  return (
                    <label
                      key={item.key}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all duration-200 ${
                        isChecked
                          ? "bg-slate-950/60 border-amber-500/30 text-white"
                          : "bg-slate-950/20 border-slate-800/60 text-slate-400 hover:bg-slate-950/40 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => onToggleKey(item.key)}
                          className="sr-only" // Hide native checkbox, style custom below
                        />
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                            isChecked ? "bg-amber-500 text-slate-950" : "border border-slate-700 bg-slate-900"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{item.key}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Add custom variables from TGJU Column */}
        <div className="md:col-span-4 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/80 h-fit">
          <h3 className="text-xs font-bold text-slate-200 mb-3 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-400" />
            افزودن متغیر دلخواه دیگر
          </h3>
          <p className="text-[10px] text-slate-500 leading-relaxed mb-4">
            اگر متغیری در لیست بالا نیست، می‌توانید نام و شناسه‌ اختصاصی آن (data-market-row در سایت TGJU) را در زیر وارد کنید تا به پنل شما اضافه شود:
          </p>

          <form onSubmit={handleCustomSubmit} className="space-y-3">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">نام نمایشی (مثال: پوند انگلیس):</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="نام متغیر..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-400 mb-1">شناسه TGJU (مثال: price_gbp):</label>
              <input
                type="text"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="کلید اختصاصی..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-xs text-white font-mono placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {errorMsg && (
              <p className="text-[10px] text-rose-400 bg-rose-500/5 p-2 rounded-md">{errorMsg}</p>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-bold rounded-lg text-[11px] transition-colors cursor-pointer"
            >
              اضافه کردن به پنل
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-[9px] text-slate-500 space-y-1">
            <span className="block font-semibold">کلیدهای راهنما:</span>
            <span className="block font-mono">• gbp_h - پوند انگلستان</span>
            <span className="block font-mono">• sekke_nim - نیم سکه بازار</span>
            <span className="block font-mono">• crypto-bitcoin - بیت‌کوین</span>
          </div>
        </div>

      </div>
    </div>
  );
};
