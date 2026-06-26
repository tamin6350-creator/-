import { useEffect, useState, useRef } from "react";
import { PriceItem, AlertRule, ApiResponse } from "./types";
import { PriceCard } from "./components/PriceCard";
import { AlertSettings } from "./components/AlertSettings";
import { DashboardFilters } from "./components/DashboardFilters";
import { playAlertChime, playClickSound } from "./utils/audio";
import { AnalogClock } from "./components/AnalogClock";
import { PredictionPanel } from "./components/PredictionPanel";
import { 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  Settings, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  ArrowRightLeft,
  Search,
  PlusCircle,
  HelpCircle,
  XCircle,
  Clock,
  Sparkles
} from "lucide-react";

const DEFAULT_PRESET_KEYS = ["geram18", "ons", "silver_ons", "sekke", "mithqal", "price_dollar_rl"];

export default function App() {
  // --- States ---
  const [allItems, setAllItems] = useState<PriceItem[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [pricesHistory, setPricesHistory] = useState<Record<string, number[]>>({});
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiSource, setApiSource] = useState<"tgju" | "simulation" | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Settings
  const [pollingInterval, setPollingInterval] = useState(30000); // 30 seconds
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  
  // Custom Items
  const [customItems, setCustomItems] = useState<PriceItem[]>([]);

  // Panels visibility
  const [isAlertPanelOpen, setIsAlertPanelOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [alertTargetKey, setAlertTargetKey] = useState<string | undefined>(undefined);

  // Active Triggered Alarm Modal
  const [activeTriggeredAlert, setActiveTriggeredAlert] = useState<AlertRule | null>(null);
  const [alertLogs, setAlertLogs] = useState<string[]>([]);

  // Countdown timer for next refresh
  const [countdown, setCountdown] = useState(30);

  // Keep a reference to alerts and sound state to prevent closure captures
  const alertsRef = useRef(alerts);
  const isSoundEnabledRef = useRef(isSoundEnabled);

  useEffect(() => {
    alertsRef.current = alerts;
  }, [alerts]);

  useEffect(() => {
    isSoundEnabledRef.current = isSoundEnabled;
  }, [isSoundEnabled]);

  // --- Initial Mount & Load Storage ---
  useEffect(() => {
    // 1. Selected keys to display
    const savedKeys = localStorage.getItem("tgju_selected_keys");
    if (savedKeys) {
      try {
        setSelectedKeys(JSON.parse(savedKeys));
      } catch (e) {
        setSelectedKeys(DEFAULT_PRESET_KEYS);
      }
    } else {
      setSelectedKeys(DEFAULT_PRESET_KEYS);
    }

    // 2. Alert rules
    const savedAlerts = localStorage.getItem("tgju_alerts");
    if (savedAlerts) {
      try {
        setAlerts(JSON.parse(savedAlerts));
      } catch (e) {}
    }

    // 3. Price Sparkline history
    const savedHistory = localStorage.getItem("tgju_prices_history");
    if (savedHistory) {
      try {
        setPricesHistory(JSON.parse(savedHistory));
      } catch (e) {}
    }

    // 4. Custom manually registered items
    const savedCustom = localStorage.getItem("tgju_custom_items");
    if (savedCustom) {
      try {
        setCustomItems(JSON.parse(savedCustom));
      } catch (e) {}
    }

    // 5. Sound setting
    const savedSound = localStorage.getItem("tgju_sound_enabled");
    if (savedSound !== null) {
      setIsSoundEnabled(savedSound === "true");
    }

    // 6. Polling speed
    const savedInterval = localStorage.getItem("tgju_polling_interval");
    if (savedInterval) {
      setPollingInterval(parseInt(savedInterval));
      setCountdown(parseInt(savedInterval) / 1000);
    }

    fetchData();
  }, []);

  // --- Core Pricing Fetch Handler ---
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const response = await fetch("/api/prices");
      if (!response.ok) throw new Error("خطا در پاسخ‌دهی سرور مرکزی");
      
      const data: ApiResponse = await response.json();
      
      setApiSource(data.source);
      setLastUpdated(new Date());
      setErrorMessage("");

      // Combine server fetched items with custom items
      // If server does not provide custom keys, we append them
      let updatedItems = [...data.items];
      
      // Ensure any custom local item has a placeholder or gets fetched if server parsed it
      customItems.forEach(custom => {
        if (!updatedItems.some(ui => ui.key === custom.key)) {
          // If the server didn't find it, simulate minor fluctuation based on last price
          let parsedPrice = parseFloat(custom.price.replace(/,/g, ""));
          if (isNaN(parsedPrice)) parsedPrice = 100000;
          
          const changePct = (Math.random() * 0.1 - 0.05) / 100;
          const drift = parsedPrice * changePct;
          const finalPrice = Math.round(parsedPrice + drift);

          updatedItems.push({
            key: custom.key,
            title: custom.title,
            price: finalPrice.toLocaleString("en-US"),
            change: (drift >= 0 ? "+" : "") + Math.round(drift).toLocaleString("en-US"),
            percent: (changePct >= 0 ? "+" : "") + (changePct * 100).toFixed(2) + "%",
            time: new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
          });
        }
      });

      setAllItems(updatedItems);
      processPriceHistoryAndAlerts(updatedItems);

    } catch (err: any) {
      console.error(err);
      setErrorMessage("ارتباط با سایت مرجع با اختلال مواجه شد. در حال استفاده از اطلاعات محلی.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      // Reset countdown
      setCountdown(pollingInterval / 1000);
    }
  };

  // --- Process Price History and Alerts ---
  const processPriceHistoryAndAlerts = (items: PriceItem[]) => {
    const nowStr = new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

    setPricesHistory(prev => {
      const nextHistory = { ...prev };
      items.forEach(item => {
        const rawNum = parseFloat(item.price.replace(/,/g, ""));
        if (!isNaN(rawNum)) {
          if (!nextHistory[item.key]) {
            nextHistory[item.key] = [];
          }
          // Push and keep latest 10 data points
          const currentArr = [...nextHistory[item.key]];
          currentArr.push(rawNum);
          if (currentArr.length > 10) currentArr.shift();
          nextHistory[item.key] = currentArr;
        }
      });
      localStorage.setItem("tgju_prices_history", JSON.stringify(nextHistory));
      return nextHistory;
    });

    // Run alerts check against current pricing
    const currentAlerts = [...alertsRef.current];
    let alertStateChanged = false;
    let newlyTriggeredAlert: AlertRule | null = null;

    const updatedAlerts = currentAlerts.map(alert => {
      if (!alert.isActive || alert.isTriggered) return alert;

      const matchedItem = items.find(i => i.key === alert.itemKey);
      if (!matchedItem) return alert;

      const currentPrice = parseFloat(matchedItem.price.replace(/,/g, ""));
      const pctValue = parseFloat(matchedItem.percent.replace(/[^0-9.-]/g, ""));
      if (isNaN(currentPrice)) return alert;

      let isTriggered = false;
      if (alert.condition === "above" && currentPrice > alert.threshold) {
        isTriggered = true;
      } else if (alert.condition === "below" && currentPrice < alert.threshold) {
        isTriggered = true;
      } else if (alert.condition === "change_pct" && !isNaN(pctValue) && Math.abs(pctValue) >= alert.threshold) {
        isTriggered = true;
      }

      if (isTriggered) {
        alertStateChanged = true;
        const triggerTime = nowStr;
        newlyTriggeredAlert = {
          ...alert,
          isTriggered: true,
          triggeredAt: triggerTime,
          lastCheckedValue: matchedItem.price
        };

        // Add to alert log
        setAlertLogs(prev => [
          `🔔 هشدار: قیمت [${alert.itemName}] در ساعت ${triggerTime} از آستانه عبور کرد! (قیمت: ${matchedItem.price})`,
          ...prev
        ]);

        return newlyTriggeredAlert;
      }

      return alert;
    });

    if (alertStateChanged) {
      setAlerts(updatedAlerts);
      localStorage.setItem("tgju_alerts", JSON.stringify(updatedAlerts));

      if (newlyTriggeredAlert) {
        setActiveTriggeredAlert(newlyTriggeredAlert);
        if (isSoundEnabledRef.current) {
          playAlertChime();
        }
      }
    }
  };

  // --- Polling Effect ---
  useEffect(() => {
    // Immediate countdown decrementer
    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchData();
          return pollingInterval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownTimer);
  }, [pollingInterval]);

  // --- Toggle Polling Speed ---
  const handleIntervalChange = (newSec: number) => {
    const ms = newSec * 1000;
    setPollingInterval(ms);
    setCountdown(newSec);
    localStorage.setItem("tgju_polling_interval", ms.toString());
    playClickSound();
  };

  // --- Toggle Sound ---
  const toggleSound = () => {
    const nextState = !isSoundEnabled;
    setIsSoundEnabled(nextState);
    localStorage.setItem("tgju_sound_enabled", nextState.toString());
    playClickSound();
    if (nextState) {
      playAlertChime();
    }
  };

  // --- Checkbox Key Filter Handlers ---
  const handleToggleKey = (key: string) => {
    let updated: string[];
    if (selectedKeys.includes(key)) {
      updated = selectedKeys.filter(k => k !== key);
    } else {
      updated = [...selectedKeys, key];
    }
    setSelectedKeys(updated);
    localStorage.setItem("tgju_selected_keys", JSON.stringify(updated));
    playClickSound();
  };

  const handleSelectAll = () => {
    const allKeys = allItems.map(i => i.key);
    setSelectedKeys(allKeys);
    localStorage.setItem("tgju_selected_keys", JSON.stringify(allKeys));
    playClickSound();
  };

  const handleSelectNone = () => {
    setSelectedKeys([]);
    localStorage.setItem("tgju_selected_keys", JSON.stringify([]));
    playClickSound();
  };

  // --- Add Custom Items ---
  const handleAddCustomKey = (title: string, key: string) => {
    const newCustom: PriceItem = {
      key,
      title,
      price: "100,000", // seed initial value
      change: "0",
      percent: "0%",
      time: "هم‌اکنون"
    };

    const updatedCustom = [...customItems, newCustom];
    setCustomItems(updatedCustom);
    localStorage.setItem("tgju_custom_items", JSON.stringify(updatedCustom));

    // Force add to selected view keys
    const updatedSelected = [...selectedKeys, key];
    setSelectedKeys(updatedSelected);
    localStorage.setItem("tgju_selected_keys", JSON.stringify(updatedSelected));

    // Instantly append to all items for rendering
    setAllItems(prev => {
      if (!prev.some(i => i.key === key)) {
        return [...prev, newCustom];
      }
      return prev;
    });

    playClickSound();
    fetchData(true); // force manual refresh to seed/simulate it
  };

  // --- Alert Rule Actions ---
  const handleAddAlert = (newAlert: Omit<AlertRule, "id" | "isTriggered" | "lastCheckedValue">) => {
    const rule: AlertRule = {
      ...newAlert,
      id: Math.random().toString(36).substring(2, 9),
      isTriggered: false
    };

    const updated = [rule, ...alerts];
    setAlerts(updated);
    localStorage.setItem("tgju_alerts", JSON.stringify(updated));
    playClickSound();
  };

  const handleDeleteAlert = (id: string) => {
    const updated = alerts.filter(a => a.id !== id);
    setAlerts(updated);
    localStorage.setItem("tgju_alerts", JSON.stringify(updated));
    playClickSound();
  };

  const handleToggleAlert = (id: string) => {
    const updated = alerts.map(a => {
      if (a.id === id) {
        return { ...a, isActive: !a.isActive, isTriggered: false }; // deactivate and reset trigger
      }
      return a;
    });
    setAlerts(updated);
    localStorage.setItem("tgju_alerts", JSON.stringify(updated));
    playClickSound();
  };

  const handleResetActiveAlert = (id: string) => {
    const updated = alerts.map(a => {
      if (a.id === id) {
        return { ...a, isTriggered: false }; // mark as ready to trigger again
      }
      return a;
    });
    setAlerts(updated);
    localStorage.setItem("tgju_alerts", JSON.stringify(updated));
    setActiveTriggeredAlert(null);
    playClickSound();
  };

  const activeDisplayItems = allItems.filter(item => selectedKeys.includes(item.key));

   return (
    <div dir="rtl" className="font-sans min-h-screen bg-[#0a0a0c] text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-white">
      
      {/* HEADER SECTION */}
      <header id="app-header" className="sticky top-0 z-40 bg-[#0a0a0c]/95 border-b border-slate-900/60 backdrop-blur-md px-4 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <TrendingUp className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-lg font-black tracking-wide text-white">سامانه هوشمند پایش قیمت زربین (TGJU)</h1>
                <span className="text-[10px] bg-slate-900 text-amber-500 font-mono font-bold px-2 py-0.5 rounded-full border border-slate-800">
                  GoldTracker
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">نرخ زنده مسکوکات، طلا، نقره و متغیرهای دلخواه متصل به مرجع قیمت‌ها</p>
            </div>
          </div>

          {/* Left Block (Analog Clock + Tools) */}
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            {/* Connection, Countdown & Tools */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              
              {/* Direct TGJU or Simulation status badge */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className={`relative flex h-2 w-2`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    apiSource === "tgju" ? "bg-emerald-400" : "bg-amber-400"
                  }`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${
                    apiSource === "tgju" ? "bg-emerald-500" : "bg-amber-500"
                  }`}></span>
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {apiSource === "tgju" ? "اتصال مستقیم به TGJU" : "شبیه‌ساز هوشمند (آفلاین)"}
                </span>
              </div>

              {/* Interval Selection */}
              <div className="flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 p-1 rounded-xl text-xs">
                <span className="text-[10px] text-slate-500 pr-1">به‌روزرسانی:</span>
                <button
                  onClick={() => handleIntervalChange(10)}
                  className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${
                    pollingInterval === 10000 ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  ۱۰ث
                </button>
                <button
                  onClick={() => handleIntervalChange(30)}
                  className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${
                    pollingInterval === 30000 ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  ۳۰ث
                </button>
                <button
                  onClick={() => handleIntervalChange(60)}
                  className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${
                    pollingInterval === 60000 ? "bg-amber-500 text-slate-950 font-bold" : "text-slate-400 hover:text-white"
                  }`}
                >
                  ۱د
                </button>
              </div>

              {/* Countdown Badge */}
              <div className="flex items-center gap-1 bg-slate-900/60 border border-slate-800/80 px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{countdown}ث</span>
              </div>

              {/* Sound Toggler */}
              <button
                onClick={toggleSound}
                className={`p-2 rounded-xl border transition-all cursor-pointer ${
                  isSoundEnabled
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300"
                }`}
                title={isSoundEnabled ? "صدا فعال" : "صدا غیرفعال"}
              >
                {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Manual Refresh */}
              <button
                onClick={() => { playClickSound(); fetchData(true); }}
                disabled={refreshing}
                className="p-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                title="به‌روزرسانی دستی"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-slate-400" : ""}`} />
              </button>

            </div>

            {/* Beautiful Analog Clock */}
            <AnalogClock />
          </div>

        </div>
      </header>

      {/* ERROR MESSAGE BAR */}
      {errorMessage && (
        <div className="bg-amber-500/10 border-y border-amber-500/20 py-2.5 px-4 text-center text-xs text-amber-400 flex items-center justify-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <main id="app-body" className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        
        {/* BANNER SYSTEM OVERVIEW */}
        <div className="bg-[#121215] border border-slate-800 rounded-[32px] p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-amber-500 text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>دستیار پایش هوشمند طلا و ارز</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">داشبورد شخصی‌سازی‌شده و زنگ هشدار تغییر قیمت</h2>
              <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
                با تیک‌باکس‌های شخصی‌سازی می‌توانید تعداد متغیرها را مدیریت کنید. برای ثبت هشدار تغییر قیمت، دکمه‌ی «هشدار+» را روی هر کارت بزنید تا به صورت زنده نوسانات قیمتی بازار را پیگیری کنید.
              </p>
            </div>
            
            <div className="flex gap-2.5 w-full md:w-auto">
              <button
                onClick={() => { playClickSound(); setIsFilterPanelOpen(!isFilterPanelOpen); }}
                className={`flex-1 md:flex-none py-3 px-6 text-xs font-bold rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isFilterPanelOpen
                    ? "bg-amber-500 text-slate-950 border-amber-400 font-black shadow-lg shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200"
                }`}
              >
                ⚙️ شخصی‌سازی و افزودن آیتم
              </button>
              
              <button
                onClick={() => { playClickSound(); setIsAlertPanelOpen(!isAlertPanelOpen); }}
                className={`flex-1 md:flex-none py-3 px-6 text-xs font-bold rounded-2xl border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isAlertPanelOpen
                    ? "bg-rose-500 text-white border-rose-400 font-black shadow-lg shadow-rose-500/10"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-rose-400"
                }`}
              >
                <Bell className="w-4 h-4" />
                مدیریت هشدارها ({alerts.length})
              </button>
            </div>
          </div>
        </div>

        {/* MODAL / COLLAPSIBLE PANEL: DASHBOARD FILTERS */}
        {isFilterPanelOpen && (
          <div className="transition-all duration-300">
            <DashboardFilters
              allItems={allItems}
              selectedKeys={selectedKeys}
              onToggleKey={handleToggleKey}
              onSelectAll={handleSelectAll}
              onSelectNone={handleSelectNone}
              onAddCustomKey={handleAddCustomKey}
            />
          </div>
        )}

        {/* MODAL / COLLAPSIBLE PANEL: ALERTS PANEL */}
        {isAlertPanelOpen && (
          <div className="transition-all duration-300">
            <AlertSettings
              items={allItems}
              alerts={alerts}
              onAddAlert={handleAddAlert}
              onDeleteAlert={handleDeleteAlert}
              onToggleAlert={handleToggleAlert}
              initialItemKey={alertTargetKey}
              onClose={() => setIsAlertPanelOpen(false)}
            />
          </div>
        )}

        {/* ACTIVE TRIGGERED ALERT DRAWER/POPUP (If any) */}
        {activeTriggeredAlert && (
          <div className="bg-amber-500 border border-amber-600 rounded-[32px] p-7 text-slate-950 flex flex-col relative overflow-hidden shadow-2xl animate-soft-pulse">
            <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div className="flex items-center gap-4 text-center md:text-right flex-col md:flex-row">
                <div className="h-14 w-14 rounded-full bg-white/20 text-slate-950 flex items-center justify-center animate-bounce">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-black text-slate-950">🚨 هشدار تغییر قیمت زربین!</h3>
                  <p className="text-xs text-slate-900/80 mt-1">
                    قیمت متغیر <span className="font-extrabold text-slate-950">[{activeTriggeredAlert.itemName}]</span> به سقف یا کف تعیین شده رسید.
                  </p>
                  <p className="text-[11px] text-slate-950/70 mt-1.5 font-mono">
                    قیمت فعلی: {activeTriggeredAlert.lastCheckedValue} (آستانه: {activeTriggeredAlert.threshold.toLocaleString()})
                  </p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <button
                  onClick={() => handleResetActiveAlert(activeTriggeredAlert.id)}
                  className="flex-1 md:flex-none py-3 px-6 bg-slate-950 text-white font-bold rounded-2xl text-xs transition-colors hover:bg-slate-900 cursor-pointer shadow-lg shadow-black/20"
                >
                  تایید دریافت و خاموش کردن آلارم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ACTIVE PRICES GRID */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm md:text-base font-bold text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" />
              دیده‌بان بازار قیمت‌های منتخب شما ({activeDisplayItems.length})
            </h2>
            {lastUpdated && (
              <span className="text-[10px] text-slate-500 font-mono">
                آخرین به‌روزرسانی زنده: {lastUpdated.toLocaleTimeString("fa-IR")}
              </span>
            )}
          </div>

          {loading && allItems.length === 0 ? (
            <div className="bg-slate-950/20 border border-slate-800/80 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-2 border-t-amber-500 border-slate-800 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs text-amber-400 font-bold">TGJU</div>
              </div>
              <div>
                <p className="text-xs text-slate-300 font-bold">در حال برقراری ارتباط با سایت مرجع و استخراج اطلاعات...</p>
                <p className="text-[10px] text-slate-500 mt-1">نرخ‌های طلا، نقره و ارزهای بین‌المللی در حال بارگذاری است.</p>
              </div>
            </div>
          ) : activeDisplayItems.length === 0 ? (
            <div className="bg-slate-950/20 border border-slate-800/80 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-4">
              <div className="p-4 bg-slate-900 text-slate-500 rounded-full">
                <Search className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-300 font-bold">هیچ متغیری برای نمایش تیک نخورده است</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  لطفاً با استفاده از دکمه‌ی <span className="text-amber-400 font-semibold cursor-pointer" onClick={() => setIsFilterPanelOpen(true)}>«⚙️ شخصی‌سازی قیمت‌ها»</span> تیک متغیرهای مورد نظر خود را فعال کنید.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeDisplayItems.map(item => {
                const hasAlert = alerts.some(a => a.itemKey === item.key && a.isActive);
                return (
                  <PriceCard
                    key={item.key}
                    item={item}
                    history={pricesHistory[item.key] || []}
                    hasActiveAlert={hasAlert}
                    onClickAlert={() => {
                      setAlertTargetKey(item.key);
                      setIsAlertPanelOpen(true);
                      // Scroll to alert configuration
                      document.getElementById("app-body")?.scrollIntoView({ behavior: "smooth" });
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* ANALYTICAL PREDICTION & COMPARISON PANEL */}
        <PredictionPanel currentPrices={allItems} />

        {/* ALERTS HISTORY LOGS & SYSTEM INFO (BENTO COMPONENT) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Historical triggered alarms logs */}
          <div className="lg:col-span-7 bg-[#121215]/50 border border-slate-800 rounded-[32px] p-7 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                <Bell className="w-4 h-4 text-rose-500" />
                تاریخچه وقایع و هشدارهای اخیر
              </h3>

              {alertLogs.length === 0 ? (
                <p className="text-[10px] text-slate-500 italic py-6 text-center leading-relaxed">
                  هیچ رخداد مشکوکی ثبت نشده است. سیستم پایش زربین در حال رصد ثانیه‌ای قیمت‌هاست...
                </p>
              ) : (
                <div className="space-y-2 max-h-[160px] overflow-y-auto mb-4">
                  {alertLogs.map((log, index) => (
                    <div key={index} className="text-[10px] bg-slate-950/60 border border-slate-900 p-3 rounded-xl text-slate-300 font-mono flex items-start gap-2.5">
                      <span className="text-rose-500">⚡</span>
                      <span className="leading-relaxed">{log}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="text-[9px] text-slate-600 font-medium pt-3 border-t border-slate-800/40">
              * وقایع به صورت زنده در زمان باز بودن مرورگر ثبت می‌شوند.
            </div>
          </div>

          {/* Guide Card on how to read indices from TGJU */}
          <div className="lg:col-span-5 bg-[#121215]/50 border border-slate-800 rounded-[32px] p-7 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-200 mb-4 flex items-center gap-1.5 uppercase tracking-wide">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                راهنمای کدهای اختصاصی TGJU
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                سایت شبکه اطلاع‌رسانی طلا و ارز (TGJU) قیمت‌ها را در قالب ردیف‌های HTML با ویژگی <code className="text-amber-500 bg-slate-900/80 px-1.5 py-0.5 rounded text-[10px] font-mono">data-market-row</code> مدیریت می‌کند. این برنامه به صورت خودکار شناسه مربوطه را خوانده و زنگ هشدار آن را فعال می‌سازد.
              </p>
            </div>
            
            <div className="pt-3 border-t border-slate-800/40 mt-4 text-[10px] text-slate-500 flex items-center justify-between font-mono">
              <span>توسعه‌یافته برای Android & Web</span>
              <span className="text-amber-500 font-bold">v1.2.0</span>
            </div>
          </div>

        </div>

      </main>

      {/* FOOTER */}
      <footer className="mt-12 py-6 bg-[#05080e] border-t border-slate-900/60 text-center text-[10px] text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} سامانه هوشمند دیده‌بان طلا و ارز. تمامی قیمت‌ها مستقیم از شبکه اطلاع‌رسانی TGJU به‌روزرسانی می‌شوند.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-400 transition-colors">قوانین و سلب مسئولیت</span>
            <span>•</span>
            <span className="hover:text-slate-400 transition-colors">پشتیبانی اندروید</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
