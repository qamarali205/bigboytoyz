const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: false },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String, required: false },
}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
