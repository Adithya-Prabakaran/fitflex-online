// file: netlify/functions/update-profile.js
const connectToDatabase = require('./utils/database');
const verifyToken = require('./utils/auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  try {
    const decoded = verifyToken(event);
    if (!decoded || !decoded.userId) {
        return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: Invalid token' }) };
    }

    const db = await connectToDatabase();
    const User = db.model('User');
    const Calorie = db.model('Calorie'); 
    
    const data = JSON.parse(event.body);

    // Find the user and update all their profile fields in a single, efficient operation.
    // All logic related to the old BMI collection has been completely removed.
    const updatedUser = await User.findByIdAndUpdate(
        decoded.userId,
        { $set: {
            name: data.name,
            age: data.age,
            gender: data.gender,
            height: data.height,
            weight: data.weight,
            activityLevel: data.activityLevel,
        }},
        { new: true, runValidators: true } // 'new: true' returns the updated document
    );

    if (!updatedUser) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    // Now, calculate and save BMR/TDEE using the reliable data from the updatedUser object.
    if (updatedUser.height && updatedUser.weight && updatedUser.age && updatedUser.gender && updatedUser.activityLevel) {
      const activityMultipliers = {
        'Sedentary': 1.2, 'Lightly active': 1.375, 'Moderately active': 1.55,
        'Very active': 1.725, 'Extra active': 1.9
      };

      let bmr;
      if (updatedUser.gender.toLowerCase() === 'male') {
        bmr = (10 * updatedUser.weight) + (6.25 * updatedUser.height) - (5 * updatedUser.age) + 5;
      } else {
        bmr = (10 * updatedUser.weight) + (6.25 * updatedUser.height) - (5 * updatedUser.age) - 161;
      }

      const activityFactor = activityMultipliers[updatedUser.activityLevel] || 1.2;
      const tdee = Math.round(bmr * activityFactor);

      // Update or create the 'energy' document for this user.
      await Calorie.findOneAndUpdate(
        { userId: updatedUser._id },
        {
          $set: { bmr: Math.round(bmr), tdee: tdee },
          $setOnInsert: { userId: updatedUser._id, createdAt: new Date() }
        },
        { upsert: true, new: true }
      );
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: true, message: 'Profile updated successfully!' }) 
    };

  } catch (error) {
    console.error('Error in update-profile function:', error);
    return { statusCode: 500, body: JSON.stringify({ error: 'An internal server error occurred.' }) };
  }
};

