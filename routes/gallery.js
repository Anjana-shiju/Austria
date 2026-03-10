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
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"), false);
    }
  },
});

// Upload helper
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "indian-austria/gallery",
        transformation: [
          { quality: "auto", fetch_format: "auto" }
        ]
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(buffer);
  });
};

// GET gallery photos
router.get("/", async (req, res) => {
  try {

    const photos = await Photo.find()
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "name")
      .populate("comments.user", "name");

    res.json({
      success: true,
      photos
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch photos"
    });
  }
});


// Upload photo
router.post("/", protect, upload.single("image"), async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Image required"
      });
    }

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

    res.status(201).json({
      success: true,
      photo: populated
    });

  } catch (err) {

    console.error("Upload error:", err);

    res.status(500).json({
      success: false,
      message: "Photo upload failed"
    });
  }

});

module.exports = router;