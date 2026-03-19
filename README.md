# CampusBites

A full-stack smart canteen ordering system crafted to streamline the food ordering and fulfillment process on college campuses. With a seamless student interface, a fast Kitchen Display System (KDS), and robust admin controls, it perfectly synchronizes the entire canteen ecosystem.

## ✨ Features

- **Student Portal**: Students can easily browse the menu, add items to their cart, and place secure orders. It includes integrated token numbers for precise order tracking.
- **Real-Time KDS (Kitchen Display System)**: Allows kitchen staff to efficiently track and manage incoming orders without page reloads. Features a live clock, automated item-to-counter assignments, and ticket tracking.
- **Admin Dashboard**: Comprehensive control center to manage menu listings (price edit, availability toggle), close/open canteen ordering temporarily, and broadcast real-time push notifications.
- **Live Sync**: Uses WebSockets to ensure that any change in an order's status is instantaneously reflected for the student, kitchen staff, and admins.
- **Payment Hooks**: Integrated via Razorpay / UPI methods to facilitate fast and secure checkouts.

## 🛠️ Tech Stack

### Frontend (`client` folder)
- **Framework**: [Next.js](https://nextjs.org/) (App Router format)
- **Library**: React 19
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript
- **Real-Time**: Socket.IO Client

### Backend (`server` folder)
- **Runtime**: Node.js
- **Framework**: Express.js (v5)
- **Database Modeler**: Mongoose (MongoDB)
- **Real-Time Engine**: Socket.IO
- **Payments Processing**: Razorpay NodeJS

## 🚀 Getting Started

### Prerequisites
- Node.js v18 or later
- MongoDB Database (Atlas or local)
- Razorpay Account (for testing payments)

### 1. Clone the repository

```bash
git clone https://github.com/Pxrvn07/CampusBites.git
cd CampusBites
```

### 2. Setup the Server

```bash
cd server
npm install
```

Create a `.env` file in the `server/` root:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Setup the Client

```bash
cd ../client
npm install
```

### 4. Run the Project Locally

**Start the Express Backend:**
```bash
cd server
node server.js
```

**Start the Next.js Frontend:**
```bash
cd client
npm run dev
```

Visit the application at `http://localhost:3000`.

## 📂 Project Structure
- **/client**: Contains the Next.js frontend, separated into `/app` pages (including `/login`, `/kitchen`, `/admin`, etc.) and UI-specific components.
- **/server**: Contains Node.js backend logic, handling REST APIs in `/routes` and MongoDB object schemas in `/models`.
