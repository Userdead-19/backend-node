const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();
const port = 5000;
const cors = require("cors");
app.use(cors());

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

const createToken = (userid) => {
  const payload = { userid: userid };

  const token = jwt.sign(payload, "#0sdfj58%s5", { expiresIn: "1h" });

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
      res.status(200).json(token);
    })
    .catch((err) => {
      console.log("error in finding the user", err);
      ("");
      res.status(400).json({ message: err });
    });
});

app.get("/", (req, res) => {
  console.log("hello");
  res.send("Hello World!");
});
