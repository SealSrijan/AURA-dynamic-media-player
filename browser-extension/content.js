// AURA Companion — Content Script
// Captures media state and handles playback control

(function () {
  let activeMediaElement = null;
  let lastReportedState = null;
  let throttleTimer = null;

  function findActiveMediaElement() {
    const videos = Array.from(document.querySelectorAll('video'));
    const audios = Array.from(document.querySelectorAll('audio'));
    const all = [...videos, ...audios];

    // Priority to currently playing element
    const playing = all.find((el) => !el.paused && !el.ended && el.readyState > 2);
    if (playing) return playing;

    // Otherwise return element with duration
    const withDuration = all.find((el) => el.duration > 0);
    return withDuration || all[0] || null;
  }

  function getBestArtwork() {
    if (navigator.mediaSession && navigator.mediaSession.metadata && navigator.mediaSession.metadata.artwork) {
      const artworks = navigator.mediaSession.metadata.artwork;
      if (artworks.length > 0) {
        return artworks[artworks.length - 1].src;
      }
    }

    // Fallback for YouTube
    if (location.hostname.includes('youtube.com')) {
      const urlParams = new URLSearchParams(window.location.search);
      const v = urlParams.get('v');
      if (v) return `https://img.youtube.com/vi/${v}/hqdefault.jpg`;
    }

    // Fallback meta image
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) return ogImage.content;

    return '';
  }

  function extractMetadata() {
    let title = '';
    let artist = '';
    let album = '';
    let artwork = getBestArtwork();

    if (navigator.mediaSession && navigator.mediaSession.metadata) {
      title = navigator.mediaSession.metadata.title || '';
      artist = navigator.mediaSession.metadata.artist || '';
      album = navigator.mediaSession.metadata.album || '';
    }

    // YouTube specific scraping fallback
    if (!title && location.hostname.includes('youtube.com')) {
      const titleEl = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1 yt-formatted-string');
      if (titleEl) title = titleEl.textContent.trim();
      const channelEl = document.querySelector('#owner-name a, ytd-channel-name yt-formatted-string a');
      if (channelEl) artist = channelEl.textContent.trim();
    }

    // Spotify Web fallback
    if (location.hostname.includes('spotify.com')) {
      const trackEl = document.querySelector('[data-testid="now-playing-widget"] [data-testid="context-item-link"]');
      if (trackEl) title = trackEl.textContent.trim();
      const artistEl = document.querySelector('[data-testid="now-playing-widget"] [data-testid="track-info-artists"]');
      if (artistEl) artist = artistEl.textContent.trim();
    }

    // Generic document title fallback
    if (!title) {
      title = document.title.replace(/ - YouTube$/, '').replace(/ - Spotify$/, '').trim();
    }

    return { title, artist, album, artwork };
  }

  function sendMediaUpdate() {
    const el = findActiveMediaElement();
    if (!el && !navigator.mediaSession?.metadata) return;

    activeMediaElement = el;
    const meta = extractMetadata();

    const isPlaying = el ? !el.paused && !el.ended : false;
    const currentTime = el ? Math.floor(el.currentTime) : 0;
    const duration = el && isFinite(el.duration) ? Math.floor(el.duration) : 0;

    const state = {
      title: meta.title,
      artist: meta.artist,
      album: meta.album,
      artwork: meta.artwork,
      playing: isPlaying,
      currentTime: currentTime,
      duration: duration,
      source: location.hostname.replace('www.', ''),
      url: location.href,
    };

    // Avoid duplicate emissions if unchanged
    if (
      lastReportedState &&
      lastReportedState.title === state.title &&
      lastReportedState.artist === state.artist &&
      lastReportedState.playing === state.playing &&
      Math.abs(lastReportedState.currentTime - state.currentTime) < 2
    ) {
      return;
    }

    lastReportedState = state;
    try {
      chrome.runtime.sendMessage({ type: 'MEDIA_STATE_UPDATE', payload: state });
    } catch {
      // Extension context invalidated
    }
  }

  function attachMediaListeners() {
    const el = findActiveMediaElement();
    if (el && el !== activeMediaElement) {
      activeMediaElement = el;
      el.addEventListener('play', () => sendMediaUpdate());
      el.addEventListener('pause', () => sendMediaUpdate());
      el.addEventListener('timeupdate', () => {
        if (!throttleTimer) {
          throttleTimer = setTimeout(() => {
            sendMediaUpdate();
            throttleTimer = null;
          }, 1000);
        }
      });
      el.addEventListener('ended', () => sendMediaUpdate());
    }
  }

  // Periodic scan for dynamic SPA page changes
  setInterval(() => {
    attachMediaListeners();
    sendMediaUpdate();
  }, 2000);

  // Listen for playback control commands from background
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === 'EXECUTE_COMMAND') {
      const cmd = message.command;
      const el = findActiveMediaElement();

      if (cmd === 'toggle') {
        if (el) {
          if (el.paused) el.play();
          else el.pause();
        }
      } else if (cmd === 'play') {
        if (el) el.play();
      } else if (cmd === 'pause') {
        if (el) el.pause();
      } else if (cmd === 'next') {
        // Try MediaSession action handler
        if (navigator.mediaSession) {
          const evt = new CustomEvent('nexttrack');
          window.dispatchEvent(evt);
        }
        // YouTube next button fallback
        const nextBtn = document.querySelector('.ytp-next-button');
        if (nextBtn) nextBtn.click();
      } else if (cmd === 'previous') {
        if (navigator.mediaSession) {
          const evt = new CustomEvent('previoustrack');
          window.dispatchEvent(evt);
        }
        const prevBtn = document.querySelector('.ytp-prev-button');
        if (prevBtn) prevBtn.click();
      } else if (cmd === 'seek' && typeof message.value === 'number') {
        if (el) el.currentTime = message.value;
      }

      setTimeout(sendMediaUpdate, 150);
      sendResponse({ success: true });
    }
  });

  attachMediaListeners();
})();
