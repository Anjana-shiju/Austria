const express = require('express');
const router = express.Router();
const { ChatMessage } = require('../models/index');
const { protect } = require('../middleware/auth');

// GET /api/chat/history - last 100 messages
router.get('/history', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ type: 'text' })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('sender', 'name university')
      .lean();

    res.json({ success: true, messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
