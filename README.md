# 🧑‍💻 CodeCollab – Collaborative Coding Platform

**CodeCollab** is a real-time collaborative coding platform built for developers, learners, interviewers, and teams to write, share, and edit code together with ease. The platform supports multiple programming languages, role-based access, live chat, and AI assistance — all inside a responsive and elegant UI.

---

## 📁 Project Structure

- **`client/`** – Frontend (React + Vite)
- **`server/`** – Backend (Node.js + Express)

---

## 🚀 Features

✨ CodeCollab offers a powerful set of features for real-time collaboration and productivity:
- 🔐 **Sign up and Log in** securely using JWT-based authentication  
- 🧠 **AI Assistant (Gemini)** to help with code-related queries in real time  
- 👨‍💻 **Collaborative Code Editing** using the Monaco Editor with live syncing  
- 🌐 **Multiple Language Support** – Write code in JavaScript, Python, C++, Java, TypeScript, C#, Go, PHP, Ruby, Rust, and more  
- 🗂️ **Project Management** – Create, rename, edit, and delete projects with ease  
- 👥 **Invite Collaborators** to join public projects via unique invite codes  
- 🛡️ **Role-Based Access** – Assign users as Admins, Editors, or Viewers to control permissions  
- 💬 **Live Chat** – Communicate instantly with your team inside the code editor  
- 📥 **Download Code** anytime in the correct file format for the selected language  
- 📱 **Fully Responsive UI** designed with Tailwind CSS for seamless use on all devices

🧪 Whether you're preparing for interviews, doing pair programming, mentoring juniors, or building together — CodeCollab makes it fast, easy, and fun.

---

## 🧪 Usage

- Create an account and log in
- Create a new project or join an existing one via invite code
- Invite collaborators to public projects
- Collaboratively edit code, chat, and manage project settings in real-time
- Download code in the correct language format anytime
  
---

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Monaco Editor
- **Backend**: Node.js, Express, MongoDB, Socket.IO
- **Authentication**: JWT
- **Real-time**: WebSockets (Socket.IO)

---

## 💻 Setup, Installation & Running the App

### 1. Clone the repository

```sh
git clone https://github.com/yourusername/codecollab.git
cd codecollab
```

### 2. Setup the Server

```sh
cd server
npm install
# Copy .env.example to .env and set your environment variables
npm start
```

- The server runs on `http://localhost:5000` by default.

### 3. Setup the Client

```sh
cd ../client
npm install
# Copy .env.example to .env and set VITE_API_URL if needed
npm run dev
```

- The client runs on `http://localhost:5173` by default.
  
---

### 🔧 Prerequisites

- Node.js and npm installed  
- MongoDB (running locally or use MongoDB Atlas)



