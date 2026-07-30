# ChatSphere

ChatSphere is a modern, real-time web chat application built using the MERN stack (MongoDB, Express, React, Node.js) and Socket.io. It is designed to provide instantaneous, secure communication with a focus on a highly polished, responsive user interface.

## Core Features

- Real-Time Communication: Instant message delivery powered by WebSockets (Socket.io).
- Secure Authentication: User registration and login utilizing JSON Web Tokens (JWT) and bcrypt password hashing.
- Private and Public Hubs: Users can create public rooms or secure private rooms requiring specific 6-character invite codes.
- Live Typing Indicators: Real-time visual feedback when a user is typing a message in the room.
- Read Receipts: Visual indicators showing when a message has been read by other users in the room.
- System Notifications: Automated in-chat alerts when users join or leave a specific room.
- Premium UI/UX: A sleek, dark-mode focused interface built with Tailwind CSS, utilizing glassmorphism and subtle animations.

## Technology Stack

- Frontend: React.js, Vite, Tailwind CSS, Axios, React Router.
- Backend: Node.js, Express.js, Socket.io, JSON Web Tokens.
- Database: MongoDB Atlas, Mongoose ODM.
- Deployment: Vercel (Frontend) and Render (Backend).

## Local Development Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB Database (Local or Atlas Cluster)

### Backend Configuration
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Create a `.env` file in the backend directory with the following variables:
   - `PORT=5002`
   - `MONGO_URI=your_mongodb_connection_string`
   - `JWT_SECRET=your_secret_key`
   - `FRONTEND_URL=http://localhost:5174`
4. Start the server: `node server.js`

### Frontend Configuration
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file in the frontend directory with the following variables:
   - `VITE_API_URL=http://localhost:5002/api`
   - `VITE_SOCKET_URL=http://localhost:5002`
4. Start the development server: `npm run dev`

## Architecture Overview

The application utilizes a stateless REST API for authentication and room management, while relying on persistent WebSocket connections for real-time event broadcasting (messages, typing statuses, online presence). The frontend relies on custom React Contexts to manage global authentication and socket states seamlessly across the component tree.
