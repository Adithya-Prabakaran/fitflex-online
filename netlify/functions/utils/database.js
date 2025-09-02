// File: netlify/functions/utils/database.js

const mongoose = require('mongoose');

// --- THE KEY FIX IS HERE ---
// By "requiring" your Mongoose models here, you ensure they are registered
// and available throughout your application whenever a database connection is made.
// This is a more robust and standard way to handle models in a serverless environment.
require('../../../models/User');
require('../../../models/calorie');
require('../../../models/FoodItem'); // <-- The new, essential FoodItem model is included.
// --------------------------

// A variable to cache the database connection.
let cachedConnection = null;

const connectToDatabase = async () => {
  // If a connection is already cached AND it's in a 'connected' state, reuse it.
  if (cachedConnection && cachedConnection.readyState === 1) {
    console.log('Using existing cached database connection.');
    return cachedConnection;
  }
  
  try {
    console.log('Creating new database connection...');
    // Create the connection to your MongoDB Atlas cluster.
    const connection = await mongoose.createConnection(process.env.MONGODB_URI, {
      // These options are recommended for serverless functions
      serverSelectionTimeoutMS: 5000,
      bufferCommands: false, // Disables Mongoose's command buffering
    });

    // Mongoose now automatically knows about all the models we 'required' at the top.
    // We no longer need a separate 'registerModels' function.
    
    // The .asPromise() method ensures that we wait until the connection is
    // fully established and ready to accept commands before proceeding.
    // This fixes the race condition error you saw in your logs.
    await connection.asPromise();

    // Cache the fully-ready connection for the next function invocation.
    cachedConnection = connection;
    console.log('New database connection established successfully.');
    return cachedConnection;

  } catch (error) {
    console.error('Database connection failed:', error);
    // Rethrow the error to be caught by the calling Netlify function
    throw error;
  }
};

module.exports = connectToDatabase;

