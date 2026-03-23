const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configure Multer Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `avatar-${req.user.id}-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
  }
});

router.put('/update-profile', authMiddleware, profileController.updateProfile);
router.put('/update-password', authMiddleware, profileController.updatePassword);
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), profileController.uploadAvatar);
router.delete('/delete-account', authMiddleware, profileController.deleteAccount);

module.exports = router;