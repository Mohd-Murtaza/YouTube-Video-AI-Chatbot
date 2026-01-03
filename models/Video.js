import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    videoId: {
      type: String,
      required: [true, 'Video ID is required'],
      trim: true,
    },
    videoUrl: {
      type: String,
      required: [true, 'Video URL is required'],
    },
    title: {
      type: String,
      required: [true, 'Video title is required'],
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
    channelName: {
      type: String,
      default: '',
    },
    transcript: {
      type: String,
      default: '',
    },
    processed: {
      type: Boolean,
      default: false,
    },
    vectorNamespace: {
      type: String,
      default: null, // Pinecone namespace for this video's embeddings
    },
    processingError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
videoSchema.index({ userId: 1, videoId: 1 });
videoSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Video || mongoose.model('Video', videoSchema);
