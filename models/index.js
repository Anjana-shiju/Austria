const mongoose = require('mongoose');

// ─── Announcement ────────────────────────────────────
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ['General', 'Admission', 'Visa', 'Housing', 'Events'],
    default: 'General',
  },
  image: { type: String, default: '' },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

// ─── Enquiry ─────────────────────────────────────────
const enquirySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: ['Admission', 'Visa', 'Housing', 'Scholarships', 'Student Life', 'General'],
    default: 'General',
  },
  subject: { type: String, required: true, trim: true, maxlength: 200 },
  question: { type: String, required: true, maxlength: 2000 },
  status: { type: String, enum: ['Pending', 'Resolved'], default: 'Pending' },
  response: { type: String, default: '' },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt: { type: Date },
}, { timestamps: true });

// ─── Gallery Photo ────────────────────────────────────
const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, maxlength: 500 },
}, { timestamps: true });

const photoSchema = new mongoose.Schema({
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, maxlength: 500, default: '' },
  category: {
    type: String,
    enum: ['Campus', 'Events', 'City', 'Food', 'Travel', 'Other'],
    default: 'Campus',
  },
  imageUrl: { type: String, required: true },
  imagePublicId: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: [commentSchema],
}, { timestamps: true });

// ─── Chat Message ─────────────────────────────────────
const chatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxlength: 1000, trim: true },
  type: { type: String, enum: ['text', 'system'], default: 'text' },
}, { timestamps: true });

module.exports = {
  Announcement: mongoose.model('Announcement', announcementSchema),
  Enquiry: mongoose.model('Enquiry', enquirySchema),
  Photo: mongoose.model('Photo', photoSchema),
  ChatMessage: mongoose.model('ChatMessage', chatMessageSchema),
};
