/**
 * setupProxy.js - CRA dev server middleware
 * Fix Cross-Origin-Opener-Policy để Google OAuth popup hoạt động đúng
 */
module.exports = function (app) {
  // Thêm header COOP = unsafe-none để Google OAuth popup có thể giao tiếp với trang chính
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    next();
  });
};
