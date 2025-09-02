const mongoose = require('mongoose');

const calorieSchema = new mongoose.Schema({
    // We only need the userId to link this data to a user.
    // The redundant 'email' field has been removed.
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // This creates a reference to the User model
        required: true,
        unique: true // Each user should only have one energy document
    },
    bmr: { type: Number, required: true }, // Basal Metabolic Rate
    tdee: { type: Number, required: true }, // Total Daily Energy Expenditure
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update the 'updatedAt' field on every save
calorieSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Like the User model, we export the schema and let database.js handle registration.
module.exports = { schema: calorieSchema, model: null };
