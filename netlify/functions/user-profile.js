// file: netlify/functions/user-profile.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  try {
    const decoded = verifyToken(event); // Verify the token
    const db = await connectToDatabase();
    const User = db.model('User');
    const BMI = db.model('BMI');

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    const bmiData = await BMI.findOne({ email: user.email }).lean();

    const userData = {
      name: user.name, email: user.email, age: user.age, gender: user.gender,
      height: user.height, weight: user.weight,
      activityLevel: bmiData ? bmiData.activityLevel : null
    };

    return { statusCode: 200, body: JSON.stringify(userData) };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    if (error.message === '401') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};