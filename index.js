const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const morgan = require("morgan");
const app = express();
const port = 5000;
const cors = require("cors");
app.use(cors());

app.use(morgan("tiny"));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());
const jwt = require("jsonwebtoken");

mongoose
  .connect(
    "mongodb+srv://abinavpersonal925:ak1123gk@cluster0.wlbsseh.mongodb.net/",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.listen(port, () => console.log(`Server is running on port ${port}`));

const User = require("./models/UserModel");
const Message = require("./models/MessageModel");
const Posts = require("./models/PostModel");
const Blogs = require("./models/BlogModel");
const Review = require("./models/ReviewModel");

const createToken = (userId) => {
  const expiresIn = 60 * 60 * 24 * 3;
  const payload = { userId: userId };

  const token = jwt.sign(payload, "Q$r2K6W8n!jCW%Zk", { expiresIn });

  return token;
};

app.post("/register", (req, res) => {
  console.log(req.body);
  const {
    name,
    email,
    password,
    image,
    gender,
    dob,
    yearofgraduate,
    branch,
    college,
    fieldofinterest,
    skills,
    placeofwork,
    designation,
    about,
  } = req.body;

  const newUser = new User({
    name,
    email,
    password,
    image,
    gender,
    dob,
    yearofgraduate,
    branch,
    college,
    fieldofinterest,
    skills,
    placeofwork,
    designation,
    about,
  });
  console.log(newUser);
  newUser
    .save()
    .then((user) => {
      res.status(200).json({ message: "User registered successfully" });
    })
    .catch((err) => {
      console.log("error in saving the user", err);
      res.status(500).json({ message: err });
    });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        res.status(400).json({ message: "User not found" });
      }

      if (user.password !== password) {
        res.status(400).json({ message: "Password incorrect" });
      }

      const token = createToken(user._id);
      res.status(200).json({ token });
    })
    .catch((err) => {
      console.log("error in finding the user", err);
      res.status(400).json({ message: err });
    });
});

app.get("/", (req, res) => {
  console.log("hello");
  res.send("Hello World!");
});

app.post("/users", async (req, res) => {
  try {
    const { userId } = req.body;

    // Query all users except the specified user
    const users = await User.find({ _id: { $ne: userId } });

    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
});

app.post("/friend-request", async (req, res) => {
  const { currentUserId, selectedUserId } = req.body;
  if (currentUserId === selectedUserId) {
    return res
      .status(403)
      .json({ message: "You cannot send friend request to yourself" });
  }

  if (!currentUserId || !selectedUserId) {
    return res.status(400).json({ message: "Invalid request body" });
  }

  try {
    //update the recepient's friendRequestsArray!
    await User.findByIdAndUpdate(selectedUserId, {
      $push: { friendRequests: currentUserId },
    });

    //update the sender's sentFriendRequests array
    await User.findByIdAndUpdate(currentUserId, {
      $push: { sentFriendRequests: selectedUserId },
    });

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

app.get("/friend-request/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    //fetch the user document based on the User id
    const user = await User.findById(userId)
      .populate("friendRequests", "name email image designation")
      .lean();

    const friendRequests = user.friendRequests;

    res.json(friendRequests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.post("/friend-request/accept", async (req, res) => {
  try {
    const { senderId, recepientId } = req.body;

    //retrieve the documents of sender and the recipient
    const sender = await User.findById(senderId);
    const recepient = await User.findById(recepientId);

    sender.friends.push(recepientId);
    recepient.friends.push(senderId);

    recepient.friendRequests = recepient.friendRequests.filter(
      (request) => request.toString() !== senderId.toString()
    );

    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (request) => request.toString() !== recepientId.toString()
    );

    await sender.save();
    await recepient.save();

    res.status(200).json({ message: "Friend Request accepted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

app.get("/accepted-friends/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "friends",
      "name email image"
    );
    const acceptedFriends = user.friends;
    res.json(acceptedFriends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const multer = require("multer");
const Blog = require("./models/BlogModel");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "files/"); // Specify the desired destination folder
  },
  filename: function (req, file, cb) {
    // Generate a unique filename for the uploaded file
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

//endpoint to post Messages and store it in the backend
app.post("/messages", upload.single("imageFile"), async (req, res) => {
  try {
    const { senderId, recepientId, messageType, messageText } = req.body;

    const newMessage = new Message({
      senderId,
      recepientId,
      messageType,
      message: messageText,
      timestamp: new Date(),
      imageUrl: messageType === "image" ? req.file.path : null,
    });

    await newMessage.save();
    res.status(200).json({ message: "Message sent Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

///endpoint to get the userDetails to design the chat Room header
app.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    //fetch the user data from the user ID
    const recepientId = await User.findById(userId);

    res.json(recepientId);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//endpoint to fetch the messages between two users in the chatRoom
app.get("/messages/:senderId/:recepientId", async (req, res) => {
  try {
    const { senderId, recepientId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, recepientId: recepientId },
        { senderId: recepientId, recepientId: senderId },
      ],
    }).populate("senderId", "_id name");

    res.json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//endpoint to delete the messages!
app.post("/deleteMessages", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "invalid req body!" });
    }

    await Message.deleteMany({ _id: { $in: messages } });

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server" });
  }
});

app.get("/friend-requests/sent/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("sentFriendRequests", "name email image")
      .lean();

    const sentFriendRequests = user.sentFriendRequests;

    res.json(sentFriendRequests);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Internal Server" });
  }
});

app.get("/friends/:userId", (req, res) => {
  try {
    const { userId } = req.params;

    User.findById(userId)
      .populate("friends")
      .then((user) => {
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const friendIds = user.friends.map((friend) => friend._id);

        res.status(200).json(friendIds);
      });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "internal server error" });
  }
});

app.post("/posts", async (req, res) => {
  const { title, content, userID } = req.body;
  const newPost = new Posts({
    title,
    content,
    userID,
  })
    .save()
    .then((post) => {
      res.status(200).json({ message: "Post created successfully" });
    })
    .catch((err) => {
      console.log("error in saving the post", err);
      res.status(500).json({ message: err });
    });
});

app.get("/posts", async (req, res) => {
  await Posts.find()
    .then((posts) => {
      res.status(200).json(posts);
    })
    .catch((err) => {
      console.log("error in saving the post", err);
      res.status(500).json({ message: err });
    });
});

app.post("/comments", async (req, res) => {
  console.log(req.body);
  const { text, userID, postID } = req.body;
  const comment = text;
  Posts.findByIdAndUpdate(postID, {
    $push: { comments: { comment, userID } },
  })
    .then((response) => {
      res.status(200).json({ message: "Comment created successfully" });
    })
    .catch((err) => {
      console.log("error in saving the comment", err);
      res.status(500).json({ message: err });
    });
});

app.get("/blogs", async (req, res) => {
  await Blogs.find()
    .then((blogs) => {
      res.status(200).json(blogs);
    })
    .catch((err) => {
      console.log("error in saving the post", err);
      res.status(500).json({ message: err });
    });
});

app.post("/blogs", async (req, res) => {
  const { title, content, userID, designation, company } = req.body;
  const user = await User.findById(userID);
  const newBlog = new Blogs({
    title,
    content,
    userID: { _id: userID, name: user.name, image: user.image },
    designation,
    company,
  })
    .save()
    .then((blog) => {
      res.status(200).json({ message: "Blog created successfully" });
    })
    .catch((err) => {
      console.log("error in saving the post", err);
      res.status(500).json({ message: err });
    });
});

app.get("/blogs/:id", async (req, res) => {
  const { id } = req.params;
  await Blogs.findById(id)
    .then((blogs) => {
      res.status(200).json(blogs);
    })
    .catch((err) => {
      console.log("error in saving the post", err);
      res.status(500).json({ message: err });
    });
});

app.get("/search", async (req, res) => {
  const searchText = req.query.q;

  try {
    const users = await User.find({
      $or: [
        { name: { $regex: searchText, $options: "i" } }, // Case-insensitive name search
        { email: { $regex: searchText, $options: "i" } }, // Case-insensitive email search
      ],
    });

    res.json(users);
  } catch (error) {
    console.error("Error searching for users:", error);
    res.status(500).json({ error: "Error searching for users" });
  }
});

app.post("/blogs/like", async (req, res) => {
  const { blogId, count, userId } = req.body;
  const user = await User.findById(userId);

  try {
    await Blog.findByIdAndUpdate(blogId, {
      $push: {
        likes: { count: count, likedBy: { _id: userId, name: user.name } },
      },
    })
      .then((response) => {
        res.status(200).json({ message: "Blog liked successfully" });
      })
      .catch((err) => {
        console.log("error in saving the post", err);
        res.status(500).json({ message: err });
      });
  } catch (error) {
    console.error("Error searching for users:", error);
    res.status(500).json({ error: "Error searching for users" });
  }
});

app.post("/addReview", async (req, res) => {
  const { designation, placeofwork, review, rating } = req.body;
  const newReview = new Review({
    designation,
    placeofwork,
    review,
    rating,
  })
    .save()
    .then((review) => {
      res.status(200).json({ message: "Review created successfully" });
    })
    .catch((err) => {
      console.log("error in saving the review", err);
      res.status(500).json({ message: err });
    });
});

app.get("/reviews", async (req, res) => {
  await Review.find()
    .then((reviews) => {
      res.status(200).json(reviews);
    })
    .catch((err) => {
      console.log("error in saving the post", err);
      res.status(500).json({ message: err });
    });
});

app.put("/userUpdate/:id", async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // Make sure the request body contains the fields you want to update

  User.findByIdAndUpdate(id, updateData, { new: true })
    .then((updatedUser) => {
      if (updatedUser) {
        res
          .status(200)
          .json({ message: "User updated successfully", user: updatedUser });
      } else {
        res.status(404).json({ message: "User not found" });
      }
    })
    .catch((err) => {
      console.log("Error updating the user:", err);
      res.status(500).json({ message: "Internal server error" });
    });
});
