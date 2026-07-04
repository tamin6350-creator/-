import express from "express";
import path from "path";
import axios from "axios";
import * as cheerio from "cheerio";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS middleware for hybrid apps, android wrappers, widgets, and local preview environments
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Popular presets with realistic initial values (all correctly scaled to Iranian Rials to match TGJU format)
  const presets = [
    { key: "geram18", title: "طلای ۱۸ عیار (گرم)", price: "41,500,000", change: "+120,000", percent: "+0.29%", time: "۱۴:۳۲:۱۵" },
    { key: "geram24", title: "طلای ۲۴ عیار (گرم)", price: "55,330,000", change: "+160,000", percent: "+0.29%", time: "۱۴:۳۲:۱۵" },
    { key: "ons", title: "انس جهانی طلا", price: "2,352.40", change: "-12.40", percent: "-0.53%", time: "۱۴:۳۱:۵۰" },
    { key: "silver_ons", title: "انس جهانی نقره", price: "29.45", change: "+0.32", percent: "+1.10%", time: "۱۴:۳۱:۴۸" },
    { key: "sekke", title: "سکه امامی", price: "485,000,000", change: "+2,000,000", percent: "+0.41%", time: "۱۴:۳۲:۱۰" },
    { key: "bahar", title: "سکه بهار آزادی", price: "432,000,000", change: "0", percent: "0.00%", time: "۱۴:۳۱:۰۵" },
    { key: "mithqal", title: "مثقال طلا", price: "179,700,000", change: "+500,000", percent: "+0.28%", time: "۱۴:۳۲:۱۲" },
    { key: "nim", title: "نیم سکه", price: "264,000,000", change: "+100,000", percent: "+0.38%", time: "۱۴:۳۰:۵۵" },
    { key: "rob", title: "ربع سکه", price: "164,000,000", change: "0", percent: "0.00%", time: "۱۴:۳۰:۵۰" },
    { key: "silver_999_gram", title: "نقره ۹۹۹ (گرم)", price: "860,000", change: "+14,000", percent: "+1.65%", time: "۱۴:۳۲:۰۵" },
    { key: "price_dollar_rl", title: "دلار آزاد (تهران)", price: "612,000", change: "+2,500", percent: "+0.41%", time: "۱۴:۳۲:۱۴" },
    { key: "price_eur", title: "یورو آزاد", price: "664,500", change: "+1,200", percent: "+0.18%", time: "۱۴:۳۲:۰۸" },
    { key: "price_try", title: "لیر ترکیه", price: "18,450", change: "-50", percent: "-0.27%", time: "۱۴:۳۲:۰۲" },
    { key: "price_aed", title: "درهم امارات", price: "167,800", change: "+450", percent: "+0.27%", time: "۱۴:۳۲:۱۱" }
  ];

  // Store simulation states to introduce organic fluctuations
  const simulationPrices = new Map<string, number>();

  // Helper to fetch TGJU HTML with proxy fallbacks (bypasses datacenter Cloudflare blocks)
  async function fetchTGJUHtml(): Promise<string> {
    const urls = [
      "https://www.tgju.org/",
      "https://corsproxy.io/?https://www.tgju.org/",
      "https://api.allorigins.win/raw?url=https://www.tgju.org/"
    ];
    
    for (const url of urls) {
      try {
        console.log(`Backend attempting TGJU fetch: ${url}`);
        const response = await axios.get(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.8,en;q=0.7",
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
          timeout: 5000
        });
        
        if (response.data && typeof response.data === "string" && response.data.includes("data-market-row")) {
          console.log(`Successfully fetched TGJU HTML from ${url} (length: ${response.data.length})`);
          return response.data;
        }
      } catch (err: any) {
        console.warn(`Backend failed to fetch TGJU via ${url}: ${err.message}`);
      }
    }
    throw new Error("All backend TGJU fetch options failed");
  }

  // API to fetch prices from tgju.org
  app.get("/api/prices", async (req, res) => {
    try {
      const html = await fetchTGJUHtml();
      const $ = cheerio.load(html);
      const items: any[] = [];

      $("[data-market-row]").each((_, el) => {
        const row = $(el);
        const key = row.attr("data-market-row");
        if (!key) return;

        // Parse Title
        let title = row.find("th").first().text().trim() || 
                    row.find(".market-cell-title").text().trim() || 
                    row.find("td").first().text().trim();
        
        title = title.replace(/\s+/g, " ");
        if (row.find("th a").length) {
          title = row.find("th a").first().text().trim();
        } else if (row.find("td a").length && !title) {
          title = row.find("td a").first().text().trim();
        }

        // Parse Price
        const priceCell = row.find(".info-price").first().length ? row.find(".info-price").first() : 
                          (row.find(".market-cell-price").first().length ? row.find(".market-cell-price").first() : row.find("td:nth-child(2)"));
        let price = "";
        const valSpan = priceCell.find(".value");
        if (valSpan.length) {
          price = valSpan.text().trim();
        } else {
          price = priceCell.text().trim();
        }

        // Parse Change
        const changeCell = row.find(".info-change").first().length ? row.find(".info-change").first() : 
                           (row.find(".market-cell-change").first().length ? row.find(".market-cell-change").first() : row.find("td:nth-child(3)"));
        const change = changeCell.text().trim();

        // Parse Percent
        const percentCell = row.find(".info-percent").first().length ? row.find(".info-percent").first() : 
                            (row.find(".market-cell-percent").first().length ? row.find(".market-cell-percent").first() : row.find("td:nth-child(4)"));
        const percent = percentCell.text().trim();

        // Parse Time
        const timeCell = row.find(".info-time").first().length ? row.find(".info-time").first() : 
                         (row.find(".market-cell-time").first().length ? row.find(".market-cell-time").first() : row.find("td:nth-child(5)"));
        const time = timeCell.text().trim();

        if (key && title && price) {
          if (!items.some(item => item.key === key)) {
            items.push({ key, title, price, change, percent, time });
          }
        }
      });

      if (items.length > 0) {
        return res.json({
          source: "tgju",
          timestamp: new Date().toISOString(),
          items
        });
      } else {
        throw new Error("No items parsed from TGJU page");
      }

    } catch (error: any) {
      // Graceful fallback to organic high-fidelity simulation
      const simulatedItems = presets.map(preset => {
        let numVal = parseFloat(preset.price.replace(/,/g, ""));
        if (isNaN(numVal)) numVal = 1000;

        if (!simulationPrices.has(preset.key)) {
          simulationPrices.set(preset.key, numVal);
        }

        let currentVal = simulationPrices.get(preset.key) || numVal;
        
        // Minor drift: -0.05% to +0.05%
        const changePercent = (Math.random() * 0.1 - 0.05) / 100;
        const drift = currentVal * changePercent;
        currentVal += drift;
        simulationPrices.set(preset.key, currentVal);

        let formattedPrice = "";
        if (preset.key === "ons" || preset.key === "silver_ons") {
          formattedPrice = currentVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
          formattedPrice = Math.round(currentVal).toLocaleString("en-US");
        }

        const rawChange = drift;
        const rawPercent = changePercent * 100;

        const formattedChange = (rawChange >= 0 ? "+" : "") + 
          (preset.key === "ons" || preset.key === "silver_ons" ? 
            rawChange.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 
            Math.round(rawChange).toLocaleString("en-US"));

        const formattedPercent = (rawPercent >= 0 ? "+" : "") + rawPercent.toFixed(2) + "%";

        const now = new Date();
        const timeStr = now.toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

        return {
          key: preset.key,
          title: preset.title,
          price: formattedPrice,
          change: formattedChange,
          percent: formattedPercent,
          time: timeStr
        };
      });

      return res.json({
        source: "simulation",
        timestamp: new Date().toISOString(),
        items: simulatedItems,
        message: "استفاده از شبیه‌ساز (آفلاین یا عدم دسترسی مستقیم به سایت)"
      });
    }
  });

  // Serve static files in production or mount Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
