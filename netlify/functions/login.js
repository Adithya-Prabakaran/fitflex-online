// file: netlify/functions/login.js
const connectToDatabase = require('./utils/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const db = await connectToDatabase();
    const User = db.model('User');
    const { email, password } = JSON.parse(event.body);

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ message: 'Email and password are required' }) };
    }

    // --- THE IMPROVEMENT ---
    // Always check for the lowercase version of the email
    const lowerCaseEmail = email.toLowerCase();
    const user = await User.findOne({ email: lowerCaseEmail });
    // ----------------------
    
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Invalid credentials' }) };
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return { statusCode: 401, body: JSON.stringify({ success: false, message: 'Invalid credentials' }) };
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Login successful!', token: token })
    };
  } catch (err) {
    console.error('Login Error:', err);
    return { statusCode: 500, body: JSON.stringify({ success: false, message: 'Error logging in' }) };
  }
};

