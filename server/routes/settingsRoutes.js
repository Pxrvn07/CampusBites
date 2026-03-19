const express = require('express');
const Settings = require('../models/Settings');

const router = express.Router();

// GET /api/settings - fetch global canteen settings
router.get('/', async (req, res) => {
    try {
        let settings = await Settings.findOne({ singleton: 'config' });
        if (!settings) {
            // Create default if it doesn't exist
            settings = await Settings.create({ isOpen: true, singleton: 'config' });
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ message: 'Failed to fetch settings' });
    }
});

// PUT /api/settings - update canteen settings
router.put('/', async (req, res) => {
    try {
        const { isOpen } = req.body;
        let settings = await Settings.findOne({ singleton: 'config' });

        if (!settings) {
            settings = new Settings({ isOpen, singleton: 'config' });
        } else {
            if (isOpen !== undefined) settings.isOpen = isOpen;
        }

        const updated = await settings.save();

        // Emit socket event to notify all connected clients
        const io = req.app.get('io');
        if (io) {
            io.emit('canteenStatusUpdate', { isOpen: updated.isOpen });
        }

        res.json(updated);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ message: 'Failed to update settings' });
    }
});

module.exports = router;
