const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// Personal orders for any logged-in account
router.post('/checkout', auth, orderController.checkout);
router.get('/my-orders', auth, orderController.getUserOrders);

// Store orders
router.get('/store/:storeId/orders', auth, authorize('store', 'admin'), orderController.getStoreOrders);

// Driver operations
router.get('/available', auth, authorize('driver'), orderController.getAvailableOrders);
router.get('/driver/active', auth, authorize('driver'), orderController.getDriverOrders);
router.post('/:orderId/accept', auth, authorize('driver'), orderController.acceptOrder);

// Update order status
router.put('/:orderId/status', auth, orderController.updateStatus);

// Analytics
router.get('/analytics/daily-revenue', auth, authorize('store', 'admin'), orderController.getDailyRevenue);

// Generic order lookup — phải đứng SAU tất cả route cụ thể
router.get('/:orderId', auth, orderController.getOrder);

module.exports = router;
