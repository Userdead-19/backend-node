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

const createToken = (userId) => {
  const expiresIn = 60 * 60 * 24 * 3;
  const payload = { userId: userId };

  const token = jwt.sign(payload, "Q$r2K6W8n!jCW%Zk", { expiresIn });

  return token;
};

app.post("/register", (req, res) => {
  const { name, email, password, image } = req.body;

  const newUser = new User({ name, email, password, image });
  newUser
    .save()
    .then((user) => res.status(200).json({ message: user }))
    .catch((err) => {
      console.log("error in register");
      res.status(400).json({ message: err });
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
      .populate("friendRequests", "name email image")
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

app.get("/jwt", (req, res) => {
  const { token } = req.body;
  const secretKey = "Q$r2K6W8n!jCW%Zk";
  try {
    const decodedToken = jwt.verify(token, secretKey);

    res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    res.status(400).json({ message: "Token is invalid" });
  }
});

app.post("/renew-token", (req, res) => {
  const refreshToken = req.body.refreshToken;
  const expiresIn = 60 * 60 * 24 * 3;

  try {
    const decodedToken = jwt.verify(refreshToken, "Q$r2K6W8n!jCW%Zk");
    const userId = decodedToken.userId;

    // Assume you have a getUserById function to retrieve user details
    const user = getUserById(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Generate a new access token
    const newAccessToken = jwt.sign({ userId: user.id }, "Q$r2K6W8n!jCW%Zk", {
      expiresIn,
    });

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
});
