import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function getMerchantColor(name: string): string {
  const colors = ["#E5633A", "#2B8A3E", "#4D8FDB", "#E03131", "#7C3AED", "#0891B2", "#CA8A04"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function getAccountColor(id: string): string {
  const colors = ["#E03131", "#4D8FDB", "#2B8A3E", "#E5633A", "#7C3AED", "#0891B2"];
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
