'use client';

import React, { useState } from 'react';
import { getMerchantColor } from '@/lib/utils';

// Common merchant-to-domain mapping for better logo hits
const MERCHANT_DOMAINS: Record<string, string> = {
  // Food & grocery
  'instacart': 'instacart.com',
  'doordash': 'doordash.com',
  'uber eats': 'ubereats.com',
  'grubhub': 'grubhub.com',
  'whole foods': 'wholefoodsmarket.com',
  'trader joes': 'traderjoes.com',
  '7-eleven': '7-eleven.com',
  '7 eleven': '7-eleven.com',
  'cvs': 'cvs.com',
  'walgreens': 'walgreens.com',
  'target': 'target.com',
  'walmart': 'walmart.com',
  'costco': 'costco.com',
  'kroger': 'kroger.com',
  'safeway': 'safeway.com',
  'publix': 'publix.com',
  'bevmo': 'bevmo.com',
  'bevmo!': 'bevmo.com',
  'albertsons': 'albertsons.com',

  // Coffee / food
  'starbucks': 'starbucks.com',
  'dunkin': 'dunkindonuts.com',
  'chipotle': 'chipotle.com',
  'mcdonalds': 'mcdonalds.com',
  "mcdonald's": 'mcdonalds.com',
  'chick-fil-a': 'chick-fil-a.com',
  'chick fil a': 'chick-fil-a.com',
  'panera': 'panerabread.com',
  'subway': 'subway.com',

  // Transport
  'uber': 'uber.com',
  'lyft': 'lyft.com',
  'shell': 'shell.com',
  'chevron': 'chevron.com',
  'exxon': 'exxon.com',
  'bp': 'bp.com',

  // Streaming / subs
  'netflix': 'netflix.com',
  'spotify': 'spotify.com',
  'apple': 'apple.com',
  'apple music': 'apple.com',
  'youtube': 'youtube.com',
  'hulu': 'hulu.com',
  'disney+': 'disneyplus.com',
  'disney plus': 'disneyplus.com',
  'hbo': 'hbomax.com',
  'hbo max': 'hbomax.com',
  'paramount+': 'paramountplus.com',
  'paramount plus': 'paramountplus.com',
  'peacock': 'peacocktv.com',
  'amazon prime': 'amazon.com',
  'amazon': 'amazon.com',
  'ebay': 'ebay.com',

  // Tech
  'google': 'google.com',
  'microsoft': 'microsoft.com',
  'adobe': 'adobe.com',
  'github': 'github.com',
  'openai': 'openai.com',
  'claude.ai': 'anthropic.com',
  'anthropic': 'anthropic.com',

  // Retail
  'best buy': 'bestbuy.com',
  'home depot': 'homedepot.com',
  "lowe's": 'lowes.com',
  'lowes': 'lowes.com',
  'macys': 'macys.com',
  "macy's": 'macys.com',
  'nordstrom': 'nordstrom.com',
  'nike': 'nike.com',
  'adidas': 'adidas.com',
  'ulta': 'ulta.com',
  'ulta beauty': 'ulta.com',
  'sephora': 'sephora.com',
  'lululemon': 'lululemon.com',
  'zara': 'zara.com',

  // Banks & Investment institutions
  'chase': 'chase.com',
  'bank of america': 'bankofamerica.com',
  'wells fargo': 'wellsfargo.com',
  'citi': 'citi.com',
  'citibank': 'citi.com',
  'capital one': 'capitalone.com',
  'capitalone': 'capitalone.com',
  'american express': 'americanexpress.com',
  'amex': 'americanexpress.com',
  'discover': 'discover.com',
  'ally': 'ally.com',
  'ally bank': 'ally.com',
  'schwab': 'schwab.com',
  'charles schwab': 'schwab.com',
  'fidelity': 'fidelity.com',
  'fidelity investments': 'fidelity.com',
  'vanguard': 'vanguard.com',
  'etrade': 'etrade.com',
  'e*trade': 'etrade.com',
  'e-trade': 'etrade.com',
  'e*trade financial': 'etrade.com',
  'morgan stanley': 'morganstanley.com',
  'goldman sachs': 'goldmansachs.com',
  'marcus': 'marcus.com',
  'sofi': 'sofi.com',
  'chime': 'chime.com',
  'robinhood': 'robinhood.com',
  'coinbase': 'coinbase.com',
  'paypal': 'paypal.com',
  'venmo': 'venmo.com',
  'cash app': 'cash.app',
  'zelle': 'zellepay.com',
  'usaa': 'usaa.com',
  'navy federal': 'navyfederal.org',
  'pnc': 'pnc.com',
  'us bank': 'usbank.com',
  'td bank': 'td.com',

  // Utilities / bills
  'verizon': 'verizon.com',
  'att': 'att.com',
  'at&t': 'att.com',
  't-mobile': 't-mobile.com',
  'tmobile': 't-mobile.com',
  'xfinity': 'xfinity.com',
  'comcast': 'xfinity.com',
  'cox': 'cox.com',
  'cox communications': 'cox.com',

  // Fitness & other
  'tesla': 'tesla.com',
  'airbnb': 'airbnb.com',
  'planet fitness': 'planetfitness.com',
  'la fitness': 'lafitness.com',
  'equinox': 'equinox.com',
  'peloton': 'peloton.com',
  'flo health': 'flo.health',
  'flo': 'flo.health',
  'monarch': 'monarchmoney.com',
  'bilt': 'biltrewards.com',
  'bilt rewards': 'biltrewards.com',
};

/**
 * Guess a domain from a merchant name.
 */
function guessDomain(name: string): string | null {
  if (!name) return null;
  const key = name.toLowerCase().trim();
  if (MERCHANT_DOMAINS[key]) return MERCHANT_DOMAINS[key];

  // Try without punctuation
  const stripped = key.replace(/[.,!'*]/g, '').trim();
  if (MERCHANT_DOMAINS[stripped]) return MERCHANT_DOMAINS[stripped];

  // Partial match: any key that's a substring of the merchant name
  for (const [k, v] of Object.entries(MERCHANT_DOMAINS)) {
    if (key.includes(k) || stripped.includes(k)) return v;
  }

  // Try first word if multi-word
  const firstWord = stripped.split(/\s+/)[0];
  if (firstWord.length > 2 && MERCHANT_DOMAINS[firstWord]) return MERCHANT_DOMAINS[firstWord];

  // Heuristic: if name is simple one-word, try {word}.com
  if (/^[a-z0-9]+$/.test(firstWord) && firstWord.length >= 3) {
    return `${firstWord}.com`;
  }

  return null;
}

/**
 * Returns an ordered list of logo URLs to try.
 * DuckDuckGo is the most reliable for brand icons (200 on virtually
 * every domain with a favicon). Google is a backup — it returns 404
 * for many domains (including capitalone.com).
 */
function logoUrls(domain: string): string[] {
  return [
    // DuckDuckGo's icon service — best hit rate, no auth, no CORS issues
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    // Google Favicons — fallback
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    // Direct favicon — last resort
    `https://${domain}/favicon.ico`,
  ];
}

export function MerchantLogo({
  name,
  size = 36,
  className = '',
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const domain = guessDomain(name);
  const urls = domain ? logoUrls(domain) : [];
  const [urlIndex, setUrlIndex] = useState(0);

  const initial = (name || '?').charAt(0).toUpperCase();
  const bg = getMerchantColor(name);
  const dimensions = { width: size, height: size };

  const hasUrl = urls.length > 0 && urlIndex < urls.length;

  if (hasUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-white border border-flourish-border ${className}`}
        style={dimensions}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={urls[urlIndex]}
          alt={name}
          width={size}
          height={size}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setUrlIndex((i) => i + 1)}
          className="w-full h-full object-contain p-1"
        />
      </div>
    );
  }

  // Final fallback: colored circle with initial
  return (
    <div
      className={`rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold ${className}`}
      style={{ ...dimensions, backgroundColor: bg, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  );
}
