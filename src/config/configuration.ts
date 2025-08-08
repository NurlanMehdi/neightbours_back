export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },

  sms: {
    login: process.env.SMS_LOGIN,
    password: process.env.SMS_PASSWORD,
    apiUrl: process.env.SMS_API_URL,
    sender: process.env.SMS_SENDER,
  },

  ai: {
    apiUrl: process.env.AI_API_URL || 'http://62.113.36.167:3000',
    apiKey: process.env.AI_API_KEY,
  },
});
