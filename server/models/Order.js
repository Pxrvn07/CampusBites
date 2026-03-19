const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: Number,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (v) => Array.isArray(v) && v.length > 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Queued', 'Pending', 'Cooking', 'Ready', 'Completed'],
      default: 'Pending',
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['cash', 'upi', 'card'],
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

// Auto-assign the next orderNumber before first save
orderSchema.pre('save', async function () {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = count + 1;
  }
});

module.exports = mongoose.model('Order', orderSchema);

