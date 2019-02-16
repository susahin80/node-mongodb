const Joi = require("joi");

const schema = Joi.object().keys({
  email: Joi.string()
    .email()
    .required(),
  fullname: Joi.string()
    .min(3)
    .max(30)
    .required(),
  password: Joi.string().required()
});
