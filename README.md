# 🧑‍💻 CodeCollab – Collaborative Coding Platform

**CodeCollab** is a real-time collaborative coding platform built for developers, learners, interviewers, and teams to write, share, and edit code together with ease. The platform supports multiple programming languages, role-based access, live chat, and AI assistance — all inside a responsive and elegant UI.

---

## 📁 Project Structure

- **`client/`** – Frontend (React + Vite)
- **`server/`** – Backend (Node.js + Express)

---

## 🚀 Features

- ✍️ **Real-time collaborative code editing** with Monaco Editor  
- 🌐 **Multiple programming languages supported**: JavaScript, Python, C++, Java, TypeScript, C#, Go, PHP, Ruby, Rust, and more  
- 📂 **Project management**: Create, rename, delete, or edit projects  
- 👥 **Invite collaborators** via unique invite codes (for public projects)  
- 🔐 **Role-based access**: Admin, Editor, Viewer  
- 💾 **Download code** in the respective language file format  
- 🤖 **AI chatbot integration** using Gemini  
- 💬 **Live chat support** inside each project room  
- 📱 **Responsive UI** built with Tailwind CSS  

---

## 🛠️ Tech Stack

### Frontend (`client/`)

- React + Vite  
- Tailwind CSS  
- Monaco Editor  
- Axios  

### Backend (`server/`)

- Node.js + Express  
- MongoDB (Mongoose)  
- Socket.IO (WebSockets for real-time collaboration)  
- JWT Authentication  

---

## 💻 Setup, Installation & Running the App

> Follow these steps to run the entire app locally:

### 🔧 Prerequisites

- Node.js and npm installed  
- MongoDB (running locally or use MongoDB Atlas)

## 🧩 Installation & Execution

# 1. Clone the repository
git clone https://github.com/rohangarg-2006/Collaborative-Coding-Platform.git
cd Collaborative-Coding-Platform

# 2. Install client dependencies
cd client
npm install

# 3. Install server dependencies
cd ../server
npm install

# 4. Run backend (starts at http://localhost:5000)
npm run dev

# 5. Open a new terminal and start frontend (at http://localhost:5173)
cd ../client
npm run dev

## 🧪 Usage

- Create an account and log in
- Create a new project or join an existing one via invite code
- Invite collaborators to public projects
- Collaboratively edit code, chat, and manage project settings in real-time
- Download code in the correct language format anytime

