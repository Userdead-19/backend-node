const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema({
  userID: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Reference to the User model
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
    },
  ],
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  designation: {
    type: String,
    required: true,
  },
  company: {
    type: String,
    required: true,
  },
  likes: [
    {
      count: {
        type: Number,
        default: 0,
      },
      likedBy: [
        {
          _id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
            required: true,
          },
          name: {
            type: String,
            required: true,
          },
        },
      ],
    },
  ],
  date: {
    type: Date,
    default: Date.now,
  },
});

const Blog = mongoose.model("Blog", blogSchema);

module.exports = Blog;
