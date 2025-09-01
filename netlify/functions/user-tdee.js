// file: netlify/functions/user-tdee.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  // This function only handles GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const decoded = verifyToken(event);
    if (!decoded || !decoded.userId) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const db = await connectToDatabase();
    const Calorie = db.model('Calorie');

    const calorieData = await Calorie.findOne({ userId: decoded.userId });

    // --- THIS IS THE FIX ---
    // If no data is found (e.g., a new user), return a successful
    // response with a default TDEE value instead of an error.
    if (!calorieData || !calorieData.tdee) {
      console.log(`No TDEE found for user ${decoded.userId}, returning a default value.`);
      return { 
        statusCode: 200, 
        body: JSON.stringify({ tdee: 2000 }) // Default TDEE
      };
    }
    
    // If data IS found, return it as before.
    return { 
      statusCode: 200, 
      body: JSON.stringify({ tdee: Math.round(calorieData.tdee) }) 
    };

  } catch (error) {
    console.error('Error fetching TDEE:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + error.message }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
