import React, { useState } from "react";
import { AlertRule, PriceItem } from "../types";
import { Trash2, AlertTriangle, ToggleLeft, ToggleRight, Plus, HelpCircle, Bell, ArrowUpCircle, ArrowDownCircle, Percent } from "lucide-react";

interface AlertSettingsProps {
  items: PriceItem[];
  alerts: AlertRule[];
  onAddAlert: (alert: Omit<AlertRule, "id" | "isTriggered" | "lastCheckedValue">) => void;
  onDeleteAlert: (id: string) => void;
  onToggleAlert: (id: string) => void;
  initialItemKey?: string;
  onClose?: () => void;
}

export const AlertSettings: React.FC<AlertSettingsProps> = ({
  items,
  alerts,
  onAddAlert,
  onDeleteAlert,
  onToggleAlert,
  initialItemKey,
  onClose
}) => {
  const [selectedKey, setSelectedKey] = useState<string>(initialItemKey || items[0]?.key || "");
  const [condition, setCondition] = useState<"above" | "below" | "change_pct">("above");
  const [threshold, setThreshold] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const currentItem = items.find((i) => i.key === selectedKey);
  const currentPriceRaw = currentItem ? parseFloat(currentItem.price.replace(/,/g, "")) : 0;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!selectedKey || !currentItem) {
      setErrorMsg("لطفاً یک آیتم را انتخاب کنید.");
      return;
    }

    const valueNum = parseFloat(threshold);
    if (isNaN(valueNum) || valueNum <= 0) {
      setErrorMsg("لطفاً یک عدد معتبر و بزرگتر از صفر وارد کنید.");
      return;
    }

    onAddAlert({
      itemKey: selectedKey,
      itemName: currentItem.title,
      condition,
      threshold: valueNum,
      isActive: true
    });

    setThreshold("");
  };

  // Helper to set threshold to current price +/- percentage for easy presets
  const applyPreset = (percentOffset: number) => {
    if (!currentPriceRaw) return;
    const target = currentPriceRaw * (1 + percentOffset);
    if (condition === "change_pct") {
      setThreshold(Math.abs(percentOffset * 100).toFixed(2));
    } else {
      setThreshold(Math.round(target).toString());
    }
  };

  return (
    <div className="bg-[#121215] border border-slate-800 rounded-[32px] p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-bold text-white">تنظیمات و ثبت هشدارهای قیمت</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg cursor-pointer"
          >
            بستن پنل
          </button>
        )}
      </div>

      {/* Grid: Create Alert Form (Left/Top) & Alerts List (Right/Bottom) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Create Alert Column */}
        <div className="lg:col-span-5 bg-slate-950/30 p-6 rounded-3xl border border-slate-800/80">
          <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-400" />
            ثبت هشدار جدید
          </h3>

          <form onSubmit={handleAdd} className="space-y-4">
            {/* Item Selector */}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 font-medium">انتخاب طلا، نقره یا ارز:</label>
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                {items.map((i) => (
                  <option key={i.key} value={i.key}>
                    {i.title} ({i.key})
                  </option>
                ))}
              </select>
            </div>

            {/* Current Price Info Banner */}
            {currentItem && (
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex justify-between items-center text-xs">
                <span className="text-slate-400">قیمت فعلی بازار:</span>
                <span className="font-bold font-mono text-amber-400">
                  {currentItem.price} <span className="text-[10px] font-normal text-slate-500">
                    {currentItem.key === "ons" || currentItem.key === "silver_ons" ? "دلار" : "ریال"}
                  </span>
                </span>
              </div>
            )}

            {/* Condition Toggle Buttons */}
            <div>
              <label className="block text-xs text-slate-400 mb-2 font-medium">شرط هشدار (زمانی که قیمت...):</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setCondition("above"); setThreshold(""); }}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    condition === "above"
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>بیشتر از</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setCondition("below"); setThreshold(""); }}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    condition === "below"
                      ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>کمتر از</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setCondition("change_pct"); setThreshold(""); }}
                  className={`py-2 px-1 text-xs font-semibold rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                    condition === "change_pct"
                      ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800"
                  }`}
                >
                  <Percent className="w-4 h-4" />
                  <span>تغییر ناگهانی</span>
                </button>
              </div>
            </div>

            {/* Threshold Input & Presets */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs text-slate-400 font-medium">
                  {condition === "change_pct" ? "درصد تغییر مورد نظر:" : "مقدار قیمت هدف:"}
                </label>
                {condition !== "change_pct" && currentPriceRaw > 0 && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => applyPreset(0.01)}
                      className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded cursor-pointer"
                    >
                      ۱٪+
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(0.05)}
                      className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded cursor-pointer"
                    >
                      ۵٪+
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(-0.01)}
                      className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded cursor-pointer"
                    >
                      ۱٪-
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(-0.05)}
                      className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded cursor-pointer"
                    >
                      ۵٪-
                    </button>
                  </div>
                )}
                {condition === "change_pct" && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setThreshold("0.5")}
                      className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded cursor-pointer"
                    >
                      ۰.۵٪
                    </button>
                    <button
                      type="button"
                      onClick={() => setThreshold("1")}
                      className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded cursor-pointer"
                    >
                      ۱٪
                    </button>
                    <button
                      type="button"
                      onClick={() => setThreshold("2")}
                      className="text-[9px] px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded cursor-pointer"
                    >
                      ۲٪
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder={condition === "change_pct" ? "مثال: 1.5" : "مثال: 41200000"}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-mono placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <span className="absolute left-3 top-3 text-[10px] text-slate-500 font-medium">
                  {condition === "change_pct" ? "درصد" : currentItem?.key === "ons" || currentItem?.key === "silver_ons" ? "دلار" : "ریال"}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                {condition === "above" && "هنگامی که قیمت به بیشتر از این مقدار صعود کند، هشدار فعال می‌شود."}
                {condition === "below" && "هنگامی که قیمت به کمتر از این مقدار سقوط کند، هشدار فعال می‌شود."}
                {condition === "change_pct" && "هنگامی که قیمت در یک بازه بیش از درصد مشخص شده نوسان ناگهانی کند، هشدار صادر می‌شود."}
              </p>
            </div>

            {errorMsg && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-2.5 rounded-lg">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs tracking-wider transition-all duration-300 shadow-lg shadow-amber-500/10 cursor-pointer"
            >
              افزودن به لیست هشدارها
            </button>
          </form>
        </div>

        {/* Alerts List Column */}
        <div className="lg:col-span-7 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-rose-400" />
            هشدارهای فعال شما ({alerts.length})
          </h3>

          {alerts.length === 0 ? (
            <div className="bg-slate-950/20 border border-slate-800/80 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-3">
              <div className="p-3 bg-slate-800/50 text-slate-400 rounded-full">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-semibold">هیچ هشداری ثبت نشده است</p>
                <p className="text-[10px] text-slate-500 mt-1">با فرم سمت راست می‌توانید هشدار صعود یا سقوط قیمت‌ها را ثبت کنید.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {alerts.map((alert) => {
                const isTriggered = alert.isTriggered;
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between transition-all duration-300 ${
                      isTriggered
                        ? "bg-rose-500/10 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/5 animate-soft-pulse"
                        : alert.isActive
                        ? "bg-slate-950/40 border-slate-800 text-slate-300"
                        : "bg-slate-950/10 border-slate-900 text-slate-500"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        isTriggered
                          ? "bg-rose-500/20 text-rose-400"
                          : alert.isActive
                          ? "bg-slate-800 text-amber-400"
                          : "bg-slate-900 text-slate-600"
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{alert.itemName}</span>
                          <span className="text-[9px] bg-slate-800/60 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                            {alert.itemKey}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 mt-1 font-sans">
                          شرط:{" "}
                          <span className="font-semibold text-slate-200">
                            {alert.condition === "above" && "بیشتر از "}
                            {alert.condition === "below" && "کمتر از "}
                            {alert.condition === "change_pct" && "نوسان بیش از "}
                          </span>
                          <span className="font-mono font-bold text-slate-200">
                            {alert.condition === "change_pct" ? alert.threshold : alert.threshold.toLocaleString()}
                          </span>{" "}
                          {alert.condition === "change_pct" ? "درصد" : alert.itemKey === "ons" || alert.itemKey === "silver_ons" ? "دلار" : "ریال"}
                        </div>

                        {isTriggered && alert.triggeredAt && (
                          <p className="text-[10px] text-rose-400 mt-1.5 font-mono">
                            ⚠️ در ساعت {alert.triggeredAt} زنگ هشدار خورده است! (مقدار چک شده: {alert.lastCheckedValue})
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Active/Inactive Toggle */}
                      <button
                        onClick={() => onToggleAlert(alert.id)}
                        className="text-slate-400 hover:text-white cursor-pointer"
                        title={alert.isActive ? "غیرفعال کردن" : "فعال کردن"}
                      >
                        {alert.isActive ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-slate-600" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => onDeleteAlert(alert.id)}
                        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="حذف هشدار"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
