import React from "react";
import { GoldCoinLogo } from "./GoldCoinLogo";
import { Clock, RefreshCw, Smartphone, Plus } from "lucide-react";
import { playClickSound } from "../utils/audio";

interface PriceItem {
  key: string;
  title: string;
  price: string;
  change: string;
  percent: string;
}

interface AndroidWidgetProps {
  items: PriceItem[];
  onRefresh: () => void;
}

export const AndroidWidget: React.FC<AndroidWidgetProps> = ({ items, onRefresh }) => {
  // Grab top items for the widget: Dollar and Gold 18k
  const dollarItem = items.find(i => i.key === "price_dollar_rl") || { price: "۶۱۲,۰۰۰", change: "+۲,۵۰۰", percent: "+۰.۴۱%" };
  const goldItem = items.find(i => i.key === "geram18") || { price: "۴,۱۵۰,۰۰۰", change: "+۱۲,۰۰۰", percent: "+۰.۲۹%" };
  const coinItem = items.find(i => i.key === "sekke") || { price: "۴۸,۵۰۰,۰۰۰", change: "+۲۰۰,۰۰۰", percent: "+۰.۴۱%" };

  // Generate current local clock time
  const [widgetTime, setWidgetTime] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => setWidgetTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const shamsiDateStr = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    day: "numeric",
    month: "long"
  }).format(widgetTime);

  const timeStr = widgetTime.toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });

  return (
    <div id="android-widget-preview-section" className="bg-[#121215] border border-slate-800 rounded-[32px] p-7 space-y-6">
      
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shadow-md">
            <Smartphone className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-white">ویجت اختصاصی هوم‌اسکرین (Android Widget 4x2)</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">شبیه‌ساز و نمونه طراحی ویجت نیمه‌شفاف شیشه‌ای با همگام‌سازی خودکار</p>
          </div>
        </div>

        <span className="text-[10px] text-amber-500 font-bold bg-amber-500/5 border border-amber-500/10 px-2.5 py-1 rounded-full">
          پیش‌نمایش تعاملی ویجت
        </span>
      </div>

      {/* COMPACT BENTO GRID CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* WIDGET PREVIEW WRAPPED IN AN AMBIENT DEVICE GRID */}
        <div className="lg:col-span-7 flex justify-center p-6 bg-slate-950/40 rounded-3xl border border-slate-900 shadow-inner relative overflow-hidden group min-h-[260px]">
          {/* Grid Background to simulate phone screen */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:24px_24px] opacity-[0.07] pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

          {/* THE GLASS WIDGET CONTAINER */}
          <div className="relative w-full max-w-md bg-slate-900/40 hover:bg-slate-900/60 transition-all duration-500 border border-white/10 backdrop-blur-md rounded-2xl p-4 shadow-[0_15px_35px_rgba(0,0,0,0.5)] flex flex-col justify-between select-none">
            
            {/* Top row */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <GoldCoinLogo size={28} className="animate-soft-pulse shrink-0" />
                <div>
                  <span className="text-xs font-black text-white tracking-wide block">زربین هوشمند</span>
                  <span className="text-[8px] text-slate-400 block -mt-0.5">سامانه رصد زنده طلا و ارز</span>
                </div>
              </div>

              {/* Time display of the widget */}
              <div className="text-left font-mono">
                <span className="text-sm font-black text-amber-400 block leading-none">{timeStr}</span>
                <span className="text-[8px] text-slate-400 block mt-0.5">{shamsiDateStr}</span>
              </div>
            </div>

            {/* Price Grid (Middle) */}
            <div className="grid grid-cols-3 gap-2.5 py-4">
              
              {/* Dollar price */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center relative overflow-hidden group-hover:bg-white/10 transition-colors">
                <span className="block text-[8px] text-slate-400 font-bold mb-1">دلار آزاد</span>
                <span className="block text-[11px] font-black text-white font-mono leading-none">{dollarItem.price}</span>
                <span className="block text-[8px] text-emerald-400 font-bold mt-1.5">{dollarItem.percent}</span>
              </div>

              {/* Gold 18k price */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center relative overflow-hidden group-hover:bg-white/10 transition-colors">
                <span className="block text-[8px] text-slate-400 font-bold mb-1">طلا ۱۸ عیار</span>
                <span className="block text-[11px] font-black text-amber-400 font-mono leading-none">{goldItem.price}</span>
                <span className="block text-[8px] text-emerald-400 font-bold mt-1.5">{goldItem.percent}</span>
              </div>

              {/* Coin Imami price */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-2 text-center relative overflow-hidden group-hover:bg-white/10 transition-colors">
                <span className="block text-[8px] text-slate-400 font-bold mb-1">سکه امامی</span>
                <span className="block text-[11px] font-black text-white font-mono leading-none">{coinItem.price}</span>
                <span className="block text-[8px] text-emerald-400 font-bold mt-1.5">{coinItem.percent}</span>
              </div>

            </div>

            {/* Bottom Actions Row */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[8px] text-slate-400 font-medium">
              <span>* به‌روزرسانی خودکار هوشمند هر ۳۰ ثانیه</span>
              
              <button 
                onClick={() => { playClickSound(); onRefresh(); }}
                className="flex items-center gap-1 bg-white/5 hover:bg-white/10 text-white rounded-lg px-2 py-1 transition-all cursor-pointer"
              >
                <RefreshCw className="w-2.5 h-2.5 text-amber-400" />
                <span>بروزرسانی</span>
              </button>
            </div>

          </div>

        </div>

        {/* WIDGET INSTALLATION INSTRUCTIONS */}
        <div className="lg:col-span-5 bg-slate-950/20 p-5 rounded-3xl border border-slate-800/80 flex flex-col justify-between h-full space-y-4">
          <div>
            <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider block mb-2">راهنمای افزودن ویجت به موبایل</span>
            <h4 className="text-xs font-extrabold text-white leading-relaxed">چگونه ویجت زربین را روی صفحه اصلی گوشی خود سنجاق کنیم؟</h4>
            <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
              پس از نصب خروجی APK این برنامه روی گوشی اندروید خود، با دنبال کردن مراحل زیر می‌توانید این ویجت زیبا را روی هوم‌اسکرین اضافه کنید:
            </p>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2 bg-[#121215]/80 p-3 rounded-xl border border-slate-800">
              <span className="text-amber-500 font-black font-mono">۱.</span>
              <p className="text-[11px] leading-relaxed">در فضای خالی هوم‌اسکرین موبایل لمس طولانی کنید تا منوی شخصی‌سازی باز شود.</p>
            </div>

            <div className="flex items-start gap-2 bg-[#121215]/80 p-3 rounded-xl border border-slate-800">
              <span className="text-amber-500 font-black font-mono">۲.</span>
              <p className="text-[11px] leading-relaxed">روی دکمه‌ی <span className="text-amber-400 font-bold">Widgets (ویجت‌ها)</span> کلیک کرده و نام برنامه <span className="text-white font-bold">«زربین»</span> را جستجو کنید.</p>
            </div>

            <div className="flex items-start gap-2 bg-[#121215]/80 p-3 rounded-xl border border-slate-800">
              <span className="text-amber-500 font-black font-mono">۳.</span>
              <p className="text-[11px] leading-relaxed">ویجت طلایی <span className="text-amber-400 font-bold">4x2</span> را لمس طولانی کنید و روی موقعیت دلخواه در صفحه قرار دهید.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
