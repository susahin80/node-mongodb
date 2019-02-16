const express = require("express");
const router = express.Router();
const _ = require("lodash");
const schemas = require("../schemas/schemas");
const validation = require("../middlewares/validation");
const auth = require("../middlewares/auth");
const { ObjectID } = require("mongodb");

//todo admin auth
router.post(
  "/categories",
  validation(schemas.expenseCategory),
  async (req, res) => {
    try {
      let category = _.pick(req.body, ["name"]);

      const db = req.app.locals.db;
      const result = await db
        .collection("expenseCategories")
        .insertOne(category);

      category._id = result.insertedId;

      res.status(200).send(category);
    } catch (err) {
      res.status(500).send(err.message);
    }
  }
);

router.get("/categories", async (req, res) => {
  try {
    const db = req.app.locals.db;

    const categories = await db
      .collection("expenseCategories")
      .find({})
      .toArray();

    res.status(200).send(categories);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.post("/", [auth, validation(schemas.expense)], async (req, res) => {
  try {
    let expense = _.pick(req.body, ["name", "amount", "date", "category"]);

    expense.date = new Date(expense.date);
    expense.user = req.user.userId;

    const db = req.app.locals.db;
    const result = await db.collection("expenses").insertOne(expense);

    expense._id = result.insertedId;

    res.status(200).send(expense);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// router.get("/", auth, async (req, res) => {
//   try {
//     const db = req.app.locals.db;

//     const expenses = await db
//       .collection("expenses")
//       .find({ user: req.user.userId })
//       .toArray();

//     res.status(200).send(expenses);
//   } catch (err) {
//     res.status(500).send(err.message);
//   }
// });

router.get("/", auth, async (req, res) => {
  try {
    const page = req.query.page ? +req.query.page : 1;
    const size = req.query.size ? +req.query.size : 5;
    const sortQuery = req.query.sort ? req.query.sort : "date";

    const skip = (page - 1) * size;
    var sort = {};
    sort[sortQuery] = 1;

    const db = req.app.locals.db;

    const expenses = await db
      .collection("expenses")
      .find({ user: req.user.userId })
      .sort(sort)
      .skip(skip)
      .limit(size)
      .toArray();

    res.status(200).send(expenses);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const db = req.app.locals.db;

    let expense = await db
      .collection("expenses")
      .findOne({ _id: new ObjectID(req.params.id) });

    if (!expense) return res.status(400).send("Expense not found"); //400-bad request

    if (req.user.userId !== expense.user.toString())
      return res.status(403).send("Expense is not yours"); //403-forbidden

    expense = await db
      .collection("expenses")
      .findOneAndDelete({ _id: new ObjectID(req.params.id) });

    res.status(200).send(expense);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.put("/:id", [auth, validation(schemas.expense)], async (req, res) => {
  try {
    const db = req.app.locals.db;

    let expense = await db
      .collection("expenses")
      .findOne({ _id: new ObjectID(req.params.id) });

    if (!expense) return res.status(400).send("Expense not found"); //400-bad request

    if (req.user.userId !== expense.user.toString())
      return res.status(403).send("Expense is not yours"); //403-forbidden

    const result = await db.collection("expenses").findOneAndUpdate(
      { _id: new ObjectID(req.params.id) },
      {
        $set: {
          name: req.body.name,
          amount: req.body.amount,
          date: new Date(req.body.date),
          category: req.body.category
        }
      }
    );

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
