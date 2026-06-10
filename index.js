// =============================================================
//  VidSrcMe Addon for Nuvio & Stremio
//  Stream source: ezvidapi.com (free, no API key, multi-provider)
//
//  Deploy on Vercel:
//    1. Push this folder to GitHub
//    2. Import repo on vercel.com
//    3. Set TMDB_KEY environment variable
//    4. Paste your /manifest.json URL into Nuvio or Stremio
// =============================================================

const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const EZVID_BASE = "https://ezvidapi.com";
const TMDB_BASE  = "https://api.themoviedb.org/3";
const TMDB_KEY   = process.env.TMDB_KEY || "YOUR_TMDB_API_KEY_HERE";

// ── Manifest ──────────────────────────────────────────────────────────────
const manifest = {
  id          : "community.vidsrcme",
  version     : "1.0.1",
  name        : "VidSrcMe",
  description : "Stream movies & TV shows — direct HLS playback via ezvidapi",
  logo        : "https://vsembed.su/favicon.ico",
  resources   : ["stream"],
  types       : ["movie", "series"],
  idPrefixes  : ["tt"],
  catalogs    : [],
};

const builder = new addonBuilder(manifest);

// ── Helpers ───────────────────────────────────────────────────────────────

// Convert an IMDB ID to a TMDB ID (needed for ezvidapi)
async function imdbToTmdb(imdbId, type) {
  const res  = await fetch(
    `${TMDB_BASE}/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`
  );
  const data = await res.json();
  if (type === "movie") {
    return data.movie_results?.[0]?.id?.toString() || null;
  } else {
    return data.tv_results?.[0]?.id?.toString() || null;
  }
}

// Fetch direct HLS stream URL from ezvidapi
// ezvidapi endpoint: GET /tv/:provider/:tmdb_id/:season/:episode
//                    GET /movie/:provider/:tmdb_id
// Available providers: vidlink, vidsrc, autoembed, 2embed
async function fetchStreams(tmdbId, type, season, episode) {
  const providers = ["vidlink", "vidsrc", "autoembed", "2embed"];
  const streams   = [];

  for (const provider of providers) {
    try {
      let url;
      if (type === "movie") {
        url = `${EZVID_BASE}/movie/${provider}/${tmdbId}`;
      } else {
        url = `${EZVID_BASE}/tv/${provider}/${tmdbId}/${season}/${episode}`;
      }

      const res  = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal : AbortSignal.timeout(8000), // 8 second timeout per provider
      });

      if (!res.ok) continue;

      const data = await res.json();

      // ezvidapi returns { url, headers, subtitles } or similar
      const streamUrl = data?.url || data?.stream || data?.hls;
      if (!streamUrl) continue;

      streams.push({
        name    : `VidSrcMe · ${provider}`,
        title   : `▶ ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        url     : streamUrl,
        headers : data?.headers || { "Referer": "https://vsembed.su/" },
        behaviorHints: {
          bingeGroup: `vidsrcme-${tmdbId}`,
        },
      });

    } catch (err) {
      console.log(`[VidSrcMe] Provider ${provider} failed:`, err.message);
      continue;
    }
  }

  return streams;
}

// ── Stream Handler ────────────────────────────────────────────────────────
builder.defineStreamHandler(async function (args) {
  try {
    let tmdbId, season, episode, type;

    if (args.type === "movie") {
      type   = "movie";
      tmdbId = await imdbToTmdb(args.id, "movie");
    } else {
      type              = "tv";
      const [imdbId, s, e] = args.id.split(":");
      season            = s;
      episode           = e;
      tmdbId            = await imdbToTmdb(imdbId, "tv");
    }

    if (!tmdbId) {
      console.log(`[VidSrcMe] Could not resolve TMDB ID for ${args.id}`);
      return { streams: [] };
    }

    console.log(`[VidSrcMe] Fetching streams for TMDB ${tmdbId} (${type})`);
    const streams = await fetchStreams(tmdbId, type, season, episode);
    console.log(`[VidSrcMe] Found ${streams.length} stream(s)`);

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
