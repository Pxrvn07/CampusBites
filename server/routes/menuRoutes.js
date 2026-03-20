const express = require('express');
const MenuItem = require('../models/MenuItem');

const router = express.Router();

// GET /api/menu - fetch all menu items
router.get('/', async (req, res) => {
  try {
    const items = await MenuItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching menu items:', error);
    res.status(500).json({ message: 'Failed to fetch menu items' });
  }
});

// POST /api/menu - add a new menu item
router.post('/', async (req, res) => {
  try {
    const { name, category, price, veg_or_nonveg, imageUrl, counter } = req.body;

    if (!name || !category || typeof price !== 'number' || !veg_or_nonveg) {
      return res.status(400).json({ message: 'Missing or invalid required fields' });
    }

    const newItem = new MenuItem({
      name,
      category,
      price,
      veg_or_nonveg,
      imageUrl: imageUrl || '',
      counter: counter || 'None',
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (error) {
    console.error('Error creating menu item:', error);
    res.status(500).json({ message: 'Failed to create menu item' });
  }
});

// PUT /api/menu/:id - full edit OR toggle isAvailable (no body = toggle)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findById(id);

    if (!item) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    const { name, category, price, veg_or_nonveg, imageUrl, counter, toggleAvailability } = req.body || {};

    if (toggleAvailability || Object.keys(req.body || {}).length === 0) {
      // Legacy toggle behaviour
      item.isAvailable = !item.isAvailable;
    } else {
      // Full edit
      if (name !== undefined) item.name = name;
      if (category !== undefined) item.category = category;
      if (price !== undefined) item.price = price;
      if (veg_or_nonveg !== undefined) item.veg_or_nonveg = veg_or_nonveg;
      if (imageUrl !== undefined) item.imageUrl = imageUrl;
      if (counter !== undefined) item.counter = counter;
    }

    const updated = await item.save();
    res.json(updated);
  } catch (error) {
    console.error('Error updating menu item:', error);
    res.status(500).json({ message: 'Failed to update menu item' });
  }
});


// DELETE /api/menu/:id - delete a menu item
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MenuItem.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting menu item:', error);
    res.status(500).json({ message: 'Failed to delete menu item' });
  }
});

module.exports = router;

