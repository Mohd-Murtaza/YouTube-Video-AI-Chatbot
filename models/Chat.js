import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    videoId: {
      type: String, // YouTube video ID (e.g., "jJh-YyokF74")
      required: true,
    },
    videoTitle: {
      type: String,
      default: 'YouTube Video',
    },
    videoThumbnail: {
      type: String,
      default: '',
    },
    messages: [messageSchema],
    messageCount: {
      type: Number,
      default: 0,
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for user + video
chatSchema.index({ userId: 1, videoId: 1 }, { unique: true });
chatSchema.index({ userId: 1, lastMessageAt: -1 });
chatSchema.index({ userId: 1, updatedAt: -1 });

// Update lastMessageAt and messageCount when new message is added
chatSchema.pre('save', function () {
  if (this.messages && this.messages.length > 0) {
    this.lastMessageAt = this.messages[this.messages.length - 1].timestamp;
    this.messageCount = this.messages.length;
  }
});

// Helper method to add a message
chatSchema.methods.addMessage = function(role, content) {
  this.messages.push({ role, content, timestamp: new Date() });
  this.messageCount = this.messages.length;
  this.lastMessageAt = new Date();
  return this.save();
};

export default mongoose.models.Chat || mongoose.model('Chat', chatSchema);
