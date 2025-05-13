import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key'; // You should use .env for this!

// Generate token
export const generateToken = (payload: object): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// Verify token
export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
