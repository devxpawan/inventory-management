# Inventory Management System

## Features

- User authentication and role-based access control
- Inventory tracking and management
- Direct transfers and returns between branches
- Audit logs for tracking changes and actions
- Category and item management
- Dashboard with statistics and analytics
- Responsive UI built with React, TypeScript, and Tailwind CSS
- RESTful API backend using Node.js and Express
- MongoDB for data storage

## Tech Stack

### Frontend (client)

- React
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI components

### Backend (server)

- Node.js
- Express.js
- MongoDB (with Mongoose)
- JWT authentication

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- MongoDB instance (local or cloud)

### Installation

1. **Clone the repository:**
   ```sh
   git clone <YOUR_GIT_URL>
   cd inventory-management
   ```
2. **Install dependencies:**
   - For the client:
     ```sh
     cd client
     npm install
     ```
   - For the server:
     ```sh
     cd ../server
     npm install
     ```
3. **Configure environment variables:**

   - Set up your MongoDB URI and JWT secret in the server's config.

4. **Run the development servers:**
   - Start the backend:
     ```sh
     npm run dev
     ```
   - Start the frontend (in a new terminal):
     ```sh
     cd ../client
     npm run dev
     ```

## Folder Structure

- `client/` - Frontend React application
- `server/` - Backend Express API

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License.
