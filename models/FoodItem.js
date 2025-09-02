// File: models/FoodItem.js

const mongoose = require('mongoose');

// This schema is now tailored to the exact structure from your screenshot.
const foodItemSchema = new mongoose.Schema({
    Food: { type: String, required: true },
    Serving: { type: String },
    // Set to String to match the "202 cal" format in your database
    Calories: { type: String, required: true },
    Portions: { type: String },
    Vegetarian: { type: String },
    Carbs: { type: Number },
    Protein: { type: Number },
    Fat: { type: Number },
    MealCategory: { type: String },
    // Corrected to use 'HealthQuotient' as seen in your database
    HealthQuotient: { type: String }
}, {
    // It's still good practice to keep strict: false to allow for any
    // other fields that might be in some of your documents.
    strict: false,
    // This explicitly tells Mongoose to use your 'fooditems' collection.
    collection: 'fooditems'
});

module.exports = mongoose.model('FoodItem', foodItemSchema);

