// File: netlify/functions/utils/database.js

const mongoose = require('mongoose');

// A variable to cache the database connection for performance in serverless environments.
let cachedConnection = null;

// A helper function to define and register models only once per connection.
const registerModels = (connection) => {
  // Check if models are already compiled to prevent OverwriteModelError
  if (Object.keys(connection.models).length === 0) {
    console.log('Registering Mongoose models...');
    
    // Import your schema definitions
    const UserSchema = require('../../../models/User').schema;
    const CalorieSchema = require('../../../models/calorie').schema;
    
    // A generic schema for the food items collection.
    const FoodSchema = new mongoose.Schema({}, { strict: false });

    // Register all models on the connection object.
    // The explicit third argument sets the collection name in MongoDB Atlas.
    connection.model('User', UserSchema, 'users');
    connection.model('Calorie', CalorieSchema, 'energy');
    connection.model('FoodItem', FoodSchema, 'fooditems');
    // The BMI model registration has been correctly removed.
  }
};

const connectToDatabase = async () => {
  // If a connection is already cached, reuse it.
  if (cachedConnection) {
    console.log('Using existing cached database connection.');
    return cachedConnection;
  }

  // If no connection is cached, create a new one.
  try {
    console.log('Creating new database connection...');
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false, // Recommended for serverless
    });

    registerModels(connection);

    cachedConnection = connection;
    return cachedConnection;

  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = connectToDatabase;

