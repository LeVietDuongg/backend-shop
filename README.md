# Backend Shop Socket.IO Server

This project implements a Socket.IO server using Node.js and Express. It allows real-time communication between users, supporting features such as private messaging, typing status, and read receipts.

## Project Structure

- `src/socket-server.js`: Contains the Socket.IO server implementation.
- `.env`: Stores environment variables like `JWT_SECRET` and `PORT`.
- `package.json`: Configuration file for npm, listing dependencies and scripts.
- `package-lock.json`: Locks the versions of installed dependencies.
- `README.md`: Documentation for the project.

## Setup Instructions

1. **Clone the repository**:
   ```
   git clone <repository-url>
   cd backend-shop
   ```

2. **Install dependencies**:
   ```
   npm install
   ```

3. **Create a `.env` file**:
   Copy the `.env.example` to `.env` and set your environment variables:
   ```
   JWT_SECRET=your-secret-key
   PORT=3001
   ```

4. **Run the server**:
   ```
   npm start
   ```

## Usage

Once the server is running, you can connect to it using a Socket.IO client. Make sure to include the JWT token in the connection request for authentication.

## Deployment on Railway

To deploy this project on Railway, create a `railway.json` file to define your deployment configuration, including environment variables and build settings. 

## Features

- User authentication using JWT
- Real-time private messaging
- Typing status notifications
- Read receipts for messages
- User online/offline status management

## License

This project is licensed under the MIT License.