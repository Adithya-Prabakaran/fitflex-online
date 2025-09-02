// file: netlify/functions/signup.js
const connectToDatabase = require('./utils/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); // <-- 1. IMPORT JWT

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const db = await connectToDatabase();
    const User = db.model('User');
    const { name, email, age, gender, password } = JSON.parse(event.body);

    if (!name || !email || !age || !gender || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'All fields are required' }) };
    }

    // It's good practice to normalize the email to lowercase
    const lowerCaseEmail = email.toLowerCase();
    const existingUser = await User.findOne({ email: lowerCaseEmail });
    if (existingUser) {
      return { statusCode: 409, body: JSON.stringify({ error: 'Email already registered' }) };
    }

    const newUser = new User({ name, email: lowerCaseEmail, age, gender, password });
    await newUser.save();

    // --- THIS IS THE CRITICAL CHANGE ---
    // 2. Create a JWT token immediately after saving the user
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token is valid for 7 days
    );

    // 3. Return a JSON object with success and the new token
    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, message: 'Registration successful!', token: token })
    };
    // ---------------------------------

  } catch (err) {
    console.error('Signup Error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Error registering user' }) };
  }
};

