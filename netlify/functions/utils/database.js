// File: netlify/functions/utils/database.js

const mongoose = require('mongoose');

// --- Import all your Mongoose schemas ---
// This path goes up three directories from 'utils' to the root, then into 'models'.
const UserSchema = require('../../../models/User').schema; 
const BmiSchema = require('../../../models/BMI').schema;
const CalorieSchema = require('../../../models/calorie').schema;

// A flexible schema for your food items collection
const FoodSchema = new mongoose.Schema({}, { strict: false }); 

// This variable will be cached across function invocations to improve performance
let conn = null;

const connectToDatabase = async () => {
  // If a connection is already cached, reuse it
  if (conn != null) {
    console.log('Using existing database connection');
    return conn;
  }

  // If no connection is cached, create a new one
  console.log('Creating new database connection...');
  // process.env.MONGODB_URI is your Atlas connection string from Netlify's settings
  conn = await mongoose.createConnection(process.env.MONGODB_URI, {
    // These options are recommended for serverless environments
    serverSelectionTimeoutMS: 5000,
  });

  // --- Register all your models on this single connection ---
  // Any function that uses this helper can now access these models
  conn.model('User', UserSchema);
  conn.model('BMI', BmiSchema, 'bmi'); // The 3rd argument is the collection name in Atlas
  conn.model('Calorie', CalorieSchema, 'calories');
  conn.model('FoodItem', FoodSchema, 'fooditems');

  return conn;
};

module.exports = connectToDatabase;