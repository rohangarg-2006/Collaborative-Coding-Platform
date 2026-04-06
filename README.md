# 🧑‍💻 CodeCollab - Collaborative Coding Platform

CodeCollab is a real-time collaborative coding platform where developers, learners, interviewers, and teams can write, edit, and discuss code together.

It supports live editing, role-based collaboration, chat, and AI-assisted help in a responsive web interface.

## 🌐 Live Demo

- Deployed App: https://collaborative-coding-platform-li35.onrender.com/

## 🚀 Highlights

- 👨‍💻 Real-time collaborative code editing
- 🛡️ Role-based access (Admin, Editor, Viewer)
- 🗂️ Project management (create, rename, edit, delete)
- 👥 Invite collaborators using project invite codes
- 🌐 Multi-language editor support (JavaScript, Python, C++, Java, TypeScript, C#, Go, PHP, Ruby, Rust, and more)
- 🧠 AI assistant (Gemini) for coding help
- 📥 Download code in language-appropriate file formats
- 📱 Responsive UI for desktop and mobile

## 🧰 Tech Stack

- Frontend: React, Vite, Tailwind CSS, Monaco Editor
- Backend: Node.js, Express, MongoDB, Socket.IO
- Authentication: JWT
- Real-time: WebSockets (Socket.IO)

## 📁 Project Structure

```text
.
|-- frontend/   # React + Vite client
`-- backend/    # Node.js + Express API and realtime services
```

## 🔧 Prerequisites

- Node.js (LTS recommended)
- npm
- MongoDB (local instance or MongoDB Atlas)

## 💻 Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/codecollab.git
cd codecollab
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure backend environment

Create a .env file in the backend folder and add required variables (for example, database connection, JWT secret, and port).

### 4. Start backend server

```bash
npm start
```

Backend default URL: http://localhost:5000

### 5. Install frontend dependencies

Open a new terminal:

```bash
cd frontend
npm install
```

### 6. Configure frontend environment

Create a .env file in the frontend folder and set API base URL if needed (for example, VITE_API_URL).

### 7. Start frontend app

```bash
npm run dev
```

Frontend default URL: http://localhost:5173

## 🧪 Typical Use Cases

- 🤝 Pair programming and team collaboration
- 🎯 Interview practice and live coding rounds
- 🎓 Mentoring and classroom coding sessions
- ⚡ Rapid prototyping with shared editing

## 📝 Notes

- Keep backend and frontend running in separate terminals during local development.
- Ensure CORS and environment variables are configured correctly for local and deployed environments.



