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
    // --- THIS IS THE CHANGE ---
    // Read from the 'Energy' model to match the update-profile function.
    const Energy = db.model('Energy');

    // Find the TDEE data for the logged-in user
    const energyData = await Energy.findOne({ userId: decoded.userId });

    // If no data is found, return a successful response with a default TDEE
    if (!energyData || !energyData.tdee) {
      return { 
        statusCode: 200, 
        body: JSON.stringify({ tdee: 2000 }) // Default TDEE
      };
    }
    
    // If data IS found, return it.
    return { 
      statusCode: 200, 
      body: JSON.stringify({ tdee: Math.round(energyData.tdee) }) 
    };

  } catch (error) {
    console.error('Error fetching TDEE:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + error.message }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
