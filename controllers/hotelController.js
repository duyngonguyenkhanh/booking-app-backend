const hotel = require("../models/hotel");
const Hotel = require("../models/hotel");
const Room = require("../models/Room");
const mongoose = require("mongoose");

exports.searchHotels = async (req, res) => {
  const { city, dateStart, dateEnd, numberOfPeople, numberOfRooms } = req.query;

  console.log(city);

  try {
    console.log("Starting hotel search...");

    // Tìm kiếm khách sạn theo thành phố
    let hotels = await Hotel.find({
      city: new RegExp(`^${city.trim()}$`, "i"),
    });
    console.log("Hotels found:", hotels);

    // // Lấy tất cả các phòng liên quan đến khách sạn trong một truy vấn
    const allRoomIds = hotels.flatMap((hotel) => hotel.rooms);
    console.log("All room IDs:", allRoomIds);

    const rooms = await Room.find({ _id: { $in: allRoomIds } });
    console.log("Rooms found:", rooms);

    // Tiếp tục logic tìm kiếm và lọc khách sạn
    hotels = await Promise.all(
      hotels.map(async (hotel) => {
        let availableRooms = [];
        const hotelRooms = rooms.filter((room) =>
          hotel.rooms.includes(room._id.toString())
        );
        console.log("Hotel roomsssssss:", hotelRooms);

        for (const room of hotelRooms) {
          const isRoomAvailable = room.roomNumbers.some((roomNumber) => {
            if (roomNumber.unavailableDates.length === 0) {
              return true; // Phòng có sẵn nếu không có ngày không khả dụng
            }

            return roomNumber.unavailableDates.every(
              (dateRange) =>
                new Date(dateStart) > new Date(dateRange.end) ||
                new Date(dateEnd) < new Date(dateRange.start)
            );
          });

          if (isRoomAvailable) {
            availableRooms.push(room);
          }
        }

        if (
          availableRooms.length >= numberOfRooms &&
          availableRooms.every((room) => room.maxPeople >= numberOfPeople)
        ) {
          return hotel;
        }
      })
    );

    hotels = hotels.filter((hotel) => hotel !== undefined);
    console.log("Final filtered hotels:", hotels);

    res.status(200).json(hotels);
  } catch (error) {
    console.error("An error occurred:", error);
    res
      .status(500)
      .json({ message: "Error occurred while searching hotels", error });
  }
};

exports.getHotelById = async (req, res) => {
  try {
    //nhận id phòng
    const { hotelId } = req.params;
    const cleanedRoomId = hotelId.trim(); // Loại bỏ các ký tự xuống dòng và khoảng trắng
    console.log(hotelId);

    //tìm id phòng trong rooms
    const hotel = await Hotel.findById(cleanedRoomId);

    if (!hotel) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Trả về tài liệu phòng
    res.status(200).json(hotel);
  } catch (error) {
    console.error("An error occurred:", error);
    res
      .status(500)
      .json({ message: "Error occurred while retrieving room", error });
  }
};

exports.getAvailableRooms = async (req, res) => {
  const { roomIds, dateStart, dateEnd } = req.query;

  console.log("Query Parameters - roomIds:", roomIds, "dateStart:", dateStart, "dateEnd:", dateEnd);

  if (!roomIds) {
    return res.status(400).json({ message: "roomIds parameter is required" });
  }

   // Chuyển đổi ngày bắt đầu và ngày kết thúc thành đối tượng Date
   const startDate = new Date(dateStart);
   const endDate = new Date(dateEnd);


  // Chuyển roomIds thành mảng ObjectId
  const roomIdArray = roomIds
    .split(",")
    .map((id) => new mongoose.Types.ObjectId(id.trim()));

  try {
    console.log("Converted room IDs:", roomIdArray);

    // Tìm các phòng theo roomIds
    const rooms = await Room.find({ _id: { $in: roomIdArray } });
    console.log("Rooms found:", rooms);

    // Lọc các phòng không bị xung đột với khoảng thời gian đặt phòng
    const availableRooms = rooms
      .map((room) => {
        const availableRoomNumbers = room.roomNumbers.filter((roomNumber) => {
          return roomNumber.unavailableDates.every((dateRange) => {
            const rangeStart = new Date(dateRange.start);
            const rangeEnd = new Date(dateRange.end);
            return endDate < rangeStart || startDate > rangeEnd;
          });
        });

        return { ...room.toObject(), roomNumbers: availableRoomNumbers };
      })
      .filter((room) => room.roomNumbers.length > 0);

    console.log("Available rooms:", availableRooms);

    res.status(200).json(availableRooms);
  } catch (error) {
    console.error("An error occurred while retrieving rooms:", error);
    res.status(500).json({
      message: "Error occurred while retrieving available rooms",
      error,
    });
  }
};
