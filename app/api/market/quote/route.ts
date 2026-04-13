import { NextRequest, NextResponse } from "next/server";

// Cache responses in memory for 60 seconds to stay under rate limits
const cache = new Map<string, { data: any; expires: number }>();
const CACHE_MS = 60_000;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/**
 * GET /api/market/quote?symbols=AAPL,MSFT,TSLA
 * Returns latest price + day change for each symbol.
 */
export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols");
  if (!symbolsParam) {
    return NextResponse.json({ error: "symbols param required" }, { status: 400 });
  }

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({ quotes: {} });
  }

  const cacheKey = symbols.sort().join(",");
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ quotes: cached.data, cached: true });
  }

  try {
    // Yahoo Finance batch quote endpoint (unofficial but stable)
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.join(",")}`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json({ error: `Yahoo ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const quotes: Record<string, any> = {};

    for (const q of data.quoteResponse?.result || []) {
      quotes[q.symbol] = {
        symbol: q.symbol,
        name: q.longName || q.shortName || q.symbol,
        price: q.regularMarketPrice ?? q.postMarketPrice ?? null,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        previousClose: q.regularMarketPreviousClose,
        dayHigh: q.regularMarketDayHigh,
        dayLow: q.regularMarketDayLow,
        volume: q.regularMarketVolume,
        marketCap: q.marketCap,
        peRatio: q.trailingPE,
        currency: q.currency,
        exchange: q.fullExchangeName,
        marketState: q.marketState,
      };
    }

    cache.set(cacheKey, { data: quotes, expires: Date.now() + CACHE_MS });
    return NextResponse.json({ quotes });
  } catch (err: any) {
    console.error("Market quote error:", err);
    return NextResponse.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
