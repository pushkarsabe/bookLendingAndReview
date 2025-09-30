const Joi = require('joi');

const userRegisterSchema = Joi.object({
    name: Joi.string().trim().min(1).max(30).required(),
    email: Joi.string().required(),
    password: Joi.string().min(2).required()
});

const userLoginSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
});

const bookSchema = Joi.object({
    title: Joi.string().trim().min(1).max(255).required(),
    author: Joi.string().trim().min(1).max(255).required(),
    genre: Joi.string().trim().max(100).optional().allow(''),
    description: Joi.string().trim().optional().allow('')
});
module.exports = {
    userRegisterSchema,
    userLoginSchema,
    bookSchema
}













