// File: /models/FoodItem.js

const mongoose = require('mongoose');

// This schema defines the structure of a document in your 'fooditems' collection.
const foodItemSchema = new mongoose.Schema({
  // The 'Food' field is a string and is required.
  Food: {
    type: String,
    required: true,
  },
  // The 'Calories' field is a number and is required.
  Calories: {
    type: Number,
    required: true,
  },
  // The 'Category' field is a string, but it's optional.
  Category: {
    type: String,
  },
}, {
  // This option explicitly tells Mongoose to use the 'fooditems' collection.
  // This is important for preventing Mongoose from trying to use a collection named "fooditems" (plural).
  collection: 'fooditems'
});

// Create and export the Mongoose model.
// Now, your application knows what a "FoodItem" is.
module.exports = mongoose.model('FoodItem', foodItemSchema);
