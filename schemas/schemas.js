const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const email = Joi.string()
  .email()
  .lowercase()
  .required();

const password = Joi.string()
  .min(6)
  .alphanum()
  .required();

const schemas = {
  userSchema: Joi.object().keys({
    email,
    password,
    fullname: Joi.string()
      .min(3)
      .max(30)
      .required()
  }),
  login: Joi.object().keys({
    email,
    password
  }),
  expenseCategory: Joi.object().keys({
    name: Joi.string().required()
  }),

  expense: Joi.object().keys({
    name: Joi.string()
      .min(2)
      .max(30)
      .required(),
    amount: Joi.number().required(),
    date: Joi.date().required(),
    // user: Joi.objectId().required(),
    category: Joi.objectId().required()
  })
};

module.exports = schemas;
