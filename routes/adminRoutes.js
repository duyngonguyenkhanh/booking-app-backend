const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// Route để thêm user mới
router.post('/users', adminController.createUser);//router tạo tài khoản Admin
router.post('/login', adminController.loginAdminUser);//router đăng nhập admin
router.post('/alluser', adminController.getAllNonAdminUsers);//router đăng nhập admin
router.post('/transactions', adminController.getTransactionsByAdimUserId);
router.post('/hotels', adminController.getHotels);
router.post('/hotel/delete', adminController.deleteHotel);
router.post('/hotel/add', adminController.addHotel);
router.post('/hotel/update', adminController.updateHotel);
router.post('/room', adminController.getRooms);
router.post('/room/add', adminController.addRoom);
router.post('/room/delete', adminController.deleteRoom);
router.post('/room/update', adminController.updateRoom);

module.exports = router;
