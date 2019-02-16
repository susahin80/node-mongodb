const MongoClient = require("mongodb").MongoClient;
const express = require("express");
const app = express();
require("dotenv").config();

const dbUrl = process.env.MONGO_URL;
const dbName = process.env.MONGO_DB;

MongoClient.connect(dbUrl, { useNewUrlParser: true }, (err, client) => {
  if (err) throw err;

  console.log("Connected successfully to Mongodb");

  const db = client.db(dbName);

  app.locals.db = db;

  const port = process.env.PORT || 3001;

  require("./startup/routes")(app);

  const server = app.listen(port, () =>
    console.log(`Listening on port ${port}...`)
  );
});
