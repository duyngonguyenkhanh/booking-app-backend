const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userid: { type: mongoose.Schema.Types.ObjectId, required: true },
  username: { type: String, required: true },
  hotel: { type: mongoose.Schema.Types.ObjectId, ref: "Hotel", required: true },
  rooms: [
    {
      id: { type: mongoose.Schema.Types.ObjectId, required: true },
      roomNumber: { type: Number, required: true },
      price: { type: Number, required: true },
    },
  ],
  dateStart: { type: Date, required: true },
  dateEnd: { type: Date, required: true },
  payment: { type: String, required: true, enum: ["Credit Card", "Cash"] },
  status: {
    type: String,
    required: true,
    enum: ["Booked", "Checkin", "Checkout"],
  },
});

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
