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
    // --- THIS IS THE FIX ---
    // Use the 'Calorie' model name, which your database.js file maps to the 'energy' collection.
    const Calorie = db.model('Calorie'); 
    
    const data = JSON.parse(event.body);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    // Update the main user document with the new profile data
    user.name = data.name || user.name;
    user.age = data.age || user.age;
    user.gender = data.gender || user.gender;
    user.height = data.height || user.height;
    user.weight = data.weight || user.weight;
    user.activityLevel = data.activityLevel || user.activityLevel;
    await user.save();

    // If all required fields are present, calculate and save BMR/TDEE
    if (data.height && data.weight && data.age && data.gender && data.activityLevel) {
      
      // Update the 'bmi' collection
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

      // Calculate BMR (Basal Metabolic Rate)
      let bmr;
      if (data.gender.toLowerCase() === 'male') {
        bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) + 5;
      } else { // Covers 'female' and 'other'
        bmr = (10 * data.weight) + (6.25 * data.height) - (5 * data.age) - 161;
      }

      // Calculate TDEE (Total Daily Energy Expenditure)
      const activityFactor = activityMultipliers[data.activityLevel] || 1.2;
      const tdee = Math.round(bmr * activityFactor);

      // Update the 'energy' collection using the 'Calorie' model
      await Calorie.findOneAndUpdate(
        { userId: user._id }, // Find the document by the user's ID
        {
          // $set updates these fields every time the profile is saved
          $set: {
            userId: user._id,
            email: user.email,
            bmr: Math.round(bmr),
            tdee: tdee
          },
          // $setOnInsert only sets this field when the document is first created
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true, new: true } // Creates the document if it doesn't exist
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
