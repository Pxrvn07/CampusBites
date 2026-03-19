const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

// Helper to calculate total amount based on menu item prices and quantities
async function calculateTotalAmount(items) {
  const ids = items.map((it) => it.menuItem);

  const menuItems = await MenuItem.find({ _id: { $in: ids } }).lean();
  const priceMap = new Map(menuItems.map((m) => [m._id.toString(), m.price]));

  let total = 0;
  for (const { menuItem, quantity } of items) {
    const price = priceMap.get(menuItem.toString());
    if (typeof price !== 'number') continue;
    total += price * quantity;
  }

  return total;
}

// POST /api/orders - create a new order
router.post('/', async (req, res) => {
  try {
    const { userId, items, paymentMethod } = req.body;

    if (!userId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'userId and items are required' });
    }

    const normalizedItems = items.map((it) => ({
      menuItem: new mongoose.Types.ObjectId(it.menuItem),
      quantity: it.quantity,
    }));

    // Fetch menu items to get their counters and prices
    const itemIds = normalizedItems.map((it) => it.menuItem);
    const menuItems = await MenuItem.find({ _id: { $in: itemIds } }).lean();
    const menuMap = new Map(menuItems.map((m) => [m._id.toString(), m]));

    // Group items by counter
    const counterGroups = {};
    for (const it of normalizedItems) {
      const dbItem = menuMap.get(it.menuItem.toString());
      if (!dbItem) continue;
      const counter = dbItem.counter || 'None';
      if (!counterGroups[counter]) counterGroups[counter] = { items: [], totalAmount: 0 };
      counterGroups[counter].items.push(it);
      counterGroups[counter].totalAmount += (dbItem.price || 0) * it.quantity;
    }

    const activeCount = await Order.countDocuments({ status: { $in: ['Pending', 'Cooking', 'Ready'] } });
    const initialStatus = activeCount >= 30 ? 'Queued' : 'Pending';

    const savedOrders = [];
    const io = req.app.get('io');
    const uId = new mongoose.Types.ObjectId(userId);
    const pMethod = paymentMethod || 'cash';

    for (const [counterName, group] of Object.entries(counterGroups)) {
      if (group.totalAmount <= 0 || group.items.length === 0) continue;
      
      const order = new Order({
        userId: uId,
        items: group.items,
        totalAmount: group.totalAmount,
        status: initialStatus,
        paymentMethod: pMethod,
        counter: counterName,
      });

      const saved = await order.save();
      const populated = await saved.populate('items.menuItem');
      savedOrders.push(populated);

      if (io) {
        io.emit('newOrder', populated);
      }
    }

    if (savedOrders.length === 0) {
      return res.status(400).json({ message: 'Failed to create any valid orders from the items provided' });
    }

    res.status(201).json({ orders: savedOrders });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// GET /api/orders/active - fetch all active orders (not completed, not queued)
router.get('/active', async (req, res) => {
  try {
    const orders = await Order.find({ status: { $in: ['Pending', 'Cooking', 'Ready'] } })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching active orders:', error);
    res.status(500).json({ message: 'Failed to fetch active orders' });
  }
});

// PUT /api/orders/:id/status - update order status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Queued', 'Pending', 'Cooking', 'Ready', 'Completed'];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updated = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    ).populate('items.menuItem');

    if (!updated) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const io = req.app.get('io');

    // If order is completed, check if we can pull from the queue
    if (updated.status === 'Completed') {
      const activeCount = await Order.countDocuments({ status: { $in: ['Pending', 'Cooking', 'Ready'] } });
      if (activeCount < 30) {
        const nextInQueue = await Order.findOneAndUpdate(
          { status: 'Queued' },
          { status: 'Pending' },
          { sort: { createdAt: 1 }, new: true }
        ).populate('items.menuItem');

        if (nextInQueue && io) {
          io.emit('orderStatusUpdated', nextInQueue);
          // Emit newOrder to KDS so it inserts it into the Pending column seamlessly
          io.emit('newOrder', nextInQueue);
        }
      }
    }

    // Emit orderStatusUpdated event
    if (io) {
      io.emit('orderStatusUpdated', updated);
    }

    res.json(updated);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Failed to update order status' });
  }
});

// GET /api/orders/:userId - get order history for a specific student
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({ userId })
      .populate('items.menuItem')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

module.exports = router;

