// =============================================================
//  VidSrcMe Addon for Stremio
//  Source : https://vsembed.su
//
//  Deploy for FREE on Vercel:
//    1. Push this folder to GitHub
//    2. Import repo on vercel.com
//    3. Set TMDB_KEY environment variable
//    4. Done — paste your /manifest.json URL into Stremio
// =============================================================

const { addonBuilder, serveHTTP } = require("stremio-addon-sdk");

const EMBED_BASE = "https://vsembed.su";
const TMDB_BASE  = "https://api.themoviedb.org/3";

// Read your TMDb API key from environment variable (set in Vercel dashboard)
// For local testing you can put it directly here temporarily:
//   const TMDB_KEY = "abc123...";
const TMDB_KEY = process.env.TMDB_KEY || "YOUR_TMDB_API_KEY_HERE";

// ── Manifest ──────────────────────────────────────────────────────────────
// This tells Stremio what your addon does and when to call it.
const manifest = {
  id          : "community.vidsrcme",
  version     : "1.0.0",
  name        : "VidSrcMe",
  description : "Stream movies & TV shows via vsembed.su (VidSrcMe)",
  logo        : "https://vsembed.su/favicon.ico",

  // "stream" means we provide video links.
  // Stremio uses "tt" (IMDB) IDs natively for movies/series — no extra metadata work needed.
  resources   : ["stream"],
  types       : ["movie", "series"],
  idPrefixes  : ["tt"],   // Stremio sends us IMDB IDs like tt1234567

  // No catalogs — we only provide streams, not a browseable list.
  catalogs    : [],
};

// ── Builder ───────────────────────────────────────────────────────────────
const builder = new addonBuilder(manifest);

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Convert an IMDB ID to a TMDb ID.
 * vsembed.su can also accept IMDB IDs directly via ?imdb= parameter,
 * but TMDb IDs are more reliable, so we convert.
 */
async function imdbToTmdb(imdbId, type) {
  const url = `${TMDB_BASE}/find/${imdbId}?api_key=${TMDB_KEY}&external_source=imdb_id`;
  const res  = await fetch(url);
  const data = await res.json();

  if (type === "movie") {
    return data.movie_results?.[0]?.id?.toString() || null;
  } else {
    return data.tv_results?.[0]?.id?.toString() || null;
  }
}

// ── Stream Handler ────────────────────────────────────────────────────────
// Stremio calls this every time a user opens a movie or episode.
//
// For movies:  args.type = "movie",  args.id = "tt1234567"
// For series:  args.type = "series", args.id = "tt1234567:1:2"  (id:season:episode)

builder.defineStreamHandler(async function (args) {
  try {
    let embedUrl;
    const type = args.type;

    if (type === "movie") {
      // args.id is an IMDB ID like "tt1234567"
      const imdbId = args.id;

      // vsembed.su accepts ?imdb= directly, so no conversion needed for movies
      embedUrl = `${EMBED_BASE}/embed/movie?imdb=${imdbId}`;

    } else if (type === "series") {
      // args.id format: "tt1234567:1:2"  (imdbId:season:episode)
      const [imdbId, season, episode] = args.id.split(":");

      // For TV we need the TMDb ID since vsembed.su's TV endpoint uses TMDb
      const tmdbId = await imdbToTmdb(imdbId, "tv");
      if (!tmdbId) {
        console.log(`[VidSrcMe] Could not find TMDb ID for ${imdbId}`);
        return { streams: [] };
      }

      embedUrl = `${EMBED_BASE}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
    } else {
      return { streams: [] };
    }

    return {
      streams: [
        {
          name   : "VidSrcMe",
          title  : "▶ VidSrcMe",
          url    : embedUrl,
          // externalUrl opens the link in a browser instead of the built-in player.
          // This is needed because vsembed.su is an embed page, not a raw .m3u8.
          externalUrl: embedUrl,
          // Behavior hints
          behaviorHints: {
            notWebReady  : true,
            bingeGroup   : `vidsrcme-${args.id.split(":")[0]}`,
          },
        },
      ],
    };
  } catch (err) {
    console.error("[VidSrcMe] Stream handler error:", err.message);
    return { streams: [] };
  }
});

// ── Server ────────────────────────────────────────────────────────────────
// When running locally this starts a web server.
// On Vercel, we export the handler instead (see vercel-handler.js).

if (require.main === module) {
  serveHTTP(builder.getInterface(), { port: process.env.PORT || 7000 });
  console.log("✅ VidSrcMe Stremio addon running at http://localhost:7000");
  console.log("   Install URL: http://localhost:7000/manifest.json");
}

module.exports = builder.getInterface();
