const express = require('express');
const router = express.Router();
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { Photo } = require('../models/index');
const { protect } = require('../middleware/auth');

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"), false);
  },
});

// Upload helper
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "indian-austria/gallery", transformation: [{ quality: "auto", fetch_format: "auto" }] },
      (error, result) => { if (error) reject(error); else resolve(result); }
    );
    stream.end(buffer);
  });
};

// GET /api/gallery
router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find()
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name")
      .populate("comments.user", "name");
    res.json({ success: true, photos });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to fetch photos" });
  }
});

// POST /api/gallery - upload
router.post("/", protect, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "Image required" });

    const result = await uploadToCloudinary(req.file.buffer);
    const photo = await Photo.create({
      uploadedBy: req.user._id,
      title: req.body.title || "",
      description: req.body.description || "",
      category: req.body.category || "Campus",
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });

    const populated = await photo.populate("uploadedBy", "name");
    res.status(201).json({ success: true, photo: populated });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, message: "Photo upload failed" });
  }
});

// POST /api/gallery/:id/like - toggle like
router.post("/:id/like", protect, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: "Photo not found" });

    const userId = req.user._id.toString();
    const alreadyLiked = photo.likes.map(id => id.toString()).includes(userId);

    if (alreadyLiked) {
      photo.likes = photo.likes.filter(id => id.toString() !== userId);
    } else {
      photo.likes.push(req.user._id);
    }

    await photo.save();
    res.json({ success: true, likes: photo.likes });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not like photo" });
  }
});

// POST /api/gallery/:id/comments - add comment
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: "Comment text required" });

    const photo = await Photo.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { user: req.user._id, text: text.trim() } } },
      { new: true }
    ).populate("comments.user", "name");

    if (!photo) return res.status(404).json({ success: false, message: "Photo not found" });

    res.json({ success: true, comments: photo.comments });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not add comment" });
  }
});

// DELETE /api/gallery/:id
router.delete("/:id", protect, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ success: false, message: "Photo not found" });

    const isOwner = photo.uploadedBy.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this photo" });
    }

    // Delete from Cloudinary
    if (photo.imagePublicId) {
      await cloudinary.uploader.destroy(photo.imagePublicId).catch(console.error);
    }

    await photo.deleteOne();
    res.json({ success: true, message: "Photo deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete photo" });
  }
});

module.exports = router;