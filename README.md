<div align="center">
  
  <h1>CampusBites 🍔</h1>
  <p><strong>A responsive smart canteen ordering system designed for college campuses.</strong></p>
  
  <p>
    <!-- Build & License -->
    <a href="https://github.com/Pxrvn07/CampusBites/actions"><img src="https://img.shields.io/github/actions/workflow/status/Pxrvn07/CampusBites/ci.yml?style=for-the-badge" alt="Build Status"/></a>
    <a href="https://github.com/Pxrvn07/CampusBites/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Pxrvn07/CampusBites?style=for-the-badge&color=green" alt="License"/></a>
    <br/>
    <!-- Repository Stats -->
    <a href="https://github.com/Pxrvn07/CampusBites/stargazers"><img src="https://img.shields.io/github/stars/Pxrvn07/CampusBites?style=for-the-badge&color=yellow" alt="Stars"/></a>
    <a href="https://github.com/Pxrvn07/CampusBites/network/members"><img src="https://img.shields.io/github/forks/Pxrvn07/CampusBites?style=for-the-badge&color=blue" alt="Forks"/></a>
    <a href="https://github.com/Pxrvn07/CampusBites/issues"><img src="https://img.shields.io/github/issues/Pxrvn07/CampusBites?style=for-the-badge&color=red" alt="Issues"/></a>
    <a href="https://github.com/Pxrvn07/CampusBites/pulls"><img src="https://img.shields.io/github/issues-pr/Pxrvn07/CampusBites?style=for-the-badge&color=orange" alt="Pull Requests"/></a>
    <a href="https://github.com/Pxrvn07/CampusBites/graphs/contributors"><img src="https://img.shields.io/github/contributors/Pxrvn07/CampusBites?style=for-the-badge&color=blueviolet" alt="Contributors"/></a>
    <br/>
    <!-- Repository Activity & Size -->
    <a href="https://github.com/Pxrvn07/CampusBites/commits/main"><img src="https://img.shields.io/github/last-commit/Pxrvn07/CampusBites?style=for-the-badge" alt="Last Commit"/></a>
    <a href="https://github.com/Pxrvn07/CampusBites/commits/main"><img src="https://img.shields.io/github/commit-activity/m/Pxrvn07/CampusBites?style=for-the-badge" alt="Commit Activity"/></a>
    <a href="https://github.com/Pxrvn07/CampusBites"><img src="https://img.shields.io/github/repo-size/Pxrvn07/CampusBites?style=for-the-badge" alt="Repo Size"/></a>
    <a href="https://github.com/Pxrvn07/CampusBites"><img src="https://img.shields.io/github/languages/count/Pxrvn07/CampusBites?style=for-the-badge" alt="Languages"/></a>
    <a href="https://github.com/Pxrvn07/CampusBites"><img src="https://img.shields.io/github/languages/top/Pxrvn07/CampusBites?style=for-the-badge" alt="Top Language"/></a>
    <br/>
    <!-- Tech Stack -->
    <img src="https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
    <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
    <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"/>
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
    <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
    <img src="https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white" alt="Docker"/>
    <br/><br/>
    <!-- Visitors -->
    <img src="https://visitor-badge.laobi.icu/badge?page_id=Pxrvn07.CampusBites" alt="visitors" />
  </p>
</div>

<hr/>

## 📖 Overview

**CampusBites** completely reimagines the dining experience on college campuses. No more long lines or waiting for tokens. This robust ordering system comes with a modern **Student Portal** to place orders, a **Real-Time KDS** (Kitchen Display System) for chefs, and a comprehensive **Admin Dashboard** to manage operations seamlessly.

Whether you're managing a small cafeteria or a multi-building university dining network, CampusBites provides real-time, instantaneous synchronization to keep everyone updated.

---

## ✨ Features

- **🎓 Student Portal**: Beautiful, responsive Next.js frontend to browse menus, place orders, and track live status with unique tokens.
- **🍳 Real-Time KDS**: Live kitchen display system powered by Socket.IO ensures staff can manage and clear active orders instantly.
- **⚙️ Admin Dashboard**: Full control over menu management, dynamic pricing, toggling availability, and sending notifications.
- **💳 Integrated Payments**: Supports seamless checkout utilizing Razorpay and UPI.
- **🐳 Docker Ready**: Spin up the entire stack with a single `docker-compose up` command.

---

## 🛠️ Tech Stack

### Frontend 💻
- **Framework**: [Next.js (App Router)](https://nextjs.org/) & React 19
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Real-Time**: Socket.IO Client
- **Language**: TypeScript

### Backend 🖥️
- **Runtime**: Node.js & Express
- **Database**: [MongoDB](https://www.mongodb.com/) (Mongoose)
- **Sockets**: Socket.IO (Bidirectional live events)
- **Payments**: Razorpay API

---

## 🚀 Quick Start

### Option 1: Using Docker (Recommended)

1. **Clone the repository**:
   ```sh
   git clone https://github.com/Pxrvn07/CampusBites.git
   cd CampusBites
   ```

2. **Set up Environment Variables**:
   Copy the example and fill in your keys (optional for local testing without payments).
   ```sh
   cp .env.example .env
   ```

3. **Run with Docker Compose**:
   ```sh
   docker-compose up -d --build
   ```
   > That's it! The **Frontend** runs on `http://localhost:3000` and the **Backend API** runs on `http://localhost:5000`.

### Option 2: Local Setup (Without Docker)

1. **Clone & Setup Backend**:
   ```sh
   git clone https://github.com/Pxrvn07/CampusBites.git
   cd CampusBites/server
   npm install
   
   # Add your .env file here (PORT, MONGODB_URI, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
   npm start
   ```

2. **Setup Frontend**:
   ```sh
   # In a new terminal
   cd ../client
   npm install
   npm run dev
   ```

---

## 🗺️ System Architecture

```mermaid
graph TD
    User([Student/User]) --> |Places Order| NextJS[Next.js Frontend]
    Chef([Kitchen Staff]) --> |Updates Status| NextJS
    NextJS --> |REST API| Express[Express.js API]
    NextJS <--> |WebSockets| SocketIO[Socket.IO Server]
    Express --> |Reads/Writes| MongoDB[(MongoDB)]
    Express --> |Initiates Payment| Razorpay[Razorpay Gateway]
    SocketIO --> |Real-time Updates| User
    SocketIO --> |Live Orders| Chef
```

---

## 🤝 Contributing

We love contributions from the community! Check out our [Contribution Guidelines](CONTRIBUTING.md) to get started. 

If you find a bug or have an idea, please [open an issue](https://github.com/Pxrvn07/CampusBites/issues)! Wait, even better—fork it and submit a PR! We highly appreciate your efforts!

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <b>If you like this project, please consider giving it a ⭐ to show your support!</b>
</div>
