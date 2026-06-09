// =============================================================
//  VidSrcMe Provider for Nuvio
//  File: providers/vidsrcme.js
//
//  ⚠️  NO async/await — Nuvio's Hermes engine will crash.
//      Everything uses .then() and .catch() chains instead.
// =============================================================

var EMBED_BASE = "https://vsembed.su";
var TMDB_BASE  = "https://api.themoviedb.org/3";

// Replace with your own free TMDb key from:
// https://www.themoviedb.org/settings/api
var TMDB_KEY = "4d2d8c6c8bc0b615aad29844cc7403d8";

// ── Main function Nuvio calls ─────────────────────────────────────────────
//
// tmdbId    : string  — the TMDb ID, e.g. "550"
// mediaType : string  — "movie" or "tv"
// season    : number  — season number (TV only, null for movies)
// episode   : number  — episode number (TV only, null for movies)
//
// Must return a Promise that resolves to an array of stream objects.

function getStreams(tmdbId, mediaType, season, episode) {
  var embedUrl;

  if (mediaType === "movie") {
    embedUrl = EMBED_BASE + "/embed/movie?tmdb=" + tmdbId;
  } else {
    embedUrl = EMBED_BASE + "/embed/tv?tmdb=" + tmdbId
      + "&season=" + season
      + "&episode=" + episode;
  }

  // vsembed.su doesn't have a public JSON API for stream URLs,
  // so we fetch the embed page and look for the video source inside it.
  return fetch(embedUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36",
      "Referer"   : EMBED_BASE + "/"
    }
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error("Embed page returned HTTP " + response.status);
    }
    return response.text();
  })
  .then(function(html) {
    var streams = [];

    // ── Attempt 1: look for a direct m3u8 or mp4 URL in the page source ──
    // vsembed.su embeds stream URLs in its page JavaScript.
    // Common patterns we search for:
    var m3u8Match = html.match(/["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/);
    var mp4Match  = html.match(/["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/);

    if (m3u8Match) {
      streams.push({
        name    : "VidSrcMe",
        title   : "▶ VidSrcMe (HLS)",
        url     : m3u8Match[1],
        quality : "1080p",
        headers : {
          "Referer"   : EMBED_BASE + "/",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
        }
      });
    }

    if (mp4Match) {
      streams.push({
        name    : "VidSrcMe",
        title   : "▶ VidSrcMe (MP4)",
        url     : mp4Match[1],
        quality : "1080p",
        headers : {
          "Referer"   : EMBED_BASE + "/",
          "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36"
        }
      });
    }

    // ── Attempt 2: look for an iframe src pointing to another embed ───────
    // vsembed.su sometimes nests inside another player (e.g. vidsrc.xyz).
    // If found, return that URL so Nuvio can try to resolve it.
    if (streams.length === 0) {
      var iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
      if (iframeMatch) {
        streams.push({
          name    : "VidSrcMe",
          title   : "▶ VidSrcMe (Embed)",
          url     : iframeMatch[1],
          quality : "Unknown",
          headers : {
            "Referer": EMBED_BASE + "/"
          }
        });
      }
    }

    // ── Fallback: return the embed URL itself ─────────────────────────────
    // Nuvio may be able to open this in its internal webview.
    if (streams.length === 0) {
      streams.push({
        name    : "VidSrcMe",
        title   : "▶ VidSrcMe (WebView)",
        url     : embedUrl,
        quality : "Unknown",
        headers : {
          "Referer": EMBED_BASE + "/"
        }
      });
    }

    return streams;
  })
  .catch(function(err) {
    console.error("[VidSrcMe] Error fetching streams:", err.message || err);
    return [];
  });
}

// ── Export (React Native + Node.js compatible) ────────────────────────────
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getStreams: getStreams };
} else {
  global.getStreams = getStreams;
}
