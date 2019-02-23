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
    expense.user = new ObjectID(req.user.userId);
    expense.category = new ObjectID(expense.category);

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
    // const page = req.query.page ? +req.query.page : 0;
    // const size = req.query.size ? +req.query.size : 5;
    const sortQuery = req.query.sort ? req.query.sort : "date";

    // const skip = page * size;
    var sort = {};
    sort[sortQuery] = 1;

    const db = req.app.locals.db;

    const expenses = await db
      .collection("expenses")
      .aggregate([
        {
          $match: { user: new ObjectID(req.user.userId) }
        },
        {
          $lookup: {
            from: "expenseCategories",
            localField: "category",
            foreignField: "_id",
            as: "Category"
          }
        },
        { $unwind: "$Category" },
        {
          $project: {
            name: 1,
            amount: 1,
            date: 1,
            Category: 1,
            CategoryName: "$Category.name"
          }
        },
        {
          $project: {
            Category: 0,
            user: 0
          }
        }
      ])
      .sort(sort)
      // .skip(skip)
      // .limit(size)
      .toArray();

    // const totalRecords = await db
    //   .collection("expenses")
    //   .find({ user: new ObjectID(req.user.userId) })
    //   .count();

    res.status(200).send(expenses);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get("/:id", auth, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const expense = await db
      .collection("expenses")
      .aggregate([
        {
          $match: {
            _id: new ObjectID(req.params.id),
            user: new ObjectID(req.user.userId)
          }
        },
        {
          $lookup: {
            from: "expenseCategories",
            localField: "category",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: "$category" },
        {
          $project: {
            name: 1,
            amount: 1,
            date: 1,
            category: "$category._id"
          }
        },
        {
          $project: {
            user: 0
          }
        }
      ])
      .toArray();

    if (expense.length == 0) return res.status(404).send("Not found");

    res.status(200).send(expense[0]);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const db = req.app.locals.db;

    let expense = await db
      .collection("expenses")
      .findOne({
        _id: new ObjectID(req.params.id),
        user: new ObjectID(req.user.userId)
      });

    if (!expense) return res.status(400).send("Expense not found"); //400-bad request

    // if (req.user.userId !== expense.user.toString())
    //   return res.status(403).send("Expense is not yours"); //403-forbidden

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

    let expense = await db.collection("expenses").findOne({
      _id: new ObjectID(req.params.id),
      user: new ObjectID(req.user.userId)
    });

    console.log(expense);

    if (!expense) return res.status(400).send("Expense not found"); //400-bad request

    // if (req.user.userId !== expense.user.toString())
    //   return res.status(403).send("Expense is not yours"); //403-forbidden

    const result = await db.collection("expenses").findOneAndUpdate(
      { _id: new ObjectID(req.params.id) },
      {
        $set: {
          name: req.body.name,
          amount: req.body.amount,
          date: new Date(req.body.date),
          category: new ObjectID(req.body.category)
        }
      }
    );

    res.status(200).send(result);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

module.exports = router;
