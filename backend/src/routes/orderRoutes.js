const express = require('express');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// User orders
router.post('/checkout', auth, authorize('user'), orderController.checkout);
router.get('/my-orders', auth, authorize('user'), orderController.getUserOrders);
router.get('/:orderId', auth, orderController.getOrder);

// Store orders
router.get('/store/:storeId/orders', auth, authorize('store'), orderController.getStoreOrders);

// Driver operations
router.get('/available', auth, authorize('driver'), orderController.getAvailableOrders);
router.post('/:orderId/accept', auth, authorize('driver'), orderController.acceptOrder);
router.get('/driver/active', auth, authorize('driver'), orderController.getDriverOrders);

// Update order status
router.put('/:orderId/status', auth, orderController.updateStatus);

// Analytics
router.get('/analytics/daily-revenue', auth, authorize('store', 'admin'), orderController.getDailyRevenue);

module.exports = router;
