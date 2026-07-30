const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

const setupSocket = (io) => {
  // Store online users
  const onlineUsers = new Map();

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error: Token missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);
    
    // Add to online users
    onlineUsers.set(socket.user._id.toString(), socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));

    // Join Room
    // This is the core logic where a socket subscribes to a specific room ID
    // allowing us to broadcast messages only to users in that room.
    socket.on('joinRoom', (roomId) => {
      socket.join(roomId);
      console.log(`User ${socket.user.username} joined room ${roomId}`);
      socket.to(roomId).emit('systemMessage', {
        _id: 'sys_' + Date.now() + Math.random().toString(),
        content: `${socket.user.username} joined the room`,
        isSystem: true,
        createdAt: new Date().toISOString()
      });
    });

    // Leave Room
    socket.on('leaveRoom', (roomId) => {
      socket.leave(roomId);
      console.log(`User ${socket.user.username} left room ${roomId}`);
      socket.to(roomId).emit('systemMessage', {
        _id: 'sys_' + Date.now() + Math.random().toString(),
        content: `${socket.user.username} left the room`,
        isSystem: true,
        createdAt: new Date().toISOString()
      });
    });

    // Send Message
    socket.on('sendMessage', async (data) => {
      const { roomId, content } = data;
      
      try {
        // Save message to DB
        const message = await Message.create({
          roomId,
          senderId: socket.user._id,
          content,
          readBy: [socket.user._id]
        });

        // Populate sender details before broadcasting
        const populatedMessage = await Message.findById(message._id).populate('senderId', 'username avatar');
        
        // Broadcast to specific room (namespace filtering)
        io.to(roomId).emit('newMessage', populatedMessage);
      } catch (err) {
        console.error('Error saving message:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing Indicators
    socket.on('typing', ({ roomId }) => {
      socket.to(roomId).emit('userTyping', { userId: socket.user._id, username: socket.user.username, roomId });
    });

    socket.on('stopTyping', ({ roomId }) => {
      socket.to(roomId).emit('userStoppedTyping', { userId: socket.user._id, roomId });
    });

    // Read Receipts
    socket.on('messageRead', async ({ messageId, roomId }) => {
      try {
        const message = await Message.findById(messageId);
        if (message && !message.readBy.includes(socket.user._id)) {
          message.readBy.push(socket.user._id);
          await message.save();
          // Notify room that message was read
          io.to(roomId).emit('messageReadUpdate', { messageId, userId: socket.user._id });
        }
      } catch (err) {
        console.error('Error updating read receipt:', err);
      }
    });

    // Disconnect handling
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);
      onlineUsers.delete(socket.user._id.toString());
      io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = setupSocket;
