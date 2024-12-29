const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // Để mã hóa và so sánh mật khẩu
// Secret key để mã hóa JWT (bạn nên lưu trữ key này trong biến môi trường)
const JWT_SECRET = "your_secret_key";
const User = require("../models/User");
const Hotel = require("../models/hotel");
const Room = require("../models/Room");
const Transaction = require("../models/transaction");
const mongoose = require("mongoose");

// Controller để thêm adminuser mới và kiểm tra email urlhttp://localhost:5000/api/admin/users
// {
//   "username": "adminuser",
//   "password": "securepassword",
//   "fullName": "Admin User",
//   "phoneNumber": "0123456789",
//   "email": "admin@example.com",
//   "isAdmin": true
// }

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

//Chức năng đăng nhập url: http://localhost:5000/api/admin/login
exports.loginAdminUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Tìm user trong cơ sở dữ liệu bằng email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Kiểm tra xem người dùng có phải admin không
    if (!user.isAdmin) {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // So sánh mật khẩu đã mã hóa
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Log thông tin người dùng vừa đăng nhập
    console.log(`Admin logged in: ${user.email}, ID: ${user._id}`);

    // Tạo JWT cho người dùng
    const token = jwt.sign(
      {
        userId: user._id,
      },
      JWT_SECRET,
      { expiresIn: "1h" } // Thời gian hết hạn của token
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: "Error logging in" });
  }
};

// API lấy tất cả các user không phải admin trong tài liệu User
exports.getAllNonAdminUsers = async (req, res) => {
  try {
    const { userId } = req.body;

    // Kiểm tra userId có tồn tại trong request không
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);

    // Nếu không tìm thấy user hoặc user không phải admin
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admin can view users." });
    }

    // Nếu là admin, tìm tất cả các user trong cơ sở dữ liệu và lọc những user không phải admin
    const nonAdminUsers = await User.find({ isAdmin: false });

    // Trả về danh sách tất cả các user không phải admin
    res.status(200).json(nonAdminUsers);
  } catch (err) {
    console.error("Error retrieving users:", err);
    res.status(500).json({ message: "Error retrieving users" });
  }
};

//APi nhận tất cả giao dịch POST http://localhost:5000/api/admin/transactions, body: {"userId": "66d9ab8b4f589a6b399a4066"}
exports.getTransactionsByAdimUserId = async (req, res) => {
  try {
    const { userId } = req.body;

    // Kiểm tra userId có tồn tại trong request hay không
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra nếu user là admin, trả về tất cả giao dịch
    if (user.isAdmin) {
      const allTransactions = await Transaction.find();
      return res.status(200).json(allTransactions);
    }

    // Nếu không phải admin, chỉ trả về giao dịch của chính user đó
    const userTransactions = await Transaction.find({ user: userId });

    // Kiểm tra xem user có giao dịch nào không
    if (userTransactions.length === 0) {
      return res
        .status(404)
        .json({ message: "No transactions found for this user." });
    }

    res.status(200).json(userTransactions);
  } catch (error) {
    console.error("Error fetching transactions:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

//API nhận thông tin tất cả khách sạn đang có
exports.getHotels = async (req, res) => {
  try {
    const { userId } = req.body;
    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isAdmin) {
      const hotels = await Hotel.find();
      res.json(hotels);
    }
  } catch (err) {
    res.status(500).json({ error: "Error retrieving hotels" });
  }
};

// API để xóa một khách sạn dựa trên hotelId
exports.deleteHotel = async (req, res) => {
  try {
    const { userId, hotelId } = req.body;

    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra nếu user là admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admin can delete hotels." });
    }

    // Kiểm tra xem hotelId có tồn tại trong Transaction không
    const existingTransactions = await Transaction.find({ hotel: hotelId });
    if (existingTransactions.length > 0) {
      return res.status(400).json({ message: "Hotel cannot be deleted as it has existing transactions." });
    }

    // Tìm và xóa khách sạn dựa trên hotelId
    const deletedHotel = await Hotel.findByIdAndDelete(hotelId);
    if (!deletedHotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Trả về thông báo thành công
    res
      .status(200)
      .json({ message: "Hotel deleted successfully", hotel: deletedHotel });
  } catch (err) {
    console.error("Error deleting hotel:", err);
    res.status(500).json({ message: "Error deleting hotel" });
  }
};

// API để thêm một khách sạn mới
exports.addHotel = async (req, res) => {
  try {
    const { userId, hotelData } = req.body;

    // Kiểm tra userId có tồn tại trong request hay không
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Kiểm tra dữ liệu khách sạn có tồn tại trong request hay không
    if (!hotelData) {
      return res.status(400).json({ message: "Hotel data is required" });
    }

    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra nếu user là admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admin can add hotels." });
    }

    // Tạo một instance mới của Hotel model với dữ liệu khách sạn
    const newHotel = new Hotel({
      name: hotelData.name,
      type: hotelData.type,
      city: hotelData.city,
      address: hotelData.address,
      distance: hotelData.distance,
      photos: hotelData.photos,
      desc: hotelData.desc,
      title: hotelData.title,
      featured: hotelData.featured,
      rooms: Array.isArray(hotelData.rooms)
        ? hotelData.rooms.map((roomId) => new mongoose.Types.ObjectId(roomId))
        : [],
      cheapestPrice: hotelData.cheapestPrice, // Thêm trường cheapestPrice nếu cần
    });

    // Lưu khách sạn mới vào cơ sở dữ liệu
    await newHotel.save();

    // Trả về thông báo thành công và thông tin của khách sạn mới
    res
      .status(201)
      .json({ message: "Hotel added successfully", hotel: newHotel });
  } catch (err) {
    console.error("Error adding hotel:", err);
    res.status(500).json({ message: "Error adding hotel" });
  }
};

// {
//   "userId": "66d9ab8b4f589a6b399a4066",
//   "hotelData": {
//     "name": "Luxury Hotel",
//     "type": "Hotel",
//     "city": "Hanoi",
//     "address": "1234 Main St",
//     "distance": "5 km from center",
//     "photos": ["https://continentalsaigon.com/userfiles/room/superior/Superior%202.jpg"],
//     "desc": "A luxury hotel with all amenities.",
//     "rating": 4.5,
//     "featured": true,
//     "rooms": ["64f86b1234567890abcd4321"]
//   }
// }

//API nhận thông tin tất cả các room đang có
exports.getRooms = async (req, res) => {
  try {
    const { userId } = req.body;

    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const rooms = await Room.find();
    if (!rooms) {
      res.status(500).json({ error: "Error retrieving rooms" });
    }
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: "Error retrieving rooms" });
  }
};

// API để thêm một phòng mới
exports.addRoom = async (req, res) => {
  try {
    const { userId, roomData } = req.body;

    // Kiểm tra userId có tồn tại trong request hay không
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    // Kiểm tra dữ liệu phòng có tồn tại trong request hay không
    if (!roomData) {
      return res.status(400).json({ message: "Room data is required" });
    }

    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra nếu user là admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admin can add rooms." });
    }

    // Tạo một instance mới của Room model với dữ liệu phòng
    const newRoom = new Room(roomData);

    // Lưu phòng mới vào cơ sở dữ liệu
    await newRoom.save();

    // Trả về thông báo thành công và thông tin của phòng mới
    res.status(201).json({ message: "Room added successfully", room: newRoom });
  } catch (err) {
    console.error("Error adding room:", err);
    res.status(500).json({ message: "Error adding room" });
  }
};
exports.deleteRoom = async (req, res) => {
  try {
    const { userId, roomId } = req.body;

    // Kiểm tra userId và roomId có tồn tại trong request hay không
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!roomId) {
      return res.status(400).json({ message: "roomId is required" });
    }

    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra nếu user là admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admin can delete rooms." });
    }

    // Kiểm tra xem roomId có tồn tại trong bất kỳ giao dịch nào không
    const transaction = await Transaction.findOne({
      "rooms.id": roomId
    });

    if (transaction) {
      return res.status(400).json({ message: "Room cannot be deleted as it is referenced in an existing transaction." });
    }

    // Xóa phòng theo ID
    const result = await Room.findByIdAndDelete(roomId);

    // Kiểm tra xem phòng có tồn tại không
    if (!result) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Trả về thông báo thành công
    res.status(200).json({ message: "Room deleted successfully" });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ message: "Error deleting room" });
  }
};


// API để chỉnh sửa thông tin của một khách sạn
exports.updateHotel = async (req, res) => {
  try {
    const { userId, hotelId, updateData } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!hotelId) {
      return res.status(400).json({ message: "hotelId is required" });
    }
    if (!updateData) {
      return res.status(400).json({ message: "Update data is required" });
    }

    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra nếu user là admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admin can update hotels." });
    }

    // Cập nhật thông tin khách sạn
    const updatedHotel = await Hotel.findByIdAndUpdate(
      hotelId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Kiểm tra xem khách sạn có tồn tại không
    if (!updatedHotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    res
      .status(200)
      .json({ message: "Hotel updated successfully", hotel: updatedHotel });
  } catch (err) {
    console.error("Error updating hotel:", err);
    res.status(500).json({ message: "Error updating hotel" });
  }
};

// API để chỉnh sửa thông tin một phòng
exports.updateRoom = async (req, res) => {
  try {
    const { userId, roomId, roomData } = req.body;

    // Kiểm tra userId, roomId và roomData có tồn tại trong request hay không
    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }
    if (!roomId) {
      return res.status(400).json({ message: "roomId is required" });
    }
    if (!roomData) {
      return res.status(400).json({ message: "Room data is required" });
    }

    // Tìm user trong cơ sở dữ liệu
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Kiểm tra nếu user là admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Only admin can update rooms." });
    }

    // Tìm phòng trong cơ sở dữ liệu
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Cập nhật thông tin phòng
    const updatedRoom = await Room.findByIdAndUpdate(roomId, roomData, {
      new: true,
    });

    // Trả về thông báo thành công và thông tin của phòng đã cập nhật
    res
      .status(200)
      .json({ message: "Room updated successfully", room: updatedRoom });
  } catch (err) {
    console.error("Error updating room:", err);
    res.status(500).json({ message: "Error updating room" });
  }
};
