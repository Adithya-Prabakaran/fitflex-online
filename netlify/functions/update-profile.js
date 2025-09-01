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
    const BMI = db.model('BMI');
    // --- CHANGE 1: Using 'Energy' model to match your 'energy' collection ---
    const Energy = db.model('Energy'); 
    
    const data = JSON.parse(event.body);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    user.name = data.name || user.name;
    user.age = data.age || user.age;
    user.gender = data.gender || user.gender;
    user.height = data.height || user.height;
    user.weight = data.weight || user.weight;
    user.activityLevel = data.activityLevel || user.activityLevel;
    await user.save();

    if (data.height && data.weight && data.age && data.gender && data.activityLevel) {
      // Update the BMI collection (this part is unchanged)
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
      
      const activityMultipliers = {
        'Sedentary': 1.2,
        'Lightly active': 1.375,
        'Moderately active': 1.55,
        'Very active': 1.725,
        'Extra active': 1.9
      };

      let bmr;
      if (data.gender.toLowerCase() === 'male') {
        bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) + 5;
      } else {
        bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) - 161;
      }

      const activityFactor = activityMultipliers[data.activityLevel] || 1.2;
      const tdee = Math.round(bmr * activityFactor);

      // --- CHANGE 2: Update the 'Energy' collection with all required fields ---
      await Energy.findOneAndUpdate(
        { userId: user._id }, // Find the document by userId
        {
          // Use $set to update fields every time
          $set: {
            userId: user._id,
            email: user.email,
            bmr: Math.round(bmr), // Save the calculated BMR
            tdee: tdee            // Save the calculated TDEE
          },
          // Use $setOnInsert to set a value ONLY when a new document is created
          $setOnInsert: {
            createdAt: new Date() // Save the creation timestamp
          }
        },
        { upsert: true, new: true } // Create the document if it doesn't exist
      );
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ success: true, message: 'Profile updated successfully!' }) 
    };

  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized: ' + error.message }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'An internal server error occurred.' }) };
  }
};
