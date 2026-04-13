import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: any; expires: number }>();
const CACHE_MS = 5 * 60_000; // 5 min

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/**
 * GET /api/market/history?symbol=AAPL&range=3mo
 * Returns OHLC candles. Range: 1d,5d,1mo,3mo,6mo,1y,2y,5y,max
 */
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  const range = req.nextUrl.searchParams.get("range") || "3mo";
  if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

  // Interval scales with range
  const interval =
    range === "1d" ? "5m"
    : range === "5d" ? "30m"
    : range === "1mo" ? "1d"
    : range === "3mo" ? "1d"
    : range === "6mo" ? "1d"
    : range === "1y" ? "1d"
    : "1wk";

  const cacheKey = `${symbol}:${range}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ ...cached.data, cached: true });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: `Yahoo ${res.status}` }, { status: 502 });

    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return NextResponse.json({ points: [], symbol });

    const timestamps: number[] = result.timestamp || [];
    const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];

    const points = timestamps
      .map((t, i) => ({ time: t, close: closes[i] }))
      .filter((p) => p.close !== null && p.close !== undefined)
      .map((p) => ({
        time: p.time,
        date: new Date(p.time * 1000).toISOString(),
        close: p.close as number,
      }));

    const first = points[0]?.close ?? null;
    const last = points[points.length - 1]?.close ?? null;
    const change = first !== null && last !== null ? last - first : 0;
    const changePercent = first ? (change / first) * 100 : 0;

    const payload = {
      symbol,
      range,
      points,
      summary: {
        first,
        last,
        change,
        changePercent,
        high: Math.max(...points.map((p) => p.close)),
        low: Math.min(...points.map((p) => p.close)),
      },
    };

    cache.set(cacheKey, { data: payload, expires: Date.now() + CACHE_MS });
    return NextResponse.json(payload);
  } catch (err: any) {
    console.error("Market history error:", err);
    return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
  }
}
