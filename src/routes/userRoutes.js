const express = require('express');
const router = express.Router();
const { upload, uploadVideo, uploadProfileImage } = require('../Helper/multerConfig');

const userController = require('../controllers/UserController');
const ProductController = require('../controllers/ProductController');
const CategoryController = require('../controllers/CategoryController');
const StatusController = require('../controllers/StatusController');
const notificationController = require('../controllers/NotificationController');
const VideoController = require('../controllers/VideoController');
const {sendOtpHandler} = require('../controllers/otpController');
const CouponController = require('../controllers/CouponController');
const apiKeyMiddleware = require('../Helper/apiKeyMiddleware');

// Apply API Key validation middleware globally for all routes in this router
router.use(apiKeyMiddleware);

//user routes
router.get('/user/index', userController.index);
router.post('/register', uploadProfileImage.single('profileImage'), userController.store);
router.post('/verify-otp', userController.verifyOtp);
router.get('/profile/:id', userController.getProfile);
router.get('/profile/:id/edit', userController.edit);
router.put('/profile/:id/update', uploadProfileImage.single('profileImage'), userController.update);
router.delete('/profile/:id/delete', userController.delete);
router.post('/admin/login', userController.adminLogin);
router.post('/send-otp', sendOtpHandler);
//product routes
router.get('/products', ProductController.index);
router.post('/products/store', upload.array('images', 10), ProductController.store);
router.get('/products/:id/edit', ProductController.edit);
router.put('/products/:id/update', upload.array('images', 10), ProductController.update);   
router.delete('/products/:id/delete-image', ProductController.deleteImage);
router.delete('/products/:id/delete', ProductController.delete);
// GET all products by category ID
router.get('/products/category/:categoryId', ProductController.listBycategoryId);
// GET all products by user ID
router.get('/products/user/:userId', ProductController.listByuserId);
// Search for products
router.get('/products/search', ProductController.searchProduct);
// produts details
router.get('/products/details/:id', ProductController.produtsDetails);

//Category routes
router.get('/categories', CategoryController.index);
router.post('/categories/store', CategoryController.store);
router.get('/categories/:id/edit', CategoryController.edit);
router.put('/categories/:id/update', CategoryController.update);
router.delete('/categories/:id/delete', CategoryController.delete);


//status routes
router.post('/status/store', upload.single('media'), StatusController.store);
router.get('/status', StatusController.index);
router.delete('/status/:id', StatusController.deleteStatus);

//Notification routes
router.post('/products/:productId/view', notificationController.viewProduct);
router.get('/products/:productId/viewers', notificationController.getProductViewers);
router.get('/notifications', notificationController.getNotifications);

// Product image upload route
router.post('/products/upload-image', upload.single('image'), ProductController.uploadProductImage);

// Video Upload routes
router.post('/upload-video', uploadVideo.single('video'), VideoController.upload);
router.get('/videos', VideoController.index);

// Coupon routes
router.post('/coupons/store', CouponController.store);
router.get('/coupons', CouponController.index);
router.get('/coupons/active', CouponController.activeCoupons);
router.post('/coupons/validate', CouponController.validateCoupon);
router.put('/coupons/:id/update', CouponController.update);
router.put('/coupons/:id/toggle', CouponController.toggleStatus);
router.delete('/coupons/:id/delete', CouponController.delete);

module.exports = router;