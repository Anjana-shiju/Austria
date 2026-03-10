const express = require('express');
const router = express.Router();
const { Enquiry } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');
const { sendEnquiryResponseEmail } = require('../utils/email');

// POST /api/enquiries - submit new
router.post('/', protect, async (req, res) => {
  try {
    const { category, subject, question } = req.body;
    if (!subject || !question) {
      return res.status(400).json({ success: false, message: 'Subject and question required' });
    }

    const enquiry = await Enquiry.create({
      user: req.user._id,
      category, subject, question,
    });

    const populated = await enquiry.populate('user', 'name email university');
    res.status(201).json({ success: true, enquiry: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/enquiries/mine - user's own
router.get('/mine', protect, async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/enquiries - admin: all
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const enquiries = await Enquiry.find(filter)
      .sort({ createdAt: -1 })
      .populate('user', 'name email university');

    res.json({ success: true, enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/enquiries/:id/respond - admin responds
router.put('/:id/respond', protect, adminOnly, async (req, res) => {
  try {
    const { response } = req.body;
    if (!response?.trim()) {
      return res.status(400).json({ success: false, message: 'Response text required' });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      {
        response: response.trim(),
        status: 'Resolved',
        respondedBy: req.user._id,
        respondedAt: new Date(),
      },
      { new: true }
    ).populate('user', 'name email');

    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

    // Email notification to student
    sendEnquiryResponseEmail(
      enquiry.user.email,
      enquiry.user.name,
      enquiry.subject,
      response
    ).catch(console.error);

    res.json({ success: true, enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
