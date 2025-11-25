import dotenv from 'dotenv';

dotenv.config();

export default {
  secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
};

