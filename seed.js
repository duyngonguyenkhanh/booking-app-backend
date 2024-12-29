const mongoose = require('mongoose');
const Room = require('./models/Room'); // Đảm bảo đường dẫn đúng
const connectDB = require('./util/connectDB'); // Đảm bảo file này có sẵn

const updateRoomDates = async (roomsData, dateStart, dateEnd) => {
    try {
        await connectDB();

        // Chuyển đổi ngày bắt đầu và ngày kết thúc thành đối tượng Date
        const startDate = new Date(dateStart);
        const endDate = new Date(dateEnd);

        // Lặp qua từng phòng trong mảng đầu vào
        for (const roomData of roomsData) {
            const { id, number } = roomData;

            for (const num of number) {
                // Cập nhật ngày không khả dụng cho từng số phòng
                await Room.updateOne(
                    { _id: id, "roomNumbers.number": num },
                    { 
                        $set: {
                            "roomNumbers.$.unavailableDates.0": { start: startDate, end: endDate }
                        }
                    }
                );
            }
        }

        console.log('Rooms updated successfully');
    } catch (error) {
        console.error('Error updating rooms:', error.message);
    } finally {
        mongoose.connection.close();
    }
};

// Example usage
const roomsData = [
    { id: '6311be30f2fce6ea18172fa8', number: [101, 102] },
    { id: '6311be52f2fce6ea18172faf', number: [202, 203, 205] }
];
const dateStart = "2024-09-01T00:00:00.000Z";
const dateEnd = "2024-09-10T00:00:00.000Z";

updateRoomDates(roomsData, dateStart, dateEnd);
