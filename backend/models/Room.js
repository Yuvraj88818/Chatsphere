const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  isPrivate: { type: Boolean, default: false },
  inviteCode: { type: String, unique: true, sparse: true }, // Sparse allows multiple nulls if not private
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
