const mongoose = require("mongoose");
const Post = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    userID: {
      type: String,
      required: true,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        comment: {
          type: String,
          ref: "Comment",
        },
        userID: {
          type: String,
          ref: "User",
        },
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
const Posts = mongoose.model("Post", Post);

module.exports = Posts;
