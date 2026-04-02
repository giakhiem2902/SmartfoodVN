const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_FOLDER || './uploads';

// Tạo các subfolder nếu chưa có
['stores', 'foods', 'categories'].forEach((sub) => {
  const dir = path.join(uploadDir, sub);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

/**
 * Xác định subfolder dựa vào route URL:
 *  POST /api/stores/           → stores/
 *  PUT  /api/stores/:id        → stores/
 *  POST /api/stores/:id/foods  → foods/
 *  PUT  /api/foods/:id         → foods/
 *  POST /api/stores/:id/categories → categories/
 */
const getSubfolder = (req) => {
  const url = req.originalUrl || '';
  if (/\/foods/.test(url)) return 'foods';
  if (/\/categories/.test(url)) return 'categories';
  return 'stores';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = getSubfolder(req);
    const dest = path.join(uploadDir, subfolder);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  },
});

module.exports = upload;
