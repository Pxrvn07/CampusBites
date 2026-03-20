const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    roll_no: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'admin', 'chef'],
      required: true,
      default: 'student',
    },
    wallet_balance: {
      type: Number,
      required: true,
      default: 200,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('User', userSchema);
