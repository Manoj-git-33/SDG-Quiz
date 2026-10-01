/**
 * =====================================================================
 * 🌐 SDG QUIZ - REALTIME MULTIPLAYER ENVIRONMENT CONFIGURATION
 * =====================================================================
 * Supports:
 *  - Local Wi-Fi Development (e.g. http://10.94.5.213:3001 or localhost:3001)
 *  - Production Frontend Deployments (Netlify, Vercel, Cloudflare, etc.)
 *  - Dedicated Realtime Backend (Node.js + Socket.IO on Render, Railway, Fly.io, VPS)
 * =====================================================================
 */

window.QUIZ_CONFIG = {
  /**
   * PRODUCTION REALTIME SERVER URL
   * Set this to your deployed Node.js backend domain when hosting frontend on Netlify/Vercel.
   * Example: "https://your-sdg-quiz-backend.onrender.com"
   * Leave empty ("") for automatic local network / same-origin detection.
   */
  BACKEND_URL: ""
};

/**
 * Dynamically resolves the Socket.IO server connection URL:
 * 1. Checks URL query param: ?server=https://your-backend.com (allows instant remote testing)
 * 2. Checks window.QUIZ_CONFIG.BACKEND_URL or process-like env injection
 * 3. Auto-detects local LAN / Wi-Fi IP or localhost (e.g. 10.x.x.x, 192.168.x.x, 172.x.x.x)
 * 4. Falls back to window.location.origin for same-origin server deployments
 */
window.getQuizSocketUrl = function() {
  // 1. Query parameter override (e.g. /player.html?server=https://my-backend.railway.app)
  try {
    const params = new URLSearchParams(window.location.search);
    const serverParam = params.get('server');
    if (serverParam && serverParam.trim() !== '') {
      return serverParam.trim().replace(/\/$/, '');
    }
  } catch (e) {}

  // 2. Pre-configured Production Backend URL
  if (window.QUIZ_CONFIG && typeof window.QUIZ_CONFIG.BACKEND_URL === 'string' && window.QUIZ_CONFIG.BACKEND_URL.trim() !== '') {
    return window.QUIZ_CONFIG.BACKEND_URL.trim().replace(/\/$/, '');
  }

  // 3. Localhost or Local Wi-Fi network detection
  const host = window.location.hostname;
  const isLocalNetwork = host === 'localhost' ||
                         host === '127.0.0.1' ||
                         host.startsWith('10.') ||
                         host.startsWith('192.168.') ||
                         (host.startsWith('172.') && (function() {
                           const part = parseInt(host.split('.')[1], 10);
                           return part >= 16 && part <= 31;
                         })());

  if (isLocalNetwork) {
    const port = window.location.port ? `:${window.location.port}` : ':3001';
    return `${window.location.protocol}//${host}${port}`;
  }

  // 4. Default same-origin fallback
  return window.location.origin;
};
