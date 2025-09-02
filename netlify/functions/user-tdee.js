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
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: Invalid token' }) };
    }

    const db = await connectToDatabase();
    const Calorie = db.model('Calorie');

    const calorieData = await Calorie.findOne({ userId: decoded.userId });

    // If a new user hasn't updated their profile yet, return a sensible default TDEE.
    if (!calorieData || !calorieData.tdee) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ tdee: 2000 }) // Default TDEE value
      };
    }
    
    // If TDEE data exists, return it.
    return { 
      statusCode: 200, 
      body: JSON.stringify({ tdee: Math.round(calorieData.tdee) }) 
    };

  } catch (error) {
    console.error('Error in user-tdee function:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + error.message }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

