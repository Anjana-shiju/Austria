const express = require('express');
const router = express.Router();
const { ChatMessage } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /api/chat/history
router.get('/history', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'name university')
      .lean();
    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/chat/voice - upload voice message
router.post('/voice', protect, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No audio file' });

    const b64 = Buffer.from(req.file.buffer).toString('base64');
    const dataURI = `data:${req.file.mimetype};base64,${b64}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      resource_type: 'video', // Cloudinary uses 'video' for audio
      folder: 'indiaustria/voice',
      format: 'webm'
    });

    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/chat/:id - admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const msg = await ChatMessage.findById(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    await msg.deleteOne();
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;