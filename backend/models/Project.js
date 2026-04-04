const mongoose = require('mongoose');
const crypto = require('crypto');

// Function to generate invite code outside schema to avoid re-running on retrieval
const generateInviteCode = () => crypto.randomBytes(3).toString('hex').toUpperCase();

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Project name is required'],
    trim: true,
    maxlength: [100, 'Project name cannot exceed 100 characters']
  },
  inviteCode: {
    type: String,
    unique: true,
    immutable: true, // Prevent the invite code from being changed
    default: generateInviteCode
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  language: {
    type: String,
    required: [true, 'Programming language is required'],
    enum: ['javascript', 'python', 'cpp', 'java', 'typescript', 'csharp', 'go', 'php', 'ruby', 'rust']
  },
  code: {
    type: String,
    default: ''
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project must have an owner']
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  },
  codeHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    code: {
      type: String
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    version: {
      type: Number
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create unique room ID for socket.io based on project ID
ProjectSchema.virtual('roomId').get(function() {
  return `project_${this._id}`;
});

// Populate creator information when needed
ProjectSchema.methods.getCreatorInfo = async function() {
  await this.populate('owner', 'name email');
  return {
    name: this.owner.name,
    email: this.owner.email,
    role: 'admin' // Creator is always admin
  };
};

const Project = mongoose.model('Project', ProjectSchema);

module.exports = Project;
