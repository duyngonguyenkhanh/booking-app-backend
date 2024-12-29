const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Để mã hóa và so sánh mật khẩu
// Secret key để mã hóa JWT (bạn nên lưu trữ key này trong biến môi trường)
const JWT_SECRET = "your_secret_key";

const Hotel = require("../models/hotel");
const Room = require("../models/Room");
const Transaction = require("../models/transaction");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find();
    res.json(hotels);
  } catch (err) {
    res.status(500).json({ error: "Error retrieving hotels" });
  }
};

exports.getRooms = async (req, res) => {
  const { hotelId } = req.params;
  try {
    const hotel = await Hotel.findById(hotelId).populate("rooms");
    res.json(hotel.rooms);
  } catch (err) {
    res.status(500).json({ error: "Error retrieving rooms" });
  }
};

exports.createBooking = async (req, res) => {
  const { userid, username, hotel, rooms, dateStart, dateEnd, payment, status } =
    req.body;

  // Kiểm tra và chuyển đổi id thành ObjectId hợp lệ
  const formattedRooms = rooms.map((room) => {
    if (!room.id || !mongoose.Types.ObjectId.isValid(room.id)) {
      return res.status(400).json({ error: "Invalid room ID" });
    }
    return {
      id:new mongoose.Types.ObjectId(room.id), // Chuyển đổi `id` thành ObjectId
      roomNumber: room.roomNumber, // Đảm bảo tên thuộc tính khớp với schema
      price: room.price,
    };
  });

  const newTransaction = new Transaction({
    userid,
    username,
    hotel,
    rooms: formattedRooms,
    dateStart,
    dateEnd,
    payment,
    status,
  });

  try {
    await newTransaction.save();
    res.status(201).json(newTransaction);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error creating booking" });
  }
};

// Controller để thêm user mới và kiểm tra email
exports.createUser = async (req, res) => {
  const { username, password, fullName, phoneNumber, email, isAdmin } =
    req.body;
  console.log(
    `username: ${username}, password: ${password}, fullName: ${fullName}, email: ${email}, isAdmin: ${isAdmin}`
  );

  console.log(`user : ${username} đã được thêm vào mảng user`);

  try {
    // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu hay chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    //Mã hóa mật khẩu
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword);

    // Tạo một instance mới của User model
    const newUser = new User({
      username,
      password: hashedPassword,
      fullName,
      phoneNumber,
      email,
      isAdmin,
    });

    // Lưu user mới vào cơ sở dữ liệu
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    // Xử lý lỗi và trả về phản hồi cho client
    console.error("Error creating user:", err); // Thêm logging chi tiết lỗi

    res.status(500).json({ error: "Error creating user" });
  }
};
// Chức năng đăng nhập
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tìm user trong cơ sở dữ liệu bằng email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // So sánh mật khẩu đã mã hóa
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    console.log(user);

    // Log thông tin người dùng vừa đăng nhập
    console.log(`User logged in: ${user.email}, ID: ${user._id}`);

    // Tạo JWT cho người dùng
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        isAdmin: user.isAdmin,
        name: user.fullName,
      },
      JWT_SECRET,
      { expiresIn: "1h" } // Thời gian hết hạn của token
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Error logging in" });
  }
};

// Tạo một giao dịch mới
// Tạo một giao dịch mới
exports.createTransaction = async (req, res) => {
  try {
    const {
      userid,
      username,
      hotel,
      rooms,
      dateStart,
      dateEnd,
      payment,
      status,
    } = req.body;

    // Tính tổng giá dựa trên giá phòng và số lượng đêm
    const numberOfNights = Math.ceil(
      (new Date(dateEnd) - new Date(dateStart)) / (1000 * 60 * 60 * 24)
    );
    const transactionRooms = rooms.map((room) => ({
      id: room.id,// lưu 
      roomNumber: room.number, // Lưu danh sách số phòng
      price: room.price, // Lưu giá cho mỗi phòng
    }));

    const totalPrice = transactionRooms.reduce(
      (sum, room) => sum + room.price * numberOfNights,
      0
    );

    const newTransaction = new Transaction({
      userid,
      username,
      hotel,
      rooms: transactionRooms,
      dateStart,
      dateEnd,
      payment,
      status,
      price: totalPrice,
    });

    await newTransaction.save();

    // Cập nhật thời gian không khả dụng cho từng số phòng
    for (const room of rooms) {
      const { id, number } = room;

      // Cập nhật ngày không khả dụng cho từng số phòng
      await Room.updateOne(
        { _id: id, "roomNumbers.number": number },
        {
          $set: {
            "roomNumbers.$.unavailableDates.0": {
              start: dateStart,
              end: dateEnd,
            },
          },
        }
      );
    }
    console.log(`create Transaction`);

    res.status(201).json(newTransaction);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
