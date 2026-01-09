import mongoose from 'mongoose';

const TranscriptSegmentSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  offset: {
    type: Number, // milliseconds
    required: true,
  },
  duration: {
    type: Number, // milliseconds
    required: true,
  },
  timestamp: {
    type: String, // formatted "HH:MM:SS"
    required: true,
  },
}, { _id: false });

const TranscriptSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true, // This creates the index automatically
  },
  videoTitle: {
    type: String,
    required: true,
  },
  channelTitle: {
    type: String,
    default: 'Unknown',
  },
  description: {
    type: String,
    default: '',
  },
  thumbnail: {
    type: String,
    default: '',
  },
  duration: {
    type: String,
    default: '',
  },
  viewCount: {
    type: String,
    default: '0',
  },
  publishedAt: {
    type: Date,
  },
  transcript: {
    type: String,
    required: true,
  },
  segments: [TranscriptSegmentSchema],
  language: {
    type: String,
    default: 'en',
  },
  source: {
    type: String,
    default: 'youtubetranscripts.app',
  },
  // RAG metadata
  isChunked: {
    type: Boolean,
    default: false,
  },
  isPineconeIndexed: {
    type: Boolean,
    default: false,
  },
  chunkCount: {
    type: Number,
    default: 0,
  },
  embeddingModel: {
    type: String,
    default: '',
  },
  // Analytics
  accessCount: {
    type: Number,
    default: 0,
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for optimized queries
// Note: videoId index is created automatically by unique: true
TranscriptSchema.index({ lastAccessedAt: -1 });
TranscriptSchema.index({ isPineconeIndexed: 1 });

// Update lastAccessedAt and increment accessCount on each query
TranscriptSchema.methods.recordAccess = function() {
  this.lastAccessedAt = new Date();
  this.accessCount += 1;
  return this.save();
};

// Format segments with timestamps
TranscriptSchema.methods.getFormattedSegments = function() {
  return this.segments.map(seg => ({
    text: seg.text,
    timestamp: seg.timestamp,
    offsetSeconds: seg.offset / 1000,
  }));
};

// Get transcript with time context for LLM
TranscriptSchema.methods.getTranscriptWithTimestamps = function() {
  return this.segments.map(seg => 
    `[${seg.timestamp}] ${seg.text}`
  ).join('\n');
};

export default mongoose.models.Transcript || mongoose.model('Transcript', TranscriptSchema);
