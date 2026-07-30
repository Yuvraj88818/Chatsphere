const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Room = require('../models/Room');
const Message = require('../models/Message');

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, isPrivate } = req.body;
  try {
    const inviteCode = isPrivate ? Math.random().toString(36).substring(2, 8).toUpperCase() : null;
    
    const room = await Room.create({
      name,
      isPrivate: isPrivate || false,
      inviteCode,
      createdBy: req.user._id,
      members: [req.user._id]
    });
    
    res.status(201).json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating room' });
  }
});

// @route   GET /api/rooms
// @desc    Get all public rooms and rooms the user is a member of
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { isPrivate: false },
        { members: req.user._id }
      ]
    }).populate('createdBy', 'username').sort('-createdAt');
    
    res.json(rooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching rooms' });
  }
});

// @route   POST /api/rooms/join
// @desc    Join a room via invite code
// @access  Private
router.post('/join', protect, async (req, res) => {
  const { inviteCode } = req.body;
  
  if (!inviteCode) {
    return res.status(400).json({ message: 'Invite code is required' });
  }
  
  try {
    const room = await Room.findOne({ inviteCode });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found or invalid invite code' });
    }
    
    if (!room.members.includes(req.user._id)) {
      room.members.push(req.user._id);
      await room.save();
    }
    
    res.json(room);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error joining room' });
  }
});

// @route   GET /api/rooms/:id/messages
// @desc    Get messages for a specific room
// @access  Private
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    // Check if user is a member of private room
    if (room.isPrivate && !room.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view messages in this room' });
    }
    
    const messages = await Message.find({ roomId: req.params.id })
      .populate('senderId', 'username avatar')
      .sort('createdAt');
      
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
});

module.exports = router;
