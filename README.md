# CollabX 🚀
### Code Together. Compete Together. Grow Together.

CollabX is a real-time collaborative coding platform designed for developers to work together, compete in contests, and solve problems in a shared environment.

![CollabX Banner](https://via.placeholder.com/1200x400?text=CollabX+-+Real-time+Collaboration)

## ✨ Features

- 👥 **Real-time Collaboration**: Live code synchronization with Monaco Editor (VS Code-style).
- 🖱️ **Cursor Tracking**: See where your teammates are typing with color-coded markers.
- 💬 **Integrated Chat**: Seamless communication within the coding room.
- ⚙️ **Multi-Language Execution**: Run your code instantly in **JavaScript, Python, and Java**.
- 🏆 **Coding Contests**: Participate in timed contests with live leaderboards and test case validation.
- 🔔 **Smart Notifications**: Stay updated with language change alerts and participant activity.
- 🎯 **Interactive Terminal**: Real-time program output sharing across all participants.

## 🛠️ Tech Stack

- **Frontend**: React, Vite, Socket.io-client, Monaco Editor
- **Backend**: Node.js, Express, Socket.io
- **Language Support**: VM2 (JavaScript), Native Subprocess (Python), JDK (Java)
- **Styling**: Vanilla CSS (Modern Dark Theme)

## 🚀 Quick Setup

### 1. Clone the repository
```bash
git clone https://github.com/RKarthikSantosh/Collabx.git
cd Collabx
```

### 2. Install Dependencies
```bash
# Frontend
cd client && npm install

# Backend
cd ../server && npm install
```

### 3. Start the Engines
**Terminal 1 (Backend)**:
```bash
cd server && node server.js
```

**Terminal 2 (Frontend)**:
```bash
cd client && npm run dev
```

Visit: `http://localhost:5173`

## 📁 Structure
- `/client`: React application & UI components.
- `/server`: Node.js server, Socket.io logic, and code execution engine.

---
**Happy Coding! 🎉**
