const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Enquiry } = require('../models/index');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/admin/stats
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalEnquiries, pendingEnquiries, resolvedEnquiries] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Enquiry.countDocuments(),
      Enquiry.countDocuments({ status: 'Pending' }),
      Enquiry.countDocuments({ status: 'Resolved' }),
    ]);

    res.json({ success: true, totalUsers, totalEnquiries, pendingEnquiries, resolvedEnquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/users
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(400).json({ success: false, message: 'Cannot delete admin' });

    await user.deleteOne();
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
