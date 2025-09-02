const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number },
  gender: { type: String,
    enum: ['male', 'female', 'non-binary', 'prefer-not-to-say'] },
  height: { type: Number }, // in cm
  weight: { type: Number }, // in kg
  activityLevel: {
    type: String,
    enum: [
        'Sedentary', 'Lightly active', 'Moderately active',
        'Very active', 'Extra active'
    ]
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// This is the fix: The file now correctly exports a Mongoose model.
module.exports = mongoose.model("User", userSchema);
