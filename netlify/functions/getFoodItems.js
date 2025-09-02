// File: netlify/functions/getFoodItems.js

const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  try {
    // 1. First, verify the user is logged in. This is a critical security step.
    verifyToken(event);
    
    // 2. Connect to the database.
    const db = await connectToDatabase();
    
    // 3. Use the 'FoodItem' model, which is configured to read from your 'fooditems' collection.
    const FoodItem = db.model('FoodItem');
    
    // 4. Fetch all documents from the collection.
    const items = await FoodItem.find({}).lean();
    
    // 5. Return the data successfully.
    return {
      statusCode: 200,
      body: JSON.stringify(items)
    };

  } catch (error) {
    console.error('Error fetching food items:', error);
    
    // Handle specific authentication errors
    if (error.message === '401') {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    
    // Handle general server errors
    return { 
        statusCode: 500, 
        body: JSON.stringify({ error: 'Failed to fetch food items' }) 
    };
  }
};
