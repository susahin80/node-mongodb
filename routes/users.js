const express = require("express");
const router = express.Router();
const _ = require("lodash");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const schemas = require("../schemas/schemas");
const validation = require("../middlewares/validation");

//https://chrisnoring.gitbooks.io/react/content/libraries/code-validation-with-the-library-joi.html

router.post("/register", validation(schemas.userSchema), async (req, res) => {
  try {
    let user = _.pick(req.body, ["email", "fullname", "password"]);

    const db = req.app.locals.db;

    const existingUser = await db
      .collection("users")
      .findOne({ email: user.email });

    if (existingUser) return res.status(400).send("Email already exists");

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(user.password, salt);
    user.password = hashedPassword;

    const result = await db.collection("users").insertOne(user);

    user._id = result.insertedId;
    user.password = undefined;
    res.status(200).send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/login", validation(schemas.login), async (req, res) => {
  try {
    let { email, password } = _.pick(req.body, ["email", "password"]);

    const db = req.app.locals.db;

    const user = await db.collection("users").findOne({ email });

    if (!user) return res.status(400).send("Email or password wrong");

    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) return res.status(400).send("Email or password wrong");

    user.password = undefined;

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "1d" }
    );

    res
      .header("x-auth-token", token)
      .status(200)
      .send(user);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/", (req, res) => {
  res.status(200).send("Working");
});

module.exports = router;
