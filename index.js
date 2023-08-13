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

app.get("/", (req, res) => {
  console.log("hello");
  res.send("Hello World!");
});
