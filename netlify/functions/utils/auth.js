// File: netlify/functions/utils/auth.js
const jwt = require('jsonwebtoken');

const verifyToken = (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // This custom error will be caught in the function that calls this utility
    const error = new Error('No token provided or malformed header');
    error.name = 'AuthError';
    throw error;
  }
  
  const token = authHeader.split(' ')[1];
  
  // Let jwt.verify throw its own specific errors (JsonWebTokenError, TokenExpiredError)
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded; // Returns the payload, e.g., { userId: '...' }
};

module.exports = verifyToken;
