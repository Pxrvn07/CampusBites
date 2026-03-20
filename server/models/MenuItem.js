const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    isAvailable: {
      type: Boolean,
      required: true,
      default: true,
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    veg_or_nonveg: {
      type: String,
      enum: ['veg', 'non-veg'],
      required: true,
    },
    counter: {
      type: String,
      enum: ['Fast Food', 'Snacks', 'Fresh Juice', 'Biriyani', 'Breakfast', 'None'],
      default: 'None',
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('MenuItem', menuItemSchema);

