/**
 * Dev server only: mirrors the Caddy setup on the server, where velo and dash are served under
 * /velo and /dash on the same host as mission control. Requests stay same-origin, so the
 * backends need no CORS configuration. Point the targets at the running backends.
 * /missioncontrol/calendars holds the iCloud calendars synced on the server (docs/ICLOUD_CALENDAR.md).
 * /api is the mission control backend (backend/, start it with the `local` profile); the app resolves
 * it against <base href>, so on the server it is /missioncontrol/api.
 */
const target = (name, fallback) => process.env[name]?.trim() || fallback;

export default {
  '/api': {
    target: target('MC_API_TARGET', 'http://localhost:8082'),
    changeOrigin: true,
  },
  '/velo/api': {
    target: target('VELO_API_TARGET', 'http://localhost:8081'),
    changeOrigin: true,
    pathRewrite: { '^/velo': '' },
  },
  '/dash/api': {
    target: target('DASH_API_TARGET', 'http://localhost:8080'),
    changeOrigin: true,
    pathRewrite: { '^/dash': '' },
  },
  '/missioncontrol/calendars': {
    target: target('CALENDARS_TARGET', 'http://arrow.local'),
    changeOrigin: true,
  },
};
