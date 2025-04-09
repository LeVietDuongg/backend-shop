import { Server } from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import jwt from 'jsonwebtoken';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Define types for socket events
interface UserStatus {
  userId: number;
  status: 'online' | 'offline' | 'typing';
  conversationWith?: number;
}

interface Message {
  id?: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: string;
}

// Map to store user socket connections
const userSockets = new Map<number, string[]>();
// Map to store user statuses
const userStatuses = new Map<number, UserStatus>();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Socket.IO authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
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
    userSockets.get(userId)!.push(socket.id);

    // Set user status to online
    userStatuses.set(userId, { userId, status: 'online' });

    // Notify friends that user is online
    socket.broadcast.emit('user_status_change', { userId, status: 'online' });

    // Handle private messages
    socket.on('private_message', async (message: Message) => {
      // Save message to database via API
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${socket.handshake.auth.token}`
          },
          body: JSON.stringify({
            receiverId: message.receiverId,
            content: message.content
          })
        });

        const data = await response.json();
        
        if (response.ok) {
          // Forward message to recipient if online
          const recipientSockets = userSockets.get(message.receiverId);
          if (recipientSockets && recipientSockets.length > 0) {
            io.to(recipientSockets).emit('private_message', {
              ...data.message,
              sender_id: userId,
              receiver_id: message.receiverId
            });
          }
          
          // Send confirmation back to sender
          socket.emit('message_sent', data.message);
        } else {
          socket.emit('message_error', { error: data.error });
        }
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('message_error', { error: 'Failed to send message' });
      }
    });

    // Handle typing status
    socket.on('typing', ({ receiverId, isTyping }: { receiverId: number, isTyping: boolean }) => {
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
    socket.on('message_read', ({ messageId, senderId }: { messageId: number, senderId: number }) => {
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

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`> Server listening on port ${PORT}`);
  });
});
