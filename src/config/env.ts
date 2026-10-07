import dotenv from 'dotenv';

dotenv.config();

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://mess-manager-client-nine.vercel.app',
];

const fromEnv = [
  process.env.CLIENT_URL,
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(',') : []),
]
  .map((o) => o?.trim())
  .filter((o): o is string => Boolean(o));

export const env = {
  port: Number(process.env.PORT) || 5001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/mess_management',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  clientOrigins: [...new Set([...defaultOrigins, ...fromEnv])],
  nodeEnv: process.env.NODE_ENV || 'development',
};
