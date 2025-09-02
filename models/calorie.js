const mongoose = require('mongoose');

const calorieSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        unique: true
    },
    bmr: { type: Number },
    tdee: { type: Number },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

calorieSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// --- THIS IS THE CRUCIAL FIX for the collection name ---
// The third argument explicitly forces Mongoose to use the 'energy' collection.
module.exports = mongoose.model('Calorie', calorieSchema, 'energy');

