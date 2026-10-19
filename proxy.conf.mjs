/**
 * Dev server only: mirrors the Caddy setup on the server, where velo and dash are served under
 * /velo and /dash on the same host as mission control. Requests stay same-origin, so the
 * backends need no CORS configuration. Point the targets at the running backends.
 */
const target = (name, fallback) => process.env[name]?.trim() || fallback;

export default {
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
};
