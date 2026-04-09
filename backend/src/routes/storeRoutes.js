const express = require('express');
const storeController = require('../controllers/storeController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const upload = require('../config/multer');

const router = express.Router();

// ===== Public routes =====
router.get('/nearby', storeController.getNearbyStores);

// ===== Store registration / owner routes =====
router.post('/registrations', auth, upload.single('image'), storeController.submitRegistration);
router.get('/registrations/my', auth, storeController.getMyRegistration);
router.get('/registrations', auth, authorize('admin'), storeController.listRegistrations);
router.patch('/registrations/:registrationId/review', auth, authorize('admin'), storeController.reviewRegistration);
router.get('/my-store', auth, authorize('store', 'admin'), storeController.getMyStore);

// ===== Food routes (phải đặt TRƯỚC /:storeId để tránh conflict) =====
router.put('/foods/:foodId', auth, authorize('store', 'admin'), upload.single('image'), storeController.updateFoodItem);
router.patch('/foods/:foodId/availability', auth, authorize('store', 'admin'), storeController.toggleFoodAvailability);
router.delete('/foods/:foodId', auth, authorize('store', 'admin'), storeController.deleteItem);

// ===== Store sub-routes (PHẢI đặt TRƯỚC /:storeId) =====
router.get('/:storeId/foods', storeController.getFoodsByStore);
router.get('/:storeId/categories', storeController.getCategoriesByStore);
router.post('/:storeId/categories', auth, authorize('store', 'admin'), upload.single('image'), storeController.addCategory);
router.post('/:storeId/foods', auth, authorize('store', 'admin'), upload.single('image'), storeController.addFood);

// ===== Store detail routes =====
router.get('/:storeId', storeController.getDetails);
router.post('/', auth, authorize('store', 'admin'), upload.single('image'), storeController.create);
router.put('/:storeId', auth, upload.single('image'), storeController.update);

module.exports = router;
