# Nexus Open Banking Control Center

Nexus is a state-of-the-art fintech application designed to deliver an "Operating System" like experience for managing personal finances. It features a sophisticated, highly-animated user interface inspired by premium, Awwwards-tier web design, offering fluid interactions, physics-based animations, and real-time data connectivity.

## Overview

The application is split into two main components:
- **Frontend:** A high-performance React application powered by Vite, leveraging Framer Motion and GSAP for complex animations and page transitions.
- **Backend:** A robust Node.js/Express server that interfaces with MongoDB, handles secure user authentication, and integrates with the Plaid API for real-time banking data.

## Features
- **Premium User Interface:** Uses advanced CSS techniques, framer-motion, and GSAP for staggered entrances, 3D tilt micro-interactions, and visual textures to create a high-tech operating system aesthetic.
- **Real-Time Data:** Integrates with Socket.io for live updates.
- **Financial Integrations:** Connects directly to bank accounts via the Plaid API (`react-plaid-link`).
- **Data Visualization:** Employs Recharts to display interactive, beautiful financial charts.
- **Secure Authentication:** Implements JWT-based authentication and secure password hashing using bcrypt.

## Tech Stack

**Frontend:**
- React 19 (via Vite)
- Framer Motion & GSAP (Animations)
- React Router DOM
- Recharts
- Axios & Socket.io-client
- React Plaid Link

**Backend:**
- Node.js & Express
- Mongoose (MongoDB)
- Plaid Node SDK
- Socket.io
- JSON Web Tokens (JWT) & bcryptjs
- Helmet & Express Rate Limit (Security)

## Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or Atlas)
- Plaid Developer Account for API keys

### Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-github-repo-url>
   cd nexus
   ```

2. **Install Backend Dependencies & Configure:**
   ```bash
   cd backend
   npm install
   ```
   *Create a `.env` file in the `backend` directory with your MongoDB URI, JWT Secret, and Plaid API keys.*
   
   Start the backend server:
   ```bash
   npm run dev
   ```

3. **Install Frontend Dependencies & Configure:**
   Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   npm install
   ```
   *Create a `.env` file in the `frontend` directory based on your environment configurations (if required).*

   Start the frontend development server:
   ```bash
   npm run dev
   ```

## Local Development
- The backend typically runs on `http://localhost:5000` (or as configured in your server).
- The frontend Vite server runs on `http://localhost:5173` (or as provided by the terminal output).

## License
[MIT License](LICENSE)
