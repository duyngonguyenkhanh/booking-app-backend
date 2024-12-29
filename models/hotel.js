const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: {
    type: String,
    enum: ['Hotel', 'Apartments', 'Resorts', 'Villas', 'Cabins'], // Giá trị hợp lệ
    required: true
  },
  city: { type: String, required: true },
  address: { type: String, required: true },
  distance: { type: String, required: true },
  photos: [String],
  desc: { type: String, required: true },
  title: {type: String},
  rating: { type: Number },
  featured: { type: Boolean, required: true },
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  cheapestPrice: { type: Number } // Thêm trường cheapestPrice
});

module.exports = mongoose.model('Hotel', hotelSchema);
