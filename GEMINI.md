# Project Overview

This project is a MERN (MongoDB, Express.js, React, Node.js) stack application designed for inventory management. The frontend is a React application built with Vite, TypeScript, Tailwind CSS, and `shadcn-ui`. The backend is a Node.js Express application that interacts with a MongoDB database.

## Technologies Used

**Frontend:**
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Router DOM
- React Query

**Backend:**
- Node.js
- Express.js
- Mongoose (for MongoDB object modeling)
- Dotenv (for environment variables)
- CORS (for cross-origin resource sharing)

## Project Structure

- `client/`: Contains the frontend React application.
- `server/`: Contains the backend Node.js Express application.
  - `config/`: Database connection configuration.
  - `controllers/`: Business logic for API routes.
  - `models/`: Mongoose schemas and models.
  - `routes/`: API route definitions.
  - `server.js`: Main server entry point.
  - `.env`: Environment variables.
  - `package.json`: Node.js project configuration.

## Getting Started

### 1. Install Dependencies

**Important Note for Windows Users:**
During the setup, there was an issue with `npm install` and `npx` commands failing due to PowerShell's execution policy. If you encounter `PSSecurityException` errors, you will need to adjust your PowerShell execution policy.

To do this, open PowerShell as an Administrator and run:
`Set-ExecutionPolicy RemoteSigned`
You may be prompted to confirm; type `Y` and press Enter. After installing dependencies, you can revert this by running `Set-ExecutionPolicy Restricted`.

**Frontend Dependencies:**
Navigate to the `client` directory and install the dependencies:
```bash
cd client
npm install
```

**Backend Dependencies:**
Navigate to the `server` directory and install the dependencies:
```bash
cd ../server
npm install
```

### 2. Environment Variables

Create a `.env` file in the `server/` directory with the following content:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/inventorydb
```
*   `PORT`: The port on which the backend server will run.
*   `MONGO_URI`: Your MongoDB connection string. If you're running MongoDB locally, `mongodb://localhost:27017/inventorydb` is a common default.

### 3. Run MongoDB

Ensure you have a MongoDB instance running. If you don't have MongoDB installed, you can download it from the [official MongoDB website](https://www.mongodb.com/try/download/community).

### 4. Run the Backend

Navigate to the `server` directory and start the backend server:
```bash
cd server
npm start
```
The server should start on the port specified in your `.env` file (default: 5000).

### 5. Run the Frontend

Navigate to the `client` directory and start the frontend development server:
```bash
cd client
npm run dev
```
The frontend application should open in your browser (usually at `http://localhost:5173`).

## Development Conventions

### Frontend
- **Styling:** Uses Tailwind CSS for utility-first styling and `shadcn-ui` for pre-built, accessible UI components.
- **State Management:** React's `useState`, `useCallback`, `useMemo` for local component state, and `react-query` for server state management.
- **Routing:** `react-router-dom` for client-side routing.

### Backend
- **API Structure:** RESTful API design with clear routes for CRUD operations on inventory items.
- **Error Handling:** Basic try-catch blocks for asynchronous operations to handle errors and send appropriate HTTP responses.
- **Data Modeling:** Mongoose schemas define the structure and validation for MongoDB documents.

## API Endpoints

All backend API endpoints are prefixed with `/api/inventory`.

| Method | Endpoint             | Description                       |
| :----- | :------------------- | :-------------------------------- |
| `GET`  | `/api/inventory`     | Get all inventory items           |
| `GET`  | `/api/inventory/:id` | Get a single inventory item by ID |
| `POST` | `/api/inventory`     | Create a new inventory item       |
| `PUT`  | `/api/inventory/:id` | Update an existing inventory item |
| `DELETE` | `/api/inventory/:id` | Delete an inventory item          |
