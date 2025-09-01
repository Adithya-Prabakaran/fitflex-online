// file: netlify/functions/user-profile.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  try {
    const decoded = verifyToken(event); // Verify the token
    const db = await connectToDatabase();
    const User = db.model('User');

    // Find the user by their ID from the token
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    // --- THIS IS THE FIX ---
    // The activityLevel is stored on the user object itself,
    // so we no longer need to query the BMI collection here.
    const userData = {
      name: user.name,
      email: user.email,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      activityLevel: user.activityLevel // Get activityLevel directly from the user
    };

    return { statusCode: 200, body: JSON.stringify(userData) };

  } catch (error) {
    console.error('Error fetching user profile:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + error.message }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'An internal server error occurred.' }) };
  }
};
