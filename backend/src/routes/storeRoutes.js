const express = require('express');
const storeController = require('../controllers/storeController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../config/multer');

const router = express.Router();

// ===== Public routes =====
router.get('/nearby', storeController.getNearbyStores);

// ===== Food routes (phải đặt TRƯỚC /:storeId để tránh conflict) =====
router.put('/foods/:foodId', auth, upload.single('image'), storeController.updateFoodItem);
router.patch('/foods/:foodId/availability', auth, storeController.toggleFoodAvailability);
router.delete('/foods/:foodId', auth, storeController.deleteItem);

// ===== Store routes =====
router.get('/:storeId', storeController.getDetails);
router.post('/', auth, authorize('store', 'admin'), upload.single('image'), storeController.create);
router.put('/:storeId', auth, upload.single('image'), storeController.update);

// ===== Category & Food management (scoped by store) =====
router.post('/:storeId/categories', auth, upload.single('image'), storeController.addCategory);
router.post('/:storeId/foods', auth, upload.single('image'), storeController.addFood);

module.exports = router;
