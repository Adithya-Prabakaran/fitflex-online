// file: netlify/functions/getFoodItems.js
const connectToDatabase = require('./utils/database');

exports.handler = async (event) => {
  try {
    const db = await connectToDatabase();
    const FoodItem = db.model('FoodItem');
    const items = await FoodItem.find({}).lean();
    return {
      statusCode: 200,
      body: JSON.stringify(items)
    };
  } catch (err) {
    console.error('DB Query Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to fetch food items' }) };
  }
};