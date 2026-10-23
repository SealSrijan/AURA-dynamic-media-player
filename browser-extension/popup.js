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
      const artSrc = res.media.artwork || 'icons/icon48.png';
      container.className = 'media-card';
      container.innerHTML = `
        <img src="${artSrc}" class="artwork" onerror="this.style.display='none'">
        <div class="info">
          <div class="track-title">${escapeHtml(res.media.title)}</div>
          <div class="track-artist">${escapeHtml(res.media.artist || res.media.source)}</div>
        </div>
      `;
    }
  });

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
