# MERN Real-Time Chat App

A full-stack real-time chat application built using the MERN stack (MongoDB, Express, React, Node.js) and Socket.io.

## Features

- Real-time messaging using Socket.io
- User authentication and authorization (JWT)
- Online user status tracking
- Responsive modern UI built with Tailwind CSS v4
- Global state management with Zustand

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Zustand, React Router
- **Backend**: Node.js, Express, MongoDB, Mongoose, Socket.io
- **Authentication**: JWT (JSON Web Tokens) with HTTP-only cookies

## Getting Started

1. Clone the repository
2. Install dependencies for both frontend and backend:
   ```bash
   npm run build
   ```
3. Create a `.env` file in the `backend` directory with your `MONGODB_URI` and `JWT_SECRET`.
4. Run the development servers:
   ```bash
   npm run dev:all
   ```
