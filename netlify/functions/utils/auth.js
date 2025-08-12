// file: netlify/functions/utils/auth.js
const jwt = require('jsonwebtoken');

// This helper function verifies the JWT from the request headers
const verifyToken = (event) => {
  const authHeader = event.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Throws an error that can be caught by the calling function
    throw new Error('401');
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded; // Returns the payload, e.g., { userId: '...', email: '...' }
};

module.exports = verifyToken;