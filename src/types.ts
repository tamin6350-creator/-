export interface PriceItem {
  key: string;
  title: string;
  price: string;
  change: string;
  percent: string;
  time: string;
}

export interface AlertRule {
  id: string;
  itemKey: string;
  itemName: string;
  condition: "above" | "below" | "change_pct";
  threshold: number; // For price, raw value. For percent change, positive number.
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
  lastCheckedValue?: string;
}

export interface ApiResponse {
  source: "tgju" | "simulation";
  timestamp: string;
  items: PriceItem[];
  message?: string;
}
