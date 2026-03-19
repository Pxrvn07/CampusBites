# CampusBites

A responsive smart canteen ordering system designed for college campuses, featuring a student ordering portal, a real-time Kitchen Display System (KDS), and a comprehensive Admin Dashboard.

## Features
- **Student Portal**: Browse the menu, place orders securely, and track status live via token numbers.
- **Real-Time KDS**: Live synchronization for kitchen staff to manage active orders effortlessly.
- **Admin Dashboard**: Easily manage menus, toggle canteen availability, and send notifications.
- **Payments**: Integrated with Razorpay and UPI methods.

## Tech Stack
- **Frontend**: Next.js (App Router), React, TypeScript, Tailwind CSS, Socket.IO Client
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.IO, Razorpay

## Quick Setup
1. **Clone**: `git clone https://github.com/Pxrvn07/CampusBites.git`
2. **Backend Engine**:
   - `cd server` & `npm install`
   - Create a `.env` file with `PORT`, `MONGODB_URI`, `RAZORPAY_KEY_ID`, and `RAZORPAY_KEY_SECRET`.
   - Run: `node server.js`
3. **Frontend App**:
   - `cd client` & `npm install`
   - Run: `npm run dev` (Runs on `http://localhost:3000`)
