import { PAGESPEED_API_KEY, PAGESPEED_TIMEOUT_MS } from "../app/config.js";
import type { Strategy } from "../lib/metrics.js";

export async function runPageSpeed(url: string, strategy: Strategy) {
    if (!PAGESPEED_API_KEY) throw new Error("PAGESPEED_API_KEY is not set");
    const endpoint = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    endpoint.searchParams.set("url", url);
    endpoint.searchParams.set("strategy", strategy);
    endpoint.searchParams.set("key", PAGESPEED_API_KEY);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PAGESPEED_TIMEOUT_MS);

    try {
      const res = await fetch(endpoint, { signal: controller.signal });

      if (!res.ok) {
        throw new Error(`PageSpeed error: ${res.status}`);
      }

      return res.json();
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `PageSpeed request timed out after ${PAGESPEED_TIMEOUT_MS}ms for ${strategy} ${url}`
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }
