const express = require('express');
const router = express.Router();
const { Announcement } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/announcements - public
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== 'All') filter.category = req.query.category;

    const announcements = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .populate('postedBy', 'name');

    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/announcements - admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { title, content, category, image } = req.body;
    const announcement = await Announcement.create({
      title, content, category, image,
      postedBy: req.user._id,
    });
    res.status(201).json({ success: true, announcement });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/announcements/:id - admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
