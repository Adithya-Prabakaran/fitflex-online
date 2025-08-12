// file: netlify/functions/update-profile.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const decoded = verifyToken(event);
    const db = await connectToDatabase();
    const User = db.model('User');
    const BMI = db.model('BMI');
    const Calorie = db.model('Calorie');
    
    const { name, age, gender, height, weight, bmi, activityLevel } = JSON.parse(event.body);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    // Update user fields
    if (name) user.name = name;
    if (age) user.age = age;
    // ... update other fields ...
    await user.save();

    if (height && weight && bmi) {
      await BMI.findOneAndUpdate({ email: user.email }, { /* your BMI data */ }, { upsert: true });
      // ... your BMR and TDEE calculation logic here ...
      const tdee = /* calculated TDEE */;
      await Calorie.findOneAndUpdate({ userId: user._id }, { email: user.email, tdee: tdee }, { upsert: true });
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, message: 'Profile updated successfully' }) };
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.message === '401') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};