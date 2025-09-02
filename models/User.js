const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  // All profile data now lives here. They are not required at signup.
  age: { type: Number },
  gender: { type: String },
  height: { type: Number }, // in cm
  weight: { type: Number }, // in kg
  // This field was missing from your original schema.
  activityLevel: {
    type: String,
    enum: [
        'Sedentary',
        'Lightly active',
        'Moderately active',
        'Very active',
        'Extra active'
    ]
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving the user for the first time
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, 12); // Using a salt round of 12 is more secure
    next();
  } catch (error) {
    next(error);
  }
});

// Helper method to compare passwords during login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// This is because model registration will be handled centrally in database.js
// to prevent "OverwriteModelError" in a serverless environment.
module.exports = { schema: userSchema, model: null };
