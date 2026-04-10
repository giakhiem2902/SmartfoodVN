/**
 * setupProxy.js - CRA dev server middleware
 * Fix Cross-Origin-Opener-Policy để Google OAuth popup hoạt động đúng
 * Proxy API calls to backend
 */
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
  // Proxy /api requests to backend server
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api',
      },
    })
  );

  // Thêm header COOP = unsafe-none để Google OAuth popup có thể giao tiếp với trang chính
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });
};
