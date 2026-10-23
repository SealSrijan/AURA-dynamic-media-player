document.addEventListener('DOMContentLoaded', () => {
  const badge = document.getElementById('statusBadge');
  const container = document.getElementById('mediaContainer');

  chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (res) => {
    if (!res) {
      badge.textContent = 'Offline';
      badge.className = 'badge disconnected';
      return;
    }

    if (res.connected) {
      badge.textContent = 'Linked to App';
      badge.className = 'badge connected';
    } else {
      badge.textContent = 'Connecting...';
      badge.className = 'badge disconnected';
    }

    if (res.media && res.media.title) {
      container.className = 'media-card';
      container.textContent = ''; // clear previous

      const img = document.createElement('img');
      img.className = 'artwork';
      const artSrc = res.media.artwork || 'icons/icon48.png';
      if (/^(https?:\/\/|data:image\/|icons\/)/i.test(artSrc)) {
        img.src = artSrc;
      } else {
        img.src = 'icons/icon48.png';
      }
      img.onerror = () => { img.style.display = 'none'; };

      const infoDiv = document.createElement('div');
      infoDiv.className = 'info';

      const titleDiv = document.createElement('div');
      titleDiv.className = 'track-title';
      titleDiv.textContent = res.media.title;

      const artistDiv = document.createElement('div');
      artistDiv.className = 'track-artist';
      artistDiv.textContent = res.media.artist || res.media.source || '';

      infoDiv.appendChild(titleDiv);
      infoDiv.appendChild(artistDiv);

      container.appendChild(img);
      container.appendChild(infoDiv);
    }
  });
});
