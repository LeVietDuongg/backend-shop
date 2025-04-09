// Socket.IO server for Railway deployment
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Map to store user socket connections
const userSockets = new Map();
// Map to store user statuses
const userStatuses = new Map();

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.userId = decoded.id;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.data.userId;
  console.log(`User connected: ${userId}`);

  // Add socket to user's connections
  if (!userSockets.has(userId)) {
    userSockets.set(userId, []);
  }
  userSockets.get(userId).push(socket.id);

  // Set user status to online
  userStatuses.set(userId, { userId, status: 'online' });

  // Notify friends that user is online
  socket.broadcast.emit('user_status_change', { userId, status: 'online' });

  // Handle private messages
  socket.on('private_message', async (message) => {
    console.log('Private message:', message);
    
    try {
      // Forward message to recipient if online
      const recipientSockets = userSockets.get(message.receiverId);
      if (recipientSockets && recipientSockets.length > 0) {
        io.to(recipientSockets).emit('private_message', {
          ...message,
          sender_id: userId,
          receiver_id: message.receiverId
        });
      }
      
      // Send confirmation back to sender
      socket.emit('message_sent', message);
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Handle typing status
  socket.on('typing', ({ receiverId, isTyping }) => {
    const status = isTyping ? 'typing' : 'online';
    userStatuses.set(userId, { 
      userId, 
      status, 
      conversationWith: isTyping ? receiverId : undefined 
    });
    
    // Notify the recipient about typing status
    const recipientSockets = userSockets.get(receiverId);
    if (recipientSockets && recipientSockets.length > 0) {
      io.to(recipientSockets).emit('user_typing', { 
        userId, 
        isTyping 
      });
    }
  });

  // Handle read receipts
  socket.on('message_read', ({ messageId, senderId }) => {
    // Notify sender that message was read
    const senderSockets = userSockets.get(senderId);
    if (senderSockets && senderSockets.length > 0) {
      io.to(senderSockets).emit('message_read', { messageId });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${userId}`);
    
    // Remove socket from user's connections
    const userSocketList = userSockets.get(userId);
    if (userSocketList) {
      const index = userSocketList.indexOf(socket.id);
      if (index !== -1) {
        userSocketList.splice(index, 1);
      }
      
      // If no more connections, set user as offline
      if (userSocketList.length === 0) {
        userSockets.delete(userId);
        userStatuses.delete(userId);
        
        // Notify friends that user is offline
        socket.broadcast.emit('user_status_change', { userId, status: 'offline' });
      }
    }
  });
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Socket.IO server is running');
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server listening on port ${PORT}`);
});
