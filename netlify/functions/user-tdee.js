// file: netlify/functions/user-tdee.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const decoded = verifyToken(event);
    if (!decoded || !decoded.userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const db = await connectToDatabase();
    // --- THIS IS THE FIX ---
    // Use the 'Calorie' model, which is correctly mapped to your 'energy' collection.
    const Calorie = db.model('Calorie');

    // Find the TDEE data for the logged-in user
    const calorieData = await Calorie.findOne({ userId: decoded.userId });

    // If no data is found (e.g., for a new user), return a default value.
    if (!calorieData || !calorieData.tdee) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ tdee: 2000 }) // Default TDEE
      };
    }
    
    // If data is found, return it.
    return { 
      statusCode: 200, 
      body: JSON.stringify({ tdee: Math.round(calorieData.tdee) }) 
    };

  } catch (error) {
    console.error('Error fetching TDEE:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + error.message }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
