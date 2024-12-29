// models/Room.js
const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  maxPeople: { type: Number, required: true },
  desc: { type: String, required: true },
  roomNumbers: [{
    number: { type: Number, required: true },
    unavailableDates: [{
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    }]
  }],
}, { timestamps: true });

module.exports = mongoose.model("Room", RoomSchema);
