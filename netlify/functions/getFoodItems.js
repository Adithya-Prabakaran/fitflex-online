// File: netlify/functions/getFoodItems.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  try {
    verifyToken(event);
    const db = await connectToDatabase();
    const FoodItem = db.model('FoodItem');
    const items = await FoodItem.find({}).lean();
    
    return {
      statusCode: 200,
      body: JSON.stringify(items)
    };

  } catch (error) {
    console.error('Error fetching food items:', error);
    
    // Catch specific token/auth errors and return 401 Unauthorized
    if (error.name === 'AuthError' || error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + error.message }) };
    }
    
    // Catch general server errors
    return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'An internal server error occurred.' }) 
    };
  }
};

