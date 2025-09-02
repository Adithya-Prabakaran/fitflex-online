// File: netlify/functions/utils/database.js

const mongoose = require('mongoose');

// Step 1: We still require the models at the top level.
// This loads their schemas into the main mongoose object's "master catalog".
require('../../../models/User');
require('../../../models/calorie');
require('../../../models/FoodItem');

let cachedConnection = null;

const connectToDatabase = async () => {
  if (cachedConnection && cachedConnection.readyState === 1) {
    console.log('Using existing cached database connection.');
    return cachedConnection;
  }
  
  try {
    console.log('Creating new database connection...');
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false,
    });

    // --- THIS IS THE CRUCIAL FIX ---
    // Step 2: We take the "master catalog" from the main mongoose object
    // and manually copy every model blueprint to our new connection.
    // This is like giving the new librarian a copy of the main catalog.
    for (const [name, schema] of Object.entries(mongoose.models)) {
      connection.model(name, schema.schema); // Register each model on the new connection
    }
    // --------------------------------

    await connection.asPromise();

    cachedConnection = connection;
    console.log('New database connection established and models registered.');
    return cachedConnection;

  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

module.exports = connectToDatabase;

