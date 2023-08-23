const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  designation: {
    type: String,
    required: true,
  },
  placeofwork: {
    type: String,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Review", reviewSchema);
