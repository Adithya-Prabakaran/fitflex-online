// file: netlify/functions/user-tdee.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  try {
    const decoded = verifyToken(event);
    const db = await connectToDatabase();
    const Calorie = db.model('Calorie');

    const calorieData = await Calorie.findOne({ userId: decoded.userId }).sort({ createdAt: -1 });
    if (!calorieData) {
      return { statusCode: 404, body: JSON.stringify({ error: 'No TDEE data found' }) };
    }
    
    return { statusCode: 200, body: JSON.stringify({ tdee: Math.round(calorieData.tdee) }) };
  } catch (error) {
    console.error('Error fetching TDEE:', error);
    if (error.message === '401') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};