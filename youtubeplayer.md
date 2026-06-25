# Build Spec: Custom-Branded Lecture Video Player (YouTube-backed)

**Goal:** A video player for lecture content that streams from YouTube (unlisted videos) but shows zero YouTube chrome — fully custom controls, branding, and end-of-video behavior. This is the technique used by PW, Unacademy, Vedantu, etc.

**Hand this whole document to Claude Code as the implementation brief.** It's organized as phases — build and test each one before moving to the next.

---

## 0. Ground truth — read this before building anything

- This does **not** hide the fact that the video is hosted on YouTube from someone who opens DevTools → Network tab. The `iframe`'s `src` will always contain `youtube.com/embed/VIDEO_ID`. What this *does* do is remove every visible trace (logo, "Watch on YouTube" link, related videos, native controls, right-click menu) so a normal student scrolling through a lecture never sees or clicks anything YouTube-branded.
- This is the **sanctioned** way to do it: YouTube's own IFrame Player API ships a `controls=0` parameter and a full JS control surface specifically so embedders can build custom players. There is no scraping, no stream extraction, no ToS violation here.
- Do **not** attempt to proxy/extract YouTube's actual video stream (e.g. via yt-dlp-style extraction) to self-host it. That breaks YouTube's Terms of Service, is legally risky, and breaks constantly as YouTube changes its internals. Everything below uses the official, stable, documented API.
- `modestbranding` and `showinfo` parameters are **deprecated and now no-ops** (since 2023 and 2018 respectively) — don't rely on them. `rel=0` no longer fully suppresses related videos either (only limits them to the same channel). None of this matters once you set `controls=0`, because there's no control bar left for a logo or related-video grid to render on in the first place.
- Manual quality selection (`setPlaybackQuality`) is now only a **suggestion** to YouTube's adaptive algorithm, not a guarantee — don't promise students "Force 1080p," it may not stick.

---

## 1. Prerequisites (do this in YouTube Studio, not code)

1. Own the channel, or have upload rights to a channel that owns the lecture content.
2. Upload each lecture as **Unlisted** (not Private — Private videos can only be embedded by viewers you've explicitly granted access to; Unlisted can be embedded anywhere and isn't searchable/listed on the channel).
3. In Studio → video Details → "Show more" → **License and distribution**, confirm "Allow embedding" is checked.
4. Domain-restricted embedding (only allow your domain to embed it) is a **Content Manager / YouTube Partner feature**, not available on a normal channel. If you don't have that, anyone who has the video ID can technically embed it elsewhere too — mitigate this in the app layer (Phase 8), not at the YouTube settings layer.
5. Note each video's ID (the `VIDEO_ID` in `youtube.com/watch?v=VIDEO_ID`). Store these server-side, associated with the lecture/course record — never hardcode them in client bundles.

---

## 2. Architecture

```
[Your backend]
   └─ GET /api/lectures/:id  → (auth + enrollment check) → { videoId, title, watermarkText }

[Browser]
   <LecturePlayerWrapper>            ← position:relative container, this is what goes fullscreen
     <div id="yt-target" />          ← YouTube IFrame API replaces this with the actual iframe
     <ClickCatcherOverlay />         ← position:absolute, inset:0, z-index:2, transparent, captures all clicks/taps/right-clicks
     <BufferingSpinner />            ← shown during BUFFERING state, fully covers video
     <EndCard />                     ← shown on ENDED state, fully opaque, replaces YouTube's related-videos grid
     <Watermark />                   ← small, semi-transparent, student-identifying text (anti-leak deterrent)
     <CustomControlBar />            ← your play/pause, seek bar, time, volume, speed, settings, fullscreen
```

Key principle: **the raw YouTube iframe never receives a direct user click.** Every interaction goes through your overlay/control bar, which calls the YT.Player JS API. The iframe is reduced to "a rectangle YouTube paints pixels into."

---

## 3. Phase 1 — Backend: never expose the raw video ID for free

Create an endpoint that returns the video ID only after checking the student is logged in and enrolled in that course/lecture:

```
GET /api/lectures/:lectureId/playback
→ 401 if not authenticated
→ 403 if not enrolled
→ 200 { videoId: "abc123XYZ", title: "...", studentWatermark: "student@email.com · ID 99213" }
```

Do not embed video IDs in server-rendered HTML, sitemap, or any public JSON. Fetch this only client-side, after auth, inside the lecture page component.

This doesn't make the video un-findable by the enrolled student themselves (they can always see it in Network tab — that's fine, expected, not a security hole), it just stops a logged-out visitor or search bot from harvesting your whole video catalog's IDs.

---

## 4. Phase 2 — Load the IFrame API once (singleton loader)

The YouTube IFrame API script can only be loaded once per page, and `onYouTubeIframeAPIReady` is a single global callback. If you'll have multiple player instances (e.g. in an SPA), use a shared loader promise:

```js
// youtubeApiLoader.js
let apiPromise = null;

export function loadYouTubeApi() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
  });

  return apiPromise;
}
```

Use `https://www.youtube-nocookie.com` as the player host instead of `youtube.com` if you want the privacy-enhanced mode (no tracking cookies set until the user actually presses play). Functionally identical otherwise — pass it as the `host` option when constructing `YT.Player`.

---

## 5. Phase 3 — Player init with the chrome-stripping parameters

```js
function createPlayer(targetEl, videoId, origin) {
  return new YT.Player(targetEl, {
    videoId,
    host: 'https://www.youtube-nocookie.com', // optional privacy mode
    playerVars: {
      autoplay: 0,
      controls: 0,        // <-- the core trick: zero native chrome
      disablekb: 1,        // we build our own keyboard shortcuts (Phase 9)
      fs: 0,                // remove native fullscreen button, we build our own (Phase 8)
      iv_load_policy: 3,    // suppress video annotations/cards
      modestbranding: 1,    // deprecated/no-op now, harmless to leave in
      playsinline: 1,        // critical for iOS: prevents native fullscreen takeover on play
      rel: 0,                 // limits related videos to same channel (only matters if controls were on)
      cc_load_policy: 0,      // don't auto-show captions; let your settings menu toggle them
      origin,                  // window.location.origin — required for postMessage security
      enablejsapi: 1,
    },
    events: {
      onReady: handleReady,
      onStateChange: handleStateChange,
      onPlaybackQualityChange: handleQualityChange,
      onError: handleError,
    },
  });
}
```

`origin` matters: without it, malicious third-party JS injected into your page could hijack control of the player via postMessage spoofing. Always pass `window.location.origin`.

---

## 6. Phase 4 — The click-catcher overlay (this is what makes it feel "clean")

Absolutely position a div over the entire player area, above the iframe in z-index, that intercepts every gesture:

```jsx
<div
  className="yt-overlay"
  onClick={handleOverlayClick}        // toggle play/pause, or show controls if hidden
  onDoubleClick={handleOverlayDoubleClick} // seek ±10s, like native YouTube/Netflix convention
  onContextMenu={(e) => e.preventDefault()} // kills the right-click menu entirely
  onMouseMove={showControlsTemporarily}
  onTouchStart={handleTouchTap}
/>
```

```css
.yt-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  background: transparent;
  cursor: pointer;
}
```

Why `onContextMenu` works here and isn't blocked by cross-origin restrictions: the event fires on **your** div, which is same-origin, native DOM. You're never trying to suppress a context menu *inside* the iframe (which you couldn't do, cross-origin) — you're just never letting the click reach the iframe in the first place, because your div is on top and fully covers it.

Double-tap zones for mobile (left third = -10s, right third = +10s, middle = play/pause) is the standard pattern students will already intuitively expect from YouTube/Netflix apps — implement it via touch X-coordinate within the overlay's bounding rect.

---

## 7. Phase 5 — Driving your UI off player state (polling is required)

The IFrame API does **not** push a continuous "timeupdate" event like HTML5 `<video>` does. You must poll:

```js
function startProgressLoop(player, onTick) {
  const interval = setInterval(() => {
    if (!player || typeof player.getCurrentTime !== 'function') return;
    onTick({
      currentTime: player.getCurrentTime(),
      duration: player.getDuration(),
      bufferedFraction: player.getVideoLoadedFraction(), // 0..1, drives the buffered-bar
    });
  }, 250); // 4x/sec is smooth enough for a seek bar, don't go tighter — wastes postMessage calls
  return () => clearInterval(interval);
}
```

Map `onStateChange` (`event.data`) to your UI:

| YT.PlayerState | Value | Your UI should... |
|---|---|---|
| UNSTARTED | -1 | show poster/thumbnail |
| ENDED | 0 | show your EndCard (Phase 11), pause progress loop |
| PLAYING | 1 | show pause icon, hide buffering spinner, run progress loop |
| PAUSED | 2 | show play icon |
| BUFFERING | 3 | show your own spinner, fully covering the video area (YouTube's native loading indicator may briefly show through underneath — your opaque spinner masks it) |
| CUE_VIDEO_CUED | 5 | player loaded, ready to play |

---

## 8. Phase 6 — Custom control bar wiring

Build your own bar (play/pause button, seek bar, current/duration time, volume slider, speed menu, settings gear, fullscreen button) absolutely positioned at the bottom of the wrapper. Every control calls the JS API directly — never touches the iframe:

| Control | API call |
|---|---|
| Play/Pause | `player.playVideo()` / `player.pauseVideo()` |
| Seek bar drag | `player.seekTo(seconds, true)` |
| Volume slider | `player.setVolume(0-100)` |
| Mute toggle | `player.mute()` / `player.unMute()`, check state with `player.isMuted()` |
| Speed menu | `player.setPlaybackRate(rate)`; populate options from `player.getAvailablePlaybackRates()` |
| Captions toggle | `player.loadModule('captions')` / `player.unloadModule('captions')`, or `setOption('captions','track',{...})` |
| Current time / duration | from your polling loop, format with `mm:ss` / `h:mm:ss` helper |

Build the seek bar as two stacked divs: a "buffered" bar width = `bufferedFraction * 100%`, and a "played" bar width = `(currentTime/duration) * 100%`, both inside a clickable track that converts click-X-position → `seekTo()`.

---

## 9. Phase 7 — Quality menu (set expectations correctly)

If you want a quality selector, populate it from `player.getAvailableQualityLevels()`, but treat your `setPlaybackQuality(level)` call as a *hint*, not a guarantee — YouTube's adaptive bitrate algorithm has final say and may override it based on network conditions. Label the UI accordingly (e.g. "Preferred quality" rather than "Force quality"), or skip a manual quality menu entirely — many platforms have dropped it for exactly this reason.

---

## 10. Phase 8 — Fullscreen on the *wrapper*, not the iframe

Since `fs: 0` removed YouTube's native fullscreen button, build your own using the standard Fullscreen API on the **wrapper div** (so your custom controls stay rendered and on top in fullscreen too — fullscreening the iframe itself would only fullscreen YouTube's bare video with nothing of yours overlaid):

```js
function toggleFullscreen(wrapperEl) {
  if (!document.fullscreenElement) {
    wrapperEl.requestFullscreen?.() ?? wrapperEl.webkitRequestFullscreen?.();
  } else {
    document.exitFullscreen?.() ?? document.webkitExitFullscreen?.();
  }
}
```

Listen for `fullscreenchange` to update your fullscreen icon state. On iOS Safari, `playsinline: 1` is essential — without it, pressing play takes over the native fullscreen video player and your custom overlay disappears entirely.

---

## 11. Phase 9 — Keyboard shortcuts

`disablekb: 1` removed YouTube's own keyboard handling, so implement your own on the wrapper (only when it / its overlay has focus, to avoid hijacking page-wide shortcuts):

- `Space` / `K` → play/pause
- `←` / `→` → seek -5s / +5s
- `↑` / `↓` → volume +5 / -5
- `F` → fullscreen toggle
- `M` → mute toggle
- `0-9` → seek to 0%-90% of duration (standard YouTube convention students already expect)

---

## 12. Phase 10 — Mobile/touch specifics

- `playsinline: 1` (already set above) is mandatory for iOS.
- Tap zones on the overlay for double-tap seek (left/middle/right thirds), as in Phase 4.
- Show controls on tap, auto-hide after ~3s of inactivity during playback (use a debounced timer reset on any touch/mouse move).
- Test on an actual low-end Android device — BUFFERING state will trigger far more often on slow connections; your spinner needs to look intentional, not broken.

---

## 13. Phase 11 — End-of-video card (replaces YouTube's related-video grid)

On `ENDED` state, render a fully opaque div covering the entire player — your own "Up next" / "Replay" / "Mark as complete" UI. This is also what prevents the native YouTube end screen (suggested videos, channel link) from ever being visible, since your card sits above it in z-index and is opaque, not just transparent like the click-catcher.

```jsx
{playerState === 'ENDED' && (
  <div className="end-card">
    <button onClick={() => player.seekTo(0) || player.playVideo()}>Replay</button>
    <button onClick={goToNextLecture}>Next Lecture →</button>
  </div>
)}
```

---

## 14. Phase 12 — Anti-leak layer (be realistic about what this buys you)

None of this makes the video un-downloadable — a sufficiently motivated person can always screen-record any video that plays in a browser. These are deterrents that raise the effort bar and add traceability, which is what actual ed-tech platforms rely on:

- **Auth-gated ID delivery** (Phase 1) — video ID is never in page source for a non-enrolled visitor.
- **Visible watermark** — render the logged-in student's email/ID as a semi-transparent, slowly-moving text overlay on top of the video (CSS `animation` drifting it around every 20-30s so it can't be easily cropped out of a screen recording). If a recording leaks, you can trace it to the account.
- **Right-click disabled** (Phase 4) — stops casual "Save video as" / "Copy video URL" attempts; doesn't stop anyone using DevTools.
- **Rate-limit the playback endpoint** — flag accounts hitting `/api/lectures/:id/playback` at suspicious volume (e.g. scraping every lecture ID in a course in seconds).
- Don't oversell this internally as "DRM" — it isn't. If true DRM (encrypted streams, license servers) is a hard requirement, that's a different, much heavier architecture (e.g. Widevine/FairPlay via a paid video platform like Mux, Cloudflare Stream, or VdoCipher) and not something YouTube embedding can provide.

---

## 15. Phase 13 — Error handling

Handle `onError` (`event.data`):

| Code | Meaning | UI |
|---|---|---|
| 2 | Invalid video ID | "This lecture is temporarily unavailable" + log for ops |
| 5 | HTML5 player error | Retry once, then show fallback message |
| 100 | Video not found/removed | Same as above, flag the lectureId for content team |
| 101 / 150 | Embedding disallowed by uploader/owner for this video | Check "Allow embedding" is on for that specific video in Studio |

Also handle: the IFrame API script failing to load (ad blockers, school/corporate network firewalls blocking `youtube.com` domains) — show a clear "Your network may be blocking video playback" message rather than a silent blank box, since this is common on restrictive school/college wifi.

---

## 16. Testing checklist before shipping

- [ ] No YouTube logo, title, "Watch on YouTube," or share button visible in any player state
- [ ] Right-click anywhere on the player shows no context menu
- [ ] Pause mid-video, refresh devtools-disabled awareness check: a non-technical student sees nothing YouTube-branded
- [ ] Seek bar accurately reflects buffered + played position while polling
- [ ] Fullscreen (desktop + iOS Safari + Android Chrome) shows your controls, not YouTube's
- [ ] Speed change, volume change, mute all reflect immediately in custom UI
- [ ] Video end shows your end-card, not YouTube's related videos
- [ ] Keyboard shortcuts work without scrolling the page or triggering browser defaults
- [ ] Slow 3G throttle (Chrome DevTools network throttling) — buffering spinner looks intentional
- [ ] Logged-out / unenrolled user cannot retrieve a video ID from any network request
- [ ] Test against an ad-blocker (uBlock Origin) — confirm the IFrame API script and embed still load (some blocklists do hit youtube embeds; you may need to instruct users to allow your domain)

---

## 17. Suggested file structure (adapt names to your stack)

```
src/
  lib/
    youtubeApiLoader.js
  components/
    LecturePlayer/
      LecturePlayer.jsx          // wrapper, owns player instance + state machine
      ClickCatcherOverlay.jsx
      ControlBar.jsx
      SeekBar.jsx
      SettingsMenu.jsx           // speed, captions
      EndCard.jsx
      BufferingSpinner.jsx
      Watermark.jsx
      useYouTubePlayer.js        // hook: init, state polling, cleanup
      LecturePlayer.module.css
server/
  routes/
    lectures.js                  // GET /api/lectures/:id/playback (auth + enrollment check)
```

Build and test phases 1-7 first (you'll have a working, chrome-free, controllable player at that point) — phases 8-16 are polish and hardening on top of that working core.