import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: any; expires: number }>();
const CACHE_MS = 15 * 60_000; // 15 min

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/**
 * GET /api/market/news?symbols=AAPL,MSFT
 * Returns recent news articles for these symbols.
 */
export async function GET(req: NextRequest) {
  const symbolsParam = req.nextUrl.searchParams.get("symbols");
  if (!symbolsParam) return NextResponse.json({ error: "symbols required" }, { status: 400 });

  const symbols = symbolsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  const cacheKey = symbols.sort().join(",");
  const cached = cache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json({ articles: cached.data, cached: true });
  }

  try {
    // Yahoo Finance search endpoint includes news for symbols
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(symbols.join(" "))}&newsCount=10&quotesCount=0`;
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, cache: "no-store" });
    if (!res.ok) return NextResponse.json({ error: `Yahoo ${res.status}` }, { status: 502 });

    const data = await res.json();
    const articles = (data.news || []).map((n: any) => ({
      uuid: n.uuid,
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      publishedAt: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : null,
      thumbnail: n.thumbnail?.resolutions?.[0]?.url,
      relatedSymbols: n.relatedTickers || [],
    }));

    cache.set(cacheKey, { data: articles, expires: Date.now() + CACHE_MS });
    return NextResponse.json({ articles });
  } catch (err: any) {
    console.error("Market news error:", err);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
