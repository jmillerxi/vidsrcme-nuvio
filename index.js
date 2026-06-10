// =============================================================
//  VidSrcMe Addon for Nuvio & Stremio
//  Stream source: streamdata.vaplayer.ru (direct m3u8, no browser)
//
//  Deploy on Vercel:
//    1. Push this folder to GitHub
//    2. Import repo on vercel.com
//    3. Set TMDB_KEY environment variable
//    4. Paste your /manifest.json URL into Nuvio or Stremio
// =============================================================

const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const TMDB_BASE  = "https://api.themoviedb.org/3";
const TMDB_KEY   = process.env.TMDB_KEY || "YOUR_TMDB_API_KEY_HERE";

// vaplayer API — returns direct .m3u8 URLs, no browser needed
// Docs: https://streamdata.vaplayer.ru/api.php?imdb=tt1190634&season=1&episode=1
const VAPLAYER_API = "https://streamdata.vaplayer.ru/api.php";

// ── Manifest ──────────────────────────────────────────────────────────────
const manifest = {
  id          : "community.vidsrcme",
  version     : "1.0.2",
  name        : "VidSrcMe",
  description : "Stream movies & TV shows — direct HLS via VaPlayer",
  logo        : "https://vsembed.su/favicon.ico",
  resources   : ["stream"],
  types       : ["movie", "series"],
  idPrefixes  : ["tt"],
  catalogs    : [],
};

const builder = new addonBuilder(manifest);

// ── Shared fetch helper ───────────────────────────────────────────────────
async function fetchJSON(url, opts = {}) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept"    : "application/json",
      ...opts.headers,
    },
    signal: AbortSignal.timeout(10000),
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

// ── Stream Handler ────────────────────────────────────────────────────────
builder.defineStreamHandler(async function (args) {
  try {
    let imdbId, season, episode;

    if (args.type === "movie") {
      imdbId = args.id;                              // "tt1234567"
    } else {
      [imdbId, season, episode] = args.id.split(":"); // "tt1234567:1:2"
    }

    // Build vaplayer API request URL
    let apiUrl;
    if (args.type === "movie") {
      apiUrl = `${VAPLAYER_API}?imdb=${imdbId}`;
    } else {
      apiUrl = `${VAPLAYER_API}?imdb=${imdbId}&season=${season}&episode=${episode}`;
    }

    console.log(`[VidSrcMe] Requesting: ${apiUrl}`);

    const data = await fetchJSON(apiUrl);

    // vaplayer returns an array of stream objects
    // Each has: { quality, url, headers? }
    // e.g. [{ quality: "1080p", url: "https://cdn.../index.m3u8" }, ...]

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("[VidSrcMe] No streams returned from vaplayer");
      return { streams: [] };
    }

    // Sort best quality first: 4K > 1080p > 720p > rest
    const qualityOrder = ["4k", "2160p", "1080p", "720p", "480p", "360p"];
    data.sort((a, b) => {
      const ai = qualityOrder.indexOf((a.quality || "").toLowerCase());
      const bi = qualityOrder.indexOf((b.quality || "").toLowerCase());
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const streams = data.map(s => ({
      name    : `VidSrcMe · ${s.quality || "stream"}`,
      title   : `▶ ${s.quality || "Stream"}`,
      url     : s.url,
      headers : s.headers || {},
      behaviorHints: {
        bingeGroup: `vidsrcme-${imdbId}`,
      },
    }));

    console.log(`[VidSrcMe] Returning ${streams.length} stream(s)`);
    return { streams };

  } catch (err) {
    console.error("[VidSrcMe] Handler error:", err.message);
    return { streams: [] };
  }
});

// ── Server ────────────────────────────────────────────────────────────────
if (require.main === module) {
  serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
  console.log("✅ VidSrcMe addon running at http://localhost:7000");
  console.log("   Manifest: http://localhost:7000/manifest.json");
}

module.exports = builder.getInterface();
