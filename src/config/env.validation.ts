import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),
  API_PREFIX: Joi.string().default('api'),

  DATABASE_URL: Joi.string().required(),

  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().required(),

  SMS_LOGIN: Joi.string().required(),
  SMS_PASSWORD: Joi.string().required(),
  SMS_API_URL: Joi.string().required(),
  SMS_SENDER: Joi.string().required(),

  AI_API_URL: Joi.string().default('http://62.113.36.167:3000'),
  AI_API_KEY: Joi.string().optional(),
});
