const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Session must be associated with a project']
  },
  activeUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    socketId: {
      type: String
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    cursorPosition: {
      line: Number,
      column: Number
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  chatMessages: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

const Session = mongoose.model('Session', SessionSchema);

module.exports = Session;
