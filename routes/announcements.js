const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { Announcement } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  },
});

// Upload to Cloudinary helper
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'indian-austria/announcements', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    stream.end(buffer);
  });
};

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

// POST /api/announcements - admin only (with optional image)
router.post('/', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({ success: false, message: 'Title and content required' });
    }

    let imageUrl = '';

    // Upload image if provided
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
    }

    const announcement = await Announcement.create({
      title,
      content,
      category: category || 'General',
      image: imageUrl,
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