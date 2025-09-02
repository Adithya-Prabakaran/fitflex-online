// file: netlify/functions/user-profile.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const decoded = verifyToken(event);
    if (!decoded || !decoded.userId) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: Invalid token' }) };
    }

    const db = await connectToDatabase();
    const User = db.model('User');

    // Find the user by their ID from the token. lean() improves read performance.
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    // The returned object contains all user data from a single, reliable source.
    // The separate, confusing query to the BMI collection has been removed.
    const userData = {
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel 
    };

    return { statusCode: 200, body: JSON.stringify(userData) };

  } catch (error) {
    console.error('Error in user-profile function:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + error.message }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'An internal server error occurred.' }) };
  }
};

