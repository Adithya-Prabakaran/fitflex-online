// File: netlify/functions/utils/database.js

const mongoose = require('mongoose');

// Step 1: Load all model blueprints into Mongoose's main "master catalog".
// This happens once when the function starts.
require('../../../models/User');
require('../../../models/calorie');
require('../../../models/FoodItem');

let cachedConnection = null;

const connectToDatabase = async () => {
  // Use the cached connection if it's available and healthy.
  if (cachedConnection && cachedConnection.readyState === 1) {
    console.log('Using existing cached database connection.');
    return cachedConnection;
  }
  
  try {
    console.log('Creating new database connection...');
    // Create a new, fresh connection (the "new librarian").
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });

    // --- THIS IS THE CRUCIAL FIX ---
    // Step 2: Manually copy every model blueprint from the "master catalog"
    // onto our new connection. This gives the "new librarian" the book list.
    for (const [name, schema] of Object.entries(mongoose.models)) {
      connection.model(name, schema.schema); 
    }
    // --------------------------------

    // Wait for the connection to be fully open and ready.
    await connection.asPromise();

    cachedConnection = connection;
    console.log('New database connection established and models registered.');
    return cachedConnection;

  } catch (error) {
    console.error('Database connection failed:', error);
    // Rethrow the error so the calling function (login/signup) knows it failed.
    throw error;
  }
};

module.exports = connectToDatabase;

