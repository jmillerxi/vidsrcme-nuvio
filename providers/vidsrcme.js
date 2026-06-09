// =============================================================
//  VidSrcMe Provider for Nuvio
//  Source : https://vsembed.su
//  Metadata: TMDb API
//
//  This file lives at:  src/vidsrcme/index.js
//  Build with:          node build.js vidsrcme
//  Output goes to:      providers/vidsrcme.js
// =============================================================

// ── Config ────────────────────────────────────────────────────────────────
const EMBED_BASE  = "https://vsembed.su";
const TMDB_BASE   = "https://api.themoviedb.org/3";

// Replace with your own free key from https://www.themoviedb.org/settings/api
const TMDB_KEY    = "4d2d8c6c8bc0b615aad29844cc7403d8";

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Fetch JSON from a URL.
 * Nuvio's runtime is React Native (Hermes), so we use the global fetch().
 */
async function fetchJson(url, headers = {}) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; NuvioProvider/1.0)",
      ...headers,
    },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${url}`);
  return resp.json();
}

/**
 * Convert a TMDb ID to an IMDB ID.
 * vsembed.su accepts both, but we also expose it for the Stremio version.
 */
async function tmdbToImdb(tmdbId, mediaType) {
  try {
    const type = mediaType === "tv" ? "tv" : "movie";
    const data = await fetchJson(
      `${TMDB_BASE}/${type}/${tmdbId}/external_ids?api_key=${TMDB_KEY}`
    );
    return data.imdb_id || null;
  } catch {
    return null;
  }
}

// ── Main export ───────────────────────────────────────────────────────────

/**
 * getStreams is the single function Nuvio calls.
 *
 * @param {string} tmdbId    - The TMDb ID of the title
 * @param {string} mediaType - "movie" or "tv"
 * @param {number|null} season  - Season number (TV only)
 * @param {number|null} episode - Episode number (TV only)
 * @returns {Promise<Array>} - Array of stream objects
 */
async function getStreams(tmdbId, mediaType, season, episode) {
  try {
    let embedUrl;

    if (mediaType === "movie") {
      embedUrl = `${EMBED_BASE}/embed/movie?tmdb=${tmdbId}`;
    } else {
      embedUrl = `${EMBED_BASE}/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`;
    }

    // vsembed.su serves an iframe embed page.
    // We return the embed URL directly — Nuvio's webview will resolve the stream.
    // If you need direct m3u8 extraction, see the extractor.js file.
    return [
      {
        name    : "VidSrcMe",
        title   : mediaType === "movie"
          ? "▶ VidSrcMe"
          : `▶ VidSrcMe  S${season}E${episode}`,
        url     : embedUrl,
        quality : "1080p",
        headers : {
          "Referer"   : EMBED_BASE + "/",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        // behaviorHints tells Nuvio to open this in a webview / external browser
        // rather than trying to play it as a raw video file.
        behaviorHints: {
          notWebReady: true,
        },
      },
    ];
  } catch (err) {
    console.error("[VidSrcMe] getStreams error:", err.message);
    return [];
  }
}

module.exports = { getStreams };
