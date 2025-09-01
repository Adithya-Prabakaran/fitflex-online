// file: netlify/functions/update-profile.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    // 1. Authenticate the user
    const decoded = verifyToken(event);
    if (!decoded || !decoded.userId) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: Invalid token' }) };
    }

    // 2. Connect to the database
    const db = await connectToDatabase();
    const User = db.model('User');
    const BMI = db.model('BMI');
    const Calorie = db.model('Calorie');
    
    // 3. Parse incoming data from the form
    const data = JSON.parse(event.body);

    // 4. Find the user in the database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    // 5. Update all user fields from the form data
    user.name = data.name || user.name;
    user.age = data.age || user.age;
    user.gender = data.gender || user.gender;
    user.height = data.height || user.height;
    user.weight = data.weight || user.weight;
    user.activityLevel = data.activityLevel || user.activityLevel;
    await user.save();

    // 6. If we have enough data, update BMI and calculate TDEE
    if (data.height && data.weight && data.age && data.gender && data.activityLevel) {
      // Update the BMI collection
      await BMI.findOneAndUpdate(
        { email: user.email }, 
        { 
          height: data.height, 
          weight: data.weight, 
          bmi: data.bmi,
          age: data.age,
          gender: data.gender
        }, 
        { upsert: true, new: true }
      );
      
      // --- TDEE Calculation Logic ---
      // Activity level multipliers
      const activityMultipliers = {
        'Sedentary': 1.2,
        'Lightly active': 1.375,
        'Moderately active': 1.55,
        'Very active': 1.725,
        'Extra active': 1.9
      };

      // Calculate BMR using Mifflin-St Jeor equation
      let bmr;
      if (data.gender.toLowerCase() === 'male') {
        bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) + 5;
      } else { // female or other
        bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) - 161;
      }

      // Calculate TDEE
      const activityFactor = activityMultipliers[data.activityLevel] || 1.2;
      const tdee = Math.round(bmr * activityFactor);

      // Update the Calorie collection with the new TDEE
      await Calorie.findOneAndUpdate(
        { userId: user._id }, 
        { 
          email: user.email, 
          tdee: tdee 
        }, 
        { upsert: true, new: true }
      );
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: true, message: 'Profile updated successfully!' }) 
    };

  } catch (error) {
    console.error('Error updating profile:', error);
    // Differentiate between auth errors and other server errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + error.message }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'An internal server error occurred.' }) };
  }
};
