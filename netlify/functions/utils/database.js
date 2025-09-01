// File: netlify/functions/utils/database.js

const mongoose = require('mongoose');

// A variable to cache the database connection.
// This is a crucial optimization for serverless functions.
let cachedConnection = null;

// --- A helper function to define and register models only once ---
const registerModels = (connection) => {
  // Check if models are already compiled to prevent OverwriteModelError
  if (Object.keys(connection.models).length === 0) {
    
    // Import your schema definitions
    // This path assumes your 'models' folder is at the project root.
    const UserSchema = require('../../../models/User').schema;
    const BmiSchema = require('../../../models/BMI').schema;
    const CalorieSchema = require('../../../models/calorie').schema;
    
    // A generic schema for the food items. `strict: false` allows any fields.
    const FoodSchema = new mongoose.Schema({}, { strict: false });

    // Register all models on the connection object.
    // The 3rd argument explicitly sets the collection name in MongoDB Atlas.
    connection.model('User', UserSchema);
    connection.model('BMI', BmiSchema, 'bmi');
    connection.model('FoodItem', FoodSchema, 'fooditems');
    
    // --- THIS IS THE KEY FIX ---
    // Register the 'Calorie' model to save to the 'energy' collection.
    connection.model('Calorie', CalorieSchema, 'energy');
  }
};


const connectToDatabase = async () => {
  // If a connection is already cached, reuse it and return.
  if (cachedConnection) {
    console.log('Using existing cached database connection.');
    return cachedConnection;
  }

  // If no connection is cached, create a new one.
  try {
    console.log('Creating new database connection...');
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
      // These options are highly recommended for serverless environments
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false, // Disable Mongoose's buffering
    });

    // Register all of your schemas on the new connection
    registerModels(connection);

    // Cache the connection for future function invocations
    cachedConnection = connection;
    return cachedConnection;

  } catch (error) {
    console.error('Database connection failed:', error);
    // Rethrow the error to be caught by the calling function
    throw error;
  }
};

module.exports = connectToDatabase;
