const express = require("express");
const usersRoute = require("../routes/users");
const expensesRoute = require("../routes/expenses");

module.exports = function(app) {
  app.use(express.json());

  app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");

    res.header(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );

    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token"
    );

    res.header("Access-Control-Expose-Headers", "x-auth-token");

    next();
  });

  app.use("/api/users", usersRoute);
  app.use("/api/expenses", expensesRoute);
};
