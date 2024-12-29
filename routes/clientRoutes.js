const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const hotelController = require('../controllers/hotelController')
const transactionController = require('../controllers/transactionController')
// Các route của Client
router.get('/hotels', clientController.getHotels);
router.get('/rooms/:hotelId', clientController.getRooms);
router.post('/bookings', clientController.createBooking);
// Route để thêm user mới
router.post('/users', clientController.createUser);
//Router đăng nhập 1 user
router.post('/login', clientController.loginUser);
//router tìm khách sạn
router.get("/hotels/search", hotelController.searchHotels);
//router lấy thông tin phòng
router.get("/hotel/:hotelId", hotelController.getHotelById);

router.post("/rooms/available", hotelController.getAvailableRooms);
//router tạo 1 giao dịch
router.post("/transactions", clientController.createTransaction);
//router nhận all giao dịch của 1 userId cụ thể
router.get("/transactions/by-user", transactionController.getTransactionsByUserId);

module.exports = router;


  