/**
 * Force re-seed – clears existing items then inserts all items fresh
 * Usage: node reseed.js
 */
const mongoose = require('mongoose');
require('dotenv').config();
const MenuItem = require('./models/MenuItem');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campusbites';

const items = [
    // Breakfast
    { name: 'Masala Dosa', category: 'Breakfast', price: 45, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80' },
    { name: 'Idli Sambar (3 pcs)', category: 'Breakfast', price: 30, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1630383249896-483b1fbef947?w=400&q=80' },
    { name: 'Aloo Paratha', category: 'Breakfast', price: 40, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80' },
    { name: 'Poha', category: 'Breakfast', price: 25, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80' },
    { name: 'Upma', category: 'Breakfast', price: 25, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1622205313162-be1d5712a43f?w=400&q=80' },
    // Rice & Biryani
    { name: 'Veg Biryani', category: 'Rice & Biryani', price: 80, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400&q=80' },
    { name: 'Chicken Biryani', category: 'Rice & Biryani', price: 120, veg_or_nonveg: 'non-veg', imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=400&q=80' },
    { name: 'Egg Fried Rice', category: 'Rice & Biryani', price: 70, veg_or_nonveg: 'non-veg', imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&q=80' },
    { name: 'Curd Rice', category: 'Rice & Biryani', price: 50, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&q=80' },
    // Curries
    { name: 'Paneer Butter Masala', category: 'Curries', price: 90, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80' },
    { name: 'Dal Makhani', category: 'Curries', price: 70, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&q=80' },
    { name: 'Chicken Curry', category: 'Curries', price: 110, veg_or_nonveg: 'non-veg', imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&q=80' },
    { name: 'Egg Curry', category: 'Curries', price: 80, veg_or_nonveg: 'non-veg', imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80' },
    // Snacks
    { name: 'Veg Burger', category: 'Snacks', price: 55, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
    { name: 'Chicken Burger', category: 'Snacks', price: 75, veg_or_nonveg: 'non-veg', imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&q=80' },
    { name: 'Samosa (2 pcs)', category: 'Snacks', price: 20, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80' },
    { name: 'French Fries', category: 'Snacks', price: 50, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80' },
    { name: 'Veg Sandwich', category: 'Snacks', price: 45, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80' },
    { name: 'Egg Roll', category: 'Snacks', price: 40, veg_or_nonveg: 'non-veg', imageUrl: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400&q=80' },
    // Beverages
    { name: 'Masala Chai', category: 'Beverages', price: 15, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&q=80' },
    { name: 'Cold Coffee', category: 'Beverages', price: 40, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&q=80' },
    { name: 'Lassi', category: 'Beverages', price: 30, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&q=80' },
    { name: 'Fresh Lime Soda', category: 'Beverages', price: 25, veg_or_nonveg: 'veg', imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80' },
];

async function reseed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    await MenuItem.deleteMany({});
    console.log('Cleared existing menu items');
    const inserted = await MenuItem.insertMany(items);
    console.log(`✅ Seeded ${inserted.length} items`);
    process.exit(0);
}

reseed().catch(err => { console.error(err); process.exit(1); });
