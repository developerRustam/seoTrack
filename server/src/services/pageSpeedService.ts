import { PAGESPEED_API_KEY } from "../app/config.js";
import type { Strategy } from "../lib/metrics.js";

export async function runPageSpeed(url: string, strategy: Strategy) {
    if (!PAGESPEED_API_KEY) throw new Error("PAGESPEED_API_KEY is not set");
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("strategy", strategy);
    endpoint.searchParams.set("key", PAGESPEED_API_KEY);
  
    const res = await fetch(endpoint);
    
    if (!res.ok) {
      throw new Error(`PageSpeed error: ${res.status}`);
    }
    return res.json();
  }
  