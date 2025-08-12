// file: netlify/functions/signup.js
const connectToDatabase = require('./utils/database');
const bcrypt = require('bcrypt');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const db = await connectToDatabase();
    const User = db.model('User');
    const { name, email, age, gender, password } = JSON.parse(event.body);

    if (!name || !email || !age || !gender || !password) {
      return { statusCode: 400, body: 'All fields are required' };
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return { statusCode: 409, body: 'Email already registered' };
    }

    const newUser = new User({ name, email, age, gender, password });
    await newUser.save();

    return { statusCode: 201, body: 'Registration successful!' };
  } catch (err) {
    console.error('Signup Error:', err);
    return { statusCode: 500, body: 'Error registering user' };
  }
};