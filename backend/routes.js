const router = require('express').Router();
const authController = require('./controllers/auth-controller');
const activateController = require('./controllers/activate-controller');
const authMiddleware = require('./middlewares/auth-middleware');
const roomsController = require('./controllers/rooms-controller');

router.post('/api/send-otp', authController.sendOtp);
router.post('/api/verify-otp', authController.verifyOtp);
router.post('/api/activate', authMiddleware, activateController.activate);
router.get('/api/refresh', authController.refresh);
router.post('/api/logout', authMiddleware, authController.logout);
router.post('/api/rooms', authMiddleware, roomsController.create);
router.get('/api/rooms', authMiddleware, roomsController.index);
router.get('/api/rooms/:roomId', authMiddleware, roomsController.show);
router.delete('/api/rooms/:roomId', authMiddleware, roomsController.destroy);
router.post('/api/rooms/:roomId/verify', authMiddleware, roomsController.verifyPassword);

// User routes
const userController = require('./controllers/user-controller');
router.post('/api/user/avatar', authMiddleware, userController.updateAvatar);
router.put('/api/user/preference', authMiddleware, userController.updateThemePreference);
router.put('/api/user/profile', authMiddleware, userController.updateProfile);
router.get('/api/user/:userId/profile', userController.getProfile);
// Follow routes
const followController = require('./controllers/follow-controller');
router.get('/api/follow/mutual', authMiddleware, followController.getMutualFollowers);
router.post('/api/follow/:userId', authMiddleware, followController.followUser);
router.delete('/api/follow/:userId', authMiddleware, followController.unfollowUser);
router.get('/api/follow/:userId/status', authMiddleware, followController.getFollowStatus);
router.get('/api/follow/:userId/followers', authMiddleware, followController.getFollowers);
router.get('/api/follow/:userId/following', authMiddleware, followController.getFollowing);

module.exports = router;