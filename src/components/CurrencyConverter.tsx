import React, { useState, useEffect } from "react";
import { PriceItem } from "../types";
import { ArrowRightLeft, Coins, Calculator, DollarSign, Sparkles } from "lucide-react";
import { playClickSound } from "../utils/audio";

interface CurrencyConverterProps {
  items: PriceItem[];
}

interface ConverterAsset {
  key: string;
  title: string;
  unitName: string;
  apiKey?: string;
  presetFactor?: number; // fallback in case API doesn't load
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ items }) => {
  const assets: ConverterAsset[] = [
    { key: "toman", title: "تومان ایران", unitName: "تومان", presetFactor: 10 },
    { key: "rial", title: "ریال ایران", unitName: "ریال", presetFactor: 1 },
    { key: "dollar", title: "دلار آمریکا", unitName: "دلار", apiKey: "price_dollar_rl", presetFactor: 612000 },
    { key: "eur", title: "یورو اروپا", unitName: "یورو", apiKey: "price_eur", presetFactor: 664500 },
    { key: "try", title: "لیر ترکیه", unitName: "لیر", apiKey: "price_try", presetFactor: 18450 },
    { key: "aed", title: "درهم امارات", unitName: "درهم", apiKey: "price_aed", presetFactor: 167800 },
    { key: "gold18k", title: "طلای ۱۸ عیار", unitName: "گرم", apiKey: "geram18", presetFactor: 4150000 },
    { key: "sekke", title: "سکه امامی", unitName: "سکه", apiKey: "sekke", presetFactor: 48500000 },
    { key: "mithqal", title: "مثقال طلا", unitName: "مثقال", apiKey: "mithqal", presetFactor: 17970000 },
  ];

  const [fromAsset, setFromAsset] = useState<string>("dollar");
  const [toAsset, setToAsset] = useState<string>("toman");
  const [fromAmount, setFromAmount] = useState<number>(100);
  const [toAmount, setToAmount] = useState<number>(0);

  // Helper to get raw price in Rials
  const getAssetPriceInRials = (assetKey: string): number => {
    const asset = assets.find(a => a.key === assetKey);
    if (!asset) return 1;

    if (asset.key === "rial") return 1;
    if (asset.key === "toman") return 10;

    if (asset.apiKey) {
      const item = items.find(i => i.key === asset.apiKey);
      if (item) {
        const parsed = parseFloat(item.price.replace(/,/g, ""));
        if (!isNaN(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
    return asset.presetFactor || 1;
  };

  // Perform dynamic conversion
  const performConversion = () => {
    const fromFactor = getAssetPriceInRials(fromAsset);
    const toFactor = getAssetPriceInRials(toAsset);

    const amountInRials = fromAmount * fromFactor;
    const result = amountInRials / toFactor;
    
    setToAmount(result);
  };

  useEffect(() => {
    performConversion();
  }, [fromAsset, toAsset, fromAmount, items]);

  const handleSwap = () => {
    playClickSound();
    const temp = fromAsset;
    setFromAsset(toAsset);
    setToAsset(temp);
  };

  const handlePresetClick = (amount: number, assetKey: string) => {
    playClickSound();
    setFromAmount(amount);
    setFromAsset(assetKey);
  };

  const formatResult = (val: number): string => {
    if (val === 0) return "۰";
    
    // For smaller values, keep decimals, for larger round nicely
    let formatted = "";
    if (val < 1) {
      formatted = val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 5 });
    } else if (val < 100) {
      formatted = val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
      formatted = Math.round(val).toLocaleString("en-US");
    }

    // Convert to Persian numbers
    const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return formatted.replace(/[0-9]/g, (w) => persianDigits[parseInt(w)]);
  };

  const fromAssetMeta = assets.find(a => a.key === fromAsset);
  const toAssetMeta = assets.find(a => a.key === toAsset);

  return (
    <div className="bg-[#121215]/40 border border-slate-800/80 rounded-[32px] p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="flex items-center justify-between mb-6 border-b border-slate-850 pb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm md:text-base font-black text-white">ماشین حساب تبدیل هوشمند ارز، طلا و سکه</h3>
        </div>
        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold px-2 py-0.5 rounded-lg flex items-center gap-1.5 animate-pulse">
          <Sparkles className="w-3 h-3" />
          محاسبه با نرخ زنده بازار
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* INPUT AND SELECTORS (LEFT 7 COLUMNS) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center">
            
            {/* FROM ASSET SELECT */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-[10px] text-slate-400 font-bold">مبدار (از دارایی)</label>
              <select
                value={fromAsset}
                onChange={(e) => { playClickSound(); setFromAsset(e.target.value); }}
                className="w-full bg-[#18181c] border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer"
              >
                {assets.map((asset) => (
                  <option key={asset.key} value={asset.key}>
                    {asset.title} ({asset.unitName})
                  </option>
                ))}
              </select>
            </div>

            {/* SWAP BUTTON */}
            <div className="md:col-span-1 flex justify-center pt-4 md:pt-2">
              <button
                onClick={handleSwap}
                className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/30 hover:bg-slate-800 transition-all text-slate-400 hover:text-white cursor-pointer"
                title="جابجایی مبدا و مقصد"
              >
                <ArrowRightLeft className="w-4 h-4 rotate-90 md:rotate-0" />
              </button>
            </div>

            {/* TO ASSET SELECT */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-[10px] text-slate-400 font-bold">مقصد (به دارایی)</label>
              <select
                value={toAsset}
                onChange={(e) => { playClickSound(); setToAsset(e.target.value); }}
                className="w-full bg-[#18181c] border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-amber-500/50 cursor-pointer"
              >
                {assets.map((asset) => (
                  <option key={asset.key} value={asset.key}>
                    {asset.title} ({asset.unitName})
                  </option>
                ))}
              </select>
            </div>

            {/* AMOUNT INPUT */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="block text-[10px] text-slate-400 font-bold">مقدار</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={fromAmount || ""}
                onChange={(e) => {
                  const rawVal = e.target.value.replace(/[^0-9.]/g, "");
                  const numVal = parseFloat(rawVal);
                  setFromAmount(isNaN(numVal) ? 0 : numVal);
                }}
                className="w-full bg-[#18181c] border border-slate-800 rounded-xl px-3 py-2 text-xs font-black text-center text-amber-400 font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

          </div>

          {/* QUICK PRESETS ROW */}
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <span className="text-[10px] text-slate-500 font-bold ml-1">میانبرهای سریع:</span>
            <button
              onClick={() => handlePresetClick(100, "dollar")}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-700 hover:text-white text-slate-400 transition-all cursor-pointer"
            >
              💵 ۱۰۰ دلار
            </button>
            <button
              onClick={() => handlePresetClick(1, "sekke")}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-700 hover:text-white text-slate-400 transition-all cursor-pointer"
            >
              🪙 ۱ سکه امامی
            </button>
            <button
              onClick={() => handlePresetClick(10, "gold18k")}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-700 hover:text-white text-slate-400 transition-all cursor-pointer"
            >
              ✨ ۱۰ گرم طلای ۱۸
            </button>
            <button
              onClick={() => handlePresetClick(10000000, "toman")}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 border border-slate-850 hover:border-slate-700 hover:text-white text-slate-400 transition-all cursor-pointer"
            >
              🇮🇷 ۱۰ میلیون تومان
            </button>
          </div>

        </div>

        {/* CALCULATION RESULTS DISPLAY (RIGHT 5 COLUMNS) */}
        <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-center text-center space-y-1 relative min-h-[110px]">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">خروجی محاسبه تبدیل</span>
          
          <div className="py-1">
            <span className="text-[11px] text-slate-400 font-medium block">
              {fromAmount.toLocaleString("fa-IR")} {fromAssetMeta?.unitName} ({fromAssetMeta?.title}) برابر است با:
            </span>
            <span className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight block py-1 font-mono">
              {formatResult(toAmount)} {toAssetMeta?.unitName}
            </span>
            <span className="text-[10px] text-slate-500 block font-medium">
              مبنای تبدیل: ۱ {fromAssetMeta?.unitName} = {formatResult(getAssetPriceInRials(fromAsset) / getAssetPriceInRials(toAsset))} {toAssetMeta?.unitName}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
