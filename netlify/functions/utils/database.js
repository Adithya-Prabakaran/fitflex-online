// File: netlify/functions/utils/database.js

const mongoose = require('mongoose');

// Step 1: Requiring the corrected model files now properly registers them
// with Mongoose's main "master catalog".
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

    // Step 2: This loop now works correctly because the models
    // from Step 1 are available in mongoose.models to be copied over.
    for (const [name, schema] of Object.entries(mongoose.models)) {
      connection.model(name, schema.schema); 
    }

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
