// File: netlify/functions/utils/database.js

const mongoose = require('mongoose');

let cachedConnection = null;

const registerModels = (connection) => {
  if (Object.keys(connection.models).length === 0) {
    console.log('Registering Mongoose models...');
    const UserSchema = require('../../../models/User').schema;
    const CalorieSchema = require('../../../models/calorie').schema;
    const FoodSchema = new mongoose.Schema({}, { strict: false });

    connection.model('User', UserSchema);
    connection.model('FoodItem', FoodSchema, 'fooditems');
    connection.model('Calorie', CalorieSchema, 'energy');
  }
};

const connectToDatabase = async () => {
  if (cachedConnection) {
    // A helpful check to ensure the cached connection is still valid
    if (cachedConnection.readyState === 1) {
      console.log('Using existing cached database connection.');
      return cachedConnection;
    } else {
       console.log('Cached connection is stale, creating a new one.');
       cachedConnection = null; // Clear stale connection
    }
  }

  try {
    console.log('Creating new database connection...');
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });

    registerModels(connection);

    // --- THE KEY FIX IS HERE ---
    // The .asPromise() method returns a promise that resolves when the
    // connection is successfully opened and ready for queries.
    // This prevents the race condition we saw in the logs.
    await connection.asPromise();
    // --------------------------

    cachedConnection = connection;
    console.log('New database connection established.');
    return cachedConnection;

  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = connectToDatabase;

